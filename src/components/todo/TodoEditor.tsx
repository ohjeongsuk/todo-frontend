"use client";

import Image from "@tiptap/extension-image";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, ImagePlus, Italic, Link2, List, ListOrdered, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { useUploadAttachment } from "@/hooks/useAttachments";
import { extractAttachmentIds, getViewUrls, validateImageFile } from "@/lib/attachments";
import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

interface TodoEditorProps {
  /** 서버에서 온 본문 HTML. 최초 1회만 주입한다. */
  initialHtml: string;
  onChange: (html: string) => void;
  /** 정규화를 거친 초기 HTML을 부모에게 올려보낸다. dirty 판정의 기준값이 된다. */
  onReady: (normalizedHtml: string) => void;
}

/**
 * `attachmentId`를 갖는 이미지 노드.
 *
 * `...this.parent?.()`를 빠뜨리면 `src`·`alt` 등 원래 속성이 통째로 사라진다.
 *
 * 저장 HTML에는 `data-attachment-id`만 남는다. 서버 Jsoup Safelist가 `src`를 허용하지 않기
 * 때문이며(PRD F-49), 조회 URL이 30분 만료라 본문에 박아두면 며칠 뒤 전부 깨지기 때문이다.
 * `src`는 렌더 시점에 주입한다.
 */
const AttachmentImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      attachmentId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-attachment-id"),
        renderHTML: (attributes) => {
          const id = attributes.attachmentId as string | null;
          return id ? { "data-attachment-id": id } : {};
        },
      },
    };
  },
  // 기본 parseHTML은 `img[src]`만 매칭한다. 서버가 저장한 HTML은 src가 없으므로
  // (PRD F-49) 이 규칙만으로는 setContent 시점에 img 태그가 통째로 무시된다.
  // data-attachment-id가 있는 img도 매칭 대상에 추가한다.
  parseHTML() {
    return [{ tag: "img[src]" }, { tag: "img[data-attachment-id]" }];
  },
});

/**
 * 본문 리치 텍스트 에디터.
 *
 * StarterKit을 기본값으로 쓰지 않는다. StarterKit이 포함하는 마크·노드 중 서버 Jsoup
 * Safelist(p strong em ul ol li br a img)에 없는 것은 저장 시 제거된다. 켜둔 채 두면 사용자가
 * 서식을 넣어도 에러 없이 조용히 사라져 원인을 찾기 어렵다.
 */
function buildExtensions() {
  return [
    StarterKit.configure({
      strike: false, // <s> 제거됨
      underline: false, // <u> 제거됨 (v3에서 StarterKit에 새로 포함됐다)
      horizontalRule: false, // <hr> 제거됨
      heading: false, // <h1>~<h6> 제거됨
      blockquote: false, // <blockquote> 제거됨
      code: false, // 인라인 <code> 제거됨
      codeBlock: false, // <pre><code> 제거됨
      link: {
        // 편집기 안에서 링크를 누르면 편집이 아니라 이동이 되어버린다.
        openOnClick: false,
        // 서버가 addEnforcedAttribute로 rel을 주입하지만, 저장 전 편집 중 상태에는
        // 서버를 거치지 않은 링크가 존재한다. 클라이언트에서도 같은 값을 붙인다.
        HTMLAttributes: { rel: "nofollow noopener noreferrer" },
      },
    }),
    AttachmentImage.configure({
      // 붙여넣기·드래그앤드롭으로 들어온 이미지를 base64로 인라인하지 않는다.
      // 본문이 통째로 부풀어 @Size(max=50000) 제약을 넘고, 어차피 서버가 src를 지운다.
      allowBase64: false,
      HTMLAttributes: { class: "tiptap-image" },
    }),
  ];
}

function ToolbarButton({
  onClick,
  active,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      // form 안에 있으므로 type을 지정하지 않으면 submit이 되어 폼이 제출된다.
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      className={cn(
        "flex size-11 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  onPickImage,
  uploading,
}: {
  editor: Editor;
  onPickImage: () => void;
  uploading: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-0.5 border-b border-border p-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        label="굵게"
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        label="기울임"
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        label="글머리 목록"
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        label="번호 목록"
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          const href = window.prompt("링크 주소를 입력하세요 (http/https/mailto)");
          if (!href) return;
          editor.chain().focus().setLink({ href }).run();
        }}
        active={editor.isActive("link")}
        label="링크"
      >
        <Link2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={onPickImage}
        active={false}
        disabled={uploading}
        label={uploading ? "이미지 업로드 중" : "이미지 첨부"}
      >
        {/* fetch는 업로드 진행률을 제공하지 않는다. 5MB 상한이라 체감이 짧아 불확정 스피너로 간다. */}
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
      </ToolbarButton>
    </div>
  );
}

