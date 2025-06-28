import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'white' | 'red' | 'yellow' | 'green';
}

export function LoadingSpinner({ size = 'md', className, color = 'primary' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'border-primary border-t-transparent',
    white: 'border-white border-t-transparent',
    red: 'border-red-500 border-t-transparent',
    yellow: 'border-yellow-500 border-t-transparent',
    green: 'border-green-500 border-t-transparent',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
}
