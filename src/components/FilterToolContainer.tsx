import React, { useState, useEffect } from 'react';
import UploadPreview, { type UploadedImage } from './UploadPreview';
import JSZip from 'jszip';

export type FilterType = 'invert' | 'lighten' | 'saturate';

interface FilterToolContainerProps {
  className?: string;
  filterType: FilterType;
}

export default function FilterToolContainer({ className = '', filterType }: FilterToolContainerProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [intensity, setIntensity] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrls, setProcessedUrls] = useState<{name: string, url: string}[]>([]);

  useEffect(() => {
    // Reset intensity based on filter type
    if (filterType === 'invert') setIntensity(100);
    if (filterType === 'lighten') setIntensity(150);
    if (filterType === 'saturate') setIntensity(200);
  }, [filterType]);

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
            
            let filterString = '';
            if (filterType === 'invert') filterString = `invert(${intensity}%)`;
            if (filterType === 'lighten') filterString = `brightness(${intensity}%)`;
            if (filterType === 'saturate') filterString = `saturate(${intensity}%)`;
            
            ctx.filter = filterString;
            ctx.drawImage(image, 0, 0);
            
            // Revert filter for subsequent operations on same ctx, though we recreate canvas
            ctx.filter = 'none';

            const dataUrl = canvas.toDataURL(img.file.type || 'image/jpeg', 0.92);
            resolve(dataUrl);
          };
          image.onerror = reject;
          image.src = img.dataUrl;
        });

        const base64Data = resultUrl.split(',')[1];
        let ext = img.name.split('.').pop() || 'jpg';
        const newName = `${img.name.substring(0, img.name.lastIndexOf('.'))}_${filterType}.${ext}`;
        
        zip.file(newName, base64Data, {base64: true});
        results.push({ name: newName, url: resultUrl });
      }

      setProcessedUrls(results);

      if (results.length > 1) {
        const content = await zip.generateAsync({type: "blob"});
        const zipUrl = URL.createObjectURL(content);
        
        const link = document.createElement('a');
        link.href = zipUrl;
        link.download = `${filterType}_batch.zip`;
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
        </div>
        <div>
          <h3 className="font-crimson text-xl md:text-2xl font-semibold text-gray-900 capitalize">
            {filterType} Image
          </h3>
          <p className="text-sm text-gray-500">Apply {filterType} effect to your photos instantly</p>
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
              <label className="font-medium text-gray-900 capitalize">{filterType} Intensity</label>
              <span className="text-primary font-bold">{intensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max={filterType === 'saturate' ? 300 : filterType === 'lighten' ? 200 : 100}
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
            {isProcessing ? 'Processing...' : `Apply ${filterType} & Download`}
          </button>
        </div>
      )}
    </div>
  );
}
