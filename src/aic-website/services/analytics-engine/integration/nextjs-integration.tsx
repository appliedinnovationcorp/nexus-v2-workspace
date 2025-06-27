/**
 * Next.js Integration for Analytics Engine
 * React components and hooks for easy integration
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

// Types
interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

interface MetricValue {
  metric: string;
  value: number;
  timestamp: Date;
  dimensions?: Record<string, string>;
}

interface AnalyticsContextType {
  track: (event: string, properties?: Record<string, any>) => Promise<void>;
  getMetrics: (metrics: string[], timeRange: { start: Date; end: Date }) => Promise<MetricValue[]>;
  subscribe: (metrics: string[], callback: (metric: MetricValue) => void) => () => void;
  isConnected: boolean;
}

// Context
const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

// Provider Props
interface AnalyticsProviderProps {
  children: ReactNode;
  apiUrl: string;
  apiKey: string;
  userId?: string;
  sessionId?: string;
}

// Analytics Provider Component
export function AnalyticsProvider({
  children,
  apiUrl,
  apiKey,
  userId,
  sessionId
}: AnalyticsProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    const socketInstance = io(apiUrl, {
      auth: {
        token: apiKey
      },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Analytics WebSocket connected');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Analytics WebSocket disconnected');
    });

    socketInstance.on('error', (error) => {
      console.error('Analytics WebSocket error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [apiUrl, apiKey]);

  // Track event function
  const track = async (event: string, properties: Record<string, any> = {}) => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          event,
          properties,
          userId,
          sessionId,
          timestamp: new Date().toISOString(),
          source: 'nextjs'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to track event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  // Get metrics function
  const getMetrics = async (
    metrics: string[],
    timeRange: { start: Date; end: Date }
  ): Promise<MetricValue[]> => {
    try {
      const params = new URLSearchParams({
        metrics: metrics.join(','),
        startDate: timeRange.start.toISOString(),
        endDate: timeRange.end.toISOString()
      });

      const response = await fetch(`${apiUrl}/api/v1/metrics?${params}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get metrics: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return [];
    }
  };

  // Subscribe to real-time metrics
  const subscribe = (
    metrics: string[],
    callback: (metric: MetricValue) => void
  ): (() => void) => {
    if (!socket) {
      console.warn('WebSocket not connected');
      return () => {};
    }

    // Subscribe to metrics
    socket.emit('subscribe', { metrics });

    // Listen for metric updates
    const handleMetric = (metric: MetricValue) => {
      if (metrics.includes(metric.metric)) {
        callback(metric);
      }
    };

    socket.on('metric', handleMetric);

    // Return unsubscribe function
    return () => {
      socket.off('metric', handleMetric);
      socket.emit('unsubscribe', { metrics });
    };
  };

  const contextValue: AnalyticsContextType = {
    track,
    getMetrics,
    subscribe,
    isConnected
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Hook to use analytics
export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

// Hook for tracking page views
export function usePageTracking() {
  const { track } = useAnalytics();

  useEffect(() => {
    const handleRouteChange = () => {
      track('page_view', {
        page: window.location.pathname,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      });
    };

    // Track initial page load
    handleRouteChange();

    // Listen for route changes (Next.js specific)
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleRouteChange);
      
      // For Next.js App Router
      const originalPushState = history.pushState;
      history.pushState = function(...args) {
        originalPushState.apply(history, args);
        setTimeout(handleRouteChange, 0);
      };

      return () => {
        window.removeEventListener('popstate', handleRouteChange);
        history.pushState = originalPushState;
      };
    }
  }, [track]);
}

// Real-time Metrics Component
interface RealTimeMetricsProps {
  metrics: string[];
  refreshInterval?: number;
  children: (data: { metrics: MetricValue[]; isLoading: boolean }) => ReactNode;
}

export function RealTimeMetrics({
  metrics,
  refreshInterval = 5000,
  children
}: RealTimeMetricsProps) {
  const { subscribe, getMetrics } = useAnalytics();
  const [metricsData, setMetricsData] = useState<MetricValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial load
    const loadInitialData = async () => {
      setIsLoading(true);
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const data = await getMetrics(metrics, {
        start: oneHourAgo,
        end: now
      });
      
      setMetricsData(data);
      setIsLoading(false);
    };

    loadInitialData();

    // Subscribe to real-time updates
    const unsubscribe = subscribe(metrics, (metric) => {
      setMetricsData(prev => {
        const updated = [...prev];
        const existingIndex = updated.findIndex(m => m.metric === metric.metric);
        
        if (existingIndex >= 0) {
          updated[existingIndex] = metric;
        } else {
          updated.push(metric);
        }
        
        return updated;
      });
    });

    // Periodic refresh
    const interval = setInterval(loadInitialData, refreshInterval);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [metrics, refreshInterval, subscribe, getMetrics]);

  return <>{children({ metrics: metricsData, isLoading })}</>;
}

// Event Tracking Component
interface EventTrackerProps {
  event: string;
  properties?: Record<string, any>;
  trigger?: 'click' | 'hover' | 'focus' | 'submit';
  children: ReactNode;
}

export function EventTracker({
  event,
  properties = {},
  trigger = 'click',
  children
}: EventTrackerProps) {
  const { track } = useAnalytics();

  const handleEvent = () => {
    track(event, {
      ...properties,
      timestamp: new Date().toISOString(),
      trigger
    });
  };

  const eventHandlers = {
    click: { onClick: handleEvent },
    hover: { onMouseEnter: handleEvent },
    focus: { onFocus: handleEvent },
    submit: { onSubmit: handleEvent }
  };

  return (
    <div {...eventHandlers[trigger]}>
      {children}
    </div>
  );
}

// Analytics Dashboard Component
interface AnalyticsDashboardProps {
  dashboardId: string;
  className?: string;
}

export function AnalyticsDashboard({
  dashboardId,
  className = ''
}: AnalyticsDashboardProps) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getMetrics } = useAnalytics();

  useEffect(() => {
    // Load dashboard configuration
    const loadDashboard = async () => {
      try {
        // This would fetch the dashboard configuration
        // For now, we'll use a mock dashboard
        const mockDashboard = {
          id: dashboardId,
          name: 'Analytics Dashboard',
          widgets: [
            {
              id: 'widget1',
              type: 'metric',
              title: 'Page Views',
              metric: 'page_views',
              timeRange: '24h'
            },
            {
              id: 'widget2',
              type: 'metric',
              title: 'Unique Visitors',
              metric: 'unique_visitors',
              timeRange: '24h'
            }
          ]
        };

        setDashboard(mockDashboard);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [dashboardId]);

  if (isLoading) {
    return <div className={`analytics-dashboard ${className}`}>Loading...</div>;
  }

  if (!dashboard) {
    return <div className={`analytics-dashboard ${className}`}>Dashboard not found</div>;
  }

  return (
    <div className={`analytics-dashboard ${className}`}>
      <h2>{dashboard.name}</h2>
      <div className="dashboard-widgets">
        {dashboard.widgets.map((widget: any) => (
          <div key={widget.id} className="dashboard-widget">
            <h3>{widget.title}</h3>
            <RealTimeMetrics metrics={[widget.metric]}>
              {({ metrics, isLoading }) => (
                <div className="widget-content">
                  {isLoading ? (
                    <div>Loading...</div>
                  ) : (
                    <div className="metric-value">
                      {metrics.find(m => m.metric === widget.metric)?.value || 0}
                    </div>
                  )}
                </div>
              )}
            </RealTimeMetrics>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export all components and hooks
export default {
  AnalyticsProvider,
  useAnalytics,
  usePageTracking,
  RealTimeMetrics,
  EventTracker,
  AnalyticsDashboard
};
