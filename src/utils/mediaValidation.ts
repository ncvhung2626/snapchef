export const MEDIA_LIMITS = {
  maxImages: 10,
  maxVideos: 1,
  maxVideoDurationSec: 120,
  maxImageSizeMb: 10,
  maxVideoSizeMb: 100,
} as const;

export interface MediaValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageCount(count: number): MediaValidationResult {
  if (count > MEDIA_LIMITS.maxImages) {
    return { valid: false, error: `Tối đa ${MEDIA_LIMITS.maxImages} ảnh` };
  }
  return { valid: true };
}

export function validateVideoCount(count: number): MediaValidationResult {
  if (count > MEDIA_LIMITS.maxVideos) {
    return { valid: false, error: `Tối đa ${MEDIA_LIMITS.maxVideos} video` };
  }
  return { valid: true };
}

export function validateVideoDuration(durationSec: number): MediaValidationResult {
  if (durationSec <= 0) {
    return { valid: false, error: 'Video không hợp lệ' };
  }
  if (durationSec > MEDIA_LIMITS.maxVideoDurationSec) {
    return {
      valid: false,
      error: `Video tối đa ${MEDIA_LIMITS.maxVideoDurationSec / 60} phút`,
    };
  }
  return { valid: true };
}

export function validateMediaUpload(params: {
  imageCount: number;
  videoCount: number;
  videoDurationSec?: number;
}): MediaValidationResult {
  const imgCheck = validateImageCount(params.imageCount);
  if (!imgCheck.valid) return imgCheck;

  const vidCheck = validateVideoCount(params.videoCount);
  if (!vidCheck.valid) return vidCheck;

  if (params.videoCount > 0 && params.videoDurationSec != null) {
    return validateVideoDuration(params.videoDurationSec);
  }

  return { valid: true };
}

export function sanitizeContent(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}
