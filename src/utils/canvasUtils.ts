export interface CanvasConversionResult {
  blob: Blob;
  dataUrl: string;
  size: number;
}

export const createImageBlob = async (
  imageData: string,
  format: string,
  quality: number
): Promise<CanvasConversionResult | null> => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    const img = new Image();
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = imageData;
    });

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Create blob with exact same parameters
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        resolve,
        `image/${format}`,
        format === 'png' ? undefined : quality / 100
      );
    });

    if (!blob) throw new Error('Failed to create blob');

    // Convert to data URL
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(blob);
    });

    return {
      blob,
      dataUrl,
      size: blob.size
    };
  } catch (error) {
    console.error('Canvas conversion failed:', error);
    return null;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};