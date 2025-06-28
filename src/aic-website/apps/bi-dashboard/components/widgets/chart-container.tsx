'use client';

import React from 'react';
import { MoreHorizontal, Download, Maximize2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onExport?: (format: 'png' | 'svg' | 'pdf') => void;
  onFullscreen?: () => void;
  actions?: React.ReactNode;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  className,
  loading = false,
  error,
  onRefresh,
  onExport,
  onFullscreen,
  actions,
}: ChartContainerProps) {
  if (loading) {
    return (
      <div className={cn(
        'bg-white rounded-lg border border-gray-200 p-6 shadow-sm',
        className
      )}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
              {subtitle && <div className="h-4 bg-gray-200 rounded w-32"></div>}
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        'bg-white rounded-lg border border-gray-200 p-6 shadow-sm',
        className
      )}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-center">
          <div>
            <div className="text-red-500 mb-2">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {actions}
          
          {/* Action menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRefresh && (
                <DropdownMenuItem onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
              )}
              {onFullscreen && (
                <DropdownMenuItem onClick={onFullscreen}>
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Fullscreen
                </DropdownMenuItem>
              )}
              {onExport && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onExport('png')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('svg')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('pdf')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Chart content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
