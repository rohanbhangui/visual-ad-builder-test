# Visual Ad Builder Test

Quick test to build a visual ad builder app for multiple sizes

Demo: https://visual-ad-builder-test.vercel.app/

## Screenshots

<img width="1747" height="1177" alt="image" src="https://github.com/user-attachments/assets/680955cc-91d6-4923-a022-478e84d4229c" />

<img width="1747" height="1174" alt="image" src="https://github.com/user-attachments/assets/4440b611-2050-4a1e-9bd0-95dd6d96ca2d" />

## Key Features

### Visual Editor

- Bounding box for resize and movement (blue with corner handles)
- Snapping guides (red)
- Toggle for snapping vs free flow
- Aspect ratio lock (hold `shift`) when scaling something
- Resize on edge (hold `alt` to resize from both sides, with snapping)
- Ad size selector with independent styles and position
- Preview mode toggle (renders html with css into iframe)
- `delete/backspace` key to delete a selected layer (with confirmation)
- Arrow keys move elements (hold `shift` to move by 10px at a time)
- 1 click export HTML for all relevant sizes with id overrides
- Multiple layer select (click layers with `shift`)
- Zoom and pan support (`Ctrl/Cmd + scroll` to zoom scroll / `spacebar + mouse drag` is pan)
- Trackpad support for pan and pinch to zoom in/out
- Undo/Redo Buttons (with shortcuts: `alt/option + z` for Undo or `alt/option + shift + z` for Redo)

### Layers Panel

- Add new elements
- Reorder elements using drag and drop handles
- Indicators for active layer
- Lock and unlock layers
- Floating and can be snapped to left or right edge
- Can collapse to make more space
- Canvas settings
- Clip the edit mode to see what will be not visible in the final
- Support for long layer labels

### Sidebar

- Color pickers (text and background)
- Rich text with font family, size and styling (Bold, italics, underline)
- Character count for text and richtext fields (with validations)
- Basic validations for color and url inputs
- Images/videos (via url)
- Image preview
- Precise adjustments fields for position, width and height (with unit adjustments % vs. px)
- Quick alignment buttons
- Delete layer button (with confirmation)
- Ability to edit the label of the layer
- Edit/Update layer label
- Opacity support
- Lock aspect ratio (width vs. height without `shift`)
- Indicators for controls that are global vs local to the size (with tooltips)
- Animation panel with multiple animations allowed
- Animations have a duration and a reset period before restarting the animation
- Buttons can control urls and can act as video controllers
- Arrow key support for position, width and height
- Animation Loop Duration will hint what is the minimum animation length required to fulfill all animations
- "Copy to" for certain properties so that other sizes can be updated

## Future Development ideas

- Exit animations
- Carousel support (+ button support)
- More sizes (+ being able to manually add in preset sizes)
