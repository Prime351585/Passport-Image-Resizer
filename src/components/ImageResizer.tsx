import React, { useState, useCallback, useEffect } from 'react';

interface ResizeSettings {
  width: number;
  height: number;
  unit: 'px' | '%' | 'mm' | 'cm' | 'in';
  maintainAspectRatio: boolean;
  resizeMethod: 'exact' | 'fit' | 'fill' | 'crop';
  quality: number;
}

interface ImageResizerProps {
  imageData?: string;
  originalWidth?: number;
  originalHeight?: number;
  onResize?: (resizedImage: string, settings: ResizeSettings) => void;
  preset?: ResizeSettings;
  className?: string;
}

// Common presets
const RESIZE_PRESETS = {
  'instagram-post': { width: 1080, height: 1080, unit: 'px' as const, label: 'Instagram Post (Square)' },
  'instagram-story': { width: 1080, height: 1920, unit: 'px' as const, label: 'Instagram Story' },
  'facebook-cover': { width: 1200, height: 630, unit: 'px' as const, label: 'Facebook Cover' },
  'twitter-header': { width: 1500, height: 500, unit: 'px' as const, label: 'Twitter Header' },
  'youtube-thumbnail': { width: 1280, height: 720, unit: 'px' as const, label: 'YouTube Thumbnail' },
  'whatsapp-dp': { width: 640, height: 640, unit: 'px' as const, label: 'WhatsApp Profile' },
  'linkedin-post': { width: 1200, height: 627, unit: 'px' as const, label: 'LinkedIn Post' },
  'pinterest-pin': { width: 735, height: 1102, unit: 'px' as const, label: 'Pinterest Pin' },
  'web-banner': { width: 1920, height: 1080, unit: 'px' as const, label: 'Web Banner (Full HD)' },
  'profile-pic': { width: 400, height: 400, unit: 'px' as const, label: 'Profile Picture' }
};

