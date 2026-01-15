import { create } from 'zustand';
import { temporal } from 'zundo';
import { useStore as useZustandStore } from 'zustand';
import { sampleCanvas, type LayerContent, type AdSize } from '../data';

// State that gets tracked in history (content + meaningful UI changes)
interface HistoricalState {
  // Core content state
  layers: LayerContent[];
  canvasName: string;
  canvasBackgroundColor: string;
  animationLoop: number;
  // Editing context - tracked to provide context for layer modifications
  selectedSize: AdSize; // Layer properties are size-specific
  selectedLayerIds: string[]; // Which layers are being edited
  // UI state that represents meaningful user actions
  activePropertyTab: 'properties' | 'animations'; // Tab switches
  isTimelinePanelOpen: boolean; // Timeline open/close
  zoom: number; // Final zoom level (committed after interaction)
  pan: { x: number; y: number }; // Final pan position (committed after interaction)
}

// Ephemeral UI state that doesn't get tracked
interface EphemeralState {
  // Application settings (not canvas state)
  animationMode: 'basic' | 'advanced' | 'both';
  // Temporary interaction state
  mode: 'edit' | 'preview';
  isPanning: boolean;
  isSnappingEnabled: boolean;
  isClippingEnabled: boolean;
  isExportModalOpen: boolean;
  isSettingsModalOpen: boolean;
  adSelectorPosition: 'top' | 'bottom';
  exportedHTML: string;
  animationKey: number;
  draggedLayerIndex: number | null;
  dragOverLayerIndex: number | null;
  isLayersPanelDragging: boolean;
  isLayersPanelCollapsed: boolean;
  layersPanelPos: { x: number; y: number };
  layersPanelSide: 'left' | 'right';
}

// Combined store type
interface AppStore extends HistoricalState, EphemeralState {
  // Layer actions
  setLayers: (layers: LayerContent[] | ((prev: LayerContent[]) => LayerContent[])) => void;
  updateLayer: (id: string, updates: Partial<LayerContent>) => void;
  deleteLayer: (id: string) => void;
  deleteLayers: (ids: string[]) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  
  // Canvas actions
  setCanvasName: (name: string) => void;
  setCanvasBackgroundColor: (color: string) => void;
  setAnimationLoop: (loop: number) => void;
  
