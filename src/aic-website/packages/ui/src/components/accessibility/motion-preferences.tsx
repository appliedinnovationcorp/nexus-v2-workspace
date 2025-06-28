'use client';

import React, { useEffect, useState, ReactNode } from 'react';

// Hook to detect user's motion preferences
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Motion-aware component wrapper
interface MotionWrapperProps {
  children: ReactNode;
  reducedMotionFallback?: ReactNode;
  className?: string;
}

export const MotionWrapper: React.FC<MotionWrapperProps> = ({
  children,
  reducedMotionFallback,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={`motion-wrapper ${prefersReducedMotion ? 'reduced-motion' : ''} ${className}`}>
      {prefersReducedMotion && reducedMotionFallback ? reducedMotionFallback : children}
    </div>
  );
};

// Animated component with motion preferences
interface AnimatedElementProps {
  children: ReactNode;
  animation: 'fade' | 'slide' | 'scale' | 'bounce' | 'spin';
  duration?: number;
  delay?: number;
  className?: string;
}

export const AnimatedElement: React.FC<AnimatedElementProps> = ({
  children,
  animation,
  duration = 300,
  delay = 0,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const animationClass = prefersReducedMotion ? '' : `animate-${animation}`;
  const durationStyle = prefersReducedMotion ? {} : { animationDuration: `${duration}ms` };

  return (
    <div
      className={`animated-element ${animationClass} ${isVisible ? 'visible' : ''} ${className}`}
      style={durationStyle}
    >
      {children}
    </div>
  );
};

// Parallax component with motion preferences
interface ParallaxProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  speed = 0.5,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      setOffset(window.pageYOffset * speed);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, prefersReducedMotion]);

  const transform = prefersReducedMotion ? 'none' : `translateY(${offset}px)`;

  return (
    <div
      className={`parallax ${className}`}
      style={{ transform }}
    >
      {children}
    </div>
  );
};

// Auto-playing media with motion preferences
interface AutoPlayMediaProps {
  src: string;
  type: 'video' | 'gif';
  alt?: string;
  staticFallback?: string;
  className?: string;
}

export const AutoPlayMedia: React.FC<AutoPlayMediaProps> = ({
  src,
  type,
  alt = '',
  staticFallback,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [userPreference, setUserPreference] = useState<'auto' | 'static' | null>(null);

  const shouldShowStatic = prefersReducedMotion || userPreference === 'static';
  const shouldShowAuto = !prefersReducedMotion && userPreference !== 'static';

  return (
    <div className={`auto-play-media ${className}`}>
      {shouldShowStatic && staticFallback ? (
        <img src={staticFallback} alt={alt} className="static-fallback" />
      ) : shouldShowAuto ? (
        type === 'video' ? (
          <video
            src={src}
            autoPlay
            muted
            loop
            playsInline
            className="auto-play-video"
          />
        ) : (
          <img src={src} alt={alt} className="auto-play-gif" />
        )
      ) : (
        <img src={staticFallback || src} alt={alt} />
      )}
      
      {prefersReducedMotion && (
        <div className="motion-controls">
          <button
            onClick={() => setUserPreference(userPreference === 'auto' ? 'static' : 'auto')}
            className="motion-toggle-btn"
            aria-label={userPreference === 'auto' ? 'Pause animation' : 'Play animation'}
          >
            {userPreference === 'auto' ? '⏸️ Pause' : '▶️ Play'}
          </button>
        </div>
      )}
    </div>
  );
};

// Scroll-triggered animation with motion preferences
interface ScrollAnimationProps {
  children: ReactNode;
  animation: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scaleIn';
  threshold?: number;
  className?: string;
}

export const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
  children,
  animation,
  threshold = 0.1,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, prefersReducedMotion]);

  return (
    <div
      ref={elementRef}
      className={`scroll-animation ${animation} ${isVisible ? 'visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

// Motion preference toggle
interface MotionToggleProps {
  onToggle?: (enabled: boolean) => void;
  className?: string;
}

export const MotionToggle: React.FC<MotionToggleProps> = ({
  onToggle,
  className = '',
}) => {
  const systemPrefersReduced = useReducedMotion();
  const [userPreference, setUserPreference] = useState<boolean | null>(null);

  const currentlyReduced = userPreference !== null ? userPreference : systemPrefersReduced;

  const handleToggle = () => {
    const newValue = !currentlyReduced;
    setUserPreference(newValue);
    onToggle?.(newValue);

    // Apply to document
    document.documentElement.classList.toggle('reduce-motion', newValue);
  };

  return (
    <div className={`motion-toggle ${className}`}>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={currentlyReduced}
          onChange={handleToggle}
          className="sr-only"
        />
        <div className={`toggle-switch ${currentlyReduced ? 'on' : 'off'}`}>
          <div className="toggle-handle" />
        </div>
        <span>Reduce motion and animations</span>
      </label>
      
      {systemPrefersReduced && (
        <p className="text-sm text-gray-600 mt-1">
          System preference: Reduce motion
        </p>
      )}
    </div>
  );
};
