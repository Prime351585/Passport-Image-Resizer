import React, { useState, useEffect } from 'react';
import UploadPreview from './UploadPreview';
import CompressTool from './CompressTool';
import Download from './Download';
import StickyPreview from './StickyPreview';

interface CompressionResult {
  compressedImage: string;
  compressedSize: number;
  actualQuality: number;
}

const CompressToolContainer: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>('image');
  const [originalFormat, setOriginalFormat] = useState<string>('jpeg');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile view
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
    
    // Detect original format
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg': 
        setOriginalFormat('jpeg');
        break;
      case 'png': 
        setOriginalFormat('png');
        break;
      case 'webp': 
        setOriginalFormat('webp');
        break;
      default: 
        setOriginalFormat('jpeg');
    }
    
    // Reset compression result
    setCompressionResult(null);
  };

  const handleImageRemove = () => {
    setUploadedFile(null);
    setOriginalImage('');
    setCompressionResult(null);
    setOriginalFileName('image');
    setOriginalFormat('jpeg');
  };

  // Handle compression from CompressTool - now receives size data too
  const handleCompressionChange = (compressedImageData: string, compressedSize: number, actualQuality?: number) => {
    setCompressionResult({
      compressedImage: compressedImageData,
      compressedSize,
      actualQuality: actualQuality || 100
    });
  };

  const handleDownload = (format: string, quality: number) => {
    console.log(`Downloaded compressed image as ${format} with ${quality}% quality`);
  };

  const getOriginalFormatDisplay = () => {
    if (!uploadedFile) return '';
    const extension = uploadedFile.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg': return 'JPEG';
      case 'png': return 'PNG';
      case 'webp': return 'WebP';
      default: return extension?.toUpperCase() || '';
    }
  };

  return (
    <>
      {/* Sticky Preview for Mobile */}
      <StickyPreview 
        imageData={compressionResult?.compressedImage || originalImage}
        originalFileName={`${originalFileName.replace(/\.[^/.]+$/, '')}-compressed`}
        isVisible={isMobile && !!uploadedFile}
        className="lg:hidden"
      />

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          
          {/* Upload & Compress Section */}
          <div className="space-y-4 md:space-y-6">
            <UploadPreview
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
              maxSizeMB={10}
              storageKey="compress-tool-image"
              className="w-full"
              showPreview={false}
            />
            
            {/* Compression Tool */}
            {uploadedFile && (
              <>
                {/* Original File Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Original File</h4>
                      <p className="text-lg font-semibold text-gray-900">{getOriginalFormatDisplay()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">File Size</p>
                      <p className="text-sm font-medium text-gray-900">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>

                <CompressTool
                  imageData={originalImage}
                  originalFormat={originalFormat}
                  originalFileSize={uploadedFile.size}
                  onCompressionChange={handleCompressionChange}
                  className="w-full"
                />
              </>
            )}
          </div>

          {/* Download Section */}
          <div className="space-y-4 md:space-y-6">
            <Download
              imageData={compressionResult?.compressedImage || originalImage}
              originalFileName={`${originalFileName.replace(/\.[^/.]+$/, '')}-compressed`}
              onDownload={handleDownload}
              defaultQuality={compressionResult?.actualQuality || 95}
              defaultFormat={originalFormat}
              disabled={!originalImage}
              className="w-full"
              showPreview={!isMobile}
              hideFormatSelector={true}
              hideQualityControls={true}
              // Pass the actual compressed size so Download doesn't recalculate
              preCalculatedSize={compressionResult?.compressedSize}
              availableFormats={[
                { value: 'jpeg', label: 'JPEG', extension: 'jpg' },
                { value: 'png', label: 'PNG', extension: 'png' },
                { value: 'webp', label: 'WebP', extension: 'webp' }
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default CompressToolContainer;