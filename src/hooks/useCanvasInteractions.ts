import { useState, useRef, useEffect, useCallback } from 'react';
import { type LayerContent, type AdSize } from '../data';
import { HTML5_AD_SIZES } from '../consts';

interface UseCanvasInteractionsProps {
  mode: 'edit' | 'preview';
  layers: LayerContent[];
  selectedLayerId: string | null;
  selectedSize: AdSize;
  isSnappingEnabled: boolean;
  isShiftPressed: boolean;
  isAltPressed: boolean;
  setLayers: React.Dispatch<React.SetStateAction<LayerContent[]>>;
  setSelectedLayerId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useCanvasInteractions = ({
  mode,
  layers,
  selectedLayerId,
  selectedSize,
  isSnappingEnabled,
  isShiftPressed,
  isAltPressed,
  setLayers,
  setSelectedLayerId,
}: UseCanvasInteractionsProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [snapLines, setSnapLines] = useState<
    Array<{ type: 'vertical' | 'horizontal'; position: number }>
  >([]);
  const dragStartRef = useRef({ x: 0, y: 0, layerX: 0, layerY: 0 });
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

  const handleLayerMouseDown = (e: React.MouseEvent, layerId: string) => {
    if (mode !== 'edit') return;

    const target = e.target as HTMLElement;
    if (target.style.cursor && target.style.cursor.includes('resize')) {
      return;
    }

    e.stopPropagation();
    setSelectedLayerId(layerId);

    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const posX = layer.positionX[selectedSize]!;
    const posY = layer.positionY[selectedSize]!;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      layerX: posX.value,
      layerY: posY.value,
    };
  };

