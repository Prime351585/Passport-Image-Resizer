import React, { useState, useEffect } from 'react';
import UploadPreview, { type UploadedImage } from './UploadPreview';
import JSZip from 'jszip';

interface ConvertToolContainerProps {
  className?: string;
  defaultFormat?: string; // e.g. 'webp', 'png', 'jpeg'
}

export default function ConvertToolContainer({ className = '', defaultFormat = 'webp' }: ConvertToolContainerProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>(defaultFormat);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrls, setProcessedUrls] = useState<{name: string, url: string}[]>([]);

  useEffect(() => {
    if (defaultFormat) setTargetFormat(defaultFormat);
  }, [defaultFormat]);

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
            
            ctx.drawImage(image, 0, 0);
            
            let mimeType = `image/${targetFormat}`;
            // quality is 0.9 for webp/jpeg to keep it reasonable
            const dataUrl = canvas.toDataURL(mimeType, 0.9);
            resolve(dataUrl);
          };
          image.onerror = reject;
          image.src = img.dataUrl;
        });

        const base64Data = resultUrl.split(',')[1];
        const baseName = img.name.substring(0, img.name.lastIndexOf('.'));
        const newName = `${baseName}_converted.${targetFormat}`;
        
        zip.file(newName, base64Data, {base64: true});
        results.push({ name: newName, url: resultUrl });
      }

      setProcessedUrls(results);

      if (results.length > 1) {
        const content = await zip.generateAsync({type: "blob"});
        const zipUrl = URL.createObjectURL(content);
        
        const link = document.createElement('a');
        link.href = zipUrl;
        link.download = `converted_batch.zip`;
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
      alert('Error converting images');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`max-w-7xl mx-auto p-4 space-y-6 ${className}`}>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        
        <div className="space-y-4 md:space-y-6">
          <UploadPreview 
            onBatchUpload={handleBatchUpload}
            onImageRemove={handleRemove}
            multiple={true}
          />
        </div>
        
        {images.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-crimson font-semibold text-gray-900 mb-4">Conversion Settings</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Convert To</label>
                <select 
                  value={targetFormat} 
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>

              <button
                onClick={processBatch}
                disabled={isProcessing}
                className="w-full md:w-auto bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    <span>{images.length > 1 ? `Convert ${images.length} Images` : 'Convert Image'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Results */}
            {processedUrls.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Conversion Complete
                </h3>
                <p className="text-sm text-gray-500">
                  {images.length > 1 ? 'Your ZIP file download should start automatically.' : 'Your file download should start automatically.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}