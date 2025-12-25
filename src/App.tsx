import { useState, useRef, useEffect } from 'react';
import { sampleCanvas, HTML5_AD_SIZES, type LayerContent } from './data';
import { TopBar } from './components/TopBar';
import { SizeSelector } from './components/SizeSelector';
import { LayersPanel } from './components/LayersPanel';
import { PropertySidebar } from './components/PropertySidebar';
import { Canvas } from './components/Canvas';
import { useCanvasInteractions } from './hooks/useCanvasInteractions';

function App() {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [layers, setLayers] = useState<LayerContent[]>(sampleCanvas.layers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<keyof typeof HTML5_AD_SIZES>('336x280');
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [layersPanelSide, setLayersPanelSide] = useState<'left' | 'right'>('right');
  const [isLayersPanelDragging, setIsLayersPanelDragging] = useState(false);
  const [layersPanelPos, setLayersPanelPos] = useState({ x: -1, y: 10 });
  const [draggedLayerIndex, setDraggedLayerIndex] = useState<number | null>(null);
  const [dragOverLayerIndex, setDragOverLayerIndex] = useState<number | null>(null);
  const layersPanelDragRef = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });

  const dimensions = HTML5_AD_SIZES[selectedSize];

  // Use the canvas interactions hook
  const {
    snapLines,
    handleLayerMouseDown,
    handleResizeMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave
  } = useCanvasInteractions({
    mode,
    layers,
    selectedLayerId,
    selectedSize,
    isShiftPressed,
    setLayers,
    setSelectedLayerId
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Extended handleMouseUp for layers panel dragging
  const handleExtendedMouseUp = () => {
    handleMouseUp();
    
    if (isLayersPanelDragging) {
      const dx = Math.abs(layersPanelPos.x - layersPanelDragRef.current.panelX);
      const dy = Math.abs(layersPanelPos.y - layersPanelDragRef.current.panelY);
      const hasActuallyMoved = dx > 5 || dy > 5;
      
      if (hasActuallyMoved) {
        const windowWidth = window.innerWidth;
        const sidebarWidth = 320;
        const panelWidth = 300;
        const panelCenter = layersPanelPos.x + 150;
        const snapToRight = panelCenter > (windowWidth - sidebarWidth) / 2;
        setLayersPanelSide(snapToRight ? 'right' : 'left');
        
        const newX = snapToRight 
          ? windowWidth - sidebarWidth - panelWidth - 10 
          : 10;
        setLayersPanelPos({ x: newX, y: layersPanelPos.y });
      }
      
      setIsLayersPanelDragging(false);
    }
  };
  
  const handleLayersPanelMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLayersPanelDragging(true);
    layersPanelDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panelX: layersPanelPos.x,
      panelY: layersPanelPos.y
    };
  };
  
  const handleLayersPanelMouseMove = (e: React.MouseEvent) => {
    if (isLayersPanelDragging) {
      const dx = e.clientX - layersPanelDragRef.current.x;
      const dy = e.clientY - layersPanelDragRef.current.y;
      
      let newX = layersPanelDragRef.current.panelX + dx;
      let newY = layersPanelDragRef.current.panelY + dy;
      
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const panelWidth = 300;
      const panelHeight = 500;
      const sidebarWidth = 320;
      const edgeSnapThreshold = 150;
      const edgeGap = 10;
      
      if (newX < edgeSnapThreshold) {
        newX = edgeGap;
        setLayersPanelSide('left');
      }
      else if (newX + panelWidth > windowWidth - sidebarWidth - edgeSnapThreshold) {
        newX = windowWidth - sidebarWidth - panelWidth - edgeGap;
        setLayersPanelSide('right');
      }
      
      newX = Math.max(edgeGap, Math.min(newX, windowWidth - sidebarWidth - panelWidth - edgeGap));
      newY = Math.max(edgeGap, Math.min(newY, windowHeight - panelHeight - edgeGap));
      
      setLayersPanelPos({ x: newX, y: newY });
    }
  };
  
  const handleLayerDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    setDraggedLayerIndex(index);
  };
  
  const handleLayerDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverLayerIndex(index);
  };
  
  const handleLayerDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedLayerIndex === null) return;
    
    const newLayers = [...layers];
    const [draggedLayer] = newLayers.splice(draggedLayerIndex, 1);
    newLayers.splice(dropIndex, 0, draggedLayer);
    
    setLayers(newLayers);
    setDraggedLayerIndex(null);
    setDragOverLayerIndex(null);
  };
  
  const handleLayerDragEnd = () => {
    setDraggedLayerIndex(null);
    setDragOverLayerIndex(null);
  };

  const handlePropertyChange = (
    layerId: string,
    property: 'positionX' | 'positionY' | 'width' | 'height',
    value: number,
    unit?: 'px' | '%'
  ) => {
    setLayers(prev => prev.map(l => {
      if (l.id === layerId) {
        return {
          ...l,
          [property]: {
            ...l[property],
            [selectedSize]: {
              value,
              unit: unit || l[property][selectedSize].unit || 'px'
            }
          }
        };
      }
      return l;
    }));
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-white">
      <TopBar mode={mode} onModeChange={setMode} />

      <div className="flex-1 flex overflow-hidden" onMouseMove={handleLayersPanelMouseMove} onMouseUp={handleExtendedMouseUp}>
        <div className="flex-1 bg-[#d4d4d4] overflow-hidden flex flex-col items-center justify-center relative" onClick={() => setSelectedLayerId(null)}>
          {/* Floating Layers Panel */}
          {mode === 'edit' && (
            <LayersPanel
              layers={layers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              panelPos={layersPanelPos}
              panelSide={layersPanelSide}
              isDragging={isLayersPanelDragging}
              draggedLayerIndex={draggedLayerIndex}
              dragOverLayerIndex={dragOverLayerIndex}
              onMouseDown={handleLayersPanelMouseDown}
              onLayerDragStart={handleLayerDragStart}
              onLayerDragOver={handleLayerDragOver}
              onLayerDrop={handleLayerDrop}
              onLayerDragEnd={handleLayerDragEnd}
            />
          )}
          
          <Canvas
            mode={mode}
            layers={layers}
            selectedLayerId={selectedLayerId}
            selectedSize={selectedSize}
            dimensions={dimensions}
            snapLines={snapLines}
            onLayerMouseDown={handleLayerMouseDown}
            onResizeMouseDown={handleResizeMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onCanvasClick={(e) => {
              e.stopPropagation();
              if (e.target === e.currentTarget) {
                setSelectedLayerId(null);
              }
            }}
          />

          <SizeSelector
            allowedSizes={sampleCanvas.allowedSizes}
            selectedSize={selectedSize}
            onSizeChange={setSelectedSize}
          />
        </div>
        
        {mode === 'edit' && (
          <PropertySidebar
            selectedLayerId={selectedLayerId}
            layers={layers}
            selectedSize={selectedSize}
            onPropertyChange={handlePropertyChange}
          />
        )}
      </div>
    </div>
  );
}

export default App;