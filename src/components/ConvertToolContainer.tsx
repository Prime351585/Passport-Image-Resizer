import React, { useState, useEffect } from 'react';
import UploadPreview from './UploadPreview';
import FormatConverter from './Converter';
import Download from './Download';
import StickyPreview from './StickyPreview';

const ConvertToolContainer: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [convertedImage, setConvertedImage] = useState<string>('');
  const [originalFileName, setOriginalFileName] = useState<string>('image');
  const [targetFormat, setTargetFormat] = useState<string>('jpeg');
  const [quality, setQuality] = useState<number>(95);
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
    
    // Reset converted image until format conversion happens
    setConvertedImage('');
    setTargetFormat('jpeg');
    setQuality(95);
  };

  const handleImageRemove = () => {
    setUploadedFile(null);
    setOriginalImage('');
    setConvertedImage('');
    setOriginalFileName('image');
    setTargetFormat('jpeg');
    setQuality(95);
  };

  // Handle format change from FormatConverter (2 parameters)
  const handleFormatChange = (format: string, convertedImageData: string) => {
    setTargetFormat(format);
    setConvertedImage(convertedImageData);
    // Set default quality based on format
    setQuality(format === 'png' ? 100 : 95);
  };

  const handleDownload = (format: string, quality: number) => {
    console.log(`Downloaded as ${format} with ${quality}% quality`);
  };

  // Get file extension from uploaded file
  const getOriginalFormat = () => {
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
        imageData={convertedImage || originalImage}
        originalFileName={`${originalFileName.replace(/\.[^/.]+$/, '')}-converted`}
        isVisible={isMobile && !!uploadedFile}
        className="lg:hidden"
      />

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          
          {/* Upload & Convert Section */}
          <div className="space-y-4 md:space-y-6">
            <UploadPreview
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
              maxSizeMB={10}
              storageKey="convert-tool-image"
              className="w-full"
              showPreview={false}
            />
            
            {/* Format Converter */}
            {uploadedFile && (
              <>
                {/* Original Format Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Original Format</h4>
                      <p className="text-lg font-semibold text-gray-900">{getOriginalFormat()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">File Size</p>
                      <p className="text-sm font-medium text-gray-900">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>

                <FormatConverter
                  imageData={originalImage}
                  originalFormat={getOriginalFormat()}
                  onFormatChange={handleFormatChange}
                  className="w-full"
                />
              </>
            )}
          </div>

          {/* Download Section */}
          <div className="space-y-4 md:space-y-6">
            <Download
              imageData={convertedImage || originalImage} // Use converted image if available, otherwise original
              originalFileName={`${originalFileName.replace(/\.[^/.]+$/, '')}-converted`}
              onDownload={handleDownload}
              defaultQuality={quality}
              defaultFormat={targetFormat}
              disabled={!originalImage}
              className="w-full"
              showPreview={!isMobile}
              hideFormatSelector={true} // Hide format selection in download
              hideQualityControls={false} // Show quality controls in download
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

export default ConvertToolContainer;