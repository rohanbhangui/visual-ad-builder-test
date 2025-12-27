# Visual Ad Builder Test

<img width="1104" height="749" alt="Screenshot 2025-12-26 at 9 01 55 PM" src="https://github.com/user-attachments/assets/ab764985-869b-4984-9e5d-a4874d5fe90e" />

Quick test to build a visual ad builder app for multiple sizes

Url: https://visual-ad-builder-test.vercel.app/

## Key Features

### Visual Editor
- Bounding box for resize and movement (blue with corner handles)
- Snapping guides (red)
- Free flow resize and movement (when `shift` key is held)
- Ad size selector with independent styles and position
- Preview mode toggle (renders html with css into iframe)
- `delete/backspace` key to delete a selected layer (with confirmation)
- arrow keys move elements (hold `shift` to move by 10px at a time)

### Layers Panel
- Add new elements
- Reorder elements using drag and drop handles
- Indicators for active layer
- Lock and unlock layers
- Floating and can be snapped to left or right edge
- Can collapse to make more space

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
