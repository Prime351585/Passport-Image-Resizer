import React, { useState, useEffect } from 'react';
import UploadPreview from './UploadPreview';
import ImageResizer from './ImageResizer';
import Download from './Download';
import StickyPreview from './StickyPreview';

const ImageToolContainer: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [processedImage, setProcessedImage] = useState<string>('');
  const [originalFileName, setOriginalFileName] = useState<string>('image');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
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
    console.log(`Downloaded as ${format} with ${quality}% quality`);
  };

  return (
    <>
      {/* Sticky Preview for Mobile */}
      <StickyPreview 
        imageData={processedImage || originalImage}
        originalFileName={originalFileName}
        isVisible={isMobile && !!uploadedFile}
        className="lg:hidden"
      />

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          
          {/* Upload & Settings Section */}
          <div className="space-y-4 md:space-y-6">
            <UploadPreview
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
              maxSizeMB={10}
              storageKey="resize-tool-image"
              className="w-full"
              showPreview={false} // No preview in upload component
            />
            
            {/* Resize Settings */}
            {uploadedFile && (
              <ImageResizer
                imageData={originalImage}
                originalWidth={imageDimensions.width}
                originalHeight={imageDimensions.height}
                onResize={handleResize}
                className="w-full"
              />
            )}
          </div>

          {/* Download Section */}
          <div className="space-y-4 md:space-y-6">
            <Download
              imageData={processedImage || originalImage}
              originalFileName={originalFileName}
              onDownload={handleDownload}
              defaultQuality={100}
              defaultFormat="jpeg"
              disabled={!originalImage}
              className="w-full"
              showPreview={!isMobile} // Show preview only on desktop
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ImageToolContainer;