// filepath: c:\Users\HARSH\OneDrive\Desktop\squealing-star\src\components\StickyPreview.tsx
import React from 'react';

interface StickyPreviewProps {
  imageData?: string;
  originalFileName?: string;
  isVisible: boolean;
  className?: string;
}

const StickyPreview: React.FC<StickyPreviewProps> = ({
  imageData,
  originalFileName = 'image',
  isVisible,
  className = ''
}) => {
  if (!isVisible || !imageData) return null;

  return (
    <div className={`sticky top-14 z-30 bg-white border-b border-gray-200 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Preview</h3>
          <span className="text-xs text-gray-500 truncate ml-2 max-w-32" title={originalFileName}>
            {originalFileName}
          </span>
        </div>
        
        <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
          <img
            src={imageData}
            alt="Preview"
            className="w-full h-50 sm:h-40 object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default StickyPreview;