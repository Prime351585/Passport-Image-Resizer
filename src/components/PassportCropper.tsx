import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PassportDimension } from './PassportToolContainer';

interface PassportCropperProps {
  imageData: string;
  originalWidth: number;
  originalHeight: number;
  targetDimension: PassportDimension;
  onCrop: (croppedImage: string) => void;
  className?: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PassportCropper: React.FC<PassportCropperProps> = ({
  imageData,
  originalWidth,
  originalHeight,
  targetDimension,
  onCrop,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(new Image());

  // Convert target dimensions to pixels (assuming 300 DPI)
  const getTargetPixelSize = useCallback(() => {
    const dpi = 300;
    let pixelWidth, pixelHeight;
    
    if (targetDimension.unit === 'mm') {
      pixelWidth = Math.round((targetDimension.width * dpi) / 25.4);
      pixelHeight = Math.round((targetDimension.height * dpi) / 25.4);
    } else {
      pixelWidth = Math.round(targetDimension.width * dpi);
      pixelHeight = Math.round(targetDimension.height * dpi);
    }
    
    return { width: pixelWidth, height: pixelHeight };
  }, [targetDimension]);

  // Calculate initial crop area (centered and properly sized)
  const calculateInitialCropArea = useCallback(() => {
    if (!originalWidth || !originalHeight) return { x: 0, y: 0, width: 100, height: 100 };

    const targetPixelSize = getTargetPixelSize();
    const aspectRatio = targetPixelSize.width / targetPixelSize.height;

    let cropWidth, cropHeight;

    // Fit the crop area within the image while maintaining aspect ratio
    if (originalWidth / originalHeight > aspectRatio) {
      // Image is wider than target aspect ratio
      cropHeight = originalHeight;
      cropWidth = cropHeight * aspectRatio;
    } else {
      // Image is taller than target aspect ratio
      cropWidth = originalWidth;
      cropHeight = cropWidth / aspectRatio;
    }

    // Center the crop area
    const x = (originalWidth - cropWidth) / 2;
    const y = (originalHeight - cropHeight) / 2;

    return { x, y, width: cropWidth, height: cropHeight };
  }, [originalWidth, originalHeight, getTargetPixelSize]);

  // Load image and set up initial crop area
  useEffect(() => {
    if (!imageData) return;

    const img = imageRef.current;
    img.onload = () => {
      setIsLoaded(true);
      const initialCrop = calculateInitialCropArea();
      setCropArea(initialCrop);
    };
    img.src = imageData;
  }, [imageData, calculateInitialCropArea]);

  // Redraw canvas when crop area or image changes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const container = containerRef.current;
    if (!container) return;

    // Calculate display size to fit container
    const containerWidth = container.clientWidth - 32; // Account for padding
    const containerHeight = 400; // Fixed height for consistency
    
    const scale = Math.min(containerWidth / originalWidth, containerHeight / originalHeight);
    const displayWidth = originalWidth * scale;
    const displayHeight = originalHeight * scale;

    setDisplaySize({ width: displayWidth, height: displayHeight });

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Draw the original image
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

    // Draw crop overlay
    const cropX = (cropArea.x / originalWidth) * displayWidth;
    const cropY = (cropArea.y / originalHeight) * displayHeight;
    const cropWidth = (cropArea.width / originalWidth) * displayWidth;
    const cropHeight = (cropArea.height / originalHeight) * displayHeight;

    // Draw dark overlay outside crop area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    
    // Clear the crop area (show original image)
    ctx.clearRect(cropX, cropY, cropWidth, cropHeight);
    ctx.drawImage(img, 
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      cropX, cropY, cropWidth, cropHeight
    );

    // Draw crop border
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);

    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(cropX - handleSize/2, cropY - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropX + cropWidth - handleSize/2, cropY - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropX - handleSize/2, cropY + cropHeight - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropX + cropWidth - handleSize/2, cropY + cropHeight - handleSize/2, handleSize, handleSize);

    // Draw grid lines
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(cropX + cropWidth/3, cropY);
    ctx.lineTo(cropX + cropWidth/3, cropY + cropHeight);
    ctx.moveTo(cropX + (2*cropWidth)/3, cropY);
    ctx.lineTo(cropX + (2*cropWidth)/3, cropY + cropHeight);
    ctx.stroke();
    
    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(cropX, cropY + cropHeight/3);
    ctx.lineTo(cropX + cropWidth, cropY + cropHeight/3);
    ctx.moveTo(cropX, cropY + (2*cropHeight)/3);
    ctx.lineTo(cropX + cropWidth, cropY + (2*cropHeight)/3);
    ctx.stroke();
    
    ctx.setLineDash([]);
  }, [isLoaded, cropArea, originalWidth, originalHeight]);

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to original image coordinates
    const scaleX = originalWidth / displaySize.width;
    const scaleY = originalHeight / displaySize.height;
    const imageX = x * scaleX;
    const imageY = y * scaleY;

    // Check if click is within crop area
    if (imageX >= cropArea.x && imageX <= cropArea.x + cropArea.width &&
        imageY >= cropArea.y && imageY <= cropArea.y + cropArea.height) {
      setIsDragging(true);
      setDragStart({ x: imageX - cropArea.x, y: imageY - cropArea.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to original image coordinates
    const scaleX = originalWidth / displaySize.width;
    const scaleY = originalHeight / displaySize.height;
    const imageX = x * scaleX;
    const imageY = y * scaleY;

    // Calculate new crop position
    let newX = imageX - dragStart.x;
    let newY = imageY - dragStart.y;

    // Constrain to image boundaries
    newX = Math.max(0, Math.min(newX, originalWidth - cropArea.width));
    newY = Math.max(0, Math.min(newY, originalHeight - cropArea.height));

    setCropArea(prev => ({ ...prev, x: newX, y: newY }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Generate cropped image
  const generateCroppedImage = useCallback(() => {
    if (!isLoaded || !cropArea.width || !cropArea.height) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetPixelSize = getTargetPixelSize();
    canvas.width = targetPixelSize.width;
    canvas.height = targetPixelSize.height;

    const img = imageRef.current;
    ctx.drawImage(
      img,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, targetPixelSize.width, targetPixelSize.height
    );

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onCrop(croppedDataUrl);
  }, [isLoaded, cropArea, getTargetPixelSize, onCrop]);

  // Auto-generate cropped image when crop area changes
  useEffect(() => {
    const timer = setTimeout(generateCroppedImage, 100);
    return () => clearTimeout(timer);
  }, [generateCroppedImage]);

  // Redraw when dependencies change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(redrawCanvas, 100);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  // Reset crop area when target dimension changes
  useEffect(() => {
    if (isLoaded) {
      const newCrop = calculateInitialCropArea();
      setCropArea(newCrop);
    }
  }, [targetDimension, isLoaded, calculateInitialCropArea]);

  return (
    <div className={`bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
            </svg>
          </div>
          <h3 className="text-2xl md:text-3xl font-crimson font-medium text-gray-900">Crop & Align</h3>
        </div>
        <p className="text-gray-500 text-sm">Position and align your photo for perfect results</p>
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xl">👤</span>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">
              <span className="font-crimson text-base">Position your face:</span> Drag the frame to align your face properly. 
              The grid lines help ensure your eyes are positioned correctly.
            </p>
          </div>
        </div>
      </div>

      {/* Crop Canvas */}
      <div ref={containerRef} className="relative">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full border-2 border-gray-300 rounded-xl shadow-md ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ maxHeight: '400px' }}
        />
        
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-white shadow-lg">
              <div className="w-5 h-5 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-base font-crimson font-medium text-gray-900">Loading image...</span>
            </div>
          </div>
        )}
      </div>

      {/* Crop Info */}
      {isLoaded && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                <span className="text-lg">📐</span>
              </div>
              <h4 className="text-base font-crimson font-medium text-gray-900">Target Size</h4>
            </div>
            <p className="text-base font-medium text-gray-700">
              {targetDimension.width} × {targetDimension.height} {targetDimension.unit}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {getTargetPixelSize().width} × {getTargetPixelSize().height} pixels
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                <span className="text-lg">✨</span>
              </div>
              <h4 className="text-base font-crimson font-medium text-gray-900">Quality</h4>
            </div>
            <p className="text-base font-medium text-gray-700">300 DPI</p>
            <p className="text-sm text-gray-500 mt-1">Print ready</p>
          </div>
        </div>
      )}

      {/* Face Positioning Guidelines */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-5">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl">💡</span>
          </div>
          <div className="flex-1">
            <h5 className="text-lg font-crimson font-medium text-amber-800 mb-3">Positioning Guidelines</h5>
            <ul className="text-sm text-amber-700 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-amber-500 mt-0.5">✓</span>
                <span>Eyes should be on the upper horizontal grid line</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-500 mt-0.5">✓</span>
                <span>Face should be centered horizontally</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-500 mt-0.5">✓</span>
                <span>Head should occupy 70-80% of the crop area</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-500 mt-0.5">✓</span>
                <span>Ensure neutral expression and good lighting</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassportCropper;
