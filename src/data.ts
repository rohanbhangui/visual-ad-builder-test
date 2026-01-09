import { GOOGLE_FONTS, HTML5_AD_SIZES } from './consts';

export type FontFamily = (typeof GOOGLE_FONTS)[number];
export type AdSize = keyof typeof HTML5_AD_SIZES;

// Position type for x, y coordinates
export interface Position {
  x: number | string; // Can be px or %
  y: number | string;
  unit?: 'px' | '%'; // Default unit for both x and y
}

// Size type for width and height
export interface Size {
  value: number;
  unit?: 'px' | '%'; // Primarily px for ad dimensions
}

// Time value type for animation duration and delay
export interface TimeValue {
  value: number;
  unit: 'ms' | 's';
}

// Animation configuration
export interface Animation {
  id: string; // Unique ID for React keys
  name: string; // User-visible name like "Animation 1"
  type: 'fadeIn' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown' | 'scale' | 'custom';
  property?: 'opacity' | 'x' | 'y' | 'width' | 'height' | 'scale' | 'color' | 'backgroundColor'; // Only for custom
  from?: string | { value: number; unit: string }; // Start value - structured for numeric, string for colors
  to?: string | { value: number; unit: string }; // End value - structured for numeric, string for colors
  duration: TimeValue;
  delay: TimeValue;
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  repeat?: number; // 0 = no repeat, -1 = infinite
}

// Size-specific configuration for a layer
export interface SizeConfig {
  positionX: Size;
  positionY: Size;
  width: Size;
  height: Size;
  fontSize?: string; // Font size specific to this ad size (e.g., '14px')
  textAlign?: 'left' | 'center' | 'right'; // Text alignment specific to this ad size
  iconSize?: number; // Icon size in pixels (for button layers)
  borderRadius?:
    | number
    | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number }; // Corner radius in px (number = all corners, object = individual corners)
  animations?: Animation[]; // Animations for this size
  animationLoopDelay?: { value: number; unit: 'ms' | 's' }; // Loop duration for this size
  animationResetDuration?: { value: number; unit: 'ms' | 's' }; // Reset pause duration for this size
}

// Union type for layer content based on type
export type LayerContent = TextLayer | RichtextLayer | ImageLayer | VideoLayer | ButtonLayer;

export interface BaseLayer {
  id: string;
  label: string;
  locked: boolean;
  aspectRatioLocked?: boolean;
  attributes: {
    id?: string; // HTML id attribute for the element
  };
  sizeConfig: Partial<Record<AdSize, SizeConfig>>; // All size-specific properties grouped together
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  styles: {
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
    fontFamily?: FontFamily;
    opacity: number;
  };
}

export interface RichtextLayer extends BaseLayer {
  type: 'richtext';
  content: string; // HTML content
  styles: {
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
    fontFamily?: FontFamily;
    opacity: number;
  };
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  url: string;
  styles: {
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
    objectFit?: string;
    opacity: number;
  };
}

export interface VideoLayer extends BaseLayer {
  type: 'video';
  url: string;
  properties?: {
    autoplay?: boolean;
    controls?: boolean;
  };
  styles: {
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
    opacity: number;
  };
}

export interface ButtonLayer extends BaseLayer {
  type: 'button';
  text: string;
  actionType: 'link' | 'videoControl';
  url: string; // Used when actionType is 'link'
  videoControl?: {
    targetElementId: string;
    action: 'play' | 'pause' | 'restart' | 'togglePlayPause';
  };
  icon?: {
    type:
      | 'none'
      | 'play'
      | 'pause'
      | 'replay'
      | 'play-fill'
      | 'pause-fill'
      | 'custom'
      | 'toggle-filled'
      | 'toggle-outline'
      | 'toggle-custom';
    customImage?: string; // For single custom image
    customPlayImage?: string; // For toggle custom play icon
    customPauseImage?: string; // For toggle custom pause icon
    color?: string; // For SVG icons
    position?: 'before' | 'after'; // Relative to text
  };
  styles: {
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
    fontFamily?: FontFamily;
    opacity: number;
  };
}

