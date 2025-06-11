import React from 'react';
import type {PaperSize} from './PassportToolContainer';

interface PaperTypeSelectorProps {
  selectedPaper: PaperSize;
  onPaperChange: (paper: PaperSize) => void;
  className?: string;
}

const PAPER_SIZES: PaperSize[] = [
  {
    name: '4×6 inch',
    width: 6,
    height: 4,
    unit: 'in',
    maxPhotos: 6
  },
  {
    name: '5×7 inch',
    width: 7,
    height: 5,
    unit: 'in',
    maxPhotos: 8
  },
  {
    name: '8×10 inch',
    width: 10,
    height: 8,
    unit: 'in',
    maxPhotos: 15
  },
  {
    name: 'A4 (210×297mm)',
    width: 297,
    height: 210,
    unit: 'mm',
    maxPhotos: 16
  },
  {
    name: 'A5 (148×210mm)',
    width: 210,
    height: 148,
    unit: 'mm',
    maxPhotos: 8
  },
  {
    name: 'Letter (8.5×11 inch)',
    width: 11,
    height: 8.5,
    unit: 'in',
    maxPhotos: 12
  }
];

const PaperTypeSelector: React.FC<PaperTypeSelectorProps> = ({
  selectedPaper,
  onPaperChange,
  className = ''
}) => {
  const calculatePhotosPerPage = (paper: PaperSize, photoWidth: number, photoHeight: number, unit: 'mm' | 'in'): number => {
    // Convert everything to mm for calculation
    const paperWidthMm = paper.unit === 'mm' ? paper.width : paper.width * 25.4;
    const paperHeightMm = paper.unit === 'mm' ? paper.height : paper.height * 25.4;
    const photoWidthMm = unit === 'mm' ? photoWidth : photoWidth * 25.4;
    const photoHeightMm = unit === 'mm' ? photoHeight : photoHeight * 25.4;
    
    // Add margins (5mm on each side)
    const usableWidth = paperWidthMm - 10;
    const usableHeight = paperHeightMm - 10;
    
    // Add spacing between photos (2mm)
    const photosPerRow = Math.floor((usableWidth + 2) / (photoWidthMm + 2));
    const photosPerCol = Math.floor((usableHeight + 2) / (photoHeightMm + 2));
    
    return Math.max(1, photosPerRow * photosPerCol);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 md:p-6 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-medium text-gray-900">Paper Size</h3>
        <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      </div>

      {/* Selected Paper Info */}
      <div className="bg-green-50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-green-900">{selectedPaper.name}</h4>
            <p className="text-sm text-green-700">
              {selectedPaper.width} × {selectedPaper.height} {selectedPaper.unit}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-green-900">
              ~{selectedPaper.maxPhotos} photos
            </p>
            <p className="text-xs text-green-600">per page</p>
          </div>
        </div>
      </div>

      {/* Paper Size Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PAPER_SIZES.map((paper) => (
          <button
            key={paper.name}
            onClick={() => onPaperChange(paper)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              selectedPaper.name === paper.name
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 text-sm">
                  {paper.name}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {paper.width} × {paper.height} {paper.unit}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  ~{paper.maxPhotos}
                </p>
                <p className="text-xs text-gray-500">photos</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Paper Size Preview */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Page Layout Preview</h4>
        <div className="flex items-center justify-center">
          <div className="relative bg-white border-2 border-gray-300 rounded shadow-sm" 
               style={{ 
                 width: '120px', 
                 height: selectedPaper.width > selectedPaper.height ? '85px' : '120px',
                 aspectRatio: selectedPaper.width > selectedPaper.height 
                   ? `${selectedPaper.width}/${selectedPaper.height}` 
                   : `${selectedPaper.height}/${selectedPaper.width}`
               }}>
            {/* Grid lines to show photo layout */}
            <div className="absolute inset-1 grid gap-0.5" 
                 style={{ 
                   gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(selectedPaper.maxPhotos))}, 1fr)`,
                   gridTemplateRows: `repeat(${Math.ceil(selectedPaper.maxPhotos / Math.ceil(Math.sqrt(selectedPaper.maxPhotos)))}, 1fr)`
                 }}>
              {Array.from({ length: selectedPaper.maxPhotos }).map((_, i) => (
                <div key={i} className="bg-blue-100 border border-blue-200 rounded-sm"></div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-600 text-center mt-2">
          Approximate layout with {selectedPaper.maxPhotos} photos
        </p>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h5 className="text-sm font-medium text-amber-800">Printing Tips</h5>
            <ul className="text-xs text-amber-700 mt-1 space-y-1">
              <li>• Use high-quality photo paper for best results</li>
              <li>• Print at 300 DPI or higher for sharp photos</li>
              <li>• Check your printer settings for borderless printing</li>
              <li>• Cut carefully along the guides for precise photos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperTypeSelector;
