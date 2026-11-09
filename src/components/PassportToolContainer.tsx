import React, { useState, useEffect } from 'react';
import UploadPreview from './UploadPreview';
import PassportCropper, { type CropArea } from './PassportCropper';
import { canvasToBlob, encodeToTargetSize, loadImage, makeCanvas, withExt } from '../utils/imageOutput';
import PassportDimensionSelector from './PassportDimensionSelector';
import PaperTypeSelector from './PaperTypeSelector';
import PDFGenerator from './PDFGenerator';
import StickyPreview from './StickyPreview';

export interface PassportDimension {
  name: string;
  width: number | '';
  height: number | '';
  unit: 'mm' | 'in';
  description: string;
  country?: string;
  /** Official digital-upload spec, when the country has one. */
  digital?: DigitalSpec;
}

export interface DigitalSpec {
  width: number;   // output pixels
  height: number;
  minKB?: number;
  maxKB?: number;
}

export interface PaperSize {
  name: string;
  width: number;
  height: number;
  unit: 'mm' | 'in';
  maxPhotos: number;
}

export interface PassportToolContainerProps {
  initialDimension?: PassportDimension;
}

const PassportToolContainer: React.FC<PassportToolContainerProps> = ({ initialDimension }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [croppedImage, setCroppedImage] = useState<string>('');
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [originalFileName, setOriginalFileName] = useState<string>('passport');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [selectedDimension, setSelectedDimension] = useState<PassportDimension>(initialDimension || {
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

  const handleCrop = (croppedImageData: string, crop: CropArea) => {
    setCroppedImage(croppedImageData);
    setCropArea(crop);
  };

  // Digital photo for online applications. Uses the country's official pixel
  // spec when known; otherwise a sharp 1200px-tall image at the print ratio.
  // If the spec's ratio differs from the print ratio, the frame is widened or
  // narrowed around its centre (same head height) so nothing is stretched.
  const digitalSpec = (): DigitalSpec => {
    if (selectedDimension.digital) return selectedDimension.digital;
    const r = (Number(selectedDimension.width) || 35) / (Number(selectedDimension.height) || 45);
    return { width: Math.round(1200 * r), height: 1200 };
  };

  const downloadDigital = async () => {
    if (!cropArea || !originalImage) return;
    setIsExporting(true);
    try {
      const spec = digitalSpec();
      const img = await loadImage(originalImage);
      const aspect = spec.width / spec.height;
      let h = cropArea.height, w = h * aspect;
      if (w > img.naturalWidth) { w = img.naturalWidth; h = w / aspect; }
      const cx = cropArea.x + cropArea.width / 2, cy = cropArea.y + cropArea.height / 2;
      const sx = Math.max(0, Math.min(cx - w / 2, img.naturalWidth - w));
      const sy = Math.max(0, Math.min(cy - h / 2, img.naturalHeight - h));
      const { canvas, ctx } = makeCanvas(spec.width, spec.height, 'image/jpeg');
      ctx.drawImage(img, sx, sy, w, h, 0, 0, spec.width, spec.height);
      let blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      // Some portals reject files that are too small (e.g. NZ needs 250 KB+).
      if (spec.minKB && blob.size < spec.minKB * 1024) blob = await canvasToBlob(canvas, 'image/jpeg', 1);
      if (spec.maxKB && blob.size > spec.maxKB * 1024) {
        const out = await loadImage(canvas.toDataURL('image/jpeg', 0.95));
        blob = (await encodeToTargetSize(out, 'image/jpeg', spec.maxKB * 1024)).blob;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = withExt(originalFileName, 'jpg', '-passport-digital');
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } finally {
      setIsExporting(false);
    }
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

        <div className={`grid grid-cols-1 ${uploadedFile ? 'xl:grid-cols-2' : ''} gap-6 md:gap-8`}>
          
          {/* Upload & Settings Section */}
          <div className={`space-y-6 md:space-y-8 ${!uploadedFile ? 'max-w-3xl mx-auto w-full' : ''}`}>
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
                isPreSelected={!!initialDimension}
                className="w-full"
              />
            )}

            {/* Paper Size Selector */}
            {uploadedFile && (
              <PaperTypeSelector
                selectedPaper={selectedPaper}
                onPaperChange={setSelectedPaper}
                photoDimension={selectedDimension}
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

            {/* Digital photo (online applications) */}
            {croppedImage && cropArea && (
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 space-y-3">
                <h3 className="text-2xl font-crimson font-medium text-gray-900">Digital photo</h3>
                <p className="text-sm text-gray-600">For online applications. JPG, {digitalSpec().width}×{digitalSpec().height} px{selectedDimension.digital?.maxKB ? `, under ${selectedDimension.digital.maxKB >= 1024 ? Math.ceil(selectedDimension.digital.maxKB / 1024) + ' MB' : selectedDimension.digital.maxKB + ' KB'}` : ''}.</p>
                <button type="button" onClick={downloadDigital} disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-white transition-colors disabled:opacity-50">
                  {isExporting ? 'Preparing…' : 'Download digital photo (JPG)'}
                </button>
              </div>
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
