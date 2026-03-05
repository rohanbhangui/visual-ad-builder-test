import { create } from 'zustand';
import { temporal } from 'zundo';
import { useStore as useZustandStore } from 'zustand';
import { sampleCanvas, type LayerContent, type GroupLayer, type AdSize } from '../data';
import { HTML5_AD_SIZES } from '../consts';

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
  draggedLayerParentGroupId: string | null;
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
  groupLayers: (ids: string[]) => void;
  ungroupLayers: (groupId: string) => void;
  
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
  setDraggedLayerParentGroupId: (id: string | null) => void;
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
      draggedLayerParentGroupId: null,
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
        set((state: AppStore) => {
          // If deleting a group, also remove its children
          const layer = state.layers.find((l) => l.id === id);
          const childIds = layer?.type === 'group' ? (layer as GroupLayer).children : [];
          const removeIds = new Set([id, ...childIds]);
          return {
            layers: state.layers.filter((l) => !removeIds.has(l.id)),
            selectedLayerIds: state.selectedLayerIds.filter((sid) => !removeIds.has(sid)),
          };
        }),
      
      deleteLayers: (ids: string[]) =>
        set((state: AppStore) => {
          // Collect child IDs from any selected groups
          const extraChildIds: string[] = [];
          ids.forEach((id) => {
            const layer = state.layers.find((l) => l.id === id);
            if (layer?.type === 'group') {
              extraChildIds.push(...(layer as GroupLayer).children);
            }
          });
          const removeIds = new Set([...ids, ...extraChildIds]);
          return {
            layers: state.layers.filter((l) => !removeIds.has(l.id)),
            selectedLayerIds: state.selectedLayerIds.filter((sid) => !removeIds.has(sid)),
          };
        }),
      
      reorderLayers: (fromIndex: number, toIndex: number) =>
        set((state: AppStore) => {
          const newLayers = [...state.layers];
          const [removed] = newLayers.splice(fromIndex, 1);
          newLayers.splice(toIndex, 0, removed);
          return { layers: newLayers };
        }),

      groupLayers: (ids: string[]) =>
        set((state: AppStore) => {
          const selectedLayers = state.layers.filter((l) => ids.includes(l.id));
          if (selectedLayers.length < 2) return {};

          const groupId = `sa-${crypto.randomUUID()}`;
          const groupLayer: GroupLayer = {
            id: groupId,
            label: 'Group',
            locked: false,
            type: 'group',
            children: ids,
            attributes: { id: '' },
            styles: { opacity: 1 },
            sizeConfig: {},
          };

          // For each size, compute bounding box and make child positions relative
          const allSizes = Object.keys(HTML5_AD_SIZES) as AdSize[];
          // Deep-copy children so we can mutate safely
          const updatedChildren = selectedLayers.map((l) => ({ ...l, sizeConfig: { ...l.sizeConfig } }));

          allSizes.forEach((size) => {
            const childrenWithConfig = selectedLayers.filter((l) => l.sizeConfig[size]);
            if (childrenWithConfig.length === 0) return;

            const dims = HTML5_AD_SIZES[size];
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            childrenWithConfig.forEach((layer) => {
              const config = layer.sizeConfig[size]!;
              const x = config.positionX.unit === '%' ? (config.positionX.value / 100) * dims.width : config.positionX.value;
              const y = config.positionY.unit === '%' ? (config.positionY.value / 100) * dims.height : config.positionY.value;
              const w = config.width.unit === '%' ? (config.width.value / 100) * dims.width : config.width.value;
              const h = config.height.unit === '%' ? (config.height.value / 100) * dims.height : config.height.value;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x + w);
              maxY = Math.max(maxY, y + h);
            });

            groupLayer.sizeConfig[size] = {
              positionX: { value: minX, unit: 'px' },
              positionY: { value: minY, unit: 'px' },
              width: { value: maxX - minX, unit: 'px' },
              height: { value: maxY - minY, unit: 'px' },
            };

            // Convert each child's position to relative
            updatedChildren.forEach((child, idx) => {
              const config = child.sizeConfig[size];
              if (!config) return;
              const dims2 = HTML5_AD_SIZES[size];
              const x = config.positionX.unit === '%' ? (config.positionX.value / 100) * dims2.width : config.positionX.value;
              const y = config.positionY.unit === '%' ? (config.positionY.value / 100) * dims2.height : config.positionY.value;
              updatedChildren[idx] = {
                ...child,
                sizeConfig: {
                  ...child.sizeConfig,
                  [size]: { ...config, positionX: { value: x - minX, unit: 'px' }, positionY: { value: y - minY, unit: 'px' } },
                },
              } as LayerContent;
            });
          });

          // Build new layers array: insert [group, ...children] at the position of the first selected layer,
          // and remove the original child entries from wherever they were.
          const idsSet = new Set(ids);
          const firstIdx = state.layers.findIndex((l) => ids.includes(l.id));
          const withoutSelected = state.layers.filter((l) => !idsSet.has(l.id));
          const insertAt = Math.min(firstIdx, withoutSelected.length);
          const newLayers = [
            ...withoutSelected.slice(0, insertAt),
            groupLayer as LayerContent,
            ...updatedChildren,
            ...withoutSelected.slice(insertAt),
          ];

          return { layers: newLayers, selectedLayerIds: [groupId] };
        }),

      ungroupLayers: (groupId: string) =>
        set((state: AppStore) => {
          const group = state.layers.find((l) => l.id === groupId);
          if (!group || group.type !== 'group') return {};
          const groupLayer = group as GroupLayer;
          const childIds = groupLayer.children;

          // For each size in the group's sizeConfig, convert children back to absolute coords
          const allSizes = Object.keys(HTML5_AD_SIZES) as AdSize[];
          const updatedChildren: LayerContent[] = state.layers
            .filter((l) => childIds.includes(l.id))
            .map((child) => {
              const newSizeConfig = { ...child.sizeConfig };
              allSizes.forEach((size) => {
                const childConfig = child.sizeConfig[size];
                const groupConfig = groupLayer.sizeConfig[size];
                if (!childConfig || !groupConfig) return;
                const dims = HTML5_AD_SIZES[size];
                const gx = groupConfig.positionX.unit === '%' ? (groupConfig.positionX.value / 100) * dims.width : groupConfig.positionX.value;
                const gy = groupConfig.positionY.unit === '%' ? (groupConfig.positionY.value / 100) * dims.height : groupConfig.positionY.value;
                const cx = childConfig.positionX.unit === '%' ? (childConfig.positionX.value / 100) * dims.width : childConfig.positionX.value;
                const cy = childConfig.positionY.unit === '%' ? (childConfig.positionY.value / 100) * dims.height : childConfig.positionY.value;
                newSizeConfig[size] = {
                  ...childConfig,
                  positionX: { value: gx + cx, unit: 'px' },
                  positionY: { value: gy + cy, unit: 'px' },
                };
              });
              return { ...child, sizeConfig: newSizeConfig } as LayerContent;
            });

          // Replace children in-place, then remove the group entry
          const newLayers = state.layers
            .map((l) => {
              const updated = updatedChildren.find((u) => u.id === l.id);
              return updated || l;
            })
            .filter((l) => l.id !== groupId);

          return { layers: newLayers, selectedLayerIds: childIds };
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
      setDraggedLayerParentGroupId: (id: string | null) => set({ draggedLayerParentGroupId: id }),
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

/**
 * Push a snapshot of the pre-gesture view state directly into pastStates.
 *
 * Why: zundo's _handleSet records the state BEFORE a set() call as the new
 * past entry. When pause()/resume() is used during a gesture, the interim
 * setZoom/setPan calls already update the store to the final value before
 * commitZoom/commitPan is ever called. So commitZoom(finalZoom) captures the
 * final value as the "past" entry, making undo restore back to the same
 * visible state.
 *
 * Solution: bypass commit* entirely and manually push the known pre-gesture
 * snapshot so that undo correctly restores to before the gesture started.
 */
export const pushViewSnapshot = (zoom: number, pan: { x: number; y: number }) => {
  const temporalStore = (useStore.temporal as any);
  const temporalState = temporalStore.getState();
  const state = useStore.getState();
  const snapshot: HistoricalState = {
    layers: state.layers,
    canvasName: state.canvasName,
    canvasBackgroundColor: state.canvasBackgroundColor,
    animationLoop: state.animationLoop,
    selectedSize: state.selectedSize,
    selectedLayerIds: state.selectedLayerIds,
    activePropertyTab: state.activePropertyTab,
    isTimelinePanelOpen: state.isTimelinePanelOpen,
    zoom,
    pan,
  };
  // Respect the 50-entry limit and clear future states (new action)
  const limit = 50;
  temporalStore.setState({
    pastStates: [...temporalState.pastStates, snapshot].slice(-limit),
    futureStates: [],
  });
};
