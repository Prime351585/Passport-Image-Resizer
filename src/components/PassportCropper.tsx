import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PassportDimension } from './PassportToolContainer';

interface PassportCropperProps {
  imageData: string;
  originalWidth: number;
  originalHeight: number;
  targetDimension: PassportDimension;
  /** Print-resolution crop plus the crop rectangle in source-image pixels. */
  onCrop: (croppedImage: string, crop: CropArea) => void;
  className?: string;
}

export interface CropArea {
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
  // 1 = largest frame that fits; higher = tighter frame around the face
  const [zoom, setZoom] = useState(1);
  const imageRef = useRef<HTMLImageElement>(new Image());

  // Print resolution for the PDF sheet (600 DPI keeps prints sharp)
  const getTargetPixelSize = useCallback(() => {
    const dpi = 600;
    let pixelWidth, pixelHeight;
    
    if (targetDimension.unit === 'mm') {
      pixelWidth = Math.round(((Number(targetDimension.width) || 35) * dpi) / 25.4);
      pixelHeight = Math.round(((Number(targetDimension.height) || 45) * dpi) / 25.4);
    } else {
      pixelWidth = Math.round((Number(targetDimension.width) || 1.38) * dpi);
      pixelHeight = Math.round((Number(targetDimension.height) || 1.77) * dpi);
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
      setZoom(1);
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

  // Pointer events cover mouse, touch and pen. Coordinates use the canvas's
  // rendered size, because CSS (max-width / max-height) may scale it down.
  const toImageCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * originalWidth,
      y: ((e.clientY - rect.top) / rect.height) * originalHeight,
    };
  };

  const handleMouseDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const { x: imageX, y: imageY } = toImageCoords(e);
    if (imageX >= cropArea.x && imageX <= cropArea.x + cropArea.width &&
        imageY >= cropArea.y && imageY <= cropArea.y + cropArea.height) {
      // Keeps the drag going if the finger slides off the canvas; optional.
      try { canvasRef.current.setPointerCapture(e.pointerId); } catch { /* not supported */ }
      setIsDragging(true);
      setDragStart({ x: imageX - cropArea.x, y: imageY - cropArea.y });
    }
  };

  const handleMouseMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;
    const { x: imageX, y: imageY } = toImageCoords(e);
    const newX = Math.max(0, Math.min(imageX - dragStart.x, originalWidth - cropArea.width));
    const newY = Math.max(0, Math.min(imageY - dragStart.y, originalHeight - cropArea.height));
    setCropArea(prev => ({ ...prev, x: newX, y: newY }));
  };

  // Zoom keeps the frame centred on the same point and inside the photo.
  const handleZoom = (z: number) => {
    const base = calculateInitialCropArea();
    setZoom(z);
    setCropArea(prev => {
      const w = base.width / z, h = base.height / z;
      const cx = prev.width ? prev.x + prev.width / 2 : originalWidth / 2;
      const cy = prev.height ? prev.y + prev.height / 2 : originalHeight / 2;
      return {
        x: Math.max(0, Math.min(cx - w / 2, originalWidth - w)),
        y: Math.max(0, Math.min(cy - h / 2, originalHeight - h)),
        width: w, height: h,
      };
    });
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
    onCrop(croppedDataUrl, cropArea);
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
      setZoom(1);
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
      <div ref={containerRef} className="relative flex justify-center bg-gray-50 rounded-xl p-4 overflow-hidden border-2 border-gray-100">
        <canvas
          ref={canvasRef}
          onPointerDown={handleMouseDown}
          onPointerMove={handleMouseMove}
          onPointerUp={handleMouseUp}
          onPointerCancel={handleMouseUp}
          className={`border-2 border-gray-300 shadow-md max-w-full rounded-xl ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ maxHeight: '400px', touchAction: 'none' }}
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

      {/* Zoom: make the head fill the frame (most countries want it 50–70% of the photo height) */}
      <div className="flex items-center gap-3">
        <label htmlFor="passport-zoom" className="text-sm font-medium text-gray-700 shrink-0">Zoom</label>
        <input id="passport-zoom" type="range" min="1" max="4" step="0.05" value={zoom}
          onChange={(e) => handleZoom(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
        <span className="text-sm text-gray-500 w-12 text-right">{zoom.toFixed(1)}×</span>
      </div>
      <p className="text-xs text-gray-500">Drag the frame to centre your face, and zoom until your head fills most of it.</p>
    </div>
  );
};

export default PassportCropper;
