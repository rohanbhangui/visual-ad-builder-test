import { useState, useRef, useEffect } from 'react';
import { type LayerContent } from '../data';
import { COLORS, UI_COLORS, UI_LAYOUT } from '../consts';
import PlusIcon from '../assets/icons/plus.svg?react';
import ExpandIcon from '../assets/icons/expand.svg?react';
import CollapseIcon from '../assets/icons/collapse.svg?react';
import SettingsIcon from '../assets/icons/settings.svg?react';
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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  draggedLayerIndex: number | null;
  dragOverLayerIndex: number | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onLayerDragStart: (e: React.DragEvent, index: number) => void;
  onLayerDragOver: (e: React.DragEvent, index: number) => void;
  onLayerDrop: (e: React.DragEvent, index: number) => void;
  onLayerDragEnd: () => void;
  onAddLayer: (type: 'text' | 'richtext' | 'image' | 'video' | 'button') => void;
  onToggleLock: (layerId: string) => void;
  onCanvasSettings: () => void;
}

export const LayersPanel = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  panelPos,
  panelSide,
  isDragging,
  isCollapsed,
  onToggleCollapse,
  draggedLayerIndex,
  dragOverLayerIndex,
  onMouseDown,
  onLayerDragStart,
  onLayerDragOver,
  onLayerDrop,
  onLayerDragEnd,
  onAddLayer,
  onToggleLock,
  onCanvasSettings,
}: LayersPanelProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const layerTypes = [
    {
      type: 'text' as const,
      icon: LayerTextIcon,
      label: 'Text',
      description: 'Simple text content',
    },
    {
      type: 'button' as const,
      icon: LayerButtonIcon,
      label: 'Button',
      description: 'Clickable button link',
    },
    {
      type: 'image' as const,
      icon: LayerImageIcon,
      label: 'Image',
      description: 'Static image element',
    },
    {
      type: 'video' as const,
      icon: LayerVideoIcon,
      label: 'Video',
      description: 'Embedded video player',
    },
    {
      type: 'richtext' as const,
      icon: LayerRichtextIcon,
      label: 'Rich Text',
      description: 'Formatted text with styling',
    },
  ];

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
      className={`absolute w-[300px] bg-white rounded-lg shadow-xl z-[1000] select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        top: `${panelPos.y}px`,
        left: panelPos.x === -1 ? (panelSide === 'right' ? 'auto' : '10px') : `${panelPos.x}px`,
        right: panelPos.x === -1 && panelSide === 'right' ? '10px' : 'auto',
      }}
    >
      <div
        className={`px-4 py-3 font-semibold text-gray-900 flex items-center justify-between ${
          !isCollapsed ? 'border-b border-gray-200' : ''
        }`}
      >
        <div onMouseDown={onMouseDown} className="flex-1 cursor-grab active:cursor-grabbing">
          Layers
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCanvasSettings();
            }}
            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
            title="Canvas Settings"
          >
            <SettingsIcon />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
              setShowDropdown(false);
            }}
            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand layers' : 'Collapse layers'}
          >
            {isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
          </button>
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
            {showDropdown ? (
              <div
                className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded shadow-lg z-[1001]"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {layerTypes.map((layerType, index) => {
                  const Icon = layerType.icon;
                  const isLast = index === layerTypes.length - 1;
                  return (
                    <button
                      key={layerType.type}
                      onClick={() => {
                        onAddLayer(layerType.type);
                        setShowDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-start gap-2 cursor-pointer ${
                        !isLast ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4 mt-0.5 text-gray-600 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{layerType.label}</div>
                        <div className="text-xs font-normal text-gray-500">
                          {layerType.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {!isCollapsed ? (
        <div
          className="overflow-y-auto overflow-x-hidden"
          style={{
            maxHeight: `${UI_LAYOUT.LAYERS_PANEL_EXPANDED_HEIGHT - UI_LAYOUT.LAYERS_PANEL_COLLAPSED_HEIGHT}px`,
          }}
          onClick={() => setShowDropdown(false)}
        >
          {layers.map((layer, index) => (
            <div
              key={layer.id}
              onDragOver={(e) => onLayerDragOver(e, index)}
              onDrop={(e) => onLayerDrop(e, index)}
              className={`layer-item group/layer flex items-center gap-2 px-4 py-2 border-b border-gray-100 ${
                selectedLayerId === layer.id
                  ? `${UI_COLORS.SELECTED_LAYER_BG} hover:bg-blue-200`
                  : 'hover:bg-gray-50'
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
                className="flex-1 cursor-pointer -my-2 py-2 pr-2 -mr-[72px] rounded-r"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLayer(layer.id);
                }}
              >
                <div className="relative overflow-hidden max-w-[190px]">
                  <div className='text-sm font-medium text-gray-900 whitespace-nowrap'>{layer.label}</div>
                  
                  {/* Gradient fades based on state - positioned below icons (z-10) */}
                  {/* Not selected, not hovered */}
                  {selectedLayerId !== layer.id ? (
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none group-hover/layer:opacity-0" />
                  ): null}
                  
                  {/* Not selected, hovered */}
                  {selectedLayerId !== layer.id ? (
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none opacity-0 group-hover/layer:opacity-100" />
                  ): null}
                  
                  {/* Selected, not hovered */}
                  {selectedLayerId === layer.id ? (
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-blue-100 to-transparent pointer-events-none group-hover/layer:opacity-0" />
                  ): null}
                  
                  {/* Selected, hovered */}
                  {selectedLayerId === layer.id ? (
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-blue-200 to-transparent pointer-events-none opacity-0 group-hover/layer:opacity-100" />
                  ): null}
                </div>
                <div className="text-xs text-gray-500">{layer.type}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(layer.id);
                }}
                className={`p-1 transition-colors cursor-pointer relative z-10 ${
                  layer.locked
                    ? 'text-gray-600 hover:text-gray-800'
                    : 'text-gray-400 opacity-0 group-hover/layer:opacity-100 hover:text-gray-600'
                }`}
                title={layer.locked ? 'Unlock layer' : 'Lock layer'}
              >
                {layer.locked ? <LockIcon /> : <UnlockIcon />}
              </button>
              {selectedLayerId === layer.id ? (
                <div className={`w-2 h-2 rounded-full relative z-10 ${UI_COLORS.SELECTED_INDICATOR}`} />
              ) : null}
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
      ) : null}
    </div>
  );
};
