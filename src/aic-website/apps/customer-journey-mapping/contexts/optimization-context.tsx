'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';

// Types
export interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'conversion' | 'satisfaction' | 'efficiency' | 'cost' | 'engagement';
  priority: 'high' | 'medium' | 'low';
  impact: number; // 1-10 scale
  effort: number; // 1-10 scale
  confidence: number; // 0-100 percentage
  estimatedROI: number;
  timeToImplement: number; // days
  relatedStage?: string;
  relatedTouchpoint?: string;
  relatedPersona?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'dismissed';
  createdAt: string;
  updatedAt: string;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  type: 'touchpoint' | 'stage' | 'journey';
  targetId: string; // ID of the stage, touchpoint, or journey being tested
  variants: ABTestVariant[];
  metrics: string[];
  status: 'draft' | 'running' | 'completed' | 'paused';
  startDate?: string;
  endDate?: string;
  results?: ABTestResults;
  createdAt: string;
  updatedAt: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  trafficAllocation: number; // percentage
  changes: Record<string, any>;
}

export interface ABTestResults {
  winner?: string;
  confidence: number;
  improvement: number;
  metrics: Record<string, {
    control: number;
    variant: number;
    improvement: number;
    significance: number;
  }>;
}

export interface OptimizationGoal {
  id: string;
  name: string;
  description: string;
  type: 'conversion' | 'satisfaction' | 'time' | 'cost';
  target: number;
  current: number;
  unit: string;
  deadline?: string;
  relatedStage?: string;
  relatedTouchpoint?: string;
  status: 'active' | 'achieved' | 'missed' | 'paused';
  progress: number; // 0-100 percentage
  createdAt: string;
  updatedAt: string;
}

export interface OptimizationInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  confidence: number;
  dataPoints: string[];
  recommendations: string[];
  createdAt: string;
}

// State
interface OptimizationState {
  recommendations: OptimizationRecommendation[];
  abTests: ABTest[];
  goals: OptimizationGoal[];
  insights: OptimizationInsight[];
  isLoading: boolean;
  error: string | null;
  filters: {
    type?: string;
    priority?: string;
    status?: string;
  };
}

