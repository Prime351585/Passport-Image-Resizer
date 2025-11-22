import React, { useState } from 'react';
import type { PassportDimension, PaperSize } from './PassportToolContainer';

interface PDFGeneratorProps {
  croppedImage: string;
  dimension: PassportDimension;
  paperSize: PaperSize;
  fileName: string;
  className?: string;
}

const PDFGenerator: React.FC<PDFGeneratorProps> = ({
  croppedImage,
  dimension,
  paperSize,
  fileName,
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [gridPreview, setGridPreview] = useState<string>('');

  // Calculate photos per page
  const calculatePhotosPerPage = (): number => {
    // Convert everything to mm for calculation
    const paperWidthMm = paperSize.unit === 'mm' ? paperSize.width : paperSize.width * 25.4;
    const paperHeightMm = paperSize.unit === 'mm' ? paperSize.height : paperSize.height * 25.4;
    const photoWidthMm = dimension.unit === 'mm' ? dimension.width : dimension.width * 25.4;
    const photoHeightMm = dimension.unit === 'mm' ? dimension.height : dimension.height * 25.4;
    
    // Add margins (5mm on each side)
    const usableWidth = paperWidthMm - 10;
    const usableHeight = paperHeightMm - 10;
    
    // Add spacing between photos (2mm)
    const photosPerRow = Math.floor((usableWidth + 2) / (photoWidthMm + 2));
    const photosPerCol = Math.floor((usableHeight + 2) / (photoHeightMm + 2));
    
    return Math.max(1, photosPerRow * photosPerCol);
  };

  // Generate grid preview
  const generateGridPreview = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    // Convert dimensions to pixels (300 DPI)
    const dpi = 300;
    const paperWidthPx = paperSize.unit === 'mm' 
      ? Math.round((paperSize.width * dpi) / 25.4)
      : Math.round(paperSize.width * dpi);
    const paperHeightPx = paperSize.unit === 'mm'
      ? Math.round((paperSize.height * dpi) / 25.4)
      : Math.round(paperSize.height * dpi);
    
    const photoWidthPx = dimension.unit === 'mm'
      ? Math.round((dimension.width * dpi) / 25.4)
      : Math.round(dimension.width * dpi);
    const photoHeightPx = dimension.unit === 'mm'
      ? Math.round((dimension.height * dpi) / 25.4)
      : Math.round(dimension.height * dpi);

    canvas.width = paperWidthPx;
    canvas.height = paperHeightPx;

    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, paperWidthPx, paperHeightPx);

    // Load the cropped image
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = croppedImage;
    });

    // Calculate layout
    const marginPx = Math.round((5 * dpi) / 25.4); // 5mm margin
    const spacingPx = Math.round((2 * dpi) / 25.4); // 2mm spacing
    const usableWidth = paperWidthPx - (2 * marginPx);
    const usableHeight = paperHeightPx - (2 * marginPx);
    
    const photosPerRow = Math.floor((usableWidth + spacingPx) / (photoWidthPx + spacingPx));
    const photosPerCol = Math.floor((usableHeight + spacingPx) / (photoHeightPx + spacingPx));
    
    // Center the grid
    const totalGridWidth = (photosPerRow * photoWidthPx) + ((photosPerRow - 1) * spacingPx);
    const totalGridHeight = (photosPerCol * photoHeightPx) + ((photosPerCol - 1) * spacingPx);
    const startX = (paperWidthPx - totalGridWidth) / 2;
    const startY = (paperHeightPx - totalGridHeight) / 2;

    // Draw photos in grid
    for (let row = 0; row < photosPerCol; row++) {
      for (let col = 0; col < photosPerRow; col++) {
        const x = startX + (col * (photoWidthPx + spacingPx));
        const y = startY + (row * (photoHeightPx + spacingPx));
        
        // Draw photo
        ctx.drawImage(img, x, y, photoWidthPx, photoHeightPx);
        
        // Draw border
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, photoWidthPx, photoHeightPx);
      }
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  // Generate and download PDF
  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Dynamic import of jsPDF to avoid SSR issues
      const { jsPDF } = await import('jspdf');
      
      const gridImage = await generateGridPreview();
      
      // Convert paper size to points (72 DPI)
      const paperWidthPt = paperSize.unit === 'mm' 
        ? (paperSize.width * 72) / 25.4
        : paperSize.width * 72;
      const paperHeightPt = paperSize.unit === 'mm'
        ? (paperSize.height * 72) / 25.4
        : paperSize.height * 72;

      const pdf = new jsPDF({
        orientation: paperSize.width > paperSize.height ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [paperWidthPt, paperHeightPt]
      });

      // Add the grid image to PDF
      pdf.addImage(gridImage, 'JPEG', 0, 0, paperWidthPt, paperHeightPt);

      // Download the PDF
      pdf.save(`${fileName}.pdf`);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Preview the grid
  const previewGrid = async () => {
    try {
      const gridImage = await generateGridPreview();
      setGridPreview(gridImage);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview generation failed:', error);
    }
  };

  const photosPerPage = calculatePhotosPerPage();

  return (
    <div className={`bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h3 className="text-2xl md:text-3xl font-crimson font-medium text-gray-900">Generate PDF Grid</h3>
        </div>
        <p className="text-gray-500 text-sm">Create a printable PDF grid with your passport photos</p>
      </div>

      {/* Grid Info */}
      <div className="bg-gradient-to-br from-tertiary to-green-50 rounded-xl p-5 border-2 border-secondary/30">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-2xl">📸</span>
            </div>
            <div className="text-3xl font-crimson font-bold text-primary">{photosPerPage}</div>
            <div className="text-sm font-medium text-secondary mt-1">Photos per page</div>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-2xl">📐</span>
            </div>
            <div className="text-3xl font-crimson font-bold text-primary">
              {dimension.width}×{dimension.height}
            </div>
            <div className="text-sm font-medium text-secondary mt-1">Photo size ({dimension.unit})</div>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-2xl">📄</span>
            </div>
            <div className="text-3xl font-crimson font-bold text-primary">
              {paperSize.name.split(' ')[0]}
            </div>
            <div className="text-sm font-medium text-secondary mt-1">Paper size</div>
          </div>
        </div>
      </div>

      {/* Preview Button */}
      <button
        onClick={previewGrid}
        className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-br from-tertiary to-green-100 hover:from-green-100 hover:to-green-200 text-primary rounded-xl border-2 border-secondary/30 hover:border-secondary transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>
        <span className="font-crimson text-lg font-medium">Preview Grid Layout</span>
      </button>

      {/* Generate PDF Button */}
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-br from-secondary to-primary hover:from-primary hover:to-secondary disabled:from-green-300 disabled:to-green-400 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
      >
        {isGenerating ? (
          <>
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="font-crimson text-lg font-semibold">Generating PDF...</span>
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span className="font-crimson text-lg font-semibold">Download PDF Grid</span>
          </>
        )}
      </button>

      {/* Features List */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">✨</span>
          </div>
          <h4 className="text-lg font-crimson font-medium text-green-800">What you'll get:</h4>
        </div>
        <ul className="text-sm text-green-700 space-y-3">
          <li className="flex items-start space-x-3">
            <span className="text-green-500 mt-0.5">✓</span>
            <span className="font-medium">High-resolution PDF ready for printing</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="text-green-500 mt-0.5">✓</span>
            <span className="font-medium">Perfectly sized {dimension.width}×{dimension.height}{dimension.unit} photos</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="text-green-500 mt-0.5">✓</span>
            <span className="font-medium">Optimized layout for {paperSize.name} paper</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="text-green-500 mt-0.5">✓</span>
            <span className="font-medium">Professional quality at 300 DPI</span>
          </li>
        </ul>
      </div>

      {/* Preview Modal */}
      {showPreview && gridPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl max-h-full overflow-auto shadow-2xl">
            <div className="p-6 border-b-2 border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-white text-xl">👁️</span>
                </div>
                <h3 className="text-2xl font-crimson font-medium text-gray-900">Grid Preview</h3>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-300 flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="p-6">
              <img 
                src={gridPreview} 
                alt="Grid Preview" 
                className="w-full h-auto border-2 border-gray-300 rounded-xl shadow-lg"
              />
              <p className="text-base font-medium text-gray-700 mt-4 text-center">
                Preview of your {photosPerPage}-photo grid on {paperSize.name} paper
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFGenerator;