  const handleResizeMouseDown = (e: React.MouseEvent, layerId: string, direction: string) => {
    if (mode !== 'edit') return;
    e.preventDefault();
    e.stopPropagation();

    setSelectedLayerId(layerId);

    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const posX = layer.positionX[selectedSize]!;
    const posY = layer.positionY[selectedSize]!;
    const width = layer.width[selectedSize]!;
    const height = layer.height[selectedSize]!;

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
      if (isDragging && selectedLayerId) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;

        const currentLayer = layers.find((l) => l.id === selectedLayerId);
        if (!currentLayer) return;

        const currentWidth = currentLayer.width[selectedSize]!.value;
        const currentHeight = currentLayer.height[selectedSize]!.value;

        let newX = dragStartRef.current.layerX + dx;
        let newY = dragStartRef.current.layerY + dy;

        const guides: Array<{ type: 'vertical' | 'horizontal'; position: number }> = [];

        const canvasEdges = {
          left: 0,
          right: dimensions.width,
          top: 0,
          bottom: dimensions.height,
          centerX: dimensions.width / 2,
          centerY: dimensions.height / 2,
        };

        const currentRight = newX + currentWidth;
        const currentBottom = newY + currentHeight;
        const currentCenterX = newX + currentWidth / 2;
        const currentCenterY = newY + currentHeight / 2;

        if (isSnappingEnabled) {
          // Snap to canvas edges
          if (Math.abs(newX - canvasEdges.left) < SNAP_THRESHOLD) {
            newX = canvasEdges.left;
            guides.push({ type: 'vertical', position: canvasEdges.left });
          }
          if (Math.abs(currentRight - canvasEdges.right) < SNAP_THRESHOLD) {
            newX = canvasEdges.right - currentWidth;
            guides.push({ type: 'vertical', position: canvasEdges.right });
          }
          if (Math.abs(currentCenterX - canvasEdges.centerX) < SNAP_THRESHOLD) {
            newX = canvasEdges.centerX - currentWidth / 2;
            guides.push({ type: 'vertical', position: canvasEdges.centerX });
          }

          if (Math.abs(newY - canvasEdges.top) < SNAP_THRESHOLD) {
            newY = canvasEdges.top;
            guides.push({ type: 'horizontal', position: canvasEdges.top });
          }
          if (Math.abs(currentBottom - canvasEdges.bottom) < SNAP_THRESHOLD) {
            newY = canvasEdges.bottom - currentHeight;
            guides.push({ type: 'horizontal', position: canvasEdges.bottom });
          }
          if (Math.abs(currentCenterY - canvasEdges.centerY) < SNAP_THRESHOLD) {
            newY = canvasEdges.centerY - currentHeight / 2;
            guides.push({ type: 'horizontal', position: canvasEdges.centerY });
          }

          // Snap to other elements
          layers.forEach((layer) => {
            if (layer.id === selectedLayerId) return;

            const otherPosX = layer.positionX[selectedSize];
            const otherPosY = layer.positionY[selectedSize];
            const otherWidth = layer.width[selectedSize];
            const otherHeight = layer.height[selectedSize];

            // Skip if layer doesn't have data for selected size
            if (!otherPosX || !otherPosY || !otherWidth || !otherHeight) return;

            const otherX = otherPosX.value;
            const otherY = otherPosY.value;
            const otherRight = otherX + otherWidth.value;
            const otherBottom = otherY + otherHeight.value;
            const otherCenterX = otherX + otherWidth.value / 2;
            const otherCenterY = otherY + otherHeight.value / 2;

            if (Math.abs(newX - otherX) < SNAP_THRESHOLD) {
              newX = otherX;
              guides.push({ type: 'vertical', position: otherX });
            }
            if (Math.abs(currentRight - otherRight) < SNAP_THRESHOLD) {
              newX = otherRight - currentWidth;
              guides.push({ type: 'vertical', position: otherRight });
            }
            if (Math.abs(newX - otherRight) < SNAP_THRESHOLD) {
              newX = otherRight;
              guides.push({ type: 'vertical', position: otherRight });
            }
            if (Math.abs(currentRight - otherX) < SNAP_THRESHOLD) {
              newX = otherX - currentWidth;
              guides.push({ type: 'vertical', position: otherX });
            }
            if (Math.abs(currentCenterX - otherCenterX) < SNAP_THRESHOLD) {
              newX = otherCenterX - currentWidth / 2;
              guides.push({ type: 'vertical', position: otherCenterX });
            }

            if (Math.abs(newY - otherY) < SNAP_THRESHOLD) {
              newY = otherY;
              guides.push({ type: 'horizontal', position: otherY });
            }
            if (Math.abs(currentBottom - otherBottom) < SNAP_THRESHOLD) {
              newY = otherBottom - currentHeight;
              guides.push({ type: 'horizontal', position: otherBottom });
            }
            if (Math.abs(newY - otherBottom) < SNAP_THRESHOLD) {
              newY = otherBottom;
              guides.push({ type: 'horizontal', position: otherBottom });
            }
            if (Math.abs(currentBottom - otherY) < SNAP_THRESHOLD) {
              newY = otherY - currentHeight;
              guides.push({ type: 'horizontal', position: otherY });
            }
            if (Math.abs(currentCenterY - otherCenterY) < SNAP_THRESHOLD) {
              newY = otherCenterY - currentHeight / 2;
              guides.push({ type: 'horizontal', position: otherCenterY });
            }
          });
        }

        setSnapLines(guides);

        setLayers((prev) =>
          prev.map((layer) => {
            if (layer.id === selectedLayerId) {
              return {
                ...layer,
                positionX: {
                  ...layer.positionX,
                  [selectedSize]: {
                    value: newX,
                    unit: 'px',
                  },
                },
                positionY: {
                  ...layer.positionY,
                  [selectedSize]: {
                    value: newY,
                    unit: 'px',
                  },
                },
              };
            }
            return layer;
          })
        );
      } else if (isResizing && selectedLayerId) {
        const dx = e.clientX - resizeStartRef.current.x;
        const dy = e.clientY - resizeStartRef.current.y;
        const { direction, width, height, layerX, layerY } = resizeStartRef.current;

        const currentLayer = layers.find((l) => l.id === selectedLayerId);
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
        const isCorner = (direction.includes('n') || direction.includes('s')) && 
                        (direction.includes('e') || direction.includes('w'));

        // Calculate initial resize based on modifiers
        if (isAltPressed && !isShiftPressed) {
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
        } else if (isShiftPressed && !isAltPressed) {
          // Shift only: Aspect ratio locked
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
        } else if (isShiftPressed && isAltPressed) {
          // Both: Aspect ratio locked + center resize
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
          // No modifiers: Normal resize (only adjust the edge being dragged)
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

          // Helper to check and apply snapping
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
            if (layer.id === selectedLayerId) return;

            const otherPosX = layer.positionX[selectedSize];
            const otherPosY = layer.positionY[selectedSize];
            const otherWidth = layer.width[selectedSize];
            const otherHeight = layer.height[selectedSize];

            if (!otherPosX || !otherPosY || !otherWidth || !otherHeight) return;

            const otherX = otherPosX.value;
            const otherY = otherPosY.value;
            const otherRight = otherX + otherWidth.value;
            const otherBottom = otherY + otherHeight.value;
            const otherCenterX = otherX + otherWidth.value / 2;
            const otherCenterY = otherY + otherHeight.value / 2;

            // Vertical snapping (left and right edges)
            if (snapToEdge(newX, otherX, 'left') || snapToEdge(newX, otherRight, 'left')) {
              guides.push({ type: 'vertical', position: snapToEdge(newX, otherX, 'left') ? otherX : otherRight });
            }
            if (snapToEdge(currentRight, otherRight, 'right') || snapToEdge(currentRight, otherX, 'right')) {
              guides.push({ type: 'vertical', position: snapToEdge(currentRight, otherRight, 'right') ? otherRight : otherX });
            }

            // Horizontal snapping (top and bottom edges)
            if (snapToEdge(newY, otherY, 'top') || snapToEdge(newY, otherBottom, 'top')) {
              guides.push({ type: 'horizontal', position: snapToEdge(newY, otherY, 'top') ? otherY : otherBottom });
            }
            if (snapToEdge(currentBottom, otherBottom, 'bottom') || snapToEdge(currentBottom, otherY, 'bottom')) {
              guides.push({ type: 'horizontal', position: snapToEdge(currentBottom, otherBottom, 'bottom') ? otherBottom : otherY });
            }

            // Center guide lines (visual only)
            if (Math.abs(currentCenterX - otherCenterX) < SNAP_THRESHOLD) {
              guides.push({ type: 'vertical', position: otherCenterX });
            }
            if (Math.abs(currentCenterY - otherCenterY) < SNAP_THRESHOLD) {
              guides.push({ type: 'horizontal', position: otherCenterY });
            }
          });

