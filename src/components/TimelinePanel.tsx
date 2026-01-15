import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { type LayerContent, type AdSize } from '../data';
import { TIMELINE_COLOR_PAIRS } from '../consts';
import ChevronDownIcon from '../assets/icons/chevron-down.svg?react';
import ChevronUpIcon from '../assets/icons/chevron-up.svg?react';

interface TimelinePanelProps {
  layers: LayerContent[];
  selectedSize: AdSize;
  isOpen: boolean;
  onAnimationChange?: (layerId: string, size: AdSize, animations: import('../data').Animation[]) => void;
}

const TIMELINE_HEIGHT = 300; // Panel height
const BASE_PIXELS_PER_SECOND = 40; // Base scale for timeline
const MIN_ZOOM = 0.25; // 25% zoom (10px per second)
const MAX_ZOOM = 4; // 400% zoom (160px per second)
const ROW_HEIGHT = 40;
const LAYER_NAME_WIDTH = 200;
const MARKER_SIZE = 8; // Size of the 45° rotated square
const ANIMATION_BAR_HEIGHT = 16; // Thinner animation bars

export const TimelinePanel = ({ layers, selectedSize, isOpen, onAnimationChange }: TimelinePanelProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineHeaderScrollRef = useRef<HTMLDivElement>(null);
  const timelineContentScrollRef = useRef<HTMLDivElement>(null);
  const currentHeightRef = useRef(TIMELINE_HEIGHT);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [maxScrollLeft, setMaxScrollLeft] = useState(0);
  const [expandedLayerIds, setExpandedLayerIds] = useState<Set<string>>(
    new Set(layers.map((l) => l.id)) // All expanded by default
  );
  
  const [timelineHeight, setTimelineHeight] = useState(TIMELINE_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringResize, setIsHoveringResize] = useState(false);
  const [tempResizeHeight, setTempResizeHeight] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [loopDuration, setLoopDuration] = useState(5); // Default loop at 5 seconds
  
  const [draggingMarker, setDraggingMarker] = useState<{
    layerId: string;
    animationId: string;
    type: 'start' | 'end' | 'bar';
    initialX: number;
    initialBarLeft?: number;
    initialDelay: number;
    initialDuration: number;
  } | null>(null);
  
  const [hoverTime, setHoverTime] = useState<{ time: number; x: number; y: number } | null>(null);
  const [markerHoverTime, setMarkerHoverTime] = useState<{ time: number; x: number; y: number } | null>(null);
  
  const [editingMarker, setEditingMarker] = useState<{
    layerId: string;
    animationId: string;
    type: 'start' | 'end';
  } | null>(null);
  
  const [editingValue, setEditingValue] = useState<string>('');

  // Handle timeline resize
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    const startY = e.clientY;
    const startHeight = currentHeightRef.current;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newHeight = Math.max(TIMELINE_HEIGHT, Math.min(800, startHeight + deltaY));
      currentHeightRef.current = newHeight;
      setTempResizeHeight(newHeight);
    };

    const handleMouseUp = () => {
      setTimelineHeight(currentHeightRef.current);
      setTempResizeHeight(null);
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [tempResizeHeight]);

  const toggleLayerExpanded = (layerId: string) => {
    setExpandedLayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  // Sync scroll between timeline header and content
  useEffect(() => {
    const scrollContainerEl = scrollContainerRef.current;
    const timelineHeaderEl = timelineHeaderScrollRef.current;
    if (!scrollContainerEl || !timelineHeaderEl) return;

    let isSyncingFromHeader = false;
    let isSyncingFromContent = false;

    const handleContentScroll = () => {
      if (isSyncingFromHeader) return;
      isSyncingFromContent = true;
      
      const scrollLeft = scrollContainerEl.scrollLeft;
      const maxScroll = scrollContainerEl.scrollWidth - scrollContainerEl.clientWidth;
      setScrollLeft(scrollLeft);
      setMaxScrollLeft(maxScroll);
      
      // Sync header scroll
      timelineHeaderEl.scrollLeft = scrollLeft;
      
      requestAnimationFrame(() => {
        isSyncingFromContent = false;
      });
    };

    const handleHeaderScroll = () => {
      if (isSyncingFromContent) return;
      isSyncingFromHeader = true;
      
      const scrollLeft = timelineHeaderEl.scrollLeft;
      const maxScroll = scrollContainerEl.scrollWidth - scrollContainerEl.clientWidth;
      setScrollLeft(scrollLeft);
      setMaxScrollLeft(maxScroll);
      
      // Sync content scroll
      scrollContainerEl.scrollLeft = scrollLeft;
      
      requestAnimationFrame(() => {
        isSyncingFromHeader = false;
      });
    };

    scrollContainerEl.addEventListener('scroll', handleContentScroll);
    timelineHeaderEl.addEventListener('scroll', handleHeaderScroll);
    
    // Initial calculation
    handleContentScroll();
    
    return () => {
      scrollContainerEl.removeEventListener('scroll', handleContentScroll);
      timelineHeaderEl.removeEventListener('scroll', handleHeaderScroll);
    };
  }, []);

  // Convert time value to seconds
  const toSeconds = (timeValue: { value: number; unit: 'ms' | 's' }): number => {
    return timeValue.unit === 's' ? timeValue.value : timeValue.value / 1000;
  };

  // Calculate dynamic values based on zoom and animations
  const PIXELS_PER_SECOND = BASE_PIXELS_PER_SECOND * zoomLevel;
  
  const maxAnimationTime = useMemo(() => {
    let max = 0;
    layers.forEach(layer => {
      const animations = layer.sizeConfig[selectedSize]?.animations || [];
      animations.forEach(animation => {
        const endTime = toSeconds(animation.delay) + toSeconds(animation.duration);
        if (endTime > max) max = endTime;
      });
    });
    return max;
  }, [layers, selectedSize]);

  // Timeline extends intelligently: for short animations, show reasonable length;
  // for longer animations, extend to fit with buffer
  const TIMELINE_DURATION = useMemo(() => {
    const minDuration = 30; // Minimum 30 seconds
    if (maxAnimationTime === 0) return minDuration;
    
    // Add buffer of 20% or at least 5 seconds
    const buffer = Math.max(5, maxAnimationTime * 0.2);
    const withBuffer = maxAnimationTime + buffer;
    
    // Round up to nice number based on size
    if (withBuffer <= 30) return 30;
    if (withBuffer <= 60) return Math.ceil(withBuffer / 5) * 5; // Round to nearest 5
    return Math.ceil(withBuffer / 10) * 10; // Round to nearest 10
  }, [maxAnimationTime]);
  
  // Dynamic marker interval based on zoom level
  const TIME_MARKER_INTERVAL = zoomLevel >= 2 ? 1 : zoomLevel >= 1 ? 2 : zoomLevel >= 0.5 ? 5 : 10;

  // Render time ruler at the top
  const renderTimeRuler = () => {
    const markers = [];
    
    // Main markers with numbers (skip 0 to start at edge)
    for (let i = TIME_MARKER_INTERVAL; i <= TIMELINE_DURATION; i += TIME_MARKER_INTERVAL) {
      markers.push(
        <div
          key={i}
          className="absolute top-0 bottom-0 flex flex-col items-start justify-end"
          style={{ left: `${i * PIXELS_PER_SECOND}px`, transform: 'translateX(-0.5px)' }}
        >
          <span className="text-[10px] text-gray-600 mb-0.5" style={{ transform: 'translateX(-50%)', marginLeft: '0.5px' }}>{i}s</span>
          <div className="h-3 w-px bg-gray-400" />
        </div>
      );
    }
    
    // Smaller tick marks between main markers
    // Calculate sub-interval based on zoom and main interval
    let subDivisions = 1;
    if (zoomLevel >= 2) subDivisions = 4; // 4 ticks between main markers at high zoom
    else if (zoomLevel >= 1) subDivisions = 2; // 2 ticks between main markers
    else if (zoomLevel >= 0.5 && TIME_MARKER_INTERVAL <= 5) subDivisions = 1; // 1 tick at medium zoom
    
    if (subDivisions > 0) {
      const subInterval = TIME_MARKER_INTERVAL / (subDivisions + 1);
      for (let i = subInterval; i < TIMELINE_DURATION; i += subInterval) {
        // Skip if this is already a main marker
        if (Math.abs(i % TIME_MARKER_INTERVAL) > 0.01) {
          markers.push(
            <div
              key={`sub-${i.toFixed(2)}`}
              className="absolute top-0 bottom-0 flex flex-col items-start justify-end"
              style={{ left: `${i * PIXELS_PER_SECOND}px`, transform: 'translateX(-0.5px)' }}
            >
              <div className="h-1.5 w-px bg-gray-400" />
            </div>
          );
        }
      }
    }
    
    // Add red line marker with circle dot for loop duration
    markers.push(
      <div
        key="loop-marker"
        className="absolute top-0 bottom-0 flex flex-col items-center justify-end cursor-pointer group"
        style={{ left: `${loopDuration * PIXELS_PER_SECOND}px` }}
        title={`Loop at ${loopDuration}s`}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 group-hover:bg-red-600 ring-2 ring-white shadow-sm mt-0.5" />
        <div className="h-full w-0.5 bg-red-500 group-hover:bg-red-600" />
      </div>
    );
    
    return markers;
  };

  // Handle marker drag
  const handleMarkerMouseDown = useCallback(
    (e: React.MouseEvent, layerId: string, animationId: string, type: 'start' | 'end' | 'bar') => {
      e.preventDefault();
      e.stopPropagation();
      
      // Find the animation and capture its initial values NOW
      const layer = layers.find((l) => l.id === layerId);
      if (!layer) return;
      
      const animations = layer.sizeConfig[selectedSize]?.animations || [];
      const animation = animations.find((a) => a.id === animationId);
      if (!animation) return;
      
      const initialDelay = toSeconds(animation.delay);
      const initialDuration = toSeconds(animation.duration);
      
      // Get the animation bar element to measure its actual rendered position
      const target = e.currentTarget as HTMLElement;
      const animationBar = target.closest('[data-animation-bar]') as HTMLElement;
      
      if (!animationBar) return;
      
      const barRect = animationBar.getBoundingClientRect();
      
      setDraggingMarker({
        layerId,
        animationId,
        type,
        initialX: e.clientX,
        initialBarLeft: barRect.left,
        initialDelay,
        initialDuration,
      });
    },
    [layers, selectedSize]
  );

  useEffect(() => {
    if (!draggingMarker || !onAnimationChange) return;

    // Use the captured initial values from the state, not from the layers
    const initialDelay = draggingMarker.initialDelay;
    const initialDuration = draggingMarker.initialDuration;
    
    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      // Cancel any pending animation frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      // Use requestAnimationFrame for smoother updates
      rafId = requestAnimationFrame(() => {
        // Calculate actual mouse movement in screen pixels
        const mousePixelDelta = e.clientX - draggingMarker.initialX;
        
        // Convert to timeline pixels (1:1 with mouse movement)
        const timelinePixelDelta = mousePixelDelta;
        const deltaTime = timelinePixelDelta / PIXELS_PER_SECOND;

        let newDelay = initialDelay;
        let newDuration = initialDuration;

        if (draggingMarker.type === 'bar') {
          // Moving entire bar: adjust delay only, keep duration the same
          const proposedDelay = initialDelay + deltaTime;
          newDelay = Math.max(0, proposedDelay);
          newDuration = initialDuration;
        } else if (draggingMarker.type === 'start') {
          // Moving start marker: adjust delay, keeping end point fixed
          const proposedDelay = initialDelay + deltaTime;
          const proposedDuration = initialDuration - deltaTime;
          
          // Constrain so delay >= 0 and duration >= 0.1
          if (proposedDelay >= 0 && proposedDuration >= 0.1) {
            newDelay = proposedDelay;
            newDuration = proposedDuration;
          } else if (proposedDelay < 0) {
            // Hit left boundary
            newDelay = 0;
            newDuration = initialDelay + initialDuration;
          } else {
            // Hit right boundary
            newDelay = initialDelay + initialDuration - 0.1;
            newDuration = 0.1;
          }
        } else {
          // Moving end marker: adjust duration only (delay stays fixed)
          const proposedDuration = initialDuration + deltaTime;
          newDuration = Math.max(0.1, proposedDuration);
        }

        // Snap to 2 decimal places
        newDelay = Math.round(newDelay * 100) / 100;
        newDuration = Math.round(newDuration * 100) / 100;

        // Show hover time tooltip
        const timeValue = draggingMarker.type === 'bar' 
          ? newDelay 
          : draggingMarker.type === 'start' 
          ? newDelay 
          : newDelay + newDuration;
        setHoverTime({ time: timeValue, x: e.clientX, y: e.clientY });

        // Get the current animations array
        const layer = layers.find((l) => l.id === draggingMarker.layerId);
        if (!layer) return;
        const animations = layer.sizeConfig[selectedSize]?.animations || [];

        // Update animation
        const updatedAnimations = animations.map((a) =>
          a.id === draggingMarker.animationId
            ? { ...a, delay: { value: newDelay, unit: 's' as const }, duration: { value: newDuration, unit: 's' as const } }
            : a
        );

        onAnimationChange(draggingMarker.layerId, selectedSize, updatedAnimations);
      });
    };

    const handleMouseUp = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      setDraggingMarker(null);
      setHoverTime(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingMarker, layers, selectedSize, onAnimationChange]);

  // Render a single animation bar
  const renderAnimationBar = (
    animation: import('../data').Animation,
    layerId: string,
    animationIndex: number,
    layerIndex: number
  ) => {
    const delay = toSeconds(animation.delay);
    const duration = toSeconds(animation.duration);
    const startX = delay * PIXELS_PER_SECOND;
    const width = duration * PIXELS_PER_SECOND;
    
    // Get color pair based on layer index
    const colorPair = TIMELINE_COLOR_PAIRS[layerIndex % TIMELINE_COLOR_PAIRS.length];

    return (
      <div
        key={`${layerId}-${animation.id}-${animationIndex}`}
        className="absolute flex items-center pointer-events-none"
        data-animation-bar
        style={{
          left: `${startX}px`,
          width: `${width}px`,
          height: `${ANIMATION_BAR_HEIGHT}px`,
          top: `${(ROW_HEIGHT - ANIMATION_BAR_HEIGHT) / 2}px`,
        }}
      >
        {/* Start marker (rotated square) */}
        <div className="absolute pointer-events-auto" style={{ left: `-${MARKER_SIZE / 2}px`, top: '50%', marginTop: `-${MARKER_SIZE / 2}px`, zIndex: 20 }}>
          <div
            className="transform rotate-45 cursor-ew-resize"
            style={{
              width: `${MARKER_SIZE}px`,
              height: `${MARKER_SIZE}px`,
              backgroundColor: colorPair.marker,
            }}
            onMouseDown={(e) => handleMarkerMouseDown(e, layerId, animation.id!, 'start')}
            onMouseEnter={(e) => {
              setMarkerHoverTime({ time: delay, x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => setMarkerHoverTime(null)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingMarker({ layerId, animationId: animation.id!, type: 'start' });
              setEditingValue(toSeconds(animation.delay).toFixed(2));
            }}
          />
          {editingMarker?.layerId === layerId && editingMarker?.animationId === animation.id && editingMarker?.type === 'start' ? (
            <input
              type="number"
              autoFocus
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={() => {
                const newDelay = Math.max(0, parseFloat(editingValue) || 0);
                const snappedDelay = Math.round(newDelay * 100) / 100;
                const animations = layers.find(l => l.id === layerId)?.sizeConfig[selectedSize]?.animations || [];
                const updatedAnimations = animations.map((a) =>
                  a.id === animation.id
                    ? { ...a, delay: { value: snappedDelay, unit: 's' as const } }
                    : a
                );
                onAnimationChange?.(layerId, selectedSize, updatedAnimations);
                setEditingMarker(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const newDelay = Math.max(0, parseFloat(editingValue) || 0);
                  const snappedDelay = Math.round(newDelay * 100) / 100;
                  const animations = layers.find(l => l.id === layerId)?.sizeConfig[selectedSize]?.animations || [];
                  const updatedAnimations = animations.map((a) =>
                    a.id === animation.id
                      ? { ...a, delay: { value: snappedDelay, unit: 's' as const } }
                      : a
                  );
                  onAnimationChange?.(layerId, selectedSize, updatedAnimations);
                  setEditingMarker(null);
                } else if (e.key === 'Escape') {
                  setEditingMarker(null);
                }
              }}
              onFocus={(e) => e.target.select()}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute left-0 top-6 w-16 px-1 py-0.5 text-[10px] border border-blue-500 rounded shadow-lg bg-white pointer-events-auto"
              style={{ zIndex: 100 }}
              step="0.01"
              min="0"
            />
          ) : null}
        </div>

        {/* Duration bar */}
        <div
          className="w-full h-full border-t border-b rounded pointer-events-auto cursor-move"
          style={{
            backgroundColor: colorPair.fill + '66', // 40% opacity
            borderColor: colorPair.fill,
          }}
          onMouseDown={(e) => handleMarkerMouseDown(e, layerId, animation.id!, 'bar')}
        />

        {/* End marker (rotated square) */}
        <div className="absolute pointer-events-auto" style={{ right: `-${MARKER_SIZE / 2}px`, top: '50%', marginTop: `-${MARKER_SIZE / 2}px`, zIndex: 20 }}>
          <div
            className="transform rotate-45 cursor-ew-resize"
            style={{
              width: `${MARKER_SIZE}px`,
              height: `${MARKER_SIZE}px`,
              backgroundColor: colorPair.marker,
            }}
            onMouseDown={(e) => handleMarkerMouseDown(e, layerId, animation.id!, 'end')}
            onMouseEnter={(e) => {
              setMarkerHoverTime({ time: delay + duration, x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => setMarkerHoverTime(null)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingMarker({ layerId, animationId: animation.id!, type: 'end' });
              setEditingValue((toSeconds(animation.delay) + toSeconds(animation.duration)).toFixed(2));
            }}
          />
          {editingMarker?.layerId === layerId && editingMarker?.animationId === animation.id && editingMarker?.type === 'end' ? (
            <input
              type="number"
              autoFocus
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={() => {
                const newEndTime = Math.max(0.1, parseFloat(editingValue) || 0.1);
                const snappedEndTime = Math.round(newEndTime * 100) / 100;
                const delay = toSeconds(animation.delay);
                const newDuration = Math.max(0.1, snappedEndTime - delay);
                const snappedDuration = Math.round(newDuration * 100) / 100;
                const animations = layers.find(l => l.id === layerId)?.sizeConfig[selectedSize]?.animations || [];
                const updatedAnimations = animations.map((a) =>
                  a.id === animation.id
                    ? { ...a, duration: { value: snappedDuration, unit: 's' as const } }
                    : a
                );
                onAnimationChange?.(layerId, selectedSize, updatedAnimations);
                setEditingMarker(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const newEndTime = Math.max(0.1, parseFloat(editingValue) || 0.1);
                  const snappedEndTime = Math.round(newEndTime * 100) / 100;
                  const delay = toSeconds(animation.delay);
                  const newDuration = Math.max(0.1, snappedEndTime - delay);
                  const snappedDuration = Math.round(newDuration * 100) / 100;
                  const animations = layers.find(l => l.id === layerId)?.sizeConfig[selectedSize]?.animations || [];
                  const updatedAnimations = animations.map((a) =>
                    a.id === animation.id
                      ? { ...a, duration: { value: snappedDuration, unit: 's' as const } }
                      : a
                  );
                  onAnimationChange?.(layerId, selectedSize, updatedAnimations);
                  setEditingMarker(null);
                } else if (e.key === 'Escape') {
                  setEditingMarker(null);
                }
              }}
              onFocus={(e) => e.target.select()}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute right-0 top-6 w-16 px-1 py-0.5 text-[10px] border border-blue-500 rounded shadow-lg bg-white pointer-events-auto"
              style={{ zIndex: 100 }}
              step="0.01"
              min="0.1"
            />
          ) : null}
        </div>

        {/* Animation name label */}
        {width > 60 ? (
          <span className="absolute left-2 text-[10px] text-gray-700 font-medium truncate max-w-full px-1">
            {animation.name}
          </span>
        ) : null}
      </div>
    );
  };

  // Render layer names column (fixed, doesn't scroll horizontally)
  const renderLayerColumn = (layer: LayerContent, layerIndex: number) => {
    const config = layer.sizeConfig[selectedSize];
    const animations = config?.animations || [];
    const isExpanded = expandedLayerIds.has(layer.id);
    const hasAnimations = animations.length > 0;

    return (
      <div key={layer.id}>
        {/* Layer header */}
        <div
          className="flex items-center border-b border-gray-300"
          style={{ height: `${ROW_HEIGHT}px` }}
        >
          <div className="flex items-center px-3 w-full" style={{ height: '100%' }}>
            {hasAnimations ? (
              <button
                onClick={() => toggleLayerExpanded(layer.id)}
                className="mr-2 p-0.5 hover:bg-gray-200 rounded cursor-pointer transition-colors"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-3 h-3 text-gray-600" />
                ) : (
                  <ChevronUpIcon className="w-3 h-3 text-gray-600 rotate-90" />
                )}
              </button>
            ) : (
              <div className="w-4 mr-2" />
            )}
            <span className="text-sm text-gray-900 font-medium truncate">{layer.label}</span>
            {hasAnimations ? (
              <span className="ml-auto text-[10px] text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                {animations.length}
              </span>
            ) : null}
          </div>
        </div>

        {/* Animation name rows (if expanded) */}
        {isExpanded && hasAnimations
          ? animations.map((animation, animIndex) => (
              <div
                key={`${layer.id}-animation-${animIndex}`}
                className="flex items-center border-b border-gray-200"
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                <div className="flex items-center px-3 pl-8 w-full" style={{ height: '100%' }}>
                  <span className="text-xs text-gray-700 truncate">
                    {animation.name} <span className="text-gray-500">({animation.type})</span>
                  </span>
                </div>
              </div>
            ))
          : null}
      </div>
    );
  };

  // Render timeline content (scrollable horizontally)
  const renderTimelineContent = (layer: LayerContent, layerIndex: number) => {
    const config = layer.sizeConfig[selectedSize];
    const animations = config?.animations || [];
    const isExpanded = expandedLayerIds.has(layer.id);
    const hasAnimations = animations.length > 0;

    return (
      <div key={layer.id}>
        {/* Layer timeline row */}
        <div
          className="relative bg-white border-b border-gray-300"
          style={{ height: `${ROW_HEIGHT}px` }}
        >
          {/* Grid lines - match ruler markers exactly */}
          {(() => {
            const lines = [];
            for (let i = TIME_MARKER_INTERVAL; i <= TIMELINE_DURATION; i += TIME_MARKER_INTERVAL) {
              lines.push(
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-gray-200"
                  style={{ left: `${i * PIXELS_PER_SECOND}px` }}
                />
              );
            }
            return lines;
          })()}
        </div>

        {/* Animation timeline rows (if expanded) */}
        {isExpanded && hasAnimations
          ? animations.map((animation, animIndex) => (
              <div
                key={`${layer.id}-animation-${animIndex}`}
                className="relative bg-white border-b border-gray-200"
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                {/* Grid lines - match ruler markers exactly */}
                {(() => {
                  const lines = [];
                  for (let i = TIME_MARKER_INTERVAL; i <= TIMELINE_DURATION; i += TIME_MARKER_INTERVAL) {
                    lines.push(
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 w-px bg-gray-200"
                        style={{ left: `${i * PIXELS_PER_SECOND}px` }}
                      />
                    );
                  }
                  return lines;
                })()}
                {renderAnimationBar(animation, layer.id, animIndex, layerIndex)}
              </div>
            ))
          : null}
      </div>
    );
  };

  return (
    <div
      ref={timelineRef}
      className={`bg-white shadow-lg transition-all duration-300 ease-in-out overflow-hidden relative ${
        isOpen ? '' : 'h-0'
      }`}
      style={{ 
        height: isOpen ? `${tempResizeHeight !== null ? tempResizeHeight : timelineHeight}px` : '0',
        transition: tempResizeHeight !== null ? 'none' : undefined
      }}
    >
      {/* Resize handle - thin bar at the very top */}
      {isOpen ? (
        <div
          className={`absolute top-0 left-0 right-0 z-50 cursor-ns-resize transition-colors ${
            isResizing || isHoveringResize ? 'bg-blue-500 h-1' : 'bg-transparent hover:bg-gray-300 h-1'
          }`}
          onMouseDown={handleResizeMouseDown}
          onMouseEnter={() => setIsHoveringResize(true)}
          onMouseLeave={() => !isResizing && setIsHoveringResize(false)}
        />
      ) : null}
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-stretch border-b border-gray-300 bg-gray-100" style={{ height: '32px' }}>
          {/* Fixed left section with label and zoom controls */}
          <div
            className="flex items-center justify-between px-3 bg-gray-100 z-30 relative flex-shrink-0"
            style={{ width: `${LAYER_NAME_WIDTH}px` }}
          >
            <span className="text-xs font-semibold text-gray-700">Timeline</span>
            {/* Zoom slider */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500">−</span>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.25}
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-16 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                title={`Zoom: ${Math.round(zoomLevel * 100)}%`}
              />
              <span className="text-[10px] text-gray-500">+</span>
            </div>
            {/* Border line that doesn't affect width */}
            <div className="absolute top-0 bottom-0 right-0 w-px bg-gray-300" />
          </div>
          {/* Scrollable timeline header */}
          <div className="flex-1 relative overflow-hidden">
            <div 
              ref={timelineHeaderScrollRef}
              className="overflow-x-auto overflow-y-hidden" 
              style={{ 
                height: '32px', 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
              }}
            >
              <style>{`
                div:has(> .timeline-ruler-container)::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div className="relative timeline-ruler-container" style={{ height: '32px', width: `${TIMELINE_DURATION * PIXELS_PER_SECOND}px` }}>
                {renderTimeRuler()}
              </div>
            </div>
            {/* Left fade overlay */}
            {scrollLeft > 0 ? (
              <div className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none z-10" style={{ background: 'linear-gradient(to right, rgb(243 244 246) 0%, transparent 100%)' }} />
            ) : null}
            {/* Right fade overlay */}
            {scrollLeft < maxScrollLeft - 1 ? (
              <div className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none z-10" style={{ background: 'linear-gradient(to left, rgb(243 244 246) 0%, transparent 100%)' }} />
            ) : null}
          </div>
        </div>

        {/* Scrollable content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto">
          <div className="flex">
            {/* Fixed layer names column */}
            <div className="flex-shrink-0 bg-gray-50 sticky left-0 z-30 relative" style={{ width: `${LAYER_NAME_WIDTH}px` }}>
              {layers.map((layer, index) => renderLayerColumn(layer, index))}
              {/* Border line that doesn't affect width */}
              <div className="absolute top-0 bottom-0 right-0 w-px bg-gray-300" />
            </div>
            {/* Scrollable timeline content */}
            <div 
              ref={timelineContentScrollRef}
              className="flex-shrink-0 relative z-10"
              style={{ width: `${TIMELINE_DURATION * PIXELS_PER_SECOND}px` }}
            >
              {layers.map((layer, index) => renderTimelineContent(layer, index))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tooltip for dragging markers */}
      {hoverTime ? (
        <div
          className="fixed bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-50"
          style={{
            left: `${hoverTime.x + 10}px`,
            top: `${hoverTime.y - 30}px`,
          }}
        >
          {hoverTime.time.toFixed(2)}s
        </div>
      ) : null}
      
      {/* Tooltip for hovering over markers */}
      {markerHoverTime ? (
        <div
          className="fixed bg-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-50"
          style={{
            left: `${markerHoverTime.x + 10}px`,
            top: `${markerHoverTime.y - 30}px`,
          }}
        >
          {markerHoverTime.time.toFixed(2)}s
        </div>
      ) : null}
    </div>
  );
};
