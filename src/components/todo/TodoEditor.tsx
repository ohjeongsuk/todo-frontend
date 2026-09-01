"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  SquareCode,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { Skeleton } from "@/components/ui/skeleton";
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
 * 본문 리치 텍스트 에디터.
 *
 * StarterKit을 기본값으로 쓰지 않는다. v3 StarterKit이 포함하는 Strike·Underline·HorizontalRule은
 * 서버 Jsoup Safelist(p h2 h3 strong em ul ol li blockquote pre code br a)에 없어 저장 시 제거된다.
 * 켜둔 채 두면 사용자가 서식을 넣어도 에러 없이 조용히 사라져 원인을 찾기 어렵다.
 */
function buildExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] }, // 서버가 h2·h3만 허용한다
      strike: false, // <s> 제거됨
      underline: false, // <u> 제거됨 (v3에서 StarterKit에 새로 포함됐다)
      horizontalRule: false, // <hr> 제거됨
      link: {
        // 편집기 안에서 링크를 누르면 편집이 아니라 이동이 되어버린다.
        openOnClick: false,
        // 서버가 addEnforcedAttribute로 rel을 주입하지만, 저장 전 편집 중 상태에는
        // 서버를 거치지 않은 링크가 존재한다. 클라이언트에서도 같은 값을 붙인다.
        HTMLAttributes: { rel: "nofollow noopener noreferrer" },
      },
    }),
  ];
}

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      // form 안에 있으므로 type을 지정하지 않으면 submit이 되어 폼이 제출된다.
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-11 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
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
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        label="인라인 코드"
      >
        <Code className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        label="제목 2"
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        label="제목 3"
      >
        <Heading3 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        label="인용"
      >
        <Quote className="size-4" />
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
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        label="코드 블록"
      >
        <SquareCode className="size-4" />
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
    </div>
  );
}

export function TodoEditor({ initialHtml, onChange, onReady }: TodoEditorProps) {
  // 최초 주입 여부. value가 바뀔 때마다 setContent하면 입력 중 커서가 튄다.
  const injectedRef = useRef(false);

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
  }, [editor, initialHtml, onReady]);

  if (!editor) {
    return <Skeleton className="h-64 w-full rounded-md" />;
  }

  return (
    <div className="rounded-md border border-input">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  );
}
