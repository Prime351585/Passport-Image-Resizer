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
    <div className={`bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 space-y-6 md:space-y-8 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
            </svg>
          </div>
          <h3 className="text-2xl md:text-3xl font-crimson font-medium text-gray-900">Convert Format</h3>
        </div>
        <p className="text-gray-500 text-sm">Transform your image between different formats</p>
      </div>

      {/* Conversion Info Banner */}
      {conversionInfo && (
        <div className={`p-4 rounded-xl border-2 ${
          conversionInfo.type === 'lossy-to-lossless' ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' :
          conversionInfo.type === 'lossless-to-lossy' ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200' :
          'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
        }`}>
          <div className="flex items-start space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              conversionInfo.type === 'lossy-to-lossless' ? 'bg-gradient-to-br from-yellow-500 to-amber-500' :
              conversionInfo.type === 'lossless-to-lossy' ? 'bg-gradient-to-br from-orange-500 to-red-500' :
              'bg-gradient-to-br from-blue-500 to-indigo-500'
            }`}>
              <span className="text-white text-lg">
                {conversionInfo.type === 'lossy-to-lossless' ? '⚡' :
                 conversionInfo.type === 'lossless-to-lossy' ? '⚠️' : 'ℹ️'}
              </span>
            </div>
            <p className={`text-sm font-medium ${
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
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-lg">🎨</span>
          </div>
          <h4 className="text-lg font-crimson font-medium text-gray-900">Choose Target Format</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  relative p-5 rounded-xl border-2 text-left transition-all duration-300
                  ${isSelected 
                    ? 'border-primary bg-gradient-to-br from-purple-50 to-pink-50 shadow-md scale-105' 
                    : isOriginal
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:scale-105'
                  }
                `}
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-lg ${format.color} flex items-center justify-center`}>
                    <span className="text-white text-xl font-bold">{format.label.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-crimson font-medium text-gray-900">
                      {format.label}
                      {isOriginal && <span className="ml-2 text-xs font-normal text-gray-500">(Current)</span>}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="w-5 h-5 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-base font-crimson font-medium text-gray-900">Converting your image...</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {hasConverted && !isConverting && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <span className="text-white text-2xl">✓</span>
            </div>
            <div>
              <h4 className="text-lg font-crimson font-medium text-green-800">Conversion Complete!</h4>
              <p className="text-sm text-green-700 mt-1">Your image has been converted to {FORMATS.find(f => f.value === selectedFormat)?.label} format</p>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default FormatConverter;