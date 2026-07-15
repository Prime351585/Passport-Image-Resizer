import React, { useState } from 'react';
import UploadPreview, { type UploadedImage } from './UploadPreview';
import JSZip from 'jszip';

interface CompressToolContainerProps {
  className?: string;
}

export default function CompressToolContainer({ className = '' }: CompressToolContainerProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<string>('auto');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrls, setProcessedUrls] = useState<{name: string, url: string}[]>([]);
  const [stats, setStats] = useState<{original: number, compressed: number}>({ original: 0, compressed: 0 });

  const handleBatchUpload = (uploaded: UploadedImage[]) => {
    setImages(uploaded);
    setProcessedUrls([]);
    setStats({ original: 0, compressed: 0 });
  };

  const handleRemove = (index?: number) => {
    if (typeof index === 'number') {
      setImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setImages([]);
    }
    setProcessedUrls([]);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processBatch = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setProcessedUrls([]);
    let totalOriginal = 0;
    let totalCompressed = 0;
    
    try {
      const zip = new JSZip();
      const results: {name: string, url: string}[] = [];

      for (const img of images) {
        totalOriginal += img.size;
        
        const resultUrl = await new Promise<string>((resolve, reject) => {
          const image = new Image();
          image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('No context');
            
            ctx.drawImage(image, 0, 0);
            
            let mimeType = img.file.type;
            if (format === 'jpeg') mimeType = 'image/jpeg';
            if (format === 'webp') mimeType = 'image/webp';
            if (format === 'png') mimeType = 'image/png';

            const dataUrl = canvas.toDataURL(mimeType, quality / 100);
            resolve(dataUrl);
          };
          image.onerror = reject;
          image.src = img.dataUrl;
        });

        const base64Data = resultUrl.split(',')[1];
        let ext = img.name.split('.').pop() || 'jpg';
        if (format !== 'auto') ext = format;
        const newName = `${img.name.substring(0, img.name.lastIndexOf('.'))}_compressed.${ext}`;
        
        zip.file(newName, base64Data, {base64: true});
        results.push({ name: newName, url: resultUrl });
        
        totalCompressed += Math.round(base64Data.length * 0.75);
      }

      setStats({ original: totalOriginal, compressed: totalCompressed });
      setProcessedUrls(results);

      if (results.length > 1) {
        const content = await zip.generateAsync({type: "blob"});
        const zipUrl = URL.createObjectURL(content);
        
        const link = document.createElement('a');
        link.href = zipUrl;
        link.download = `compressed_batch.zip`;
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
      alert('Error compressing images');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`max-w-7xl mx-auto p-4 space-y-6 ${className}`}>
      <div className={`grid grid-cols-1 ${images.length > 0 ? 'xl:grid-cols-2' : ''} gap-4 md:gap-6`}>
        
        {/* Upload Column */}
        <div className={`space-y-4 md:space-y-6 ${images.length === 0 ? 'max-w-3xl mx-auto w-full' : ''}`}>
          <UploadPreview 
            onBatchUpload={handleBatchUpload}
            onImageRemove={handleRemove}
            multiple={true}
          />
        </div>
        
        {/* Controls Column */}
        {images.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-crimson font-semibold text-gray-900 mb-4">Compression Settings</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quality: {quality}%</label>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={quality} 
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Smaller File</span>
                    <span>Better Quality</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Output Format</label>
                  <select 
                    value={format} 
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  >
                    <option value="auto">Keep Original Format</option>
                    <option value="jpeg">JPEG (Best compression)</option>
                    <option value="webp">WebP (Modern, efficient)</option>
                    <option value="png">PNG (Lossless, larger)</option>
                  </select>
                </div>
              </div>

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
                    <span>{images.length > 1 ? `Compress ${images.length} Images` : 'Compress Image'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Results */}
            {processedUrls.length > 0 && stats && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Compression Complete
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Original</p>
                    <p className="font-semibold text-gray-900">{formatBytes(stats.original)}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
                    <p className="text-xs text-green-600 uppercase tracking-wider mb-1">Compressed</p>
                    <p className="font-bold text-green-700">{formatBytes(stats.compressed)}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1 bg-primary/10 rounded-xl p-4 border border-primary/20 text-center flex flex-col justify-center">
                    <p className="text-xs text-primary uppercase tracking-wider mb-1">Savings</p>
                    <p className="font-bold text-primary text-xl">
                      {stats.original > 0 ? Math.round(((stats.original - stats.compressed) / stats.original) * 100) : 0}%
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 text-center mt-2">
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