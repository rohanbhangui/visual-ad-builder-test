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
  positionX: Partial<Record<AdSize, Size>>; // Keyed by ad size
  positionY: Partial<Record<AdSize, Size>>; // Keyed by ad size
  width: Partial<Record<AdSize, Size>>; // Keyed by ad size
  height: Partial<Record<AdSize, Size>>; // Keyed by ad size
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  styles?: {
    color?: string;
    fontSize?: string;
    fontFamily?: FontFamily;
    textAlign?: 'left' | 'center' | 'right';
  };
}

export interface RichtextLayer extends BaseLayer {
  type: 'richtext';
  content: string; // HTML content
  styles?: {
    color?: string;
    fontSize?: string;
    fontFamily?: FontFamily;
    textAlign?: 'left' | 'center' | 'right';
  };
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  url: string;
  styles?: {
    color?: string;
    fontSize?: string;
    objectFit?: string;
  };
}

export interface VideoLayer extends BaseLayer {
  type: 'video';
  url: string;
  properties?: {
    autoplay?: boolean;
    controls?: boolean;
  };
  styles?: {
    color?: string;
    fontSize?: string;
  };
}

export interface ButtonLayer extends BaseLayer {
  type: 'button';
  text: string;
  url: string;
  styles?: {
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
    fontFamily?: FontFamily;
  };
}

// Canvas/Document structure
export interface Canvas {
  id: string;
  name: string;
  allowedSizes: AdSize[];
  layers: LayerContent[];
  createdAt: Date;
  updatedAt: Date;
}

// Sample data with 4-5 layers
export const sampleCanvas: Canvas = {
  id: uuidv4(),
  name: 'Sample HTML5 Ad',
  allowedSizes: ['300x250', '336x280', '728x90'],
  layers: [
    {
      id: uuidv4(),
      label: 'Main Headline',
      type: 'richtext',
      locked: false,
      positionX: {
        '300x250': { value: 10, unit: 'px' },
        '336x280': { value: 10, unit: 'px' },
        '728x90': { value: 10, unit: 'px' },
      },
      positionY: {
        '300x250': { value: 20, unit: 'px' },
        '336x280': { value: 20, unit: 'px' },
        '728x90': { value: 5, unit: 'px' },
      },
      width: {
        '300x250': { value: 280, unit: 'px' },
        '336x280': { value: 316, unit: 'px' },
        '728x90': { value: 462, unit: 'px' },
      },
      height: {
        '300x250': { value: 60, unit: 'px' },
        '336x280': { value: 60, unit: 'px' },
        '728x90': { value: 30, unit: 'px' },
      },
      content: '<strong>Amazing Product</strong>',
      styles: {
        color: '#ff0000',
        fontSize: '20px',
        fontFamily: 'Rubik',
      },
    },
    {
      id: uuidv4(),
      label: 'Description Text',
      type: 'text',
      locked: false,
      positionX: {
        '300x250': { value: 10, unit: 'px' },
        '336x280': { value: 10, unit: 'px' },
        '728x90': { value: 10, unit: 'px' },
      },
      positionY: {
        '300x250': { value: 85, unit: 'px' },
        '336x280': { value: 85, unit: 'px' },
        '728x90': { value: 45, unit: 'px' },
      },
      width: {
        '300x250': { value: 280, unit: 'px' },
        '336x280': { value: 316, unit: 'px' },
        '728x90': { value: 462, unit: 'px' },
      },
      height: {
        '300x250': { value: 50, unit: 'px' },
        '336x280': { value: 80, unit: 'px' },
        '728x90': { value: 40, unit: 'px' },
      },
      content: 'Get 50% off on your first purchase. Limited time offer!',
      styles: {
        color: '#000000',
        fontSize: '14px',
        fontFamily: 'Arial',
      },
    },
    {
      id: uuidv4(),
      label: 'Demo Video',
      type: 'video',
      locked: false,
      positionX: {
        '300x250': { value: 10, unit: 'px' },
        '336x280': { value: 10, unit: 'px' },
        '728x90': { value: 498, unit: 'px' },
      },
      positionY: {
        '300x250': { value: 140, unit: 'px' },
        '336x280': { value: 170, unit: 'px' },
        '728x90': { value: 17, unit: 'px' },
      },
      width: {
        '300x250': { value: 280, unit: 'px' },
        '336x280': { value: 316, unit: 'px' },
        '728x90': { value: 100, unit: 'px' },
      },
      height: {
        '300x250': { value: 50, unit: 'px' },
        '336x280': { value: 50, unit: 'px' },
        '728x90': { value: 56, unit: 'px' },
      },
      url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
      properties: {
        autoplay: true,
        controls: false,
      },
    },
    {
      id: uuidv4(),
      label: 'CTA Button',
      type: 'button',
      locked: false,
      positionX: {
        '300x250': { value: 100, unit: 'px' },
        '336x280': { value: 120, unit: 'px' },
        '728x90': { value: 618, unit: 'px' },
      },
      positionY: {
        '300x250': { value: 206, unit: 'px' },
        '336x280': { value: 230, unit: 'px' },
        '728x90': { value: 29, unit: 'px' },
      },
      width: {
        '300x250': { value: 100, unit: 'px' },
        '336x280': { value: 100, unit: 'px' },
        '728x90': { value: 100, unit: 'px' },
      },
      height: {
        '300x250': { value: 32, unit: 'px' },
        '336x280': { value: 32, unit: 'px' },
        '728x90': { value: 32, unit: 'px' },
      },
      text: 'Shop Now',
      url: 'https://www.google.com',
      styles: {
        backgroundColor: '#333333',
        color: '#ffffff',
        fontSize: '14px',
        fontFamily: 'Arial',
      },
    },
    {
      id: uuidv4(),
      label: 'Background Image',
      type: 'image',
      locked: true,
      positionX: {
        '300x250': { value: 0, unit: 'px' },
        '336x280': { value: 0, unit: 'px' },
        '728x90': { value: 0, unit: 'px' },
      },
      positionY: {
        '300x250': { value: 0, unit: 'px' },
        '336x280': { value: 0, unit: 'px' },
        '728x90': { value: 0, unit: 'px' },
      },
      width: {
        '300x250': { value: 300, unit: 'px' },
        '336x280': { value: 336, unit: 'px' },
        '728x90': { value: 728, unit: 'px' },
      },
      height: {
        '300x250': { value: 250, unit: 'px' },
        '336x280': { value: 280, unit: 'px' },
        '728x90': { value: 90, unit: 'px' },
      },
      url: 'https://images.pexels.com/photos/35025716/pexels-photo-35025716.jpeg',
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};
