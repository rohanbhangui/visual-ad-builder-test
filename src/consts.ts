// Font size options for text elements
export const FONT_SIZE_OPTIONS = [
  '8px',
  '10px',
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '32px',
  '64px',
  '72px',
];

// Google Fonts - Top 20 popular fonts
export const GOOGLE_FONTS = [
  'Arial',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Oswald',
  'Raleway',
  'PT Sans',
  'Merriweather',
  'Nunito',
  'Playfair Display',
  'Ubuntu',
  'Mukta',
  'Rubik',
  'Work Sans',
  'Inter',
  'Bebas Neue',
  'Quicksand',
  'Karla',
];

// Character limits
export const MAX_TEXT_CONTENT_LENGTH = 200;
export const MAX_BUTTON_TEXT_LENGTH = 50;

// UI Colors
export const COLORS = {
  BLUE_PRIMARY: '#3b82f6', // Tailwind blue-500 - Primary blue for drag indicators
  BLUE_SELECTED: '#2563eb', // Tailwind blue-600 - Selection outline and borders
  RED_GUIDELINE: '#ef4444', // Tailwind red-500 - Snap guidelines color
} as const;

// Tailwind color classes for UI elements
export const UI_COLORS = {
  SELECTED_LAYER_BG: 'bg-blue-100', // Darker blue background for selected layer in panel
  SELECTED_INDICATOR: 'bg-blue-600', // Blue dot indicator for selected layer
  ACTIVE_BUTTON: 'bg-blue-100', // Light blue for active text alignment buttons
  ACTIVE_BUTTON_HOVER: 'hover:bg-blue-200', // Hover state for active buttons
} as const;

// Common HTML5 ad sizes
export const HTML5_AD_SIZES = {
  '728x90': { width: 728, height: 90 },
  '336x280': { width: 336, height: 280 },
  '300x250': { width: 300, height: 250 },
  '970x90': { width: 970, height: 90 },
  '120x600': { width: 120, height: 600 },
  '160x600': { width: 160, height: 600 },
  '300x600': { width: 300, height: 600 },
  '320x50': { width: 320, height: 50 },
  '250x250': { width: 250, height: 250 },
} as const;
