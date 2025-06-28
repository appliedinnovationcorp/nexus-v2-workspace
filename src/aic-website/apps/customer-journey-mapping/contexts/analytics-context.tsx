'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';

// Types
export interface JourneyMetrics {
  totalJourneys: number;
  activeCustomers: number;
  completionRate: number;
  averageJourneyTime: number;
  conversionRate: number;
  customerSatisfaction: number;
  dropOffRate: number;
  engagementScore: number;
}

export interface StageAnalytics {
  stageId: string;
  stageName: string;
  customerCount: number;
  conversionRate: number;
  averageTime: number;
  dropOffRate: number;
  satisfaction: number;
  topTouchpoints: string[];
  bottlenecks: string[];
}

export interface TouchpointAnalytics {
  touchpointId: string;
  touchpointName: string;
  type: string;
  interactions: number;
  conversionRate: number;
  satisfaction: number;
  effectiveness: number;
  cost: number;
  roi: number;
}

export interface PersonaPerformance {
  personaId: string;
  personaName: string;
  journeyCount: number;
  conversionRate: number;
  averageValue: number;
  satisfaction: number;
  topStages: string[];
  challenges: string[];
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsData {
  metrics: JourneyMetrics;
  stageAnalytics: StageAnalytics[];
  touchpointAnalytics: TouchpointAnalytics[];
  personaPerformance: PersonaPerformance[];
  trends: {
    conversions: TrendData[];
    satisfaction: TrendData[];
    journeyTime: TrendData[];
    dropOffs: TrendData[];
  };
  insights: AnalyticsInsight[];
}

export interface AnalyticsInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'success' | 'info';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number;
  confidence: number;
  recommendation: string;
  relatedStage?: string;
  relatedTouchpoint?: string;
  relatedPersona?: string;
}

// State
interface AnalyticsState {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    dateRange: { start: Date; end: Date };
    personaIds: string[];
    journeyIds: string[];
    stageIds: string[];
  };
  realTimeEnabled: boolean;
  lastUpdated: Date | null;
}

// Actions
type AnalyticsAction =
  | { type: 'SET_DATA'; payload: AnalyticsData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<AnalyticsState['filters']> }
  | { type: 'SET_REAL_TIME'; payload: boolean }
  | { type: 'SET_LAST_UPDATED'; payload: Date };

// Reducer
function analyticsReducer(state: AnalyticsState, action: AnalyticsAction): AnalyticsState {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_REAL_TIME':
      return { ...state, realTimeEnabled: action.payload };
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.payload };
    default:
      return state;
  }
}

// Initial state
const initialState: AnalyticsState = {
  data: null,
  isLoading: false,
  error: null,
  filters: {
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    },
    personaIds: [],
    journeyIds: [],
    stageIds: [],
  },
  realTimeEnabled: false,
  lastUpdated: null,
};

// Context
interface AnalyticsContextType extends AnalyticsState {
  // Actions
  setFilters: (filters: Partial<AnalyticsState['filters']>) => void;
  setRealTimeEnabled: (enabled: boolean) => void;
  
  // API actions
  refreshData: () => Promise<void>;
  exportData: (format: 'csv' | 'pdf' | 'excel') => Promise<void>;
  
