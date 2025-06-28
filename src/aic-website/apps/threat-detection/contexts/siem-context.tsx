'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';

// Types
export interface SIEMEvent {
  id: string;
  timestamp: string;
  source: string;
  sourceType: 'firewall' | 'ids' | 'antivirus' | 'endpoint' | 'network' | 'application' | 'system';
  eventType: 'authentication' | 'network' | 'file' | 'process' | 'registry' | 'dns' | 'http' | 'email';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'security' | 'audit' | 'system' | 'application' | 'network';
  message: string;
  details: Record<string, any>;
  tags: string[];
  correlationId?: string;
  ruleId?: string;
  ruleName?: string;
  falsePositive: boolean;
  investigated: boolean;
  assignedTo?: string;
  notes: string[];
}

export interface SIEMRule {
  id: string;
  name: string;
  description: string;
  query: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  enabled: boolean;
  category: string;
  tags: string[];
  conditions: RuleCondition[];
  actions: RuleAction[];
  schedule: RuleSchedule;
  lastTriggered?: string;
  triggerCount: number;
  falsePositiveRate: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'regex' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | number | string[];
  caseSensitive?: boolean;
}

export interface RuleAction {
  type: 'alert' | 'email' | 'webhook' | 'block' | 'quarantine' | 'log';
  parameters: Record<string, any>;
}

export interface RuleSchedule {
  type: 'realtime' | 'interval' | 'cron';
  interval?: number; // minutes
  cron?: string;
}

export interface LogSource {
  id: string;
  name: string;
  type: 'syslog' | 'windows_event' | 'json' | 'csv' | 'api' | 'database';
  status: 'connected' | 'disconnected' | 'error' | 'maintenance';
  host: string;
  port?: number;
  protocol: 'tcp' | 'udp' | 'http' | 'https';
  format: string;
  parser: string;
  lastEvent: string;
  eventsPerSecond: number;
  totalEvents: number;
  errorRate: number;
  configuration: Record<string, any>;
}

export interface SIEMDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  timeRange: TimeRange;
  autoRefresh: boolean;
  refreshInterval: number;
  shared: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'map' | 'timeline' | 'heatmap';
  title: string;
  query: string;
  visualization: VisualizationConfig;
  position: { x: number; y: number; w: number; h: number };
  filters: DashboardFilter[];
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
}

export interface DashboardFilter {
  field: string;
  operator: string;
  value: any;
  label: string;
}

export interface TimeRange {
  start: string;
  end: string;
  relative?: string; // e.g., 'last_24h', 'last_7d'
}

export interface SIEMMetrics {
  totalEvents: number;
  eventsPerSecond: number;
  alertsGenerated: number;
  rulesTriggered: number;
  sourcesConnected: number;
  sourcesTotal: number;
  storageUsed: number;
  storageTotal: number;
  queryPerformance: number;
  indexingRate: number;
  eventsBySource: EventSourceData[];
  eventsByType: EventTypeData[];
  alertTrends: AlertTrendData[];
  topRules: TopRuleData[];
  systemHealth: SystemHealthData;
}

export interface EventSourceData {
  source: string;
  count: number;
  percentage: number;
  rate: number;
}

export interface EventTypeData {
  type: string;
  count: number;
  percentage: number;
  severity: string;
}

export interface AlertTrendData {
  timestamp: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface TopRuleData {
  ruleId: string;
  ruleName: string;
  triggers: number;
  falsePositives: number;
  accuracy: number;
}

export interface SystemHealthData {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  indexingLag: number;
  queryLatency: number;
}

// State
interface SIEMState {
  events: SIEMEvent[];
  rules: SIEMRule[];
  sources: LogSource[];
  dashboards: SIEMDashboard[];
  metrics: SIEMMetrics | null;
  selectedEvent: SIEMEvent | null;
  selectedRule: SIEMRule | null;
  currentDashboard: SIEMDashboard | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    severity: string[];
    category: string[];
    source: string[];
    eventType: string[];
    timeRange: TimeRange;
  };
  searchQuery: string;
  realTimeEnabled: boolean;
}

