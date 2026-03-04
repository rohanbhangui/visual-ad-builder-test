# Visual Ad Builder — Product Specification

## Overview

A browser-based visual editor for building HTML5 display ads across multiple standard sizes simultaneously. Each ad size maintains its own independent layer positioning, sizing, animations, and typography while sharing global layer content and styles. The project is a React + TypeScript + Vite + Tailwind CSS application using Zustand for state management with zundo for undo/redo history.

Demo: https://visual-ad-builder-test.vercel.app/

---

## File / Component Map

Quick reference for navigating the codebase:

| File | Role |
|---|---|
| `src/App.tsx` | Root component; all handler wiring, keyboard shortcuts, add/delete/reorder/copy layer logic, zoom/pan logic, export generation |
| `src/store/useStore.ts` | Zustand store definition; `HistoricalState` + `EphemeralState`; `commitZoom`, `commitPan`, `pauseHistory`, `resumeHistory` |
| `src/hooks/useCanvasInteractions.ts` | All canvas drag/resize/snap logic; local state (`isDragging`, `isResizing`, `snapLines`, `tempLayerUpdates`); exposes handlers to `App.tsx` |
| `src/data.ts` | All TypeScript interfaces (`Canvas`, `BaseLayer`, all layer types, `SizeConfig`, `Animation`); `sampleCanvas` initial data; `HTML5_AD_SIZES` |
| `src/consts.ts` | All UI constants (`TOP_BAR_HEIGHT`, font lists, character limits, colour values, `HTML5_AD_SIZES` mirror, etc.) |
| `src/components/Canvas.tsx` | Canvas edit + preview rendering; preview HTML generation; layer element generation; snap line rendering; `React.memo` wrapped |
| `src/components/TopBar.tsx` | Top bar with title, size selector (conditional), undo/redo, mode toggle, export, settings |
| `src/components/LayersPanel.tsx` | Floating layers panel; drag-to-reorder; add layer menu; lock toggles |
| `src/components/PropertySidebar/index.tsx` | Right sidebar; no-selection canvas settings; single/multi-select property views |
| `src/components/PropertySidebar/PropertyTab/ButtonLayerFields.tsx` | Button-specific property fields including video control target/action wiring |
| `src/components/PropertySidebar/PropertyTab/PropertyTab.tsx` | Per-type property field dispatcher |
| `src/components/PropertySidebar/AnimationTab/AnimationTab.tsx` | Per-size animation list; add/edit/delete animation rows |
| `src/components/TimelinePanel.tsx` | Advanced animation timeline; drag handles; ruler |
| `src/components/ZoomControls.tsx` | Zoom %, +/−, reset, snapping toggle, timeline toggle |
| `src/components/SizeSelector.tsx` | Thumbnail size switcher row (shown when `adSelectorPosition === 'bottom'`) |
| `src/components/AddEditAnimationModal.tsx` | Modal for creating/editing a single animation |
| `src/components/ExportHTMLModal.tsx` | Full-screen modal with exported HTML textarea + copy button |
| `src/components/SettingsModal.tsx` | App settings modal (ad selector position, animation mode) |
| `src/components/Label/Label.tsx` | Sidebar label with optional amber size-specific badge and "Copy to" popover |
| `src/components/inputs/` | Reusable inputs: `ColorInput`, `CornersInput`, `DebouncedInput`, `PositionSizeInput`, `UrlInput` |
| `src/utils/exportHTML.ts` | `generateHTML()` function; keyframe + initial-state generation; CSS reset; script injection |
| `src/utils/googleFonts.ts` | `getGoogleFontsLink()` for export; `loadGoogleFonts()` for live editor |

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v3 + PostCSS |
| State | Zustand |
| Undo/Redo | zundo (temporal middleware) |
| Fonts | Google Fonts (dynamic injection) |
| Icons | SVG files imported as React components (`?react`) |

---

## Data Model

### Ad Sizes

Defined in `consts.ts` as `HTML5_AD_SIZES`. Supported sizes:

| Key | Dimensions | Name |
|---|---|---|
| `728x90` | 728×90 | Leaderboard |
| `336x280` | 336×280 | Large Rectangle |
| `300x250` | 300×250 | Medium Rectangle |
| `970x90` | 970×90 | Large Leaderboard |
| `120x600` | 120×600 | Skyscraper |
| `160x600` | 160×600 | Wide Skyscraper |
| `300x600` | 300×600 | Half Page |
| `320x50` | 320×50 | Mobile Banner |
| `250x250` | 250×250 | Square |

The canvas holds an `allowedSizes` array that defines which sizes are active for the current document.

### Canvas

```ts
interface Canvas {
  id: string;
  name: string;
  allowedSizes: AdSize[];
  layers: LayerContent[];
  styles?: { backgroundColor?: string };
  animationLoop?: number; // 0 = no loop, -1 = infinite, >0 = loop N times
  createdAt: Date;
  updatedAt: Date;
}
```

### Layers

All layers extend `BaseLayer`:

```ts
interface BaseLayer {
  id: string;
  label: string;
  locked: boolean;
  aspectRatioLocked?: boolean;
  attributes: { id?: string }; // HTML id override for export
  sizeConfig: Partial<Record<AdSize, SizeConfig>>;
}
```

Full layer interfaces (from `src/data.ts`):

