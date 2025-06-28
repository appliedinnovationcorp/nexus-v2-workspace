'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percentage';
  icon?: LucideIcon;
  className?: string;
  loading?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
}

export function MetricCard({
  title,
  value,
  previousValue,
  format = 'number',
  icon: Icon,
  className,
  loading = false,
  color = 'blue',
}: MetricCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return formatPercentage(val);
      default:
        return formatNumber(val);
    }
  };

  const calculateChange = () => {
    if (previousValue === undefined || previousValue === 0) return null;
    return ((value - previousValue) / previousValue) * 100;
  };

  const change = calculateChange();
  const isPositive = change !== null && change > 0;
  const isNegative = change !== null && change < 0;
  const isNeutral = change !== null && change === 0;

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  const iconColorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    purple: 'text-purple-500',
    gray: 'text-gray-500',
  };

  if (loading) {
    return (
      <div className={cn(
        'bg-white rounded-lg border border-gray-200 p-6 shadow-sm',
        className
      )}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow',
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
        {Icon && (
          <div className={cn(
            'p-2 rounded-lg',
            colorClasses[color]
          )}>
            <Icon className={cn('h-5 w-5', iconColorClasses[color])} />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {formatValue(value)}
          </p>
          
          {change !== null && (
            <div className="flex items-center mt-2">
              {isPositive && (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600">
                    +{formatPercentage(Math.abs(change))}
                  </span>
                </>
              )}
              {isNegative && (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm font-medium text-red-600">
                    -{formatPercentage(Math.abs(change))}
                  </span>
                </>
              )}
              {isNeutral && (
                <>
                  <Minus className="h-4 w-4 text-gray-500 mr-1" />
                  <span className="text-sm font-medium text-gray-600">
                    {formatPercentage(0)}
                  </span>
                </>
              )}
              <span className="text-xs text-gray-500 ml-2">vs last period</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
