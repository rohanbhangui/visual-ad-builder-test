# Visual Ad Builder Test

<img width="1468" height="792" alt="image" src="https://github.com/user-attachments/assets/9255a3a4-f9cb-4061-aec0-595dcf048f60" />

Quick test to build a visual ad builder app for multiple sizes

Url: https://visual-ad-builder-test.vercel.app/

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
- arrow keys move elements (hold `shift` to move by 10px at a time)
- 1 click export HTML for all relavent sizes with id overrides

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
