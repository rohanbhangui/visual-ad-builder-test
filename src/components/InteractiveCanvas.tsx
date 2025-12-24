import { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import type { Canvas, LayerContent } from '../data';
import { HTML5_AD_SIZES } from '../data';

const edgeHandleStyles = `
  .edge-top {
    top: -8px !important;
    left: 0 !important;
    width: 100% !important;
    height: 16px !important;
    cursor: n-resize !important;
    background: transparent !important;
  }
  .edge-bottom {
    bottom: -8px !important;
    left: 0 !important;
    width: 100% !important;
    height: 16px !important;
    cursor: s-resize !important;
    background: transparent !important;
  }
  .edge-left {
    left: -8px !important;
    top: 0 !important;
    width: 16px !important;
    height: 100% !important;
    cursor: w-resize !important;
    background: transparent !important;
  }
  .edge-right {
    right: -8px !important;
    top: 0 !important;
    width: 16px !important;
    height: 100% !important;
    cursor: e-resize !important;
    background: transparent !important;
  }
  
  /* Reset all default styles to match iframe behavior */
  [data-layer-content] {
    all: initial !important;
    display: block !important;
  }
  
  [data-layer-content] * {
    all: revert !important;
  }

`;

interface InteractiveCanvasProps {
  canvas: Canvas;
  size: keyof typeof HTML5_AD_SIZES;
  onLayerUpdate: (layerId: string, updates: Partial<LayerContent>) => void;
}

const InteractiveCanvas = ({ canvas, size, onLayerUpdate }: InteractiveCanvasProps) => {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [resizingLayerId, setResizingLayerId] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);
  const adSize = HTML5_AD_SIZES[size];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedLayerId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDragStop = (layerId: string, d: { x: number; y: number }) => {
    const layer = canvas.layers.find((l) => l.id === layerId);
    if (!layer) return;

    const position = layer.position[size];
    if (position) {
      onLayerUpdate(layerId, {
        position: {
          ...layer.position,
          [size]: { ...position, x: d.x, y: d.y },
        },
      } as Partial<LayerContent>);
    }
    setDraggingLayerId(null);
  };

  const handleResizeStop = (
    layerId: string,
    d: { width: number; height: number },
    ref: HTMLElement,
    delta: { width: number; height: number },
    position: { x: number; y: number }
  ) => {
    const layer = canvas.layers.find((l) => l.id === layerId);
    if (!layer) return;

    const positionData = layer.position[size];
    const widthData = layer.width[size];
    const heightData = layer.height[size];

    if (!positionData || !widthData || !heightData) return;

    onLayerUpdate(layerId, {
      position: {
        ...layer.position,
        [size]: { ...positionData, x: Math.round(position.x), y: Math.round(position.y) },
      },
      width: {
        ...layer.width,
        [size]: { ...widthData, value: Math.round(d.width) },
      },
      height: {
        ...layer.height,
        [size]: { ...heightData, value: Math.round(d.height) },
      },
    } as Partial<LayerContent>);
    setResizingLayerId(null);
  };

  const ResizeHandle = () => (
    <div
      style={{
        position: 'absolute',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
      }}
    >
      <div
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          border: '1px solid white',
          boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
        }}
      />
    </div>
  );

  return (
    <>
      <style>{edgeHandleStyles}</style>
      <div
        style={{
          width: `${adSize.width}px`,
          height: `${adSize.height}px`,
          position: 'relative',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
          border: '1px solid #9ca3af',
          boxSizing: 'border-box',
        }}
      >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      >
        {canvas.layers.map((layer) => {
          const position = layer.position[size];
          const width = layer.width[size];
          const height = layer.height[size];

          if (!position || !width || !height) return null;

          if (selectedLayerId !== layer.id || draggingLayerId === layer.id || resizingLayerId === layer.id) return null;

          const x = position.x as number;
          const y = position.y as number;
          const w = width.value;
          const h = height.value;

          return (
            <div key={`handles-${layer.id}`}>
              <div
                style={{
                  position: 'absolute',
                  top: `${y}px`,
                  left: `${x}px`,
                  marginTop: '-16px',
                  marginLeft: '-16px',
                }}
              >
                <ResizeHandle />
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: `${y}px`,
                  left: `${x + w}px`,
                  marginTop: '-16px',
                  marginLeft: '-16px',
                }}
              >
                <ResizeHandle />
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: `${y + h}px`,
                  left: `${x}px`,
                  marginTop: '-16px',
                  marginLeft: '-16px',
                }}
              >
                <ResizeHandle />
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: `${y + h}px`,
                  left: `${x + w}px`,
                  marginTop: '-16px',
                  marginLeft: '-16px',
                }}
              >
                <ResizeHandle />
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: `${y - 24}px`,
                  left: `${x}px`,
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {layer.label}
              </div>
            </div>
          );
        })}
      </div>

      {canvas.layers.map((layer) => {
        const position = layer.position[size];
        const width = layer.width[size];
        const height = layer.height[size];

        if (!position || !width || !height) return null;

        const x = position.x as number;
        const y = position.y as number;
        const w = width.value;
        const h = height.value;

        // Check if element is outside canvas bounds
        const isOutside =
          x + w < 0 || x > adSize.width || y + h < 0 || y > adSize.height;

        return (
          <Rnd
            key={layer.id}
            default={{
              x: x,
              y: y,
              width: w,
              height: h,
            }}
            onDragStop={(e, d) => handleDragStop(layer.id, d)}
            onResizeStop={(e, dir, ref, delta, pos) =>
              handleResizeStop(
                layer.id,
                { width: ref.offsetWidth, height: ref.offsetHeight },
                ref,
                delta,
                pos
              )
            }
            onDragStart={() => setDraggingLayerId(layer.id)}
            onResizeStart={() => setResizingLayerId(layer.id)}
            onClick={() => setSelectedLayerId(layer.id)}
            lockAspectRatio={false}
            resizeHandleClasses={{
              top: selectedLayerId === layer.id ? 'edge-top' : 'hidden',
              topRight: selectedLayerId === layer.id ? '' : 'hidden',
              right: selectedLayerId === layer.id ? 'edge-right' : 'hidden',
              bottomRight: selectedLayerId === layer.id ? '' : 'hidden',
              bottom: selectedLayerId === layer.id ? 'edge-bottom' : 'hidden',
              bottomLeft: selectedLayerId === layer.id ? '' : 'hidden',
              left: selectedLayerId === layer.id ? 'edge-left' : 'hidden',
              topLeft: selectedLayerId === layer.id ? '' : 'hidden',
            }}
            style={{
              border: hoveredLayerId === layer.id || selectedLayerId === layer.id ? '1px solid #3b82f6' : '1px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'move',
              position: 'absolute',
              zIndex: isOutside ? 999 : 'auto',
              overflow: isOutside ? 'visible' : 'hidden',
              clipPath: !isOutside ? 'none' : undefined,
            }}
            onMouseEnter={(e) => {
              setHoveredLayerId(layer.id);
              if (selectedLayerId !== layer.id) return;
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const edgeThreshold = 6;

              if (Math.abs(y) < edgeThreshold || Math.abs(y - rect.height) < edgeThreshold) {
                setHoveredEdge('horizontal');
              } else if (Math.abs(x) < edgeThreshold || Math.abs(x - rect.width) < edgeThreshold) {
                setHoveredEdge('vertical');
              }
            }}
            onMouseLeave={() => {
              setHoveredLayerId(null);
              setHoveredEdge(null);
            }}
          >
            <div data-layer-content>
              {layer.type === 'image' && (
                <img
                  src={layer.url}
                  alt={layer.label}
                />
              )}
              {layer.type === 'video' && (
                <video 
                  controls 
                  autoPlay 
                  muted 
                  style={{ pointerEvents: 'none' }}
                >
                  <source src={layer.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
              {layer.type === 'text' && (
                <span>
                  {layer.content}
                </span>
              )}
              {layer.type === 'richtext' && (
                <div
                  dangerouslySetInnerHTML={{ __html: layer.content }}
                />
              )}
            </div>
          </Rnd>
        );
      })}
    </div>
    </>
  );
};

export { InteractiveCanvas };
