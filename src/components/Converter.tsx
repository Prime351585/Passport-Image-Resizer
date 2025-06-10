import React, { useState, useCallback, useEffect } from 'react';
import { createImageBlob, formatFileSize } from '../utils/canvasUtils';

interface FormatConverterProps {
  imageData?: string;
  originalFormat?: string;
  onFormatChange?: (format: string, convertedImage: string) => void;
  className?: string;
}

const FORMATS = [
  { 
    value: 'jpeg', 
    label: 'JPEG', 
    extension: 'jpg',
    description: 'Best for photos. Smaller file sizes.',
    color: 'bg-blue-500'
  },
  { 
    value: 'png', 
    label: 'PNG', 
    extension: 'png',
    description: 'Best for graphics with transparency.',
    color: 'bg-green-500'
  },
  { 
    value: 'webp', 
    label: 'WebP', 
    extension: 'webp',
    description: 'Modern format with excellent compression.',
    color: 'bg-purple-500'
  }
];

const FormatConverter: React.FC<FormatConverterProps> = ({
  imageData,
  originalFormat = '',
  onFormatChange,
  className = ''
}) => {
  const [selectedFormat, setSelectedFormat] = useState('jpeg');
  const [isConverting, setIsConverting] = useState(false);
  const [originalImageSize, setOriginalImageSize] = useState<number>(0);
  const [hasConverted, setHasConverted] = useState(false);


  // Extract original file size from data URL
  const getOriginalImageSize = useCallback((dataUrl: string): number => {
    try {
      const base64 = dataUrl.split(',')[1];
      if (!base64) return 0;
      
      const base64Size = base64.length;
      const originalSize = Math.round((base64Size * 3) / 4);
      
      return originalSize;
    } catch (error) {
      console.error('Failed to calculate original image size:', error);
      return 0;
    }
  }, []);

  // Convert image format at high quality (95% for lossy, 100% for lossless)
  const convertImage = useCallback(async () => {
    if (!imageData) return;

    setIsConverting(true);
    
    try {
      // Get original image size (only once)
      if (originalImageSize === 0) {
        const origSize = getOriginalImageSize(imageData);
        setOriginalImageSize(origSize);
      }

      // Convert to selected format at high quality
      const quality = selectedFormat === 'png' ? 100 : 95; // PNG is lossless, others at 95%
      const result = await createImageBlob(imageData, selectedFormat, quality);

      if (!result) {
        throw new Error('Failed to convert image');
      }

      // Set converted size
      const convertedSizeValue = result.size;
      
   

      setHasConverted(true);
      onFormatChange?.(selectedFormat, result.dataUrl);
      
    } catch (error) {
      console.error('Conversion failed:', error);

    } finally {
      setIsConverting(false);
    }
  }, [imageData, selectedFormat, originalImageSize, onFormatChange, getOriginalImageSize]);

  // Reset when image changes
  useEffect(() => {
    if (imageData) {
      setHasConverted(false);
      setOriginalImageSize(0);
    }
  }, [imageData]);

  

  // Auto-convert when settings change
  useEffect(() => {
    if (imageData) {
      const debounceTimer = setTimeout(convertImage, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [convertImage]);

  const handleFormatSelect = (format: string) => {
    setSelectedFormat(format);
  };

  // Get format conversion info
  const getConversionInfo = () => {
    const fromFormat = originalFormat.toLowerCase();
    const toFormat = selectedFormat.toLowerCase();
    
    if (fromFormat.includes('jpeg') || fromFormat.includes('jpg')) {
      if (toFormat === 'png') {
        return {
          type: 'lossy-to-lossless',
          message: 'Converting from JPEG (lossy) to PNG (lossless) will preserve maximum quality but increase file size.'
        };
      } else if (toFormat === 'webp') {
        return {
          type: 'optimization',
          message: 'WebP typically provides better compression than JPEG with similar quality.'
        };
      }
    } else if (fromFormat.includes('png')) {
      if (toFormat === 'jpeg') {
        return {
          type: 'lossless-to-lossy',
          message: 'Converting from PNG (lossless) to JPEG (lossy) will reduce file size but may lose transparency.'
        };
      } else if (toFormat === 'webp') {
        return {
          type: 'optimization',
          message: 'WebP can provide better compression than PNG while maintaining transparency support.'
        };
      }
    }
    
    return null;
  };

  const conversionInfo = getConversionInfo();

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 md:p-6 space-y-4 md:space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-medium text-gray-900">Convert Format</h3>
        <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
        </svg>
      </div>

      {/* Conversion Info Banner */}
      {conversionInfo && (
        <div className={`p-3 rounded-lg border ${
          conversionInfo.type === 'lossy-to-lossless' ? 'bg-yellow-50 border-yellow-200' :
          conversionInfo.type === 'lossless-to-lossy' ? 'bg-orange-50 border-orange-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start space-x-2">
            <svg className={`w-4 h-4 mt-0.5 ${
              conversionInfo.type === 'lossy-to-lossless' ? 'text-yellow-600' :
              conversionInfo.type === 'lossless-to-lossy' ? 'text-orange-600' :
              'text-blue-600'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className={`text-xs ${
              conversionInfo.type === 'lossy-to-lossless' ? 'text-yellow-800' :
              conversionInfo.type === 'lossless-to-lossy' ? 'text-orange-800' :
              'text-blue-800'
            }`}>
              {conversionInfo.message}
            </p>
          </div>
        </div>
      )}

      {/* Format Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Choose Target Format</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FORMATS.map((format) => {
            const isSelected = selectedFormat === format.value;
            const isOriginal = originalFormat.toLowerCase().includes(format.value) || 
                             (format.value === 'jpeg' && originalFormat.toLowerCase().includes('jpg'));
            
            return (
              <button
                key={format.value}
                onClick={() => handleFormatSelect(format.value)}
                disabled={isOriginal}
                className={`
                  relative p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : isOriginal
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${format.color}`}></div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {format.label}
                      {isOriginal && <span className="ml-1 text-xs text-gray-500">(Current)</span>}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">{format.description}</p>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversion Status */}
      {isConverting && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Converting...</span>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default FormatConverter;