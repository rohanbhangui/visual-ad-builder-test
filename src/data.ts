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
  from?: string | number; // Start value
  to?: string | number; // End value
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
  animations?: Animation[]; // Animations for this size
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
    textAlign?: 'left' | 'center' | 'right';
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
    textAlign?: 'left' | 'center' | 'right';
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
  url: string;
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
  animationLoopDelay?: { value: number; unit: 'ms' | 's' }; // Delay between loop iterations
  createdAt: Date;
  updatedAt: Date;
}

// Sample data with 4-5 layers
export const sampleCanvas: Canvas = {
  id: crypto.randomUUID(),
  name: 'Sample HTML5 Ad',
  allowedSizes: ['300x250', '336x280', '728x90', '160x600'],
  styles: {
    backgroundColor: '#ffffff',
  },
  layers: [
    {
      id: crypto.randomUUID(),
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
          animations: [
            {
              id: crypto.randomUUID(),
              name: 'Animation 1',
              type: 'fadeIn',
              from: 0,
              to: 1,
              duration: { value: 1, unit: 's' },
              delay: { value: 0.1, unit: 's' },
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
          animations: [
            {
              id: crypto.randomUUID(),
              name: 'Animation 1',
              type: 'fadeIn',
              from: 0,
              to: 1,
              duration: { value: 1, unit: 's' },
              delay: { value: 0.1, unit: 's' },
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
        },
        '160x600': {
          positionX: { value: 10, unit: 'px' },
          positionY: { value: 244, unit: 'px' },
          width: { value: 140, unit: 'px' },
          height: { value: 40, unit: 'px' },
          fontSize: '20px',
        },
      },
      content: '<strong>Holiday Sale!</strong>',
      styles: {
        color: '#ff0000',
        fontFamily: 'Playfair Display',
        textAlign: 'center',
        opacity: 1,
      },
    },
    {
      id: crypto.randomUUID(),
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
          animations: [
            {
              id: crypto.randomUUID(),
              name: 'Animation 1',
              type: 'fadeIn',
              from: 0,
              to: 1,
              duration: { value: 1, unit: 's' },
              delay: { value: 0.2, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
        },
        '336x280': {
          positionX: { value: 21, unit: 'px' },
          positionY: { value: 177, unit: 'px' },
          width: { value: 294, unit: 'px' },
          height: { value: 36, unit: 'px' },
          fontSize: '14px',
          animations: [
            {
              id: crypto.randomUUID(),
              name: 'Animation 1',
              type: 'fadeIn',
              from: 0,
              to: 1,
              duration: { value: 1, unit: 's' },
              delay: { value: 0.2, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
        },
        '728x90': {
          positionX: { value: 98, unit: 'px' },
          positionY: { value: 45, unit: 'px' },
          width: { value: 284, unit: 'px' },
          height: { value: 36, unit: 'px' },
          fontSize: '14px',
        },
        '160x600': {
          positionX: { value: 10, unit: 'px' },
          positionY: { value: 284, unit: 'px' },
          width: { value: 140, unit: 'px' },
          height: { value: 53, unit: 'px' },
          fontSize: '14px',
        },
      },
      content: 'Get 50% off on your first purchase.\nLimited time offer!',
      styles: {
        color: '#000000',
        fontFamily: 'Arial',
        textAlign: 'center',
        opacity: 1,
      },
    },
    {
      id: crypto.randomUUID(),
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
              id: crypto.randomUUID(),
              name: 'Animation 1',
              type: 'fadeIn',
              from: 0,
              to: 1,
              duration: { value: 1, unit: 's' },
              delay: { value: 0, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
        },
        '336x280': {
          positionX: { value: 69, unit: 'px' },
          positionY: { value: 5, unit: '%' },
          width: { value: 198, unit: 'px' },
          height: { value: 111, unit: 'px' },
          animations: [
            {
              id: crypto.randomUUID(),
              name: 'Animation 1',
              type: 'fadeIn',
              from: 0,
              to: 1,
              duration: { value: 1, unit: 's' },
              delay: { value: 0, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
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
      id: crypto.randomUUID(),
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
          animations: [
            {
              id: crypto.randomUUID(),
              name: 'Animation 1',
              type: 'fadeIn',
              from: 0,
              to: 1,
              duration: { value: 1, unit: 's' },
              delay: { value: 0.3, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
        },
        '336x280': {
          positionX: { value: 120, unit: 'px' },
          positionY: { value: 230, unit: 'px' },
          width: { value: 100, unit: 'px' },
          height: { value: 32, unit: 'px' },
          fontSize: '14px',
          animations: [
            {
              id: crypto.randomUUID(),
              name: 'Animation 1',
              type: 'fadeIn',
              from: 0,
              to: 1,
              duration: { value: 1, unit: 's' },
              delay: { value: 0.3, unit: 's' },
              easing: 'ease-in-out',
            },
          ],
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
      url: 'https://www.google.com',
      styles: {
        backgroundColor: '#0d821b',
        color: '#ffffff',
        fontFamily: 'Arial',
        opacity: 1,
      },
    },
    {
      id: crypto.randomUUID(),
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
      },
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};