const ImageResizer: React.FC<ImageResizerProps> = ({
  imageData,
  originalWidth = 0,
  originalHeight = 0,
  onResize,
  preset,
  className = ''
}) => {
  const [settings, setSettings] = useState<ResizeSettings>({
    width: preset?.width || originalWidth || 800,
    height: preset?.height || originalHeight || 600,
    unit: preset?.unit || 'px',
    maintainAspectRatio: true,
    resizeMethod: 'exact',
    quality: 100
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate aspect ratio
  const originalAspectRatio = originalWidth / originalHeight;

  // Convert units to pixels for processing
  const convertToPixels = useCallback((value: number, unit: string, isWidth: boolean = true): number => {
    const dpi = 96; // Standard web DPI
    const referenceSize = isWidth ? originalWidth : originalHeight;
    
    switch (unit) {
      case 'px': return value;
      case '%': return Math.round((value / 100) * referenceSize);
      case 'mm': return Math.round((value * dpi) / 25.4);
      case 'cm': return Math.round((value * dpi) / 2.54);
      case 'in': return Math.round(value * dpi);
      default: return value;
    }
  }, [originalWidth, originalHeight]);

  // Handle dimension changes with aspect ratio
  const handleDimensionChange = useCallback((
    type: 'width' | 'height', 
    value: number
  ) => {
    const newSettings = { ...settings };
    
    if (type === 'width') {
      newSettings.width = Math.max(1, value);
      if (settings.maintainAspectRatio && originalAspectRatio) {
        newSettings.height = Math.round(value / originalAspectRatio);
      }
    } else {
      newSettings.height = Math.max(1, value);
      if (settings.maintainAspectRatio && originalAspectRatio) {
        newSettings.width = Math.round(value * originalAspectRatio);
      }
    }
    
    setSettings(newSettings);
  }, [settings, originalAspectRatio]);

  // Apply preset
  const applyPreset = useCallback((presetKey: string) => {
    const preset = RESIZE_PRESETS[presetKey as keyof typeof RESIZE_PRESETS];
    if (preset) {
      setSettings(prev => ({
        ...prev,
        width: preset.width,
        height: preset.height,
        unit: preset.unit,
        maintainAspectRatio: false // Presets use exact dimensions
      }));
    }
  }, []);

  // Resize image
  const resizeImage = useCallback(async () => {
    if (!imageData || !originalWidth || !originalHeight) return;

    setIsProcessing(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageData;
      });

      // Convert dimensions to pixels
      const targetWidth = convertToPixels(settings.width, settings.unit, true);
      const targetHeight = convertToPixels(settings.height, settings.unit, false);

      let drawWidth = targetWidth;
      let drawHeight = targetHeight;
      let offsetX = 0;
      let offsetY = 0;

      // Handle different resize methods
      switch (settings.resizeMethod) {
        case 'exact':
          // Use exact dimensions (may distort)
          break;
          
        case 'fit':
          // Fit within dimensions (maintain aspect ratio)
          const scale = Math.min(targetWidth / originalWidth, targetHeight / originalHeight);
          drawWidth = originalWidth * scale;
          drawHeight = originalHeight * scale;
          offsetX = (targetWidth - drawWidth) / 2;
          offsetY = (targetHeight - drawHeight) / 2;
          break;
          
        case 'fill':
          // Fill dimensions (maintain aspect ratio, may crop)
          const fillScale = Math.max(targetWidth / originalWidth, targetHeight / originalHeight);
          drawWidth = originalWidth * fillScale;
          drawHeight = originalHeight * fillScale;
          offsetX = (targetWidth - drawWidth) / 2;
          offsetY = (targetHeight - drawHeight) / 2;
          break;
          
        case 'crop':
          // Crop from center
          const cropScale = Math.min(targetWidth / originalWidth, targetHeight / originalHeight);
          const cropWidth = targetWidth / cropScale;
          const cropHeight = targetHeight / cropScale;
          const cropX = (originalWidth - cropWidth) / 2;
          const cropY = (originalHeight - cropHeight) / 2;
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          ctx?.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
          
          const croppedDataUrl = canvas.toDataURL('image/jpeg', settings.quality / 100);
          setPreviewImage(croppedDataUrl);
          onResize?.(croppedDataUrl, settings);
          setIsProcessing(false);
          return;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Fill background for transparent images
      if (settings.resizeMethod === 'fit') {
        ctx!.fillStyle = '#FFFFFF';
        ctx!.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx?.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      const resizedDataUrl = canvas.toDataURL('image/jpeg', settings.quality / 100);
      setPreviewImage(resizedDataUrl);
      onResize?.(resizedDataUrl, settings);
      
    } catch (error) {
      console.error('Resize failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [imageData, originalWidth, originalHeight, settings, convertToPixels, onResize]);

  // Auto-resize when settings change
  useEffect(() => {
    if (imageData && originalWidth && originalHeight) {
      const debounceTimer = setTimeout(resizeImage, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [imageData, originalWidth, originalHeight, settings, resizeImage]);

  // Apply preset on mount
  useEffect(() => {
    if (preset) {
      setSettings(prev => ({ ...prev, ...preset }));
    }
  }, [preset]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

    const [showPresets, setShowPresets] = useState(false);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 md:p-6 space-y-4 md:space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-medium text-gray-900">Resize Settings</h3>
        <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
        </svg>
      </div>

      {/* Original Image Info */}
      {originalWidth > 0 && originalHeight > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 md:p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Original Image</h4>
          <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
            <div>
              <span className="text-gray-600">Dimensions:</span>
              <span className="ml-2 font-medium">{originalWidth} × {originalHeight} px</span>
            </div>
            <div>
              <span className="text-gray-600">Aspect Ratio:</span>
              <span className="ml-2 font-medium">{originalAspectRatio.toFixed(2)}:1</span>
            </div>
          </div>
        </div>
      )}
{/* Quick Presets Toggle */}
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <span>Quick Presets</span>
              <svg 
                className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            {/* Quick Presets */}
            {showPresets && (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="overflow-x-auto">
                <div className="flex space-x-3 pb-2" style={{ minWidth: 'max-content' }}>
                {Object.entries(RESIZE_PRESETS).slice(0, 10).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex flex-col items-center justify-center text-center"
                    title={`${preset.width} × ${preset.height} ${preset.unit}`}
                  >
                    <div className="text-lg mb-1">
                    {key === 'instagram-post' && '📷'}
                    {key === 'instagram-story' && '📱'}
                    {key === 'facebook-cover' && '📘'}
                    {key === 'twitter-header' && '🐦'}
                    {key === 'youtube-thumbnail' && '📺'}
                    {key === 'whatsapp-dp' && '💬'}
                    {key === 'linkedin-post' && '💼'}
                    {key === 'pinterest-pin' && '📌'}
                    {key === 'web-banner' && '🌐'}
                    {key === 'profile-pic' && '👤'}
                    </div>
                    <div className="text-xs font-medium text-gray-700 leading-tight">
                    {preset.label.split(' ')[0]}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                    {preset.width}×{preset.height}
                    </div>
                  </button>
                ))}
                </div>
                </div>
              </div>
            )}



      {/* Dimensions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Width</label>
          <div className="flex space-x-2">
            <input
              type="number"
              min="1"
              value={settings.width}
              onChange={(e) => handleDimensionChange('width', parseInt(e.target.value) || 1)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={settings.unit}
              onChange={(e) => setSettings(prev => ({ ...prev, unit: e.target.value as any }))}
              className="px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="px">px</option>
              <option value="%">%</option>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Height</label>
          <div className="flex space-x-2">
            <input
              type="number"
              min="1"
              value={settings.height}
              onChange={(e) => handleDimensionChange('height', parseInt(e.target.value) || 1)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="px-2 py-2 text-sm text-gray-500 w-16 text-center">
              {settings.unit}
            </div>
          </div>
        </div>
      </div>

      {/* Aspect Ratio Lock */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="aspect-ratio"
          checked={settings.maintainAspectRatio}
          onChange={(e) => setSettings(prev => ({ ...prev, maintainAspectRatio: e.target.checked }))}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="aspect-ratio" className="text-sm text-gray-700">
          Lock aspect ratio
        </label>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
        </svg>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
      >
        <span>Advanced Settings</span>
        <svg 
          className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Resize Method</label>
            <select
              value={settings.resizeMethod}
              onChange={(e) => setSettings(prev => ({ ...prev, resizeMethod: e.target.value as any }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="exact">Exact (may distort)</option>
              <option value="fit">Fit (maintain aspect ratio)</option>
              <option value="fill">Fill (crop if needed)</option>
              <option value="crop">Crop from center</option>
            </select>
          </div>

          
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Processing...</span>
          </div>
        </div>
      )}

      {/* Result Info */}
      {previewImage && !isProcessing && (
        <div className="bg-green-50 rounded-lg p-3 md:p-4">
          <h4 className="text-sm font-medium text-green-800 mb-2">Resized Image</h4>
          <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
            <div>
              <span className="text-green-700">New Dimensions:</span>
              <span className="ml-2 font-medium">
                {convertToPixels(settings.width, settings.unit, true)} × {convertToPixels(settings.height, settings.unit, false)} px
              </span>
            </div>
            <div>
              <span className="text-green-700">Method:</span>
              <span className="ml-2 font-medium capitalize">{settings.resizeMethod}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageResizer;