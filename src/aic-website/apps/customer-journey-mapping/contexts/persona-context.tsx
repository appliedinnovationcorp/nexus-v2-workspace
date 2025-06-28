'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';

// Types
export interface CustomerPersona {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar?: string;
  demographics: {
    age: string;
    location: string;
    industry: string;
    companySize: string;
    role: string;
    experience: string;
  };
  psychographics: {
    goals: string[];
    painPoints: string[];
    motivations: string[];
    preferences: string[];
    behaviors: string[];
  };
  technographics: {
    techSavviness: 'low' | 'medium' | 'high';
    preferredChannels: string[];
    devices: string[];
    tools: string[];
  };
  journeyPreferences: {
    preferredTouchpoints: string[];
    decisionFactors: string[];
    informationSources: string[];
    buyingProcess: string;
  };
  metrics: {
    marketSize: number;
    conversionRate: number;
    averageValue: number;
    acquisitionCost: number;
    lifetimeValue: number;
    satisfaction: number;
  };
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'draft' | 'archived';
}

export interface PersonaInsights {
  topGoals: string[];
  commonPainPoints: string[];
  preferredChannels: string[];
  behaviorPatterns: string[];
  optimizationOpportunities: string[];
}

// State
interface PersonaState {
  personas: CustomerPersona[];
  currentPersona: CustomerPersona | null;
  insights: PersonaInsights | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    industry?: string;
    companySize?: string;
  };
}

// Actions
type PersonaAction =
  | { type: 'SET_PERSONAS'; payload: CustomerPersona[] }
  | { type: 'SET_CURRENT_PERSONA'; payload: CustomerPersona | null }
  | { type: 'SET_INSIGHTS'; payload: PersonaInsights }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<PersonaState['filters']> }
  | { type: 'UPDATE_PERSONA'; payload: CustomerPersona }
  | { type: 'ADD_PERSONA'; payload: CustomerPersona }
  | { type: 'DELETE_PERSONA'; payload: string };

