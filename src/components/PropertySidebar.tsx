import { useState } from 'react';
import { HTML5_AD_SIZES, type LayerContent } from '../data';

interface PropertySidebarProps {
  selectedLayerId: string | null;
  layers: LayerContent[];
  selectedSize: keyof typeof HTML5_AD_SIZES;
  onPropertyChange: (
    layerId: string,
    property: 'positionX' | 'positionY' | 'width' | 'height',
    value: number,
    unit?: 'px' | '%'
  ) => void;
  onDelete: (layerId: string) => void;
  onLabelChange: (layerId: string, newLabel: string) => void;
}

export function PropertySidebar({ selectedLayerId, layers, selectedSize, onPropertyChange, onDelete, onLabelChange }: PropertySidebarProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState('');
  if (!selectedLayerId) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Options</h2>
          <p className="text-sm text-gray-500">Select a layer to edit its properties</p>
        </div>
      </div>
    );
  }

  const layer = layers.find(l => l.id === selectedLayerId);
  if (!layer) return null;

  const posX = layer.positionX[selectedSize];
  const posY = layer.positionY[selectedSize];
  const width = layer.width[selectedSize];
  const height = layer.height[selectedSize];

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Options</h2>
        
        {/* Editable Label */}
        <div className="mb-3 group/label">
          {isEditingLabel ? (
            <input
              type="text"
              value={editedLabel}
              onChange={(e) => setEditedLabel(e.target.value)}
              onBlur={() => {
                if (editedLabel.trim()) {
                  onLabelChange(layer.id, editedLabel.trim());
                }
                setIsEditingLabel(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editedLabel.trim()) {
                    onLabelChange(layer.id, editedLabel.trim());
                  }
                  setIsEditingLabel(false);
                } else if (e.key === 'Escape') {
                  setIsEditingLabel(false);
                  setEditedLabel(layer.label);
                }
              }}
              autoFocus
              className="w-full px-2 py-1 text-sm font-medium text-gray-700 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-700 flex-1">{layer.label}</h3>
              <button
                onClick={() => {
                  setEditedLabel(layer.label);
                  setIsEditingLabel(true);
                }}
                className="opacity-0 group-hover/label:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          {/* Position X and Y */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">X</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={posX.value}
                  onChange={(e) => onPropertyChange(layer.id, 'positionX', parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <select
                  value={posX.unit || 'px'}
                  onChange={(e) => onPropertyChange(layer.id, 'positionX', posX.value, e.target.value as 'px' | '%')}
                  className="px-1 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="px">px</option>
                  <option value="%">%</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Y</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={posY.value}
                  onChange={(e) => onPropertyChange(layer.id, 'positionY', parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <select
                  value={posY.unit || 'px'}
                  onChange={(e) => onPropertyChange(layer.id, 'positionY', posY.value, e.target.value as 'px' | '%')}
                  className="px-1 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="px">px</option>
                  <option value="%">%</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Width and Height */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={width.value}
                  onChange={(e) => onPropertyChange(layer.id, 'width', parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <select
                  value={width.unit || 'px'}
                  onChange={(e) => onPropertyChange(layer.id, 'width', width.value, e.target.value as 'px' | '%')}
                  className="px-1 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="px">px</option>
                  <option value="%">%</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={height.value}
                  onChange={(e) => onPropertyChange(layer.id, 'height', parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <select
                  value={height.unit || 'px'}
                  onChange={(e) => onPropertyChange(layer.id, 'height', height.value, e.target.value as 'px' | '%')}
                  className="px-1 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="px">px</option>
                  <option value="%">%</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Button */}
        <div className="mt-6">
          <button
            onClick={() => onDelete(layer.id)}
            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded transition-colors"
          >
            Delete Layer
          </button>
        </div>
      </div>
    </div>
  );
}
