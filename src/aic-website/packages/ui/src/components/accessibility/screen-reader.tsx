'use client';

import React, { ReactNode } from 'react';

// Screen reader only content
export const ScreenReaderOnly: React.FC<{ children: ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

// Visually hidden but accessible to screen readers
export const VisuallyHidden: React.FC<{ children: ReactNode }> = ({ children }) => (
  <span className="visually-hidden">{children}</span>
);

// Live region for dynamic content announcements
interface LiveRegionProps {
  children: ReactNode;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  priority = 'polite',
  atomic = true,
  relevant = 'all',
}) => (
  <div
    aria-live={priority}
    aria-atomic={atomic}
    aria-relevant={relevant}
    className="sr-only"
  >
    {children}
  </div>
);

// Accessible description component
interface AccessibleDescriptionProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const AccessibleDescription: React.FC<AccessibleDescriptionProps> = ({
  id,
  children,
  className = '',
}) => (
  <div id={id} className={`accessible-description ${className}`}>
    {children}
  </div>
);

// Screen reader announcement hook
export const useScreenReaderAnnouncement = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Clean up after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  };

  return { announce };
};

// Accessible status component
interface AccessibleStatusProps {
  status: 'loading' | 'success' | 'error' | 'idle';
  loadingText?: string;
  successText?: string;
  errorText?: string;
  children?: ReactNode;
}

export const AccessibleStatus: React.FC<AccessibleStatusProps> = ({
  status,
  loadingText = 'Loading...',
  successText = 'Success',
  errorText = 'Error occurred',
  children,
}) => {
  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return loadingText;
      case 'success':
        return successText;
      case 'error':
        return errorText;
      default:
        return '';
    }
  };

  const statusText = getStatusText();

  return (
    <>
      {statusText && (
        <LiveRegion priority={status === 'error' ? 'assertive' : 'polite'}>
          {statusText}
        </LiveRegion>
      )}
      {children}
    </>
  );
};
