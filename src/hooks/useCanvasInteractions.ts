import { useState, useRef, useEffect, useCallback } from 'react';
import { type LayerContent, type AdSize } from '../data';
import { HTML5_AD_SIZES } from '../consts';

interface UseCanvasInteractionsProps {
  mode: 'edit' | 'preview';
  layers: LayerContent[];
  selectedLayerIds: string[];
  selectedSize: AdSize;
  isSnappingEnabled: boolean;
  isShiftPressed: boolean;
  isAltPressed: boolean;
  zoom?: number;
  pan?: { x: number; y: number };
  isSpacePressed?: boolean;
  setLayers: React.Dispatch<React.SetStateAction<LayerContent[]>>;
  setSelectedLayerIds: React.Dispatch<React.SetStateAction<string[]>>;
}

/**
 * Hook to handle canvas interactions for dragging and resizing layers
 * Includes snapping, aspect ratio locking, and modifier key support (Shift, Alt)
 */
export const useCanvasInteractions = ({
  mode,
  layers,
  selectedLayerIds,
  selectedSize,
  isSnappingEnabled,
  isShiftPressed,
  isAltPressed,
  zoom = 1,
  pan = { x: 0, y: 0 },
  isSpacePressed = false,
  setLayers,
  setSelectedLayerIds,
}: UseCanvasInteractionsProps) => {
  // ============================================
  // STATE & REFS
  // ============================================
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [snapLines, setSnapLines] = useState<
    Array<{ type: 'vertical' | 'horizontal'; position: number }>
  >([]);
  const dragStartRef = useRef<{ x: number; y: number; layerPositions: Record<string, { x: number; y: number }> }>({
    x: 0,
    y: 0,
    layerPositions: {},
  });
  const resizeStartRef = useRef({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    layerX: 0,
    layerY: 0,
    direction: '',
  });

  const dimensions = HTML5_AD_SIZES[selectedSize];
  const SNAP_THRESHOLD = 8;

  // Store latest values in refs so event handlers always have current state
  const handleMouseMoveRef = useRef<((e: MouseEvent | React.MouseEvent) => void) | null>(null);
  const handleMouseUpRef = useRef<(() => void) | null>(null);

  // ============================================
  // EVENT HANDLERS - INITIATION
  // ============================================
  
  /** Handler for starting a layer drag operation */
  const handleLayerMouseDown = (e: React.MouseEvent, layerId: string) => {
    if (mode !== 'edit') return;
    
    // Prevent layer interaction when space is pressed (panning mode)
    if (isSpacePressed) return;

    const target = e.target as HTMLElement;
    if (target.style.cursor && target.style.cursor.includes('resize')) {
      return;
    }

    e.stopPropagation();
    
    // Handle multi-select with Shift key
    if (e.shiftKey) {
      // Toggle this layer in the selection
      setSelectedLayerIds(prev => 
        prev.includes(layerId) 
          ? prev.filter(id => id !== layerId)
          : [...prev, layerId]
      );
    } else if (!selectedLayerIds.includes(layerId)) {
      // If clicking a non-selected layer without Shift, replace selection
      setSelectedLayerIds([layerId]);
    }
    // If clicking an already-selected layer without Shift, keep current selection

    // Store initial positions for all selected layers
    const layerPositions: Record<string, { x: number; y: number }> = {};
    const layersToMove = selectedLayerIds.includes(layerId) ? selectedLayerIds : [layerId];
    
    layersToMove.forEach(id => {
      const layer = layers.find((l) => l.id === id);
      if (layer) {
        const config = layer.sizeConfig[selectedSize];
        if (config) {
          const posX = config.positionX;
          const posY = config.positionY;
          // Convert % to px for uniform movement
          const xInPx = posX.unit === '%' ? (posX.value / 100) * dimensions.width : posX.value;
          const yInPx = posY.unit === '%' ? (posY.value / 100) * dimensions.height : posY.value;
          layerPositions[id] = { x: xInPx, y: yInPx };
        }
      }
    });

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      layerPositions,
    };
  };

  /** Handler for starting a layer resize operation */
  const handleResizeMouseDown = (e: React.MouseEvent, layerId: string, direction: string) => {
    if (mode !== 'edit') return;
    e.preventDefault();
    e.stopPropagation();

    // Resizing only works for single selection
    if (selectedLayerIds.length !== 1) return;
    
    setSelectedLayerIds([layerId]);

    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const config = layer.sizeConfig[selectedSize];
    if (!config) return;

    const posX = config.positionX;
    const posY = config.positionY;
    const width = config.width;
    const height = config.height;

    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: width.value,
      height: height.value,
      layerX: posX.value,
      layerY: posY.value,
      direction,
    };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (isDragging && selectedLayerIds.length > 0) {
        // Convert screen coordinates to canvas coordinates accounting for zoom
        const dx = (e.clientX - dragStartRef.current.x) / zoom;
        const dy = (e.clientY - dragStartRef.current.y) / zoom;

        // Calculate bounding box of all selected layers for snapping
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const selectedLayers = layers.filter(l => selectedLayerIds.includes(l.id));
        
        selectedLayers.forEach(layer => {
          const initialPos = dragStartRef.current.layerPositions[layer.id];
          if (!initialPos) return;
          
          const newX = initialPos.x + dx;
          const newY = initialPos.y + dy;
          // Convert width/height % to px for bounding box calculation
          const config = layer.sizeConfig[selectedSize];
          if (!config) return;
          
          const widthData = config.width;
          const heightData = config.height;
          const width = widthData.unit === '%' ? (widthData.value / 100) * dimensions.width : widthData.value;
          const height = heightData.unit === '%' ? (heightData.value / 100) * dimensions.height : heightData.value;
          
          minX = Math.min(minX, newX);
          minY = Math.min(minY, newY);
          maxX = Math.max(maxX, newX + width);
          maxY = Math.max(maxY, newY + height);
        });

        const boundingWidth = maxX - minX;
        const boundingHeight = maxY - minY;
        const boundingCenterX = minX + boundingWidth / 2;
        const boundingCenterY = minY + boundingHeight / 2;
        
        let snapDx = 0;
        let snapDy = 0;
        const guides: Array<{ type: 'vertical' | 'horizontal'; position: number }> = [];

        // Apply snapping based on bounding box if enabled
        if (isSnappingEnabled) {
          const canvasEdges = {
            left: 0,
            right: dimensions.width,
            top: 0,
            bottom: dimensions.height,
            centerX: dimensions.width / 2,
            centerY: dimensions.height / 2,
          };

          // Check snapping for bounding box edges
          if (Math.abs(minX - canvasEdges.left) < SNAP_THRESHOLD) {
            snapDx = canvasEdges.left - minX;
            guides.push({ type: 'vertical', position: canvasEdges.left });
          } else if (Math.abs(maxX - canvasEdges.right) < SNAP_THRESHOLD) {
            snapDx = canvasEdges.right - maxX;
            guides.push({ type: 'vertical', position: canvasEdges.right });
          } else if (Math.abs(boundingCenterX - canvasEdges.centerX) < SNAP_THRESHOLD) {
            snapDx = canvasEdges.centerX - boundingCenterX;
            guides.push({ type: 'vertical', position: canvasEdges.centerX });
          }

          if (Math.abs(minY - canvasEdges.top) < SNAP_THRESHOLD) {
            snapDy = canvasEdges.top - minY;
            guides.push({ type: 'horizontal', position: canvasEdges.top });
          } else if (Math.abs(maxY - canvasEdges.bottom) < SNAP_THRESHOLD) {
            snapDy = canvasEdges.bottom - maxY;
            guides.push({ type: 'horizontal', position: canvasEdges.bottom });
          } else if (Math.abs(boundingCenterY - canvasEdges.centerY) < SNAP_THRESHOLD) {
            snapDy = canvasEdges.centerY - boundingCenterY;
            guides.push({ type: 'horizontal', position: canvasEdges.centerY });
          }

          // Check snapping to other layers
          layers.forEach((layer) => {
            if (selectedLayerIds.includes(layer.id)) return;

            const otherConfig = layer.sizeConfig[selectedSize];
            if (!otherConfig) return;

            const otherX = otherConfig.positionX.value;
            const otherY = otherConfig.positionY.value;
            const otherRight = otherX + otherConfig.width.value;
            const otherBottom = otherY + otherConfig.height.value;
            const otherCenterX = otherX + otherConfig.width.value / 2;
            const otherCenterY = otherY + otherConfig.height.value / 2;

            // Vertical snapping
            if (snapDx === 0) {
              if (Math.abs(minX - otherX) < SNAP_THRESHOLD) {
                snapDx = otherX - minX;
                guides.push({ type: 'vertical', position: otherX });
              } else if (Math.abs(maxX - otherRight) < SNAP_THRESHOLD) {
                snapDx = otherRight - maxX;
                guides.push({ type: 'vertical', position: otherRight });
              } else if (Math.abs(minX - otherRight) < SNAP_THRESHOLD) {
                snapDx = otherRight - minX;
                guides.push({ type: 'vertical', position: otherRight });
              } else if (Math.abs(maxX - otherX) < SNAP_THRESHOLD) {
                snapDx = otherX - maxX;
                guides.push({ type: 'vertical', position: otherX });
              } else if (Math.abs(boundingCenterX - otherCenterX) < SNAP_THRESHOLD) {
                snapDx = otherCenterX - boundingCenterX;
                guides.push({ type: 'vertical', position: otherCenterX });
              }
            }

            // Horizontal snapping
            if (snapDy === 0) {
              if (Math.abs(minY - otherY) < SNAP_THRESHOLD) {
                snapDy = otherY - minY;
                guides.push({ type: 'horizontal', position: otherY });
              } else if (Math.abs(maxY - otherBottom) < SNAP_THRESHOLD) {
                snapDy = otherBottom - maxY;
                guides.push({ type: 'horizontal', position: otherBottom });
              } else if (Math.abs(minY - otherBottom) < SNAP_THRESHOLD) {
                snapDy = otherBottom - minY;
                guides.push({ type: 'horizontal', position: otherBottom });
              } else if (Math.abs(maxY - otherY) < SNAP_THRESHOLD) {
                snapDy = otherY - maxY;
                guides.push({ type: 'horizontal', position: otherY });
              } else if (Math.abs(boundingCenterY - otherCenterY) < SNAP_THRESHOLD) {
                snapDy = otherCenterY - boundingCenterY;
                guides.push({ type: 'horizontal', position: otherCenterY });
              }
            }
          });
        }

        setSnapLines(guides);

        // Apply movement with snapping
        setLayers((prev) =>
          prev.map((layer) => {
            const initialPos = dragStartRef.current.layerPositions[layer.id];
            if (!initialPos) return layer;

            const config = layer.sizeConfig[selectedSize];
            if (!config) return layer;

            const newX = initialPos.x + dx + snapDx;
            const newY = initialPos.y + dy + snapDy;

            return {
              ...layer,
              sizeConfig: {
                ...layer.sizeConfig,
                [selectedSize]: {
                  ...config,
                  positionX: {
                    value: newX,
                    unit: 'px',
                  },
                  positionY: {
                    value: newY,
                    unit: 'px',
                  },
                },
              },
            };
          })
        );
      } else if (isResizing && selectedLayerIds.length === 1) {
        // -------------------- RESIZE LOGIC --------------------
        // Convert screen coordinates to canvas coordinates accounting for zoom
        const dx = (e.clientX - resizeStartRef.current.x) / zoom;
        const dy = (e.clientY - resizeStartRef.current.y) / zoom;
        const { direction, width, height, layerX, layerY } = resizeStartRef.current;

        const currentLayer = layers.find((l) => l.id === selectedLayerIds[0]);
        if (!currentLayer) return;

        const MIN_SIZE = 30;
        const centerX = layerX + width / 2;
        const centerY = layerY + height / 2;
        const aspectRatio = width / height;

        let newWidth = width;
        let newHeight = height;
        let newX = layerX;
        let newY = layerY;

        // Determine if this is a corner or edge resize
        const isCorner =
          (direction.includes('n') || direction.includes('s')) &&
          (direction.includes('e') || direction.includes('w'));

        // Determine if aspect ratio should be locked:
        // - If layer has aspectRatioLocked=true, always lock aspect ratio
        // - If layer has aspectRatioLocked=false (or undefined), lock only when Shift is pressed
        const shouldLockAspectRatio = currentLayer.aspectRatioLocked
          ? true
          : isShiftPressed && !currentLayer.aspectRatioLocked;

        // ========== INITIAL RESIZE CALCULATION (before snapping) ==========
        
        // CASE 1: Alt only (no aspect ratio lock) - Center resize
        if (isAltPressed && !shouldLockAspectRatio) {
          // Alt only: Center resize (both edges move equally)
          if (direction.includes('e') || direction.includes('w')) {
            const multiplier = direction.includes('w') ? -1 : 1;
            newWidth = Math.max(MIN_SIZE, width + dx * 2 * multiplier);
            newX = centerX - newWidth / 2;
          }
          if (direction.includes('s') || direction.includes('n')) {
            const multiplier = direction.includes('n') ? -1 : 1;
            newHeight = Math.max(MIN_SIZE, height + dy * 2 * multiplier);
            newY = centerY - newHeight / 2;
          }
        } else if (shouldLockAspectRatio && !isAltPressed) {
          // CASE 2: Aspect ratio locked (by toggle or Shift) - Maintain aspect ratio
          if (isCorner) {
            // Corner resize: scale proportionally from opposite corner
            const deltaX = direction.includes('e') ? dx : -dx;
            const deltaY = direction.includes('s') ? dy : -dy;

            // Use the larger change to determine scale
            const scaleX = (width + deltaX) / width;
            const scaleY = (height + deltaY) / height;
            const scale = Math.abs(scaleX) > Math.abs(scaleY) ? scaleX : scaleY;

            newWidth = Math.max(MIN_SIZE, width * scale);
            newHeight = Math.max(MIN_SIZE, height * scale);

            // Adjust position based on which corner
            if (direction.includes('w')) {
              newX = layerX + (width - newWidth);
            }
            if (direction.includes('n')) {
              newY = layerY + (height - newHeight);
            }
          } else {
            // Edge resize: scale proportionally from center of opposite edge
            if (direction.includes('e')) {
              // Right edge: origin is center of left edge
              newWidth = Math.max(MIN_SIZE, width + dx);
              newHeight = Math.max(MIN_SIZE, newWidth / aspectRatio);
              const leftEdgeCenterY = layerY + height / 2;
              newY = leftEdgeCenterY - newHeight / 2;
            } else if (direction.includes('w')) {
              // Left edge: origin is center of right edge
              newWidth = Math.max(MIN_SIZE, width - dx);
              newHeight = Math.max(MIN_SIZE, newWidth / aspectRatio);
              const rightEdgeCenterY = layerY + height / 2;
              newX = layerX + (width - newWidth);
              newY = rightEdgeCenterY - newHeight / 2;
            } else if (direction.includes('s')) {
              // Bottom edge: origin is center of top edge
              newHeight = Math.max(MIN_SIZE, height + dy);
              newWidth = Math.max(MIN_SIZE, newHeight * aspectRatio);
              const topEdgeCenterX = layerX + width / 2;
              newX = topEdgeCenterX - newWidth / 2;
            } else if (direction.includes('n')) {
              // Top edge: origin is center of bottom edge
              newHeight = Math.max(MIN_SIZE, height - dy);
              newWidth = Math.max(MIN_SIZE, newHeight * aspectRatio);
              const bottomEdgeCenterX = layerX + width / 2;
              newX = bottomEdgeCenterX - newWidth / 2;
              newY = layerY + (height - newHeight);
            }
          }
        } else if (shouldLockAspectRatio && isAltPressed) {
          // CASE 3: Aspect ratio locked + Alt - Center resize with aspect ratio
          if (isCorner) {
            const deltaX = direction.includes('e') ? dx : -dx;
            const deltaY = direction.includes('s') ? dy : -dy;

            const scaleX = (width + deltaX * 2) / width;
            const scaleY = (height + deltaY * 2) / height;
            const scale = Math.abs(scaleX) > Math.abs(scaleY) ? scaleX : scaleY;

            newWidth = Math.max(MIN_SIZE, width * scale);
            newHeight = Math.max(MIN_SIZE, height * scale);
            newX = centerX - newWidth / 2;
            newY = centerY - newHeight / 2;
          } else {
            // Edge with both modifiers: scale proportionally from center
            if (direction.includes('e') || direction.includes('w')) {
              const multiplier = direction.includes('w') ? -1 : 1;
              newWidth = Math.max(MIN_SIZE, width + dx * 2 * multiplier);
              newHeight = Math.max(MIN_SIZE, newWidth / aspectRatio);
              newX = centerX - newWidth / 2;
              newY = centerY - newHeight / 2;
            } else {
              const multiplier = direction.includes('n') ? -1 : 1;
              newHeight = Math.max(MIN_SIZE, height + dy * 2 * multiplier);
              newWidth = Math.max(MIN_SIZE, newHeight * aspectRatio);
              newX = centerX - newWidth / 2;
              newY = centerY - newHeight / 2;
            }
          }
        } else {
          // CASE 4: No modifiers - Normal resize (free resize)
          if (direction.includes('e')) newWidth = Math.max(MIN_SIZE, width + dx);
          if (direction.includes('w')) {
            newWidth = Math.max(MIN_SIZE, width - dx);
            newX = layerX + (width - newWidth);
          }
          if (direction.includes('s')) newHeight = Math.max(MIN_SIZE, height + dy);
          if (direction.includes('n')) {
            newHeight = Math.max(MIN_SIZE, height - dy);
            newY = layerY + (height - newHeight);
          }
        }

        // ========== SNAPPING DETECTION ==========
        const guides: Array<{ type: 'vertical' | 'horizontal'; position: number }> = [];
        let isLeftSnapping = false;
        let isRightSnapping = false;
        let isTopSnapping = false;
        let isBottomSnapping = false;

        if (isSnappingEnabled) {
          const canvasEdges = {
            left: 0,
            right: dimensions.width,
            top: 0,
            bottom: dimensions.height,
            centerX: dimensions.width / 2,
            centerY: dimensions.height / 2,
          };

          const currentRight = newX + newWidth;
          const currentBottom = newY + newHeight;
          const currentCenterX = newX + newWidth / 2;
          const currentCenterY = newY + newHeight / 2;

          // Helper function to check if an edge is within snap threshold and apply snapping
          const snapToEdge = (
            current: number,
            target: number,
            edge: 'left' | 'right' | 'top' | 'bottom'
          ) => {
            if (Math.abs(current - target) < SNAP_THRESHOLD) {
              if (edge === 'left' && direction.includes('w')) {
                const snappedWidth = width + (layerX - target);
                if (snappedWidth >= MIN_SIZE) {
                  newWidth = snappedWidth;
                  newX = target;
                  isLeftSnapping = true;
                }
              } else if (edge === 'right' && direction.includes('e')) {
                const snappedWidth = target - newX;
                if (snappedWidth >= MIN_SIZE) {
                  newWidth = snappedWidth;
                  isRightSnapping = true;
                }
              } else if (edge === 'top' && direction.includes('n')) {
                const snappedHeight = height + (layerY - target);
                if (snappedHeight >= MIN_SIZE) {
                  newHeight = snappedHeight;
                  newY = target;
                  isTopSnapping = true;
                }
              } else if (edge === 'bottom' && direction.includes('s')) {
                const snappedHeight = target - newY;
                if (snappedHeight >= MIN_SIZE) {
                  newHeight = snappedHeight;
                  isBottomSnapping = true;
                }
              }
              return true;
            }
            return false;
          };

          // Snap to canvas edges
          if (snapToEdge(newX, canvasEdges.left, 'left')) {
            guides.push({ type: 'vertical', position: canvasEdges.left });
          }
          if (snapToEdge(currentRight, canvasEdges.right, 'right')) {
            guides.push({ type: 'vertical', position: canvasEdges.right });
          }
          if (snapToEdge(newY, canvasEdges.top, 'top')) {
            guides.push({ type: 'horizontal', position: canvasEdges.top });
          }
          if (snapToEdge(currentBottom, canvasEdges.bottom, 'bottom')) {
            guides.push({ type: 'horizontal', position: canvasEdges.bottom });
          }

          // Add center guide lines (visual only, no snapping)
          if (Math.abs(currentCenterX - canvasEdges.centerX) < SNAP_THRESHOLD) {
            guides.push({ type: 'vertical', position: canvasEdges.centerX });
          }
          if (Math.abs(currentCenterY - canvasEdges.centerY) < SNAP_THRESHOLD) {
            guides.push({ type: 'horizontal', position: canvasEdges.centerY });
          }

          // Snap to other elements
          layers.forEach((layer) => {
            if (layer.id === selectedLayerIds[0]) return;

            const otherConfig = layer.sizeConfig[selectedSize];
            if (!otherConfig) return;

            const otherX = otherConfig.positionX.value;
            const otherY = otherConfig.positionY.value;
            const otherRight = otherX + otherConfig.width.value;
            const otherBottom = otherY + otherConfig.height.value;
            const otherCenterX = otherX + otherConfig.width.value / 2;
            const otherCenterY = otherY + otherConfig.height.value / 2;

            // Vertical snapping (left and right edges)
            if (snapToEdge(newX, otherX, 'left') || snapToEdge(newX, otherRight, 'left')) {
              guides.push({
                type: 'vertical',
                position: snapToEdge(newX, otherX, 'left') ? otherX : otherRight,
              });
            }
            if (
              snapToEdge(currentRight, otherRight, 'right') ||
              snapToEdge(currentRight, otherX, 'right')
            ) {
              guides.push({
                type: 'vertical',
                position: snapToEdge(currentRight, otherRight, 'right') ? otherRight : otherX,
              });
            }

            // Horizontal snapping (top and bottom edges)
            if (snapToEdge(newY, otherY, 'top') || snapToEdge(newY, otherBottom, 'top')) {
              guides.push({
                type: 'horizontal',
                position: snapToEdge(newY, otherY, 'top') ? otherY : otherBottom,
              });
            }
            if (
              snapToEdge(currentBottom, otherBottom, 'bottom') ||
              snapToEdge(currentBottom, otherY, 'bottom')
            ) {
              guides.push({
                type: 'horizontal',
                position: snapToEdge(currentBottom, otherBottom, 'bottom') ? otherBottom : otherY,
              });
            }

            // Center guide lines (visual only)
            if (Math.abs(currentCenterX - otherCenterX) < SNAP_THRESHOLD) {
              guides.push({ type: 'vertical', position: otherCenterX });
            }
            if (Math.abs(currentCenterY - otherCenterY) < SNAP_THRESHOLD) {
              guides.push({ type: 'horizontal', position: otherCenterY });
            }
          });

          // ========== SNAPPING ADJUSTMENTS (Modify dimensions when edges snap) ==========
          // Adjust dimensions after edges snap to maintain modifier key behaviors
          
          if (isAltPressed && !shouldLockAspectRatio) {
            // ADJUSTMENT CASE 1: Alt only (no aspect ratio lock)
            // Maintains center position when an edge snaps (no aspect ratio constraint)
            if (direction.includes('e') && isRightSnapping) {
              const snappedRight = newX + newWidth;
              newWidth = Math.max(MIN_SIZE, 2 * (snappedRight - centerX));
              newX = centerX - newWidth / 2;
            } else if (direction.includes('w') && isLeftSnapping) {
              newWidth = Math.max(MIN_SIZE, 2 * (centerX - newX));
              newX = centerX - newWidth / 2;
            }

            if (direction.includes('s') && isBottomSnapping) {
              const snappedBottom = newY + newHeight;
              newHeight = Math.max(MIN_SIZE, 2 * (snappedBottom - centerY));
              newY = centerY - newHeight / 2;
            } else if (direction.includes('n') && isTopSnapping) {
              newHeight = Math.max(MIN_SIZE, 2 * (centerY - newY));
              newY = centerY - newHeight / 2;
            }
          } else if (isAltPressed && shouldLockAspectRatio && !isShiftPressed) {
            // ADJUSTMENT CASE 2: Alt + aspect ratio locked
            // Maintains center position and aspect ratio when an edge snaps
            // (same behavior as Shift + Alt)
            if (direction.includes('e') && isRightSnapping) {
              const snappedRight = newX + newWidth;
              newWidth = Math.max(MIN_SIZE, 2 * Math.abs(snappedRight - centerX));
              newHeight = Math.max(MIN_SIZE, newWidth / aspectRatio);
              newX = centerX - newWidth / 2;
              newY = centerY - newHeight / 2;
            } else if (direction.includes('w') && isLeftSnapping) {
              newWidth = Math.max(MIN_SIZE, 2 * Math.abs(centerX - newX));
              newHeight = Math.max(MIN_SIZE, newWidth / aspectRatio);
              newX = centerX - newWidth / 2;
              newY = centerY - newHeight / 2;
            }

            if (direction.includes('s') && isBottomSnapping) {
              const snappedBottom = newY + newHeight;
              newHeight = Math.max(MIN_SIZE, 2 * Math.abs(snappedBottom - centerY));
              newWidth = Math.max(MIN_SIZE, newHeight * aspectRatio);
              newX = centerX - newWidth / 2;
              newY = centerY - newHeight / 2;
            } else if (direction.includes('n') && isTopSnapping) {
              newHeight = Math.max(MIN_SIZE, 2 * Math.abs(centerY - newY));
              newWidth = Math.max(MIN_SIZE, newHeight * aspectRatio);
              newX = centerX - newWidth / 2;
              newY = centerY - newHeight / 2;
            }
          } else if ((isShiftPressed || (shouldLockAspectRatio && !isShiftPressed)) && !isAltPressed && !isCorner) {
            // ADJUSTMENT CASE 3: Aspect ratio locked - EDGE resize
            // When an edge snaps, recalculate dimensions to maintain aspect ratio
            // Grows from the opposite edge's center point
            if (direction.includes('e') && isRightSnapping) {
              // Right edge snapped - recalculate from left edge center
              const snappedWidth = newX + newWidth - layerX;
              newWidth = Math.max(MIN_SIZE, snappedWidth);
              newHeight = Math.max(MIN_SIZE, newWidth / aspectRatio);
              const leftEdgeCenterY = layerY + height / 2;
              newY = leftEdgeCenterY - newHeight / 2;
            } else if (direction.includes('w') && isLeftSnapping) {
              // Left edge snapped - recalculate from right edge center
              const snappedWidth = layerX + width - newX;
              newWidth = Math.max(MIN_SIZE, snappedWidth);
              newHeight = Math.max(MIN_SIZE, newWidth / aspectRatio);
              const rightEdgeCenterY = layerY + height / 2;
              newY = rightEdgeCenterY - newHeight / 2;
            } else if (direction.includes('s') && isBottomSnapping) {
              // Bottom edge snapped - recalculate from top edge center
              const snappedHeight = newY + newHeight - layerY;
              newHeight = Math.max(MIN_SIZE, snappedHeight);
              newWidth = Math.max(MIN_SIZE, newHeight * aspectRatio);
              const topEdgeCenterX = layerX + width / 2;
              newX = topEdgeCenterX - newWidth / 2;
            } else if (direction.includes('n') && isTopSnapping) {
              // Top edge snapped - recalculate from bottom edge center
              const snappedHeight = layerY + height - newY;
              newHeight = Math.max(MIN_SIZE, snappedHeight);
              newWidth = Math.max(MIN_SIZE, newHeight * aspectRatio);
              const bottomEdgeCenterX = layerX + width / 2;
              newX = bottomEdgeCenterX - newWidth / 2;
            }
          } else if ((isShiftPressed || (shouldLockAspectRatio && !isShiftPressed)) && !isAltPressed && isCorner) {
            // ADJUSTMENT CASE 4: Aspect ratio locked - CORNER resize
            // When an edge snaps, freeze that dimension and adjust the perpendicular dimension
            // Grows from the opposite corner
            const oppositeCornerX = direction.includes('e') ? layerX : layerX + width;
            const oppositeCornerY = direction.includes('s') ? layerY : layerY + height;

            if (isRightSnapping || isLeftSnapping) {
              // Width is frozen by snap, adjust height to maintain aspect ratio
              const snappedWidth = isRightSnapping
                ? newX + newWidth - oppositeCornerX
                : Math.abs(oppositeCornerX - newX);
              newWidth = Math.max(MIN_SIZE, Math.abs(snappedWidth));
              newHeight = Math.max(MIN_SIZE, newWidth / aspectRatio);

              if (direction.includes('w')) {
                newX = oppositeCornerX - newWidth;
              }
              if (direction.includes('n')) {
                newY = oppositeCornerY - newHeight;
              }
            } else if (isTopSnapping || isBottomSnapping) {
              // Height is frozen by snap, adjust width to maintain aspect ratio
              const snappedHeight = isBottomSnapping
                ? newY + newHeight - oppositeCornerY
                : Math.abs(oppositeCornerY - newY);
              newHeight = Math.max(MIN_SIZE, Math.abs(snappedHeight));
              newWidth = Math.max(MIN_SIZE, newHeight * aspectRatio);

              if (direction.includes('w')) {
                newX = oppositeCornerX - newWidth;
              }
              if (direction.includes('n')) {
                newY = oppositeCornerY - newHeight;
              }
            }
          } else if ((isShiftPressed || (shouldLockAspectRatio && !isShiftPressed)) && isAltPressed) {
            // ADJUSTMENT CASE 5: Aspect ratio locked + Alt (or Shift + Alt)
            // Maintains center position and aspect ratio when an edge snaps
            // Equivalent to Case 2
            if (direction.includes('e') && isRightSnapping) {
              const snappedRight = newX + newWidth;
              newWidth = Math.max(MIN_SIZE, 2 * Math.abs(snappedRight - centerX));
              newHeight = Math.max(MIN_SIZE, newWidth / aspectRatio);
              newX = centerX - newWidth / 2;
              newY = centerY - newHeight / 2;
            } else if (direction.includes('w') && isLeftSnapping) {
              newWidth = Math.max(MIN_SIZE, 2 * Math.abs(centerX - newX));
              newHeight = Math.max(MIN_SIZE, newWidth / aspectRatio);
              newX = centerX - newWidth / 2;
              newY = centerY - newHeight / 2;
            }

            if (direction.includes('s') && isBottomSnapping) {
              const snappedBottom = newY + newHeight;
              newHeight = Math.max(MIN_SIZE, 2 * Math.abs(snappedBottom - centerY));
              newWidth = Math.max(MIN_SIZE, newHeight * aspectRatio);
              newX = centerX - newWidth / 2;
              newY = centerY - newHeight / 2;
            } else if (direction.includes('n') && isTopSnapping) {
              newHeight = Math.max(MIN_SIZE, 2 * Math.abs(centerY - newY));
              newWidth = Math.max(MIN_SIZE, newHeight * aspectRatio);
              newX = centerX - newWidth / 2;
              newY = centerY - newHeight / 2;
            }
          }
        }

        setSnapLines(guides);

        setLayers((prev) =>
          prev.map((layer) => {
            if (layer.id === selectedLayerIds[0]) {
              const config = layer.sizeConfig[selectedSize];
              if (!config) return layer;

              return {
                ...layer,
                sizeConfig: {
                  ...layer.sizeConfig,
                  [selectedSize]: {
                    ...config,
                    positionX: { value: newX, unit: 'px' },
                    positionY: { value: newY, unit: 'px' },
                    width: { value: newWidth, unit: 'px' },
                    height: { value: newHeight, unit: 'px' },
                  },
                },
              };
            }
            return layer;
          })
        );
      } else {
        // Clear snap lines when not dragging or resizing
        setSnapLines([]);
      }
    },
    [
      isDragging,
      isResizing,
      selectedLayerIds,
      layers,
      selectedSize,
      isSnappingEnabled,
      isShiftPressed,
      isAltPressed,
      dimensions,
      setLayers,
    ]
  );

  // ============================================
  // EVENT HANDLERS - CLEANUP
  // ============================================
  
  /** Handler for ending drag or resize operations */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setSnapLines([]);
  }, []);

  /** Handler for mouse leaving the canvas area */
  const handleMouseLeave = useCallback(() => {
    // Only cleanup if not actively dragging or resizing
    // (global listeners will handle those cases)
    if (!isDragging && !isResizing) {
      setSnapLines([]);
    }
  }, [isDragging, isResizing]);

  // ============================================
  // EFFECTS - GLOBAL EVENT LISTENERS
  // ============================================
  
  // Update refs with latest handlers to avoid stale closures
  handleMouseMoveRef.current = handleMouseMove;
  handleMouseUpRef.current = handleMouseUp;

  // Add global mouse listeners during drag/resize to handle fast mouse movements
  // that might escape the canvas bounds
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMouseMoveRef.current?.(e);
    };

    const handleGlobalMouseUp = () => {
      handleMouseUpRef.current?.();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing]);

  // ============================================
  // RETURN
  // ============================================
  
  return {
    isDragging,
    isResizing,
    snapLines,
    handleLayerMouseDown,
    handleResizeMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    setSnapLines,
  };
};
