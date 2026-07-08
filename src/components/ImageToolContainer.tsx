import React, { useState, useEffect } from 'react';
import UploadPreview, { type UploadedImage } from './UploadPreview';
import ImageResizer from './ImageResizer';
import JSZip from 'jszip';

interface ResizeSettings {
  width: number | '';
  height: number | '';
  unit: 'px' | '%' | 'mm' | 'cm' | 'in';
  maintainAspectRatio: boolean;
  resizeMethod: 'exact' | 'fit' | 'fill' | 'crop';
  quality: number;
}

const ImageToolContainer: React.FC = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [latestSettings, setLatestSettings] = useState<ResizeSettings | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrls, setProcessedUrls] = useState<{name: string, url: string}[]>([]);
  
  // Need first image dimensions to pass to ImageResizer
  const [firstImageDim, setFirstImageDim] = useState<{width: number, height: number}>({width: 0, height: 0});

  const handleBatchUpload = (uploaded: UploadedImage[]) => {
    setImages(uploaded);
    setProcessedUrls([]);
    
    if (uploaded.length > 0) {
      const img = new Image();
      img.onload = () => {
        setFirstImageDim({ width: img.width, height: img.height });
      };
      img.src = uploaded[0].dataUrl;
    }
  };

  const handleRemove = (index?: number) => {
    if (typeof index === 'number') {
      setImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setImages([]);
    }
    setProcessedUrls([]);
  };

  const handleResizeUpdate = (resizedImage: string, settings: ResizeSettings) => {
    setLatestSettings(settings);
  };

  const convertToPixels = (value: number, unit: string, originalSize: number): number => {
    const dpi = 96;
    switch (unit) {
      case 'px': return value;
      case '%': return Math.round((value / 100) * originalSize);
      case 'mm': return Math.round((value * dpi) / 25.4);
      case 'cm': return Math.round((value * dpi) / 2.54);
      case 'in': return Math.round(value * dpi);
      default: return value;
    }
  };

  const processBatch = async () => {
    if (images.length === 0 || !latestSettings) return;
    setIsProcessing(true);
    setProcessedUrls([]);
    
    try {
      const zip = new JSZip();
      const results: {name: string, url: string}[] = [];

      for (const imgData of images) {
        const resultUrl = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('No context');

            const originalWidth = img.width;
            const originalHeight = img.height;

            const targetWidth = convertToPixels(Number(latestSettings.width) || 1, latestSettings.unit, originalWidth);
            const targetHeight = convertToPixels(Number(latestSettings.height) || 1, latestSettings.unit, originalHeight);

            let drawWidth = targetWidth;
            let drawHeight = targetHeight;
            let offsetX = 0;
            let offsetY = 0;

            switch (latestSettings.resizeMethod) {
              case 'exact':
                break;
              case 'fit':
                const scale = Math.min(targetWidth / originalWidth, targetHeight / originalHeight);
                drawWidth = originalWidth * scale;
                drawHeight = originalHeight * scale;
                offsetX = (targetWidth - drawWidth) / 2;
                offsetY = (targetHeight - drawHeight) / 2;
                break;
              case 'fill':
                const fillScale = Math.max(targetWidth / originalWidth, targetHeight / originalHeight);
                drawWidth = originalWidth * fillScale;
                drawHeight = originalHeight * fillScale;
                offsetX = (targetWidth - drawWidth) / 2;
                offsetY = (targetHeight - drawHeight) / 2;
                break;
              case 'crop':
                const cropScale = Math.min(targetWidth / originalWidth, targetHeight / originalHeight);
                const cropWidth = targetWidth / cropScale;
                const cropHeight = targetHeight / cropScale;
                const cropX = (originalWidth - cropWidth) / 2;
                const cropY = (originalHeight - cropHeight) / 2;
                
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
                resolve(canvas.toDataURL('image/jpeg', latestSettings.quality / 100));
                return;
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            if (latestSettings.resizeMethod === 'fit') {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, targetWidth, targetHeight);
            }

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            resolve(canvas.toDataURL('image/jpeg', latestSettings.quality / 100));
          };
          img.onerror = reject;
          img.src = imgData.dataUrl;
        });

        const base64Data = resultUrl.split(',')[1];
        const baseName = imgData.name.substring(0, imgData.name.lastIndexOf('.'));
        const newName = `${baseName}_resized.jpg`;
        
        zip.file(newName, base64Data, {base64: true});
        results.push({ name: newName, url: resultUrl });
      }

      setProcessedUrls(results);

      if (results.length > 1) {
        const content = await zip.generateAsync({type: "blob"});
        const zipUrl = URL.createObjectURL(content);
        
        const link = document.createElement('a');
        link.href = zipUrl;
        link.download = `resized_batch.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (results.length === 1) {
        const link = document.createElement('a');
        link.href = results[0].url;
        link.download = results[0].name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (e) {
      console.error(e);
      alert('Error resizing images');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        
        <div className="space-y-4 md:space-y-6">
          <UploadPreview
            onBatchUpload={handleBatchUpload}
            onImageRemove={handleRemove}
            maxSizeMB={10}
            storageKey="resize-tool-image"
            className="w-full"
            showPreview={false}
            multiple={true}
          />
          
          {images.length > 0 && latestSettings && (
            <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <button
                onClick={processBatch}
                disabled={isProcessing}
                className="w-full md:w-auto bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    <span>{images.length > 1 ? `Resize ${images.length} Images` : 'Resize Image'}</span>
                  </>
                )}
              </button>

              {processedUrls.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Resize Complete
                  </h3>
                  <p className="text-sm text-gray-500">
                    {images.length > 1 ? 'Your ZIP file download should start automatically.' : 'Your file download should start automatically.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 md:space-y-6">
          {images.length > 0 && (
            <>
              {images.length > 1 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-sm text-blue-800">
                  <strong>Batch Mode:</strong> You are editing settings for the first image. These settings will be applied to all <strong>{images.length}</strong> images in your batch.
                </div>
              )}
              <ImageResizer
                imageData={images[0].dataUrl}
                originalWidth={firstImageDim.width}
                originalHeight={firstImageDim.height}
                onResize={handleResizeUpdate}
                className="w-full"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageToolContainer;