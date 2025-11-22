import React, { useState, useEffect } from 'react';
import UploadPreview from './UploadPreview';
import PassportCropper from './PassportCropper';
import PassportDimensionSelector from './PassportDimensionSelector';
import PaperTypeSelector from './PaperTypeSelector';
import PDFGenerator from './PDFGenerator';
import StickyPreview from './StickyPreview';

export interface PassportDimension {
  name: string;
  width: number;
  height: number;
  unit: 'mm' | 'in';
  description: string;
  country?: string;
}

export interface PaperSize {
  name: string;
  width: number;
  height: number;
  unit: 'mm' | 'in';
  maxPhotos: number;
}

const PassportToolContainer: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [croppedImage, setCroppedImage] = useState<string>('');
  const [originalFileName, setOriginalFileName] = useState<string>('passport');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [selectedDimension, setSelectedDimension] = useState<PassportDimension>({
    name: 'US Passport',
    width: 51,
    height: 51,
    unit: 'mm',
    description: 'Standard US passport photo',
    country: 'USA'
  });
  const [selectedPaper, setSelectedPaper] = useState<PaperSize>({
    name: '4×6 inch',
    width: 6,
    height: 4,
    unit: 'in',
    maxPhotos: 6
  });
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
    
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = dataUrl;
  };

  const handleImageRemove = () => {
    setUploadedFile(null);
    setOriginalImage('');
    setCroppedImage('');
    setOriginalFileName('passport');
    setImageDimensions({ width: 0, height: 0 });
  };

  const handleCrop = (croppedImageData: string) => {
    setCroppedImage(croppedImageData);
  };

  return (
    <>
      {/* Sticky Preview for Mobile */}
      <StickyPreview 
        imageData={croppedImage || originalImage}
        originalFileName={`${originalFileName.replace(/\.[^/.]+$/, '')}-passport`}
        isVisible={isMobile && !!uploadedFile}
        className="lg:hidden"
      />

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
        {/* Tool Info Banner */}
        {/* <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 md:p-8">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-crimson font-medium text-blue-900 mb-2">Passport Photo Grid Maker</h3>
              <p className="text-sm md:text-base text-blue-700 leading-relaxed">
                Create professional passport photos with precise cropping and generate printable PDF grids for official documents
              </p>
            </div>
          </div>
        </div> */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          
          {/* Upload & Settings Section */}
          <div className="space-y-6 md:space-y-8">
            <UploadPreview
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
              maxSizeMB={10}
              storageKey="passport-photo"
              className="w-full"
              showPreview={false}
            />
            
            {/* Dimension Selector */}
            {uploadedFile && (
              <PassportDimensionSelector
                selectedDimension={selectedDimension}
                onDimensionChange={setSelectedDimension}
                className="w-full"
              />
            )}

            {/* Paper Size Selector */}
            {uploadedFile && (
              <PaperTypeSelector
                selectedPaper={selectedPaper}
                onPaperChange={setSelectedPaper}
                className="w-full"
              />
            )}
          </div>

          {/* Cropper & Generate Section */}
          <div className="space-y-6 md:space-y-8">
            {/* Image Cropper */}
            {uploadedFile && (
              <PassportCropper
                imageData={originalImage}
                originalWidth={imageDimensions.width}
                originalHeight={imageDimensions.height}
                targetDimension={selectedDimension}
                onCrop={handleCrop}
                className="w-full"
              />
            )}

            {/* PDF Generator */}
            {croppedImage && (
              <PDFGenerator
                croppedImage={croppedImage}
                dimension={selectedDimension}
                paperSize={selectedPaper}
                fileName={`${originalFileName.replace(/\.[^/.]+$/, '')}-passport-grid`}
                className="w-full"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PassportToolContainer;
