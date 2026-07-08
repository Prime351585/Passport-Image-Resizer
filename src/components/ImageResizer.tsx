import React, { useState, useCallback, useEffect } from 'react';

interface ResizeSettings {
  width: number | '';
  height: number | '';
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
    valStr: string
  ) => {
    const newSettings = { ...settings };
    if (valStr === '') {
      if (type === 'width') {
        newSettings.width = '';
      } else {
        newSettings.height = '';
      }
      setSettings(newSettings);
      return;
    }

    const value = parseInt(valStr) || 0;
    
    if (type === 'width') {
      newSettings.width = value;
      if (settings.maintainAspectRatio && originalAspectRatio && value > 0) {
        newSettings.height = Math.round(value / originalAspectRatio);
      }
    } else {
      newSettings.height = value;
      if (settings.maintainAspectRatio && originalAspectRatio && value > 0) {
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
      const targetWidth = convertToPixels(Number(settings.width) || 1, settings.unit, true);
      const targetHeight = convertToPixels(Number(settings.height) || 1, settings.unit, false);

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
    <div className={`bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 space-y-6 md:space-y-8 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
            </svg>
          </div>
          <div>
            <h3 className="font-crimson text-xl md:text-2xl font-semibold text-gray-900">Resize Settings</h3>
            <p className="text-xs md:text-sm text-gray-500">Adjust dimensions and quality</p>
          </div>
        </div>
      </div>

      {/* Original Image Info */}
      {originalWidth > 0 && originalHeight > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 md:p-5 border border-blue-100">
          <div className="flex items-center space-x-2 mb-3">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h4 className="font-crimson text-base md:text-lg font-semibold text-gray-800">Original Image</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm md:text-base">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Dimensions:</span>
              <span className="font-semibold text-gray-900">{originalWidth} × {originalHeight} px</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Aspect Ratio:</span>
              <span className="font-semibold text-gray-900">{originalAspectRatio.toFixed(2)}:1</span>
            </div>
          </div>
        </div>
      )}
{/* Quick Presets Toggle */}
      <button
        onClick={() => setShowPresets(!showPresets)}
        className="flex items-center justify-between w-full px-4 py-3 bg-primary/5 hover:bg-primary/10 rounded-xl transition-all duration-300 group"
      >
        <div className="flex items-center space-x-3">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
          </svg>
          <span className="font-crimson text-base md:text-lg font-semibold text-primary">Quick Presets</span>
        </div>
        <svg 
          className={`w-5 h-5 text-primary transition-transform duration-300 ${showPresets ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {/* Quick Presets */}
      {showPresets && (
        <div className="space-y-3 animate-fadeIn">
          <div className="overflow-x-auto">
            <div className="flex space-x-3 pb-2" style={{ minWidth: 'max-content' }}>
              {Object.entries(RESIZE_PRESETS).slice(0, 10).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className="group flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 p-3 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary/10 hover:to-purple-50 border-2 border-gray-200 hover:border-primary rounded-xl transition-all duration-300 flex flex-col items-center justify-center text-center hover:scale-105 hover:shadow-md"
                  title={`${preset.width} × ${preset.height} ${preset.unit}`}
                >
                  <div className="text-2xl mb-1.5 transform group-hover:scale-110 transition-transform">
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
                  <div className="text-xs font-semibold text-gray-700 group-hover:text-primary leading-tight">
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
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
          </svg>
          <h4 className="font-crimson text-base md:text-lg font-semibold text-gray-800">Dimensions</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Width</label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="1"
                value={settings.width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                className="flex-1 px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
              />
              <select
                value={settings.unit}
                onChange={(e) => setSettings(prev => ({ ...prev, unit: e.target.value as any }))}
                className="py-3 text-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 font-medium"
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
            <label className="block text-sm font-semibold text-gray-700">Height</label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="1"
                value={settings.height}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                className="flex-1 px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
              />
              <div className="px-3 py-3 text-sm text-gray-500 w-20 text-center bg-gray-50 rounded-xl border-2 border-gray-200 font-medium">
                {settings.unit}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aspect Ratio Lock */}
      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-primary/50 transition-all duration-300 group">
        <input
          type="checkbox"
          id="aspect-ratio"
          checked={settings.maintainAspectRatio}
          onChange={(e) => setSettings(prev => ({ ...prev, maintainAspectRatio: e.target.checked }))}
          className="w-5 h-5 text-primary border-2 border-gray-300 rounded focus:ring-2 focus:ring-primary cursor-pointer"
        />
        <label htmlFor="aspect-ratio" className="flex-1 text-sm md:text-base font-semibold text-gray-700 cursor-pointer">
          Lock aspect ratio
        </label>
        <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
        </svg>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center justify-between w-full px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-300 group"
      >
        <div className="flex items-center space-x-3">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
          </svg>
          <span className="font-crimson text-base md:text-lg font-semibold text-purple-700">Advanced Settings</span>
        </div>
        <svg 
          className={`w-5 h-5 text-purple-600 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="space-y-4 animate-fadeIn">
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
              </svg>
              <span>Resize Method</span>
            </label>
            <select
              value={settings.resizeMethod}
              onChange={(e) => setSettings(prev => ({ ...prev, resizeMethod: e.target.value as any }))}
              className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 font-medium"
            >
              <option value="exact">Exact (may distort)</option>
              <option value="fit">Fit (maintain aspect ratio)</option>
              <option value="fill">Fill (crop if needed)</option>
              <option value="crop">Crop from center</option>
            </select>
            
            {/* Method description */}
            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-gray-600">
                {settings.resizeMethod === 'exact' && '⚠️ Image will be stretched to exact dimensions'}
                {settings.resizeMethod === 'fit' && '✓ Image will fit inside dimensions, maintaining aspect ratio'}
                {settings.resizeMethod === 'fill' && '✓ Image will fill dimensions, may crop edges'}
                {settings.resizeMethod === 'crop' && '✂️ Image will be cropped from center to fit dimensions'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="flex items-center justify-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100">
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-primary/30 rounded-full"></div>
              <div className="absolute inset-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="font-crimson text-base md:text-lg font-semibold text-gray-700">Processing...</p>
              <p className="text-xs text-gray-500">Resizing your image</p>
            </div>
          </div>
        </div>
      )}

      {/* Result Info */}
      {previewImage && !isProcessing && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 md:p-5 border-2 border-green-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h4 className="font-crimson text-base md:text-lg font-semibold text-green-800">Resized Successfully</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm md:text-base">
            <div className="flex flex-col space-y-1">
              <span className="text-green-700 font-medium">New Dimensions:</span>
              <span className="font-semibold text-gray-900">
                {convertToPixels(Number(settings.width) || 1, settings.unit, true)} × {convertToPixels(Number(settings.height) || 1, settings.unit, false)} px
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-green-700 font-medium">Method:</span>
              <span className="font-semibold text-gray-900 capitalize">{settings.resizeMethod}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageResizer;