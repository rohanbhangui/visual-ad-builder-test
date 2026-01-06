import { create } from 'zustand';
import { temporal } from 'zundo';
import { useStore as useZustandStore } from 'zustand';
import { sampleCanvas, type LayerContent, type AdSize } from '../data';

// State that gets tracked in history (content + context)
interface HistoricalState {
  // Content state - what changed
  layers: LayerContent[];
  canvasName: string;
  canvasBackgroundColor: string;
  animationLoop: number;
  
  // Context state - where the change was made
  selectedSize: AdSize;
  selectedLayerIds: string[];
  activePropertyTab: 'properties' | 'animations';
}

// Ephemeral UI state that doesn't get tracked
interface EphemeralState {
  mode: 'edit' | 'preview';
  zoom: number;
  pan: { x: number; y: number };
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
  
  // Context actions (tracked)
  setSelectedSize: (size: AdSize) => void;
  setSelectedLayerIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setActivePropertyTab: (tab: 'properties' | 'animations') => void;
  setIsLayersPanelCollapsed: (collapsed: boolean) => void;
  setLayersPanelPos: (pos: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setLayersPanelSide: (side: 'left' | 'right') => void;
  
  // Ephemeral actions (not tracked)
  setMode: (mode: 'edit' | 'preview') => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
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
      isLayersPanelCollapsed: false,
      layersPanelPos: { x: -1, y: 10 },
      layersPanelSide: 'right' as 'left' | 'right',
      
      // Ephemeral state (not tracked)
      mode: 'edit',
      zoom: 1,
      pan: { x: 0, y: 0 },
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
      
      // Context actions (tracked)
      setSelectedSize: (selectedSize: AdSize) => set({ selectedSize }),
      setSelectedLayerIds: (ids: string[] | ((prev: string[]) => string[])) =>
        set((state: AppStore) => ({
          selectedLayerIds: typeof ids === 'function' ? ids(state.selectedLayerIds) : ids,
        })),
      setActivePropertyTab: (activePropertyTab: 'properties' | 'animations') => set({ activePropertyTab }),
      setIsLayersPanelCollapsed: (isLayersPanelCollapsed: boolean) => set({ isLayersPanelCollapsed }),
      setLayersPanelPos: (pos: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) =>
        set((state: AppStore) => ({
          layersPanelPos: typeof pos === 'function' ? pos(state.layersPanelPos) : pos,
        })),
      setLayersPanelSide: (layersPanelSide: 'left' | 'right') => set({ layersPanelSide }),
      
      // Ephemeral actions (not tracked)
      setMode: (mode: 'edit' | 'preview') => set({ mode }),
      setZoom: (zoom: number) => set({ zoom }),
      setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) =>
        set((state: AppStore) => ({
          pan: typeof pan === 'function' ? pan(state.pan) : pan,
        })),
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
        // Only track these fields in history
        layers: state.layers,
        canvasName: state.canvasName,
        canvasBackgroundColor: state.canvasBackgroundColor,
        animationLoop: state.animationLoop,
        selectedSize: state.selectedSize,
        selectedLayerIds: state.selectedLayerIds,
        activePropertyTab: state.activePropertyTab,
      }),
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
