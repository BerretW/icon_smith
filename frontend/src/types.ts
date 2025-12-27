export enum AppMode {
  GENERATE = 'GENERATE',
  TRANSFORM = 'TRANSFORM'
}

export type ColorMode = 'bw' | 'color';

export interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
}

export type IconStyle = 'inventory' | 'woodcut' | 'sketch';

// Available Gemini models suitable for image generation/editing
export type GeminiModelId = 
  | 'gemini-2.5-flash-image' 
  | 'gemini-3-pro-image-preview'; // Better quality, higher cost

export interface AppSettings {
  apiKey: string;
  modelId: GeminiModelId;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
}

export interface GenerationConfig {
  prompt: string;
  style: IconStyle;
  colorMode: ColorMode;
  baseImage?: string; 
  mimeType?: string;
}