          // Handle snapping adjustments based on modifiers
          if (isAltPressed && !isShiftPressed) {
            // Alt only: Maintain center when edge snaps
            if (direction.includes('e') && isRightSnapping) {
              const snappedRight = newX + newWidth;
              newWidth = Math.max(MIN_SIZE, 2 * (snappedRight - centerX));
              newX = centerX - newWidth / 2;
            } else if (direction.includes('w') && isLeftSnapping) {
              newWidth = Math.max(MIN_SIZE, 2 * (centerX - newX));
            }

            if (direction.includes('s') && isBottomSnapping) {
              const snappedBottom = newY + newHeight;
              newHeight = Math.max(MIN_SIZE, 2 * (snappedBottom - centerY));
              newY = centerY - newHeight / 2;
            } else if (direction.includes('n') && isTopSnapping) {
              newHeight = Math.max(MIN_SIZE, 2 * (centerY - newY));
            }
          } else if (isShiftPressed && !isAltPressed && !isCorner) {
            // Shift only (edge resize): When edge snaps, recalculate to maintain aspect ratio from origin
            if (direction.includes('e') && isRightSnapping) {
              // Right edge snapped - recalculate from left edge center
              const snappedWidth = newX + newWidth - layerX;
              newWidth = Math.max(MIN_SIZE, snappedWidth);
              newHeight = Math.max(MIN_SIZE, newWidth / aspectRatio);
              const leftEdgeCenterY = layerY + height / 2;
              newY = leftEdgeCenterY - newHeight / 2;
            } else if (direction.includes('w') && isLeftSnapping) {
              // Left edge snapped - recalculate from right edge center
              const snappedWidth = (layerX + width) - newX;
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
              const snappedHeight = (layerY + height) - newY;
              newHeight = Math.max(MIN_SIZE, snappedHeight);
              newWidth = Math.max(MIN_SIZE, newHeight * aspectRatio);
              const bottomEdgeCenterX = layerX + width / 2;
              newX = bottomEdgeCenterX - newWidth / 2;
            }
          } else if (isShiftPressed && !isAltPressed && isCorner) {
            // Shift only (corner resize): When edge snaps, freeze that dimension and adjust the other
            const oppositeCornerX = direction.includes('e') ? layerX : layerX + width;
            const oppositeCornerY = direction.includes('s') ? layerY : layerY + height;

            if (isRightSnapping || isLeftSnapping) {
              // Width is frozen by snap, adjust height to maintain aspect ratio
              const snappedWidth = isRightSnapping ? (newX + newWidth - oppositeCornerX) : Math.abs(oppositeCornerX - newX);
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
              const snappedHeight = isBottomSnapping ? (newY + newHeight - oppositeCornerY) : Math.abs(oppositeCornerY - newY);
              newHeight = Math.max(MIN_SIZE, Math.abs(snappedHeight));
              newWidth = Math.max(MIN_SIZE, newHeight * aspectRatio);
              
              if (direction.includes('w')) {
                newX = oppositeCornerX - newWidth;
              }
              if (direction.includes('n')) {
                newY = oppositeCornerY - newHeight;
              }
            }
          } else if (isShiftPressed && isAltPressed) {
            // Both modifiers: Maintain center and aspect ratio when edge snaps
            if (direction.includes('e') && isRightSnapping) {
              const snappedRight = newX + newWidth;
              newWidth = Math.max(MIN_SIZE, 2 * (snappedRight - centerX));
              newHeight = Math.max(MIN_SIZE, newWidth / aspectRatio);
              newX = centerX - newWidth / 2;
              newY = centerY - newHeight / 2;
            } else if (direction.includes('w') && isLeftSnapping) {
              newWidth = Math.max(MIN_SIZE, 2 * (centerX - newX));
              newHeight = Math.max(MIN_SIZE, newWidth / aspectRatio);
              newX = centerX - newWidth / 2;
              newY = centerY - newHeight / 2;
            }

            if (direction.includes('s') && isBottomSnapping) {
              const snappedBottom = newY + newHeight;
              newHeight = Math.max(MIN_SIZE, 2 * (snappedBottom - centerY));
              newWidth = Math.max(MIN_SIZE, newHeight * aspectRatio);
              newX = centerX - newWidth / 2;
              newY = centerY - newHeight / 2;
            } else if (direction.includes('n') && isTopSnapping) {
              newHeight = Math.max(MIN_SIZE, 2 * (centerY - newY));
              newWidth = Math.max(MIN_SIZE, newHeight * aspectRatio);
              newX = centerX - newWidth / 2;
              newY = centerY - newHeight / 2;
            }
          }
        }

        setSnapLines(guides);

        setLayers((prev) =>
          prev.map((layer) => {
            if (layer.id === selectedLayerId) {
              return {
                ...layer,
                positionX: {
                  ...layer.positionX,
                  [selectedSize]: { value: newX, unit: 'px' },
                },
                positionY: {
                  ...layer.positionY,
                  [selectedSize]: { value: newY, unit: 'px' },
                },
                width: {
                  ...layer.width,
                  [selectedSize]: { value: newWidth, unit: 'px' },
                },
                height: {
                  ...layer.height,
                  [selectedSize]: { value: newHeight, unit: 'px' },
                },
              };
            }
            return layer;
          })
        );
      } else {
        // Clear snap lines when not dragging or resizing
        if (snapLines.length > 0) {
          setSnapLines([]);
        }
      }
    },
    [
      isDragging,
      isResizing,
      selectedLayerId,
      layers,
      selectedSize,
      isSnappingEnabled,
      isShiftPressed,
      isAltPressed,
      dimensions,
      setLayers,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setSnapLines([]);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Only cleanup if not actively dragging or resizing
    // (global listeners will handle those cases)
    if (!isDragging && !isResizing) {
      setSnapLines([]);
    }
  }, [isDragging, isResizing]);

  // Update refs with latest handlers
  handleMouseMoveRef.current = handleMouseMove;
  handleMouseUpRef.current = handleMouseUp;

  // Add global mouse listeners during drag/resize to handle fast mouse movements
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
