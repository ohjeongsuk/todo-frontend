/**
 * 첨부 파일 계약.
 * 정본: todo-backend/src/main/java/com/example/todoapp/dto/Attachment*.java
 */

/**
 * 업로드 가능한 이미지 타입 (PRD F-47).
 * 정본: application.properties 의 app.upload.allowed-content-types
 *
 * image/svg+xml 은 없다. SVG 는 스크립트를 실행할 수 있어 XSS 벡터다.
 */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/** 5MB. 정본: application.properties 의 app.upload.max-file-size */
export const MAX_IMAGE_SIZE_BYTES = 5_242_880;

export interface AttachmentPresignRequest {
  filename: string;
  contentType: string;
  /** 신고값이다. 서버는 업로드 중 실제 바이트를 세어 다시 검증한다 (PRD NF-34). */
  fileSize: number;
}

/**
 * storageKey 가 없다. 서버가 응답에 담지 않기 때문이다 (PRD NF-33).
 * 클라이언트는 attachmentId 만으로 모든 작업을 한다.
 */
export interface AttachmentPresignResponse {
  attachmentId: number;
  /**
   * 로컬 백엔드 엔드포인트일 수도, S3 presigned PUT URL 일 수도 있다.
   * **어느 쪽인지 판단하지 않는다.** 그대로 PUT 을 보낸다 (PRD F-50).
   */
  uploadUrl: string;
}

export interface AttachmentResponse {
  attachmentId: number;
  /** 만료되는 URL 이다. 본문 HTML 에 저장하지 않고 렌더 시점에만 쓴다 (PRD F-49). */
  viewUrl: string;
}

export interface AttachmentViewUrlsRequest {
  attachmentIds: number[];
}

/** attachmentId(문자열 키) → viewUrl. 서버가 Map<Long, String> 을 직렬화한 형태다. */
export type AttachmentViewUrls = Record<string, string>;

/** 클라이언트 선검증 결과. 통과하면 message 가 없다. */
export interface ImageValidationResult {
  valid: boolean;
  message?: string;
}
