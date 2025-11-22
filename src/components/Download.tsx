import React, { useState, useCallback, useEffect } from 'react';
import { createImageBlob, formatFileSize } from '../utils/canvasUtils';

interface DownloadProps {
  imageData?: string;
  originalFileName?: string;
  onDownload?: (format: string, quality: number) => void;
  defaultQuality?: number;
  defaultFormat?: string;
  availableFormats?: Array<{
    value: string;
    label: string;
    extension: string;
  }>;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
  hideFormatSelector?: boolean;
  hideQualityControls?: boolean;
  preCalculatedSize?: number; // NEW: Accept pre-calculated size from compression
}

type CompressionMode = 'quality' | 'size';

const Download: React.FC<DownloadProps> = ({
  imageData,
    preCalculatedSize,
  originalFileName = 'image',
  onDownload,
  defaultQuality = 100,
  defaultFormat = 'jpeg',
  availableFormats = [
    { value: 'jpeg', label: 'JPEG', extension: 'jpg' },
    { value: 'png', label: 'PNG', extension: 'png' },
    { value: 'webp', label: 'WebP', extension: 'webp' }
  ],
  disabled = false,
  className = '',
  showPreview = false,
  hideFormatSelector = false,
  hideQualityControls = false
}) => {
  const QUALITY_PRESETS = [
    { value: 100, label: 'Maximum', description: 'Best quality, largest file' },
    { value: 95, label: 'High', description: 'Excellent quality, good balance' },
    { value: 85, label: 'Good', description: 'Good quality, smaller file' },
    { value: 75, label: 'Medium', description: 'Medium quality, small file' },
    { value: 60, label: 'Low', description: 'Lower quality, very small file' },
    { value: 'custom', label: 'Custom', description: 'Set your own value' }
  ];

  const [qualityPreset, setQualityPreset] = useState<number | 'custom'>(95);

  const [quality, setQuality] = useState(defaultQuality);
  const [format, setFormat] = useState(defaultFormat);
  const [isDownloading, setIsDownloading] = useState(false);
  const [compressionMode, setCompressionMode] = useState<CompressionMode>('quality');
  const [targetSizeKB, setTargetSizeKB] = useState(100);
  const [estimatedSize, setEstimatedSize] = useState<string>('');
  const [maxSizeKB, setMaxSizeKB] = useState<number>(1000);
  const [isCalculatingSize, setIsCalculatingSize] = useState(false);

  // Update format and quality when props change (from external converter)
  useEffect(() => {
    setFormat(defaultFormat);
    setQuality(defaultQuality);
  }, [defaultFormat, defaultQuality]);

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuality(parseInt(e.target.value));
  };

  const handleQualityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
    setQuality(value);
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormat(e.target.value);
  };

  const handleTargetSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(maxSizeKB, Math.max(1, parseInt(e.target.value) || 1));
    setTargetSizeKB(value);
  };

  const getFileName = useCallback(() => {
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');
    const selectedFormat = availableFormats.find(f => f.value === format);
    return `${baseName}.${selectedFormat?.extension || format}`;
  }, [originalFileName, format, availableFormats]);

