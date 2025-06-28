'use client';

import React, { useEffect, useRef, ReactNode } from 'react';

// Keyboard navigation hook
export const useKeyboardNavigation = (
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void
) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        if (onEnter) {
          e.preventDefault();
          onEnter();
        }
        break;
      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        break;
      case 'ArrowUp':
        if (onArrowKeys) {
          e.preventDefault();
          onArrowKeys('up');
        }
        break;
      case 'ArrowDown':
        if (onArrowKeys) {
          e.preventDefault();
          onArrowKeys('down');
        }
        break;
      case 'ArrowLeft':
        if (onArrowKeys) {
          e.preventDefault();
          onArrowKeys('left');
        }
        break;
      case 'ArrowRight':
        if (onArrowKeys) {
          e.preventDefault();
          onArrowKeys('right');
        }
        break;
    }
  };

  return { onKeyDown: handleKeyDown };
};

// Roving tabindex for lists and grids
interface RovingTabindexProps {
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical' | 'both';
  wrap?: boolean;
  className?: string;
}

export const RovingTabindex: React.FC<RovingTabindexProps> = ({
  children,
  orientation = 'vertical',
  wrap = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentIndex = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(
      container.querySelectorAll('[role="option"], [role="tab"], [role="menuitem"], button, a')
    ) as HTMLElement[];

    if (items.length === 0) return;

    // Set initial tabindex
    items.forEach((item, index) => {
      item.tabIndex = index === 0 ? 0 : -1;
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const currentItemIndex = items.indexOf(target);
      
      if (currentItemIndex === -1) return;

      let nextIndex = currentItemIndex;

      switch (e.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentItemIndex + 1;
            if (nextIndex >= items.length) {
              nextIndex = wrap ? 0 : items.length - 1;
            }
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentItemIndex - 1;
            if (nextIndex < 0) {
              nextIndex = wrap ? items.length - 1 : 0;
            }
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentItemIndex + 1;
            if (nextIndex >= items.length) {
              nextIndex = wrap ? 0 : items.length - 1;
            }
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentItemIndex - 1;
            if (nextIndex < 0) {
              nextIndex = wrap ? items.length - 1 : 0;
            }
          }
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = items.length - 1;
          break;
      }

      if (nextIndex !== currentItemIndex) {
        // Update tabindex
        items[currentItemIndex].tabIndex = -1;
        items[nextIndex].tabIndex = 0;
        items[nextIndex].focus();
        currentIndex.current = nextIndex;
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [orientation, wrap]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

// Accessible button component with keyboard support
interface AccessibleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onClick,
  onKeyDown,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  type = 'button',
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled && onClick) {
        onClick();
      }
    }
    onKeyDown?.(e);
  };

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`accessible-button ${className} ${disabled ? 'disabled' : ''}`}
    >
      {children}
    </button>
  );
};

// Keyboard shortcut component
interface KeyboardShortcutProps {
  keys: string[];
  onActivate: () => void;
  description: string;
  global?: boolean;
}

export const KeyboardShortcut: React.FC<KeyboardShortcutProps> = ({
  keys,
  onActivate,
  description,
  global = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const pressedKeys = [];
      
      if (e.ctrlKey) pressedKeys.push('ctrl');
      if (e.altKey) pressedKeys.push('alt');
      if (e.shiftKey) pressedKeys.push('shift');
      if (e.metaKey) pressedKeys.push('meta');
      
      pressedKeys.push(e.key.toLowerCase());

      const normalizedKeys = keys.map(k => k.toLowerCase());
      
      if (pressedKeys.length === normalizedKeys.length &&
          pressedKeys.every(key => normalizedKeys.includes(key))) {
        e.preventDefault();
        onActivate();
      }
    };

    if (global) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [keys, onActivate, global]);

  return null; // This component doesn't render anything
};