// Reducer
function personaReducer(state: PersonaState, action: PersonaAction): PersonaState {
  switch (action.type) {
    case 'SET_PERSONAS':
      return { ...state, personas: action.payload };
    case 'SET_CURRENT_PERSONA':
      return { ...state, currentPersona: action.payload };
    case 'SET_INSIGHTS':
      return { ...state, insights: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'UPDATE_PERSONA':
      return {
        ...state,
        personas: state.personas.map(p => p.id === action.payload.id ? action.payload : p),
        currentPersona: state.currentPersona?.id === action.payload.id ? action.payload : state.currentPersona,
      };
    case 'ADD_PERSONA':
      return { ...state, personas: [...state.personas, action.payload] };
    case 'DELETE_PERSONA':
      return {
        ...state,
        personas: state.personas.filter(p => p.id !== action.payload),
        currentPersona: state.currentPersona?.id === action.payload ? null : state.currentPersona,
      };
    default:
      return state;
  }
}

// Initial state
const initialState: PersonaState = {
  personas: [],
  currentPersona: null,
  insights: null,
  isLoading: false,
  error: null,
  filters: {},
};

// Context
interface PersonaContextType extends PersonaState {
  // Actions
  setCurrentPersona: (persona: CustomerPersona | null) => void;
  setFilters: (filters: Partial<PersonaState['filters']>) => void;
  
  // API actions
  createPersona: (persona: Omit<CustomerPersona, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePersona: (persona: CustomerPersona) => Promise<void>;
  deletePersona: (personaId: string) => Promise<void>;
  duplicatePersona: (personaId: string) => Promise<void>;
  
  // Analytics
  refreshInsights: () => Promise<void>;
  
  // Utility functions
  getPersonaById: (id: string) => CustomerPersona | undefined;
  getPersonasByIndustry: (industry: string) => CustomerPersona[];
  getPersonasByCompanySize: (size: string) => CustomerPersona[];
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

// Mock API functions
const mockApiDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchPersonas = async (): Promise<CustomerPersona[]> => {
  await mockApiDelay(800);
  return [
    {
      id: 'smb-decision-maker',
      name: 'Sarah Chen',
      title: 'SMB Decision Maker',
      description: 'Small business owner looking for efficient solutions to grow their business',
      demographics: {
        age: '35-45',
        location: 'Urban/Suburban US',
        industry: 'Professional Services',
        companySize: '10-50 employees',
        role: 'CEO/Founder',
        experience: '5-10 years',
      },
      psychographics: {
        goals: [
          'Increase operational efficiency',
          'Reduce costs',
          'Scale business operations',
          'Improve customer satisfaction',
        ],
        painPoints: [
          'Limited budget',
          'Time constraints',
          'Complex technology',
          'Lack of technical expertise',
        ],
        motivations: [
          'Business growth',
          'Competitive advantage',
          'Cost savings',
          'Simplicity',
        ],
        preferences: [
          'Simple solutions',
          'Quick implementation',
          'Good support',
          'Transparent pricing',
        ],
        behaviors: [
          'Research online before purchasing',
          'Seeks recommendations from peers',
          'Values customer reviews',
          'Prefers demos and trials',
        ],
      },
      technographics: {
        techSavviness: 'medium',
        preferredChannels: ['Email', 'Website', 'Phone', 'Social Media'],
        devices: ['Desktop', 'Mobile', 'Tablet'],
        tools: ['CRM', 'Email Marketing', 'Social Media', 'Analytics'],
      },
      journeyPreferences: {
        preferredTouchpoints: ['Website', 'Email', 'Demo', 'Support Chat'],
        decisionFactors: ['Price', 'Features', 'Support', 'Ease of use'],
        informationSources: ['Website', 'Reviews', 'Peers', 'Sales team'],
        buyingProcess: 'Research → Demo → Trial → Purchase',
      },
      metrics: {
        marketSize: 50000,
        conversionRate: 12.5,
        averageValue: 2500,
        acquisitionCost: 150,
        lifetimeValue: 15000,
        satisfaction: 4.2,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    },
    {
      id: 'enterprise-buyer',
      name: 'Michael Rodriguez',
      title: 'Enterprise Technology Buyer',
      description: 'Enterprise decision maker focused on scalable, secure solutions',
      demographics: {
        age: '40-55',
        location: 'Major US Cities',
        industry: 'Technology/Finance',
        companySize: '1000+ employees',
        role: 'CTO/VP Technology',
        experience: '15+ years',
      },
      psychographics: {
        goals: [
          'Digital transformation',
          'Operational excellence',
          'Risk mitigation',
          'Innovation leadership',
        ],
        painPoints: [
          'Complex integration',
          'Security concerns',
          'Vendor management',
          'Change management',
        ],
        motivations: [
          'Strategic advantage',
          'Efficiency gains',
          'Risk reduction',
          'Innovation',
        ],
        preferences: [
          'Proven solutions',
          'Strong security',
          'Comprehensive support',
          'Scalability',
        ],
        behaviors: [
          'Extensive evaluation process',
          'Multiple stakeholder involvement',
          'Proof of concept required',
          'Long-term partnerships',
        ],
      },
      technographics: {
        techSavviness: 'high',
        preferredChannels: ['Email', 'LinkedIn', 'Industry Events', 'Direct Sales'],
        devices: ['Desktop', 'Mobile'],
        tools: ['Enterprise Software', 'Analytics Platforms', 'Security Tools'],
      },
      journeyPreferences: {
        preferredTouchpoints: ['Sales Team', 'Technical Demos', 'Whitepapers', 'Events'],
        decisionFactors: ['Security', 'Scalability', 'Integration', 'Support'],
        informationSources: ['Analyst reports', 'Peer networks', 'Vendor presentations'],
        buyingProcess: 'Research → RFP → Evaluation → Pilot → Purchase',
      },
      metrics: {
        marketSize: 5000,
        conversionRate: 8.5,
        averageValue: 50000,
        acquisitionCost: 2500,
        lifetimeValue: 250000,
        satisfaction: 4.5,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    },
  ];
};

const fetchPersonaInsights = async (): Promise<PersonaInsights> => {
  await mockApiDelay(600);
  return {
    topGoals: [
      'Increase operational efficiency',
      'Digital transformation',
      'Reduce costs',
      'Scale business operations',
    ],
    commonPainPoints: [
      'Limited budget',
      'Complex integration',
      'Time constraints',
      'Security concerns',
    ],
    preferredChannels: [
      'Email',
      'Website',
      'Sales Team',
      'LinkedIn',
    ],
    behaviorPatterns: [
      'Research online before purchasing',
      'Extensive evaluation process',
      'Seeks recommendations from peers',
      'Values customer reviews',
    ],
    optimizationOpportunities: [
      'Improve mobile experience for SMB personas',
      'Create more technical content for enterprise buyers',
      'Enhance demo experience',
      'Streamline trial process',
    ],
  };
};

// Provider component
export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(personaReducer, initialState);
  const queryClient = useQueryClient();

  // Fetch personas
  const { data: personas, isLoading: personasLoading } = useQuery(
    'personas',
    fetchPersonas,
    {
      onSuccess: (data) => {
        dispatch({ type: 'SET_PERSONAS', payload: data });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load personas');
      },
    }
  );

  // Fetch insights
  const { data: insights, isLoading: insightsLoading } = useQuery(
    'persona-insights',
    fetchPersonaInsights,
    {
      onSuccess: (data) => {
        dispatch({ type: 'SET_INSIGHTS', payload: data });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load insights');
      },
    }
  );

  // Mutations
  const createPersonaMutation = useMutation(
    async (persona: Omit<CustomerPersona, 'id' | 'createdAt' | 'updatedAt'>) => {
      await mockApiDelay(1000);
      const newPersona: CustomerPersona = {
        ...persona,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newPersona;
    },
    {
      onSuccess: (newPersona) => {
        dispatch({ type: 'ADD_PERSONA', payload: newPersona });
        toast.success('Persona created successfully');
      },
      onError: (error: any) => {
        toast.error('Failed to create persona');
      },
    }
  );

  const updatePersonaMutation = useMutation(
    async (persona: CustomerPersona) => {
      await mockApiDelay(800);
      return { ...persona, updatedAt: new Date().toISOString() };
    },
    {
      onSuccess: (updatedPersona) => {
        dispatch({ type: 'UPDATE_PERSONA', payload: updatedPersona });
        toast.success('Persona updated successfully');
      },
      onError: (error: any) => {
        toast.error('Failed to update persona');
      },
    }
  );

  const deletePersonaMutation = useMutation(
    async (personaId: string) => {
      await mockApiDelay(500);
      return personaId;
    },
    {
      onSuccess: (personaId) => {
        dispatch({ type: 'DELETE_PERSONA', payload: personaId });
        toast.success('Persona deleted successfully');
      },
      onError: (error: any) => {
        toast.error('Failed to delete persona');
      },
    }
  );

  // Update loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: personasLoading || insightsLoading });
  }, [personasLoading, insightsLoading]);

  // Context value
  const contextValue: PersonaContextType = {
    ...state,
    
    // Actions
    setCurrentPersona: (persona) => dispatch({ type: 'SET_CURRENT_PERSONA', payload: persona }),
    setFilters: (filters) => dispatch({ type: 'SET_FILTERS', payload: filters }),
    
    // API actions
    createPersona: createPersonaMutation.mutateAsync,
    updatePersona: updatePersonaMutation.mutateAsync,
    deletePersona: deletePersonaMutation.mutateAsync,
    duplicatePersona: async (personaId: string) => {
      const persona = state.personas.find(p => p.id === personaId);
      if (persona) {
        await createPersonaMutation.mutateAsync({
          ...persona,
          name: `${persona.name} (Copy)`,
          title: `${persona.title} (Copy)`,
          status: 'draft',
        });
      }
    },
    
    // Analytics
    refreshInsights: async () => {
      await queryClient.invalidateQueries('persona-insights');
    },
    
    // Utility functions
    getPersonaById: (id: string) => state.personas.find(p => p.id === id),
    getPersonasByIndustry: (industry: string) => 
      state.personas.filter(p => p.demographics.industry === industry),
    getPersonasByCompanySize: (size: string) => 
      state.personas.filter(p => p.demographics.companySize === size),
  };

  return (
    <PersonaContext.Provider value={contextValue}>
      {children}
    </PersonaContext.Provider>
  );
}

// Hook
export function usePersona() {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
}
