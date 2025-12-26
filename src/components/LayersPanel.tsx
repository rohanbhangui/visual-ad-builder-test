import { useState, useRef, useEffect } from 'react';
import { type LayerContent } from '../data';
import { COLORS, UI_COLORS } from '../consts';
import PlusIcon from '../assets/icons/plus.svg?react';
import DragHandleIcon from '../assets/icons/drag-handle.svg?react';
import LockIcon from '../assets/icons/lock.svg?react';
import UnlockIcon from '../assets/icons/unlock.svg?react';
import LayerTextIcon from '../assets/icons/layer-text.svg?react';
import LayerButtonIcon from '../assets/icons/layer-button.svg?react';
import LayerImageIcon from '../assets/icons/layer-image.svg?react';
import LayerVideoIcon from '../assets/icons/layer-video.svg?react';
import LayerRichtextIcon from '../assets/icons/layer-richtext.svg?react';

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
  onToggleLock: (layerId: string) => void;
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
  onToggleLock,
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
            className={`w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer ${
              showDropdown ? 'bg-gray-200' : ''
            }`}
          >
            <PlusIcon />
          </button>
          {showDropdown && (
            <div
              className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded shadow-lg z-50"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  onAddLayer('text');
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 flex items-start gap-2 cursor-pointer"
              >
                <LayerTextIcon className="w-4 h-4 mt-0.5 text-gray-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Text</div>
                  <div className="text-xs font-normal text-gray-500">Simple text content</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onAddLayer('button');
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 flex items-start gap-2 cursor-pointer"
              >
                <LayerButtonIcon className="w-4 h-4 mt-0.5 text-gray-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Button</div>
                  <div className="text-xs font-normal text-gray-500">Clickable button link</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onAddLayer('image');
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 flex items-start gap-2 cursor-pointer"
              >
                <LayerImageIcon className="w-4 h-4 mt-0.5 text-gray-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Image</div>
                  <div className="text-xs font-normal text-gray-500">Static image element</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onAddLayer('video');
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 flex items-start gap-2 cursor-pointer"
              >
                <LayerVideoIcon className="w-4 h-4 mt-0.5 text-gray-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Video</div>
                  <div className="text-xs font-normal text-gray-500">Embedded video player</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onAddLayer('richtext');
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-start gap-2 cursor-pointer"
              >
                <LayerRichtextIcon className="w-4 h-4 mt-0.5 text-gray-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Rich Text</div>
                  <div className="text-xs font-normal text-gray-500">Formatted text with styling</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-y-auto max-h-[440px]" onClick={() => setShowDropdown(false)}>
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            onDragOver={(e) => onLayerDragOver(e, index)}
            onDrop={(e) => onLayerDrop(e, index)}
            className={`layer-item group/layer flex items-center gap-2 px-4 py-2 border-b border-gray-100 ${
              selectedLayerId === layer.id ? UI_COLORS.SELECTED_LAYER_BG : ''
            }`}
            style={{
              opacity: draggedLayerIndex === index ? 0.4 : 1,
              ...(dragOverLayerIndex === index && draggedLayerIndex !== index
                ? {
                    borderTop: `1px solid ${COLORS.BLUE_PRIMARY}`,
                  }
                : {}),
              ...(dragOverLayerIndex === index + 1 && draggedLayerIndex !== index
                ? {
                    borderBottom: `1px solid ${COLORS.BLUE_PRIMARY}`,
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
                  clone.style.border = `2px solid ${COLORS.BLUE_PRIMARY}`;
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
              <DragHandleIcon />
            </div>
            <div
              className="flex-1 cursor-pointer hover:bg-gray-50 -my-2 py-2 pr-2 -mr-[72px] rounded-r"
              onClick={(e) => {
                e.stopPropagation();
                onSelectLayer(layer.id);
              }}
            >
              <div className="text-sm font-medium text-gray-900">{layer.label}</div>
              <div className="text-xs text-gray-500">{layer.type}</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(layer.id);
              }}
              className={`p-1 transition-colors cursor-pointer ${
                layer.locked
                  ? 'text-gray-600 hover:text-gray-800'
                  : 'text-gray-400 opacity-0 group-hover/layer:opacity-100 hover:text-gray-600'
              }`}
              title={layer.locked ? 'Unlock layer' : 'Lock layer'}
            >
              {layer.locked ? <LockIcon /> : <UnlockIcon />}
            </button>
            {selectedLayerId === layer.id && <div className={`w-2 h-2 rounded-full ${UI_COLORS.SELECTED_INDICATOR}`} />}
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
                  borderTop: `1px solid ${COLORS.BLUE_SELECTED}`,
                }
              : {}),
          }}
        />
      </div>
    </div>
  );
};
