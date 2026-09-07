import DOMPurify from "isomorphic-dompurify";

/**
 * Tiptap 본문 HTML의 렌더 단계 정화.
 *
 * 서버가 저장 전에 Jsoup으로 한 번 거르고(CLAUDE.md 절대 규칙 8), 여기서 한 번 더 거른다.
 * 둘 중 하나만 하는 것은 금지다. Access Token이 localStorage에 있으므로
 * XSS는 곧 토큰 탈취다 (PRD NF-09).
 *
 * 허용 목록의 정본:
 *   todo-backend/src/main/java/com/example/todoapp/service/HtmlSanitizer.java 의 Safelist
 * DOMPurify 기본값은 이보다 훨씬 넓으므로 반드시 명시한다.
 */

/** HtmlSanitizer.SAFELIST.addTags(...)와 정확히 같은 목록이다. */
const ALLOWED_TAGS = ["p", "strong", "em", "ul", "ol", "li", "br", "a", "img"] as const;

/**
 * rel을 빠뜨리면 서버가 addEnforcedAttribute로 주입한
 * rel="nofollow noopener noreferrer" tabnabbing 방어가 렌더 단계에서 지워진다.
 * target도 같은 이유로 유지한다.
 *
 * img에는 src가 없다 (PRD F-49). 조회 URL은 30분 만료라 본문 HTML에 박아두면
 * 며칠 뒤 전부 깨진다. data-attachment-id만 저장하고 렌더 시점에 src를 주입한다.
 * 부수 효과로 javascript: src 주입 경로가 원천 차단된다.
 */
const ALLOWED_ATTR = ["href", "rel", "target", "alt", "data-attachment-id"] as const;

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
    // 서버 Safelist가 http/https/mailto만 허용하므로 동일하게 맞춘다.
    ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
  });
}
