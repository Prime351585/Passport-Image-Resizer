// Shared helpers for producing output images from a canvas.
// Keeps format, transparency and file-size behaviour consistent across tools.

export type OutputMime = 'image/jpeg' | 'image/png' | 'image/webp';

/** Mime type of a data URL (falls back to JPEG). */
export function mimeOfDataUrl(dataUrl: string): OutputMime {
  if (dataUrl.startsWith('data:image/png')) return 'image/png';
  if (dataUrl.startsWith('data:image/webp')) return 'image/webp';
  return 'image/jpeg';
}

export function extForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

/** Replace a filename's extension (keeps the base name). */
export function withExt(name: string, ext: string, suffix = ''): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}${suffix}.${ext}`;
}

/**
 * Create a canvas sized w×h. JPEG has no alpha channel, so transparent
 * pixels would otherwise turn black — paint white underneath first.
 */
export function makeCanvas(w: number, h: number, mime: string) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d')!;
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.imageSmoothingQuality = 'high';
  return { canvas, ctx };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read this image'));
    img.src = src;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encoding failed'))), mime, quality);
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/** Approximate decoded byte size of a base64 data URL. */
export function dataUrlBytes(dataUrl: string): number {
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
}

/** True when any pixel is not fully opaque (sampled for speed). */
export function hasTransparency(img: HTMLImageElement): boolean {
  const w = Math.min(img.naturalWidth, 400);
  const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
  const { ctx } = makeCanvas(w, h, 'image/png');
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 255) return true;
  return false;
}

/**
 * Encode `img` so the result is at most `targetBytes`.
 * Binary-searches quality first; if even the lowest acceptable quality is too
 * big, scales the image down step by step. PNG cannot be quality-compressed,
 * so callers should pass JPEG or WebP here.
 */
export async function encodeToTargetSize(
  img: HTMLImageElement,
  mime: 'image/jpeg' | 'image/webp',
  targetBytes: number,
): Promise<{ blob: Blob; width: number; height: number; quality: number }> {
  let scale = 1;
  let best: { blob: Blob; width: number; height: number; quality: number } | null = null;

  for (let pass = 0; pass < 12; pass++) {
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const { canvas, ctx } = makeCanvas(w, h, mime);
    ctx.drawImage(img, 0, 0, w, h);

    let lo = 0.1, hi = 0.95, found: Blob | null = null, foundQ = 0;
    for (let i = 0; i < 7; i++) {
      const q = (lo + hi) / 2;
      const blob = await canvasToBlob(canvas, mime, q);
      if (blob.size <= targetBytes) { found = blob; foundQ = q; lo = q; } else { hi = q; }
    }
    if (!found) {
      const blob = await canvasToBlob(canvas, mime, 0.1);
      if (blob.size <= targetBytes) { found = blob; foundQ = 0.1; }
    }
    if (found) return { blob: found, width: w, height: h, quality: foundQ };

    // Too big even at low quality: keep the smallest attempt and shrink.
    const smallest = await canvasToBlob(canvas, mime, 0.1);
    if (!best || smallest.size < best.blob.size) best = { blob: smallest, width: w, height: h, quality: 0.1 };
    scale *= 0.8;
  }
  return best!;
}

// ─── Pixel filters (work in every browser, unlike ctx.filter on Safari) ─────

/**
 * Apply a filter in place. `amount` uses CSS filter semantics in percent:
 * invert 0–100, brightness 0–200 (100 = unchanged), saturate 0–300 (100 = unchanged).
 */
export function applyPixelFilter(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  type: 'invert' | 'lighten' | 'saturate',
  amount: number,
) {
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  const a = amount / 100;

  if (type === 'invert') {
    for (let i = 0; i < d.length; i += 4) {
      d[i] = d[i] + (255 - 2 * d[i]) * a;
      d[i + 1] = d[i + 1] + (255 - 2 * d[i + 1]) * a;
      d[i + 2] = d[i + 2] + (255 - 2 * d[i + 2]) * a;
    }
  } else if (type === 'lighten') {
    for (let i = 0; i < d.length; i += 4) {
      d[i] *= a; d[i + 1] *= a; d[i + 2] *= a; // Uint8ClampedArray clamps
    }
  } else {
    // CSS saturate() matrix
    const s = a;
    const m = [
      0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s,
      0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s,
      0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s,
    ];
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      d[i] = m[0] * r + m[1] * g + m[2] * b;
      d[i + 1] = m[3] * r + m[4] * g + m[5] * b;
      d[i + 2] = m[6] * r + m[7] * g + m[8] * b;
    }
  }
  ctx.putImageData(id, 0, 0);
}
