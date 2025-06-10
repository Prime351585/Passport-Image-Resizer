import React, { useState, useEffect } from 'react';
import UploadPreview from './UploadPreview';
import ImageResizer from './ImageResizer';
import Download from './Download';
import StickyPreview from './StickyPreview';

interface PresetToolContainerProps {
  preset: {
    width: number;
    height: number;
    unit: 'px' | '%' | 'mm' | 'cm' | 'in';
    maintainAspectRatio: boolean;
    resizeMethod: 'exact' | 'fit' | 'fill' | 'crop';
    quality: number;
  };
  presetName: string;
}

const PresetToolContainer: React.FC<PresetToolContainerProps> = ({ preset, presetName }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [processedImage, setProcessedImage] = useState<string>('');
  const [originalFileName, setOriginalFileName] = useState<string>('image');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleImageUpload = (file: File, dataUrl: string) => {
    setUploadedFile(file);
    setOriginalImage(dataUrl);
    setOriginalFileName(file.name);
    
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = dataUrl;
  };

  const handleImageRemove = () => {
    setUploadedFile(null);
    setOriginalImage('');
    setProcessedImage('');
    setOriginalFileName('image');
    setImageDimensions({ width: 0, height: 0 });
  };

  const handleResize = (resizedImage: string) => {
    setProcessedImage(resizedImage);
  };

  const handleDownload = (format: string, quality: number) => {
    console.log(`Downloaded ${presetName} as ${format} with ${quality}% quality`);
  };

  return (
    <>
      {/* Sticky Preview for Mobile */}
      <StickyPreview 
        imageData={processedImage || originalImage}
        originalFileName={`${originalFileName.replace(/\.[^/.]+$/, '')}-${presetName.toLowerCase().replace(/\s+/g, '-')}`}
        isVisible={isMobile && !!uploadedFile}
        className="lg:hidden"
      />

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Preset Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900">{presetName} Preset</h3>
              <p className="text-sm text-blue-700">
                Optimized for {preset.width} × {preset.height} {preset.unit} 
                {preset.resizeMethod === 'fill' && ' (will crop to fit)'}
                {preset.resizeMethod === 'fit' && ' (will fit within bounds)'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          
          {/* Upload & Settings Section */}
          <div className="space-y-4 md:space-y-6">
            <UploadPreview
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
              maxSizeMB={10}
              storageKey={`preset-${presetName.toLowerCase().replace(/\s+/g, '-')}`}
              className="w-full"
              showPreview={false}
            />
            
            {/* Resize Settings with Preset */}
            {uploadedFile && (
              <ImageResizer
                imageData={originalImage}
                originalWidth={imageDimensions.width}
                originalHeight={imageDimensions.height}
                onResize={handleResize}
                preset={preset}
                className="w-full"
              />
            )}
          </div>

          {/* Download Section */}
          <div className="space-y-4 md:space-y-6">
            <Download
              imageData={processedImage || originalImage}
              originalFileName={`${originalFileName.replace(/\.[^/.]+$/, '')}-${presetName.toLowerCase().replace(/\s+/g, '-')}`}
              onDownload={handleDownload}
              defaultQuality={preset.quality}
              defaultFormat="jpeg"
              disabled={!originalImage}
              className="w-full"
              showPreview={!isMobile}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PresetToolContainer;