import { useState, useRef, useEffect } from 'react';
import { sampleCanvas, type LayerContent, type AdSize } from './data';
import { HTML5_AD_SIZES, UI_LAYOUT } from './consts';
import { TopBar } from './components/TopBar';
import { LayersPanel } from './components/LayersPanel';
import { PropertySidebar } from './components/PropertySidebar';
import { Canvas } from './components/Canvas';
import { ExportHTMLModal } from './components/ExportHTMLModal';
import { ZoomControls } from './components/ZoomControls';
import { useCanvasInteractions } from './hooks/useCanvasInteractions';
import { loadGoogleFonts } from './utils/googleFonts';
import { generateResponsiveHTML } from './utils/exportHTML';
import magnetOutlineIcon from './assets/icons/magnet-outline.svg';
import freeMoveIcon from './assets/icons/free-move.svg';

// UI Layout Constant (moved inside component)
const App = () => {
  const LAYERS_PANEL_BOTTOM_GAP = 75;

  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [layers, setLayers] = useState<LayerContent[]>(sampleCanvas.layers);
  const [canvasName, setCanvasName] = useState<string>(sampleCanvas.name);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState<string>(
    sampleCanvas.styles?.backgroundColor || '#ffffff'
  );

  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<AdSize>('336x280');

  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const [isSnappingEnabled, setIsSnappingEnabled] = useState(true);
  const [isClippingEnabled, setIsClippingEnabled] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const [layersPanelSide, setLayersPanelSide] = useState<'left' | 'right'>('right');
  const [isLayersPanelDragging, setIsLayersPanelDragging] = useState(false);
  const [layersPanelPos, setLayersPanelPos] = useState({ x: -1, y: 10 });
  const [isLayersPanelCollapsed, setIsLayersPanelCollapsed] = useState(false);

  const [draggedLayerIndex, setDraggedLayerIndex] = useState<number | null>(null);
  const [dragOverLayerIndex, setDragOverLayerIndex] = useState<number | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportedHTML, setExportedHTML] = useState('');

  const layersPanelDragRef = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });    

  const dimensions = HTML5_AD_SIZES[selectedSize];

  // Reset zoom and pan when ad size changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [selectedSize]);

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
      setSelectedLayerIds([]);
    }
  };

  const handleDeleteSelectedLayers = () => {
    if (selectedLayerIds.length === 0) return;
    const message = selectedLayerIds.length === 1 
      ? `Are you sure you want to delete "${layers.find(l => l.id === selectedLayerIds[0])?.label}"?`
      : `Are you sure you want to delete ${selectedLayerIds.length} layers?`;
    if (window.confirm(message)) {
      setLayers((prev) => prev.filter((l) => !selectedLayerIds.includes(l.id)));
      setSelectedLayerIds([]);
    }
  };

  const handleToggleLock = (layerId: string) => {
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l)));
  };

  const handleSelectLayer = (layerId: string, isShiftPressed: boolean) => {
    if (isShiftPressed) {
      // Toggle selection
      setSelectedLayerIds(prev => 
        prev.includes(layerId) 
          ? prev.filter(id => id !== layerId)
          : [...prev, layerId]
      );
    } else {
      // Single select (replace selection)
      setSelectedLayerIds([layerId]);
    }
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
    selectedLayerIds,
    selectedSize,
    isSnappingEnabled,
    isShiftPressed,
    isAltPressed,
    zoom,
    isSpacePressed,
    setLayers,
    setSelectedLayerIds,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
      if (e.key === 'Alt') {
        setIsAltPressed(true);
      }

      // Check if user is typing in an input/textarea/contentEditable
      const activeElement = document.activeElement;
      const isTyping =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable);

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerIds.length > 0) {
        if (isTyping) {
          return;
        }
        e.preventDefault();
        handleDeleteSelectedLayers();
      }

      // Arrow key navigation for moving layers
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedLayerIds.length > 0) {
        if (isTyping) {
          return;
        }
        e.preventDefault();

        const moveAmount = e.shiftKey ? 10 : 1;

        setLayers((prev) =>
          prev.map((layer) => {
            if (!selectedLayerIds.includes(layer.id)) return layer;

            const config = layer.sizeConfig[selectedSize];
            if (!config) return layer;

            const posX = config.positionX;
            const posY = config.positionY;

            // Convert % to px before applying movement
            let newX = posX.unit === '%' ? (posX.value / 100) * dimensions.width : posX.value;
            let newY = posY.unit === '%' ? (posY.value / 100) * dimensions.height : posY.value;

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
              sizeConfig: {
                ...layer.sizeConfig,
                [selectedSize]: {
                  ...config,
                  positionX: { value: newX, unit: 'px' },
                  positionY: { value: newY, unit: 'px' },
                },
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
      if (e.key === 'Alt') {
        setIsAltPressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedLayerIds, layers, selectedSize]);

  // Zoom and Pan handlers
  const handleZoomChange = (newZoom: number, cursorX?: number, cursorY?: number) => {
    if (cursorX !== undefined && cursorY !== undefined) {
      // Zoom toward cursor position
      const canvasRect = document.querySelector('[data-canvas-container]')?.getBoundingClientRect();
      if (canvasRect) {
        // Calculate cursor position relative to canvas center
        const centerX = canvasRect.left + canvasRect.width / 2;
        const centerY = canvasRect.top + canvasRect.height / 2;
        const offsetX = cursorX - centerX;
        const offsetY = cursorY - centerY;

        // Adjust pan to maintain cursor position
        const zoomDelta = newZoom - zoom;
        setPan((prev) => ({
          x: prev.x - (offsetX * zoomDelta) / zoom,
          y: prev.y - (offsetY * zoomDelta) / zoom,
        }));
      }
    }
    setZoom(newZoom);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) {
        // Check if user is typing
        const activeElement = document.activeElement;
        const isTyping =
          activeElement &&
          (activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            (activeElement as HTMLElement).isContentEditable);
        
        if (!isTyping) {
          e.preventDefault();
          setIsSpacePressed(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Check if we're over the canvas area
      const target = e.target as HTMLElement;
      const canvasContainer = document.querySelector('[data-canvas-container]');
      if (!canvasContainer?.contains(target)) return;

      if (e.shiftKey) {
        // Shift + scroll = zoom
        e.preventDefault();
        const delta = -e.deltaY * 0.01;
        const newZoom = Math.max(0.25, Math.min(3, zoom + delta));
        handleZoomChange(newZoom, e.clientX, e.clientY);
      } else if (e.ctrlKey || e.metaKey) {
        // Trackpad pinch = zoom (browser sends ctrl+wheel)
        e.preventDefault();
        const delta = -e.deltaY * 0.01;
        const newZoom = Math.max(0.25, Math.min(3, zoom + delta));
        handleZoomChange(newZoom, e.clientX, e.clientY);
      } else {
        // Two-finger swipe = pan (regular scroll over canvas)
        e.preventDefault();
        setPan((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isSpacePressed, zoom, pan]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning && isSpacePressed) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  // Handle window resize to reposition layers panel
  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const sidebarWidth = 320;
      const panelWidth = 300;

      // Recalculate position based on current side
      const newX = layersPanelSide === 'right' ? windowWidth - sidebarWidth - panelWidth - 10 : 10;

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
      const sidebarWidth = 320;
      const edgeSnapThreshold = 150;
      const edgeGap = 10;

      // Use current height for drag constraints
      const currentHeight = isLayersPanelCollapsed
        ? UI_LAYOUT.LAYERS_PANEL_COLLAPSED_HEIGHT
        : UI_LAYOUT.LAYERS_PANEL_EXPANDED_HEIGHT;
      // Calculate max Y relative to canvas container (which is below TopBar)
      const containerHeight = windowHeight - UI_LAYOUT.TOP_BAR_HEIGHT;
      const maxY = containerHeight - currentHeight - LAYERS_PANEL_BOTTOM_GAP;

      if (newX < edgeSnapThreshold) {
        newX = edgeGap;
        setLayersPanelSide('left');
      } else if (newX + panelWidth > windowWidth - sidebarWidth - edgeSnapThreshold) {
        newX = windowWidth - sidebarWidth - panelWidth - edgeGap;
        setLayersPanelSide('right');
      }

      newX = Math.max(edgeGap, Math.min(newX, windowWidth - sidebarWidth - panelWidth - edgeGap));
      newY = Math.max(edgeGap, Math.min(newY, maxY));

      setLayersPanelPos({ x: newX, y: newY });
    }
  };

  const handleToggleLayersCollapse = () => {
    const newCollapsedState = !isLayersPanelCollapsed;

    if (!newCollapsedState) {
      const windowHeight = window.innerHeight;
      const containerHeight = windowHeight - UI_LAYOUT.TOP_BAR_HEIGHT;
      const maxY =
        containerHeight - UI_LAYOUT.LAYERS_PANEL_EXPANDED_HEIGHT - LAYERS_PANEL_BOTTOM_GAP;

      if (layersPanelPos.y > maxY) {
        setLayersPanelPos({ x: layersPanelPos.x, y: maxY });
      }
    }

    setIsLayersPanelCollapsed(newCollapsedState);
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
          const config = l.sizeConfig[selectedSize];
          if (!config) return l;

          const updated = {
            ...l,
            sizeConfig: {
              ...l.sizeConfig,
              [selectedSize]: {
                ...config,
                [property]: {
                  value,
                  unit: unit || config[property].unit || 'px',
                },
              },
            },
          };

          // If aspect ratio is locked and we're changing width or height, update the other dimension
          if (l.aspectRatioLocked && (property === 'width' || property === 'height')) {
            const width = config.width;
            const height = config.height;
            if (width && height && width.value > 0 && height.value > 0) {
              const aspectRatio = width.value / height.value;
              
              if (property === 'width') {
                // Width changed, update height
                const newHeight = value / aspectRatio;
                updated.sizeConfig = {
                  ...updated.sizeConfig,
                  [selectedSize]: {
                    ...updated.sizeConfig[selectedSize]!,
                    height: {
                      value: newHeight,
                      unit: height.unit || 'px',
                    },
                  },
                };
              } else if (property === 'height') {
                // Height changed, update width
                const newWidth = value * aspectRatio;
                updated.sizeConfig = {
                  ...updated.sizeConfig,
                  [selectedSize]: {
                    ...updated.sizeConfig[selectedSize]!,
                    width: {
                      value: newWidth,
                      unit: width.unit || 'px',
                    },
                  },
                };
              }
            }
          }

          return updated;
        }
        return l;
      })
    );
  };

  const handleLabelChange = (layerId: string, newLabel: string) => {
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, label: newLabel } : l)));
  };

  const handleHtmlIdChange = (layerId: string, htmlId: string) => {
    // Validate: no spaces allowed
    if (/\s/.test(htmlId)) {
      return;
    }

    // Validate: must be unique across layers (if not empty)
    if (htmlId && layers.some((l) => l.id !== layerId && l.attributes.id === htmlId)) {
      alert('This ID is already in use by another layer. Please choose a unique ID.');
      return;
    }

    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, attributes: { ...l.attributes, id: htmlId } } : l)));
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
          const currentConfig = l.sizeConfig[selectedSize];
          if (!currentConfig) return l;
          
          return {
            ...l,
            sizeConfig: {
              ...l.sizeConfig,
              [selectedSize]: {
                ...currentConfig,
                fontSize: fontSize,
              },
            },
            styles: {
              ...l.styles,
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

  const handleAspectRatioLockToggle = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, aspectRatioLocked: !l.aspectRatioLocked } : l))
    );
  };

  const handleOpacityChange = (layerId: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId) {
          return {
            ...l,
            styles: {
              ...l.styles,
              opacity,
            },
          };
        }
        return l;
      })
    );
  };

  const handleCanvasBackgroundColorChange = (color: string) => {
    setCanvasBackgroundColor(color);
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
    // If multiple layers are selected, align relative to selection bounds
    if (selectedLayerIds.length > 1) {
      handleAlignMultipleLayers(alignment);
      return;
    }

    // Single layer alignment (relative to canvas)
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== layerId) return layer;

        const config = layer.sizeConfig[selectedSize];
        if (!config) return layer;

        const canvasWidth = dimensions.width;
        const canvasHeight = dimensions.height;
        const layerWidth =
          config.width.unit === 'px'
            ? config.width.value
            : (canvasWidth * config.width.value) / 100;
        const layerHeight =
          config.height.unit === 'px'
            ? config.height.value
            : (canvasHeight * config.height.value) / 100;

        let newPosX = config.positionX.value;
        let newPosY = config.positionY.value;

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
          sizeConfig: {
            ...layer.sizeConfig,
            [selectedSize]: {
              ...config,
              positionX: { value: Math.round(newPosX), unit: 'px' },
              positionY: { value: Math.round(newPosY), unit: 'px' },
            },
          },
        };
      })
    );
  };

  const handleAlignMultipleLayers = (
    alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v'
  ) => {
    // Calculate selection bounds
    const selectedLayers = layers.filter(l => selectedLayerIds.includes(l.id));
    if (selectedLayers.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    selectedLayers.forEach(layer => {
      const config = layer.sizeConfig[selectedSize];
      if (!config) return;

      const posX = config.positionX.value;
      const posY = config.positionY.value;
      const width = config.width.value;
      const height = config.height.value;

      minX = Math.min(minX, posX);
      minY = Math.min(minY, posY);
      maxX = Math.max(maxX, posX + width);
      maxY = Math.max(maxY, posY + height);
    });

    const selectionWidth = maxX - minX;
    const selectionHeight = maxY - minY;
    const selectionCenterX = minX + selectionWidth / 2;
    const selectionCenterY = minY + selectionHeight / 2;

    setLayers((prev) =>
      prev.map((layer) => {
        if (!selectedLayerIds.includes(layer.id)) return layer;

        const config = layer.sizeConfig[selectedSize];
        if (!config) return layer;

        const width = config.width.value;
        const height = config.height.value;
        let newPosX = config.positionX.value;
        let newPosY = config.positionY.value;

        switch (alignment) {
          case 'left':
            newPosX = minX;
            break;
          case 'right':
            newPosX = maxX - width;
            break;
          case 'center-h':
            newPosX = selectionCenterX - width / 2;
            break;
          case 'top':
            newPosY = minY;
            break;
          case 'bottom':
            newPosY = maxY - height;
            break;
          case 'center-v':
            newPosY = selectionCenterY - height / 2;
            break;
        }

        return {
          ...layer,
          sizeConfig: {
            ...layer.sizeConfig,
            [selectedSize]: {
              ...config,
              positionX: { value: Math.round(newPosX), unit: 'px' },
              positionY: { value: Math.round(newPosY), unit: 'px' },
            },
          },
        };
      })
    );
  };

  const handleExportHTML = () => {
    setSelectedLayerIds([]);
    const html = generateResponsiveHTML(layers, sampleCanvas.allowedSizes, canvasBackgroundColor);
    setExportedHTML(html);
    setIsExportModalOpen(true);
  };

  const handleAddLayer = (type: 'text' | 'richtext' | 'image' | 'video' | 'button') => {
    const newLayer: LayerContent = {
      id: crypto.randomUUID(),
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      locked: false,
      attributes: { id: '' },
      sizeConfig: {
        '300x250': {
          positionX: { value: 10, unit: 'px' },
          positionY: { value: 10, unit: 'px' },
          width: { value: type === 'image' ? 300 : 200, unit: 'px' },
          height: { value: type === 'image' || type === 'button' ? 50 : 100, unit: 'px' },
          ...(type === 'text' || type === 'richtext' || type === 'button' ? { fontSize: '14px' } : {}),
        },
        '336x280': {
          positionX: { value: 10, unit: 'px' },
          positionY: { value: 10, unit: 'px' },
          width: { value: type === 'image' ? 300 : 200, unit: 'px' },
          height: { value: type === 'image' || type === 'button' ? 50 : 100, unit: 'px' },
          ...(type === 'text' || type === 'richtext' || type === 'button' ? { fontSize: '14px' } : {}),
        },
        '728x90': {
          positionX: { value: 10, unit: 'px' },
          positionY: { value: 10, unit: 'px' },
          width: { value: type === 'image' ? 300 : 200, unit: 'px' },
          height: { value: type === 'image' || type === 'button' ? 50 : 100, unit: 'px' },
          ...(type === 'text' || type === 'richtext' || type === 'button' ? { fontSize: '14px' } : {}),
        },
      },
      ...(type === 'text' || type === 'richtext'
        ? {
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            styles: { color: '#000000', opacity: 1 },
          }
        : {}),
      ...(type === 'image'
        ? { 
            url: 'https://images.pexels.com/photos/35025716/pexels-photo-35025716.jpeg',
            styles: { opacity: 1 },
          }
        : {}),
      ...(type === 'video'
        ? {
            url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
            styles: { opacity: 1 },
          }
        : {}),
      ...(type === 'button'
        ? {
            text: 'Click Here',
            url: '#',
            styles: { backgroundColor: '#333333', color: '#ffffff', opacity: 1 },
          }
        : {}),
    } as LayerContent;

    setLayers((prev) => [newLayer, ...prev]);
    setSelectedLayerIds([newLayer.id]);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-white overflow-hidden">
      <TopBar
        mode={mode}
        selectedSize={selectedSize}
        allowedSizes={sampleCanvas.allowedSizes}
        onModeChange={setMode}
        onSizeChange={setSelectedSize}
        onExportHTML={handleExportHTML}
      />
      <ExportHTMLModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        htmlContent={exportedHTML}
      />

      <div
        className="flex-1 flex overflow-hidden relative"
        onMouseMove={handleLayersPanelMouseMove}
        onMouseUp={handleExtendedMouseUp}
      >
        <div
          className="flex-1 bg-[#d4d4d4] overflow-hidden flex flex-col items-center justify-center relative"
          onClick={() => setSelectedLayerIds([])}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          style={{ cursor: isPanning ? 'grabbing' : isSpacePressed ? 'grab' : 'default' }}
        >
          {/* Floating Layers Panel */}
          {mode === 'edit' ? (
            <LayersPanel
              layers={layers}
              selectedLayerIds={selectedLayerIds}
              onSelectLayer={handleSelectLayer}
              panelPos={layersPanelPos}
              panelSide={layersPanelSide}
              isDragging={isLayersPanelDragging}
              isCollapsed={isLayersPanelCollapsed}
              onToggleCollapse={handleToggleLayersCollapse}
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
            selectedLayerIds={selectedLayerIds}
            selectedSize={selectedSize}
            dimensions={dimensions}
            canvasBackgroundColor={canvasBackgroundColor}
            isClippingEnabled={isClippingEnabled}
            snapLines={snapLines}
            zoom={zoom}
            pan={pan}
            isSpacePressed={isSpacePressed}
            isPanning={isPanning}
            onLayerMouseDown={handleLayerMouseDown}
            onResizeMouseDown={handleResizeMouseDown}
            onMouseMove={(e) => {
              handleCanvasMouseMove(e);
              handleMouseMove(e);
            }}
            onMouseUp={() => {
              handleCanvasMouseUp();
              handleMouseUp();
            }}
            onMouseLeave={handleMouseLeave}
            onCanvasClick={(e) => {
              e.stopPropagation();
              if (e.target === e.currentTarget) {
                setSelectedLayerIds([]);
              }
            }}
            onCanvasSettingsClick={() => setSelectedLayerIds([])}
          />

          {/* Snapping Toggle */}
          <button
            onClick={() => setIsSnappingEnabled(!isSnappingEnabled)}
            className={`absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all border w-24 cursor-pointer ${
              isSnappingEnabled
                ? 'bg-blue-600 border-blue-700 text-white'
                : 'bg-white border-gray-200 text-gray-700'
            }`}
            title={isSnappingEnabled ? 'Snapping enabled' : 'Snapping disabled'}
          >
            <img
              src={isSnappingEnabled ? magnetOutlineIcon : freeMoveIcon}
              alt={isSnappingEnabled ? 'magnet' : 'free move'}
              className={`w-5 h-5 ${isSnappingEnabled ? 'brightness-0 invert' : 'text-gray-700'}`}
            />
            <span className="text-sm font-medium">{isSnappingEnabled ? 'Snap' : 'Free'}</span>
          </button>

          {/* Zoom Controls */}
          {mode === 'edit' ? (
            <ZoomControls 
              zoom={zoom} 
              onZoomChange={handleZoomChange}
              onResetPan={() => {
                setPan({ x: 0, y: 0 });
                setZoom(1);
              }}
            />
          ) : null}
        </div>

        {mode === 'edit' ? (
          <PropertySidebar
            selectedLayerIds={selectedLayerIds}
            layers={layers}
            selectedSize={selectedSize}
            canvasName={canvasName}
            canvasBackgroundColor={canvasBackgroundColor}
            isClippingEnabled={isClippingEnabled}
            onClippingEnabledChange={setIsClippingEnabled}
            onCanvasNameChange={setCanvasName}
            onPropertyChange={handlePropertyChange}
            onDelete={handleDeleteLayer}
            onClearSelection={() => setSelectedLayerIds([])}
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
            onOpacityChange={handleOpacityChange}
            onAspectRatioLockToggle={handleAspectRatioLockToggle}
            onCanvasBackgroundColorChange={handleCanvasBackgroundColorChange}
            onHtmlIdChange={handleHtmlIdChange}
          />
        ) : null}
      </div>
    </div>
  );
};

export default App;
