'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, Percent, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import numeral from 'numeral';

interface KPIWidgetProps {
  title: string;
  value: number;
  change: number;
  format: 'currency' | 'number' | 'percentage' | 'score';
  trend: 'up' | 'down' | 'stable';
  loading?: boolean;
  subtitle?: string;
  target?: number;
  className?: string;
}

const formatValue = (value: number, format: string): string => {
  switch (format) {
    case 'currency':
      return numeral(value).format('$0,0.00');
    case 'number':
      return numeral(value).format('0,0');
    case 'percentage':
      return numeral(value / 100).format('0.00%');
    case 'score':
      return numeral(value).format('0.0');
    default:
      return value.toString();
  }
};

const formatChange = (change: number): string => {
  const absChange = Math.abs(change);
  return numeral(absChange / 100).format('0.0%');
};

const getIcon = (format: string) => {
  switch (format) {
    case 'currency':
      return DollarSign;
    case 'number':
      return Users;
    case 'percentage':
      return Percent;
    case 'score':
      return Star;
    default:
      return Users;
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up':
      return TrendingUp;
    case 'down':
      return TrendingDown;
    default:
      return Minus;
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'up':
      return 'text-success-600';
    case 'down':
      return 'text-danger-600';
    default:
      return 'text-gray-600';
  }
};

const getChangeColor = (change: number) => {
  if (change > 0) return 'text-success-600';
  if (change < 0) return 'text-danger-600';
  return 'text-gray-600';
};

export function KPIWidget({
  title,
  value,
  change,
  format,
  trend,
  loading = false,
  subtitle,
  target,
  className,
}: KPIWidgetProps) {
  const Icon = getIcon(format);
  const TrendIcon = getTrendIcon(trend);
  const trendColor = getTrendColor(trend);
  const changeColor = getChangeColor(change);

  const progressPercentage = target ? Math.min((value / target) * 100, 100) : 0;

  if (loading) {
    return (
      <Card className={cn('metric-card', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-24">
            <LoadingSpinner size="md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('metric-card hover:shadow-medium transition-shadow', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Icon className="h-5 w-5 text-gray-600" />
              <p className="text-sm font-medium text-gray-600">{title}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {formatValue(value, format)}
              </p>
              
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
            </div>

            <div className="flex items-center space-x-2 mt-3">
              <div className={cn('flex items-center space-x-1', changeColor)}>
                <TrendIcon className={cn('h-4 w-4', trendColor)} />
                <span className="text-sm font-medium">
                  {change >= 0 ? '+' : ''}{formatChange(change)}
                </span>
              </div>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>

            {target && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Progress to target</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      progressPercentage >= 100 ? 'bg-success-500' :
                      progressPercentage >= 75 ? 'bg-warning-500' :
                      'bg-primary-500'
                    )}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Current: {formatValue(value, format)}</span>
                  <span>Target: {formatValue(target, format)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Trend visualization */}
          <div className="ml-4">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              trend === 'up' ? 'bg-success-100' :
              trend === 'down' ? 'bg-danger-100' :
              'bg-gray-100'
            )}>
              <TrendIcon className={cn('h-6 w-6', trendColor)} />
            </div>
          </div>
        </div>

        {/* Mini sparkline could go here */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <div className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              trend === 'up' ? 'bg-success-100 text-success-700' :
              trend === 'down' ? 'bg-danger-100 text-danger-700' :
              'bg-gray-100 text-gray-700'
            )}>
              {trend === 'up' ? 'Trending Up' :
               trend === 'down' ? 'Trending Down' :
               'Stable'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
