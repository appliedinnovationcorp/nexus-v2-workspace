import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// AIC Brand Colors
export const aicColors = {
  primary: {
    blue: '#1A237E',
    teal: '#00BCD4',
    slate: '#37474F',
  },
  secondary: {
    lightGray: '#F5F5F5',
    white: '#FFFFFF',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #1A237E 0%, #00BCD4 100%)',
    subtle: 'linear-gradient(135deg, #37474F 0%, #1A237E 100%)',
    hero: 'linear-gradient(135deg, #1A237E 0%, #00BCD4 50%, #37474F 100%)',
  }
}

// Responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

// Animation utilities
export const animations = {
  fadeIn: 'animate-in fade-in duration-500',
  slideUp: 'animate-in slide-in-from-bottom-4 duration-500',
  slideDown: 'animate-in slide-in-from-top-4 duration-500',
  scaleIn: 'animate-in zoom-in-95 duration-300',
}

// Typography utilities
export const typography = {
  h1: 'text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight',
  h2: 'text-3xl md:text-4xl font-semibold tracking-tight',
  h3: 'text-2xl md:text-3xl font-semibold',
  h4: 'text-xl md:text-2xl font-medium',
  body: 'text-base leading-relaxed',
  caption: 'text-sm text-muted-foreground',
}
