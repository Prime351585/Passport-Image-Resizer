import React, { useState, useRef, useCallback } from 'react';

export interface UploadedImage {
  file: File;
  dataUrl: string;
  name: string;
  size: number;
  lastModified: number;
}

interface UploadPreviewProps {
  onImageUpload?: (file: File, dataUrl: string) => void;
  onBatchUpload?: (images: UploadedImage[]) => void;
  onImageRemove?: (index?: number) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  storageKey?: string;
  className?: string;
  showPreview?: boolean;
  multiple?: boolean;
}

const UploadPreview: React.FC<UploadPreviewProps> = ({
  onImageUpload,
  onBatchUpload,
  onImageRemove,
  maxSizeMB = 20,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  storageKey = 'uploaded-image',
  className = '',
  showPreview = true,
  multiple = false
}) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid format: ${file.name}. Accepted: ${acceptedFormats.join(', ')}`;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File too large: ${file.name}. Max: ${maxSizeMB}MB`;
    }

    return null;
  }, [acceptedFormats, maxSizeMB]);

  const handleFileProcessing = useCallback(async (files: File[]) => {
    setError('');
    setIsLoading(true);

    const validFiles: File[] = [];
    const newErrors: string[] = [];

    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        newErrors.push(validationError);
      } else {
        validFiles.push(file);
      }
    }

    if (newErrors.length > 0) {
      setError(newErrors.join(' | '));
      // If single mode and it failed, stop. In batch, process valid ones.
      if (!multiple || validFiles.length === 0) {
        setIsLoading(false);
        return;
      }
    }

    try {
      const processed: UploadedImage[] = [];
      for (const file of validFiles) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        processed.push({
          file,
          dataUrl,
          name: file.name,
          size: file.size,
          lastModified: file.lastModified
        });
      }

      if (multiple) {
        const newBatch = [...uploadedImages, ...processed];
        setUploadedImages(newBatch);
        onBatchUpload?.(newBatch);
      } else {
        setUploadedImages([processed[0]]);
        onImageUpload?.(processed[0].file, processed[0].dataUrl);
      }
    } catch (error) {
      setError('Failed to process image(s). Please try again.');
      console.error('Image processing error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [validateFile, multiple, uploadedImages, onImageUpload, onBatchUpload]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      if (!multiple) {
        handleFileProcessing([fileArray[0]]);
      } else {
        handleFileProcessing(fileArray);
      }
    }
  }, [handleFileProcessing, multiple]);

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

  const handleRemoveImage = (index: number) => {
    if (multiple) {
      const newImages = [...uploadedImages];
      newImages.splice(index, 1);
      setUploadedImages(newImages);
      onBatchUpload?.(newImages);
      onImageRemove?.(index);
    } else {
      setUploadedImages([]);
      setError('');
      onImageRemove?.();
    }
  };

  const handleChooseFile = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
      {uploadedImages.length === 0 ? (
        // Initial Upload Area
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
          onClick={(e) => handleChooseFile(e)}
        >
          {/* Decorative background circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-70" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-70" />
          
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleInputChange}
            className="sr-only"
            multiple={multiple}
          />
          
          <div className="relative space-y-4 md:space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-primary/30 rounded-full"></div>
                  <div className="absolute inset-0 w-16 h-16 md:w-20 md:h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 md:mt-6 font-crimson text-lg md:text-xl text-gray-700">Processing image(s)...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <svg className="w-10 h-10 md:w-12 md:h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-crimson text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                    {multiple ? 'Upload Your Images (Batch Processing)' : 'Upload Your Image'}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 mb-6">
                    Drag and drop your image{multiple ? 's' : ''} here, or click to browse
                  </p>
                  
                  <button 
                    type="button"
                    onClick={(e) => handleChooseFile(e)}
                    className="bg-primary hover:bg-primary/90 text-white px-6 md:px-8 py-3 md:py-4 rounded-3xl font-semibold text-sm md:text-base transition-all duration-300 hover:scale-105 hover:shadow-lg inline-flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                    </svg>
                    <span>Choose Image{multiple ? 's' : ''}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        // File List UI (Single or Batch)
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-crimson text-lg font-semibold text-gray-900">
              {multiple ? `Batch Processing (${uploadedImages.length} images)` : 'Uploaded Image'}
            </h3>
            {multiple && (
              <button
                type="button"
                onClick={(e) => handleChooseFile(e)}
                className="text-sm font-medium text-primary hover:text-primary/80 flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                <span>Add More</span>
              </button>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleInputChange}
            className="sr-only"
            multiple={multiple}
          />
          
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {uploadedImages.map((img, idx) => (
              <div key={`${img.name}-${idx}`} className="flex items-start justify-between gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {showPreview && img.dataUrl ? (
                    <img src={img.dataUrl} alt={img.name} className="w-12 h-12 rounded-lg object-cover bg-gray-200" />
                  ) : (
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                  )}
                  
                  <div className="min-w-0 flex-1 py-1">
                    <h4 className="font-crimson text-base font-semibold text-gray-900 truncate" title={img.name}>
                      {img.name}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">{formatFileSize(img.size)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 flex-shrink-0 pt-1">
                  {!multiple && (
                    <button
                      type="button"
                      onClick={(e) => handleChooseFile(e)}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-semibold transition-colors"
                    >
                      Replace
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                    title="Remove image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};

export default UploadPreview;