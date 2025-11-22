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
    <div className={`sticky top-[80px] md:top-20 z-30 bg-white/95 backdrop-blur-sm border-b-2 border-gray-200 shadow-lg transition-all duration-300 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <svg 
                className="w-5 h-5 text-primary" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-crimson text-lg md:text-xl font-semibold text-gray-900">
                Preview
              </h3>
              <p className="text-xs text-primary">Live preview of your image</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1.5 max-w-[150px] sm:max-w-xs">
            <svg 
              className="w-4 h-4 text-gray-500 flex-shrink-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span 
              className="text-xs text-gray-600 truncate font-medium" 
              title={originalFileName}
            >
              {originalFileName}
            </span>
          </div>
        </div>
        
        {/* Image Preview Container */}
        <div className="relative group">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-primary/30">
            <div className="relative bg-white">
              {/* Checkerboard pattern background for transparency */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: 'linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}
              />
              
              <img
                src={imageData}
                alt="Preview"
                className="relative w-full h-40 sm:h-48 md:h-56 object-contain p-4 transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>
            
            {/* Bottom gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
          </div>
          
          {/* Corner decoration */}
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-primary rounded-full opacity-20 blur-xl transition-opacity duration-300 group-hover:opacity-40" />
          <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-purple-500 rounded-full opacity-20 blur-xl transition-opacity duration-300 group-hover:opacity-40" />
        </div>
      </div>
    </div>
  );
};

export default StickyPreview;