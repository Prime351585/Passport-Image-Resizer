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
            relative group border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 cursor-pointer overflow-hidden
            ${isDragging 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50/50'
            }
            ${isLoading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleChooseFile}
        >
          {/* Decorative background circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-70" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-70" />
          
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleInputChange}
            className="hidden"
            multiple={false}
          />
          
          <div className="relative space-y-4 md:space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-primary/30 rounded-full"></div>
                  <div className="absolute inset-0 w-16 h-16 md:w-20 md:h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 md:mt-6 font-crimson text-lg md:text-xl text-gray-700">Processing image...</p>
                <p className="text-sm text-gray-500">Please wait a moment</p>
              </div>
            ) : (
              <>
                {/* Upload Icon */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <svg className="w-10 h-10 md:w-12 md:h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                    </div>
                    {/* Floating badge */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div>
                  <h3 className="font-crimson text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                    Upload Your Image
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 mb-6">
                    Drag and drop your image here, or click to browse
                  </p>
                  
                  <button 
                    type="button"
                    className="bg-primary hover:bg-primary/90 text-white px-6 md:px-8 py-3 md:py-4 rounded-3xl font-semibold text-sm md:text-base transition-all duration-300 hover:scale-105 hover:shadow-lg inline-flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                    </svg>
                    <span>Choose Image</span>
                  </button>
                </div>

                {/* Supported Formats */}
                <div className="pt-4 border-t-2 border-gray-200">
                  <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm text-gray-500">
                    <div className="flex items-center space-x-1.5">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="font-medium">
                        {acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')}
                      </span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center space-x-1.5">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <span className="font-medium">Max {maxSizeMB}MB</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        // Image Uploaded Status
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3 md:space-x-4 flex-1 min-w-0">
              {/* Success Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center ring-4 ring-green-50">
                  <svg className="w-6 h-6 md:w-7 md:h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              
              {/* File Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-crimson text-base md:text-lg font-semibold text-gray-900 truncate mb-1" title={uploadedImage.name}>
                      {uploadedImage.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                        </svg>
                        <span className="font-medium">{formatFileSize(uploadedImage.size)}</span>
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Ready
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              <button
                onClick={handleChooseFile}
                className="px-3 md:px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs md:text-sm font-semibold transition-all duration-300 hover:scale-105"
                title="Replace image"
              >
                Replace
              </button>
              <button
                onClick={handleRemoveImage}
                className="p-2 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-xl transition-all duration-300 hover:scale-105"
                title="Remove image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
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
        <div className="mt-4 md:mt-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <div className="flex-1 pt-0.5">
              <h4 className="font-crimson text-sm md:text-base font-semibold text-red-900 mb-1">Upload Error</h4>
              <p className="text-xs md:text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPreview;