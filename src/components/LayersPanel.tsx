import { useState, useRef, useEffect } from 'react';
import { type LayerContent, type GroupLayer } from '../data';
import { COLORS, UI_COLORS, UI_LAYOUT } from '../consts';
import PlusIcon from '../assets/icons/plus.svg?react';
import ExpandIcon from '../assets/icons/expand.svg?react';
import CollapseIcon from '../assets/icons/collapse.svg?react';
import LockIcon from '../assets/icons/lock.svg?react';
import UnlockIcon from '../assets/icons/unlock.svg?react';
import ChevronDownIcon from '../assets/icons/chevron-down.svg?react';
import LayerTextIcon from '../assets/icons/layer-text.svg?react';
import LayerButtonIcon from '../assets/icons/layer-button.svg?react';
import LayerImageIcon from '../assets/icons/layer-image.svg?react';
import LayerVideoIcon from '../assets/icons/layer-video.svg?react';
import LayerRichtextIcon from '../assets/icons/layer-richtext.svg?react';
import LayerGroupIcon from '../assets/icons/layer-group.svg?react';
import UngroupIcon from '../assets/icons/ungroup.svg?react';

/** A row entry in the rendered visible list */
interface VisibleRow {
  layer: LayerContent;
  flatIndex: number;   // index in the raw `layers` array
  depth: number;       // 0 = top-level, 1 = child of group
  parentGroupId?: string;
}

interface LayersPanelProps {
  layers: LayerContent[];
  selectedLayerIds: string[];
  onSelectLayer: (layerId: string, isOptionPressed: boolean) => void;
  panelPos: { x: number; y: number };
  panelSide: 'left' | 'right';
  isDragging: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  draggedLayerIndex: number | null;
  dragOverLayerIndex: number | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onLayerDragStart: (e: React.DragEvent, index: number, parentGroupId?: string) => void;
  onLayerDragOver: (e: React.DragEvent, index: number) => void;
  onLayerDrop: (e: React.DragEvent, index: number, parentGroupId?: string) => void;
  onLayerDragEnd: () => void;
  onAddLayer: (type: 'text' | 'richtext' | 'image' | 'video' | 'button') => void;
  onToggleLock: (layerId: string) => void;
  onGroupLayers: () => void;
  onUngroupLayers: () => void;
}

