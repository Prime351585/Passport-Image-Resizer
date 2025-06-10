import React, { useState } from 'react';
import UploadPreview from './UploadPreview';
import Download from './Download';

const ImageToolContainer: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string>('');
  const [originalFileName, setOriginalFileName] = useState<string>('image');

  const handleImageUpload = (file: File, dataUrl: string) => {
    setUploadedFile(file);
    setProcessedImage(dataUrl); // For now, use the uploaded image as processed
    setOriginalFileName(file.name);
    console.log('Image uploaded:', file.name);
  };

  const handleImageRemove = () => {
    setUploadedFile(null);
    setProcessedImage('');
    setOriginalFileName('image');
    console.log('Image removed');
  };

  const handleDownload = (format: string, quality: number) => {
    console.log(`Downloaded as ${format} with ${quality}% quality`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Mobile-first layout: single column on mobile, two columns on lg+ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        
        {/* Upload Section */}
        <div className="space-y-4 md:space-y-6">
          <UploadPreview
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
            maxSizeMB={7}
            storageKey="tool-image"
            className="w-full"
          />
          
          {/* Tool-specific controls */}
          {uploadedFile && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">
                Tool Settings
              </h3>
              <div className="space-y-3">
                {/* Placeholder for tool controls */}
                <div className="text-sm md:text-base text-gray-600">
                  Tool-specific controls will go here
                </div>
                
                {/* Example tool controls */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Example Setting
                    </label>
                    <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                      <option>Option 1</option>
                      <option>Option 2</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Value
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Download Section */}
        <div className="space-y-4 md:space-y-6">
          <Download
            imageData={processedImage}
            originalFileName={originalFileName}
            onDownload={handleDownload}
            defaultQuality={100}
            defaultFormat="jpeg"
            disabled={!processedImage}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default ImageToolContainer;