const calculateEstimatedSize = useCallback(async () => {
    if (!imageData) {
      setEstimatedSize('');
      setMaxSizeKB(1000);
      return;
    }

    // If we have a pre-calculated size (from compression tool), use it directly
    if (preCalculatedSize !== undefined) {
      setEstimatedSize(formatFileSize(preCalculatedSize));
      return;
    }

    // Otherwise, calculate as normal
    setIsCalculatingSize(true);

    try {
      // Calculate max size (uncompressed or highest quality)
      const maxResult = await createImageBlob(imageData, format, 100);
      
      if (maxResult) {
        const maxSize = Math.ceil(maxResult.size / 1024);
        setMaxSizeKB(maxSize);
        setTargetSizeKB(prev => Math.min(prev, maxSize));
      }

      // Calculate estimated size based on current settings
      if (compressionMode === 'quality') {
        const qualityResult = await createImageBlob(imageData, format, quality);
        
        if (qualityResult) {
          setEstimatedSize(formatFileSize(qualityResult.size));
        }
      } else {
        // For size mode, show target size
        setEstimatedSize(`≤ ${targetSizeKB} KB`);
      }

    } catch (error) {
      console.error('Size calculation failed:', error);
      setEstimatedSize('Calculation failed');
    } finally {
      setIsCalculatingSize(false);
    }
  }, [imageData, quality, format, compressionMode, targetSizeKB, preCalculatedSize]);

  // Add preCalculatedSize to the dependency array
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      calculateEstimatedSize();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [calculateEstimatedSize]);
   const compressToTargetSize = async (targetBytes: number): Promise<Blob | null> => {
    let low = 1;
    let high = 100;
    let bestBlob: Blob | null = null;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      
      const result = await createImageBlob(imageData!, format, mid);
      
      if (result) {
        if (result.size <= targetBytes) {
          bestBlob = result.blob;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      } else {
        break;
      }
    }
    
    return bestBlob;
  };

  const handleDownload = async () => {
    if (!imageData) return;

    setIsDownloading(true);
    
    try {
      let blob: Blob | null = null;
      let finalQuality = quality;

      if (compressionMode === 'size' && format !== 'png') {
        const targetBytes = targetSizeKB * 1024;
        blob = await compressToTargetSize(targetBytes);
        
        // Try to determine the quality used for size compression
        if (blob) {
          const compressionRatio = blob.size / (targetBytes || 1);
          finalQuality = Math.max(1, Math.min(100, Math.round(100 * compressionRatio)));
        }
      } else {
        const result = await createImageBlob(imageData, format, quality);
        blob = result?.blob || null;
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = getFileName();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        onDownload?.(format, finalQuality);
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };


  const formatSupportsQuality = format !== 'png';
  const selectedFormat = availableFormats.find(f => f.value === format);

  return (
    <div className={`bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 space-y-6 md:space-y-8 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div>
            <h3 className="font-crimson text-xl md:text-2xl font-semibold text-gray-900">Download</h3>
            <p className="text-xs md:text-sm text-gray-500">Save your processed image</p>
          </div>
        </div>
      </div>

      {/* Desktop Preview Section - Only show on desktop when showPreview is true */}
      {showPreview && imageData && (
        <div className="hidden lg:block space-y-3">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            <h4 className="font-crimson text-base md:text-lg font-semibold text-gray-800">Preview</h4>
          </div>
          <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
            <img
              src={imageData}
              alt="Preview"
              className="w-full h-48 object-contain p-4"
            />
          </div>
        </div>
      )}

      {/* File Preview Info */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 md:p-5 border border-blue-100">
        <div className="flex items-center space-x-2 mb-3">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h4 className="font-crimson text-base md:text-lg font-semibold text-gray-800">File Details</h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm md:text-base">
            <span className="text-gray-600 font-medium">File name:</span>
            <span className="font-semibold text-gray-900 truncate ml-2 max-w-32 sm:max-w-48" title={getFileName()}>
              {getFileName()}
            </span>
          </div>
          
          {!hideFormatSelector && (
            <div className="flex items-center justify-between text-sm md:text-base">
              <span className="text-gray-600 font-medium">Format:</span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-primary border border-primary/20">
                {selectedFormat?.label}
              </span>
            </div>
          )}
          
          {estimatedSize && (
            <div className="flex items-center justify-between text-sm md:text-base">
              <span className="text-gray-600 font-medium">Estimated size:</span>
              <div className="flex items-center space-x-2">
                {isCalculatingSize && (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                )}
                <span className="font-semibold text-gray-900">{estimatedSize}</span>
              </div>
            </div>
          )}
          
          {maxSizeKB > 0 && compressionMode === 'size' && (
            <div className="flex items-center justify-between text-sm md:text-base">
              <span className="text-gray-600 font-medium">Max possible:</span>
              <span className="font-semibold text-gray-900">{maxSizeKB} KB</span>
            </div>
          )}
        </div>
      </div>

      {/* Format Selection - Only show if not hidden */}
      {!hideFormatSelector && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <label htmlFor="format" className="font-crimson text-base md:text-lg font-semibold text-gray-800">
              File Format
            </label>
          </div>
          <select
            id="format"
            value={format}
            onChange={handleFormatChange}
            className="w-full px-4 py-3 text-sm md:text-base border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-white transition-all duration-300 font-medium"
            disabled={disabled}
          >
            {availableFormats.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>
                {fmt.label} (.{fmt.extension})
              </option>
            ))}
          </select>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs md:text-sm text-gray-600 flex items-start space-x-2">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>
                {selectedFormat?.value === 'jpeg' && 'Best for photos with smaller file sizes'}
                {selectedFormat?.value === 'png' && 'Best for images with transparency'}
                {selectedFormat?.value === 'webp' && 'Modern format with excellent compression'}
              </span>
            </p>
          </div>
        </div>
      )}
{formatSupportsQuality && !hideQualityControls && (
  <div className="space-y-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
        </svg>
        <label className="font-crimson text-base md:text-lg font-semibold text-gray-800">Quality Settings</label>
      </div>
      <div className="flex items-center space-x-2 bg-primary/10 rounded-full px-3 py-1.5">
        <input
          type="number"
          min="1"
          max="100"
          value={quality}
          onChange={(e) => {
            const newQuality = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
            setQuality(newQuality);
            setQualityPreset('custom');
          }}
          className="w-12 px-2 py-1 text-sm font-semibold border-0 bg-transparent text-primary focus:outline-none text-center"
        />
        <span className="text-sm font-semibold text-primary">%</span>
      </div>
    </div>

    {/* Quality Presets Dropdown */}
    <div className="space-y-2">
      <label className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-gray-700">
        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
        <span>Quick Presets</span>
      </label>
      <select
        value={qualityPreset}
        onChange={(e) => {
          const preset = e.target.value === 'custom' ? 'custom' : parseInt(e.target.value);
          setQualityPreset(preset);
          if (preset !== 'custom') {
            setQuality(preset as number);
          }
        }}
        className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 font-medium"
      >
        {QUALITY_PRESETS.map((preset) => (
          <option key={preset.value} value={preset.value}>
            {preset.label} {preset.value !== 'custom' ? `(${preset.value}%)` : ''} - {preset.description}
          </option>
        ))}
      </select>
    </div>
    
    {/* Quality Slider */}
    <div className="space-y-3">
      <div className="relative">
        <input
          type="range"
          min="1"
          max="100"
          value={quality}
          onChange={(e) => {
            const newQuality = parseInt(e.target.value);
            setQuality(newQuality);
            setQualityPreset('custom');
          }}
          className="w-full h-3 bg-gradient-to-r from-yellow-200 via-green-200 to-green-400 rounded-full appearance-none cursor-pointer slider-thumb"
          style={{
            background: `linear-gradient(to right, #fde68a 0%, #86efac ${quality}%, #e5e7eb ${quality}%, #e5e7eb 100%)`
          }}
        />
      </div>
      <div className="flex justify-between text-xs font-medium text-gray-600">
        <span className="flex items-center space-x-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          <span>Smaller size</span>
        </span>
        <span className="flex items-center space-x-1">
          <span>Better quality</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
          </svg>
        </span>
      </div>
    </div>
    
    <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
      <p className="text-xs md:text-sm text-gray-700 font-medium flex items-start space-x-2">
        <span className="text-lg">
          {quality >= 95 && '⭐'}
          {quality >= 85 && quality < 95 && '✨'}
          {quality >= 70 && quality < 85 && '✓'}
          {quality >= 50 && quality < 70 && '📊'}
          {quality < 50 && '⚡'}
        </span>
        <span>
          {quality >= 95 && 'Maximum quality - Best for printing or archival'}
          {quality >= 85 && quality < 95 && 'High quality - Great for web and sharing'}
          {quality >= 70 && quality < 85 && 'Good quality - Balanced size and quality'}
          {quality >= 50 && quality < 70 && 'Medium quality - Good for web thumbnails'}
          {quality < 50 && 'Lower quality - Smallest file size, noticeable compression'}
        </span>
      </p>
    </div>
  </div>
)}
      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={disabled || !imageData || isDownloading}
        className={`
          w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl font-semibold transition-all duration-300 text-base md:text-lg
          ${disabled || !imageData
        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
        : 'bg-primary hover:bg-secondary text-white shadow-lg hover:shadow-xl hover:scale-105'
          }
        `}
      >
        {isDownloading ? (
          <>
        <div className="relative">
          <div className="w-5 h-5 border-3 border-white/30 rounded-full"></div>
          <div className="absolute inset-0 w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span className="hidden sm:inline font-crimson">
          {compressionMode === 'size' ? 'Compressing & Downloading...' : 'Downloading...'}
        </span>
        <span className="sm:hidden font-crimson">Downloading...</span>
          </>
        ) : (
          <>
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span className="font-crimson">Download Image</span>
          </>
        )}
      </button>
      
      {/* Download Info */}
      {!disabled && imageData && !isDownloading && (
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Your file is ready to download</span>
        </div>
      )}
    </div>
  );
};

export default Download;