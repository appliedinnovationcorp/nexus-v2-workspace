'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';

// Types
export interface JourneyStage {
  id: string;
  name: string;
  description: string;
  order: number;
  color: string;
  icon: string;
  touchpoints: Touchpoint[];
  metrics: StageMetrics;
  duration?: number; // Average time spent in stage (days)
}

export interface Touchpoint {
  id: string;
  name: string;
  type: 'digital' | 'physical' | 'social' | 'support' | 'marketing';
  channel: string;
  description: string;
  stageId: string;
  position: { x: number; y: number };
  metrics: TouchpointMetrics;
  sentiment?: 'positive' | 'neutral' | 'negative';
  importance: 'high' | 'medium' | 'low';
}

export interface StageMetrics {
  conversionRate: number;
  dropOffRate: number;
  averageTime: number;
  customerCount: number;
  satisfaction: number;
  engagement: number;
}

export interface TouchpointMetrics {
  interactions: number;
  conversionRate: number;
  satisfaction: number;
  effectiveness: number;
  cost: number;
  roi: number;
}

export interface Journey {
  id: string;
  name: string;
  description: string;
  personaId: string;
  stages: JourneyStage[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'archived';
  version: number;
}

export interface JourneyAnalytics {
  totalCustomers: number;
  averageJourneyTime: number;
  overallConversionRate: number;
  customerSatisfaction: number;
  topPerformingStages: string[];
  bottleneckStages: string[];
  optimizationOpportunities: OptimizationOpportunity[];
}

export interface OptimizationOpportunity {
  id: string;
  type: 'conversion' | 'satisfaction' | 'efficiency' | 'cost';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number;
  effort: number;
  stageId?: string;
  touchpointId?: string;
}

// State
interface JourneyState {
  journeys: Journey[];
  currentJourney: Journey | null;
  analytics: JourneyAnalytics | null;
  selectedStage: JourneyStage | null;
  selectedTouchpoint: Touchpoint | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    personaId?: string;
    dateRange: { start: Date; end: Date };
    status?: string;
  };
}

// Actions
type JourneyAction =
  | { type: 'SET_JOURNEYS'; payload: Journey[] }
  | { type: 'SET_CURRENT_JOURNEY'; payload: Journey | null }
  | { type: 'SET_ANALYTICS'; payload: JourneyAnalytics }
  | { type: 'SET_SELECTED_STAGE'; payload: JourneyStage | null }
  | { type: 'SET_SELECTED_TOUCHPOINT'; payload: Touchpoint | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<JourneyState['filters']> }
  | { type: 'UPDATE_JOURNEY'; payload: Journey }
  | { type: 'ADD_JOURNEY'; payload: Journey }
  | { type: 'DELETE_JOURNEY'; payload: string };

// Reducer
function journeyReducer(state: JourneyState, action: JourneyAction): JourneyState {
  switch (action.type) {
    case 'SET_JOURNEYS':
      return { ...state, journeys: action.payload };
    case 'SET_CURRENT_JOURNEY':
      return { ...state, currentJourney: action.payload };
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    case 'SET_SELECTED_STAGE':
      return { ...state, selectedStage: action.payload };
    case 'SET_SELECTED_TOUCHPOINT':
      return { ...state, selectedTouchpoint: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'UPDATE_JOURNEY':
      return {
        ...state,
        journeys: state.journeys.map(j => j.id === action.payload.id ? action.payload : j),
        currentJourney: state.currentJourney?.id === action.payload.id ? action.payload : state.currentJourney,
      };
    case 'ADD_JOURNEY':
      return { ...state, journeys: [...state.journeys, action.payload] };
    case 'DELETE_JOURNEY':
      return {
        ...state,
        journeys: state.journeys.filter(j => j.id !== action.payload),
        currentJourney: state.currentJourney?.id === action.payload ? null : state.currentJourney,
      };
    default:
      return state;
  }
}

// Initial state
const initialState: JourneyState = {
  journeys: [],
  currentJourney: null,
  analytics: null,
  selectedStage: null,
  selectedTouchpoint: null,
  isLoading: false,
  error: null,
  filters: {
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    },
  },
};

