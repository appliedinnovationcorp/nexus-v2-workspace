'use client';

import React, { useEffect, useRef, ReactNode } from 'react';

interface AriaLiveProps {
  children: ReactNode;
  priority?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  busy?: boolean;
  className?: string;
}

export const AriaLive: React.FC<AriaLiveProps> = ({
  children,
  priority = 'polite',
  atomic = true,
  relevant = 'all',
  busy = false,
  className = '',
}) => {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      aria-busy={busy}
      className={`aria-live ${className}`}
    >
      {children}
    </div>
  );
};

// Status announcer for dynamic content
interface StatusAnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number; // milliseconds
}

export const StatusAnnouncer: React.FC<StatusAnnouncerProps> = ({
  message,
  priority = 'polite',
  clearAfter = 5000,
}) => {
  const [currentMessage, setCurrentMessage] = React.useState(message);

  useEffect(() => {
    setCurrentMessage(message);
    
    if (clearAfter > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);
      
      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <AriaLive priority={priority} className="sr-only">
      {currentMessage}
    </AriaLive>
  );
};

// Progress announcer
interface ProgressAnnouncerProps {
  value: number;
  max?: number;
  label?: string;
  announceInterval?: number; // Announce every N percent
}

export const ProgressAnnouncer: React.FC<ProgressAnnouncerProps> = ({
  value,
  max = 100,
  label = 'Progress',
  announceInterval = 10,
}) => {
  const [lastAnnounced, setLastAnnounced] = React.useState(0);
  const percentage = Math.round((value / max) * 100);

  const shouldAnnounce = 
    percentage >= lastAnnounced + announceInterval || 
    percentage === 100 || 
    percentage === 0;

  useEffect(() => {
    if (shouldAnnounce) {
      setLastAnnounced(percentage);
    }
  }, [percentage, shouldAnnounce]);

  const message = shouldAnnounce 
    ? `${label}: ${percentage}% complete`
    : '';

  return (
    <AriaLive priority="polite" className="sr-only">
      {message}
    </AriaLive>
  );
};

// Loading announcer
interface LoadingAnnouncerProps {
  loading: boolean;
  loadingText?: string;
  completeText?: string;
  errorText?: string;
  error?: boolean;
}

export const LoadingAnnouncer: React.FC<LoadingAnnouncerProps> = ({
  loading,
  loadingText = 'Loading...',
  completeText = 'Loading complete',
  errorText = 'Loading failed',
  error = false,
}) => {
  const [message, setMessage] = React.useState('');
  const previousLoading = useRef(loading);

  useEffect(() => {
    if (loading && !previousLoading.current) {
      setMessage(loadingText);
    } else if (!loading && previousLoading.current) {
      setMessage(error ? errorText : completeText);
      
      // Clear message after announcement
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
    
    previousLoading.current = loading;
  }, [loading, error, loadingText, completeText, errorText]);

  return (
    <AriaLive priority={error ? 'assertive' : 'polite'} className="sr-only">
      {message}
    </AriaLive>
  );
};

// Form validation announcer
interface ValidationAnnouncerProps {
  errors: string[];
  fieldName?: string;
}

export const ValidationAnnouncer: React.FC<ValidationAnnouncerProps> = ({
  errors,
  fieldName,
}) => {
  const [message, setMessage] = React.useState('');

  useEffect(() => {
    if (errors.length > 0) {
      const errorMessage = fieldName 
        ? `${fieldName}: ${errors.join(', ')}`
        : errors.join(', ');
      setMessage(errorMessage);
      
      // Clear after announcement
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    } else {
      setMessage('');
    }
  }, [errors, fieldName]);

  return (
    <AriaLive priority="assertive" className="sr-only">
      {message}
    </AriaLive>
  );
};
