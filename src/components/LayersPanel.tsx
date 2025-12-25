import { useState } from 'react';
import { type LayerContent } from '../data';

interface LayersPanelProps {
  layers: LayerContent[];
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
  panelPos: { x: number; y: number };
  panelSide: 'left' | 'right';
  isDragging: boolean;
  draggedLayerIndex: number | null;
  dragOverLayerIndex: number | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onLayerDragStart: (e: React.DragEvent, index: number) => void;
  onLayerDragOver: (e: React.DragEvent, index: number) => void;
  onLayerDrop: (e: React.DragEvent, index: number) => void;
  onLayerDragEnd: () => void;
  onAddLayer: (type: 'text' | 'richtext' | 'image' | 'video') => void;
}

export function LayersPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  panelPos,
  panelSide,
  isDragging,
  draggedLayerIndex,
  dragOverLayerIndex,
  onMouseDown,
  onLayerDragStart,
  onLayerDragOver,
  onLayerDrop,
  onLayerDragEnd,
  onAddLayer,
}: LayersPanelProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  return (
    <div
      style={{
        position: 'absolute',
        top: `${panelPos.y}px`,
        left: panelPos.x === -1 
          ? (panelSide === 'right' ? 'auto' : '10px')
          : `${panelPos.x}px`,
        right: panelPos.x === -1 && panelSide === 'right' ? '10px' : 'auto',
        width: '300px',
        maxHeight: '500px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        overflow: 'hidden'
      }}
    >
      <div
        className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-900 flex items-center justify-between"
      >
        <div onMouseDown={onMouseDown} className="flex-1 cursor-grab">
          Layers
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          {showDropdown && (
            <div
              className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded shadow-lg z-50"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  onAddLayer('text');
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100"
              >
                Text
              </button>
              <button
                onClick={() => {
                  onAddLayer('richtext');
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100"
              >
                Rich Text
              </button>
              <button
                onClick={() => {
                  onAddLayer('image');
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100"
              >
                Image
              </button>
              <button
                onClick={() => {
                  onAddLayer('video');
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                Video
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: '440px' }}>
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            onDragOver={(e) => onLayerDragOver(e, index)}
            onDrop={(e) => onLayerDrop(e, index)}
            className={`flex items-center gap-2 px-4 py-2 border-b border-gray-100 hover:bg-gray-50 ${
              selectedLayerId === layer.id ? 'bg-blue-50' : ''
            }`}
            style={{ 
              opacity: draggedLayerIndex === index ? 0.5 : 1,
              ...(dragOverLayerIndex === index && draggedLayerIndex !== index ? {
                borderTop: '2px solid #3b82f6'
              } : {}),
              ...(dragOverLayerIndex === index + 1 && draggedLayerIndex !== index ? {
                borderBottom: '2px solid #3b82f6'
              } : {})
            }}
          >
            <div 
              draggable
              onDragStart={(e) => onLayerDragStart(e, index)}
              onDragEnd={onLayerDragEnd}
              className="cursor-grab text-gray-400 hover:text-gray-600 flex items-center justify-center" 
              style={{ fontSize: '18px', width: '20px', height: '100%' }}
            >
              <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                <circle cx="3" cy="3" r="1.5" />
                <circle cx="9" cy="3" r="1.5" />
                <circle cx="3" cy="8" r="1.5" />
                <circle cx="9" cy="8" r="1.5" />
                <circle cx="3" cy="13" r="1.5" />
                <circle cx="9" cy="13" r="1.5" />
              </svg>
            </div>
            <div 
              className="flex-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectLayer(layer.id);
              }}
            >
              <div className="text-sm font-medium text-gray-900">{layer.label}</div>
              <div className="text-xs text-gray-500">{layer.type}</div>
            </div>
            {selectedLayerId === layer.id && (
              <div 
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#2563eb'
                }}
              />
            )}
          </div>
        ))}
        {/* Drop zone for end of list */}
        <div
          onDragOver={(e) => onLayerDragOver(e, layers.length)}
          onDrop={(e) => onLayerDrop(e, layers.length)}
          className="h-2"
          style={{
            ...(dragOverLayerIndex === layers.length && draggedLayerIndex !== null ? {
              borderTop: '2px solid #3b82f6'
            } : {})
          }}
        />
      </div>
    </div>
  );
}
