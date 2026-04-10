import { useState, useRef, useEffect, useCallback } from 'react';
import { type LayerContent, type GroupLayer, type AdSize, type SizeConfig } from './data';
import { HTML5_AD_SIZES, UI_LAYOUT } from './consts';
import { TopBar } from './components/TopBar';
import { LayersPanel } from './components/LayersPanel';
import { PropertySidebar } from './components/PropertySidebar';
import Canvas from './components/Canvas';
import { ExportHTMLModal } from './components/ExportHTMLModal';
import { SettingsModal } from './components/SettingsModal';
import { ManageSizesModal } from './components/ManageSizesModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ZoomControls } from './components/ZoomControls';
import { TimelinePanel } from './components/TimelinePanel';
import { useCanvasInteractions } from './hooks/useCanvasInteractions';
import { loadGoogleFonts } from './utils/googleFonts';
import { generateResponsiveHTML } from './utils/exportHTML';
import { useStore, useCanUndo, useCanRedo, getHistory, clearInitialHistory, pauseHistory, resumeHistory, pushViewSnapshot } from './store/useStore';
import { AD_SIZE_NAMES, getAvailableAdSizes } from './utils/adSizes';
import magnetOutlineIcon from './assets/icons/magnet-outline.svg';
import freeMoveIcon from './assets/icons/free-move.svg';
import ReplayIcon from './assets/icons/reset-view-ccw.svg?react';
import TimelineIcon from './assets/icons/timeline.svg?react';
import PlusIcon from './assets/icons/plus.svg?react';
import XIcon from './assets/icons/x.svg?react';

