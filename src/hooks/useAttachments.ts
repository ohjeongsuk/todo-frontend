"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import {
  completeUpload,
  getViewUrls,
  presignUpload,
  uploadFile,
  validateImageFile,
} from "@/lib/attachments";
import { attachmentKeys } from "@/lib/queryKeys";
import type { AttachmentViewUrls } from "@/types/attachment";

/**
 * 조회 URL 은 기본 30분 만료다. 캐시가 만료된 URL 을 계속 돌려주면 이미지가 조용히 깨지므로
 * staleTime 을 만료보다 넉넉히 짧게 잡는다.
 */
const VIEW_URL_STALE_MS = 10 * 60 * 1000;

/** 업로드 3단계(presign → PUT → complete)를 한 번에 수행한다. */
export function useUploadAttachment() {
  return useMutation({
    mutationFn: async (file: File): Promise<{ attachmentId: number; viewUrl: string }> => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.message ?? "첨부할 수 없는 파일입니다.");
      }

      const { attachmentId, uploadUrl } = await presignUpload(file.name, file.type, file.size);

      // uploadUrl 이 로컬인지 S3 인지 판단하지 않는다. 그대로 PUT 한다 (PRD F-50).
      // presign 에 보낸 file.type 과 같은 값을 헤더에 실어야 S3 서명이 맞는다.
      await uploadFile(uploadUrl, file, file.type);

      const { viewUrl } = await completeUpload(attachmentId);
      return { attachmentId, viewUrl };
    },
  });
}

/**
 * 본문에 있는 첨부들의 조회 URL 을 한 번에 받는다.
 *
 * ids 가 비면 요청하지 않는다. 빈 배열로 호출하면 서버가 400(@NotEmpty)을 준다.
 */
export function useAttachmentViewUrls(ids: number[]) {
  return useQuery<AttachmentViewUrls>({
    queryKey: attachmentKeys.viewUrls(ids),
    queryFn: () => getViewUrls(ids),
    enabled: ids.length > 0,
    staleTime: VIEW_URL_STALE_MS,
  });
}