```ts
interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  styles: { backgroundColor?: string; color?: string; fontSize?: string; fontFamily?: FontFamily; opacity: number };
}

interface RichtextLayer extends BaseLayer {
  type: 'richtext';
  content: string; // HTML string — supports bold/italic/underline inline tags
  styles: { backgroundColor?: string; color?: string; fontSize?: string; fontFamily?: FontFamily; opacity: number };
}

interface ImageLayer extends BaseLayer {
  type: 'image';
  url: string;
  styles: { backgroundColor?: string; color?: string; objectFit?: string; opacity: number };
}

interface VideoLayer extends BaseLayer {
  type: 'video';
  url: string;
  properties?: { autoplay?: boolean; controls?: boolean };
  styles: { backgroundColor?: string; color?: string; opacity: number };
}

interface ButtonLayer extends BaseLayer {
  type: 'button';
  text: string;
  actionType: 'link' | 'videoControl';
  url: string; // used when actionType === 'link'
  videoControl?: { targetElementId: string; action: 'play' | 'pause' | 'restart' | 'togglePlayPause' };
  icon?: {
    type: 'none' | 'play' | 'pause' | 'replay' | 'play-fill' | 'pause-fill' | 'custom'
         | 'toggle-filled' | 'toggle-outline' | 'toggle-custom';
    customImage?: string;       // single custom icon URL
    customPlayImage?: string;   // toggle-custom: play state image URL
    customPauseImage?: string;  // toggle-custom: pause state image URL
    color?: string;             // tint colour for SVG icons
    position?: 'before' | 'after'; // relative to button text
  };
  styles: { backgroundColor?: string; color?: string; fontFamily?: FontFamily; opacity: number };
}
```

### SizeConfig (per-layer, per-size)

```ts
interface SizeConfig {
  positionX: Size;           // { value, unit: 'px' | '%' }
  positionY: Size;
  width: Size;
  height: Size;
  fontSize?: string;         // e.g. '14px'
  textAlign?: 'left' | 'center' | 'right';
  iconSize?: number;         // pixels, for button layers
  borderRadius?: number | { topLeft, topRight, bottomRight, bottomLeft }; // px
  animations?: Animation[];
  animationLoopDelay?: { value: number; unit: 'ms' | 's' };
  animationResetDuration?: { value: number; unit: 'ms' | 's' };
}
```

Positions and sizes can be expressed as `px` or `%`. Internally the editor works in `px` and converts when needed.

### Animations

```ts
interface Animation {
  id: string;
  name: string;
  type: 'fadeIn' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown' | 'scale' | 'custom';
  property?: 'opacity' | 'x' | 'y' | 'width' | 'height' | 'scale' | 'color' | 'backgroundColor';
  from?: string | { value: number; unit: string };
  to?: string | { value: number; unit: string };
  duration: { value: number; unit: 'ms' | 's' };
  delay: { value: number; unit: 'ms' | 's' };
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  repeat?: number; // 0 = no repeat, -1 = infinite
}
```

Animations are **per-size**: each `SizeConfig` holds its own independent animation list. Timing values support both `ms` and `s`.

---

## Application State (Zustand Store)

State is split into two categories:

### Historical State (tracked by undo/redo)

| Field | Type | Notes |
|---|---|---|
| `layers` | `LayerContent[]` | All layer data |
| `canvasName` | `string` | Document name |
| `canvasBackgroundColor` | `string` | Hex color |
| `animationLoop` | `number` | -1 infinite, 0 once, >0 N times |
| `selectedSize` | `AdSize` | Currently active size |
| `selectedLayerIds` | `string[]` | Multi-select layer IDs |
| `activePropertyTab` | `'properties' \| 'animations'` | Sidebar tab |
| `isTimelinePanelOpen` | `boolean` | Timeline panel open/closed |
| `zoom` | `number` | Final committed zoom level |
| `pan` | `{ x, y }` | Final committed pan offset |

### Ephemeral State (not tracked)

| Field | Notes |
|---|---|
| `mode` | `'edit' \| 'preview'` |
| `animationMode` | `'basic' \| 'advanced' \| 'both'` |
| `isPanning` | Whether space+drag pan is active |
| `isSnappingEnabled` | Toggle snapping guides |
| `isClippingEnabled` | Clip canvas to show overflow |
| `isExportModalOpen` | Export HTML modal |
| `isSettingsModalOpen` | App settings modal |
| `adSelectorPosition` | `'top' \| 'bottom'` |
| `exportedHTML` | Last generated HTML string |
| `animationKey` | Incremented to replay animations |
| `draggedLayerIndex / dragOverLayerIndex` | DnD reorder state |
| `layersPanelPos / layersPanelSide / isLayersPanelCollapsed / isLayersPanelDragging` | Floating panel state |

### Hook-Local State (`useCanvasInteractions`)

This state lives **inside the hook** (React `useState`/`useRef`) and is **not** in the Zustand store. It is not undo-able and not persisted:

| Field | Type | Notes |
|---|---|---|
| `isDragging` | `boolean` | True while a layer drag is in progress |
| `isResizing` | `boolean` | True while a layer resize is in progress |
| `tempLayerUpdates` | `LayerContent[]` | Shadow copy of layers during drag/resize; `Canvas` reads from this instead of the store |
| `snapLines` | `Array<{type, position}>` | Active snap guide lines to render |
| `dragStartRef` | ref | Stores mouse start position + initial layer positions at drag start |
| `resizeStartRef` | ref | Stores mouse start + original dimensions at resize start |
| `rafIdRef` | ref | `requestAnimationFrame` ID for throttling mousemove |
| `isDraggingRef` / `isResizingRef` | refs | Mirror of state for use inside event handlers (avoids stale closure) |
| `handleMouseMoveRef` / `handleMouseUpRef` | refs | Latest handler refs for `document` global listeners |

### Undo/Redo (zundo)

- Uses `temporal` middleware from zundo
- History records all changes to tracked state above
- `zoom` and `pan` use separate `setZoom`/`setPan` (during interaction, not tracked) and `commitZoom`/`commitPan` (on interaction end, tracked) to avoid flooding history
- Drag and resize operations call `pauseHistory()` at start and `resumeHistory()` at end, so the entire drag is a single undo step
- History is cleared on initial load (100ms timeout) to avoid an initial empty undo entry

---

## Components