// Actions
type SIEMAction =
  | { type: 'SET_EVENTS'; payload: SIEMEvent[] }
  | { type: 'SET_RULES'; payload: SIEMRule[] }
  | { type: 'SET_SOURCES'; payload: LogSource[] }
  | { type: 'SET_DASHBOARDS'; payload: SIEMDashboard[] }
  | { type: 'SET_METRICS'; payload: SIEMMetrics }
  | { type: 'SET_SELECTED_EVENT'; payload: SIEMEvent | null }
  | { type: 'SET_SELECTED_RULE'; payload: SIEMRule | null }
  | { type: 'SET_CURRENT_DASHBOARD'; payload: SIEMDashboard | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<SIEMState['filters']> }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_REAL_TIME'; payload: boolean }
  | { type: 'UPDATE_EVENT'; payload: SIEMEvent }
  | { type: 'UPDATE_RULE'; payload: SIEMRule }
  | { type: 'ADD_EVENT'; payload: SIEMEvent };

// Reducer
function siemReducer(state: SIEMState, action: SIEMAction): SIEMState {
  switch (action.type) {
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'SET_RULES':
      return { ...state, rules: action.payload };
    case 'SET_SOURCES':
      return { ...state, sources: action.payload };
    case 'SET_DASHBOARDS':
      return { ...state, dashboards: action.payload };
    case 'SET_METRICS':
      return { ...state, metrics: action.payload };
    case 'SET_SELECTED_EVENT':
      return { ...state, selectedEvent: action.payload };
    case 'SET_SELECTED_RULE':
      return { ...state, selectedRule: action.payload };
    case 'SET_CURRENT_DASHBOARD':
      return { ...state, currentDashboard: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_REAL_TIME':
      return { ...state, realTimeEnabled: action.payload };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e => e.id === action.payload.id ? action.payload : e),
        selectedEvent: state.selectedEvent?.id === action.payload.id ? action.payload : state.selectedEvent,
      };
    case 'UPDATE_RULE':
      return {
        ...state,
        rules: state.rules.map(r => r.id === action.payload.id ? action.payload : r),
        selectedRule: state.selectedRule?.id === action.payload.id ? action.payload : state.selectedRule,
      };
    case 'ADD_EVENT':
      return { ...state, events: [action.payload, ...state.events] };
    default:
      return state;
  }
}

// Initial state
const initialState: SIEMState = {
  events: [],
  rules: [],
  sources: [],
  dashboards: [],
  metrics: null,
  selectedEvent: null,
  selectedRule: null,
  currentDashboard: null,
  isLoading: false,
  error: null,
  filters: {
    severity: [],
    category: [],
    source: [],
    eventType: [],
    timeRange: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
      relative: 'last_24h',
    },
  },
  searchQuery: '',
  realTimeEnabled: true,
};

// Context
interface SIEMContextType extends SIEMState {
  // Actions
  setSelectedEvent: (event: SIEMEvent | null) => void;
  setSelectedRule: (rule: SIEMRule | null) => void;
  setCurrentDashboard: (dashboard: SIEMDashboard | null) => void;
  setFilters: (filters: Partial<SIEMState['filters']>) => void;
  setSearchQuery: (query: string) => void;
  setRealTimeEnabled: (enabled: boolean) => void;
  