// UI Layout Constant (moved inside component)
const App = () => {
  const LAYERS_PANEL_BOTTOM_GAP = 75;

  // Zustand store - tracked state (undo/redo)
  const layers = useStore((state) => state.layers);
  const allowedSizes = useStore((state) => state.allowedSizes);
  const canvasName = useStore((state) => state.canvasName);
  const canvasBackgroundColor = useStore((state) => state.canvasBackgroundColor);
  const animationLoop = useStore((state) => state.animationLoop);
  const selectedLayerIds = useStore((state) => state.selectedLayerIds);
  const selectedSize = useStore((state) => state.selectedSize);
  const activePropertyTab = useStore((state) => state.activePropertyTab);
  const animationMode = useStore((state) => state.animationMode);
  const isTimelinePanelOpen = useStore((state) => state.isTimelinePanelOpen);
  const layersPanelSide = useStore((state) => state.layersPanelSide);
  const layersPanelPos = useStore((state) => state.layersPanelPos);
  const isLayersPanelCollapsed = useStore((state) => state.isLayersPanelCollapsed);
  
  // Zustand store - ephemeral state (not tracked)
  const mode = useStore((state) => state.mode);
  const zoom = useStore((state) => state.zoom);
  const pan = useStore((state) => state.pan);
  const isPanning = useStore((state) => state.isPanning);
  const isSnappingEnabled = useStore((state) => state.isSnappingEnabled);
  const isClippingEnabled = useStore((state) => state.isClippingEnabled);
  const isExportModalOpen = useStore((state) => state.isExportModalOpen);
  const isSettingsModalOpen = useStore((state) => state.isSettingsModalOpen);
  const adSelectorPosition = useStore((state) => state.adSelectorPosition);
  const exportedHTML = useStore((state) => state.exportedHTML);
  const animationKey = useStore((state) => state.animationKey);
  const draggedLayerIndex = useStore((state) => state.draggedLayerIndex);
  const dragOverLayerIndex = useStore((state) => state.dragOverLayerIndex);
  const draggedLayerParentGroupId = useStore((state) => state.draggedLayerParentGroupId);
  const isLayersPanelDragging = useStore((state) => state.isLayersPanelDragging);
  
  // Zustand actions - only ones actually used in App.tsx
  const setLayers = useStore((state) => state.setLayers);
  const addAllowedSize = useStore((state) => state.addAllowedSize);
  const removeAllowedSize = useStore((state) => state.removeAllowedSize);
  const deleteLayer = useStore((state) => state.deleteLayer);
  const deleteLayers = useStore((state) => state.deleteLayers);
  const setCanvasName = useStore((state) => state.setCanvasName);
  const setCanvasBackgroundColor = useStore((state) => state.setCanvasBackgroundColor);
  const setAnimationLoop = useStore((state) => state.setAnimationLoop);
  const setSelectedLayerIds = useStore((state) => state.setSelectedLayerIds);
  const setSelectedSize = useStore((state) => state.setSelectedSize);
  const setActivePropertyTab = useStore((state) => state.setActivePropertyTab);
  const setAnimationMode = useStore((state) => state.setAnimationMode);
  const setIsTimelinePanelOpen = useStore((state) => state.setIsTimelinePanelOpen);
  const setMode = useStore((state) => state.setMode);
  const setZoom = useStore((state) => state.setZoom);
  const setPan = useStore((state) => state.setPan);
  const setIsPanning = useStore((state) => state.setIsPanning);
  const setIsSnappingEnabled = useStore((state) => state.setIsSnappingEnabled);
  const setIsClippingEnabled = useStore((state) => state.setIsClippingEnabled);
  const setLayersPanelSide = useStore((state) => state.setLayersPanelSide);
  const setLayersPanelPos = useStore((state) => state.setLayersPanelPos);
  const setIsLayersPanelCollapsed = useStore((state) => state.setIsLayersPanelCollapsed);
  const setIsLayersPanelDragging = useStore((state) => state.setIsLayersPanelDragging);
  const setDraggedLayerIndex = useStore((state) => state.setDraggedLayerIndex);
  const setDragOverLayerIndex = useStore((state) => state.setDragOverLayerIndex);
  const setDraggedLayerParentGroupId = useStore((state) => state.setDraggedLayerParentGroupId);
  const setAnimationKey = useStore((state) => state.setAnimationKey);
  const setExportedHTML = useStore((state) => state.setExportedHTML);
  const setIsExportModalOpen = useStore((state) => state.setIsExportModalOpen);
  const setIsSettingsModalOpen = useStore((state) => state.setIsSettingsModalOpen);
  const setAdSelectorPosition = useStore((state) => state.setAdSelectorPosition);
  const commitZoom = useStore((state) => state.commitZoom);
  const commitPan = useStore((state) => state.commitPan);
  const groupLayers = useStore((state) => state.groupLayers);
  const ungroupLayers = useStore((state) => state.ungroupLayers);
  
  // Undo/redo
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const handleUndo = () => {
    if (canUndo) {
      (useStore as any).temporal.getState().undo();
    }
  };
  const handleRedo = () => {
    if (canRedo) {
      (useStore as any).temporal.getState().redo();
    }
  };

  // Local UI state (keyboard, mouse)
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isManageSizesModalOpen, setIsManageSizesModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    confirmTone: 'danger' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  const layersPanelDragRef = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });
  // preZoom tracks zoom at the moment the space-pan started (so undo restores correctly)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0, preZoom: 1 });
  // true while a space-bar pan is in progress (used to commit on Space keyup)
  const spacePanActiveRef = useRef(false);
  const copiedLayersRef = useRef<LayerContent[]>([]);

  // Refs that mirror store values so wheel/pan handlers always see latest values
  // without being recreated on every zoom/pan change (which would break debounce)
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  const dimensions = HTML5_AD_SIZES[selectedSize] || HTML5_AD_SIZES['336x280'];
  const availableSizes = getAvailableAdSizes(allowedSizes);

  // Clear initial history and expose debug API to window
  useEffect(() => {
    // Clear history after a short delay to ensure all initialization is complete
    const timer = setTimeout(() => {
      clearInitialHistory();
    }, 100);
    
    (window as any).vb = {
      history: getHistory,
      store: useStore.getState,
      clearHistory: clearInitialHistory,
      exportCanvas: () => {
        const state = useStore.getState();
        const canvas = {
          id: `canvas-${crypto.randomUUID()}`,
          name: state.canvasName,
          allowedSizes: state.allowedSizes,
          styles: {
            backgroundColor: state.canvasBackgroundColor,
          },
          layers: state.layers,
          animationLoop: state.animationLoop,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        console.log('Canvas Structure:');
        console.log(JSON.stringify(canvas, null, 2));
        return canvas;
      },
    };
    
    return () => clearTimeout(timer);
  }, []);

  // Reset zoom and pan when ad size changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [selectedSize, setZoom, setPan]);

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

  const closeConfirmModal = useCallback(() => setConfirmState(null), []);

  const openConfirmModal = useCallback(({
    title,
    message,
    confirmLabel,
    confirmTone = 'primary',
    onConfirm,
  }: {
    title: string;
    message: string;
    confirmLabel: string;
    confirmTone?: 'danger' | 'primary';
    onConfirm: () => void;
  }) => {
    setConfirmState({
      title,
      message,
      confirmLabel,
      confirmTone,
      onConfirm,
    });
  }, []);

  const handleDeleteLayer = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    openConfirmModal({
      title: 'Delete Layer',
      message: `Delete "${layer.label}"? This cannot be undone except through undo history.`,
      confirmLabel: 'Delete Layer',
      confirmTone: 'danger',
      onConfirm: () => {
        deleteLayer(layerId);
      },
    });
  };

  const handleDeleteSize = (size: AdSize) => {
    if (allowedSizes.length <= 1) return;

    openConfirmModal({
      title: 'Delete Size',
      message: `Delete ${size} (${AD_SIZE_NAMES[size]})? This removes the size and its size-specific layer layout data.`,
      confirmLabel: 'Delete Size',
      confirmTone: 'danger',
      onConfirm: () => removeAllowedSize(size),
    });
  };

  const handleToggleLock = (layerId: string) => {
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l)));
  };

  const handleSelectLayer = (layerId: string, isShiftPressed: boolean) => {
    if (isShiftPressed) {
      // Toggle selection
      setSelectedLayerIds((prev) =>
        prev.includes(layerId) ? prev.filter((id) => id !== layerId) : [...prev, layerId]
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
    tempLayerUpdates,
    isDragging,
    isResizing,
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

  // Use tempLayerUpdates when dragging/resizing, otherwise use the actual layers from store
  const displayLayers = isDragging || isResizing ? tempLayerUpdates : layers;

  useEffect(() => {
    const handleDeleteSelectedLayers = () => {
      if (selectedLayerIds.length === 0) return;
      const selectedLabel = layers.find((layer) => layer.id === selectedLayerIds[0])?.label;
      const message =
        selectedLayerIds.length === 1 && selectedLabel
          ? `Delete "${selectedLabel}"? This cannot be undone except through undo history.`
          : `Delete ${selectedLayerIds.length} selected layers? This cannot be undone except through undo history.`;

      openConfirmModal({
        title: selectedLayerIds.length === 1 ? 'Delete Layer' : 'Delete Layers',
        message,
        confirmLabel: selectedLayerIds.length === 1 ? 'Delete Layer' : 'Delete Layers',
        confirmTone: 'danger',
        onConfirm: () => {
          deleteLayers(selectedLayerIds);
        },
      });
    };

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

      // Group / Ungroup shortcuts (Cmd+G / Ctrl+G and Cmd+Shift+G / Ctrl+Shift+G)
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyG' && !e.shiftKey && !isTyping) {
        e.preventDefault();
        // Determine eligible layers for grouping (non-group layers)
        const nonGroupSelected = selectedLayerIds.filter(
          (id) => !layers.find((l) => l.id === id && l.type === 'group')
        );
        if (nonGroupSelected.length >= 2) {
          groupLayers(nonGroupSelected);
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyG' && e.shiftKey && !isTyping) {
        e.preventDefault();
        const selectedGroup = selectedLayerIds.find((id) =>
          layers.find((l) => l.id === id && l.type === 'group')
        );
        if (selectedGroup) {
          ungroupLayers(selectedGroup);
        }
        return;
      }

      // Undo/Redo shortcuts (Cmd+Z / Cmd+Shift+Z on macOS, Ctrl+Z / Ctrl+Shift+Z on Windows)
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ' && !e.shiftKey && !isTyping) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ' && e.shiftKey && !isTyping) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Copy shortcut (Cmd+C / Ctrl+C)
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyC' && !isTyping && selectedLayerIds.length > 0) {
        e.preventDefault();
        const orderedCopied = layers.filter((l) => selectedLayerIds.includes(l.id));
        copiedLayersRef.current = orderedCopied;
        return;
      }

      // Paste shortcut (Cmd+V / Ctrl+V)
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyV' && !isTyping && copiedLayersRef.current.length > 0) {
        e.preventDefault();
        const copiedLayers = copiedLayersRef.current;
        const copiedIds = copiedLayers.map((l) => l.id);

        // New copies with fresh IDs
        const newLayers: LayerContent[] = copiedLayers.map((l) => ({
          ...l,
          id: `sa-${crypto.randomUUID()}`,
          label: `${l.label} (Copy)`,
          attributes: { ...l.attributes, id: '' },
        }));

        setLayers((prev) => {
          // Find the highest index among the original copied layers still present
          let insertAfterIndex = -1;
          prev.forEach((l, idx) => {
            if (copiedIds.includes(l.id)) {
              insertAfterIndex = Math.max(insertAfterIndex, idx);
            }
          });
          // If originals are gone, append at end; otherwise insert right after last original
          const insertAt = insertAfterIndex === -1 ? prev.length : insertAfterIndex + 1;
          const next = [...prev];
          next.splice(insertAt, 0, ...newLayers);
          return next;
        });

        setSelectedLayerIds(newLayers.map((l) => l.id));
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerIds.length > 0) {
        if (isTyping) {
          return;
        }
        e.preventDefault();
        handleDeleteSelectedLayers();
      }

      // Arrow key navigation for moving layers
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) &&
        selectedLayerIds.length > 0
      ) {
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
  }, [
    selectedLayerIds,
    layers,
    selectedSize,
    dimensions.width,
    dimensions.height,
    deleteLayers,
    openConfirmModal,
  ]);

  // Zoom and Pan handlers
  const handleZoomChange = useCallback((newZoom: number, cursorX?: number, cursorY?: number) => {
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
  }, [zoom, setPan, setZoom]);

  // Commit zoom to history (called after interaction completes)
  const handleZoomCommit = useCallback((finalZoom: number) => {
    commitZoom(finalZoom);
    commitPan(pan); // Also commit pan since it may have changed during zoom
  }, [commitZoom, commitPan, pan]);

  useEffect(() => {
    let wheelTimeout: ReturnType<typeof setTimeout> | null = null;
    // preGestureZoom/Pan capture the state at the START of each wheel gesture so
    // that pushViewSnapshot writes the correct before-state to history.
    let preGestureZoom = zoomRef.current;
    let preGesturePan = panRef.current;
    let isWheeling = false;

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
        // If a space-pan was active, commit the pre-gesture snapshot to history.
        // spacePanActiveRef is a component ref so it's always current here.
        if (spacePanActiveRef.current) {
          resumeHistory();
          pushViewSnapshot(
            panStartRef.current.preZoom,
            { x: panStartRef.current.panX, y: panStartRef.current.panY },
          );
          spacePanActiveRef.current = false;
        }
      }
    };

    // Zoom toward cursor, updating refs immediately so subsequent events in the
    // same gesture accumulate correctly (React state updates are async).
    const applyZoom = (newZoom: number, cursorX: number, cursorY: number) => {
      const canvasRect = document.querySelector('[data-canvas-container]')?.getBoundingClientRect();
      if (canvasRect) {
        const centerX = canvasRect.left + canvasRect.width / 2;
        const centerY = canvasRect.top + canvasRect.height / 2;
        const offsetX = cursorX - centerX;
        const offsetY = cursorY - centerY;
        const zoomDelta = newZoom - zoomRef.current;
        const newPan = {
          x: panRef.current.x - (offsetX * zoomDelta) / zoomRef.current,
          y: panRef.current.y - (offsetY * zoomDelta) / zoomRef.current,
        };
        setPan(newPan);
        panRef.current = newPan;
      }
      setZoom(newZoom);
      zoomRef.current = newZoom;
    };

    const handleWheel = (e: WheelEvent) => {
      // Disable zoom/pan in preview mode
      if (mode === 'preview') return;

      // Check if we're over the canvas area
      const target = e.target as HTMLElement;
      const canvasContainer = document.querySelector('[data-canvas-container]');
      if (!canvasContainer?.contains(target)) return;

      // Pause history on the first event of a new gesture; snapshot pre-gesture
      // view so that pushViewSnapshot writes the correct before-state to history.
      if (!isWheeling) {
        pauseHistory();
        preGestureZoom = zoomRef.current;
        preGesturePan = panRef.current;
        isWheeling = true;
      }

      if (e.shiftKey) {
        // Shift + scroll = zoom
        e.preventDefault();
        const delta = -e.deltaY * 0.005;
        const newZoom = Math.max(0.25, Math.min(3, zoomRef.current + delta));
        applyZoom(newZoom, e.clientX, e.clientY);

        // Debounce: push pre-gesture snapshot 150ms after the last event (1 history item)
        if (wheelTimeout) clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          resumeHistory();
          isWheeling = false;
          pushViewSnapshot(preGestureZoom, preGesturePan);
        }, 150);

      } else if (e.ctrlKey || e.metaKey) {
        // Trackpad pinch-to-zoom (browser sends ctrl+wheel)
        e.preventDefault();

        let delta = -e.deltaY;
        if (e.deltaMode === 1) {
          // DOM_DELTA_LINE
          delta *= 0.05;
        } else if (e.deltaMode === 2) {
          // DOM_DELTA_PAGE
          delta *= 0.5;
        } else {
          // DOM_DELTA_PIXEL (most common for trackpad)
          delta *= 0.006;
        }

        const newZoom = Math.max(0.25, Math.min(3, zoomRef.current + delta));
        applyZoom(newZoom, e.clientX, e.clientY);

        // Debounce: push pre-gesture snapshot 150ms after the last event (1 history item)
        if (wheelTimeout) clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          resumeHistory();
          isWheeling = false;
          pushViewSnapshot(preGestureZoom, preGesturePan);
        }, 150);

      } else {
        // Two-finger swipe = pan
        e.preventDefault();

        let deltaX = e.deltaX;
        let deltaY = e.deltaY;
        if (e.deltaMode === 1) {
          // DOM_DELTA_LINE
          deltaX *= 16;
          deltaY *= 16;
        } else if (e.deltaMode === 2) {
          // DOM_DELTA_PAGE
          deltaX *= 100;
          deltaY *= 100;
        }
        // DOM_DELTA_PIXEL (default) — use as-is for 1:1 panning

        const newPan = {
          x: panRef.current.x - deltaX,
          y: panRef.current.y - deltaY,
        };
        setPan(newPan);
        panRef.current = newPan;

        // Debounce: push pre-gesture snapshot 150ms after the last event (1 history item)
        if (wheelTimeout) clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          resumeHistory();
          isWheeling = false;
          pushViewSnapshot(preGestureZoom, preGesturePan);
        }, 150);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      // If the effect re-runs (e.g. mode changes) or the component unmounts
      // while a gesture is in flight, push the pre-gesture snapshot so history
      // reflects what the user had before the gesture started.
      if (wheelTimeout) clearTimeout(wheelTimeout);
      if (isWheeling) {
        resumeHistory();
        pushViewSnapshot(preGestureZoom, preGesturePan);
        isWheeling = false;
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
    };
    // zoom and pan are intentionally excluded — we read them via zoomRef/panRef
    // so the effect (and its debounce timeout) are never torn down mid-gesture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpacePressed, mode, setIsPanning, setPan, setZoom]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Disable panning in preview mode
    if (mode === 'preview') return;

    if (isSpacePressed) {
      e.preventDefault();
      setIsPanning(true);
      // Pause history during panning; record pre-gesture view so we can push
      // the correct snapshot on mouseup/keyup
      pauseHistory();
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
        preZoom: zoomRef.current,
      };
      spacePanActiveRef.current = true;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    // Disable pan movement in preview mode
    if (mode === 'preview') return;

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
    // Disable pan end in preview mode
    if (mode === 'preview') return;

    if (isPanning) {
      setIsPanning(false);
      resumeHistory();
      // Push the pre-gesture snapshot so undo restores to before the pan started
      pushViewSnapshot(
        panStartRef.current.preZoom,
        { x: panStartRef.current.panX, y: panStartRef.current.panY },
      );
      spacePanActiveRef.current = false;
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
  }, [layersPanelSide, setLayersPanelPos]);

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
      // Account for timeline panel if it's open in advanced or both mode
      const timelineOffset = (animationMode === 'advanced' || animationMode === 'both') && isTimelinePanelOpen ? UI_LAYOUT.TIMELINE_PANEL_HEIGHT : 0;
      const maxY = containerHeight - currentHeight - LAYERS_PANEL_BOTTOM_GAP - timelineOffset;

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
      // Account for timeline panel if it's open in advanced or both mode
      const timelineOffset = (animationMode === 'advanced' || animationMode === 'both') && isTimelinePanelOpen ? UI_LAYOUT.TIMELINE_PANEL_HEIGHT : 0;
      const maxY =
        containerHeight - UI_LAYOUT.LAYERS_PANEL_EXPANDED_HEIGHT - LAYERS_PANEL_BOTTOM_GAP - timelineOffset;

      if (layersPanelPos.y > maxY) {
        setLayersPanelPos({ x: layersPanelPos.x, y: maxY });
      }
    }

    setIsLayersPanelCollapsed(newCollapsedState);
  };

  const handleGroupLayers = () => {
    const nonGroupSelected = selectedLayerIds.filter(
      (id) => !layers.find((l) => l.id === id && l.type === 'group')
    );
    if (nonGroupSelected.length >= 2) {
      groupLayers(nonGroupSelected);
    }
  };

  const handleUngroupLayers = () => {
    const selectedGroup = selectedLayerIds.find((id) =>
      layers.find((l) => l.id === id && l.type === 'group')
    );
    if (selectedGroup) {
      ungroupLayers(selectedGroup);
    }
  };

  const handleLayerDoubleClick = (_e: React.MouseEvent, layerId: string) => {
    setSelectedLayerIds([layerId]);
  };

  const handleLayerDragStart = (e: React.DragEvent, index: number, parentGroupId?: string) => {
    e.stopPropagation();
    setDraggedLayerIndex(index);
    setDraggedLayerParentGroupId(parentGroupId ?? null);
  };

  const handleLayerDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverLayerIndex(index);
  };

  const handleLayerDrop = (e: React.DragEvent, dropFlatIndex: number, dropParentGroupId?: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedLayerIndex === null) return;
    const draggedLayer = layers[draggedLayerIndex];
    if (!draggedLayer) return;

    // Groups cannot be nested inside other groups
    if (draggedLayer.type === 'group' && dropParentGroupId) {
      setDraggedLayerIndex(null);
      setDragOverLayerIndex(null);
      setDraggedLayerParentGroupId(null);
      return;
    }

    const sourceParentGroupId = draggedLayerParentGroupId ?? undefined;

    const allSizes = Object.keys(HTML5_AD_SIZES) as AdSize[];

    // Convert child-relative positions → absolute canvas positions
    const toAbsolute = (layer: LayerContent, group: GroupLayer): LayerContent => {
      const sc = { ...layer.sizeConfig };
      allSizes.forEach((size) => {
        const lc = layer.sizeConfig[size];
        const gc = group.sizeConfig[size];
        if (!lc || !gc) return;
        const dims = HTML5_AD_SIZES[size];
        const gx = gc.positionX.unit === '%' ? (gc.positionX.value / 100) * dims.width : gc.positionX.value;
        const gy = gc.positionY.unit === '%' ? (gc.positionY.value / 100) * dims.height : gc.positionY.value;
        const cx = lc.positionX.unit === '%' ? (lc.positionX.value / 100) * dims.width : lc.positionX.value;
        const cy = lc.positionY.unit === '%' ? (lc.positionY.value / 100) * dims.height : lc.positionY.value;
        sc[size] = { ...lc, positionX: { value: gx + cx, unit: 'px' }, positionY: { value: gy + cy, unit: 'px' } };
      });
      return { ...layer, sizeConfig: sc };
    };

    // Convert absolute canvas positions → relative to group origin
    const toRelative = (layer: LayerContent, group: GroupLayer): LayerContent => {
      const sc = { ...layer.sizeConfig };
      allSizes.forEach((size) => {
        const lc = layer.sizeConfig[size];
        const gc = group.sizeConfig[size];
        if (!lc || !gc) return;
        const dims = HTML5_AD_SIZES[size];
        const gx = gc.positionX.unit === '%' ? (gc.positionX.value / 100) * dims.width : gc.positionX.value;
        const gy = gc.positionY.unit === '%' ? (gc.positionY.value / 100) * dims.height : gc.positionY.value;
        const cx = lc.positionX.unit === '%' ? (lc.positionX.value / 100) * dims.width : lc.positionX.value;
        const cy = lc.positionY.unit === '%' ? (lc.positionY.value / 100) * dims.height : lc.positionY.value;
        sc[size] = { ...lc, positionX: { value: cx - gx, unit: 'px' }, positionY: { value: cy - gy, unit: 'px' } };
      });
      return { ...layer, sizeConfig: sc };
    };

    setLayers((prev) => {
      const dragged = prev.find((l) => l.id === draggedLayer.id);
      if (!dragged) return prev;

      const sourceGroup = sourceParentGroupId
        ? (prev.find((l) => l.id === sourceParentGroupId) as GroupLayer | undefined)
        : undefined;
      const targetGroup = dropParentGroupId
        ? (prev.find((l) => l.id === dropParentGroupId) as GroupLayer | undefined)
        : undefined;

      // CASE D – reorder within the same group: only update children order, no position conversion
      if (sourceParentGroupId && sourceParentGroupId === dropParentGroupId && sourceGroup) {
        const dropTargetId = prev[dropFlatIndex]?.id;
        const newChildren = sourceGroup.children.filter((id) => id !== dragged.id);
        const insertAt = dropTargetId ? newChildren.indexOf(dropTargetId) : -1;
        newChildren.splice(insertAt >= 0 ? insertAt : newChildren.length, 0, dragged.id);
        return prev.map((l) =>
          l.id === sourceParentGroupId ? ({ ...l, children: newChildren } as LayerContent) : l
        );
      }

      // Convert dragged layer positions as needed
      let updatedDragged: LayerContent = dragged;
      if (sourceGroup) updatedDragged = toAbsolute(updatedDragged, sourceGroup);
      if (targetGroup) updatedDragged = toRelative(updatedDragged, targetGroup);

      // Remove layer from source group's children
      const updatedSourceGroup: GroupLayer | null = sourceGroup
        ? { ...sourceGroup, children: sourceGroup.children.filter((id) => id !== dragged.id) }
        : null;

      // Insert layer into target group's children at the correct position
      let updatedTargetGroup: GroupLayer | null = null;
      if (targetGroup) {
        const dropTargetId = prev[dropFlatIndex]?.id;
        const baseChildren =
          updatedSourceGroup && updatedSourceGroup.id === targetGroup.id
            ? [...updatedSourceGroup.children]
            : [...targetGroup.children];
        if (!baseChildren.includes(dragged.id)) {
          const insertAt = dropTargetId ? baseChildren.indexOf(dropTargetId) : -1;
          baseChildren.splice(insertAt >= 0 ? insertAt : baseChildren.length, 0, dragged.id);
        }
        updatedTargetGroup = { ...targetGroup, children: baseChildren };
      }

      // Recalculate a group's bounding box from its current children (relative coords).
      // Returns updated newLayers with the group sizeConfig and all child relative
      // positions renormalized so the bounding box origin is at (0,0) relative.
      const recalcGroupBounds = (layers: LayerContent[], groupId: string): LayerContent[] => {
        const group = layers.find((l) => l.id === groupId) as GroupLayer | undefined;
        if (!group || group.children.length === 0) return layers;

        const newGroupSizeConfig = { ...group.sizeConfig };
        // Per-child offset corrections (only non-zero when minRX/minRY != 0)
        const childOffsets: Record<AdSize, { dx: number; dy: number }> = {} as Record<AdSize, { dx: number; dy: number }>;

        allSizes.forEach((size) => {
          const gc = group.sizeConfig[size];
          if (!gc) return;

          const childConfigs = group.children
            .map((cid) => layers.find((l) => l.id === cid)?.sizeConfig[size])
            .filter(Boolean) as SizeConfig[];
          if (childConfigs.length === 0) return;

          const dims = HTML5_AD_SIZES[size];
          const gx = gc.positionX.unit === '%' ? (gc.positionX.value / 100) * dims.width : gc.positionX.value;
          const gy = gc.positionY.unit === '%' ? (gc.positionY.value / 100) * dims.height : gc.positionY.value;

          let minRX = Infinity, minRY = Infinity, maxRX = -Infinity, maxRY = -Infinity;
          childConfigs.forEach((cc) => {
            const rx = cc.positionX.unit === '%' ? (cc.positionX.value / 100) * dims.width : cc.positionX.value;
            const ry = cc.positionY.unit === '%' ? (cc.positionY.value / 100) * dims.height : cc.positionY.value;
            const w = cc.width.unit === '%' ? (cc.width.value / 100) * dims.width : cc.width.value;
            const h = cc.height.unit === '%' ? (cc.height.value / 100) * dims.height : cc.height.value;
            minRX = Math.min(minRX, rx);
            minRY = Math.min(minRY, ry);
            maxRX = Math.max(maxRX, rx + w);
            maxRY = Math.max(maxRY, ry + h);
          });

          newGroupSizeConfig[size] = {
            ...gc,
            positionX: { value: gx + minRX, unit: 'px' },
            positionY: { value: gy + minRY, unit: 'px' },
            width:     { value: maxRX - minRX, unit: 'px' },
            height:    { value: maxRY - minRY, unit: 'px' },
          };
          childOffsets[size] = { dx: -minRX, dy: -minRY };
        });

        return layers.map((l) => {
          if (l.id === groupId) return { ...l, sizeConfig: newGroupSizeConfig } as LayerContent;
          if (group.children.includes(l.id)) {
            const newSc = { ...l.sizeConfig };
            allSizes.forEach((size) => {
              const cc = l.sizeConfig[size];
              const off = childOffsets[size];
              if (!cc || !off || (off.dx === 0 && off.dy === 0)) return;
              const dims = HTML5_AD_SIZES[size];
              const rx = cc.positionX.unit === '%' ? (cc.positionX.value / 100) * dims.width : cc.positionX.value;
              const ry = cc.positionY.unit === '%' ? (cc.positionY.value / 100) * dims.height : cc.positionY.value;
              newSc[size] = { ...cc, positionX: { value: rx + off.dx, unit: 'px' }, positionY: { value: ry + off.dy, unit: 'px' } };
            });
            return { ...l, sizeConfig: newSc } as LayerContent;
          }
          return l;
        });
      };

      // Apply all layer-level updates
      let newLayers = prev.map((l) => {
        if (l.id === dragged.id) return updatedDragged;
        if (updatedSourceGroup && l.id === updatedSourceGroup.id) return updatedSourceGroup as LayerContent;
        if (updatedTargetGroup && l.id === updatedTargetGroup.id && l.id !== (updatedSourceGroup?.id ?? '')) return updatedTargetGroup as LayerContent;
        return l;
      });

      // Recalculate bounding boxes for affected groups
      if (updatedTargetGroup) newLayers = recalcGroupBounds(newLayers, updatedTargetGroup.id);
      if (updatedSourceGroup && updatedSourceGroup.children.length > 0) newLayers = recalcGroupBounds(newLayers, updatedSourceGroup.id);

      // For top-level drops: also reorder the flat array
      if (!dropParentGroupId) {
        const currentIdx = newLayers.findIndex((l) => l.id === dragged.id);
        const [removed] = newLayers.splice(currentIdx, 1);
        const insertIdx = Math.max(0, Math.min(
          currentIdx < dropFlatIndex ? dropFlatIndex - 1 : dropFlatIndex,
          newLayers.length
        ));
        newLayers.splice(insertIdx, 0, removed);
      }

      return newLayers;
    });

    setDraggedLayerIndex(null);
    setDragOverLayerIndex(null);
    setDraggedLayerParentGroupId(null);
  };

  const handleLayerDragEnd = () => {
    setDraggedLayerIndex(null);
    setDragOverLayerIndex(null);
    setDraggedLayerParentGroupId(null);
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

      // Validate: cannot start with a number
      if (htmlId && /^\d/.test(htmlId)) {
        alert('ID cannot start with a number. Please choose a valid ID.');
        return;
      }

      // Validate: must be unique across layers (if not empty)
      if (htmlId && layers.some((l) => l.id !== layerId && l.attributes.id === htmlId)) {
        alert('This ID is already in use by another layer. Please choose a unique ID.');
        return;
      }

      setLayers((prev) =>
        prev.map((l) =>
          l.id === layerId ? { ...l, attributes: { ...l.attributes, id: htmlId } } : l
        )
      );
  };

  const handleAnimationChange = (layerId: string, size: AdSize, animations: import('./data').Animation[]) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;

        const updatedSizeConfig = { ...l.sizeConfig };
        if (updatedSizeConfig[size]) {
          updatedSizeConfig[size] = {
            ...updatedSizeConfig[size],
            animations: animations.length > 0 ? animations : undefined,
          };
        }

        return { ...l, sizeConfig: updatedSizeConfig };
      })
    );
  };

  const handleAnimationLoopDelayChange = (layerId: string, size: AdSize, delay: { value: number; unit: 'ms' | 's' }) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;

        const updatedSizeConfig = { ...l.sizeConfig };
        if (updatedSizeConfig[size]) {
          updatedSizeConfig[size] = {
            ...updatedSizeConfig[size],
            animationLoopDelay: delay,
          };
        }

        return { ...l, sizeConfig: updatedSizeConfig };
      })
    );
  };

  const handleAnimationResetDurationChange = (layerId: string, size: AdSize, duration: { value: number; unit: 'ms' | 's' }) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;

        const updatedSizeConfig = { ...l.sizeConfig };
        if (updatedSizeConfig[size]) {
          updatedSizeConfig[size] = {
            ...updatedSizeConfig[size],
            animationResetDuration: duration,
          };
        }

        return { ...l, sizeConfig: updatedSizeConfig };
      })
    );
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

  const handleIconSizeChange = (layerId: string, iconSize: number) => {
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
                iconSize: iconSize,
              },
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
          const config = l.sizeConfig[selectedSize];
          if (!config) return l;
          return {
            ...l,
            sizeConfig: {
              ...l.sizeConfig,
              [selectedSize]: {
                ...config,
                textAlign,
              },
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
        if (l.id === layerId) {
          // Normalize transparent values to undefined for consistency
          const normalizedColor = 
            !color || color === 'transparent' || color === 'rgba(0,0,0,0)' 
              ? undefined 
              : color;
          return {
            ...l,
            styles: {
              ...l.styles,
              backgroundColor: normalizedColor,
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

  const handleBorderRadiusChange = (
    layerId: string,
    borderRadius:
      | number
      | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number }
  ) => {
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
                borderRadius,
              },
            },
          };
        }
        return l;
      })
    );
  };

  const handleCopyPositionSize = (layerId: string, sourceSize: AdSize, targetSizes: AdSize[]) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== layerId) return layer;

        const sourceConfig = layer.sizeConfig[sourceSize];
        if (!sourceConfig) return layer;

        const updatedSizeConfig = { ...layer.sizeConfig };

        targetSizes.forEach((targetSize) => {
          const existingConfig = updatedSizeConfig[targetSize] || {
            positionX: { value: 0, unit: 'px' as const },
            positionY: { value: 0, unit: 'px' as const },
            width: { value: 100, unit: 'px' as const },
            height: { value: 100, unit: 'px' as const },
          };

          updatedSizeConfig[targetSize] = {
            ...existingConfig,
            positionX: sourceConfig.positionX,
            positionY: sourceConfig.positionY,
            width: sourceConfig.width,
            height: sourceConfig.height,
          };
        });

        return {
          ...layer,
          sizeConfig: updatedSizeConfig,
        };
      })
    );
  };

  const handleCopyFontSize = (layerId: string, sourceSize: AdSize, targetSizes: AdSize[]) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== layerId) return layer;

        const sourceConfig = layer.sizeConfig[sourceSize];
        if (!sourceConfig?.fontSize) return layer;

        const updatedSizeConfig = { ...layer.sizeConfig };

        targetSizes.forEach((targetSize) => {
          const existingConfig = updatedSizeConfig[targetSize];
          if (!existingConfig) return;

          updatedSizeConfig[targetSize] = {
            ...existingConfig,
            fontSize: sourceConfig.fontSize,
          };
        });

        return {
          ...layer,
          sizeConfig: updatedSizeConfig,
        };
      })
    );
  };

  const handleCopyTextAlign = (layerId: string, sourceSize: AdSize, targetSizes: AdSize[]) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== layerId) return layer;

        const sourceConfig = layer.sizeConfig[sourceSize];
        if (!sourceConfig?.textAlign) return layer;

        const updatedSizeConfig = { ...layer.sizeConfig };

        targetSizes.forEach((targetSize) => {
          const existingConfig = updatedSizeConfig[targetSize];
          if (!existingConfig) return;

          updatedSizeConfig[targetSize] = {
            ...existingConfig,
            textAlign: sourceConfig.textAlign,
          };
        });

        return {
          ...layer,
          sizeConfig: updatedSizeConfig,
        };
      })
    );
  };

  const handleCopyIconSize = (layerId: string, sourceSize: AdSize, targetSizes: AdSize[]) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== layerId) return layer;

        const sourceConfig = layer.sizeConfig[sourceSize];
        if (sourceConfig?.iconSize === undefined) return layer;

        const updatedSizeConfig = { ...layer.sizeConfig };

        targetSizes.forEach((targetSize) => {
          const existingConfig = updatedSizeConfig[targetSize];
          if (!existingConfig) return;

          updatedSizeConfig[targetSize] = {
            ...existingConfig,
            iconSize: sourceConfig.iconSize,
          };
        });

        return {
          ...layer,
          sizeConfig: updatedSizeConfig,
        };
      })
    );
  };

  const handleCopyBorderRadius = (layerId: string, sourceSize: AdSize, targetSizes: AdSize[]) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== layerId) return layer;

        const sourceConfig = layer.sizeConfig[sourceSize];
        if (sourceConfig?.borderRadius === undefined) return layer;

        const updatedSizeConfig = { ...layer.sizeConfig };

        targetSizes.forEach((targetSize) => {
          const existingConfig = updatedSizeConfig[targetSize];
          if (!existingConfig) return;

          updatedSizeConfig[targetSize] = {
            ...existingConfig,
            borderRadius: sourceConfig.borderRadius,
          };
        });

        return {
          ...layer,
          sizeConfig: updatedSizeConfig,
        };
      })
    );
  };

  const handleCustomCSSChange = (layerId: string, size: AdSize, customCSS: string) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== layerId) return layer;
        const existingConfig = layer.sizeConfig[size];
        if (!existingConfig) return layer;
        return {
          ...layer,
          sizeConfig: {
            ...layer.sizeConfig,
            [size]: { ...existingConfig, customCSS },
          },
        };
      })
    );
  };

  const handleCopyCustomCSS = (layerId: string, sourceSize: AdSize, targetSizes: AdSize[]) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== layerId) return layer;
        const sourceConfig = layer.sizeConfig[sourceSize];
        if (sourceConfig?.customCSS === undefined) return layer;
        const updatedSizeConfig = { ...layer.sizeConfig };
        targetSizes.forEach((targetSize) => {
          const existingConfig = updatedSizeConfig[targetSize];
          if (!existingConfig) return;
          updatedSizeConfig[targetSize] = { ...existingConfig, customCSS: sourceConfig.customCSS };
        });
        return { ...layer, sizeConfig: updatedSizeConfig };
      })
    );
  };

  const handleCopyAllSizeProperties = (
    layerId: string,
    sourceSize: AdSize,
    targetSizes: AdSize[]
  ) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== layerId) return layer;

        const sourceConfig = layer.sizeConfig[sourceSize];
        if (!sourceConfig) return layer;

        const updatedSizeConfig = { ...layer.sizeConfig };

        targetSizes.forEach((targetSize) => {
          const existingConfig = updatedSizeConfig[targetSize] || {
            positionX: { value: 0, unit: 'px' as const },
            positionY: { value: 0, unit: 'px' as const },
            width: { value: 100, unit: 'px' as const },
            height: { value: 100, unit: 'px' as const },
          };

          updatedSizeConfig[targetSize] = {
            ...existingConfig,
            positionX: sourceConfig.positionX,
            positionY: sourceConfig.positionY,
            width: sourceConfig.width,
            height: sourceConfig.height,
            ...(sourceConfig.fontSize !== undefined ? { fontSize: sourceConfig.fontSize } : {}),
            ...(sourceConfig.textAlign !== undefined ? { textAlign: sourceConfig.textAlign } : {}),
            ...(sourceConfig.iconSize !== undefined ? { iconSize: sourceConfig.iconSize } : {}),
            ...(sourceConfig.borderRadius !== undefined
              ? { borderRadius: sourceConfig.borderRadius }
              : {}),
            ...(sourceConfig.customCSS !== undefined ? { customCSS: sourceConfig.customCSS } : {}),
          };
        });

        return {
          ...layer,
          sizeConfig: updatedSizeConfig,
        };
      })
    );
  };

  const handleReplayAnimations = () => {
    setAnimationKey((prev) => prev + 1);
  };

  const handleButtonActionTypeChange = (layerId: string, actionType: 'link' | 'videoControl') => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId && l.type === 'button') {
          return { ...l, actionType };
        }
        return l;
      })
    );
  };

  const handleButtonIconChange = (
    layerId: string,
    icon: {
      type:
        | 'none'
        | 'play'
        | 'pause'
        | 'replay'
        | 'play-fill'
        | 'pause-fill'
        | 'custom'
        | 'toggle-filled'
        | 'toggle-outline'
        | 'toggle-custom';
      customImage?: string;
      customPlayImage?: string;
      customPauseImage?: string;
      color?: string;
      position?: 'before' | 'after';
    }
  ) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId && l.type === 'button') {
          return { ...l, icon };
        }
        return l;
      })
    );
  };

  const handleVideoControlChange = (
    layerId: string,
    videoControl: {
      targetElementId: string;
      action: 'play' | 'pause' | 'restart' | 'togglePlayPause';
    }
  ) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId && l.type === 'button') {
          return { ...l, videoControl };
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
        if (l.id === layerId && (l.type === 'image' || l.type === 'video')) {
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

  const handleVideoPropertyChange = (layerId: string, property: 'autoplay' | 'controls', value: boolean) => {
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

  const handleAlignMultipleLayers = (alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v') => {
    // Calculate selection bounds
    const selectedLayers = layers.filter((l) => selectedLayerIds.includes(l.id));
    if (selectedLayers.length === 0) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    selectedLayers.forEach((layer) => {
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

  const handleAlignLayer = (layerId: string, alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v') => {
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

        // Determine which axis this alignment affects
        let updatedPosX = config.positionX;
        let updatedPosY = config.positionY;

        switch (alignment) {
          case 'left':
            updatedPosX = { value: 0, unit: 'px' };
            break;
          case 'right':
            updatedPosX = { value: Math.round(canvasWidth - layerWidth), unit: 'px' };
            break;
          case 'center-h':
            updatedPosX = { value: Math.round((canvasWidth - layerWidth) / 2), unit: 'px' };
            break;
          case 'top':
            updatedPosY = { value: 0, unit: 'px' };
            break;
          case 'bottom':
            updatedPosY = { value: Math.round(canvasHeight - layerHeight), unit: 'px' };
            break;
          case 'center-v':
            updatedPosY = { value: Math.round((canvasHeight - layerHeight) / 2), unit: 'px' };
            break;
        }

        return {
          ...layer,
          sizeConfig: {
            ...layer.sizeConfig,
            [selectedSize]: {
              ...config,
              positionX: updatedPosX,
              positionY: updatedPosY,
            },
          },
        };
      })
    );
  };

  const handleExportHTML = () => {
    setSelectedLayerIds([]);
    const html = generateResponsiveHTML(
      layers,
      allowedSizes,
      canvasBackgroundColor,
      animationLoop
    );
    setExportedHTML(html);
    setIsExportModalOpen(true);
  };

  const handleAddLayer = (type: 'text' | 'richtext' | 'image' | 'video' | 'button') => {
    const layerWidth = type === 'image' ? 300 : 200;
    const layerHeight = type === 'image' || type === 'button' ? 50 : 100;

    // Build a centered sizeConfig for each allowed size independently —
    // same layer dimensions on every size, positioned at the center of that canvas.
    const sizeConfig = allowedSizes.reduce<Partial<Record<AdSize, SizeConfig>>>((acc, size) => {
      const canvasDims = HTML5_AD_SIZES[size];
      acc[size] = {
        positionX: { value: Math.round((canvasDims.width - layerWidth) / 2), unit: 'px' },
        positionY: { value: Math.round((canvasDims.height - layerHeight) / 2), unit: 'px' },
        width: { value: layerWidth, unit: 'px' },
        height: { value: layerHeight, unit: 'px' },
        ...(type === 'text' || type === 'richtext' || type === 'button'
          ? { fontSize: '14px' }
          : {}),
      };
      return acc;
    }, {});

    const newLayer: LayerContent = {
      id: `sa-${crypto.randomUUID()}`,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      locked: false,
      attributes: { id: '' },
      sizeConfig,
      ...(type === 'text' || type === 'richtext'
        ? {
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            styles: { backgroundColor: 'rgba(0,0,0,0)', color: '#000000', opacity: 1 },
          }
        : {}),
      ...(type === 'image'
        ? {
            url: 'https://images.pexels.com/photos/35025716/pexels-photo-35025716.jpeg',
            styles: { backgroundColor: 'rgba(0,0,0,0)', opacity: 1 },
          }
        : {}),
      ...(type === 'video'
        ? {
            url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
            styles: { backgroundColor: 'rgba(0,0,0,0)', opacity: 1 },
          }
        : {}),
      ...(type === 'button'
        ? {
            text: 'Click Here',
            actionType: 'link' as const,
            url: '',
            icon: { type: 'none' as const, size: 24, position: 'before' as const },
            styles: { backgroundColor: '#333333', color: '#ffffff', opacity: 1 },
          }
        : {}),
    } as LayerContent;

    setLayers((prev) => [newLayer, ...prev]);
    // Select the newly created layer immediately
    setSelectedLayerIds([newLayer.id]);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-white overflow-hidden">
      <TopBar
        mode={mode}
        selectedSize={selectedSize}
        allowedSizes={allowedSizes}
        canManageSizes={mode === 'edit'}
        canUndo={canUndo}
        canRedo={canRedo}
        showAdSelector={adSelectorPosition === 'top'}
        onModeChange={setMode}
        onSizeChange={setSelectedSize}
        onAddSize={() => setIsManageSizesModalOpen(true)}
        onDeleteSize={handleDeleteSize}
        onExportHTML={handleExportHTML}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSettingsClick={() => setIsSettingsModalOpen(true)}
      />
      <ManageSizesModal
        isOpen={isManageSizesModalOpen}
        availableSizes={availableSizes}
        onClose={() => setIsManageSizesModalOpen(false)}
        onAddSize={addAllowedSize}
      />
      <ConfirmModal
        isOpen={!!confirmState}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        confirmLabel={confirmState?.confirmLabel}
        confirmTone={confirmState?.confirmTone}
        onClose={closeConfirmModal}
        onConfirm={() => {
          confirmState?.onConfirm();
          closeConfirmModal();
        }}
      />
      <ExportHTMLModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        htmlContent={exportedHTML}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        adSelectorPosition={adSelectorPosition}
        onAdSelectorPositionChange={setAdSelectorPosition}
        animationMode={animationMode}
        onAnimationModeChange={setAnimationMode}
      />

      {/* Main content area - flex column to stack canvas/sidebar above timeline */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        onMouseMove={handleLayersPanelMouseMove}
        onMouseUp={handleExtendedMouseUp}
      >
        {/* Canvas and Sidebar - horizontal flex */}
        <div className="flex-1 flex overflow-hidden relative">
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
              onGroupLayers={handleGroupLayers}
              onUngroupLayers={handleUngroupLayers}
            />
          ) : null}

          <Canvas
            mode={mode}
            layers={displayLayers}
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
            animationKey={animationKey}
            animationLoop={animationLoop}
            onLayerMouseDown={handleLayerMouseDown}
            onLayerDoubleClick={handleLayerDoubleClick}
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

          {/* Bottom Controls Bar - Always visible */}
          <div className="absolute bottom-0 left-0 right-0 h-16 flex items-center px-4 gap-4">
            {/* Left side controls */}
            <div className="flex items-center gap-4 w-64">
              {/* Replay Button in Preview Mode OR Snapping Toggle in Edit Mode */}
              {mode === 'preview' ? (
                <button
                  onClick={handleReplayAnimations}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
                  title="Replay Animations"
                >
                  <ReplayIcon className="w-5 h-5" />
                  Replay
                </button>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSnappingEnabled(!isSnappingEnabled);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all border w-24 cursor-pointer ${
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
                  
                  {/* Timeline Toggle Button - only show in advanced mode */}
                  {animationMode === 'advanced' || animationMode === 'both' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTimelinePanelOpen(!isTimelinePanelOpen);
                      }}
                      className={`flex items-center justify-center p-2 rounded-lg shadow-md hover:shadow-lg transition-all border cursor-pointer ${
                        isTimelinePanelOpen
                          ? 'bg-blue-600 border-blue-700 text-white'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                      title={isTimelinePanelOpen ? 'Close Timeline' : 'Open Timeline'}
                    >
                      <TimelineIcon
                        className="w-5 h-5"
                      />
                    </button>
                  ) : null}
                </>
              )}
            </div>

            {/* Ad Selector - Center (when position is 'bottom') */}
            {adSelectorPosition === 'bottom' ? (
              <div className="flex-1 flex items-center justify-center gap-4">
                {allowedSizes.map((size) => {
                  const { width, height } = HTML5_AD_SIZES[size];
                  const isSelected = selectedSize === size;
                  const scale = UI_LAYOUT.AD_SELECTOR_SCALE;

                  return (
                    <div key={size} className="group relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSize(size);
                        }}
                        className="flex flex-col items-center gap-1 p-1 transition-opacity hover:opacity-80 cursor-pointer"
                      >
                        <div
                          className={`bg-white shadow transition-colors duration-200 border-2 ${
                            isSelected ? 'border-blue-600' : 'border-transparent'
                          }`}
                          style={{
                            width: `${width * scale}px`,
                            height: `${height * scale}px`,
                          }}
                        />
                        <span className="text-[10px] font-medium text-gray-900">{size}</span>
                      </button>
                      {mode === 'edit' && allowedSizes.length > 1 ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteSize(size);
                          }}
                          className="absolute -right-2 -top-2 cursor-pointer rounded-full border border-gray-200 bg-white p-1 text-gray-400 opacity-0 shadow-sm transition-all hover:border-red-200 hover:text-red-600 group-hover:opacity-100"
                          title={`Delete ${size}`}
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
                {mode === 'edit' ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsManageSizesModalOpen(true);
                    }}
                    className="group flex flex-col items-center gap-1 p-1 text-gray-400 transition-colors hover:text-blue-600 cursor-pointer"
                  >
                    <div
                      className="flex items-center justify-center border-2 border-dashed border-gray-300 bg-transparent transition-colors group-hover:border-blue-500 group-hover:bg-blue-50"
                      style={{
                        width: `${300 * UI_LAYOUT.AD_SELECTOR_SCALE}px`,
                        height: `${300 * UI_LAYOUT.AD_SELECTOR_SCALE}px`,
                      }}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-medium">Add</span>
                  </button>
                ) : null}
              </div>
            ) : null}

            {/* Zoom Controls - Right side (hidden in preview mode) */}
            <div className="w-64">
              {mode === 'edit' ? (
                <ZoomControls
                  zoom={zoom}
                  onZoomChange={(newZoom) => {
                    handleZoomChange(newZoom);
                    // Commit immediately since this is a deliberate click action
                    setTimeout(() => handleZoomCommit(newZoom), 0);
                  }}
                  onResetPan={() => {
                    setPan({ x: 0, y: 0 });
                    setZoom(1);
                    // Commit reset to history
                    commitPan({ x: 0, y: 0 });
                    commitZoom(1);
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>

        {mode === 'edit' ? (
          <PropertySidebar
            selectedLayerIds={selectedLayerIds}
            layers={layers}
            selectedSize={selectedSize}
            canvasName={canvasName}
            canvasBackgroundColor={canvasBackgroundColor}
            animationLoop={animationLoop}
            isClippingEnabled={isClippingEnabled}
            onClippingEnabledChange={setIsClippingEnabled}
            activeTab={activePropertyTab}
            onActiveTabChange={setActivePropertyTab}
            animationMode={animationMode}
            onCanvasNameChange={setCanvasName}
            onAnimationLoopChange={setAnimationLoop}
            onPropertyChange={handlePropertyChange}
            onDelete={handleDeleteLayer}
            onClearSelection={() => setSelectedLayerIds([])}
            onLabelChange={handleLabelChange}
            onContentChange={handleContentChange}
            onColorChange={handleColorChange}
            onFontSizeChange={handleFontSizeChange}
            onIconSizeChange={handleIconSizeChange}
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
            onAnimationChange={handleAnimationChange}
            onAnimationLoopDelayChange={handleAnimationLoopDelayChange}
            onAnimationResetDurationChange={handleAnimationResetDurationChange}
            onButtonActionTypeChange={handleButtonActionTypeChange}
            onButtonIconChange={handleButtonIconChange}
            onVideoControlChange={handleVideoControlChange}
            onBorderRadiusChange={handleBorderRadiusChange}
            onCopyPositionSize={handleCopyPositionSize}
            onCopyFontSize={handleCopyFontSize}
            onCopyTextAlign={handleCopyTextAlign}
            onCopyIconSize={handleCopyIconSize}
            onCopyBorderRadius={handleCopyBorderRadius}
            onCopyCustomCSS={handleCopyCustomCSS}
            onCopyAllSizeProperties={handleCopyAllSizeProperties}
            onCustomCSSChange={handleCustomCSSChange}
            allowedSizes={allowedSizes}
          />
        ) : null}
        </div>

        {/* Timeline Panel - only in edit mode with advanced animation mode */}
        {mode === 'edit' && (animationMode === 'advanced' || animationMode === 'both') ? (
          <TimelinePanel
            layers={layers}
            selectedSize={selectedSize}
            isOpen={isTimelinePanelOpen}
            selectedLayerIds={selectedLayerIds}
            onAnimationChange={handleAnimationChange}
            onAnimationLoopDelayChange={handleAnimationLoopDelayChange}
          />
        ) : null}
      </div>
    </div>
  );
};

export default App;