export function TodoEditor({ initialHtml, onChange, onReady }: TodoEditorProps) {
  // 최초 주입 여부. value가 바뀔 때마다 setContent하면 입력 중 커서가 튄다.
  const injectedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 해제하지 않으면 blob이 메모리에 남는다. 언마운트 시 일괄 정리한다.
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useUploadAttachment();

  const editor = useEditor({
    // Next.js는 기본이 SSR이라 이 옵션 없이는 하이드레이션 불일치 에러가 난다.
    immediatelyRender: false,
    extensions: buildExtensions(),
    editorProps: {
      attributes: {
        class: "min-h-48 px-3 py-2 focus-visible:outline-none",
        "aria-label": "본문",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const revokeObjectUrl = useCallback((url: string) => {
    if (objectUrlsRef.current.delete(url)) {
      URL.revokeObjectURL(url);
    }
  }, []);

  /**
   * 파일 하나를 업로드하고 임시 미리보기를 실제 이미지로 교체한다.
   *
   * 임시 blob URL로 먼저 노드를 넣는 이유는 업로드가 끝날 때까지 아무것도 안 보이면
   * 사용자가 실패한 줄 알기 때문이다.
   */
  const handleFile = useCallback(
    async (file: File) => {
      if (!editor) return;

      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.message ?? "첨부할 수 없는 파일입니다.");
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(previewUrl);
      editor.chain().focus().setImage({ src: previewUrl, alt: file.name }).run();

      setUploading(true);
      try {
        const { attachmentId, viewUrl } = await uploadMutation.mutateAsync(file);

        // 임시 노드를 찾아 실제 값으로 교체한다. 위치를 저장해두면 그 사이 사용자가
        // 다른 곳을 편집했을 때 어긋나므로, 문서를 훑어 src로 찾는다.
        const { state, view } = editor;
        state.doc.descendants((node, pos) => {
          if (node.type.name === "image" && node.attrs.src === previewUrl) {
            view.dispatch(
              state.tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                src: viewUrl,
                attachmentId: String(attachmentId),
              }),
            );
            return false;
          }
          return true;
        });
      } catch (error) {
        // 실패한 임시 노드를 남기면 저장 시 서버가 지워 사용자가 영문을 모른다.
        const { state, view } = editor;
        state.doc.descendants((node, pos) => {
          if (node.type.name === "image" && node.attrs.src === previewUrl) {
            view.dispatch(state.tr.delete(pos, pos + node.nodeSize));
            return false;
          }
          return true;
        });
        const message = error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.";
        toast.error(message);
      } finally {
        revokeObjectUrl(previewUrl);
        setUploading(false);
      }
    },
    [editor, revokeObjectUrl, uploadMutation],
  );

  // 툴바 버튼 경로
  const handlePickImage = useCallback(() => fileInputRef.current?.click(), []);

  // 붙여넣기·드래그앤드롭 경로. 세 경로를 모두 지원한다 (PRD F-46).
  useEffect(() => {
    if (!editor) return;

    const dom = editor.view.dom;

    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);
      const images = files.filter((file) => file.type.startsWith("image/"));
      if (images.length === 0) return;
      event.preventDefault();
      images.forEach((file) => void handleFile(file));
    };

    const onDrop = (event: DragEvent) => {
      const files = Array.from(event.dataTransfer?.files ?? []);
      const images = files.filter((file) => file.type.startsWith("image/"));
      if (images.length === 0) return;
      event.preventDefault();
      images.forEach((file) => void handleFile(file));
    };

    dom.addEventListener("paste", onPaste);
    dom.addEventListener("drop", onDrop);
    return () => {
      dom.removeEventListener("paste", onPaste);
      dom.removeEventListener("drop", onDrop);
    };
  }, [editor, handleFile]);

  useEffect(() => {
    if (!editor || injectedRef.current) return;
    injectedRef.current = true;

    // 이 앱에는 dangerouslySetInnerHTML이 없다. setContent가 유일한 렌더 진입점이므로
    // 여기가 클라이언트 측 유일한 방어 지점이다 (CLAUDE.md 절대 규칙 8의 후반부).
    const safe = sanitizeHtml(initialHtml);

    // emitUpdate: false가 없으면 이 호출만으로 onUpdate가 발화해 폼이 즉시 dirty가 된다.
    editor.commands.setContent(safe, { emitUpdate: false });

    // Tiptap이 정규화하고 TrailingNode가 끝에 빈 문단을 붙인 뒤의 값이다.
    // 서버 원본과 비교하면 아무것도 안 고쳐도 dirty가 되므로 이 값을 기준으로 삼는다.
    onReady(editor.getHTML());

    // 저장된 HTML에는 src가 없다 (PRD F-49). 조회 URL을 일괄로 받아 주입한다.
    const ids = extractAttachmentIds(safe);
    if (ids.length === 0) return;

    void getViewUrls(ids)
      .then((urls) => {
        const { state, view } = editor;
        const tr = state.tr;
        let changed = false;
        state.doc.descendants((node, pos) => {
          if (node.type.name !== "image") return true;
          const id = node.attrs.attachmentId as string | null;
          const url = id ? urls[id] : undefined;
          if (url) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: url });
            changed = true;
          }
          return true;
        });
        if (changed) {
          // addToHistory(false): URL 주입은 사용자의 편집이 아니므로 실행취소 대상이 아니다.
          view.dispatch(tr.setMeta("addToHistory", false));

          // 이 dispatch는 onUpdate를 발화시켜 onChange(contentHtml)를 갱신하지만
          // baselineHtml은 위 onReady(323번 줄) 호출 시점(주입 전 HTML) 그대로 남는다.
          // 그대로 두면 사용자가 아무것도 편집하지 않았는데도 contentHtml !== baselineHtml이 되어
          // 폼이 즉시 dirty로 보이고, 페이지를 떠나려 할 때 "저장하지 않은 변경사항" 경고까지 뜬다.
          // URL 주입은 사용자 편집이 아니므로 baseline도 이 시점 값으로 다시 맞춘다.
          onReady(editor.getHTML());
        }
      })
      .catch(() => {
        toast.error("일부 이미지를 불러오지 못했습니다.");
      });
  }, [editor, initialHtml, onReady]);

  // 언마운트 시 남은 blob URL을 모두 해제한다.
  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  if (!editor) {
    return <Skeleton className="h-64 w-full rounded-md" />;
  }

  return (
    <div className="rounded-md border border-input">
      <Toolbar editor={editor} onPickImage={handlePickImage} uploading={uploading} />
      <EditorContent editor={editor} className="tiptap-content" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // 같은 파일을 연속으로 고를 수 있게 값을 비운다.
          event.target.value = "";
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