  // Context actions
  setSelectedSize: (size: AdSize) => void; // Tracked in history for size-specific changes
  setSelectedLayerIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setActivePropertyTab: (tab: 'properties' | 'animations') => void;
  setAnimationMode: (mode: 'basic' | 'advanced' | 'both') => void;
  setIsTimelinePanelOpen: (open: boolean) => void;
  setIsLayersPanelCollapsed: (collapsed: boolean) => void;
  setLayersPanelPos: (pos: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setLayersPanelSide: (side: 'left' | 'right') => void;
  
  // Ephemeral actions (not tracked)
  setMode: (mode: 'edit' | 'preview') => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  commitZoom: (zoom: number) => void; // Commit final zoom value to history
  commitPan: (pan: { x: number; y: number }) => void; // Commit final pan value to history
  setIsPanning: (isPanning: boolean) => void;
  setIsSnappingEnabled: (enabled: boolean) => void;
  setIsClippingEnabled: (enabled: boolean) => void;
  setIsExportModalOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  setAdSelectorPosition: (position: 'top' | 'bottom') => void;
  setExportedHTML: (html: string) => void;
  setAnimationKey: (key: number | ((prev: number) => number)) => void;
  setDraggedLayerIndex: (index: number | null) => void;
  setDragOverLayerIndex: (index: number | null) => void;
  setIsLayersPanelDragging: (dragging: boolean) => void;
}

export const useStore = create<AppStore>()(
  temporal(
    (set) => ({
      // Historical state (tracked in undo/redo)
      layers: sampleCanvas.layers,
      canvasName: sampleCanvas.name,
      canvasBackgroundColor: sampleCanvas.styles?.backgroundColor || '#ffffff',
      animationLoop: sampleCanvas.animationLoop ?? -1,
      selectedSize: '336x280' as AdSize,
      selectedLayerIds: [],
      activePropertyTab: 'properties' as 'properties' | 'animations',
      isTimelinePanelOpen: false,
      zoom: 1,
      pan: { x: 0, y: 0 },
      
      // Ephemeral state (not tracked)
      animationMode: 'both' as 'basic' | 'advanced' | 'both',
      isLayersPanelCollapsed: false,
      layersPanelPos: { x: -1, y: 10 },
      layersPanelSide: 'right' as 'left' | 'right',
      mode: 'edit',
      isPanning: false,
      isSnappingEnabled: true,
      isClippingEnabled: false,
      isExportModalOpen: false,
      isSettingsModalOpen: false,
      adSelectorPosition: 'bottom',
      exportedHTML: '',
      animationKey: 0,
      draggedLayerIndex: null,
      dragOverLayerIndex: null,
      isLayersPanelDragging: false,
      
      // Layer actions
      setLayers: (layers: LayerContent[] | ((prev: LayerContent[]) => LayerContent[])) =>
        set((state: AppStore) => ({
          layers: typeof layers === 'function' ? layers(state.layers) : layers,
        })),
      
      updateLayer: (id: string, updates: Partial<LayerContent>) =>
        set((state: AppStore) => {
          const layers = state.layers.map((layer) =>
            layer.id === id ? ({ ...layer, ...updates } as LayerContent) : layer
          );
          return { layers };
        }),
      
      deleteLayer: (id: string) =>
        set((state: AppStore) => ({
          layers: state.layers.filter((layer) => layer.id !== id),
          selectedLayerIds: state.selectedLayerIds.filter((sid) => sid !== id),
        })),
      
      deleteLayers: (ids: string[]) =>
        set((state: AppStore) => ({
          layers: state.layers.filter((layer) => !ids.includes(layer.id)),
          selectedLayerIds: state.selectedLayerIds.filter((sid) => !ids.includes(sid)),
        })),
      
      reorderLayers: (fromIndex: number, toIndex: number) =>
        set((state: AppStore) => {
          const newLayers = [...state.layers];
          const [removed] = newLayers.splice(fromIndex, 1);
          newLayers.splice(toIndex, 0, removed);
          return { layers: newLayers };
        }),
      
      // Canvas actions
      setCanvasName: (canvasName: string) => set({ canvasName }),
      setCanvasBackgroundColor: (canvasBackgroundColor: string) => set({ canvasBackgroundColor }),
      setAnimationLoop: (animationLoop: number) => set({ animationLoop }),
      
      // Context actions
      setSelectedSize: (selectedSize: AdSize) => set({ selectedSize }), // Tracked in history
      setSelectedLayerIds: (ids: string[] | ((prev: string[]) => string[])) =>
        set((state: AppStore) => ({
          selectedLayerIds: typeof ids === 'function' ? ids(state.selectedLayerIds) : ids,
        })), // Tracked - provides context for layer edits
      setActivePropertyTab: (activePropertyTab: 'properties' | 'animations') => set({ activePropertyTab }), // Tracked
      setAnimationMode: (animationMode: 'basic' | 'advanced' | 'both') => set({ animationMode }), // Not tracked
      setIsTimelinePanelOpen: (isTimelinePanelOpen: boolean) => set({ isTimelinePanelOpen }), // Tracked
      setIsLayersPanelCollapsed: (isLayersPanelCollapsed: boolean) => set({ isLayersPanelCollapsed }), // Not tracked
      setLayersPanelPos: (pos: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) =>
        set((state: AppStore) => ({
          layersPanelPos: typeof pos === 'function' ? pos(state.layersPanelPos) : pos,
        })), // Not tracked
      setLayersPanelSide: (layersPanelSide: 'left' | 'right') => set({ layersPanelSide }), // Not tracked
      
      // Ephemeral actions (not tracked by partialize)
      setMode: (mode: 'edit' | 'preview') => set({ mode }),
      // setZoom updates zoom without tracking (during interaction)
      setZoom: (zoom: number) => set({ zoom }),
      // setPan updates pan without tracking (during interaction)
      setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) =>
        set((state: AppStore) => ({
          pan: typeof pan === 'function' ? pan(state.pan) : pan,
        })),
      // commitZoom saves final zoom value to history (will be picked up by partialize)
      commitZoom: (zoom: number) => set({ zoom }),
      // commitPan saves final pan value to history (will be picked up by partialize)
      commitPan: (pan: { x: number; y: number }) => set({ pan }),
      setIsPanning: (isPanning: boolean) => set({ isPanning }),
      setIsSnappingEnabled: (isSnappingEnabled: boolean) => set({ isSnappingEnabled }),
      setIsSettingsModalOpen: (isSettingsModalOpen: boolean) => set({ isSettingsModalOpen }),
      setAdSelectorPosition: (adSelectorPosition: 'top' | 'bottom') => set({ adSelectorPosition }),
      setIsClippingEnabled: (isClippingEnabled: boolean) => set({ isClippingEnabled }),
      setIsExportModalOpen: (isExportModalOpen: boolean) => set({ isExportModalOpen }),
      setExportedHTML: (exportedHTML: string) => set({ exportedHTML }),
      setAnimationKey: (key: number | ((prev: number) => number)) =>
        set((state: AppStore) => ({
          animationKey: typeof key === 'function' ? key(state.animationKey) : key,
        })),
      setDraggedLayerIndex: (draggedLayerIndex: number | null) => set({ draggedLayerIndex }),
      setDragOverLayerIndex: (dragOverLayerIndex: number | null) => set({ dragOverLayerIndex }),
      setIsLayersPanelDragging: (isLayersPanelDragging: boolean) => set({ isLayersPanelDragging }),
    }),
    {
      limit: 50, // Keep last 50 history entries
      partialize: (state): HistoricalState => ({
        // Track meaningful canvas modifications
        layers: state.layers,
        canvasName: state.canvasName,
        canvasBackgroundColor: state.canvasBackgroundColor,
        animationLoop: state.animationLoop,
        // Track editing context
        selectedSize: state.selectedSize, // Layer properties are size-specific
        selectedLayerIds: state.selectedLayerIds, // Which layers are being edited
        // Track meaningful UI changes that represent user intent
        activePropertyTab: state.activePropertyTab, // Tab switches
        isTimelinePanelOpen: state.isTimelinePanelOpen, // Timeline open/close
        zoom: state.zoom, // Final zoom level
        pan: state.pan, // Final pan position
      }),
      // Let zundo handle equality checks (more efficient than JSON.stringify)
    }
  )
);

// Create hooks to access temporal state reactively
export const useCanUndo = (): boolean => {
  return useZustandStore(
    useStore.temporal as any,
    (state: any) => state.pastStates?.length > 0
  );
};

export const useCanRedo = (): boolean => {
  return useZustandStore(
    useStore.temporal as any,
    (state: any) => state.futureStates?.length > 0
  );
};

// Helper functions for continuous operations (like dragging color pickers)
// Call pauseHistory() when starting a drag, resumeHistory() when done
export const pauseHistory = () => {
  (useStore.temporal as any).getState().pause();
};

export const resumeHistory = () => {
  (useStore.temporal as any).getState().resume();
};

// Debug helper to access history (accessible via window.vb.history())
export const getHistory = () => {
  const temporal = (useStore.temporal as any).getState();
  return {
    past: temporal.pastStates || [],
    present: useStore.getState(),
    future: temporal.futureStates || [],
    canUndo: temporal.pastStates?.length > 0,
    canRedo: temporal.futureStates?.length > 0,
  };
};

// Helper to clear initial history (after first render)
export const clearInitialHistory = () => {
  (useStore.temporal as any).getState().clear();
};
