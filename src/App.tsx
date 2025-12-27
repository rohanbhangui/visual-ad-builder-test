import { useState, useRef, useEffect } from 'react';
import { sampleCanvas, type LayerContent, type AdSize } from './data';
import { HTML5_AD_SIZES } from './consts';
import { TopBar } from './components/TopBar';
import { SizeSelector } from './components/SizeSelector';
import { LayersPanel } from './components/LayersPanel';
import { PropertySidebar } from './components/PropertySidebar';
import { Canvas } from './components/Canvas';
import { useCanvasInteractions } from './hooks/useCanvasInteractions';
import { loadGoogleFonts } from './utils/googleFonts';

const App = () => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [layers, setLayers] = useState<LayerContent[]>(sampleCanvas.layers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<AdSize>('336x280');
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [layersPanelSide, setLayersPanelSide] = useState<'left' | 'right'>('right');
  const [isLayersPanelDragging, setIsLayersPanelDragging] = useState(false);
  const [layersPanelPos, setLayersPanelPos] = useState({ x: -1, y: 10 });
  const [draggedLayerIndex, setDraggedLayerIndex] = useState<number | null>(null);
  const [dragOverLayerIndex, setDragOverLayerIndex] = useState<number | null>(null);
  const layersPanelDragRef = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });

  const dimensions = HTML5_AD_SIZES[selectedSize];

  // Load Google Fonts when layers change
  useEffect(() => {
    const fontsInUse = layers
      .filter(
        (layer) => layer.type === 'text' || layer.type === 'richtext' || layer.type === 'button'
      )
      .map((layer) => layer.styles?.fontFamily)
      .filter((font): font is string => !!font);

    if (fontsInUse.length > 0) {
      loadGoogleFonts(fontsInUse);
    }
  }, [layers]);

  const handleDeleteLayer = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (layer && window.confirm(`Are you sure you want to delete "${layer.label}"?`)) {
      setLayers((prev) => prev.filter((l) => l.id !== layerId));
      setSelectedLayerId(null);
    }
  };

  const handleToggleLock = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l))
    );
  };

  // Use the canvas interactions hook
  const {
    snapLines,
    handleLayerMouseDown,
    handleResizeMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  } = useCanvasInteractions({
    mode,
    layers,
    selectedLayerId,
    selectedSize,
    isShiftPressed,
    setLayers,
    setSelectedLayerId,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
      
      // Check if user is typing in an input/textarea/contentEditable
      const activeElement = document.activeElement;
      const isTyping = activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable);
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId) {
        if (isTyping) {
          return;
        }
        e.preventDefault();
        handleDeleteLayer(selectedLayerId);
      }
      
      // Arrow key navigation for moving layers
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedLayerId) {
        if (isTyping) {
          return;
        }
        e.preventDefault();
        
        const moveAmount = e.shiftKey ? 10 : 1;
        
        setLayers((prev) =>
          prev.map((layer) => {
            if (layer.id !== selectedLayerId) return layer;
            
            const posX = layer.positionX[selectedSize];
            const posY = layer.positionY[selectedSize];
            
            if (!posX || !posY) return layer;
            
            let newX = posX.value;
            let newY = posY.value;
            
            switch (e.key) {
              case 'ArrowLeft':
                newX -= moveAmount;
                break;
              case 'ArrowRight':
                newX += moveAmount;
                break;
              case 'ArrowUp':
                newY -= moveAmount;
                break;
              case 'ArrowDown':
                newY += moveAmount;
                break;
            }
            
            return {
              ...layer,
              positionX: {
                ...layer.positionX,
                [selectedSize]: { value: newX, unit: posX.unit },
              },
              positionY: {
                ...layer.positionY,
                [selectedSize]: { value: newY, unit: posY.unit },
              },
            };
          })
        );
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
  }, [selectedLayerId, layers, selectedSize]);

  // Handle window resize to reposition layers panel
  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const sidebarWidth = 320;
      const panelWidth = 300;
      
      // Recalculate position based on current side
      const newX = layersPanelSide === 'right' 
        ? windowWidth - sidebarWidth - panelWidth - 10 
        : 10;
      
      setLayersPanelPos((prev) => ({ x: newX, y: prev.y }));
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [layersPanelSide]);

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

        const newX = snapToRight ? windowWidth - sidebarWidth - panelWidth - 10 : 10;
        setLayersPanelPos({ x: newX, y: layersPanelPos.y });
      }

      setIsLayersPanelDragging(false);
    }
  };

  const handleLayersPanelMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLayersPanelDragging(true);

    // If panel hasn't been positioned yet (x === -1), calculate its actual position
    let actualX = layersPanelPos.x;
    if (actualX === -1) {
      const windowWidth = window.innerWidth;
      const sidebarWidth = 320;
      const panelWidth = 300;
      actualX = layersPanelSide === 'right' ? windowWidth - sidebarWidth - panelWidth - 10 : 10;
      // Update the position state to reflect the calculated position
      setLayersPanelPos({ x: actualX, y: layersPanelPos.y });
    }

    layersPanelDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panelX: actualX,
      panelY: layersPanelPos.y,
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
      } else if (newX + panelWidth > windowWidth - sidebarWidth - edgeSnapThreshold) {
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
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId) {
          return {
            ...l,
            [property]: {
              ...l[property],
              [selectedSize]: {
                value,
                unit: unit || l[property][selectedSize]!.unit || 'px',
              },
            },
          };
        }
        return l;
      })
    );
  };

  const handleLabelChange = (layerId: string, newLabel: string) => {
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, label: newLabel } : l)));
  };

  const handleContentChange = (layerId: string, content: string) => {
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, content } : l)));
  };

  const handleColorChange = (layerId: string, color: string) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId) {
          return {
            ...l,
            styles: {
              ...l.styles,
              color,
            },
          };
        }
        return l;
      })
    );
  };

  const handleFontSizeChange = (layerId: string, fontSize: string) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId) {
          return {
            ...l,
            styles: {
              ...l.styles,
              fontSize,
            },
          };
        }
        return l;
      })
    );
  };

  const handleFontFamilyChange = (layerId: string, fontFamily: string) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId && (l.type === 'richtext' || l.type === 'button')) {
          return {
            ...l,
            styles: {
              ...l.styles,
              fontFamily,
            },
          };
        }
        return l;
      })
    );
  };
  const handleTextAlignChange = (layerId: string, textAlign: 'left' | 'center' | 'right') => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId && (l.type === 'text' || l.type === 'richtext')) {
          return {
            ...l,
            styles: {
              ...l.styles,
              textAlign,
            },
          };
        }
        return l;
      })
    );
  };
  const handleTextChange = (layerId: string, text: string) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId && l.type === 'button') {
          return { ...l, text };
        }
        return l;
      })
    );
  };

  const handleBackgroundColorChange = (layerId: string, color: string) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId && l.type === 'button') {
          return {
            ...l,
            styles: {
              ...l.styles,
              backgroundColor: color,
            },
          };
        }
        return l;
      })
    );
  };

  const handleImageUrlChange = (layerId: string, url: string) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId && l.type === 'image') {
          return { ...l, url };
        }
        return l;
      })
    );
  };

  const handleObjectFitChange = (layerId: string, objectFit: string) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId && l.type === 'image') {
          return {
            ...l,
            styles: {
              ...l.styles,
              objectFit,
            },
          };
        }
        return l;
      })
    );
  };

  const handleVideoUrlChange = (layerId: string, url: string) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId && l.type === 'video') {
          return { ...l, url };
        }
        return l;
      })
    );
  };

  const handleVideoPropertyChange = (
    layerId: string,
    property: 'autoplay' | 'controls',
    value: boolean
  ) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId && l.type === 'video') {
          return {
            ...l,
            properties: {
              ...l.properties,
              [property]: value,
            },
          };
        }
        return l;
      })
    );
  };

  const handleAlignLayer = (
    layerId: string,
    alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v'
  ) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== layerId) return layer;

        const canvasWidth = dimensions.width;
        const canvasHeight = dimensions.height;
        const layerWidth =
          layer.width[selectedSize]!.unit === 'px'
            ? layer.width[selectedSize]!.value
            : (canvasWidth * layer.width[selectedSize]!.value) / 100;
        const layerHeight =
          layer.height[selectedSize]!.unit === 'px'
            ? layer.height[selectedSize]!.value
            : (canvasHeight * layer.height[selectedSize]!.value) / 100;

        let newPosX = layer.positionX[selectedSize]!.value;
        let newPosY = layer.positionY[selectedSize]!.value;

        switch (alignment) {
          case 'left':
            newPosX = 0;
            break;
          case 'right':
            newPosX = canvasWidth - layerWidth;
            break;
          case 'center-h':
            newPosX = (canvasWidth - layerWidth) / 2;
            break;
          case 'top':
            newPosY = 0;
            break;
          case 'bottom':
            newPosY = canvasHeight - layerHeight;
            break;
          case 'center-v':
            newPosY = (canvasHeight - layerHeight) / 2;
            break;
        }

        return {
          ...layer,
          positionX: {
            ...layer.positionX,
            [selectedSize]: { value: Math.round(newPosX), unit: 'px' },
          },
          positionY: {
            ...layer.positionY,
            [selectedSize]: { value: Math.round(newPosY), unit: 'px' },
          },
        };
      })
    );
  };

  const handleAddLayer = (type: 'text' | 'richtext' | 'image' | 'video' | 'button') => {
    const newLayer: LayerContent = {
      id: crypto.randomUUID(),
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      locked: false,
      positionX: {
        '300x250': { value: 10, unit: 'px' },
        '336x280': { value: 10, unit: 'px' },
        '728x90': { value: 10, unit: 'px' },
      },
      positionY: {
        '300x250': { value: 10, unit: 'px' },
        '336x280': { value: 10, unit: 'px' },
        '728x90': { value: 10, unit: 'px' },
      },
      width: {
        '300x250': { value: type === 'image' ? 300 : 200, unit: 'px' },
        '336x280': { value: type === 'image' ? 300 : 200, unit: 'px' },
        '728x90': { value: type === 'image' ? 300 : 200, unit: 'px' },
      },
      height: {
        '300x250': { value: type === 'image' || type === 'button' ? 50 : 100, unit: 'px' },
        '336x280': { value: type === 'image' || type === 'button' ? 50 : 100, unit: 'px' },
        '728x90': { value: type === 'image' || type === 'button' ? 50 : 100, unit: 'px' },
      },
      ...(type === 'text' || type === 'richtext'
        ? {
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            styles: { color: '#000000', fontSize: '14px' },
          }
        : {}),
      ...(type === 'image'
        ? { url: 'https://images.pexels.com/photos/35025716/pexels-photo-35025716.jpeg' }
        : {}),
      ...(type === 'video'
        ? {
            url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
          }
        : {}),
      ...(type === 'button'
        ? {
            text: 'Click Here',
            url: '#',
            styles: { backgroundColor: '#333333', color: '#ffffff', fontSize: '14px' },
          }
        : {}),
    } as LayerContent;

    setLayers((prev) => [newLayer, ...prev]);
    setSelectedLayerId(newLayer.id);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-white">
      <TopBar mode={mode} onModeChange={setMode} />

      <div
        className="flex-1 flex overflow-hidden"
        onMouseMove={handleLayersPanelMouseMove}
        onMouseUp={handleExtendedMouseUp}
      >
        <div
          className="flex-1 bg-[#d4d4d4] overflow-hidden flex flex-col items-center justify-center relative"
          onClick={() => setSelectedLayerId(null)}
        >
          {/* Floating Layers Panel */}
          {mode === 'edit' ? (
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
              onAddLayer={handleAddLayer}
              onToggleLock={handleToggleLock}
            />
          ) : null}

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

        {mode === 'edit' ? (
          <PropertySidebar
            selectedLayerId={selectedLayerId}
            layers={layers}
            selectedSize={selectedSize}
            onPropertyChange={handlePropertyChange}
            onDelete={handleDeleteLayer}
            onLabelChange={handleLabelChange}
            onContentChange={handleContentChange}
            onColorChange={handleColorChange}
            onFontSizeChange={handleFontSizeChange}
            onFontFamilyChange={handleFontFamilyChange}
            onTextAlignChange={handleTextAlignChange}
            onTextChange={handleTextChange}
            onBackgroundColorChange={handleBackgroundColorChange}
            onImageUrlChange={handleImageUrlChange}
            onObjectFitChange={handleObjectFitChange}
            onVideoUrlChange={handleVideoUrlChange}
            onVideoPropertyChange={handleVideoPropertyChange}
            onAlignLayer={handleAlignLayer}
          />
        ) : null}
      </div>
    </div>
  );
};

export default App;
