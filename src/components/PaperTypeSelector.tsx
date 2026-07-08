import React from 'react';
import type {PaperSize, PassportDimension} from './PassportToolContainer';

interface PaperTypeSelectorProps {
  selectedPaper: PaperSize;
  onPaperChange: (paper: PaperSize) => void;
  photoDimension: PassportDimension;
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
  photoDimension,
  className = ''
}) => {
  const calculatePhotosPerPage = (paper: PaperSize, photoWidth: number | '', photoHeight: number | '', unit: 'mm' | 'in'): number => {
    const w = photoWidth || 35;
    const h = photoHeight || 45;

    // Convert everything to mm for calculation
    const paperWidthMm = paper.unit === 'mm' ? paper.width : paper.width * 25.4;
    const paperHeightMm = paper.unit === 'mm' ? paper.height : paper.height * 25.4;
    const photoWidthMm = unit === 'mm' ? w : w * 25.4;
    const photoHeightMm = unit === 'mm' ? h : h * 25.4;
    
    // Add margins (5mm on each side)
    const usableWidth = paperWidthMm - 10;
    const usableHeight = paperHeightMm - 10;
    
    // Add spacing between photos (2mm)
    const photosPerRow = Math.floor((usableWidth + 2) / (photoWidthMm + 2));
    const photosPerCol = Math.floor((usableHeight + 2) / (photoHeightMm + 2));
    
    return Math.max(1, photosPerRow * photosPerCol);
  };

  const selectedMaxPhotos = calculatePhotosPerPage(
    selectedPaper,
    photoDimension.width,
    photoDimension.height,
    photoDimension.unit
  );

  return (
    <div className={`bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h3 className="text-2xl md:text-3xl font-crimson font-medium text-gray-900">Paper Size</h3>
        </div>
        <p className="text-gray-500 text-sm">Select the paper size for your printable grid</p>
      </div>

      {/* Selected Paper Info */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-2xl">📄</span>
            </div>
            <div>
              <h4 className="text-lg font-crimson font-medium text-green-900">{selectedPaper.name}</h4>
              <p className="text-sm font-medium text-green-700 mt-1">
                {selectedPaper.width} × {selectedPaper.height} {selectedPaper.unit}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-crimson font-bold text-green-900">
              ~{selectedMaxPhotos}
            </p>
            <p className="text-sm text-green-600">photos/page</p>
          </div>
        </div>
      </div>

      {/* Paper Size Grid */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-lg">📏</span>
          </div>
          <h4 className="text-lg font-crimson font-medium text-gray-900">Available Sizes</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PAPER_SIZES.map((paper) => {
            const paperMaxPhotos = calculatePhotosPerPage(
              paper,
              photoDimension.width,
              photoDimension.height,
              photoDimension.unit
            );
            return (
              <button
                key={paper.name}
                onClick={() => onPaperChange({ ...paper, maxPhotos: paperMaxPhotos })}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                  selectedPaper.name === paper.name
                    ? 'border-primary bg-gradient-to-br from-green-50 to-emerald-50 shadow-md scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:scale-105'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-xl">📄</span>
                    </div>
                    <div>
                      <h4 className="font-crimson font-medium text-gray-900 text-base">
                        {paper.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {paper.width} × {paper.height} {paper.unit}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-crimson font-bold text-gray-900">
                      ~{paperMaxPhotos}
                    </p>
                    <p className="text-xs text-gray-500">photos</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Paper Size Preview */}
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border-2 border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <span className="text-white text-lg">👁️</span>
          </div>
          <h4 className="text-base font-crimson font-medium text-gray-900">Page Layout Preview</h4>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="relative bg-white border-2 border-gray-300 rounded-lg shadow-lg" 
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
                   gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(selectedMaxPhotos))}, 1fr)`,
                   gridTemplateRows: `repeat(${Math.ceil(selectedMaxPhotos / Math.ceil(Math.sqrt(selectedMaxPhotos)))}, 1fr)`
                 }}>
              {Array.from({ length: selectedMaxPhotos }).map((_, i) => (
                <div key={i} className="bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-300 rounded-sm"></div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600 text-center mt-3">
          Approximate layout with {selectedMaxPhotos} photos
        </p>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-5">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl">💡</span>
          </div>
          <div className="space-y-1">
            <h4 className="font-crimson font-medium text-amber-900 text-base">Printing Tip</h4>
            <p className="text-sm text-amber-800 leading-relaxed">
              When printing the generated PDF, make sure to set the scale to <span className="font-bold">"Actual Size"</span> or <span className="font-bold">"100%"</span> in your printer settings. Do not select "Fit to Page" as it will alter the official dimensions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperTypeSelector;
