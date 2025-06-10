import React, { useState, useRef, useCallback } from 'react';

interface UploadPreviewProps {
  onImageUpload?: (file: File, dataUrl: string) => void;
  onImageRemove?: () => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  storageKey?: string;
  className?: string;
  showPreview?: boolean; // New prop to control preview visibility
}

interface UploadedImage {
  file: File;
  dataUrl: string;
  name: string;
  size: number;
  lastModified: number;
}

const UploadPreview: React.FC<UploadPreviewProps> = ({
  onImageUpload,
  onImageRemove,
  maxSizeMB = 7,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  storageKey = 'uploaded-image',
  className = '',
  showPreview = true
}) => {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file format. Accepted formats: ${acceptedFormats.join(', ')}`;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size too large. Maximum size: ${maxSizeMB}MB`;
    }

    return null;
  }, [acceptedFormats, maxSizeMB]);

  const saveToLocalStorage = useCallback((imageData: UploadedImage) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(imageData));
    } catch (error) {
      console.warn('Failed to save image to localStorage:', error);
    }
  }, [storageKey]);

  const removeFromLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove image from localStorage:', error);
    }
  }, [storageKey]);

  const handleFileProcessing = useCallback(async (file: File) => {
    setError('');
    setIsLoading(true);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const imageData: UploadedImage = {
        file,
        dataUrl,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified
      };

      setUploadedImage(imageData);
      saveToLocalStorage(imageData);
      onImageUpload?.(file, dataUrl);
    } catch (error) {
      setError('Failed to process image. Please try again.');
      console.error('Image processing error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [validateFile, saveToLocalStorage, onImageUpload]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      handleFileProcessing(files[0]);
    }
  }, [handleFileProcessing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    removeFromLocalStorage();
    setError('');
    onImageRemove?.();
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      {!uploadedImage ? (
        // Upload Area
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition-all duration-200 cursor-pointer
            ${isDragging 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
            ${isLoading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleChooseFile}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleInputChange}
            className="hidden"
            multiple={false}
          />
          
          <div className="space-y-3 md:space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-3 md:mt-4 text-sm text-gray-600">Processing image...</p>
              </div>
            ) : (
              <>
                <svg className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <div>
                  <button 
                    type="button"
                    className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm md:text-base"
                  >
                    Choose Image
                  </button>
                  <p className="mt-2 text-xs md:text-sm text-gray-500">or drag and drop an image here</p>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Supported: {acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')}</p>
                  <p>Max size: {maxSizeMB}MB</p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        // Compact Status (No Preview for Mobile)
        <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm md:text-base font-medium text-gray-900 truncate" title={uploadedImage.name}>
                  {uploadedImage.name}
                </h4>
                <p className="text-xs md:text-sm text-gray-500">{formatFileSize(uploadedImage.size)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleChooseFile}
                className="text-blue-600 hover:text-blue-800 text-xs md:text-sm font-medium px-2 py-1"
                title="Replace image"
              >
                Replace
              </button>
              <button
                onClick={handleRemoveImage}
                className="text-red-600 hover:text-red-800 p-1"
                title="Remove image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleInputChange}
            className="hidden"
            multiple={false}
          />
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mt-3 md:mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPreview;