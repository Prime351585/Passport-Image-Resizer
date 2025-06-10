import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createImageBlob, formatFileSize } from '../utils/canvasUtils';

interface CompressToolProps {
  imageData?: string;
  originalFormat?: string;
  originalFileSize?: number;
  onCompressionChange?: (compressedImage: string, compressedSize: number, actualQuality?: number) => void;
  className?: string;
}

type CompressionMode = 'percentage' | 'target-size';

const CompressTool: React.FC<CompressToolProps> = ({
  imageData,
  originalFormat = 'jpeg',
  originalFileSize = 0,
  onCompressionChange,
  className = ''
}) => {
  const [compressionMode, setCompressionMode] = useState<CompressionMode>('percentage');
  const [compressionPercentage, setCompressionPercentage] = useState(75);
  const [targetSizeKB, setTargetSizeKB] = useState(500);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedSize, setCompressedSize] = useState<string>('');
  const [actualCompressionPercentage, setActualCompressionPercentage] = useState<number>(0);
  const [hasCompressed, setHasCompressed] = useState(false);
  const [compressionError, setCompressionError] = useState(false);
  const [maxSizeKB, setMaxSizeKB] = useState(1000);
  const [minSizeKB, setMinSizeKB] = useState(10);

  // Use refs to track the current values without causing re-renders
  const onCompressionChangeRef = useRef(onCompressionChange);
  onCompressionChangeRef.current = onCompressionChange;

  // Calculate size limits based on original file
  useEffect(() => {
    if (originalFileSize > 0) {
      const originalSizeKB = Math.round(originalFileSize / 1024);
      setMaxSizeKB(originalSizeKB);
      setMinSizeKB(Math.max(10, Math.round(originalSizeKB * 0.05)));
      setTargetSizeKB(Math.round(originalSizeKB * 0.5));
    }
  }, [originalFileSize]);

  // Compress to target size using binary search
  const compressToTargetSize = useCallback(async (targetBytes: number): Promise<{ blob: Blob; quality: number } | null> => {
    if (!imageData) return null;
    
    if (originalFormat === 'png') {
      const result = await createImageBlob(imageData, originalFormat, 100);
      return result ? { blob: result.blob, quality: 100 } : null;
    }

    let low = 1;
    let high = 100;
    let bestResult: { blob: Blob; quality: number } | null = null;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const result = await createImageBlob(imageData, originalFormat, mid);
      
      if (result) {
        if (result.size <= targetBytes) {
          bestResult = { blob: result.blob, quality: mid };
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      } else {
        break;
      }
    }
    
    return bestResult;
  }, [imageData, originalFormat]);

  // Reset when image changes
  useEffect(() => {
    if (imageData) {
      setHasCompressed(false);
      setCompressionError(false);
    }
  }, [imageData]);

  // Auto-compress when settings change - FIXED: removed compressImage from dependencies
  useEffect(() => {
    if (!imageData || isCompressing) return;

    const compressImage = async () => {
      setIsCompressing(true);
      setCompressionError(false);
      
      try {
        let result: { blob: Blob; dataUrl: string; size: number } | null = null;
        let finalQuality = compressionPercentage;

        if (compressionMode === 'percentage') {
          result = await createImageBlob(imageData, originalFormat, compressionPercentage);
        } else {
          const targetBytes = targetSizeKB * 1024;
          const compressResult = await compressToTargetSize(targetBytes);
          
          if (compressResult) {
            finalQuality = compressResult.quality;
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(compressResult.blob);
            });
            
            result = {
              blob: compressResult.blob,
              dataUrl,
              size: compressResult.blob.size
            };
          }
        }

        if (!result) {
          throw new Error('Failed to compress image');
        }

        // Calculate actual compression percentage
        const originalSizeKB = originalFileSize / 1024;
        const compressedSizeKB = result.size / 1024;
        const compressionPercent = ((originalSizeKB - compressedSizeKB) / originalSizeKB) * 100;

        setCompressedSize(formatFileSize(result.size));
        setActualCompressionPercentage(Math.max(0, compressionPercent));
        setHasCompressed(true);

        onCompressionChangeRef.current?.(result.dataUrl, result.size, finalQuality);
        
      } catch (error) {
        console.error('Compression failed:', error);
        setCompressionError(true);
      } finally {
        setIsCompressing(false);
      }
    };
    // Only compress when compression settings change, not on every dependency update
    if (hasCompressed || (!hasCompressed && (compressionMode === 'percentage' || compressionMode === 'target-size'))) {
      const debounceTimer = setTimeout(() => {
        compressImage();
      }, 300);
      
      return () => clearTimeout(debounceTimer);
    }

  }, [imageData, originalFormat, compressionMode, compressionPercentage, targetSizeKB, originalFileSize, compressToTargetSize]);

  // Validation for target size
  const getTargetSizeWarning = () => {
    if (targetSizeKB > maxSizeKB) {
      return { type: 'error', message: `Target size cannot be larger than original (${Math.round(maxSizeKB)} KB)` };
    }
    if (targetSizeKB < minSizeKB) {
      return { type: 'warning', message: `Very small target size may result in poor quality (min recommended: ${minSizeKB} KB)` };
    }
    if (targetSizeKB > maxSizeKB * 0.9) {
      return { type: 'info', message: 'Target size is close to original - compression will be minimal' };
    }
    return null;
  };

  const targetSizeWarning = getTargetSizeWarning();

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 md:p-6 space-y-4 md:space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-medium text-gray-900">Compress Image</h3>
        <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      </div>

      {/* Compression Mode Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Compression Method</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setCompressionMode('percentage')}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              compressionMode === 'percentage' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Quality Level</h4>
                <p className="text-xs text-gray-600 mt-1">Adjust compression percentage</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setCompressionMode('target-size')}
            disabled={originalFormat === 'png'}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              compressionMode === 'target-size'
                ? 'border-blue-500 bg-blue-50'
                : originalFormat === 'png'
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Target Size</h4>
                <p className="text-xs text-gray-600 mt-1">
                  {originalFormat === 'png' ? 'Not available for PNG' : 'Set specific file size'}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Compression Controls */}
      {compressionMode === 'percentage' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Compression Level</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="100"
                value={compressionPercentage}
                onChange={(e) => setCompressionPercentage(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="100"
              value={compressionPercentage}
              onChange={(e) => setCompressionPercentage(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Maximum compression</span>
              <span>Best quality</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            {compressionPercentage >= 90 && 'Minimal compression - Best quality'}
            {compressionPercentage >= 70 && compressionPercentage < 90 && 'Light compression - Good quality'}
            {compressionPercentage >= 50 && compressionPercentage < 70 && 'Medium compression - Balanced'}
            {compressionPercentage >= 30 && compressionPercentage < 50 && 'Heavy compression - Smaller file'}
            {compressionPercentage < 30 && 'Maximum compression - Smallest file'}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Target File Size</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={minSizeKB}
                max={maxSizeKB}
                value={targetSizeKB}
                onChange={(e) => setTargetSizeKB(Math.min(maxSizeKB, Math.max(minSizeKB, parseInt(e.target.value) || minSizeKB)))}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm text-gray-500">KB</span>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min={minSizeKB}
              max={maxSizeKB}
              value={targetSizeKB}
              onChange={(e) => setTargetSizeKB(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{minSizeKB} KB</span>
              <span>{Math.round(maxSizeKB)} KB</span>
            </div>
          </div>

          {targetSizeWarning && (
            <div className={`p-2 rounded text-xs ${
              targetSizeWarning.type === 'error' ? 'bg-red-50 text-red-800' :
              targetSizeWarning.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              {targetSizeWarning.message}
            </div>
          )}
        </div>
      )}

      {/* Compression Status */}
      {isCompressing && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Compressing...</span>
          </div>
        </div>
      )}

      {/* Compression Result */}
      {hasCompressed && (
        <div className={`rounded-lg p-4 transition-colors duration-200 ${
          compressionError ? 'bg-red-50' : 'bg-green-50'
        }`}>
          <h4 className={`text-sm font-medium mb-2 ${
            compressionError ? 'text-red-800' : 'text-green-800'
          }`}>
            {compressionError ? 'Compression Error' : 'Compression Result'}
          </h4>

          {compressionError ? (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-sm text-red-800">Compression failed. Please try again.</span>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Compressed Size:</span>
                <span className="font-medium">{compressedSize}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-green-700">Original Size:</span>
                <span className="font-medium">{formatFileSize(originalFileSize)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-green-700">Space Saved:</span>
                <span className="font-medium text-green-600">
                  ↓ {actualCompressionPercentage.toFixed(1)}%
                </span>
              </div>
              
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
                💡 Download your compressed image using the section on the right
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompressTool;