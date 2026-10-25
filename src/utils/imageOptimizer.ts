/**
 * High-performance client-side image optimization utility.
 * Optimizes local images (PC/smartphones, large camera photos, screenshots)
 * into lightweight, Retina-sharp Base64 data URLs for fast loading and safe storage.
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default: 0.82)
  targetMaxBytes?: number; // Target max size ceiling in bytes (default: 80KB)
  preferredFormat?: 'webp' | 'jpeg';
}

export interface ImageOptimizationResult {
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  reductionRatio: number; // e.g. 96.5 (%)
  format: 'webp' | 'jpeg';
}

export type OptimizationPreset = 'balanced' | 'high' | 'eco';

export const OPTIMIZATION_PRESETS: Record<
  OptimizationPreset,
  { label: string; sub: string; options: ImageOptimizationOptions }
> = {
  balanced: {
    label: '標準バランス（推奨）',
    sub: '最大640px / 約30〜50KB / 高速・高精細',
    options: {
      maxWidth: 640,
      maxHeight: 640,
      quality: 0.82,
      targetMaxBytes: 65 * 1024,
    },
  },
  high: {
    label: '高解像度重視',
    sub: '最大800px / 約60〜90KB / 細部までクリア',
    options: {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.88,
      targetMaxBytes: 95 * 1024,
    },
  },
  eco: {
    label: '超軽量エコ',
    sub: '最大480px / 約15〜30KB / 通信・容量節約',
    options: {
      maxWidth: 480,
      maxHeight: 480,
      quality: 0.74,
      targetMaxBytes: 35 * 1024,
    },
  },
};

/**
 * Formats byte numbers to human-readable strings (e.g. 4.2 MB, 45 KB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Detects if the current browser canvas supports WebP encoding.
 */
let cachedWebpSupport: boolean | null = null;
export function isWebpSupported(): boolean {
  if (cachedWebpSupport !== null) return cachedWebpSupport;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    cachedWebpSupport = canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  } catch {
    cachedWebpSupport = false;
  }
  return cachedWebpSupport;
}

/**
 * Calculates byte size of a base64 data URL.
 */
export function getBase64ByteSize(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return dataUrl.length;
  const base64Str = dataUrl.substring(commaIdx + 1);
  return Math.round((base64Str.length * 3) / 4);
}

/**
 * Optimizes a local image File into an ultra-compact, high-fidelity Base64 data URL.
 */
export async function optimizeLocalImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<ImageOptimizationResult> {
  // 1. Validation
  if (!file) {
    throw new Error('ファイルが指定されていません');
  }

  const isImageMime = file.type.startsWith('image/');
  const isImageExt = /\.(jpe?g|png|webp|gif|bmp|svg|avif|heic|heif)$/i.test(file.name);
  if (!isImageMime && !isImageExt) {
    throw new Error('画像ファイルを選択してください (JPG, PNG, WebP, GIFなど)');
  }

  // Pre-check size limit to avoid browser tab freezing (e.g. > 30MB)
  const MAX_SOURCE_BYTES = 30 * 1024 * 1024;
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error(`画像サイズが大きすぎます (${formatBytes(file.size)})。30MB以下の画像を選択してください`);
  }

  const originalSizeBytes = file.size;
  const maxWidth = options.maxWidth || 640;
  const maxHeight = options.maxHeight || 640;
  let quality = typeof options.quality === 'number' ? options.quality : 0.82;
  const targetMaxBytes = options.targetMaxBytes || 80 * 1024; // 80KB target
  const useWebp = options.preferredFormat === 'webp' || (options.preferredFormat !== 'jpeg' && isWebpSupported());
  const mimeType = useWebp ? 'image/webp' : 'image/jpeg';
  const outFormat: 'webp' | 'jpeg' = useWebp ? 'webp' : 'jpeg';

  // 2. Load Image object with ObjectURL (efficient memory management)
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const imageEl = new Image();
      imageEl.onload = () => resolve(imageEl);
      imageEl.onerror = () => reject(new Error('画像の読み込みに失敗しました。破損していないかご確認ください'));
      imageEl.src = objectUrl;
    });

    const originalWidth = img.naturalWidth || img.width;
    const originalHeight = img.naturalHeight || img.height;

    if (!originalWidth || !originalHeight) {
      throw new Error('画像の寸法を取得できませんでした');
    }

    // 3. Calculate target dimensions preserving aspect ratio
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
      targetWidth = Math.max(1, Math.round(targetWidth * ratio));
      targetHeight = Math.max(1, Math.round(targetHeight * ratio));
    }

    // 4. Multi-step high-quality canvas resizing
    // If shrinking by more than 2.5x, intermediate downscaling produces sharper, artifact-free results
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });

    if (!ctx) {
      throw new Error('Canvasコンテキストの作成に失敗しました');
    }

    // Enable best smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // White background for transparent PNGs/WebPs when converting to JPEG
    if (!useWebp) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // 5. Adaptive compression: if output is larger than targetMaxBytes, step down smoothly
    let currentQuality = quality;
    let dataUrl = canvas.toDataURL(mimeType, currentQuality);
    let compressedBytes = getBase64ByteSize(dataUrl);

    let iterations = 0;
    while (compressedBytes > targetMaxBytes && currentQuality > 0.5 && iterations < 3) {
      iterations++;
      currentQuality = Math.max(0.48, currentQuality - 0.12);
      dataUrl = canvas.toDataURL(mimeType, currentQuality);
      compressedBytes = getBase64ByteSize(dataUrl);
    }

    // If still large after quality reduction, slightly scale down dimensions (e.g. 80%)
    if (compressedBytes > targetMaxBytes * 1.25) {
      const scaleCanvas = document.createElement('canvas');
      const scaleRatio = Math.sqrt(targetMaxBytes / compressedBytes);
      const scaledW = Math.max(100, Math.round(targetWidth * Math.min(0.85, scaleRatio)));
      const scaledH = Math.max(100, Math.round(targetHeight * Math.min(0.85, scaleRatio)));

      scaleCanvas.width = scaledW;
      scaleCanvas.height = scaledH;
      const sCtx = scaleCanvas.getContext('2d');
      if (sCtx) {
        sCtx.imageSmoothingEnabled = true;
        sCtx.imageSmoothingQuality = 'high';
        if (!useWebp) {
          sCtx.fillStyle = '#ffffff';
          sCtx.fillRect(0, 0, scaledW, scaledH);
        }
        sCtx.drawImage(canvas, 0, 0, scaledW, scaledH);
        dataUrl = scaleCanvas.toDataURL(mimeType, currentQuality);
        compressedBytes = getBase64ByteSize(dataUrl);
        targetWidth = scaledW;
        targetHeight = scaledH;
      }
    }

    const reductionRatio =
      originalSizeBytes > 0
        ? Math.max(0, Math.round(((originalSizeBytes - compressedBytes) / originalSizeBytes) * 1000) / 10)
        : 0;

    return {
      dataUrl,
      originalSizeBytes,
      compressedSizeBytes: compressedBytes,
      originalWidth,
      originalHeight,
      width: targetWidth,
      height: targetHeight,
      reductionRatio,
      format: outFormat,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
