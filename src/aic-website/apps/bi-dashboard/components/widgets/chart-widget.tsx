'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Download, Maximize2, RefreshCw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ChartWidgetProps {
  title: string;
  type: 'line' | 'area' | 'bar' | 'pie' | 'funnel' | 'map';
  data: any[];
  loading?: boolean;
  error?: Error | null;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  stacked?: boolean;
  colors?: string[];
  onRefresh?: () => void;
  onExport?: (format: 'png' | 'svg' | 'csv') => void;
  onFullscreen?: () => void;
}

const DEFAULT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export function ChartWidget({
  title,
  type,
  data,
  loading = false,
  error = null,
  height = 300,
  showLegend = false,
  showTooltip = true,
  stacked = false,
  colors = DEFAULT_COLORS,
  onRefresh,
  onExport,
  onFullscreen,
}: ChartWidgetProps) {
  const chartColors = useMemo(() => colors.slice(0, 10), [colors]);

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <LoadingSpinner size="md" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <ErrorMessage
            title="Chart Error"
            message={error.message}
            onRetry={onRefresh}
          />
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center text-gray-500" style={{ height }}>
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>No data available</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              {showTooltip && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
              )}
              {showLegend && <Legend />}
              {Object.keys(data[0] || {})
                .filter(key => key !== 'date' && key !== 'name')
                .map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={chartColors[index % chartColors.length]}
                    strokeWidth={2}
                    dot={{ fill: chartColors[index % chartColors.length], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: chartColors[index % chartColors.length], strokeWidth: 2 }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              {Object.keys(data[0] || {})
                .filter(key => key !== 'date' && key !== 'name')
                .map((key, index) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId={stacked ? "1" : undefined}
                    stroke={chartColors[index % chartColors.length]}
                    fill={chartColors[index % chartColors.length]}
                    fillOpacity={0.6}
                  />
                ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              {Object.keys(data[0] || {})
                .filter(key => key !== 'name' && key !== 'date')
                .map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId={stacked ? "1" : undefined}
                    fill={chartColors[index % chartColors.length]}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={Math.min(height * 0.35, 120)}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || chartColors[index % chartColors.length]} 
                  />
                ))}
              </Pie>
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'funnel':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <FunnelChart>
              <Tooltip />
              <Funnel
                dataKey="value"
                data={data}
                isAnimationActive
                fill={chartColors[0]}
              >
                <LabelList position="center" fill="#fff" stroke="none" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        );

      case 'map':
        // For map visualization, you would integrate with a mapping library like Leaflet or Mapbox
        return (
          <div className="flex items-center justify-center text-gray-500" style={{ height }}>
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p>Map visualization coming soon</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center text-gray-500" style={{ height }}>
            <p>Unsupported chart type: {type}</p>
          </div>
        );
    }
  };

  return (
    <Card className="widget-container">
      <CardHeader className="widget-header flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <div className="flex items-center space-x-1">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onFullscreen && (
                <DropdownMenuItem onClick={onFullscreen}>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  Fullscreen
                </DropdownMenuItem>
              )}
              {onExport && (
                <>
                  <DropdownMenuItem onClick={() => onExport('png')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('svg')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export as SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('csv')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="widget-content p-0">
        {renderChart()}
      </CardContent>
    </Card>
  );
}
