'use client';

import React, { useEffect, useState } from 'react';

// Color contrast utilities
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

export const meetsWCAGAA = (foreground: string, background: string): boolean => {
  return getContrastRatio(foreground, background) >= 4.5;
};

export const meetsWCAGAAA = (foreground: string, background: string): boolean => {
  return getContrastRatio(foreground, background) >= 7;
};

// High contrast theme provider
interface HighContrastThemeProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export const HighContrastTheme: React.FC<HighContrastThemeProps> = ({
  children,
  enabled = false,
}) => {
  useEffect(() => {
    const root = document.documentElement;
    
    if (enabled) {
      root.classList.add('high-contrast');
      
      // Apply high contrast CSS custom properties
      root.style.setProperty('--color-text', '#000000');
      root.style.setProperty('--color-background', '#ffffff');
      root.style.setProperty('--color-primary', '#0000ff');
      root.style.setProperty('--color-secondary', '#800080');
      root.style.setProperty('--color-success', '#008000');
      root.style.setProperty('--color-warning', '#ff8c00');
      root.style.setProperty('--color-error', '#ff0000');
      root.style.setProperty('--color-border', '#000000');
      root.style.setProperty('--color-focus', '#ff0000');
    } else {
      root.classList.remove('high-contrast');
      
      // Remove high contrast properties
      root.style.removeProperty('--color-text');
      root.style.removeProperty('--color-background');
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-secondary');
      root.style.removeProperty('--color-success');
      root.style.removeProperty('--color-warning');
      root.style.removeProperty('--color-error');
      root.style.removeProperty('--color-border');
      root.style.removeProperty('--color-focus');
    }
  }, [enabled]);

  return <>{children}</>;
};

// Contrast checker component
interface ContrastCheckerProps {
  foreground: string;
  background: string;
  text?: string;
  showRatio?: boolean;
  className?: string;
}

export const ContrastChecker: React.FC<ContrastCheckerProps> = ({
  foreground,
  background,
  text = 'Sample Text',
  showRatio = false,
  className = '',
}) => {
  const ratio = getContrastRatio(foreground, background);
  const meetsAA = meetsWCAGAA(foreground, background);
  const meetsAAA = meetsWCAGAAA(foreground, background);

  return (
    <div className={`contrast-checker ${className}`}>
      <div
        style={{
          color: foreground,
          backgroundColor: background,
          padding: '12px',
          borderRadius: '4px',
          border: '1px solid #ccc',
        }}
      >
        {text}
      </div>
      
      {showRatio && (
        <div className="contrast-info mt-2 text-sm">
          <p>Contrast Ratio: {ratio.toFixed(2)}:1</p>
          <p>
            WCAG AA: {meetsAA ? '✅ Pass' : '❌ Fail'} (4.5:1 required)
          </p>
          <p>
            WCAG AAA: {meetsAAA ? '✅ Pass' : '❌ Fail'} (7:1 required)
          </p>
        </div>
      )}
    </div>
  );
};

// Auto-adjusting text color based on background
interface AdaptiveTextProps {
  children: React.ReactNode;
  backgroundColor: string;
  lightColor?: string;
  darkColor?: string;
  className?: string;
}

export const AdaptiveText: React.FC<AdaptiveTextProps> = ({
  children,
  backgroundColor,
  lightColor = '#ffffff',
  darkColor = '#000000',
  className = '',
}) => {
  const [textColor, setTextColor] = useState(darkColor);

  useEffect(() => {
    const lightRatio = getContrastRatio(lightColor, backgroundColor);
    const darkRatio = getContrastRatio(darkColor, backgroundColor);
    
    // Choose the color with better contrast
    setTextColor(lightRatio > darkRatio ? lightColor : darkColor);
  }, [backgroundColor, lightColor, darkColor]);

  return (
    <span style={{ color: textColor }} className={className}>
      {children}
    </span>
  );
};

// Color blindness simulation
type ColorBlindnessType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

interface ColorBlindnessSimulatorProps {
  children: React.ReactNode;
  type: ColorBlindnessType;
  enabled?: boolean;
}

export const ColorBlindnessSimulator: React.FC<ColorBlindnessSimulatorProps> = ({
  children,
  type,
  enabled = false,
}) => {
  useEffect(() => {
    const root = document.documentElement;
    
    if (enabled) {
      // Apply CSS filters for color blindness simulation
      const filters = {
        protanopia: 'url(#protanopia)',
        deuteranopia: 'url(#deuteranopia)',
        tritanopia: 'url(#tritanopia)',
        achromatopsia: 'grayscale(100%)',
      };
      
      root.style.filter = filters[type];
    } else {
      root.style.filter = '';
    }

    return () => {
      root.style.filter = '';
    };
  }, [type, enabled]);

  return (
    <>
      {enabled && (
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <filter id="protanopia">
              <feColorMatrix values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0" />
            </filter>
            <filter id="deuteranopia">
              <feColorMatrix values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0" />
            </filter>
            <filter id="tritanopia">
              <feColorMatrix values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0" />
            </filter>
          </defs>
        </svg>
      )}
      {children}
    </>
  );
};
