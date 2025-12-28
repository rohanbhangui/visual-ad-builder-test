import { v4 as uuidv4 } from 'uuid';
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
  unit?: 'px'; // Primarily px for ad dimensions
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
  positionX: Partial<Record<AdSize, Size>>; // Keyed by ad size
  positionY: Partial<Record<AdSize, Size>>; // Keyed by ad size
  width: Partial<Record<AdSize, Size>>; // Keyed by ad size
  height: Partial<Record<AdSize, Size>>; // Keyed by ad size
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  styles: {
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
  createdAt: Date;
  updatedAt: Date;
}

// Sample data with 4-5 layers
export const sampleCanvas: Canvas = {
  id: uuidv4(),
  name: 'Sample HTML5 Ad',
  allowedSizes: ['300x250', '336x280', '728x90', '160x600'],
  styles: {
    backgroundColor: '#ffffff',
  },
  layers: [
    {
      id: uuidv4(),
      label: 'Headline',
      type: 'richtext',
      locked: false,
      aspectRatioLocked: false,
      attributes: { id: '' },
      positionX: {
        '300x250': { value: 10, unit: 'px' },
        '336x280': { value: 10, unit: 'px' },
        '728x90': { value: 124, unit: 'px' },
        '160x600': { value: 10, unit: 'px' },
      },
      positionY: {
        '300x250': { value: 121, unit: 'px' },
        '336x280': { value: 142, unit: 'px' },
        '728x90': { value: 17, unit: 'px' },
        '160x600': { value: 244, unit: 'px' },
      },
      width: {
        '300x250': { value: 280, unit: 'px' },
        '336x280': { value: 316, unit: 'px' },
        '728x90': { value: 234, unit: 'px' },
        '160x600': { value: 140, unit: 'px' },
      },
      height: {
        '300x250': { value: 35, unit: 'px' },
        '336x280': { value: 35, unit: 'px' },
        '728x90': { value: 30, unit: 'px' },
        '160x600': { value: 40, unit: 'px' },
      },
      content: '<strong>Holiday Sale!</strong>',
      styles: {
        color: '#ff0000',
        fontSize: '20px',
        fontFamily: 'Playfair Display',
        textAlign: 'center',
        opacity: 1,
      },
    },
    {
      id: uuidv4(),
      label: 'Description',
      type: 'text',
      locked: false,
      aspectRatioLocked: false,
      attributes: { id: '' },
      positionX: {
        '300x250': { value: 10, unit: 'px' },
        '336x280': { value: 21, unit: 'px' },
        '728x90': { value: 98, unit: 'px' },
        '160x600': { value: 10, unit: 'px' },
      },
      positionY: {
        '300x250': { value: 156, unit: 'px' },
        '336x280': { value: 177, unit: 'px' },
        '728x90': { value: 45, unit: 'px' },
        '160x600': { value: 284, unit: 'px' },
      },
      width: {
        '300x250': { value: 280, unit: 'px' },
        '336x280': { value: 294, unit: 'px' },
        '728x90': { value: 284, unit: 'px' },
        '160x600': { value: 140, unit: 'px' },
      },
      height: {
        '300x250': { value: 50, unit: 'px' },
        '336x280': { value: 53, unit: 'px' },
        '728x90': { value: 40, unit: 'px' },
        '160x600': { value: 70, unit: 'px' },
      },
      content: 'Get 50% off on your first purchase.\nLimited time offer!',
      styles: {
        color: '#000000',
        fontSize: '14px',
        fontFamily: 'Arial',
        textAlign: 'center',
        opacity: 1,
      },
    },
    {
      id: uuidv4(),
      label: 'Demo Video',
      type: 'video',
      locked: false,
      aspectRatioLocked: true,
      attributes: { id: '' },
      positionX: {
        '300x250': { value: 68, unit: 'px' },
        '336x280': { value: 69, unit: 'px' },
        '728x90': { value: 568, unit: 'px' },
        '160x600': { value: -100, unit: 'px' },
      },
      positionY: {
        '300x250': { value: 19, unit: 'px' },
        '336x280': { value: 21, unit: 'px' },
        '728x90': { value: 0, unit: 'px' },
        '160x600': { value: 0, unit: 'px' },
      },
      width: {
        '300x250': { value: 164, unit: 'px' },
        '336x280': { value: 198, unit: 'px' },
        '728x90': { value: 160, unit: 'px' },
        '160x600': { value: 360.8, unit: 'px' },
      },
      height: {
        '300x250': { value: 92, unit: 'px' },
        '336x280': { value: 111, unit: 'px' },
        '728x90': { value: 90, unit: 'px' },
        '160x600': { value: 201, unit: 'px' },
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
      id: uuidv4(),
      label: 'CTA Button',
      type: 'button',
      locked: false,
      aspectRatioLocked: false,
      attributes: { id: '' },
      positionX: {
        '300x250': { value: 100, unit: 'px' },
        '336x280': { value: 120, unit: 'px' },
        '728x90': { value: 421, unit: 'px' },
        '160x600': { value: 30, unit: 'px' },
      },
      positionY: {
        '300x250': { value: 206, unit: 'px' },
        '336x280': { value: 230, unit: 'px' },
        '728x90': { value: 29, unit: 'px' },
        '160x600': { value: 364, unit: 'px' },
      },
      width: {
        '300x250': { value: 100, unit: 'px' },
        '336x280': { value: 100, unit: 'px' },
        '728x90': { value: 100, unit: 'px' },
        '160x600': { value: 100, unit: 'px' },
      },
      height: {
        '300x250': { value: 32, unit: 'px' },
        '336x280': { value: 32, unit: 'px' },
        '728x90': { value: 32, unit: 'px' },
        '160x600': { value: 32, unit: 'px' },
      },
      text: 'Shop Now',
      url: 'https://www.google.com',
      styles: {
        backgroundColor: '#0d821b',
        color: '#ffffff',
        fontSize: '14px',
        fontFamily: 'Arial',
        opacity: 1,
      },
    },
    {
      id: uuidv4(),
      label: 'Background Image',
      type: 'image',
      locked: true,
      aspectRatioLocked: false,
      attributes: { id: '' },
      positionX: {
        '300x250': { value: 0, unit: 'px' },
        '336x280': { value: 0, unit: 'px' },
        '728x90': { value: 0, unit: 'px' },
        '160x600': { value: 0, unit: 'px' },
      },
      positionY: {
        '300x250': { value: 0, unit: 'px' },
        '336x280': { value: 0, unit: 'px' },
        '728x90': { value: 0, unit: 'px' },
        '160x600': { value: 0, unit: 'px' },
      },
      width: {
        '300x250': { value: 300, unit: 'px' },
        '336x280': { value: 336, unit: 'px' },
        '728x90': { value: 728, unit: 'px' },
        '160x600': { value: 160, unit: 'px' },
      },
      height: {
        '300x250': { value: 250, unit: 'px' },
        '336x280': { value: 280, unit: 'px' },
        '728x90': { value: 90, unit: 'px' },
        '160x600': { value: 600, unit: 'px' },
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