### `App.tsx`

Root component. Owns all event handler wiring. Handles:
- Keyboard shortcuts
- Layer CRUD (add, delete, reorder, lock/unlock, copy properties)
- Canvas viewport interactions (zoom, pan)
- All sidebar property change callbacks
- Layers panel drag-to-reorder and floating panel drag
- Export HTML generation and modal open

### `TopBar`

Fixed 56px header bar. Contains:
- App title ("Visual Builder")
- Ad size dropdown — only rendered when `adSelectorPosition === 'top'` (controlled by Settings). Shows aspect-ratio preview box, common name, and pixel dimensions. Active size highlighted in blue
- Undo / Redo buttons (disabled state when unavailable)
- Edit / Preview mode toggle
- Export HTML button
- Settings button (gear icon)

### `Canvas`

The central editing surface. Renders layers as absolutely-positioned DOM elements inside a scaled/translated wrapper. Two modes:

**Edit mode:**
- Layers render as absolutely-positioned DOM elements inside a scaled/translated wrapper
- Canvas wrapper uses `transform: translate3d(pan.x, pan.y, 0) scale(zoom)` with `transformOrigin: center center`, `transition: none`, and `willChange: transform` for GPU compositing
- Each layer wrapper applies `contain: layout style paint` for paint isolation
- Selected layer(s) get `willChange: transform, top, left` hinted for the GPU during drag
- Selected layer(s) get a unified bounding-box outline: `2/zoom px solid #2563eb`, offset `-2/zoom px` inward (keeps 1 visual pixel at any zoom)
- Resize handles (single-selection only): 4 corner circles (`12/zoom px`, white, rounded, `2/zoom px` blue border) + 4 edge invisible zones (`8/zoom px`)
- Layer hover effect: non-selected, non-locked, non-panning layers get `outline: 2px solid rgba(59,130,246,0.5)` on `mouseenter`; cleared on `mouseleave` and on `mousedown` (which clears all `[data-layer-hover]` elements first)
- Snap guide lines: visually 1px (`1/zoom px` width), red `#ef4444`, z-index 9999, rendered **outside** the clipping container so they always show
- Clipping: inner `div` with `overflow: hidden | visible` wraps layer content; snap lines are outside this div
- Text/richtext content wrapper gets `overflow: hidden`; a layer with `borderRadius` gets `overflow: hidden` on its outer element
- Video: on `loadedMetadata`, sets `currentTime = 0.1` and pauses to show the first frame in the editor
- Toggle icons (`toggle-filled`, `toggle-outline`, `toggle-custom`) always show the **play** state in edit mode (not tied to real video playback state)
- Locked layers: `pointerEvents: none`, `cursor: default`
- Clicking canvas background clears selection (`setSelectedLayerIds([])`); clicking the Canvas Settings button also clears selection
- Canvas settings button is inverse-scaled (`scale(1/zoom)`) so it stays at a fixed visual size and position regardless of zoom
- Canvas background area (`data-canvas-container`) is `#d4d4d4`
- `Canvas` is wrapped in `React.memo`; `PropertySidebar` is also wrapped in `memo`

**Preview mode:**
- Renders the canvas as an `<iframe key={animationKey}>` — the `key` forces a full unmount/remount to replay animations
- `srcDoc` is the generated HTML string (same logic as export)
- Zoom controls, snapping toggle, timeline toggle, and layers panel are all hidden
- Bottom-left shows a **Replay** button that increments `animationKey` to trigger a remount

Canvas CSS transform: `translate3d(pan.x px, pan.y px, 0) scale(zoom)`. The wrapper is centred in the viewport with `transformOrigin: center center`.

### `LayersPanel`

Floating panel (300px wide). Behaviours:
- **Draggable** — grabbed by header, can be repositioned freely
- **Auto-snap to edge** — when dragged within **150px** of the right or left usable boundary, `layersPanelSide` flips and `x` snaps to `10px` (left) or `windowWidth - sidebarWidth(320) - panelWidth(300) - 10px` (right)
- **Snap decision on mouseup** — only fires if the panel actually moved > 5px; based on whether the panel centre crosses the midpoint of `(windowWidth - sidebarWidth) / 2`
- **Drag bounds** — x clamped to `[10, windowWidth - 320 - 300 - 10]`; y clamped to `[10, containerHeight - currentPanelHeight - 75 - timelineOffset]` where timelineOffset is `TIMELINE_PANEL_HEIGHT` only when `animationMode` is `'advanced'` or `'both'` and the timeline is open
- **Window resize handler** — recalculates `layersPanelPos.x` based on current `layersPanelSide` when the viewport resizes
- **On expand** — if current `y` would place the expanded panel out of bounds, `y` is clamped upward before expanding
- **Side** — tracks `'left' | 'right'`, used for edge-docking; initial position `x = -1` means "use side docking", actual px calculated on first drag
- **Hidden in preview mode** — the `LayersPanel` is not rendered when `mode === 'preview'`
- **Collapsible** — collapses to header-only (48px); expanded height capped at 322px with overflow scroll
- **Layer list** — shows layer type icon, label text (truncated), selected indicator, lock toggle
- **Add layer dropdown** — plus button opens menu with: Text, Button, Image, Video, Rich Text
- **Drag to reorder** — HTML5 drag events (`dragstart / dragover / drop / dragend`), visual drag indicator shows insertion position
- **Multi-select** — clicking a layer with Shift adds/removes from selection
- Contains a canvas settings gear icon that opens the settings modal

### `PropertySidebar`

Right-side panel, always visible. Content changes based on selection state:

**No selection:** Shows canvas-level settings — canvas name (text input), background color picker, clipping toggle, animation loop count (preset `<select>`: No Loop / 2× / 3× / 5× / 10× / Infinite), Loop Duration input (number + `ms`/`s` unit selector, size-specific), Reset Duration input (number + `ms`/`s` unit selector, size-specific), and the "Animation Loop Duration" hint (calculated minimum total animation length across all layers for the selected size).