  // API actions
  createRule: (rule: Omit<SIEMRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount' | 'falsePositiveRate'>) => Promise<void>;
  updateRule: (rule: SIEMRule) => Promise<void>;
  deleteRule: (ruleId: string) => Promise<void>;
  testRule: (rule: SIEMRule) => Promise<{ matches: number; events: SIEMEvent[] }>;
  
  markEventInvestigated: (eventId: string, notes: string) => Promise<void>;
  markEventFalsePositive: (eventId: string) => Promise<void>;
  
  addLogSource: (source: Omit<LogSource, 'id' | 'lastEvent' | 'eventsPerSecond' | 'totalEvents' | 'errorRate'>) => Promise<void>;
  updateLogSource: (source: LogSource) => Promise<void>;
  testLogSource: (sourceId: string) => Promise<{ connected: boolean; error?: string }>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  exportEvents: (format: 'csv' | 'json' | 'syslog') => Promise<void>;
  searchEvents: (query: string) => Promise<SIEMEvent[]>;
  getEventById: (id: string) => SIEMEvent | undefined;
  correlateEvents: (eventId: string) => Promise<SIEMEvent[]>;
}

const SIEMContext = createContext<SIEMContextType | undefined>(undefined);

// Mock API functions
const mockApiDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchSIEMEvents = async (): Promise<SIEMEvent[]> => {
  await mockApiDelay(1000);
  
  return [
    {
      id: 'event-1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      source: 'firewall-01',
      sourceType: 'firewall',
      eventType: 'network',
      severity: 'high',
      category: 'security',
      message: 'Blocked connection attempt from suspicious IP',
      details: {
        sourceIp: '203.0.113.45',
        destinationIp: '192.168.1.100',
        port: 22,
        protocol: 'TCP',
        action: 'BLOCK',
        reason: 'Threat Intelligence Match',
      },
      tags: ['blocked', 'suspicious-ip', 'ssh'],
      ruleId: 'rule-001',
      ruleName: 'Block Suspicious IPs',
      falsePositive: false,
      investigated: false,
      notes: [],
    },
    {
      id: 'event-2',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      source: 'web-server-01',
      sourceType: 'application',
      eventType: 'authentication',
      severity: 'medium',
      category: 'security',
      message: 'Multiple failed login attempts detected',
      details: {
        username: 'admin',
        sourceIp: '192.168.1.50',
        attempts: 5,
        timeWindow: '5 minutes',
        userAgent: 'Mozilla/5.0...',
      },
      tags: ['failed-login', 'brute-force'],
      ruleId: 'rule-002',
      ruleName: 'Detect Brute Force Attacks',
      falsePositive: false,
      investigated: false,
      notes: [],
    },
  ];
};

const fetchSIEMMetrics = async (): Promise<SIEMMetrics> => {
  await mockApiDelay(600);
  
  return {
    totalEvents: 15247856,
    eventsPerSecond: 1247,
    alertsGenerated: 2847,
    rulesTriggered: 156,
    sourcesConnected: 23,
    sourcesTotal: 25,
    storageUsed: 2.4, // TB
    storageTotal: 10.0, // TB
    queryPerformance: 125, // ms average
    indexingRate: 98.5, // percentage
    eventsBySource: [
      { source: 'firewall-01', count: 5247856, percentage: 34.4, rate: 428 },
      { source: 'web-server-01', count: 3456789, percentage: 22.7, rate: 289 },
      { source: 'endpoint-agents', count: 2847563, percentage: 18.7, rate: 238 },
      { source: 'network-ids', count: 1895234, percentage: 12.4, rate: 158 },
    ],
    eventsByType: [
      { type: 'network', count: 6247856, percentage: 41.0, severity: 'medium' },
      { type: 'authentication', count: 3456789, percentage: 22.7, severity: 'high' },
      { type: 'file', count: 2847563, percentage: 18.7, severity: 'low' },
      { type: 'process', count: 1895234, percentage: 12.4, severity: 'medium' },
    ],
    alertTrends: [
      { timestamp: '2024-01-01T00:00:00Z', critical: 5, high: 23, medium: 67, low: 89, total: 184 },
      { timestamp: '2024-01-01T01:00:00Z', critical: 3, high: 28, medium: 72, low: 94, total: 197 },
      { timestamp: '2024-01-01T02:00:00Z', critical: 7, high: 31, medium: 58, low: 76, total: 172 },
    ],
    topRules: [
      { ruleId: 'rule-001', ruleName: 'Block Suspicious IPs', triggers: 1247, falsePositives: 23, accuracy: 98.2 },
      { ruleId: 'rule-002', ruleName: 'Detect Brute Force', triggers: 856, falsePositives: 45, accuracy: 94.7 },
      { ruleId: 'rule-003', ruleName: 'Malware Detection', triggers: 634, falsePositives: 12, accuracy: 98.1 },
    ],
    systemHealth: {
      cpu: 45.2,
      memory: 67.8,
      disk: 24.0,
      network: 89.3,
      indexingLag: 2.3, // seconds
      queryLatency: 125, // ms
    },
  };
};

// Provider component
export function SIEMProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(siemReducer, initialState);
  const queryClient = useQueryClient();

  // Fetch events
  const { data: events, isLoading: eventsLoading } = useQuery(
    ['siem-events', state.filters, state.searchQuery],
    () => fetchSIEMEvents(),
    {
      refetchInterval: state.realTimeEnabled ? 30000 : false,
      onSuccess: (data) => {
        dispatch({ type: 'SET_EVENTS', payload: data });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load SIEM events');
      },
    }
  );

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery(
    'siem-metrics',
    fetchSIEMMetrics,
    {
      refetchInterval: 60000, // 1 minute
      onSuccess: (data) => {
        dispatch({ type: 'SET_METRICS', payload: data });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load SIEM metrics');
      },
    }
  );