// Canvas/Document structure
export interface Canvas {
  id: string;
  name: string;
  allowedSizes: AdSize[];
  layers: LayerContent[];
  styles?: {
    backgroundColor?: string;
  };
  animationLoop?: number; // 0 = no loop, -1 = infinite, >0 = loop X times
  createdAt: Date;
  updatedAt: Date;
}

// Sample data with 4-5 layers
export const sampleCanvas: Canvas = {
  id: `sa-${crypto.randomUUID()}`,
  name: 'Sample HTML5 Ad',
  allowedSizes: ['300x250', '336x280', '728x90', '160x600'],
  styles: {
    backgroundColor: '#ffffff',
  },
  layers: [
    {
      id: `sa-${crypto.randomUUID()}`,
      label: 'Headline',
      type: 'richtext',
      locked: false,
      aspectRatioLocked: false,
      attributes: { id: 'headline' },
      sizeConfig: {
        '300x250': {
          positionX: { value: 10, unit: 'px' },
          positionY: { value: 121, unit: 'px' },
          width: { value: 280, unit: 'px' },
          height: { value: 35, unit: 'px' },
          fontSize: '20px',
          textAlign: 'center',
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 1, unit: 's' },
              delay: { value: 0.25, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
        },
        '336x280': {
          positionX: { value: 10, unit: 'px' },
          positionY: { value: 137, unit: 'px' },
          width: { value: 316, unit: 'px' },
          height: { value: 35, unit: 'px' },
          fontSize: '24px',
          textAlign: 'center',
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 1, unit: 's' },
              delay: { value: 0.25, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
        },
        '728x90': {
          positionX: { value: 124, unit: 'px' },
          positionY: { value: 15, unit: 'px' },
          width: { value: 234, unit: 'px' },
          height: { value: 30, unit: 'px' },
          fontSize: '20px',
          textAlign: 'center',
        },
        '160x600': {
          positionX: { value: 10, unit: 'px' },
          positionY: { value: 244, unit: 'px' },
          width: { value: 140, unit: 'px' },
          height: { value: 40, unit: 'px' },
          fontSize: '20px',
          textAlign: 'center',
        },
      },
      content: '<strong>Holiday Sale!</strong>',
      styles: {
        color: '#ff0000',
        fontFamily: 'Playfair Display',
        opacity: 1,
      },
    },
    {
      id: `sa-${crypto.randomUUID()}`,
      label: 'Get 50% off on your first purchase. Limited time offer!',
      type: 'text',
      locked: false,
      aspectRatioLocked: false,
      attributes: { id: 'description' },
      sizeConfig: {
        '300x250': {
          positionX: { value: 10, unit: 'px' },
          positionY: { value: 156, unit: 'px' },
          width: { value: 280, unit: 'px' },
          height: { value: 39, unit: 'px' },
          fontSize: '14px',
          textAlign: 'center',
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 1, unit: 's' },
              delay: { value: 0.5, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
          animationLoopDelay: { value: 5, unit: 's' },
          animationResetDuration: { value: 0.1, unit: 's' },
        },
        '336x280': {
          positionX: { value: 21, unit: 'px' },
          positionY: { value: 177, unit: 'px' },
          width: { value: 294, unit: 'px' },
          height: { value: 36, unit: 'px' },
          fontSize: '14px',
          textAlign: 'center',
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 1, unit: 's' },
              delay: { value: 0.5, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
          animationLoopDelay: { value: 5, unit: 's' },
          animationResetDuration: { value: 0.1, unit: 's' },
        },
        '728x90': {
          positionX: { value: 98, unit: 'px' },
          positionY: { value: 45, unit: 'px' },
          width: { value: 284, unit: 'px' },
          height: { value: 36, unit: 'px' },
          fontSize: '14px',
          textAlign: 'center',
        },
        '160x600': {
          positionX: { value: 10, unit: 'px' },
          positionY: { value: 284, unit: 'px' },
          width: { value: 140, unit: 'px' },
          height: { value: 53, unit: 'px' },
          fontSize: '14px',
          textAlign: 'center',
        },
      },
      content: 'Get 50% off on your first purchase.\nLimited time offer!',
      styles: {
        color: '#000000',
        fontFamily: 'Arial',
        opacity: 1,
      },
    },
    {
      id: `sa-${crypto.randomUUID()}`,
      label: 'Play/Pause Button',
      type: 'button',
      locked: false,
      aspectRatioLocked: false,
      attributes: { id: 'play-pause-btn' },
      sizeConfig: {
        '300x250': {
          positionX: { value: 68, unit: 'px' },
          positionY: { value: 87, unit: 'px' },
          width: { value: 24, unit: 'px' },
          height: { value: 24, unit: 'px' },
          iconSize: 16,
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 1, unit: 's' },
              delay: { value: 0, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
        },
        '336x280': {
          positionX: { value: 73, unit: 'px' },
          positionY: { value: 97, unit: 'px' },
          width: { value: 24, unit: 'px' },
          height: { value: 24, unit: 'px' },
          iconSize: 16,
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 1, unit: 's' },
              delay: { value: 0, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
          animationLoopDelay: { value: 5, unit: 's' },
          animationResetDuration: { value: 0.1, unit: 's' },
        },
        '728x90': {
          positionX: { value: 573, unit: 'px' },
          positionY: { value: 62, unit: 'px' },
          width: { value: 24, unit: 'px' },
          height: { value: 24, unit: 'px' },
          iconSize: 16,
        },
        '160x600': {
          positionX: { value: 3, unit: 'px' },
          positionY: { value: 173, unit: 'px' },
          width: { value: 24, unit: 'px' },
          height: { value: 24, unit: 'px' },
          iconSize: 16,
        },
      },
      text: '',
      actionType: 'videoControl',
      url: '',
      videoControl: {
        targetElementId: 'demo-video',
        action: 'togglePlayPause',
      },
      icon: {
        type: 'toggle-filled',
        position: 'before',
        color: '#ffffff',
      },
      styles: {
        backgroundColor: 'transparent',
        color: '#ffffff',
        opacity: 1,
      },
    },
    {
      id: `sa-${crypto.randomUUID()}`,
      label: 'Demo Video',
      type: 'video',
      locked: false,
      aspectRatioLocked: true,
      attributes: { id: 'demo-video' },
      sizeConfig: {
        '300x250': {
          positionX: { value: 68, unit: 'px' },
          positionY: { value: 19, unit: 'px' },
          width: { value: 164, unit: 'px' },
          height: { value: 92, unit: 'px' },
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 1, unit: 's' },
              delay: { value: 0, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
          animationLoopDelay: { value: 5, unit: 's' },
          animationResetDuration: { value: 0.1, unit: 's' },
        },
        '336x280': {
          positionX: { value: 69, unit: 'px' },
          positionY: { value: 5, unit: '%' },
          width: { value: 198, unit: 'px' },
          height: { value: 111, unit: 'px' },
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 1, unit: 's' },
              delay: { value: 0, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
          animationLoopDelay: { value: 5, unit: 's' },
          animationResetDuration: { value: 0.1, unit: 's' },
        },
        '728x90': {
          positionX: { value: 568, unit: 'px' },
          positionY: { value: 0, unit: 'px' },
          width: { value: 160, unit: 'px' },
          height: { value: 90, unit: 'px' },
        },
        '160x600': {
          positionX: { value: -100, unit: 'px' },
          positionY: { value: 0, unit: 'px' },
          width: { value: 360.8, unit: 'px' },
          height: { value: 201, unit: 'px' },
        },
      },
      url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
      properties: {
        autoplay: true,
        controls: false,
      },
      styles: {
        opacity: 1,
      },
    },
    {
      id: `sa-${crypto.randomUUID()}`,
      label: 'CTA Button',
      type: 'button',
      locked: false,
      aspectRatioLocked: false,
      attributes: { id: 'cta' },
      sizeConfig: {
        '300x250': {
          positionX: { value: 100, unit: 'px' },
          positionY: { value: 206, unit: 'px' },
          width: { value: 100, unit: 'px' },
          height: { value: 32, unit: 'px' },
          fontSize: '14px',
          borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 4, bottomRight: 4 },
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 1, unit: 's' },
              delay: { value: 0.75, unit: 's' },
              easing: 'ease-in-out',
            },
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 2',
              type: 'slideUp',
              from: { value: 25, unit: 'px' },
              duration: { value: 0.5, unit: 's' },
              delay: { value: 0.85, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
          animationLoopDelay: { value: 5, unit: 's' },
          animationResetDuration: { value: 0.1, unit: 's' },
        },
        '336x280': {
          positionX: { value: 118, unit: 'px' },
          positionY: { value: 230, unit: 'px' },
          width: { value: 100, unit: 'px' },
          height: { value: 32, unit: 'px' },
          fontSize: '14px',
          borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 4, bottomRight: 4 },
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 1, unit: 's' },
              delay: { value: 0.75, unit: 's' },
              easing: 'ease-in-out',
            },
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 2',
              type: 'slideUp',
              from: { value: 25, unit: 'px' },
              duration: { value: 0.5, unit: 's' },
              delay: { value: 0.85, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
          animationLoopDelay: { value: 5, unit: 's' },
          animationResetDuration: { value: 0.1, unit: 's' },
        },
        '728x90': {
          positionX: { value: 421, unit: 'px' },
          positionY: { value: 29, unit: 'px' },
          width: { value: 100, unit: 'px' },
          height: { value: 32, unit: 'px' },
          fontSize: '14px',
        },
        '160x600': {
          positionX: { value: 30, unit: 'px' },
          positionY: { value: 364, unit: 'px' },
          width: { value: 100, unit: 'px' },
          height: { value: 32, unit: 'px' },
          fontSize: '14px',
        },
      },
      text: 'Shop Now',
      actionType: 'link' as const,
      url: 'https://www.google.com',
      icon: { type: 'none' as const, position: 'before' as const },
      styles: {
        backgroundColor: '#0d821b',
        color: '#ffffff',
        fontFamily: 'Arial',
        opacity: 1,
      },
    },
    {
      id: `sa-${crypto.randomUUID()}`,
      label: 'Background Image',
      type: 'image',
      locked: true,
      aspectRatioLocked: false,
      attributes: { id: '' },
      sizeConfig: {
        '300x250': {
          positionX: { value: 0, unit: 'px' },
          positionY: { value: 0, unit: 'px' },
          width: { value: 300, unit: 'px' },
          height: { value: 250, unit: 'px' },
        },
        '336x280': {
          positionX: { value: 0, unit: 'px' },
          positionY: { value: 0, unit: 'px' },
          width: { value: 336, unit: 'px' },
          height: { value: 280, unit: 'px' },
        },
        '728x90': {
          positionX: { value: 0, unit: 'px' },
          positionY: { value: 0, unit: 'px' },
          width: { value: 728, unit: 'px' },
          height: { value: 90, unit: 'px' },
        },
        '160x600': {
          positionX: { value: 0, unit: 'px' },
          positionY: { value: 0, unit: 'px' },
          width: { value: 160, unit: 'px' },
          height: { value: 600, unit: 'px' },
        },
      },
      url: 'https://images.pexels.com/photos/1303098/pexels-photo-1303098.jpeg',
      styles: {
        opacity: 0.46,
        objectFit: 'cover',
      },
    },
  ],
  animationLoop: -1, // Infinite
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Tech Product Launch Ad Template
export const sampleCanvas2: Canvas = {
  id: `sa-${crypto.randomUUID()}`,
  name: 'Tech Product Launch Ad',
  allowedSizes: ['300x250', '336x280', '728x90', '160x600'],
  styles: {
    backgroundColor: '#0a0e27',
  },
  layers: [
    {
      id: `sa-${crypto.randomUUID()}`,
      label: 'Brand Logo',
      type: 'richtext',
      locked: false,
      aspectRatioLocked: false,
      attributes: { id: 'brand-logo' },
      sizeConfig: {
        '300x250': {
          positionX: { value: 15, unit: 'px' },
          positionY: { value: 15, unit: 'px' },
          width: { value: 120, unit: 'px' },
          height: { value: 25, unit: 'px' },
          fontSize: '16px',
          textAlign: 'left',
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'slideDown',
              from: { value: -20, unit: 'px' },
              duration: { value: 0.6, unit: 's' },
              delay: { value: 0, unit: 's' },
              easing: 'ease-out',
            },
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 2',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 0.6, unit: 's' },
              delay: { value: 0, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
        },
        '336x280': {
          positionX: { value: 15, unit: 'px' },
          positionY: { value: 15, unit: 'px' },
          width: { value: 130, unit: 'px' },
          height: { value: 28, unit: 'px' },
          fontSize: '18px',
          textAlign: 'left',
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'slideDown',
              from: { value: -20, unit: 'px' },
              duration: { value: 0.6, unit: 's' },
              delay: { value: 0, unit: 's' },
              easing: 'ease-out',
            },
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 2',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 0.6, unit: 's' },
              delay: { value: 0, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
        },
        '728x90': {
          positionX: { value: 15, unit: 'px' },
          positionY: { value: 10, unit: 'px' },
          width: { value: 110, unit: 'px' },
          height: { value: 22, unit: 'px' },
          fontSize: '14px',
          textAlign: 'left',
        },
        '160x600': {
          positionX: { value: 20, unit: 'px' },
          positionY: { value: 20, unit: 'px' },
          width: { value: 120, unit: 'px' },
          height: { value: 25, unit: 'px' },
          fontSize: '16px',
          textAlign: 'left',
        },
      },
      content: '<strong>TECH</strong>NOVA',
      styles: {
        color: '#00d4ff',
        fontFamily: 'Montserrat',
        opacity: 1,
      },
    },
    {
      id: `sa-${crypto.randomUUID()}`,
      label: 'Product Image',
      type: 'image',
      locked: false,
      aspectRatioLocked: true,
      attributes: { id: 'product' },
      sizeConfig: {
        '300x250': {
          positionX: { value: 90, unit: 'px' },
          positionY: { value: 45, unit: 'px' },
          width: { value: 120, unit: 'px' },
          height: { value: 80, unit: 'px' },
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 0.8, unit: 's' },
              delay: { value: 0.3, unit: 's' },
              easing: 'ease-in-out',
            },
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 2',
              type: 'scale',
              from: { value: 0.8, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 0.8, unit: 's' },
              delay: { value: 0.3, unit: 's' },
              easing: 'ease-out',
            },
          ],
        },
        '336x280': {
          positionX: { value: 108, unit: 'px' },
          positionY: { value: 50, unit: 'px' },
          width: { value: 120, unit: 'px' },
          height: { value: 80, unit: 'px' },
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 0.8, unit: 's' },
              delay: { value: 0.3, unit: 's' },
              easing: 'ease-in-out',
            },
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 2',
              type: 'scale',
              from: { value: 0.8, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 0.8, unit: 's' },
              delay: { value: 0.3, unit: 's' },
              easing: 'ease-out',
            },
          ],
        },
        '728x90': {
          positionX: { value: 530, unit: 'px' },
          positionY: { value: 5, unit: 'px' },
          width: { value: 75, unit: 'px' },
          height: { value: 80, unit: 'px' },
        },
        '160x600': {
          positionX: { value: 20, unit: 'px' },
          positionY: { value: 60, unit: 'px' },
          width: { value: 120, unit: 'px' },
          height: { value: 80, unit: 'px' },
        },
      },
      url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      styles: {
        opacity: 1,
        objectFit: 'contain',
      },
    },
    {
      id: `sa-${crypto.randomUUID()}`,
      label: 'Headline',
      type: 'richtext',
      locked: false,
      aspectRatioLocked: false,
      attributes: { id: 'headline' },
      sizeConfig: {
        '300x250': {
          positionX: { value: 10, unit: 'px' },
          positionY: { value: 130, unit: 'px' },
          width: { value: 280, unit: 'px' },
          height: { value: 38, unit: 'px' },
          fontSize: '20px',
          textAlign: 'center',
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 0.8, unit: 's' },
              delay: { value: 0.6, unit: 's' },
              easing: 'ease-in-out',
            },
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 2',
              type: 'slideUp',
              from: { value: 20, unit: 'px' },
              duration: { value: 0.6, unit: 's' },
              delay: { value: 0.6, unit: 's' },
              easing: 'ease-out',
            },
          ],
        },
        '336x280': {
          positionX: { value: 10, unit: 'px' },
          positionY: { value: 138, unit: 'px' },
          width: { value: 316, unit: 'px' },
          height: { value: 42, unit: 'px' },
          fontSize: '22px',
          textAlign: 'center',
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 0.8, unit: 's' },
              delay: { value: 0.6, unit: 's' },
              easing: 'ease-in-out',
            },
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 2',
              type: 'slideUp',
              from: { value: 20, unit: 'px' },
              duration: { value: 0.6, unit: 's' },
              delay: { value: 0.6, unit: 's' },
              easing: 'ease-out',
            },
          ],
        },
        '728x90': {
          positionX: { value: 140, unit: 'px' },
          positionY: { value: 8, unit: 'px' },
          width: { value: 240, unit: 'px' },
          height: { value: 28, unit: 'px' },
          fontSize: '16px',
          textAlign: 'center',
        },
        '160x600': {
          positionX: { value: 10, unit: 'px' },
          positionY: { value: 150, unit: 'px' },
          width: { value: 140, unit: 'px' },
          height: { value: 60, unit: 'px' },
          fontSize: '18px',
          textAlign: 'center',
        },
      },
      content: '<strong>Introducing</strong> <span style="color: #00d4ff;">Next Gen</span>',
      styles: {
        color: '#ffffff',
        fontFamily: 'Roboto',
        opacity: 1,
      },
    },
    {
      id: `sa-${crypto.randomUUID()}`,
      label: 'Features',
      type: 'text',
      locked: false,
      aspectRatioLocked: false,
      attributes: { id: 'features' },
      sizeConfig: {
        '300x250': {
          positionX: { value: 50, unit: 'px' },
          positionY: { value: 170, unit: 'px' },
          width: { value: 200, unit: 'px' },
          height: { value: 48, unit: 'px' },
          fontSize: '11px',
          textAlign: 'left',
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 0.8, unit: 's' },
              delay: { value: 0.9, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
        },
        '336x280': {
          positionX: { value: 65, unit: 'px' },
          positionY: { value: 185, unit: 'px' },
          width: { value: 206, unit: 'px' },
          height: { value: 50, unit: 'px' },
          fontSize: '12px',
          textAlign: 'left',
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 0.8, unit: 's' },
              delay: { value: 0.9, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
        },
        '728x90': {
          positionX: { value: 140, unit: 'px' },
          positionY: { value: 40, unit: 'px' },
          width: { value: 380, unit: 'px' },
          height: { value: 40, unit: 'px' },
          fontSize: '9px',
          textAlign: 'left',
        },
        '160x600': {
          positionX: { value: 15, unit: 'px' },
          positionY: { value: 218, unit: 'px' },
          width: { value: 130, unit: 'px' },
          height: { value: 72, unit: 'px' },
          fontSize: '11px',
          textAlign: 'left',
        },
      },
      content: '⚡ Lightning Fast\n🔒 Ultra Secure\n🤖 AI Powered',
      styles: {
        color: '#b8c1ec',
        fontFamily: 'Inter',
        opacity: 1,
      },
    },
    {
      id: `sa-${crypto.randomUUID()}`,
      label: 'CTA Button',
      type: 'button',
      locked: false,
      aspectRatioLocked: false,
      attributes: { id: 'cta' },
      sizeConfig: {
        '300x250': {
          positionX: { value: 85, unit: 'px' },
          positionY: { value: 205, unit: 'px' },
          width: { value: 130, unit: 'px' },
          height: { value: 34, unit: 'px' },
          fontSize: '13px',
          borderRadius: { topLeft: 17, topRight: 17, bottomLeft: 17, bottomRight: 17 },
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 0.6, unit: 's' },
              delay: { value: 1.2, unit: 's' },
              easing: 'ease-in-out',
            },
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 2',
              type: 'slideUp',
              from: { value: 15, unit: 'px' },
              duration: { value: 0.5, unit: 's' },
              delay: { value: 1.2, unit: 's' },
              easing: 'ease-out',
            },
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 3',
              type: 'scale',
              from: { value: 0.95, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 0.4, unit: 's' },
              delay: { value: 1.3, unit: 's' },
              easing: 'ease-out',
            },
          ],
          animationLoopDelay: { value: 6, unit: 's' },
          animationResetDuration: { value: 0.2, unit: 's' },
        },
        '336x280': {
          positionX: { value: 103, unit: 'px' },
          positionY: { value: 235, unit: 'px' },
          width: { value: 130, unit: 'px' },
          height: { value: 35, unit: 'px' },
          fontSize: '14px',
          borderRadius: { topLeft: 20, topRight: 20, bottomLeft: 20, bottomRight: 20 },
          animations: [
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 1',
              type: 'fadeIn',
              from: { value: 0, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 0.6, unit: 's' },
              delay: { value: 1.2, unit: 's' },
              easing: 'ease-in-out',
            },
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 2',
              type: 'slideUp',
              from: { value: 15, unit: 'px' },
              duration: { value: 0.5, unit: 's' },
              delay: { value: 1.2, unit: 's' },
              easing: 'ease-out',
            },
            {
              id: `sa-${crypto.randomUUID()}`,
              name: 'Animation 3',
              type: 'scale',
              from: { value: 0.95, unit: '' },
              to: { value: 1, unit: '' },
              duration: { value: 0.4, unit: 's' },
              delay: { value: 1.3, unit: 's' },
              easing: 'ease-out',
            },
          ],
          animationLoopDelay: { value: 6, unit: 's' },
          animationResetDuration: { value: 0.2, unit: 's' },
        },
        '728x90': {
          positionX: { value: 615, unit: 'px' },
          positionY: { value: 25, unit: 'px' },
          width: { value: 105, unit: 'px' },
          height: { value: 40, unit: 'px' },
          fontSize: '12px',
          borderRadius: { topLeft: 20, topRight: 20, bottomLeft: 20, bottomRight: 20 },
        },
        '160x600': {
          positionX: { value: 15, unit: 'px' },
          positionY: { value: 298, unit: 'px' },
          width: { value: 130, unit: 'px' },
          height: { value: 36, unit: 'px' },
          fontSize: '13px',
          borderRadius: { topLeft: 18, topRight: 18, bottomLeft: 18, bottomRight: 18 },
        },
      },
      text: 'Pre-Order Now',
      actionType: 'link',
      url: 'https://www.example.com',
      icon: { type: 'none', position: 'before' },
      styles: {
        backgroundColor: '#667eea',
        color: '#ffffff',
        fontFamily: 'Roboto',
        opacity: 1,
      },
    },
    {
      id: `sa-${crypto.randomUUID()}`,
      label: 'Background Gradient',
      type: 'image',
      locked: true,
      aspectRatioLocked: false,
      attributes: { id: 'bg-gradient' },
      sizeConfig: {
        '300x250': {
          positionX: { value: 0, unit: 'px' },
          positionY: { value: 0, unit: 'px' },
          width: { value: 300, unit: 'px' },
          height: { value: 250, unit: 'px' },
        },
        '336x280': {
          positionX: { value: 0, unit: 'px' },
          positionY: { value: 0, unit: 'px' },
          width: { value: 336, unit: 'px' },
          height: { value: 280, unit: 'px' },
        },
        '728x90': {
          positionX: { value: 0, unit: 'px' },
          positionY: { value: 0, unit: 'px' },
          width: { value: 728, unit: 'px' },
          height: { value: 90, unit: 'px' },
        },
        '160x600': {
          positionX: { value: 0, unit: 'px' },
          positionY: { value: 0, unit: 'px' },
          width: { value: 160, unit: 'px' },
          height: { value: 600, unit: 'px' },
        },
      },
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
      styles: {
        opacity: 0.3,
        objectFit: 'cover',
      },
    },
  ],
  animationLoop: -1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
