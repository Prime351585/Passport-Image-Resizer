import React, { useState } from 'react';
import UploadPreview, { type UploadedImage } from './UploadPreview';
import JSZip from 'jszip';

interface RoundCornerToolContainerProps {
  className?: string;
}

export default function RoundCornerToolContainer({ className = '' }: RoundCornerToolContainerProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [intensity, setIntensity] = useState(25); // 0-100 percentage
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrls, setProcessedUrls] = useState<{name: string, url: string}[]>([]);

  const handleBatchUpload = (uploaded: UploadedImage[]) => {
    setImages(uploaded);
    setProcessedUrls([]);
  };

  const handleRemove = (index?: number) => {
    if (typeof index === 'number') {
      setImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setImages([]);
    }
    setProcessedUrls([]);
  };

  const processBatch = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setProcessedUrls([]);
    
    try {
      const zip = new JSZip();
      const results: {name: string, url: string}[] = [];

      for (const img of images) {
        const resultUrl = await new Promise<string>((resolve, reject) => {
          const image = new Image();
          image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('No context');
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            // Calculate radius based on shortest side, 100% intensity = full circle/pill
            const maxRadius = Math.min(canvas.width, canvas.height) / 2;
            const radius = maxRadius * (intensity / 100);
            
            // @ts-ignore - roundRect is relatively new but widely supported now
            if (ctx.roundRect) {
              ctx.roundRect(0, 0, canvas.width, canvas.height, radius);
            } else {
              // fallback
              ctx.moveTo(radius, 0);
              ctx.lineTo(canvas.width - radius, 0);
              ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
              ctx.lineTo(canvas.width, canvas.height - radius);
              ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
              ctx.lineTo(radius, canvas.height);
              ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
              ctx.lineTo(0, radius);
              ctx.quadraticCurveTo(0, 0, radius, 0);
            }
            
            ctx.clip();
            ctx.drawImage(image, 0, 0);
            
            // Must output PNG to preserve transparent corners
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          };
          image.onerror = reject;
          image.src = img.dataUrl;
        });

        const base64Data = resultUrl.split(',')[1];
        let ext = img.name.split('.').pop() || 'png';
        const newName = `${img.name.substring(0, img.name.lastIndexOf('.'))}_rounded.png`;
        
        zip.file(newName, base64Data, {base64: true});
        results.push({ name: newName, url: resultUrl });
      }

      setProcessedUrls(results);

      if (results.length > 1) {
        const content = await zip.generateAsync({type: "blob"});
        const zipUrl = URL.createObjectURL(content);
        
        const link = document.createElement('a');
        link.href = zipUrl;
        link.download = `rounded_batch.zip`;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
      } else if (results.length === 1) {
        const link = document.createElement('a');
        link.href = results[0].url;
        link.download = results[0].name;
        document.body.appendChild(link);
        link.click();
      }
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm ${className}`}>
      <div className="flex items-center space-x-3 pb-4 border-b-2 border-gray-100">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></rect>
          </svg>
        </div>
        <div>
          <h3 className="font-crimson text-xl md:text-2xl font-semibold text-gray-900">
            Round Corners
          </h3>
          <p className="text-sm text-gray-500">Add rounded corners to your images</p>
        </div>
      </div>

      <UploadPreview
        images={images}
        onUpload={handleBatchUpload}
        onRemove={handleRemove}
        maxFiles={20}
        className="w-full"
      />

      {images.length > 0 && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <label className="font-medium text-gray-900">Corner Radius</label>
              <span className="text-primary font-bold">{intensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <button
            onClick={processBatch}
            disabled={isProcessing}
            className="w-full py-4 bg-primary text-white text-lg font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            {isProcessing ? 'Processing...' : `Apply Rounded Corners & Download`}
          </button>
        </div>
      )}
    </div>
  );
}