  // Update loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: eventsLoading || metricsLoading });
  }, [eventsLoading, metricsLoading]);

  // Context value
  const contextValue: SIEMContextType = {
    ...state,
    
    // Actions
    setSelectedEvent: (event) => dispatch({ type: 'SET_SELECTED_EVENT', payload: event }),
    setSelectedRule: (rule) => dispatch({ type: 'SET_SELECTED_RULE', payload: rule }),
    setCurrentDashboard: (dashboard) => dispatch({ type: 'SET_CURRENT_DASHBOARD', payload: dashboard }),
    setFilters: (filters) => dispatch({ type: 'SET_FILTERS', payload: filters }),
    setSearchQuery: (query) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query }),
    setRealTimeEnabled: (enabled) => dispatch({ type: 'SET_REAL_TIME', payload: enabled }),
    
    // API actions
    createRule: async (ruleData) => {
      await mockApiDelay(1000);
      const newRule: SIEMRule = {
        ...ruleData,
        id: `rule-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        triggerCount: 0,
        falsePositiveRate: 0,
      };
      dispatch({ type: 'SET_RULES', payload: [...state.rules, newRule] });
      toast.success('SIEM rule created successfully');
    },
    updateRule: async (rule) => {
      await mockApiDelay(600);
      dispatch({ type: 'UPDATE_RULE', payload: { ...rule, updatedAt: new Date().toISOString() } });
      toast.success('SIEM rule updated');
    },
    deleteRule: async (ruleId) => {
      await mockApiDelay(400);
      dispatch({ type: 'SET_RULES', payload: state.rules.filter(r => r.id !== ruleId) });
      toast.success('SIEM rule deleted');
    },
    testRule: async (rule) => {
      await mockApiDelay(2000);
      const mockResults = { matches: 15, events: state.events.slice(0, 5) };
      toast.success(`Rule test completed: ${mockResults.matches} matches found`);
      return mockResults;
    },
    
    markEventInvestigated: async (eventId, notes) => {
      await mockApiDelay(500);
      const event = state.events.find(e => e.id === eventId);
      if (event) {
        dispatch({ type: 'UPDATE_EVENT', payload: { ...event, investigated: true, notes: [...event.notes, notes] } });
        toast.success('Event marked as investigated');
      }
    },
    markEventFalsePositive: async (eventId) => {
      await mockApiDelay(400);
      const event = state.events.find(e => e.id === eventId);
      if (event) {
        dispatch({ type: 'UPDATE_EVENT', payload: { ...event, falsePositive: true } });
        toast.success('Event marked as false positive');
      }
    },
    
    addLogSource: async (sourceData) => {
      await mockApiDelay(1200);
      const newSource: LogSource = {
        ...sourceData,
        id: `source-${Date.now()}`,
        lastEvent: new Date().toISOString(),
        eventsPerSecond: 0,
        totalEvents: 0,
        errorRate: 0,
      };
      dispatch({ type: 'SET_SOURCES', payload: [...state.sources, newSource] });
      toast.success('Log source added successfully');
    },
    updateLogSource: async (source) => {
      await mockApiDelay(800);
      dispatch({ type: 'SET_SOURCES', payload: state.sources.map(s => s.id === source.id ? source : s) });
      toast.success('Log source updated');
    },
    testLogSource: async (sourceId) => {
      await mockApiDelay(3000);
      const result = { connected: true };
      toast.success('Log source connection test successful');
      return result;
    },
    
    // Utility functions
    refreshData: async () => {
      await queryClient.invalidateQueries('siem-events');
      await queryClient.invalidateQueries('siem-metrics');
    },
    exportEvents: async (format) => {
      await mockApiDelay(2000);
      toast.success(`Events exported as ${format.toUpperCase()}`);
    },
    searchEvents: async (query) => {
      await mockApiDelay(800);
      return state.events.filter(e => 
        e.message.toLowerCase().includes(query.toLowerCase()) ||
        e.source.toLowerCase().includes(query.toLowerCase())
      );
    },
    getEventById: (id: string) => state.events.find(e => e.id === id),
    correlateEvents: async (eventId) => {
      await mockApiDelay(1500);
      const event = state.events.find(e => e.id === eventId);
      if (event?.correlationId) {
        return state.events.filter(e => e.correlationId === event.correlationId);
      }
      return [];
    },
  };

  return (
    <SIEMContext.Provider value={contextValue}>
      {children}
    </SIEMContext.Provider>
  );
}

// Hook
export function useSIEM() {
  const context = useContext(SIEMContext);
  if (context === undefined) {
    throw new Error('useSIEM must be used within a SIEMProvider');
  }
  return context;
}