**One layer selected:**
- Header: layer label (editable inline — pencil icon opens an `<input>`, Enter confirms, Escape cancels; empty string does not save; edit button is invisible on locked layers), layer type badge, HTML ID field
- Tab bar: **Properties** tab always shown; **Animations** tab only shown when `animationMode` is `'basic'` or `'both'` (hidden in `'advanced'` mode)
- Alignment buttons: left, center-H, right, top, center-V, bottom (6 buttons)
- Properties panel (per layer type — see below)
- Opacity slider (0–100%)
- Aspect ratio lock toggle (width:height)
- Position X/Y and Width/Height number inputs (switchable between `px` and `%`)
  - Arrow keys increment/decrement by 1; Shift+arrow by 10
  - "Copy to" popover for position+size, font size, text align, icon size, border radius
- Indicator badge — **amber** = size-specific property, **no badge** = global property

**Multiple layers selected:** Shows only alignment buttons and position/size inputs (bulk operations). Position/size fields show the common value if all selected layers share it, or an empty placeholder `'-'` if values differ. Editing any field applies to all selected layers.

#### Property Tab — per layer type

- **Text:** content textarea (200 char limit with counter), color picker, font family dropdown (20 Google Fonts), font size dropdown, text alignment buttons
- **Rich Text:** contenteditable area (200 char limit), color picker, font family, font size, text alignment
- **Image:** URL input (with preview thumbnail), object-fit selector, background color picker
- **Video:** URL input, autoplay toggle, controls toggle
- **Button:** text input (50 char limit), action type (`link` | `videoControl`), then type-specific fields:
  - **Link**: URL input
  - **Video Control**: two dropdowns — target video element and action
    - **Target Video dropdown**: only video layers with a non-empty `attributes.id` appear as selectable options. Video layers with no ID are shown as a disabled warning entry (`⚠️ N video layer(s) without IDs`). The value stored is `targetElementId` (the HTML ID string, not internal layer ID)
    - **Action dropdown**: `play`, `pause`, `restart`, `togglePlayPause`
    - **Icon options are filtered by action**: `togglePlayPause` only shows `toggle-filled`, `toggle-outline`, `toggle-custom`; `play` shows none/play/play-fill/custom; `pause` shows none/pause/pause-fill/custom; `restart` shows none/replay/custom; no action-type filter (link buttons) show all options
    - **Toggle icon initial state**: determined by whether the target video layer has `properties.autoplay === true`; if autoplay, initial icon is the pause icon; otherwise the play icon
    - In **export/preview HTML**: toggle buttons use a `.btn-icon` `<span>` with `data-play-icon` and `data-pause-icon` attributes (HTML-escaped). After each click a `setTimeout(0)` re-checks `v.paused` and swaps the inner HTML accordingly
    - Generated onclick for `videoControl`: `const v = document.getElementById('TARGET_ID'); if (v) { ... }` — the target is looked up at click time by the video layer's HTML `id`, not by internal layer ID
    - Video-control buttons render as `<button>` elements; link buttons render as `<a>` elements
  - **Icon settings** (shared): icon type, icon size (16/20/24/32/40/48px select), icon position (before/after text), icon color (for SVG icons), custom image URL (for `custom` type), custom play+pause image URLs (for `toggle-custom` type)
  - Border radius input (uniform or per-corner), font family, font size (only shown when button has non-empty text)

#### Animation Tab

