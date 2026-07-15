import React, { useState, useCallback, useRef, useEffect } from 'react';
import UploadPreview from './UploadPreview';

interface CropToolProps {
  className?: string;
}

type AspectRatio = 'free' | '1:1' | '16:9' | '4:3' | '3:2' | '9:16';

export default function CropToolContainer({ className = '' }: CropToolProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [croppedImage, setCroppedImage] = useState<string>('');
  const [originalFileName, setOriginalFileName] = useState<string>('image');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');

  const handleImageUpload = (file: File, dataUrl: string) => {
    setUploadedFile(file);
    setOriginalImage(dataUrl);
    setOriginalFileName(file.name);
    
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = dataUrl;
  };

  const handleImageRemove = () => {
    setUploadedFile(null);
    setOriginalImage('');
    setCroppedImage('');
    setOriginalFileName('image');
    setImageDimensions({ width: 0, height: 0 });
  };

  const handleDownload = () => {
    if (!croppedImage) return;
    const link = document.createElement('a');
    link.href = croppedImage;
    link.download = `cropped-${originalFileName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`max-w-7xl mx-auto space-y-6 md:space-y-8 ${className}`}>
      {!uploadedFile ? (
        <div className="max-w-3xl mx-auto w-full">
          <UploadPreview
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
            maxSizeMB={20}
            storageKey="crop-photo"
            className="w-full"
            showPreview={false}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
          {/* Main Cropper Area */}
          <div className="xl:col-span-8 space-y-6">
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 relative">
              <button 
                onClick={handleImageRemove}
                className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full p-2 transition-colors z-10"
                title="Remove Image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
              
              <ImageCropper 
                imageData={originalImage}
                originalWidth={imageDimensions.width}
                originalHeight={imageDimensions.height}
                aspectRatio={aspectRatio}
                onCrop={setCroppedImage}
              />
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="xl:col-span-4 space-y-6">
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <h3 className="text-xl font-crimson font-semibold text-gray-900 mb-4">Crop Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['free', '1:1', '16:9', '4:3', '3:2', '9:16'] as AspectRatio[]).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          aspectRatio === ratio
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        {ratio.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-gray-100">
                  <button
                    onClick={handleDownload}
                    disabled={!croppedImage}
                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    <span>Download Cropped Image</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Cropper Component
interface ImageCropperProps {
  imageData: string;
  originalWidth: number;
  originalHeight: number;
  aspectRatio: AspectRatio;
  onCrop: (dataUrl: string) => void;
}

function ImageCropper({ imageData, originalWidth, originalHeight, aspectRatio, onCrop }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());
  const [isLoaded, setIsLoaded] = useState(false);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  
  // Crop box state (percentages 0-1)
  const [cropBox, setCropBox] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  
  // Interaction state
  const [dragState, setDragState] = useState<{ type: 'move' | 'nw' | 'ne' | 'sw' | 'se' | null, startX: number, startY: number, initialBox: typeof cropBox }>({ type: null, startX: 0, startY: 0, initialBox: { x:0,y:0,w:0,h:0 } });

  // Compute aspect ratio value
  const ratioValue = React.useMemo(() => {
    if (aspectRatio === 'free') return null;
    const [w, h] = aspectRatio.split(':').map(Number);
    return w / h;
  }, [aspectRatio]);

  // Load image
  useEffect(() => {
    if (!imageData) return;
    const img = imageRef.current;
    img.onload = () => {
      setIsLoaded(true);
      // Reset crop box based on new aspect ratio
      applyAspectRatio(ratioValue, 0.1, 0.1, 0.8, 0.8);
    };
    img.src = imageData;
  }, [imageData]);

  // Apply aspect ratio constraints
  const applyAspectRatio = useCallback((ratio: number | null, x: number, y: number, w: number, h: number) => {
    if (!originalWidth || !originalHeight) return;
    
    if (!ratio) {
      setCropBox({ x, y, w, h });
      return;
    }

    const imageRatio = originalWidth / originalHeight;
    let newW = w;
    let newH = h;
    
    // Convert box w/h to actual pixels to enforce aspect ratio
    let pixelW = newW * originalWidth;
    let pixelH = newH * originalHeight;
    
    if (pixelW / pixelH > ratio) {
      // Too wide, fix width to match height
      pixelW = pixelH * ratio;
      newW = pixelW / originalWidth;
    } else {
      // Too tall, fix height to match width
      pixelH = pixelW / ratio;
      newH = pixelH / originalHeight;
    }
    
    // Ensure it doesn't go out of bounds
    let newX = Math.min(x, 1 - newW);
    let newY = Math.min(y, 1 - newH);
    
    setCropBox({ x: newX, y: newY, w: newW, h: newH });
  }, [originalWidth, originalHeight]);

  // Handle aspect ratio changes
  useEffect(() => {
    if (isLoaded) {
      // When changing ratio, center a maximal box
      let w = 0.9;
      let h = 0.9;
      if (ratioValue) {
        const imgRatio = originalWidth / originalHeight;
        if (imgRatio > ratioValue) {
          w = h * ratioValue / imgRatio;
        } else {
          h = w * imgRatio / ratioValue;
        }
      }
      setCropBox({
        x: (1 - w) / 2,
        y: (1 - h) / 2,
        w,
        h
      });
    }
  }, [aspectRatio, ratioValue, originalWidth, originalHeight, isLoaded]);

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isLoaded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const cWidth = container.clientWidth;
    const cHeight = 400; // Fixed height for editor
    const scale = Math.min(cWidth / originalWidth, cHeight / originalHeight);
    const dWidth = originalWidth * scale;
    const dHeight = originalHeight * scale;
    
    setDisplaySize({ width: dWidth, height: dHeight });
    canvas.width = dWidth;
    canvas.height = dHeight;
    
    // Draw image
    ctx.drawImage(imageRef.current, 0, 0, dWidth, dHeight);
    
    // Draw overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, dWidth, dHeight);
    
    const cx = cropBox.x * dWidth;
    const cy = cropBox.y * dHeight;
    const cw = cropBox.w * dWidth;
    const ch = cropBox.h * dHeight;
    
    // Clear crop area
    ctx.clearRect(cx, cy, cw, ch);
    ctx.drawImage(imageRef.current, 
      cropBox.x * originalWidth, cropBox.y * originalHeight, cropBox.w * originalWidth, cropBox.h * originalHeight,
      cx, cy, cw, ch
    );
    
    // Draw borders & grid
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw, ch);
    
    // Rule of thirds
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + cw/3, cy); ctx.lineTo(cx + cw/3, cy + ch);
    ctx.moveTo(cx + 2*cw/3, cy); ctx.lineTo(cx + 2*cw/3, cy + ch);
    ctx.moveTo(cx, cy + ch/3); ctx.lineTo(cx + cw, cy + ch/3);
    ctx.moveTo(cx, cy + 2*ch/3); ctx.lineTo(cx + cw, cy + 2*ch/3);
    ctx.stroke();
    
    // Handles
    ctx.fillStyle = '#3B82F6';
    const hs = 10;
    ctx.fillRect(cx - hs/2, cy - hs/2, hs, hs); // nw
    ctx.fillRect(cx + cw - hs/2, cy - hs/2, hs, hs); // ne
    ctx.fillRect(cx - hs/2, cy + ch - hs/2, hs, hs); // sw
    ctx.fillRect(cx + cw - hs/2, cy + ch - hs/2, hs, hs); // se
    
  }, [isLoaded, cropBox, originalWidth, originalHeight]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) return;
      const canvas = document.createElement('canvas');
      const cw = cropBox.w * originalWidth;
      const ch = cropBox.h * originalHeight;
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageRef.current, 
          cropBox.x * originalWidth, cropBox.y * originalHeight, cw, ch,
          0, 0, cw, ch
        );
        onCrop(canvas.toDataURL('image/jpeg', 0.95));
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [cropBox, isLoaded, originalWidth, originalHeight, onCrop]);

  // Mouse interaction
  const getMousePos = (e: React.MouseEvent | MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / displaySize.width,
      y: (e.clientY - rect.top) / displaySize.height
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    const tolerance = 0.05; // 5% of display size
    
    let type: typeof dragState.type = null;
    
    // Check corners first
    if (Math.abs(pos.x - cropBox.x) < tolerance && Math.abs(pos.y - cropBox.y) < tolerance) type = 'nw';
    else if (Math.abs(pos.x - (cropBox.x + cropBox.w)) < tolerance && Math.abs(pos.y - cropBox.y) < tolerance) type = 'ne';
    else if (Math.abs(pos.x - cropBox.x) < tolerance && Math.abs(pos.y - (cropBox.y + cropBox.h)) < tolerance) type = 'sw';
    else if (Math.abs(pos.x - (cropBox.x + cropBox.w)) < tolerance && Math.abs(pos.y - (cropBox.y + cropBox.h)) < tolerance) type = 'se';
    // Then body
    else if (pos.x > cropBox.x && pos.x < cropBox.x + cropBox.w && pos.y > cropBox.y && pos.y < cropBox.y + cropBox.h) type = 'move';
    
    if (type) {
      setDragState({ type, startX: pos.x, startY: pos.y, initialBox: { ...cropBox } });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.type) return;
      e.preventDefault();
      
      const pos = getMousePos(e);
      const dx = pos.x - dragState.startX;
      const dy = pos.y - dragState.startY;
      const ib = dragState.initialBox;
      
      let newBox = { ...ib };
      
      if (dragState.type === 'move') {
        newBox.x = Math.max(0, Math.min(1 - ib.w, ib.x + dx));
        newBox.y = Math.max(0, Math.min(1 - ib.h, ib.y + dy));
      } else {
        if (dragState.type === 'nw' || dragState.type === 'sw') {
          const maxDx = ib.w - 0.05; // min width
          const actualDx = Math.min(dx, maxDx);
          const finalX = Math.max(0, ib.x + actualDx);
          newBox.x = finalX;
          newBox.w = ib.w - (finalX - ib.x);
        }
        if (dragState.type === 'ne' || dragState.type === 'se') {
          newBox.w = Math.max(0.05, Math.min(1 - ib.x, ib.w + dx));
        }
        
        if (dragState.type === 'nw' || dragState.type === 'ne') {
          const maxDy = ib.h - 0.05;
          const actualDy = Math.min(dy, maxDy);
          const finalY = Math.max(0, ib.y + actualDy);
          newBox.y = finalY;
          newBox.h = ib.h - (finalY - ib.y);
        }
        if (dragState.type === 'sw' || dragState.type === 'se') {
          newBox.h = Math.max(0.05, Math.min(1 - ib.y, ib.h + dy));
        }
        
        // Enforce aspect ratio when resizing
        if (ratioValue) {
           const imgRatio = originalWidth / originalHeight;
           const pxW = newBox.w * originalWidth;
           let pxH = newBox.h * originalHeight;
           pxH = pxW / ratioValue;
           newBox.h = pxH / originalHeight;
           
           // Keep anchored depending on corner dragged
           if (dragState.type === 'nw' || dragState.type === 'ne') {
             newBox.y = (ib.y + ib.h) - newBox.h;
           }
           
           // Ensure we don't scale out of bounds
           if (newBox.x < 0 || newBox.y < 0 || newBox.x + newBox.w > 1 || newBox.y + newBox.h > 1) {
             return; // abort this frame if it pushes us out bounds
           }
        }
      }
      
      setCropBox(newBox);
    };
    
    const handleMouseUp = () => {
      setDragState({ type: null, startX: 0, startY: 0, initialBox: cropBox });
    };

    if (dragState.type) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, ratioValue, originalWidth, originalHeight]);
  
  // Dynamic cursor
  const getCursor = () => {
    if (dragState.type === 'move') return 'cursor-grabbing';
    if (dragState.type) return 'cursor-crosshair';
    return 'cursor-default'; // In a real app we'd map mouse pos to cursor on hover, but this is fine for MVP
  };

  return (
    <div ref={containerRef} className="relative flex justify-center bg-gray-50 rounded-xl overflow-hidden min-h-[400px]">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        className={`touch-none ${getCursor()}`}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
