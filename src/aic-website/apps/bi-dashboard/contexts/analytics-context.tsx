'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { io, Socket } from 'socket.io-client';
import { analyticsApi } from '@/lib/api/analytics';
import { toast } from 'react-hot-toast';

interface AnalyticsMetrics {
  revenue: {
    total: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
    chartData: Array<{ date: string; value: number }>;
  };
  users: {
    active: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
    acquisitionData: Array<{ date: string; organic: number; paid: number; referral: number }>;
  };
  conversion: {
    rate: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  satisfaction: {
    score: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  traffic: {
    sources: Array<{ name: string; value: number; color: string }>;
  };
  performance: {
    data: Array<{ name: string; response_time: number; throughput: number; errors: number }>;
  };
  pages: {
    topPerforming: Array<{
      page: string;
      views: number;
      conversion: number;
      revenue: number;
    }>;
  };
  customers: {
    segments: Array<{
      segment: string;
      count: number;
      value: number;
      growth: number;
    }>;
  };
  geography: {
    distribution: Array<{ country: string; value: number; coordinates: [number, number] }>;
  };
  funnel: {
    steps: Array<{ name: string; value: number; conversion: number }>;
  };
  activity: {
    recent: Array<{
      timestamp: string;
      user: string;
      action: string;
      details: string;
      status: 'success' | 'warning' | 'error';
    }>;
  };
}

interface InsightItem {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  recommendations?: string[];
}

interface AnalyticsContextType {
  metrics: AnalyticsMetrics | null;
  insights: InsightItem[];
  realtimeData: Record<string, any>;
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  refreshData: (filters?: any) => void;
  subscribeToMetric: (metric: string, callback: (data: any) => void) => () => void;
  generateInsights: (options?: any) => Promise<InsightItem[]>;
  exportData: (format: 'csv' | 'pdf' | 'excel', data: any) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeData, setRealtimeData] = useState<Record<string, any>>({});
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const queryClient = useQueryClient();

  // Fetch analytics metrics
  const {
    data: metrics,
    isLoading,
    error,
    refetch: refetchMetrics,
  } = useQuery(
    'analytics-metrics',
    () => analyticsApi.getMetrics(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchIntervalInBackground: true,
      onError: (error) => {
        console.error('Analytics metrics error:', error);
        toast.error('Failed to load analytics data');
      },
    }
  );

  // Fetch AI insights
  const { data: insightsData } = useQuery(
    'analytics-insights',
    () => analyticsApi.getInsights(),
    {
      refetchInterval: 300000, // Refetch every 5 minutes
      onSuccess: (data) => {
        setInsights(data || []);
      },
      onError: (error) => {
        console.error('Analytics insights error:', error);
      },
    }
  );

  // Initialize WebSocket connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001';
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Analytics WebSocket connected');
      
      // Subscribe to real-time metrics
      socketInstance.emit('subscribe', {
        metrics: ['revenue', 'users', 'conversion', 'performance'],
        events: ['user_action', 'system_alert', 'business_event'],
      });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Analytics WebSocket disconnected');
    });

    socketInstance.on('metric', (data) => {
      setRealtimeData(prev => ({
        ...prev,
        [data.metric]: data,
      }));
      
      // Update query cache with real-time data
      queryClient.setQueryData('analytics-metrics', (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          [data.metric]: {
            ...oldData[data.metric],
            ...data,
          },
        };
      });
    });

    socketInstance.on('insight', (insight: InsightItem) => {
      setInsights(prev => [insight, ...prev.slice(0, 9)]); // Keep last 10 insights
      
      // Show notification for high-impact insights
      if (insight.impact === 'high' || insight.impact === 'critical') {
        toast.success(`New ${insight.impact} impact insight: ${insight.title}`);
      }
    });

    socketInstance.on('alert', (alert) => {
      toast.error(`System Alert: ${alert.message}`);
    });

    socketInstance.on('error', (error) => {
      console.error('Analytics WebSocket error:', error);
      toast.error('Real-time connection error');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [queryClient]);

  // Refresh data function
  const refreshData = useCallback(async (filters?: any) => {
    try {
      await refetchMetrics();
      await queryClient.refetchQueries('analytics-insights');
      
      if (filters) {
        // Apply filters and refetch with new parameters
        queryClient.setQueryData('analytics-filters', filters);
      }
      
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Data refresh error:', error);
      toast.error('Failed to refresh data');
    }
  }, [refetchMetrics, queryClient]);

  // Subscribe to specific metric updates
  const subscribeToMetric = useCallback((metric: string, callback: (data: any) => void) => {
    if (!socket) return () => {};

    const handler = (data: any) => {
      if (data.metric === metric) {
        callback(data);
      }
    };

    socket.on('metric', handler);

    return () => {
      socket.off('metric', handler);
    };
  }, [socket]);

  // Generate AI insights
  const generateInsights = useCallback(async (options?: any): Promise<InsightItem[]> => {
    try {
      const newInsights = await analyticsApi.generateInsights(options);
      setInsights(prev => [...newInsights, ...prev].slice(0, 20)); // Keep last 20 insights
      return newInsights;
    } catch (error) {
      console.error('Generate insights error:', error);
      toast.error('Failed to generate insights');
      throw error;
    }
  }, []);

  // Export data function
  const exportData = useCallback(async (format: 'csv' | 'pdf' | 'excel', data: any) => {
    try {
      await analyticsApi.exportData(format, data);
      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export data error:', error);
      toast.error('Failed to export data');
      throw error;
    }
  }, []);

  const contextValue: AnalyticsContextType = {
    metrics: metrics || null,
    insights,
    realtimeData,
    isLoading,
    error: error as Error | null,
    isConnected,
    refreshData,
    subscribeToMetric,
    generateInsights,
    exportData,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}
