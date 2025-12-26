import { useState, useRef, useEffect } from 'react';
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
  onAddLayer: (type: 'text' | 'richtext' | 'image' | 'video' | 'button') => void;
}

export const LayersPanel = ({
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
}: LayersPanelProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div
      className={`absolute w-[300px] max-h-[500px] bg-white rounded-lg shadow-xl z-[1000] overflow-hidden select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        top: `${panelPos.y}px`,
        left: panelPos.x === -1 ? (panelSide === 'right' ? 'auto' : '10px') : `${panelPos.x}px`,
        right: panelPos.x === -1 && panelSide === 'right' ? '10px' : 'auto',
      }}
    >
      <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-900 flex items-center justify-between">
        <div onMouseDown={onMouseDown} className="flex-1 cursor-grab">
          Layers
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
                  onAddLayer('button');
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100"
              >
                Button
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
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100"
              >
                Video
              </button>
              <button
                onClick={() => {
                  onAddLayer('richtext');
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                Rich Text
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-y-auto max-h-[440px]">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            onDragOver={(e) => onLayerDragOver(e, index)}
            onDrop={(e) => onLayerDrop(e, index)}
            className={`layer-item flex items-center gap-2 px-4 py-2 border-b border-gray-100 hover:bg-gray-50 ${
              selectedLayerId === layer.id ? 'bg-blue-50' : ''
            }`}
            style={{
              opacity: draggedLayerIndex === index ? 0.4 : 1,
              ...(dragOverLayerIndex === index && draggedLayerIndex !== index
                ? {
                    borderTop: '1px solid #3b82f6',
                  }
                : {}),
              ...(dragOverLayerIndex === index + 1 && draggedLayerIndex !== index
                ? {
                    borderBottom: '1px solid #3b82f6',
                  }
                : {}),
            }}
          >
            <div
              draggable
              onDragStart={(e) => {
                onLayerDragStart(e, index);

                // Create a custom drag image
                const layerItem = (e.target as HTMLElement).closest('.layer-item') as HTMLElement;
                if (layerItem) {
                  const clone = layerItem.cloneNode(true) as HTMLElement;
                  clone.style.position = 'absolute';
                  clone.style.top = '-9999px';
                  clone.style.left = '-9999px';
                  clone.style.width = `${layerItem.offsetWidth}px`;
                  clone.style.height = `${layerItem.offsetHeight}px`;
                  clone.style.backgroundColor = 'white';
                  clone.style.border = '2px solid #3b82f6';
                  clone.style.borderRadius = '4px';
                  clone.style.opacity = '0.95';
                  clone.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  document.body.appendChild(clone);

                  const rect = layerItem.getBoundingClientRect();
                  // Set drag image offset to grab from left edge (where handle is)
                  e.dataTransfer.setDragImage(clone, 25, rect.height / 2);

                  setTimeout(() => {
                    if (document.body.contains(clone)) {
                      document.body.removeChild(clone);
                    }
                  }, 0);
                }
              }}
              onDragEnd={onLayerDragEnd}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex items-center justify-center text-lg w-5 h-full"
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
            {selectedLayerId === layer.id && <div className="w-2 h-2 rounded-full bg-blue-600" />}
          </div>
        ))}
        {/* Drop zone for end of list */}
        <div
          onDragOver={(e) => onLayerDragOver(e, layers.length)}
          onDrop={(e) => onLayerDrop(e, layers.length)}
          className="h-2"
          style={{
            ...(dragOverLayerIndex === layers.length && draggedLayerIndex !== null
              ? {
                  borderTop: '1px solid #2563eb',
                }
              : {}),
          }}
        />
      </div>
    </div>
  );
};