Shows per-size animations list. Each animation row: name, type badge, duration, delay, edit button, delete button. A "Add Animation" button opens the `AddEditAnimationModal`. Also shows loop delay and reset duration inputs (stored on the first layer's size config).

Animation Loop Duration hint: calculates the latest `delay + duration` across all animations on all layers for the current size, displayed as the minimum required loop length.

### `TimelinePanel`

**Only rendered** in edit mode when `animationMode` is `'advanced'` or `'both'`. Visibility is toggled by `isTimelinePanelOpen`.

Resizable panel anchored to the bottom of the viewport (default 300px, draggable up to 800px min 300px). Only shown when `isTimelinePanelOpen` is true.

Features:
- Zoomable timeline ruler (0.25× to 4×, base 40px/second)
- Horizontal scroll with synced header + content areas
- One row per layer; rows can be expanded/collapsed (all expanded by default)
- Animation bars: coloured fill rectangles (10 colours cycling) with diamond start markers
- Drag handles on animation start marker, end marker, and bar body to adjust delay and duration in real time
- Inline click-to-edit on start/end time markers
- Hover tooltip showing time at cursor position
- Add animation button per layer row (opens `AddEditAnimationModal`)
- Edit / delete buttons per animation bar on hover
- `ResizeObserver` on scroll container to recalculate visible duration as panel width changes

### `ZoomControls`

Bottom-right floating controls:
- Zoom percentage display (click to reset zoom to 1 and pan to `{0,0}`; commits both to history)
- Zoom in / zoom out buttons — zoom change commits to history **immediately** via `setTimeout 0` (deliberate single click, not a continuous gesture)
- Reset view button — resets zoom to 1 and pan to `{0,0}`, commits both `commitZoom` + `commitPan`
- Snapping toggle button (magnet icon when on, free-move icon when off; shows "Snap" / "Free" label)
- Timeline panel toggle button (only visible when `animationMode` is `'advanced'` or `'both'`)

### `SizeSelector`

Thumbnail row of all `sampleCanvas.allowedSizes` rendered at 6% scale. Rendered in the bottom controls bar (absolute-positioned, centred) **only when `adSelectorPosition === 'bottom'`**. Each thumbnail is a white box bordered with `2px blue-600` when selected, `2px transparent` when not. A size label (`widthxheight`) is shown below each thumbnail. Clicking a size sets `selectedSize`.

### `ExportHTMLModal`

Full-screen modal displaying the exported HTML in a `<textarea>` with a copy-to-clipboard button.

### `AddEditAnimationModal`

Modal (400px wide) for creating or editing a single animation. Fields:
- Name (text input)
- Type (select: fadeIn, slideLeft, slideRight, slideUp, slideDown, scale, custom)
- From / To values (context-sensitive: unitless for opacity/scale, `px` for slide, color picker for custom color properties)
- Duration (number + unit `ms`/`s`)
- Delay (number + unit `ms`/`s`)
- Easing (select)

### `SettingsModal`

App-level settings (not canvas-level). Two settings:
- **Ad Selector position** — `top` or `bottom`
- **Animation Mode** — `basic` | `advanced` | `both` (controls which animation UI sections are shown in the sidebar)

---

## Canvas Interactions (`useCanvasInteractions` hook)

### Drag (Move)

- `mousedown` on a layer starts drag
- Multi-layer drag: all currently selected layers move together; bounding box used for snapping
- Positions are converted to `px` internally during drag, then written back in the layer's original unit
- History is paused for the duration of the drag; one history entry committed on `mouseup`
- **`displayLayers` pattern**: during drag/resize, `tempLayerUpdates` holds the in-progress layer state. Canvas renders `displayLayers = isDragging || isResizing ? tempLayerUpdates : layers`. On `mouseup`, `tempLayerUpdates` are committed to the Zustand store in one call — this means the store (and history) only see the final position, not every intermediate mouse position
- **Global listeners**: when drag starts, `document.addEventListener('mousemove')` and `document.addEventListener('mouseup')` are attached. This handles fast mouse movements that escape the canvas bounds. A ref (`handleMouseMoveRef`, `handleMouseUpRef`) stores the latest handler to avoid stale closures
- **rAF throttling**: `requestAnimationFrame` is used inside `mousemove`. If a frame is already scheduled (`rafIdRef.current !== null`), the event is skipped. On `mouseup`, any pending rAF is cancelled via `cancelAnimationFrame`

### Resize

- `mousedown` on a resize handle (8 handles: corners `nw/ne/sw/se` + edge midpoints `n/e/s/w`) starts resize
- Single-layer only (resize aborts if `selectedLayerIds.length !== 1`)
- **Minimum size**: `20px` for button layers, `30px` for all other layer types
- History paused during resize, one entry on `mouseup`
- Same `displayLayers` / `tempLayerUpdates` pattern and global listeners as drag

**Aspect ratio locking logic** (4 states determined by `aspectRatioLocked` flag and modifier keys):

| State | Trigger | Behaviour |
|---|---|---|
| Case 1 | Alt only, no lock | Centre-anchored resize; both edges move symmetrically |
| Case 2 | Aspect lock + Alt | Centre-anchored resize maintaining aspect ratio |
| Case 3 | Aspect locked, edge handle | Scales from opposite edge’s centre point, maintains ratio |
| Case 4 | Aspect locked, corner handle | Scales from opposite corner, maintains ratio |
| Case 5 | Aspect lock + Shift + Alt | Equivalent to Case 2 |

`aspectRatioLocked = true` on the layer itself means the ratio is **always** locked regardless of Shift. Shift only locks the ratio when `aspectRatioLocked` is `false`/`undefined`.

**Resize snapping**: snapping fires on the active resize edge against canvas edges, canvas centre (visual guide only — no position adjustment), and other layer edges. When an edge snaps, the dimensions are **recalculated post-snap** to preserve the active modifier key behaviour (e.g. if Alt is held and the right edge snaps, width and x are recalculated to remain centred).

### Snapping (when enabled)

Snap threshold = `8 / zoom` (adjusts for zoom level).

**No position clamping**: layers are **never** clamped to canvas bounds during drag or resize. A layer can be fully dragged outside the canvas area. `isClippingEnabled` controls whether the canvas container clips that overflow visually (`overflow: hidden | visible`), but the stored position is unconstrained.

#### Snap targets (per axis, first-match-wins)

For each axis (X and Y) independently, the first matching condition below wins and no further targets are checked for that axis:

**Vertical axis (X)** — tests against the selection bounding box:
1. Bounding box left edge → canvas left edge (0)
2. Bounding box right edge → canvas right edge (canvas width)
3. Bounding box centre → canvas centre X
4-8. Per non-selected layer: bounding left→other left, bounding right→other right, bounding left→other right, bounding right→other left, bounding centre→other centre X

**Horizontal axis (Y)** — same pattern with top/bottom/centre:
1. Bounding top → canvas top (0)
2. Bounding bottom → canvas bottom (canvas height)
3. Bounding centre → canvas centre Y
4-8. Per non-selected layer: top/bottom/top-to-bottom/bottom-to-top/centre pairs

Snap candidate positions used: `canvasEdges = { left: 0, right: w, top: 0, bottom: h, centerX: w/2, centerY: h/2 }`.

**During drag**: snap adjustment (`snapDx`, `snapDy`) is added to every selected layer's new position each frame.

**During resize**: canvas centre lines show a visual guide only (no position adjustment). Edge snap applies to the active resize handle's edge and triggers post-snap dimension recalculation to preserve the active modifier key behaviour.

Snap guides render as red `1/zoom px` lines (`#ef4444`) on the canvas at z-index 9999, outside the clipping container so they're always visible regardless of `isClippingEnabled`.

### Zoom & Pan

#### Input methods

| Gesture / Key | Action |
|---|---|
| `Ctrl/Cmd + scroll wheel` | Zoom in/out toward cursor |
| `Shift + scroll wheel` | Zoom in/out toward cursor (alternative) |
| Trackpad pinch (`ctrl` + wheel, `DOM_DELTA_PIXEL`) | Zoom in/out toward cursor |
| Two-finger trackpad swipe (no modifier) | Pan canvas |
| `Spacebar + mouse drag` | Pan canvas |

All pan/zoom interactions are **disabled in preview mode**.

Wheel events are only handled when the pointer is inside the `[data-canvas-container]` element, preventing accidental zoom/pan when hovering over panels.

The wheel listener is registered with `{ passive: false }` so `preventDefault()` can be called to prevent native browser scroll.

#### Zoom-toward-cursor

When zooming via scroll/pinch, the pan offset is adjusted so the point under the cursor stays stationary:

```
centerX / centerY = centre of [data-canvas-container] bounding rect
offsetX = cursorX - centerX
offsetY = cursorY - centerY
zoomDelta = newZoom - currentZoom

newPanX = prevPan.x - (offsetX * zoomDelta) / currentZoom
newPanY = prevPan.y - (offsetY * zoomDelta) / currentZoom
```

Zoom is clamped to `0.25` – `3.0`.

#### deltaMode normalisation

Wheel events carry a `deltaMode` that varies by input device and browser. Each mode is normalised before applying:

| `deltaMode` | Constant | Pan multiplier | Zoom multiplier |
|---|---|---|---|
| `0` | `DOM_DELTA_PIXEL` | ×1 (1:1 trackpad, used as-is) | ×0.006 |
| `1` | `DOM_DELTA_LINE` | ×16 | ×0.05 |
| `2` | `DOM_DELTA_PAGE` | ×100 | ×0.5 |

For **Shift + scroll** zoom: `delta = -deltaY * 0.005`.

#### Performance — history debounce on wheel

Continuous wheel/trackpad events must not flood the undo/redo history with hundreds of intermediate states. The pattern used:

1. On the **first wheel event**, call `pauseHistory()` and set an `isWheeling = true` flag.
2. Every subsequent wheel event **resets a 150ms debounce timer** (`setTimeout`).
3. When 150ms passes with no new wheel event, the timeout fires: `resumeHistory()`, `isWheeling = false`, and **one** `commitZoom` / `commitPan` call writes the final value as a single history entry.
4. Cleanup on unmount resumes history if the component is destroyed mid-wheel.

#### Performance — spacebar pan

1. `mousedown` while spacebar is held: records `panStartRef = { x, y, panX, panY }` and calls `pauseHistory()`.
2. `mousemove`: computes delta from `panStartRef` origin (not accumulated small steps) and calls `setPan` — a single delta calculation per frame, no rAF needed.
3. `mouseup`: calls `setIsPanning(false)`, `resumeHistory()`, and `commitPan(pan)` — one history entry for the entire drag.
4. `keyup Space`: also calls `commitPan` and clears `isPanning` to handle releasing space without a prior mouseup.

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `Delete` / `Backspace` | Delete selected layer(s) (with confirmation dialog) |
| `Arrow keys` | Move selected layer(s) by 1px |
| `Shift + Arrow keys` | Move selected layer(s) by 10px |
| `Alt/Option + Z` | Undo (uses `e.code === 'KeyZ'` not `e.key` to avoid macOS Option key producing special characters) |
| `Alt/Option + Shift + Z` | Redo |
| `Cmd/Ctrl + C` | Copy selected layer(s) to internal clipboard |
| `Cmd/Ctrl + V` | Paste copied layer(s) — inserts duplicates directly below the last copied layer in the stack; pasted layers are immediately selected |
| `Spacebar` (hold) | Enter pan mode; mouse drag pans canvas |
| `Shift` (hold during resize) | Lock aspect ratio |
| `Alt` (hold during resize) | Resize from both sides |
| `Shift` (click layer) | Add/remove layer from multi-selection |

Arrow key movement is blocked when focus is inside an input, textarea, or contenteditable. Undo/Redo and Delete are also blocked when typing.

### Alignment

**Single layer**: aligned relative to the **canvas** dimensions.
**Multiple layers selected**: aligned relative to the **selection bounding box** (not the canvas). All six buttons work on the selection bounding box. Resulting positions are rounded to the nearest integer (`Math.round`).

| Button | Single | Multi |
|---|---|---|
| Left | x = 0 | x = minX of selection |
| Right | x = canvasW − layerW | x = maxX − layerW |
| Center-H | x = (canvasW − layerW) / 2 | x = selectionCentreX − layerW/2 |
| Top | y = 0 | y = minY of selection |
| Bottom | y = canvasH − layerH | y = maxY − layerH |
| Center-V | y = (canvasH − layerH) / 2 | y = selectionCentreY − layerH/2 |

---

## Layer Management

### Add Layer

New layers are created from the Layers Panel “+” dropdown. The new layer is **prepended** to the layers array (appears at the top of the stack, highest z-index) and is **immediately selected**.

Default sizeConfig is created only for the three sizes `300x250`, `336x280`, and `728x90` (not all `allowedSizes`), with position `{ x: 10, y: 10 }` and the following dimensions:

| Type | Width | Height |
|---|---|---|
| text, richtext | 200px | 100px |
| image | 300px | 50px |
| video | 200px | 100px |
| button | 200px | 50px |

Default content/styles per type:
- **text / richtext**: `content = 'Lorem ipsum dolor sit amet...'`, `color: #000000`, `opacity: 1`
- **image**: placeholder Pexels URL, `opacity: 1`
- **video**: sample Big Buck Bunny MP4 URL, `opacity: 1`
- **button**: `text = 'Click Here'`, `actionType: 'link'`, `url: ''`, `icon: { type: 'none', position: 'before' }`, `backgroundColor: #333333`, `color: #ffffff`, `opacity: 1`
### Copy / Paste Layers

Triggered by `Cmd+C` / `Ctrl+C` (copy) and `Cmd+V` / `Ctrl+V` (paste) when focus is **not** inside a text input, textarea, or contentEditable. Handled entirely in `App.tsx` using a `copiedLayersRef` (a `useRef<LayerContent[]>`) — no store state.

**Copy (`Cmd/Ctrl + C`)**
- Only activates when at least one layer is selected.
- Stores the full `LayerContent` objects of all currently selected layers into `copiedLayersRef.current` (ordered by their current position in the layers array).
- Preserves the copied data even after the originals are deleted.

**Paste (`Cmd/Ctrl + V`)**
- Only activates when `copiedLayersRef.current` is non-empty.
- Each pasted layer is a deep copy of the original with:
  - A new unique ID (`sa-${crypto.randomUUID()}`).
  - Label suffixed with ` (Copy)`.
  - `attributes.id` cleared to `''` (avoids duplicate HTML element IDs).
- **Insertion point**: pasted layers are inserted immediately after the last copied layer's current position in the `layers` array (i.e. directly below it in the Layers Panel). If none of the original copied layers still exist in the array, the copies are appended to the end (bottom of the stack).
- Multi-layer paste: all pasted copies are inserted together at the insertion point, preserving their relative order.
- Pasted layers are immediately selected (`setSelectedLayerIds` set to new IDs).
### Delete Layer

- Via sidebar “Delete” button (disabled + greyed when layer is locked) or keyboard `Delete`/`Backspace`
- Always confirms with `window.confirm`:
  - Single layer: `Are you sure you want to delete "{label}"?`
  - Multiple layers: `Are you sure you want to delete N layers?`
- Removes from `layers` array and clears from `selectedLayerIds`

### Reorder Layers

HTML5 drag-and-drop in the Layers Panel. Visual indicator shows insertion point. Layer order determines z-index (first layer in array = highest z-index in render, i.e. rendered on top).

### Lock Layer

Toggle lock icon in the Layers Panel row. Locked layers:
- Cannot be selected by clicking on the canvas
- Cannot be moved or resized
- Still appear in the export

### Copy Properties to Other Sizes

"Copy to" popover on certain sidebar inputs allows copying the current value for the current size to one or more other allowed sizes. Supported properties:
- Position + Size (positionX, positionY, width, height together) — creates a stub config if target size has no existing config
- Font Size — only copies if target size already has a `sizeConfig` entry
- Text Alignment — only copies to sizes with existing config
- Icon Size — only copies to sizes with existing config
- Border Radius — only copies to sizes with existing config

### HTML ID Validation

When editing the HTML ID field in the sidebar:
- **Spaces**: silently rejected (returns without updating or alerting)
- **Starts with a digit**: `alert()` shown, not saved
- **Duplicate across layers**: `alert()` shown, not saved
- **Empty string**: allowed (clears the custom ID; export falls back to the layer UUID)

### Background Color Normalization

`'transparent'`, `'rgba(0,0,0,0)'`, and empty string are all normalised to `undefined` when stored in `layer.styles.backgroundColor`. This ensures a consistent no-background state across the app and clean export output.

---

## Export HTML

Generates a single self-contained HTML file covering all allowed sizes via CSS class switching. Before generating, **selection is cleared** (`setSelectedLayerIds([])`). The `allowedSizes` used come from `sampleCanvas.allowedSizes` (hardcoded), not from the canvas state. Structure:

1. **`<head>`** — charset, viewport meta, Google Fonts `<link>`, `<style>` block
2. **`<style>` block** contains:
   - CSS reset: `margin: 0; padding: 0; border: 0; font-size: 100%; font-weight: normal; vertical-align: baseline` applied to common elements (`div, span, h1–h6, p, img, video, button`)
   - `body`: `width/height` = canvas dimensions, `overflow: hidden`, `position: relative`, `-webkit-text-size-adjust: 100%`, `user-select: none`, `-webkit-user-select: none`
   - `* { box-sizing: border-box }`
   - **Initial animation states** — each animated element is set to its `from` CSS state (e.g. `opacity: 0`, `transform: translateX(100%)`) so there is no flash-of-final-state before JS applies the animation
   - **`@keyframes`** for every animation (one block per animation per layer per size: `anim-{layerId}-{animId}-{size}`)
   - **Two keyframe shapes** depending on `animationLoop`:
     - `animationLoop === 0` (no loop): `0% → from`, `startPercent% → from`, `endPercent% → to`, `100% → to` (holds final state)
     - `animationLoop !== 0` (any loop): adds reset keyframes `resetStart% → to`, `(resetStart + 0.01)% → from`, `100% → from` so the element snaps back and reruns
   - Per-size class rules namespaced under `.size-{width}x{height}` that set each element's `position: absolute`, coordinates, dimensions, font size, text align, border radius, etc.
3. **Single set of HTML elements** (one element per layer, IDs from `attributes.id` if set, otherwise layer UUID)
4. **`<script>`** at end of `<body>`:
   - On `DOMContentLoaded`: reads `data-animation` attributes and applies them as inline `element.style.animation` (deferred to ensure fonts/images are ready)
   - **Video reset on loop**: adds `animationiteration` listener on the first animated element; on each iteration all `<video>` elements are paused, `currentTime` reset to 0, and replayed if they have `autoplay`
   - Button video-control wiring (play, pause, restart, togglePlayPause)
   - Toggle icon swap: on video play/pause events updates `innerHTML` of `.btn-icon` using `data-play-icon` / `data-pause-icon` attributes
   - Size switching utility: `document.body.className = 'size-{w}x{h}'`

Animation timing model for export:
- `totalCycleTime = loopDelay + resetDuration` (in ms)
- Each animation runs as `totalCycleTime` long with actual motion compressed to `duration` starting at `delay`
- `iteration-count` set based on `animationLoop`: `-1 → infinite`, `0 → 1`, `>0 → N`

Button icon types supported in export:
- `none`, `play`, `pause`, `replay`, `play-fill`, `pause-fill` — static SVG icons
- `toggle-filled`, `toggle-outline` — SVG icons that swap between play/pause on video state changes
- `custom` — single `<img>` icon
- `toggle-custom` — two `<img>` icons that swap on video state

---

## Preview Mode

Preview renders the same HTML generation logic as Export but into an `<iframe srcDoc>`. The `animationKey` prop is used as the iframe `key` attribute to force a full unmount/remount when the user requests animation replay.

In preview mode:
- Layer mouse interactions are disabled (`mode !== 'edit'` guard in handlers)
- Pan and zoom are disabled (`mode === 'preview'` guard in wheel and canvasMouseDown handlers)
- The sidebar (`PropertySidebar`) is not rendered
- The Layers Panel is not rendered
- Timeline Panel is not rendered
- ZoomControls are not rendered
- Bottom-left shows **Replay** button only

---

## Google Fonts

`utils/googleFonts.ts` provides:
- `getGoogleFontsLink(families)` — returns a `<link>` tag string for use in export HTML
- `loadGoogleFonts(families)` — dynamically injects a `<link>` into the document `<head>` for live editor preview

Font families are loaded when `layers` changes (effect in `App.tsx`). Only `text`, `richtext`, and `button` layers contribute a font family.

Available fonts (20 options): Arial, Roboto, Open Sans, Lato, Montserrat, Poppins, Oswald, Raleway, PT Sans, Merriweather, Nunito, Playfair Display, Ubuntu, Mukta, Rubik, Work Sans, Inter, Bebas Neue, Quicksand, Karla.

---

## UI Constants

| Constant | Value | Usage |
|---|---|---|
| `TOP_BAR_HEIGHT` | 56px | Top bar height |
| `LAYERS_PANEL_EXPANDED_HEIGHT` | 322px | Max layers panel height |
| `LAYERS_PANEL_COLLAPSED_HEIGHT` | 48px | Collapsed header height |
| `AD_SELECTOR_SCALE` | 0.06 | Scale for size thumbnail previews |
| `TIMELINE_PANEL_HEIGHT` | 300px | Default timeline height |
| `BOTTOM_CONTROLS_HEIGHT` | 64px | Bottom zoom/controls bar |
| `MAX_TEXT_CONTENT_LENGTH` | 200 | Text/richtext character limit |
| `MAX_BUTTON_TEXT_LENGTH` | 50 | Button text character limit |

### Color System

- **Blue `#3b82f6`** — drag indicators, layer selection bounding box
- **Blue `#2563eb`** — active selection outline and borders
- **Red `#ef4444`** — snap guide lines
- **Amber** (`bg-amber-100 / text-amber-900`) — size-specific property indicators in sidebar
- Timeline animation bars: 10 colour pairs cycling (blue, green, amber, purple, pink, cyan, orange, teal, indigo, lime)

---

## Developer / Debug API

`window.vb` object exposed in the browser console:

| Method | Returns |
|---|---|
| `window.vb.store()` | Full Zustand store state |
| `window.vb.history()` | `{ past, present, future, canUndo, canRedo }` |
| `window.vb.clearHistory()` | Clears undo/redo history |
| `window.vb.exportCanvas()` | Logs + returns the Canvas object as JSON |

---

## Validation & Edge Cases

- **Color inputs** — validated as hex strings; invalid values are not applied
- **URL inputs** — basic validation in `UrlInput` component
- **Character counters** — text/richtext show `n / 200`; button text shows `n / 50`; inputs locked after limit
- **Loop Duration Too Short** — the Loop Duration input in Canvas Settings shows a red border + `Min: X.XX unit` hint when the entered value is less than the minimum required `delay + duration` across all animations for the current size; the value is still writable (no hard clamp), just flagged
- **Locked layers** — clicking a locked layer on canvas does nothing; sidebar Delete button is disabled and greyed; edit-label pencil is hidden; layer panel shows lock icon
- **Layers without a size config** — any layer missing a `sizeConfig` entry for the active size is skipped in canvas render and export
- **Aspect ratio lock** — when `BaseLayer.aspectRatioLocked = true`, sidebar width/height inputs enforce proportional scaling; the Shift key on canvas resize handles does the same temporarily only when `aspectRatioLocked` is `false`/`undefined`
- **Font family scope** — `fontFamily` is stored on `layer.styles` (global, not size-specific) for `text`, `richtext`, and `button` layers; `image` and `video` layers do not have a font family field
- **`handleFontFamilyChange` scope** — only applies to `richtext` and `button` layers in the handler (text layers read `fontFamily` from styles but the font family dropdown in the UI only appears in the richtext/button sidebar fields)

---

## Known Constraints / Intentional Decisions

- Only one canvas/document at a time (no multi-document or project management)
- `sampleCanvas` is defined at the bottom of `src/data.ts` and used as the static initial state loaded into the Zustand store. There is no load/save to a backend or localStorage. Export also uses `sampleCanvas.allowedSizes` directly (not taken from dynamic canvas state at runtime)
- Animation keyframes are generated at export time in full from the stored animation data; there is no keyframe editor (future work)
- The `animationLoopDelay` and `animationResetDuration` are stored on the **first layer’s** size config as a shortcut but treated as canvas-level settings in the UI; all animation timing reads from `layers[0].sizeConfig[selectedSize]`
- `zundo` history partialize is configured to only track `HistoricalState` fields; ephemeral fields are never recorded
- New layers only get `sizeConfig` entries for `300x250`, `336x280`, and `728x90` by default — other allowed sizes require manual positioning

---

## Future Development Ideas (from README)

- Exit animations
- Carousel support
- More sizes + ability to manually define custom sizes
- Preset components (starter layouts per layer type)
- Custom JavaScript and CSS scripting (advanced mode)
- Full animation timeline editor (advanced mode)