// Context
interface JourneyContextType extends JourneyState {
  // Actions
  setCurrentJourney: (journey: Journey | null) => void;
  setSelectedStage: (stage: JourneyStage | null) => void;
  setSelectedTouchpoint: (touchpoint: Touchpoint | null) => void;
  setFilters: (filters: Partial<JourneyState['filters']>) => void;
  
  // API actions
  createJourney: (journey: Omit<Journey, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<void>;
  updateJourney: (journey: Journey) => Promise<void>;
  deleteJourney: (journeyId: string) => Promise<void>;
  duplicateJourney: (journeyId: string) => Promise<void>;
  
  // Analytics
  refreshAnalytics: () => Promise<void>;
  
  // Utility functions
  getJourneyById: (id: string) => Journey | undefined;
  getStageById: (journeyId: string, stageId: string) => JourneyStage | undefined;
  getTouchpointById: (journeyId: string, touchpointId: string) => Touchpoint | undefined;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

// Mock API functions (replace with real API calls)
const mockApiDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchJourneys = async (): Promise<Journey[]> => {
  await mockApiDelay(1000);
  // Mock data - replace with real API call
  return [
    {
      id: '1',
      name: 'SMB Customer Journey',
      description: 'Journey for small and medium business customers',
      personaId: 'smb-decision-maker',
      status: 'active',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stages: [
        {
          id: 'awareness',
          name: 'Awareness',
          description: 'Customer becomes aware of our solution',
          order: 1,
          color: '#f59e0b',
          icon: 'eye',
          touchpoints: [],
          metrics: {
            conversionRate: 25,
            dropOffRate: 75,
            averageTime: 7,
            customerCount: 1000,
            satisfaction: 3.5,
            engagement: 65,
          },
        },
        {
          id: 'consideration',
          name: 'Consideration',
          description: 'Customer evaluates our solution',
          order: 2,
          color: '#3b82f6',
          icon: 'search',
          touchpoints: [],
          metrics: {
            conversionRate: 40,
            dropOffRate: 60,
            averageTime: 14,
            customerCount: 250,
            satisfaction: 4.0,
            engagement: 75,
          },
        },
        {
          id: 'decision',
          name: 'Decision',
          description: 'Customer makes purchase decision',
          order: 3,
          color: '#10b981',
          icon: 'check-circle',
          touchpoints: [],
          metrics: {
            conversionRate: 60,
            dropOffRate: 40,
            averageTime: 21,
            customerCount: 100,
            satisfaction: 4.2,
            engagement: 85,
          },
        },
      ],
    },
  ];
};

const fetchJourneyAnalytics = async (journeyId: string): Promise<JourneyAnalytics> => {
  await mockApiDelay(800);
  return {
    totalCustomers: 1350,
    averageJourneyTime: 42,
    overallConversionRate: 15,
    customerSatisfaction: 3.9,
    topPerformingStages: ['decision', 'consideration'],
    bottleneckStages: ['awareness'],
    optimizationOpportunities: [
      {
        id: '1',
        type: 'conversion',
        priority: 'high',
        title: 'Improve Awareness Stage Conversion',
        description: 'Add more targeted content to increase awareness stage conversion rate',
        impact: 8.5,
        effort: 6.0,
        stageId: 'awareness',
      },
    ],
  };
};

// Provider component
export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(journeyReducer, initialState);
  const queryClient = useQueryClient();

  // Fetch journeys
  const { data: journeys, isLoading: journeysLoading } = useQuery(
    'journeys',
    fetchJourneys,
    {
      onSuccess: (data) => {
        dispatch({ type: 'SET_JOURNEYS', payload: data });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load journeys');
      },
    }
  );

  // Fetch analytics for current journey
  const { data: analytics, isLoading: analyticsLoading } = useQuery(
    ['journey-analytics', state.currentJourney?.id],
    () => state.currentJourney ? fetchJourneyAnalytics(state.currentJourney.id) : null,
    {
      enabled: !!state.currentJourney,
      onSuccess: (data) => {
        if (data) {
          dispatch({ type: 'SET_ANALYTICS', payload: data });
        }
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load analytics');
      },
    }
  );

  // Mutations
  const createJourneyMutation = useMutation(
    async (journey: Omit<Journey, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
      await mockApiDelay(1000);
      const newJourney: Journey = {
        ...journey,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };
      return newJourney;
    },
    {
      onSuccess: (newJourney) => {
        dispatch({ type: 'ADD_JOURNEY', payload: newJourney });
        toast.success('Journey created successfully');
      },
      onError: (error: any) => {
        toast.error('Failed to create journey');
      },
    }
  );

  const updateJourneyMutation = useMutation(
    async (journey: Journey) => {
      await mockApiDelay(800);
      return { ...journey, updatedAt: new Date().toISOString() };
    },
    {
      onSuccess: (updatedJourney) => {
        dispatch({ type: 'UPDATE_JOURNEY', payload: updatedJourney });
        toast.success('Journey updated successfully');
      },
      onError: (error: any) => {
        toast.error('Failed to update journey');
      },
    }
  );

  const deleteJourneyMutation = useMutation(
    async (journeyId: string) => {
      await mockApiDelay(500);
      return journeyId;
    },
    {
      onSuccess: (journeyId) => {
        dispatch({ type: 'DELETE_JOURNEY', payload: journeyId });
        toast.success('Journey deleted successfully');
      },
      onError: (error: any) => {
        toast.error('Failed to delete journey');
      },
    }
  );

  // Update loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: journeysLoading || analyticsLoading });
  }, [journeysLoading, analyticsLoading]);

  // Context value
  const contextValue: JourneyContextType = {
    ...state,
    
    // Actions
    setCurrentJourney: (journey) => dispatch({ type: 'SET_CURRENT_JOURNEY', payload: journey }),
    setSelectedStage: (stage) => dispatch({ type: 'SET_SELECTED_STAGE', payload: stage }),
    setSelectedTouchpoint: (touchpoint) => dispatch({ type: 'SET_SELECTED_TOUCHPOINT', payload: touchpoint }),
    setFilters: (filters) => dispatch({ type: 'SET_FILTERS', payload: filters }),
    
    // API actions
    createJourney: createJourneyMutation.mutateAsync,
    updateJourney: updateJourneyMutation.mutateAsync,
    deleteJourney: deleteJourneyMutation.mutateAsync,
    duplicateJourney: async (journeyId: string) => {
      const journey = state.journeys.find(j => j.id === journeyId);
      if (journey) {
        await createJourneyMutation.mutateAsync({
          ...journey,
          name: `${journey.name} (Copy)`,
          status: 'draft',
        });
      }
    },
    
    // Analytics
    refreshAnalytics: async () => {
      if (state.currentJourney) {
        await queryClient.invalidateQueries(['journey-analytics', state.currentJourney.id]);
      }
    },
    
    // Utility functions
    getJourneyById: (id: string) => state.journeys.find(j => j.id === id),
    getStageById: (journeyId: string, stageId: string) => {
      const journey = state.journeys.find(j => j.id === journeyId);
      return journey?.stages.find(s => s.id === stageId);
    },
    getTouchpointById: (journeyId: string, touchpointId: string) => {
      const journey = state.journeys.find(j => j.id === journeyId);
      if (!journey) return undefined;
      
      for (const stage of journey.stages) {
        const touchpoint = stage.touchpoints.find(t => t.id === touchpointId);
        if (touchpoint) return touchpoint;
      }
      return undefined;
    },
  };

  return (
    <JourneyContext.Provider value={contextValue}>
      {children}
    </JourneyContext.Provider>
  );
}

// Hook
export function useJourney() {
  const context = useContext(JourneyContext);
  if (context === undefined) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }
  return context;
}
