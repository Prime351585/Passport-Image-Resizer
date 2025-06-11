import React from 'react';
import type { PassportDimension } from './PassportToolContainer';

interface PassportDimensionSelectorProps {
  selectedDimension: PassportDimension;
  onDimensionChange: (dimension: PassportDimension) => void;
  className?: string;
}

const PASSPORT_DIMENSIONS: PassportDimension[] = [
  {
    name: 'US Passport',
    width: 51,
    height: 51,
    unit: 'mm',
    description: 'Standard US passport photo (2×2 inches)',
    country: 'USA'
  },
  {
    name: 'US Visa',
    width: 51,
    height: 51,
    unit: 'mm',
    description: 'US visa application photo (2×2 inches)',
    country: 'USA'
  },
  {
    name: 'Canada Passport',
    width: 50,
    height: 70,
    unit: 'mm',
    description: 'Canadian passport photo',
    country: 'Canada'
  },
  {
    name: 'UK Passport',
    width: 35,
    height: 45,
    unit: 'mm',
    description: 'UK passport photo',
    country: 'UK'
  },
  {
    name: 'EU Passport',
    width: 35,
    height: 45,
    unit: 'mm',
    description: 'European Union passport photo',
    country: 'EU'
  },
  {
    name: 'Australia Passport',
    width: 35,
    height: 45,
    unit: 'mm',
    description: 'Australian passport photo',
    country: 'Australia'
  },
  {
    name: 'India Passport',
    width: 35,
    height: 45,
    unit: 'mm',
    description: 'Indian passport photo',
    country: 'India'
  },
  {
    name: 'China Passport',
    width: 33,
    height: 48,
    unit: 'mm',
    description: 'Chinese passport photo',
    country: 'China'
  },
  {
    name: 'Japan Passport',
    width: 35,
    height: 45,
    unit: 'mm',
    description: 'Japanese passport photo',
    country: 'Japan'
  },
  {
    name: 'Schengen Visa',
    width: 35,
    height: 45,
    unit: 'mm',
    description: 'Schengen visa application photo',
    country: 'EU'
  }
];

const getCountryFlag = (country: string): string => {
  const flags: { [key: string]: string } = {
    'USA': '🇺🇸',
    'Canada': '🇨🇦',
    'UK': '🇬🇧',
    'EU': '🇪🇺',
    'Australia': '🇦🇺',
    'India': '🇮🇳',
    'China': '🇨🇳',
    'Japan': '🇯🇵'
  };
  return flags[country] || '📷';
};

const PassportDimensionSelector: React.FC<PassportDimensionSelectorProps> = ({
  selectedDimension,
  onDimensionChange,
  className = ''
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 md:p-6 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-medium text-gray-900">Passport Photo Size</h3>
        <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>
      </div>

      {/* Selected Dimension Info */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">
            {getCountryFlag(selectedDimension.country || '')}
          </div>
          <div>
            <h4 className="font-medium text-blue-900">{selectedDimension.name}</h4>
            <p className="text-sm text-blue-700">
              {selectedDimension.width} × {selectedDimension.height} {selectedDimension.unit}
            </p>
            <p className="text-xs text-blue-600 mt-1">{selectedDimension.description}</p>
          </div>
        </div>
      </div>

      {/* Dimension Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PASSPORT_DIMENSIONS.map((dimension) => (
          <button
            key={`${dimension.name}-${dimension.width}x${dimension.height}`}
            onClick={() => onDimensionChange(dimension)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              selectedDimension.name === dimension.name &&
              selectedDimension.width === dimension.width &&
              selectedDimension.height === dimension.height
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="text-lg">
                {getCountryFlag(dimension.country || '')}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {dimension.name}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {dimension.width} × {dimension.height} {dimension.unit}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {dimension.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Custom Dimension Input */}
      <div className="border-t border-gray-200 pt-4">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            Custom Dimensions
            <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </summary>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={selectedDimension.width}
                    onChange={(e) => onDimensionChange({
                      ...selectedDimension,
                      width: parseInt(e.target.value) || 35,
                      name: 'Custom'
                    })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="px-2 py-1 text-xs text-gray-500 bg-gray-50 rounded border border-gray-300">
                    {selectedDimension.unit}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={selectedDimension.height}
                    onChange={(e) => onDimensionChange({
                      ...selectedDimension,
                      height: parseInt(e.target.value) || 45,
                      name: 'Custom'
                    })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="px-2 py-1 text-xs text-gray-500 bg-gray-50 rounded border border-gray-300">
                    {selectedDimension.unit}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={selectedDimension.unit}
                onChange={(e) => onDimensionChange({
                  ...selectedDimension,
                  unit: e.target.value as 'mm' | 'in',
                  name: 'Custom'
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="mm">Millimeters (mm)</option>
                <option value="in">Inches (in)</option>
              </select>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default PassportDimensionSelector;