  // Utility functions
  getStageAnalytics: (stageId: string) => StageAnalytics | undefined;
  getTouchpointAnalytics: (touchpointId: string) => TouchpointAnalytics | undefined;
  getPersonaPerformance: (personaId: string) => PersonaPerformance | undefined;
  getInsightsByType: (type: AnalyticsInsight['type']) => AnalyticsInsight[];
  getInsightsByPriority: (priority: AnalyticsInsight['priority']) => AnalyticsInsight[];
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Mock API functions
const mockApiDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchAnalyticsData = async (filters: AnalyticsState['filters']): Promise<AnalyticsData> => {
  await mockApiDelay(1200);
  
  // Generate mock trend data
  const generateTrendData = (baseValue: number, days: number = 30): TrendData[] => {
    const data: TrendData[] = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(0, baseValue * (1 + variation)),
      });
    }
    return data;
  };

  return {
    metrics: {
      totalJourneys: 1247,
      activeCustomers: 3456,
      completionRate: 68.5,
      averageJourneyTime: 42.3,
      conversionRate: 15.8,
      customerSatisfaction: 4.2,
      dropOffRate: 31.5,
      engagementScore: 78.9,
    },
    stageAnalytics: [
      {
        stageId: 'awareness',
        stageName: 'Awareness',
        customerCount: 1000,
        conversionRate: 25.0,
        averageTime: 7.2,
        dropOffRate: 75.0,
        satisfaction: 3.5,
        topTouchpoints: ['Website', 'Social Media', 'Search'],
        bottlenecks: ['Content Discovery', 'Initial Engagement'],
      },
      {
        stageId: 'consideration',
        stageName: 'Consideration',
        customerCount: 250,
        conversionRate: 40.0,
        averageTime: 14.5,
        dropOffRate: 60.0,
        satisfaction: 4.0,
        topTouchpoints: ['Demo', 'Sales Call', 'Documentation'],
        bottlenecks: ['Feature Comparison', 'Pricing Clarity'],
      },
      {
        stageId: 'decision',
        stageName: 'Decision',
        customerCount: 100,
        conversionRate: 60.0,
        averageTime: 21.0,
        dropOffRate: 40.0,
        satisfaction: 4.2,
        topTouchpoints: ['Sales Team', 'Trial', 'References'],
        bottlenecks: ['Contract Negotiation', 'Technical Validation'],
      },
    ],
    touchpointAnalytics: [
      {
        touchpointId: 'website',
        touchpointName: 'Website',
        type: 'digital',
        interactions: 5000,
        conversionRate: 12.5,
        satisfaction: 3.8,
        effectiveness: 75.0,
        cost: 2500,
        roi: 4.2,
      },
      {
        touchpointId: 'demo',
        touchpointName: 'Product Demo',
        type: 'digital',
        interactions: 150,
        conversionRate: 45.0,
        satisfaction: 4.5,
        effectiveness: 85.0,
        cost: 1200,
        roi: 8.5,
      },
      {
        touchpointId: 'sales-call',
        touchpointName: 'Sales Call',
        type: 'physical',
        interactions: 200,
        conversionRate: 35.0,
        satisfaction: 4.3,
        effectiveness: 80.0,
        cost: 3000,
        roi: 6.2,
      },
    ],
    personaPerformance: [
      {
        personaId: 'smb-decision-maker',
        personaName: 'SMB Decision Maker',
        journeyCount: 800,
        conversionRate: 18.5,
        averageValue: 2500,
        satisfaction: 4.1,
        topStages: ['Awareness', 'Decision'],
        challenges: ['Budget Constraints', 'Time Limitations'],
      },
      {
        personaId: 'enterprise-buyer',
        personaName: 'Enterprise Buyer',
        journeyCount: 447,
        conversionRate: 12.0,
        averageValue: 50000,
        satisfaction: 4.4,
        topStages: ['Consideration', 'Decision'],
        challenges: ['Complex Requirements', 'Multiple Stakeholders'],
      },
    ],
    trends: {
      conversions: generateTrendData(15.8),
      satisfaction: generateTrendData(4.2),
      journeyTime: generateTrendData(42.3),
      dropOffs: generateTrendData(31.5),
    },
    insights: [
      {
        id: '1',
        type: 'opportunity',
        priority: 'high',
        title: 'Improve Awareness Stage Conversion',
        description: 'The awareness stage has a 75% drop-off rate, significantly higher than industry average of 60%.',
        impact: 8.5,
        confidence: 85,
        recommendation: 'Implement targeted content strategy and improve initial user experience.',
        relatedStage: 'awareness',
      },
      {
        id: '2',
        type: 'success',
        priority: 'medium',
        title: 'Demo Touchpoint Performing Well',
        description: 'Product demos show 45% conversion rate, well above the 30% target.',
        impact: 6.2,
        confidence: 92,
        recommendation: 'Scale demo program and optimize scheduling process.',
        relatedTouchpoint: 'demo',
      },
      {
        id: '3',
        type: 'warning',
        priority: 'high',
        title: 'Enterprise Persona Conversion Declining',
        description: 'Enterprise buyer conversion rate has dropped 15% over the last month.',
        impact: 7.8,
        confidence: 78,
        recommendation: 'Review enterprise sales process and address identified pain points.',
        relatedPersona: 'enterprise-buyer',
      },
    ],
  };
};

// Provider component
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(analyticsReducer, initialState);
  const queryClient = useQueryClient();

  // Fetch analytics data
  const { data: analyticsData, isLoading, refetch } = useQuery(
    ['analytics-data', state.filters],
    () => fetchAnalyticsData(state.filters),
    {
      refetchInterval: state.realTimeEnabled ? 30000 : false, // Refresh every 30 seconds if real-time enabled
      onSuccess: (data) => {
        dispatch({ type: 'SET_DATA', payload: data });
        dispatch({ type: 'SET_LAST_UPDATED', payload: new Date() });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load analytics data');
      },
    }
  );

  // Export data mutation
  const exportDataMutation = useMutation(
    async (format: 'csv' | 'pdf' | 'excel') => {
      await mockApiDelay(2000);
      // Mock export - in real implementation, this would generate and download the file
      return { success: true, format };
    },
    {
      onSuccess: (result) => {
        toast.success(`Data exported successfully as ${result.format.toUpperCase()}`);
      },
      onError: (error: any) => {
        toast.error('Failed to export data');
      },
    }
  );

  // Update loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  }, [isLoading]);

  // Context value
  const contextValue: AnalyticsContextType = {
    ...state,
    
    // Actions
    setFilters: (filters) => dispatch({ type: 'SET_FILTERS', payload: filters }),
    setRealTimeEnabled: (enabled) => dispatch({ type: 'SET_REAL_TIME', payload: enabled }),
    
    // API actions
    refreshData: async () => {
      await refetch();
    },
    exportData: exportDataMutation.mutateAsync,
    
    // Utility functions
    getStageAnalytics: (stageId: string) => 
      state.data?.stageAnalytics.find(s => s.stageId === stageId),
    getTouchpointAnalytics: (touchpointId: string) => 
      state.data?.touchpointAnalytics.find(t => t.touchpointId === touchpointId),
    getPersonaPerformance: (personaId: string) => 
      state.data?.personaPerformance.find(p => p.personaId === personaId),
    getInsightsByType: (type: AnalyticsInsight['type']) => 
      state.data?.insights.filter(i => i.type === type) || [],
    getInsightsByPriority: (priority: AnalyticsInsight['priority']) => 
      state.data?.insights.filter(i => i.priority === priority) || [],
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Hook
export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}