export const LayersPanel = ({
  layers,
  selectedLayerIds,
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
  onGroupLayers,
  onUngroupLayers,
}: LayersPanelProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine group/ungroup button visibility
  const childIds = new Set<string>(
    layers
      .filter((l): l is GroupLayer => l.type === 'group')
      .flatMap((g) => g.children)
  );
  const selectedNonGroupLayers = selectedLayerIds.filter(
    (id) => !layers.find((l) => l.id === id && l.type === 'group')
  );
  const selectedGroupLayers = selectedLayerIds.filter((id) =>
    layers.find((l) => l.id === id && l.type === 'group')
  );
  const canGroup =
    selectedNonGroupLayers.length >= 2 &&
    selectedGroupLayers.length === 0;
  const canUngroup = selectedLayerIds.length === 1 && selectedGroupLayers.length === 1;

  // Build visible rows: top-level layers + expanded group children
  const visibleRows: VisibleRow[] = [];
  layers.forEach((layer, flatIndex) => {
    if (childIds.has(layer.id)) return; // skip: rendered inside group rows
    visibleRows.push({ layer, flatIndex, depth: 0 });
    if (layer.type === 'group') {
      const groupLayer = layer as GroupLayer;
      const isExpanded = expandedGroups[layer.id] !== false; // default expanded
      if (isExpanded) {
        groupLayer.children.forEach((childId) => {
          const childFlatIndex = layers.findIndex((l) => l.id === childId);
          const childLayer = childFlatIndex >= 0 ? layers[childFlatIndex] : null;
          if (childLayer) {
            visibleRows.push({
              layer: childLayer,
              flatIndex: childFlatIndex,
              depth: 1,
              parentGroupId: layer.id,
            });
          }
        });
      }
    }
  });

  const layerTypes = [
    { type: 'text' as const, icon: LayerTextIcon, label: 'Text', description: 'Simple text content' },
    { type: 'button' as const, icon: LayerButtonIcon, label: 'Button', description: 'Clickable button link' },
    { type: 'image' as const, icon: LayerImageIcon, label: 'Image', description: 'Static image element' },
    { type: 'video' as const, icon: LayerVideoIcon, label: 'Video', description: 'Embedded video player' },
    { type: 'richtext' as const, icon: LayerRichtextIcon, label: 'Rich Text', description: 'Formatted text with styling' },
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
      data-layers-panel
      className={`absolute w-[300px] bg-white rounded-lg shadow-xl z-[1000] select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        top: `${panelPos.y}px`,
        left: panelPos.x === -1 ? (panelSide === 'right' ? 'auto' : '10px') : `${panelPos.x}px`,
        right: panelPos.x === -1 && panelSide === 'right' ? '10px' : 'auto',
      }}
    >
      {/* Panel header */}
      <div
        className={`px-4 py-3 font-semibold text-gray-900 flex items-center justify-between ${
          !isCollapsed ? 'border-b border-gray-200' : ''
        }`}
      >
        <div
          onMouseDown={onMouseDown}
          className="flex items-center gap-2 flex-1 cursor-grab active:cursor-grabbing"
        >
          <span>Layers</span>
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
        </div>
        <div className="flex items-center gap-1">
          {/* Group / Ungroup button */}
          {canGroup ? (
            <button
              onClick={(e) => { e.stopPropagation(); onGroupLayers(); }}
              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
              title={`Group selected layers (${selectedNonGroupLayers.length})`}
            >
              <LayerGroupIcon />
            </button>
          ) : canUngroup ? (
            <button
              onClick={(e) => { e.stopPropagation(); onUngroupLayers(); }}
              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
              title="Ungroup layers"
            >
              <UngroupIcon />
            </button>
          ) : null}
          {/* Add layer dropdown */}
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
                      onClick={(e) => {
                        e.stopPropagation();
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
                        <div className="text-xs font-normal text-gray-500">{layerType.description}</div>
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
          style={{ maxHeight: `${UI_LAYOUT.LAYERS_PANEL_EXPANDED_HEIGHT - UI_LAYOUT.LAYERS_PANEL_COLLAPSED_HEIGHT}px` }}
          onClick={() => setShowDropdown(false)}
        >
          {visibleRows.map((row, rowIndex) => {
            const { layer, flatIndex, depth, parentGroupId } = row;
            const isSelected = selectedLayerIds.includes(layer.id);
            const isGroupRow = layer.type === 'group';
            const isExpanded = isGroupRow && expandedGroups[layer.id] !== false;
            const isDraggedRow = draggedLayerIndex === flatIndex;
            const isDragOver = dragOverLayerIndex === flatIndex && draggedLayerIndex !== flatIndex;
            const isDragOverGroup = dragOverGroupId === layer.id;
            const parentGroup = parentGroupId ? layers.find((l) => l.id === parentGroupId) : undefined;
            const parentGroupLocked = parentGroup?.locked ?? false;
            const effectiveLocked = layer.locked || parentGroupLocked;

            // Next visible row flat index (for "after" indicator)
            const nextRow = visibleRows[rowIndex + 1];
            const isNextDragOver =
              nextRow
                ? dragOverLayerIndex === nextRow.flatIndex && draggedLayerIndex !== nextRow.flatIndex
                : dragOverLayerIndex === layers.length;

            return (
              <div
                key={layer.id}
                draggable
                onDragStart={(e) => {
                  onLayerDragStart(e, flatIndex, parentGroupId);
                  const layerItem = e.currentTarget as HTMLElement;
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
                  e.dataTransfer.setDragImage(clone, rect.width / 2, rect.height / 2);
                  setTimeout(() => {
                    if (document.body.contains(clone)) document.body.removeChild(clone);
                  }, 0);
                }}
                onDragEnd={() => {
                  setDragOverGroupId(null);
                  onLayerDragEnd();
                }}
                onDragOver={(e) => {
                  // Group rows: the whole row is a "drop into group" target —
                  // but groups cannot be nested inside other groups.
                  const draggedIsGroup = draggedLayerIndex !== null && layers[draggedLayerIndex]?.type === 'group';
                  if (isGroupRow && !draggedIsGroup && draggedLayerIndex !== null && draggedLayerIndex !== flatIndex) {
                    e.preventDefault();
                    setDragOverGroupId(layer.id);
                  } else {
                    setDragOverGroupId(null);
                    onLayerDragOver(e, flatIndex);
                  }
                }}
                onDrop={(e) => {
                  const draggedIsGroup = draggedLayerIndex !== null && layers[draggedLayerIndex]?.type === 'group';
                  if (isGroupRow && !draggedIsGroup && draggedLayerIndex !== null && draggedLayerIndex !== flatIndex) {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverGroupId(null);
                    // Route through the unified drop handler with the group as the target parent
                    onLayerDrop(e, flatIndex, layer.id);
                    onLayerDragEnd();
                  } else {
                    setDragOverGroupId(null);
                    onLayerDrop(e, flatIndex, parentGroupId);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverGroupId === layer.id) setDragOverGroupId(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLayer(layer.id, e.shiftKey);
                }}
                className={`layer-item group/layer relative flex items-center gap-1.5 py-1.5 border-b border-gray-100 cursor-grab active:cursor-grabbing px-4 ${
                  depth === 1 ? 'pl-8' : ''
                } ${
                  isSelected
                    ? `${UI_COLORS.SELECTED_LAYER_BG} hover:bg-blue-200`
                    : isDragOverGroup
                      ? 'bg-blue-50'
                      : depth === 1 && parentGroupId && selectedLayerIds.includes(parentGroupId)
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'hover:bg-gray-50'
                }`}
                style={{
                  opacity: isDraggedRow ? 0.4 : 1,
                  ...(isDragOver ? { borderTop: `1px solid ${COLORS.BLUE_PRIMARY}` } : {}),
                  ...(isNextDragOver && !isDraggedRow
                    ? { borderBottom: `1px solid ${COLORS.BLUE_PRIMARY}` }
                    : {}),
                  ...(isDragOverGroup ? { outline: `2px solid ${COLORS.BLUE_PRIMARY}`, outlineOffset: '-2px' } : {}),
                }}
              >
                {/* Selected indicator */}
                {isSelected ? (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 z-10 ${UI_COLORS.SELECTED_INDICATOR}`} />
                ) : null}

                {/* Chevron — absolutely positioned so it doesn't shift text alignment */}
                {isGroupRow ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedGroups((prev) => ({
                        ...prev,
                        [layer.id]: !isExpanded,
                      }));
                    }}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer opacity-0 group-hover/layer:opacity-100 transition-opacity z-10"
                    title={isExpanded ? 'Collapse group' : 'Expand group'}
                  >
                    <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                  </button>
                ) : null}

                {/* Label + type */}
                <div className="flex-1 py-1 pr-2 min-w-0 pl-2">
                  <div className="relative overflow-hidden">
                    <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {layer.label}
                    </div>
                    {/* Gradient fades — colour matches the row background */}
                    {isSelected ? (
                      <>
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-blue-100 to-transparent pointer-events-none group-hover/layer:opacity-0" />
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-blue-200 to-transparent pointer-events-none opacity-0 group-hover/layer:opacity-100" />
                      </>
                    ) : depth === 1 && parentGroupId && selectedLayerIds.includes(parentGroupId) ? (
                      <>
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-blue-50 to-transparent pointer-events-none group-hover/layer:opacity-0" />
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-blue-100 to-transparent pointer-events-none opacity-0 group-hover/layer:opacity-100" />
                      </>
                    ) : (
                      <>
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none group-hover/layer:opacity-0" />
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none opacity-0 group-hover/layer:opacity-100" />
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{layer.type}</div>
                </div>

                {/* Lock toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!parentGroupLocked) {
                      onToggleLock(layer.id);
                    }
                  }}
                  className={`p-1 transition-colors relative z-10 flex-shrink-0 ${
                    effectiveLocked
                      ? parentGroupLocked && !layer.locked
                        ? 'text-gray-400 cursor-default'
                        : 'text-gray-600 hover:text-gray-800 cursor-pointer'
                      : 'text-gray-400 opacity-0 group-hover/layer:opacity-100 hover:text-gray-600 cursor-pointer'
                  }`}
                  title={
                    parentGroupLocked && !layer.locked
                      ? 'Locked by parent group'
                      : layer.locked
                        ? 'Unlock layer'
                        : 'Lock layer'
                  }
                >
                  {effectiveLocked ? <LockIcon /> : <UnlockIcon />}
                </button>

                {/* no indent guide */}
              </div>
            );
          })}
          {/* Drop zone for end of list */}
          <div
            onDragOver={(e) => onLayerDragOver(e, layers.length)}
            onDrop={(e) => onLayerDrop(e, layers.length, undefined)}
            className="h-2"
            style={{
              ...(dragOverLayerIndex === layers.length && draggedLayerIndex !== null
                ? { borderTop: `1px solid ${COLORS.BLUE_SELECTED}` }
                : {}),
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
