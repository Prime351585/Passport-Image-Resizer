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
    <div className={`bg-white border border-gray-200 rounded-lg p-4 md:p-6 space-y-4 md:space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-medium text-gray-900">Download</h3>
        <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      </div>

      {/* Desktop Preview Section - Only show on desktop when showPreview is true */}
      {showPreview && imageData && (
        <div className="hidden lg:block space-y-2 md:space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Preview</h4>
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <img
              src={imageData}
              alt="Preview"
              className="w-full h-48 object-contain"
            />
          </div>
        </div>
      )}

      {/* File Preview Info */}
      <div className="bg-gray-50 rounded-lg p-3 md:p-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-gray-600">File name:</span>
            <span className="font-medium text-gray-900 truncate ml-2 max-w-32 sm:max-w-48" title={getFileName()}>
              {getFileName()}
            </span>
          </div>
          
          {!hideFormatSelector && (
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="text-gray-600">Format:</span>
              <span className="font-medium text-gray-900">{selectedFormat?.label}</span>
            </div>
          )}
          
          {estimatedSize && (
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="text-gray-600">Estimated size:</span>
              <div className="flex items-center space-x-1">
                {isCalculatingSize && (
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                )}
                <span className="font-medium text-gray-900">{estimatedSize}</span>
              </div>
            </div>
          )}
          
          {maxSizeKB > 0 && compressionMode === 'size' && (
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="text-gray-600">Max possible:</span>
              <span className="font-medium text-gray-900">{maxSizeKB} KB</span>
            </div>
          )}
        </div>
      </div>

      {/* Format Selection - Only show if not hidden */}
      {!hideFormatSelector && (
        <div className="space-y-2">
          <label htmlFor="format" className="block text-sm font-medium text-gray-700">
            File Format
          </label>
          <select
            id="format"
            value={format}
            onChange={handleFormatChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            disabled={disabled}
          >
            {availableFormats.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>
                {fmt.label} (.{fmt.extension})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            {selectedFormat?.value === 'jpeg' && 'Best for photos with smaller file sizes'}
            {selectedFormat?.value === 'png' && 'Best for images with transparency'}
            {selectedFormat?.value === 'webp' && 'Modern format with excellent compression'}
          </p>
        </div>
      )}
{formatSupportsQuality && !hideQualityControls && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <label className="block text-sm font-medium text-gray-700">Quality Settings</label>
      <div className="flex items-center space-x-2">
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
          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
        />
        <span className="text-sm text-gray-500">%</span>
      </div>
    </div>

    {/* Quality Presets Dropdown */}
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-600">Quick Presets</label>
      <select
        value={qualityPreset}
        onChange={(e) => {
          const preset = e.target.value === 'custom' ? 'custom' : parseInt(e.target.value);
          setQualityPreset(preset);
          if (preset !== 'custom') {
            setQuality(preset as number);
          }
        }}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
      >
        {QUALITY_PRESETS.map((preset) => (
          <option key={preset.value} value={preset.value}>
            {preset.label} {preset.value !== 'custom' ? `(${preset.value}%)` : ''} - {preset.description}
          </option>
        ))}
      </select>
    </div>
    
    {/* Quality Slider */}
    <div className="space-y-2">
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
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>Smaller size</span>
        <span>Better quality</span>
      </div>
    </div>
    
    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
      {quality >= 95 && 'Maximum quality - Best for printing or archival'}
      {quality >= 85 && quality < 95 && 'High quality - Great for web and sharing'}
      {quality >= 70 && quality < 85 && 'Good quality - Balanced size and quality'}
      {quality >= 50 && quality < 70 && 'Medium quality - Good for web thumbnails'}
      {quality < 50 && 'Lower quality - Smallest file size, noticeable compression'}
    </div>
  </div>
)}
      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={disabled || !imageData || isDownloading}
        className={`
          w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-sm md:text-base
          ${disabled || !imageData
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
          }
        `}
      >
        {isDownloading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="hidden sm:inline">
              {compressionMode === 'size' ? 'Compressing & Downloading...' : 'Downloading...'}
            </span>
            <span className="sm:hidden">Downloading...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>Download Image</span>
          </>
        )}
      </button>
    </div>
  );
};

export default Download;