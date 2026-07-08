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
    <div className={`bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
          </div>
          <h3 className="text-2xl md:text-3xl font-crimson font-medium text-gray-900">Passport Photo Size</h3>
        </div>
        <p className="text-gray-500 text-sm">Choose your country's standard passport photo dimensions</p>
      </div>

      {/* Selected Dimension Info */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
            {getCountryFlag(selectedDimension.country || '')}
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-crimson font-medium text-blue-900">{selectedDimension.name}</h4>
            <p className="text-base font-medium text-blue-700 mt-1">
              {selectedDimension.width} × {selectedDimension.height} {selectedDimension.unit}
            </p>
            <p className="text-sm text-blue-600 mt-2">{selectedDimension.description}</p>
          </div>
        </div>
      </div>

      {/* Dimension Grid */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-lg">🌍</span>
          </div>
          <h4 className="text-lg font-crimson font-medium text-gray-900">Country Standards</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PASSPORT_DIMENSIONS.map((dimension) => (
            <button
              key={`${dimension.name}-${dimension.width}x${dimension.height}`}
              onClick={() => onDimensionChange(dimension)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                selectedDimension.name === dimension.name &&
                selectedDimension.width === dimension.width &&
                selectedDimension.height === dimension.height
                  ? 'border-primary bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md scale-105'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:scale-105'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                  {getCountryFlag(dimension.country || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-crimson font-medium text-gray-900 text-base truncate">
                    {dimension.name}
                  </h4>
                  <p className="text-sm font-medium text-gray-600 mt-1">
                    {dimension.width} × {dimension.height} {dimension.unit}
                  </p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {dimension.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Dimension Input */}
      <div className="border-t-2 border-gray-200 pt-6">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-lg">✏️</span>
              </div>
              <span className="text-base font-crimson font-medium text-gray-900">Custom Dimensions</span>
            </div>
            <svg className="w-5 h-5 transition-transform group-open:rotate-180 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </summary>
          <div className="mt-4 p-5 space-y-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-crimson font-medium text-gray-900 mb-2">Width</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={selectedDimension.width}
                    onChange={(e) => onDimensionChange({
                      ...selectedDimension,
                      width: e.target.value === '' ? '' : (parseInt(e.target.value) || 0),
                      name: 'Custom'
                    })}
                    className="flex-1 px-3 py-2 text-sm font-medium border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                  />
                  <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-xl border-2 border-gray-200">
                    {selectedDimension.unit}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-crimson font-medium text-gray-900 mb-2">Height</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={selectedDimension.height}
                    onChange={(e) => onDimensionChange({
                      ...selectedDimension,
                      height: e.target.value === '' ? '' : (parseInt(e.target.value) || 0),
                      name: 'Custom'
                    })}
                    className="flex-1 px-3 py-2 text-sm font-medium border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                  />
                  <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-xl border-2 border-gray-200">
                    {selectedDimension.unit}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-crimson font-medium text-gray-900 mb-2">Unit</label>
              <select
                value={selectedDimension.unit}
                onChange={(e) => onDimensionChange({
                  ...selectedDimension,
                  unit: e.target.value as 'mm' | 'in',
                  name: 'Custom'
                })}
                className="w-full px-3 py-2 text-sm font-medium border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 bg-white"
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
