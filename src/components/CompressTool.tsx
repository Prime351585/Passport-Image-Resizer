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
    <div className={`bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 space-y-6 md:space-y-8 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <h3 className="text-2xl md:text-3xl font-crimson font-medium text-gray-900">Compress Image</h3>
        </div>
        <p className="text-gray-500 text-sm">Reduce file size while maintaining quality</p>
      </div>

      {/* Compression Mode Selection */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-lg">⚙️</span>
          </div>
          <h4 className="text-lg font-crimson font-medium text-gray-900">Compression Method</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setCompressionMode('percentage')}
            className={`p-5 rounded-xl border-2 text-left transition-all duration-300 ${
              compressionMode === 'percentage' 
                ? 'border-primary bg-gradient-to-br from-orange-50 to-pink-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:scale-105'
            }`}
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-xl">📊</span>
              </div>
              <h4 className="text-base font-crimson font-medium text-gray-900">Quality Level</h4>
              <p className="text-sm text-gray-600">Adjust compression percentage</p>
            </div>
          </button>

          <button
            onClick={() => setCompressionMode('target-size')}
            disabled={originalFormat === 'png'}
            className={`p-5 rounded-xl border-2 text-left transition-all duration-300 ${
              compressionMode === 'target-size'
                ? 'border-primary bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                : originalFormat === 'png'
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:scale-105'
            }`}
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <span className="text-white text-xl">🎯</span>
              </div>
              <h4 className="text-base font-crimson font-medium text-gray-900">Target Size</h4>
              <p className="text-sm text-gray-600">
                {originalFormat === 'png' ? 'Not available for PNG' : 'Set specific file size'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Compression Controls */}
      {compressionMode === 'percentage' ? (
        <div className="space-y-4 p-5 rounded-xl bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <label className="block text-base font-crimson font-medium text-gray-900">Compression Level</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="100"
                value={compressionPercentage}
                onChange={(e) => setCompressionPercentage(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-20 px-3 py-2 text-sm font-medium border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
              />
              <span className="text-sm font-medium text-gray-700">%</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <input
              type="range"
              min="1"
              max="100"
              value={compressionPercentage}
              onChange={(e) => setCompressionPercentage(parseInt(e.target.value))}
              style={{
                background: `linear-gradient(to right, #f97316 0%, #ec4899 ${compressionPercentage}%, #e5e7eb ${compressionPercentage}%, #e5e7eb 100%)`
              }}
              className="w-full h-3 rounded-full appearance-none cursor-pointer transition-all duration-300"
            />
            <div className="flex justify-between text-xs font-medium text-gray-600">
              <span>🔥 Max compression</span>
              <span>✨ Best quality</span>
            </div>
          </div>
          
          <div className="text-sm font-medium text-gray-700 bg-white/50 p-3 rounded-lg backdrop-blur-sm border border-orange-200">
            {compressionPercentage >= 90 && '✨ Minimal compression - Best quality'}
            {compressionPercentage >= 70 && compressionPercentage < 90 && '💎 Light compression - Good quality'}
            {compressionPercentage >= 50 && compressionPercentage < 70 && '⚖️ Medium compression - Balanced'}
            {compressionPercentage >= 30 && compressionPercentage < 50 && '📦 Heavy compression - Smaller file'}
            {compressionPercentage < 30 && '🔥 Maximum compression - Smallest file'}
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <label className="block text-base font-crimson font-medium text-gray-900">Target File Size</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={minSizeKB}
                max={maxSizeKB}
                value={targetSizeKB}
                onChange={(e) => setTargetSizeKB(Math.min(maxSizeKB, Math.max(minSizeKB, parseInt(e.target.value) || minSizeKB)))}
                className="w-24 px-3 py-2 text-sm font-medium border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
              />
              <span className="text-sm font-medium text-gray-700">KB</span>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="range"
              min={minSizeKB}
              max={maxSizeKB}
              value={targetSizeKB}
              onChange={(e) => setTargetSizeKB(parseInt(e.target.value))}
              style={{
                background: `linear-gradient(to right, #10b981 0%, #059669 ${((targetSizeKB - minSizeKB) / (maxSizeKB - minSizeKB)) * 100}%, #e5e7eb ${((targetSizeKB - minSizeKB) / (maxSizeKB - minSizeKB)) * 100}%, #e5e7eb 100%)`
              }}
              className="w-full h-3 rounded-full appearance-none cursor-pointer transition-all duration-300"
            />
            <div className="flex justify-between text-xs font-medium text-gray-600">
              <span>📉 {minSizeKB} KB</span>
              <span>📈 {Math.round(maxSizeKB)} KB</span>
            </div>
          </div>

          {targetSizeWarning && (
            <div className={`p-3 rounded-lg text-sm font-medium border-2 ${
              targetSizeWarning.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
              targetSizeWarning.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
              'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {targetSizeWarning.type === 'error' ? '⚠️' :
                   targetSizeWarning.type === 'warning' ? '⚡' : 'ℹ️'}
                </span>
                <span>{targetSizeWarning.message}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compression Status */}
      {isCompressing && (
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="w-5 h-5 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-base font-crimson font-medium text-gray-900">Compressing your image...</span>
          </div>
        </div>
      )}

      {/* Compression Result */}
      {hasCompressed && (
        <div className={`rounded-xl p-6 border-2 transition-all duration-300 ${
          compressionError 
            ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200' 
            : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                compressionError 
                  ? 'bg-gradient-to-br from-red-500 to-rose-500' 
                  : 'bg-gradient-to-br from-green-500 to-emerald-500'
              }`}>
                {compressionError ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                ) : (
                  <span className="text-white text-2xl">✓</span>
                )}
              </div>
              <h4 className={`text-xl font-crimson font-medium ${
                compressionError ? 'text-red-800' : 'text-green-800'
              }`}>
                {compressionError ? 'Compression Error' : 'Compression Complete!'}
              </h4>
            </div>

            {compressionError ? (
              <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                <span className="text-2xl">⚠️</span>
                <span className="text-sm font-medium text-red-800">Compression failed. Please try again with different settings.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2 p-4 bg-white/50 rounded-lg backdrop-blur-sm border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Compressed Size:</span>
                    <span className="text-base font-crimson font-semibold text-gray-900">{compressedSize}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Original Size:</span>
                    <span className="text-base font-crimson font-semibold text-gray-900">{formatFileSize(originalFileSize)}</span>
                  </div>
                  
                  <div className="h-px bg-gradient-to-r from-transparent via-green-300 to-transparent my-2"></div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-700">Space Saved:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">📉</span>
                      <span className="text-lg font-crimson font-bold text-green-600">
                        {actualCompressionPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">💡</span>
                    <span className="text-sm font-medium text-blue-800">
                      Download your compressed image using the section on the right
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompressTool;