'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';

// Types
export interface ThreatIntelligenceFeed {
  id: string;
  name: string;
  source: string;
  type: 'commercial' | 'open_source' | 'government' | 'internal';
  status: 'active' | 'inactive' | 'error';
  lastUpdate: string;
  indicators: number;
  reliability: 'high' | 'medium' | 'low';
  confidence: number;
  description: string;
}

export interface ThreatIndicator {
  id: string;
  value: string;
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'file' | 'registry' | 'process' | 'certificate';
  category: 'malware' | 'phishing' | 'c2' | 'exploit' | 'suspicious' | 'benign';
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  firstSeen: string;
  lastSeen: string;
  sources: string[];
  tags: string[];
  context: IndicatorContext;
  relationships: IndicatorRelationship[];
  ttl: number; // Time to live in hours
  whitelisted: boolean;
}

export interface IndicatorContext {
  malwareFamily?: string;
  campaign?: string;
  actor?: string;
  country?: string;
  description: string;
  references: string[];
  killChain: string[];
}

export interface IndicatorRelationship {
  id: string;
  type: 'related' | 'parent' | 'child' | 'variant' | 'associated';
  targetId: string;
  confidence: number;
  description: string;
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  type: 'nation_state' | 'cybercriminal' | 'hacktivist' | 'insider' | 'unknown';
  sophistication: 'minimal' | 'intermediate' | 'advanced' | 'expert' | 'innovator';
  motivation: string[];
  country: string;
  firstSeen: string;
  lastActivity: string;
  targets: string[];
  techniques: string[];
  tools: string[];
  campaigns: string[];
  description: string;
  references: string[];
}

export interface ThreatCampaign {
  id: string;
  name: string;
  description: string;
  actor: string;
  firstSeen: string;
  lastActivity: string;
  status: 'active' | 'inactive' | 'unknown';
  targets: string[];
  geography: string[];
  techniques: string[];
  indicators: string[];
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface IOCMatch {
  id: string;
  indicatorId: string;
  indicator: ThreatIndicator;
  matchedValue: string;
  source: string;
  timestamp: string;
  context: string;
  confidence: number;
  falsePositive: boolean;
  investigated: boolean;
  notes: string;
}

export interface ThreatIntelligenceMetrics {
  totalIndicators: number;
  activeIndicators: number;
  expiredIndicators: number;
  highConfidenceIndicators: number;
  recentMatches: number;
  feedsActive: number;
  feedsTotal: number;
  indicatorsByType: IndicatorTypeData[];
  indicatorsBySource: IndicatorSourceData[];
  matchTrends: MatchTrendData[];
  topActors: ThreatActor[];
  activeCampaigns: ThreatCampaign[];
}

export interface IndicatorTypeData {
  type: string;
  count: number;
  percentage: number;
  matches: number;
}

export interface IndicatorSourceData {
  source: string;
  count: number;
  reliability: 'high' | 'medium' | 'low';
  lastUpdate: string;
}

export interface MatchTrendData {
  date: string;
  matches: number;
  falsePositives: number;
  investigated: number;
}

// State
interface ThreatIntelligenceState {
  feeds: ThreatIntelligenceFeed[];
  indicators: ThreatIndicator[];
  actors: ThreatActor[];
  campaigns: ThreatCampaign[];
  matches: IOCMatch[];
  metrics: ThreatIntelligenceMetrics | null;
  selectedIndicator: ThreatIndicator | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    type: string[];
    category: string[];
    severity: string[];
    source: string[];
    confidence: number;
    dateRange: { start: Date; end: Date };
  };
  searchQuery: string;
  autoEnrichment: boolean;
}

// Actions
type ThreatIntelligenceAction =
  | { type: 'SET_FEEDS'; payload: ThreatIntelligenceFeed[] }
  | { type: 'SET_INDICATORS'; payload: ThreatIndicator[] }
  | { type: 'SET_ACTORS'; payload: ThreatActor[] }
  | { type: 'SET_CAMPAIGNS'; payload: ThreatCampaign[] }
  | { type: 'SET_MATCHES'; payload: IOCMatch[] }
  | { type: 'SET_METRICS'; payload: ThreatIntelligenceMetrics }
  | { type: 'SET_SELECTED_INDICATOR'; payload: ThreatIndicator | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<ThreatIntelligenceState['filters']> }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_AUTO_ENRICHMENT'; payload: boolean }
  | { type: 'UPDATE_INDICATOR'; payload: ThreatIndicator }
  | { type: 'ADD_INDICATOR'; payload: ThreatIndicator };

// Reducer
function threatIntelligenceReducer(state: ThreatIntelligenceState, action: ThreatIntelligenceAction): ThreatIntelligenceState {
  switch (action.type) {
    case 'SET_FEEDS':
      return { ...state, feeds: action.payload };
    case 'SET_INDICATORS':
      return { ...state, indicators: action.payload };
    case 'SET_ACTORS':
      return { ...state, actors: action.payload };
    case 'SET_CAMPAIGNS':
      return { ...state, campaigns: action.payload };
    case 'SET_MATCHES':
      return { ...state, matches: action.payload };
    case 'SET_METRICS':
      return { ...state, metrics: action.payload };
    case 'SET_SELECTED_INDICATOR':
      return { ...state, selectedIndicator: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_AUTO_ENRICHMENT':
      return { ...state, autoEnrichment: action.payload };
    case 'UPDATE_INDICATOR':
      return {
        ...state,
        indicators: state.indicators.map(i => i.id === action.payload.id ? action.payload : i),
        selectedIndicator: state.selectedIndicator?.id === action.payload.id ? action.payload : state.selectedIndicator,
      };
    case 'ADD_INDICATOR':
      return { ...state, indicators: [action.payload, ...state.indicators] };
    default:
      return state;
  }
}

// Initial state
const initialState: ThreatIntelligenceState = {
  feeds: [],
  indicators: [],
  actors: [],
  campaigns: [],
  matches: [],
  metrics: null,
  selectedIndicator: null,
  isLoading: false,
  error: null,
  filters: {
    type: [],
    category: [],
    severity: [],
    source: [],
    confidence: 50,
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      end: new Date(),
    },
  },
  searchQuery: '',
  autoEnrichment: true,
};

// Context
interface ThreatIntelligenceContextType extends ThreatIntelligenceState {
  // Actions
  setSelectedIndicator: (indicator: ThreatIndicator | null) => void;
  setFilters: (filters: Partial<ThreatIntelligenceState['filters']>) => void;
  setSearchQuery: (query: string) => void;
  setAutoEnrichment: (enabled: boolean) => void;
  
  // API actions
  enrichIndicator: (value: string, type: ThreatIndicator['type']) => Promise<ThreatIndicator | null>;
  whitelistIndicator: (indicatorId: string) => Promise<void>;
  createCustomIndicator: (indicator: Omit<ThreatIndicator, 'id' | 'firstSeen' | 'lastSeen'>) => Promise<void>;
  updateIndicator: (indicator: ThreatIndicator) => Promise<void>;
  searchIndicators: (query: string) => Promise<ThreatIndicator[]>;
  
  // Feed management
  addFeed: (feed: Omit<ThreatIntelligenceFeed, 'id' | 'lastUpdate' | 'indicators'>) => Promise<void>;
  updateFeed: (feed: ThreatIntelligenceFeed) => Promise<void>;
  refreshFeed: (feedId: string) => Promise<void>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  exportIndicators: (format: 'json' | 'csv' | 'stix') => Promise<void>;
  getIndicatorById: (id: string) => ThreatIndicator | undefined;
  checkIOC: (value: string) => IOCMatch[];
}

const ThreatIntelligenceContext = createContext<ThreatIntelligenceContextType | undefined>(undefined);

// Mock API functions
const mockApiDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchThreatFeeds = async (): Promise<ThreatIntelligenceFeed[]> => {
  await mockApiDelay(800);
  
  return [
    {
      id: 'feed-1',
      name: 'AIC Internal Threat Feed',
      source: 'internal',
      type: 'internal',
      status: 'active',
      lastUpdate: new Date().toISOString(),
      indicators: 15247,
      reliability: 'high',
      confidence: 95,
      description: 'Internal threat intelligence feed from AIC security operations',
    },
    {
      id: 'feed-2',
      name: 'Commercial Threat Intelligence',
      source: 'threat-vendor',
      type: 'commercial',
      status: 'active',
      lastUpdate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      indicators: 2847563,
      reliability: 'high',
      confidence: 90,
      description: 'Premium commercial threat intelligence feed',
    },
    {
      id: 'feed-3',
      name: 'Open Source Intelligence',
      source: 'osint',
      type: 'open_source',
      status: 'active',
      lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      indicators: 456789,
      reliability: 'medium',
      confidence: 75,
      description: 'Aggregated open source threat intelligence',
    },
  ];
};

const fetchThreatIndicators = async (): Promise<ThreatIndicator[]> => {
  await mockApiDelay(1200);
  
  return [
    {
      id: 'ioc-1',
      value: '192.0.2.100',
      type: 'ip',
      category: 'c2',
      confidence: 95,
      severity: 'high',
      firstSeen: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      lastSeen: new Date().toISOString(),
      sources: ['threat-vendor', 'internal'],
      tags: ['apt', 'c2-server', 'malware'],
      context: {
        malwareFamily: 'APT29',
        campaign: 'CozyBear-2024',
        actor: 'APT29',
        country: 'Russia',
        description: 'Command and control server used by APT29 group',
        references: ['https://example.com/report1'],
        killChain: ['command-and-control'],
      },
      relationships: [],
      ttl: 168, // 7 days
      whitelisted: false,
    },
    {
      id: 'ioc-2',
      value: 'evil-domain.com',
      type: 'domain',
      category: 'phishing',
      confidence: 88,
      severity: 'medium',
      firstSeen: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      sources: ['osint'],
      tags: ['phishing', 'credential-theft'],
      context: {
        campaign: 'Phishing-Campaign-Q1-2024',
        description: 'Domain used for credential phishing attacks',
        references: ['https://example.com/report2'],
        killChain: ['initial-access'],
      },
      relationships: [],
      ttl: 72, // 3 days
      whitelisted: false,
    },
  ];
};

const fetchThreatIntelligenceMetrics = async (): Promise<ThreatIntelligenceMetrics> => {
  await mockApiDelay(600);
  
  return {
    totalIndicators: 3247856,
    activeIndicators: 2847563,
    expiredIndicators: 400293,
    highConfidenceIndicators: 1523789,
    recentMatches: 247,
    feedsActive: 3,
    feedsTotal: 3,
    indicatorsByType: [
      { type: 'ip', count: 1247856, percentage: 38.4, matches: 89 },
      { type: 'domain', count: 856234, percentage: 26.4, matches: 67 },
      { type: 'hash', count: 634521, percentage: 19.5, matches: 45 },
      { type: 'url', count: 345678, percentage: 10.6, matches: 32 },
      { type: 'email', count: 163567, percentage: 5.0, matches: 14 },
    ],
    indicatorsBySource: [
      { source: 'threat-vendor', count: 2847563, reliability: 'high', lastUpdate: new Date().toISOString() },
      { source: 'osint', count: 456789, reliability: 'medium', lastUpdate: new Date().toISOString() },
      { source: 'internal', count: 15247, reliability: 'high', lastUpdate: new Date().toISOString() },
    ],
    matchTrends: [
      { date: '2024-01-01', matches: 45, falsePositives: 3, investigated: 42 },
      { date: '2024-01-02', matches: 67, falsePositives: 5, investigated: 62 },
      { date: '2024-01-03', matches: 52, falsePositives: 2, investigated: 50 },
      { date: '2024-01-04', matches: 78, falsePositives: 8, investigated: 70 },
      { date: '2024-01-05', matches: 89, falsePositives: 4, investigated: 85 },
    ],
    topActors: [],
    activeCampaigns: [],
  };
};

// Provider component
export function ThreatIntelligenceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(threatIntelligenceReducer, initialState);
  const queryClient = useQueryClient();

  // Fetch feeds
  const { data: feeds, isLoading: feedsLoading } = useQuery(
    'threat-feeds',
    fetchThreatFeeds,
    {
      refetchInterval: 300000, // 5 minutes
      onSuccess: (data) => {
        dispatch({ type: 'SET_FEEDS', payload: data });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load threat intelligence feeds');
      },
    }
  );

  // Fetch indicators
  const { data: indicators, isLoading: indicatorsLoading } = useQuery(
    ['threat-indicators', state.filters, state.searchQuery],
    () => fetchThreatIndicators(),
    {
      refetchInterval: 60000, // 1 minute
      onSuccess: (data) => {
        dispatch({ type: 'SET_INDICATORS', payload: data });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load threat indicators');
      },
    }
  );

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery(
    'threat-intelligence-metrics',
    fetchThreatIntelligenceMetrics,
    {
      refetchInterval: 300000, // 5 minutes
      onSuccess: (data) => {
        dispatch({ type: 'SET_METRICS', payload: data });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load threat intelligence metrics');
      },
    }
  );

  // Update loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: feedsLoading || indicatorsLoading || metricsLoading });
  }, [feedsLoading, indicatorsLoading, metricsLoading]);

  // Context value
  const contextValue: ThreatIntelligenceContextType = {
    ...state,
    
    // Actions
    setSelectedIndicator: (indicator) => dispatch({ type: 'SET_SELECTED_INDICATOR', payload: indicator }),
    setFilters: (filters) => dispatch({ type: 'SET_FILTERS', payload: filters }),
    setSearchQuery: (query) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query }),
    setAutoEnrichment: (enabled) => dispatch({ type: 'SET_AUTO_ENRICHMENT', payload: enabled }),
    
    // API actions
    enrichIndicator: async (value: string, type: ThreatIndicator['type']) => {
      await mockApiDelay(2000);
      // Mock enrichment result
      const enrichedIndicator: ThreatIndicator = {
        id: `enriched-${Date.now()}`,
        value,
        type,
        category: 'suspicious',
        confidence: 75,
        severity: 'medium',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        sources: ['enrichment-api'],
        tags: ['enriched'],
        context: {
          description: `Enriched indicator for ${value}`,
          references: [],
          killChain: [],
        },
        relationships: [],
        ttl: 24,
        whitelisted: false,
      };
      dispatch({ type: 'ADD_INDICATOR', payload: enrichedIndicator });
      toast.success('Indicator enriched successfully');
      return enrichedIndicator;
    },
    whitelistIndicator: async (indicatorId: string) => {
      await mockApiDelay(500);
      const indicator = state.indicators.find(i => i.id === indicatorId);
      if (indicator) {
        dispatch({ type: 'UPDATE_INDICATOR', payload: { ...indicator, whitelisted: true } });
        toast.success('Indicator whitelisted');
      }
    },
    createCustomIndicator: async (indicatorData) => {
      await mockApiDelay(800);
      const newIndicator: ThreatIndicator = {
        ...indicatorData,
        id: `custom-${Date.now()}`,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_INDICATOR', payload: newIndicator });
      toast.success('Custom indicator created');
    },
    updateIndicator: async (indicator) => {
      await mockApiDelay(600);
      dispatch({ type: 'UPDATE_INDICATOR', payload: indicator });
      toast.success('Indicator updated');
    },
    searchIndicators: async (query: string) => {
      await mockApiDelay(1000);
      return state.indicators.filter(i => 
        i.value.toLowerCase().includes(query.toLowerCase()) ||
        i.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    },
    
    // Feed management
    addFeed: async (feedData) => {
      await mockApiDelay(1000);
      const newFeed: ThreatIntelligenceFeed = {
        ...feedData,
        id: `feed-${Date.now()}`,
        lastUpdate: new Date().toISOString(),
        indicators: 0,
      };
      dispatch({ type: 'SET_FEEDS', payload: [...state.feeds, newFeed] });
      toast.success('Threat intelligence feed added');
    },
    updateFeed: async (feed) => {
      await mockApiDelay(600);
      dispatch({ type: 'SET_FEEDS', payload: state.feeds.map(f => f.id === feed.id ? feed : f) });
      toast.success('Feed updated');
    },
    refreshFeed: async (feedId) => {
      await mockApiDelay(3000);
      toast.success('Feed refreshed successfully');
    },
    
    // Utility functions
    refreshData: async () => {
      await queryClient.invalidateQueries('threat-feeds');
      await queryClient.invalidateQueries('threat-indicators');
      await queryClient.invalidateQueries('threat-intelligence-metrics');
    },
    exportIndicators: async (format) => {
      await mockApiDelay(2000);
      toast.success(`Indicators exported as ${format.toUpperCase()}`);
    },
    getIndicatorById: (id: string) => state.indicators.find(i => i.id === id),
    checkIOC: (value: string) => {
      return state.matches.filter(m => m.matchedValue === value);
    },
  };

  return (
    <ThreatIntelligenceContext.Provider value={contextValue}>
      {children}
    </ThreatIntelligenceContext.Provider>
  );
}

// Hook
export function useThreatIntelligence() {
  const context = useContext(ThreatIntelligenceContext);
  if (context === undefined) {
    throw new Error('useThreatIntelligence must be used within a ThreatIntelligenceProvider');
  }
  return context;
}
