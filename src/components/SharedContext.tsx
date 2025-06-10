import React, { createContext, useContext, useState, useCallback } from 'react';
import { createImageBlob, formatFileSize } from '../utils/canvasUtils';

interface ImageProcessingState {
  calculatedSizes: Map<string, number>;
  isCalculating: boolean;
}

interface ImageProcessingContextType {
  state: ImageProcessingState;
  calculateSize: (imageData: string, format: string, quality: number) => Promise<number>;
  formatSize: (bytes: number) => string;
  clearCache: () => void;
}

const ImageProcessingContext = createContext<ImageProcessingContextType | undefined>(undefined);

export const ImageProcessingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ImageProcessingState>({
    calculatedSizes: new Map(),
    isCalculating: false
  });

  const calculateSize = useCallback(async (imageData: string, format: string, quality: number): Promise<number> => {
    const cacheKey = `${imageData.slice(0, 50)}-${format}-${quality}`;
    
    if (state.calculatedSizes.has(cacheKey)) {
      return state.calculatedSizes.get(cacheKey)!;
    }

    setState(prev => ({ ...prev, isCalculating: true }));

    try {
      const result = await createImageBlob(imageData, format, quality);
      const size = result?.size || 0;
      
      setState(prev => ({
        ...prev,
        calculatedSizes: new Map(prev.calculatedSizes).set(cacheKey, size),
        isCalculating: false
      }));

      return size;
    } catch (error) {
      setState(prev => ({ ...prev, isCalculating: false }));
      throw error;
    }
  }, [state.calculatedSizes]);

  const clearCache = useCallback(() => {
    setState(prev => ({ ...prev, calculatedSizes: new Map() }));
  }, []);

  const value = {
    state,
    calculateSize,
    formatSize: formatFileSize,
    clearCache
  };

  return (
    <ImageProcessingContext.Provider value={value}>
      {children}
    </ImageProcessingContext.Provider>
  );
};

export const useImageProcessing = () => {
  const context = useContext(ImageProcessingContext);
  if (context === undefined) {
    throw new Error('useImageProcessing must be used within an ImageProcessingProvider');
  }
  return context;
};