// Actions
type OptimizationAction =
  | { type: 'SET_RECOMMENDATIONS'; payload: OptimizationRecommendation[] }
  | { type: 'SET_AB_TESTS'; payload: ABTest[] }
  | { type: 'SET_GOALS'; payload: OptimizationGoal[] }
  | { type: 'SET_INSIGHTS'; payload: OptimizationInsight[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<OptimizationState['filters']> }
  | { type: 'UPDATE_RECOMMENDATION'; payload: OptimizationRecommendation }
  | { type: 'UPDATE_AB_TEST'; payload: ABTest }
  | { type: 'UPDATE_GOAL'; payload: OptimizationGoal }
  | { type: 'ADD_RECOMMENDATION'; payload: OptimizationRecommendation }
  | { type: 'ADD_AB_TEST'; payload: ABTest }
  | { type: 'ADD_GOAL'; payload: OptimizationGoal };

// Reducer
function optimizationReducer(state: OptimizationState, action: OptimizationAction): OptimizationState {
  switch (action.type) {
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload };
    case 'SET_AB_TESTS':
      return { ...state, abTests: action.payload };
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    case 'SET_INSIGHTS':
      return { ...state, insights: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'UPDATE_RECOMMENDATION':
      return {
        ...state,
        recommendations: state.recommendations.map(r => 
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case 'UPDATE_AB_TEST':
      return {
        ...state,
        abTests: state.abTests.map(t => 
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g => 
          g.id === action.payload.id ? action.payload : g
        ),
      };
    case 'ADD_RECOMMENDATION':
      return { ...state, recommendations: [...state.recommendations, action.payload] };
    case 'ADD_AB_TEST':
      return { ...state, abTests: [...state.abTests, action.payload] };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    default:
      return state;
  }
}

// Initial state
const initialState: OptimizationState = {
  recommendations: [],
  abTests: [],
  goals: [],
  insights: [],
  isLoading: false,
  error: null,
  filters: {},
};

// Context
interface OptimizationContextType extends OptimizationState {
  // Actions
  setFilters: (filters: Partial<OptimizationState['filters']>) => void;
  
  // API actions
  createRecommendation: (recommendation: Omit<OptimizationRecommendation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecommendation: (recommendation: OptimizationRecommendation) => Promise<void>;
  dismissRecommendation: (recommendationId: string) => Promise<void>;
  
  createABTest: (test: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateABTest: (test: ABTest) => Promise<void>;
  startABTest: (testId: string) => Promise<void>;
  stopABTest: (testId: string) => Promise<void>;
  
  createGoal: (goal: Omit<OptimizationGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGoal: (goal: OptimizationGoal) => Promise<void>;
  
  // Analytics
  refreshData: () => Promise<void>;
  generateRecommendations: () => Promise<void>;
  
  // Utility functions
  getRecommendationsByPriority: (priority: 'high' | 'medium' | 'low') => OptimizationRecommendation[];
  getActiveABTests: () => ABTest[];
  getActiveGoals: () => OptimizationGoal[];
  getInsightsBySeverity: (severity: 'high' | 'medium' | 'low') => OptimizationInsight[];
}

const OptimizationContext = createContext<OptimizationContextType | undefined>(undefined);

// Mock API functions
const mockApiDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchOptimizationData = async () => {
  await mockApiDelay(1000);
  
  const recommendations: OptimizationRecommendation[] = [
    {
      id: '1',
      title: 'Optimize Awareness Stage Content',
      description: 'Improve content strategy to reduce 75% drop-off rate in awareness stage',
      type: 'conversion',
      priority: 'high',
      impact: 8.5,
      effort: 6.0,
      confidence: 85,
      estimatedROI: 3.2,
      timeToImplement: 14,
      relatedStage: 'awareness',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Streamline Demo Scheduling',
      description: 'Reduce friction in demo scheduling process to increase conversion',
      type: 'efficiency',
      priority: 'medium',
      impact: 6.5,
      effort: 4.0,
      confidence: 78,
      estimatedROI: 2.1,
      timeToImplement: 7,
      relatedTouchpoint: 'demo',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Personalize Enterprise Journey',
      description: 'Create tailored journey experience for enterprise personas',
      type: 'satisfaction',
      priority: 'high',
      impact: 7.8,
      effort: 8.0,
      confidence: 72,
      estimatedROI: 4.5,
      timeToImplement: 21,
      relatedPersona: 'enterprise-buyer',
      status: 'in-progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const abTests: ABTest[] = [
    {
      id: '1',
      name: 'Homepage CTA Test',
      description: 'Testing different call-to-action buttons on homepage',
      hypothesis: 'A more prominent CTA will increase click-through rate',
      type: 'touchpoint',
      targetId: 'website',
      variants: [
        {
          id: 'control',
          name: 'Control',
          description: 'Current blue button',
          trafficAllocation: 50,
          changes: {},
        },
        {
          id: 'variant-a',
          name: 'Variant A',
          description: 'Green button with different text',
          trafficAllocation: 50,
          changes: { color: 'green', text: 'Get Started Now' },
        },
      ],
      metrics: ['click_through_rate', 'conversion_rate'],
      status: 'running',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const goals: OptimizationGoal[] = [
    {
      id: '1',
      name: 'Increase Overall Conversion Rate',
      description: 'Improve journey conversion rate from 15.8% to 20%',
      type: 'conversion',
      target: 20,
      current: 15.8,
      unit: '%',
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      progress: 35,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Reduce Average Journey Time',
      description: 'Decrease average journey time from 42 to 35 days',
      type: 'time',
      target: 35,
      current: 42.3,
      unit: 'days',
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      progress: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const insights: OptimizationInsight[] = [
    {
      id: '1',
      type: 'pattern',
      title: 'Mobile Users Drop Off Earlier',
      description: 'Mobile users are 40% more likely to drop off in the awareness stage',
      severity: 'high',
      confidence: 87,
      dataPoints: ['mobile_conversion_rate', 'desktop_conversion_rate', 'stage_analytics'],
      recommendations: [
        'Optimize mobile experience',
        'Simplify mobile forms',
        'Improve mobile page load speed',
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'opportunity',
      title: 'Weekend Traffic Underutilized',
      description: 'Weekend traffic has lower conversion but higher engagement time',
      severity: 'medium',
      confidence: 73,
      dataPoints: ['traffic_patterns', 'conversion_by_day', 'engagement_metrics'],
      recommendations: [
        'Create weekend-specific content',
        'Adjust support hours',
        'Test weekend promotions',
      ],
      createdAt: new Date().toISOString(),
    },
  ];

  return { recommendations, abTests, goals, insights };
};

// Provider component
export function OptimizationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(optimizationReducer, initialState);
  const queryClient = useQueryClient();

  // Fetch optimization data
  const { data, isLoading } = useQuery(
    'optimization-data',
    fetchOptimizationData,
    {
      onSuccess: (data) => {
        dispatch({ type: 'SET_RECOMMENDATIONS', payload: data.recommendations });
        dispatch({ type: 'SET_AB_TESTS', payload: data.abTests });
        dispatch({ type: 'SET_GOALS', payload: data.goals });
        dispatch({ type: 'SET_INSIGHTS', payload: data.insights });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load optimization data');
      },
    }
  );

  // Mutations
  const createRecommendationMutation = useMutation(
    async (recommendation: Omit<OptimizationRecommendation, 'id' | 'createdAt' | 'updatedAt'>) => {
      await mockApiDelay(800);
      const newRecommendation: OptimizationRecommendation = {
        ...recommendation,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newRecommendation;
    },
    {
      onSuccess: (newRecommendation) => {
        dispatch({ type: 'ADD_RECOMMENDATION', payload: newRecommendation });
        toast.success('Recommendation created successfully');
      },
      onError: () => {
        toast.error('Failed to create recommendation');
      },
    }
  );

  const updateRecommendationMutation = useMutation(
    async (recommendation: OptimizationRecommendation) => {
      await mockApiDelay(600);
      return { ...recommendation, updatedAt: new Date().toISOString() };
    },
    {
      onSuccess: (updatedRecommendation) => {
        dispatch({ type: 'UPDATE_RECOMMENDATION', payload: updatedRecommendation });
        toast.success('Recommendation updated successfully');
      },
      onError: () => {
        toast.error('Failed to update recommendation');
      },
    }
  );

  const createABTestMutation = useMutation(
    async (test: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>) => {
      await mockApiDelay(1000);
      const newTest: ABTest = {
        ...test,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newTest;
    },
    {
      onSuccess: (newTest) => {
        dispatch({ type: 'ADD_AB_TEST', payload: newTest });
        toast.success('A/B test created successfully');
      },
      onError: () => {
        toast.error('Failed to create A/B test');
      },
    }
  );

  const createGoalMutation = useMutation(
    async (goal: Omit<OptimizationGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
      await mockApiDelay(800);
      const newGoal: OptimizationGoal = {
        ...goal,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newGoal;
    },
    {
      onSuccess: (newGoal) => {
        dispatch({ type: 'ADD_GOAL', payload: newGoal });
        toast.success('Goal created successfully');
      },
      onError: () => {
        toast.error('Failed to create goal');
      },
    }
  );

  // Update loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  }, [isLoading]);

  // Context value
  const contextValue: OptimizationContextType = {
    ...state,
    
    // Actions
    setFilters: (filters) => dispatch({ type: 'SET_FILTERS', payload: filters }),
    
    // API actions
    createRecommendation: createRecommendationMutation.mutateAsync,
    updateRecommendation: updateRecommendationMutation.mutateAsync,
    dismissRecommendation: async (recommendationId: string) => {
      const recommendation = state.recommendations.find(r => r.id === recommendationId);
      if (recommendation) {
        await updateRecommendationMutation.mutateAsync({
          ...recommendation,
          status: 'dismissed',
        });
      }
    },
    
    createABTest: createABTestMutation.mutateAsync,
    updateABTest: async (test: ABTest) => {
      await mockApiDelay(600);
      dispatch({ type: 'UPDATE_AB_TEST', payload: { ...test, updatedAt: new Date().toISOString() } });
      toast.success('A/B test updated successfully');
    },
    startABTest: async (testId: string) => {
      const test = state.abTests.find(t => t.id === testId);
      if (test) {
        dispatch({ type: 'UPDATE_AB_TEST', payload: { 
          ...test, 
          status: 'running', 
          startDate: new Date().toISOString(),
          updatedAt: new Date().toISOString() 
        } });
        toast.success('A/B test started successfully');
      }
    },
    stopABTest: async (testId: string) => {
      const test = state.abTests.find(t => t.id === testId);
      if (test) {
        dispatch({ type: 'UPDATE_AB_TEST', payload: { 
          ...test, 
          status: 'completed', 
          endDate: new Date().toISOString(),
          updatedAt: new Date().toISOString() 
        } });
        toast.success('A/B test stopped successfully');
      }
    },
    
    createGoal: createGoalMutation.mutateAsync,
    updateGoal: async (goal: OptimizationGoal) => {
      await mockApiDelay(600);
      dispatch({ type: 'UPDATE_GOAL', payload: { ...goal, updatedAt: new Date().toISOString() } });
      toast.success('Goal updated successfully');
    },
    
    // Analytics
    refreshData: async () => {
      await queryClient.invalidateQueries('optimization-data');
    },
    generateRecommendations: async () => {
      await mockApiDelay(2000);
      toast.success('New recommendations generated based on latest data');
      await queryClient.invalidateQueries('optimization-data');
    },
    
    // Utility functions
    getRecommendationsByPriority: (priority) => 
      state.recommendations.filter(r => r.priority === priority),
    getActiveABTests: () => 
      state.abTests.filter(t => t.status === 'running'),
    getActiveGoals: () => 
      state.goals.filter(g => g.status === 'active'),
    getInsightsBySeverity: (severity) => 
      state.insights.filter(i => i.severity === severity),
  };

  return (
    <OptimizationContext.Provider value={contextValue}>
      {children}
    </OptimizationContext.Provider>
  );
}

// Hook
export function useOptimization() {
  const context = useContext(OptimizationContext);
  if (context === undefined) {
    throw new Error('useOptimization must be used within an OptimizationProvider');
  }
  return context;
}
