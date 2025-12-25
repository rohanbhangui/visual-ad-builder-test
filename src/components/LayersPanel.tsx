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
}: LayersPanelProps) {
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
        className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-900"
        onMouseDown={onMouseDown}
      >
        Layers
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: '440px' }}>
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            draggable
            onDragStart={(e) => onLayerDragStart(e, index)}
            onDragOver={(e) => onLayerDragOver(e, index)}
            onDrop={(e) => onLayerDrop(e, index)}
            onDragEnd={onLayerDragEnd}
            className={`flex items-center gap-2 px-4 py-2 border-b border-gray-100 hover:bg-gray-50 ${
              selectedLayerId === layer.id ? 'bg-blue-50' : ''
            } ${
              dragOverLayerIndex === index && draggedLayerIndex !== index ? 'border-t-2 border-t-blue-500' : ''
            }`}
            style={{ opacity: draggedLayerIndex === index ? 0.5 : 1 }}
          >
            <div className="cursor-grab text-gray-400 hover:text-gray-600" style={{ fontSize: '14px' }}>
              =
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
      </div>
    </div>
  );
}
