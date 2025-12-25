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
}

export function PropertySidebar({ selectedLayerId, layers, selectedSize, onPropertyChange }: PropertySidebarProps) {
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
        <h3 className="text-sm font-medium text-gray-700 mb-3">{layer.label}</h3>
        
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
      </div>
    </div>
  );
}
