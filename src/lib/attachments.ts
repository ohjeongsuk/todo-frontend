import { apiClient } from "@/lib/apiClient";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  type AllowedImageType,
  type AttachmentPresignResponse,
  type AttachmentResponse,
  type AttachmentViewUrls,
  type ImageValidationResult,
} from "@/types/attachment";

/**
 * 첨부 파일 API.
 *
 * presign / complete / getViewUrls / deleteAttachment 는 apiClient 를 쓰고,
 * **uploadFile 만 순수 fetch 를 쓴다.** 아래 uploadFile 주석에 이유가 있다.
 */

export function presignUpload(
  filename: string,
  contentType: string,
  fileSize: number,
): Promise<AttachmentPresignResponse> {
  return apiClient.post<AttachmentPresignResponse>("/api/attachments/presign", {
    filename,
    contentType,
    fileSize,
  });
}

export function completeUpload(attachmentId: number): Promise<AttachmentResponse> {
  return apiClient.post<AttachmentResponse>(`/api/attachments/${attachmentId}/complete`, {});
}

/** 본문 이미지의 조회 URL 을 한 번에 받는다. 단건 호출을 반복하면 이미지 수만큼 왕복이 생긴다. */
export function getViewUrls(attachmentIds: number[]): Promise<AttachmentViewUrls> {
  return apiClient.post<AttachmentViewUrls>("/api/attachments/view-urls", { attachmentIds });
}

export function deleteAttachment(attachmentId: number): Promise<void> {
  return apiClient.delete<void>(`/api/attachments/${attachmentId}`);
}

/**
 * 서버가 준 uploadUrl 로 파일 본문을 PUT 한다.
 *
 * **이 함수만 apiClient 를 쓰지 않는다.** apiClient 는 모든 요청에 `Authorization` 헤더와
 * `credentials: "include"` 를 강제하고 401 이면 refresh 를 시도하는데, 그걸 그대로 S3 로 보내면:
 *
 * 1. presigned PUT 은 `Authorization` 헤더가 붙는 순간 서명 검증에 실패해 403 이 난다
 * 2. cross-origin 인 S3 로 쿠키가 새어 나간다
 * 3. S3 가 돌려준 403 을 apiClient 가 인증 만료로 오인해 refresh 로직이 엉킨다
 *
 * `credentials` 를 지정하지 않으면 기본값이 `"same-origin"` 이라 cross-origin 요청에
 * 쿠키가 실리지 않는다. 그래서 여기서는 아무것도 지정하지 않는다.
 *
 * **uploadUrl 이 로컬 엔드포인트인지 S3 인지 판단하는 로직을 두지 않는다.** 그 판단이
 * 들어오는 순간 "스토리지를 바꿔도 프론트는 그대로"라는 전제가 깨진다 (PRD F-50).
 */
export async function uploadFile(
  uploadUrl: string,
  file: File,
  contentType: string,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    // presign 요청에 보낸 값과 정확히 같아야 한다. S3 presigned PUT 은
    // Content-Type 이 서명에 포함되므로 한 글자만 달라도 403 이다.
    headers: { "Content-Type": contentType },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`업로드에 실패했습니다 (${response.status})`);
  }
}

/**
 * 업로드 전 클라이언트 선검증. 불필요한 왕복을 막는 용도일 뿐이며 **서버 검증을 대체하지 않는다**
 * (PRD NF-04).
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!isAllowedImageType(file.type)) {
    return { valid: false, message: "JPG, PNG, GIF, WebP 이미지만 첨부할 수 있습니다." };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, message: "이미지는 5MB 이하만 첨부할 수 있습니다." };
  }
  return { valid: true };
}

function isAllowedImageType(type: string): type is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

/**
 * 본문 HTML 에서 data-attachment-id 값을 모은다.
 *
 * 저장된 HTML 에는 src 가 없고 이 속성만 있으므로 (PRD F-49), 렌더 전에 이 목록으로
 * 조회 URL 을 일괄 요청해 주입해야 한다.
 */
export function extractAttachmentIds(html: string | null): number[] {
  if (!html) return [];

  const ids = new Set<number>();
  // DOMParser 는 브라우저에만 있다. 서버 컴포넌트에서 호출하지 않는다.
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("img[data-attachment-id]").forEach((img) => {
    const raw = img.getAttribute("data-attachment-id");
    const parsed = Number(raw);
    if (raw && Number.isInteger(parsed) && parsed > 0) {
      ids.add(parsed);
    }
  });
  return [...ids];
}
