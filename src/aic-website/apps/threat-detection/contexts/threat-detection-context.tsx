'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';

// Types
export interface ThreatEvent {
  id: string;
  timestamp: string;
  type: 'malware' | 'intrusion' | 'ddos' | 'phishing' | 'data_breach' | 'insider_threat' | 'apt' | 'vulnerability';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source: string;
  target: string;
  description: string;
  details: Record<string, any>;
  status: 'active' | 'investigating' | 'contained' | 'resolved' | 'false_positive';
  assignedTo?: string;
  tags: string[];
  indicators: ThreatIndicator[];
  mitigationSteps: string[];
  affectedAssets: string[];
  riskScore: number;
  confidence: number;
  geolocation?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}

export interface ThreatIndicator {
  id: string;
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'file' | 'registry' | 'process';
  value: string;
  confidence: number;
  firstSeen: string;
  lastSeen: string;
  sources: string[];
  tags: string[];
}

export interface ThreatSignature {
  id: string;
  name: string;
  description: string;
  pattern: string;
  type: 'network' | 'host' | 'application' | 'behavioral';
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  lastUpdated: string;
  author: string;
  references: string[];
}

export interface SecurityMetrics {
  totalThreats: number;
  activeThreats: number;
  resolvedThreats: number;
  criticalThreats: number;
  highThreats: number;
  mediumThreats: number;
  lowThreats: number;
  meanTimeToDetection: number;
  meanTimeToResponse: number;
  meanTimeToResolution: number;
  falsePositiveRate: number;
  threatTrends: ThreatTrendData[];
  topThreatTypes: ThreatTypeData[];
  topTargets: TargetData[];
  geographicDistribution: GeographicData[];
}

export interface ThreatTrendData {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface ThreatTypeData {
  type: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TargetData {
  target: string;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  lastAttack: string;
}

export interface GeographicData {
  country: string;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  coordinates: [number, number];
}

// State
interface ThreatDetectionState {
  threats: ThreatEvent[];
  signatures: ThreatSignature[];
  metrics: SecurityMetrics | null;
  selectedThreat: ThreatEvent | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    severity: string[];
    type: string[];
    status: string[];
    dateRange: { start: Date; end: Date };
    source: string;
    target: string;
  };
  realTimeEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

// Actions
type ThreatDetectionAction =
  | { type: 'SET_THREATS'; payload: ThreatEvent[] }
  | { type: 'SET_SIGNATURES'; payload: ThreatSignature[] }
  | { type: 'SET_METRICS'; payload: SecurityMetrics }
  | { type: 'SET_SELECTED_THREAT'; payload: ThreatEvent | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<ThreatDetectionState['filters']> }
  | { type: 'SET_REAL_TIME'; payload: boolean }
  | { type: 'SET_AUTO_REFRESH'; payload: boolean }
  | { type: 'SET_REFRESH_INTERVAL'; payload: number }
  | { type: 'UPDATE_THREAT'; payload: ThreatEvent }
  | { type: 'ADD_THREAT'; payload: ThreatEvent }
  | { type: 'REMOVE_THREAT'; payload: string };

// Reducer
function threatDetectionReducer(state: ThreatDetectionState, action: ThreatDetectionAction): ThreatDetectionState {
  switch (action.type) {
    case 'SET_THREATS':
      return { ...state, threats: action.payload };
    case 'SET_SIGNATURES':
      return { ...state, signatures: action.payload };
    case 'SET_METRICS':
      return { ...state, metrics: action.payload };
    case 'SET_SELECTED_THREAT':
      return { ...state, selectedThreat: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_REAL_TIME':
      return { ...state, realTimeEnabled: action.payload };
    case 'SET_AUTO_REFRESH':
      return { ...state, autoRefresh: action.payload };
    case 'SET_REFRESH_INTERVAL':
      return { ...state, refreshInterval: action.payload };
    case 'UPDATE_THREAT':
      return {
        ...state,
        threats: state.threats.map(t => t.id === action.payload.id ? action.payload : t),
        selectedThreat: state.selectedThreat?.id === action.payload.id ? action.payload : state.selectedThreat,
      };
    case 'ADD_THREAT':
      return { ...state, threats: [action.payload, ...state.threats] };
    case 'REMOVE_THREAT':
      return {
        ...state,
        threats: state.threats.filter(t => t.id !== action.payload),
        selectedThreat: state.selectedThreat?.id === action.payload ? null : state.selectedThreat,
      };
    default:
      return state;
  }
}

// Initial state
const initialState: ThreatDetectionState = {
  threats: [],
  signatures: [],
  metrics: null,
  selectedThreat: null,
  isLoading: false,
  error: null,
  filters: {
    severity: [],
    type: [],
    status: [],
    dateRange: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      end: new Date(),
    },
    source: '',
    target: '',
  },
  realTimeEnabled: true,
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
};

// Context
interface ThreatDetectionContextType extends ThreatDetectionState {
  // Actions
  setSelectedThreat: (threat: ThreatEvent | null) => void;
  setFilters: (filters: Partial<ThreatDetectionState['filters']>) => void;
  setRealTimeEnabled: (enabled: boolean) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  
  // API actions
  updateThreatStatus: (threatId: string, status: ThreatEvent['status']) => Promise<void>;
  assignThreat: (threatId: string, assignee: string) => Promise<void>;
  addThreatNote: (threatId: string, note: string) => Promise<void>;
  createSignature: (signature: Omit<ThreatSignature, 'id' | 'lastUpdated'>) => Promise<void>;
  updateSignature: (signature: ThreatSignature) => Promise<void>;
  deleteSignature: (signatureId: string) => Promise<void>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  exportThreats: (format: 'csv' | 'json' | 'pdf') => Promise<void>;
  getThreatById: (id: string) => ThreatEvent | undefined;
  getThreatsBy: (field: keyof ThreatEvent, value: any) => ThreatEvent[];
  calculateRiskScore: (threat: ThreatEvent) => number;
}

const ThreatDetectionContext = createContext<ThreatDetectionContextType | undefined>(undefined);

// Mock API functions
const mockApiDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchThreats = async (filters: ThreatDetectionState['filters']): Promise<ThreatEvent[]> => {
  await mockApiDelay(1000);
  
  // Generate mock threat data
  const mockThreats: ThreatEvent[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      type: 'malware',
      severity: 'critical',
      source: '192.168.1.100',
      target: 'web-server-01',
      description: 'Ransomware detected on web server',
      details: {
        malwareFamily: 'Ryuk',
        encryptedFiles: 1247,
        demandAmount: '$50,000',
        contactEmail: 'recovery@evil.com',
      },
      status: 'active',
      assignedTo: 'security-team',
      tags: ['ransomware', 'critical', 'web-server'],
      indicators: [
        {
          id: 'ind-1',
          type: 'hash',
          value: 'a1b2c3d4e5f6789012345678901234567890abcd',
          confidence: 95,
          firstSeen: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          lastSeen: new Date().toISOString(),
          sources: ['VirusTotal', 'Internal'],
          tags: ['malware', 'ransomware'],
        },
      ],
      mitigationSteps: [
        'Isolate affected system',
        'Preserve forensic evidence',
        'Restore from clean backups',
        'Update security signatures',
      ],
      affectedAssets: ['web-server-01', 'database-01'],
      riskScore: 95,
      confidence: 90,
      geolocation: {
        country: 'Russia',
        city: 'Moscow',
        latitude: 55.7558,
        longitude: 37.6176,
      },
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      type: 'intrusion',
      severity: 'high',
      source: '203.0.113.45',
      target: 'ssh-server',
      description: 'Brute force attack detected on SSH service',
      details: {
        attempts: 1247,
        duration: '2 hours',
        usernames: ['admin', 'root', 'user'],
        successfulLogins: 0,
      },
      status: 'investigating',
      assignedTo: 'incident-response',
      tags: ['brute-force', 'ssh', 'intrusion'],
      indicators: [
        {
          id: 'ind-2',
          type: 'ip',
          value: '203.0.113.45',
          confidence: 85,
          firstSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          lastSeen: new Date().toISOString(),
          sources: ['Firewall', 'IDS'],
          tags: ['brute-force', 'malicious-ip'],
        },
      ],
      mitigationSteps: [
        'Block source IP address',
        'Enable account lockout policy',
        'Implement rate limiting',
        'Review authentication logs',
      ],
      affectedAssets: ['ssh-server'],
      riskScore: 75,
      confidence: 85,
      geolocation: {
        country: 'China',
        city: 'Beijing',
        latitude: 39.9042,
        longitude: 116.4074,
      },
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      type: 'phishing',
      severity: 'medium',
      source: 'email-gateway',
      target: 'employees',
      description: 'Phishing email campaign detected',
      details: {
        emailsBlocked: 45,
        targetedUsers: 150,
        clickRate: '12%',
        subject: 'Urgent: Update Your Password',
        sender: 'security@fake-bank.com',
      },
      status: 'contained',
      assignedTo: 'security-awareness',
      tags: ['phishing', 'email', 'social-engineering'],
      indicators: [
        {
          id: 'ind-3',
          type: 'domain',
          value: 'fake-bank.com',
          confidence: 90,
          firstSeen: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          lastSeen: new Date().toISOString(),
          sources: ['Email Gateway', 'DNS'],
          tags: ['phishing', 'malicious-domain'],
        },
      ],
      mitigationSteps: [
        'Block malicious domain',
        'Send security awareness alert',
        'Review email security policies',
        'Conduct phishing simulation',
      ],
      affectedAssets: ['email-system'],
      riskScore: 60,
      confidence: 80,
      geolocation: {
        country: 'United States',
        city: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
      },
    },
  ];

  return mockThreats;
};

const fetchSecurityMetrics = async (): Promise<SecurityMetrics> => {
  await mockApiDelay(800);
  
  return {
    totalThreats: 1247,
    activeThreats: 23,
    resolvedThreats: 1198,
    criticalThreats: 5,
    highThreats: 18,
    mediumThreats: 45,
    lowThreats: 89,
    meanTimeToDetection: 12.5, // minutes
    meanTimeToResponse: 8.2, // minutes
    meanTimeToResolution: 145.7, // minutes
    falsePositiveRate: 3.2, // percentage
    threatTrends: [
      { date: '2024-01-01', critical: 2, high: 5, medium: 12, low: 8, total: 27 },
      { date: '2024-01-02', critical: 1, high: 8, medium: 15, low: 12, total: 36 },
      { date: '2024-01-03', critical: 3, high: 6, medium: 10, low: 9, total: 28 },
      { date: '2024-01-04', critical: 0, high: 4, medium: 18, low: 15, total: 37 },
      { date: '2024-01-05', critical: 2, high: 7, medium: 14, low: 11, total: 34 },
    ],
    topThreatTypes: [
      { type: 'malware', count: 456, percentage: 36.6, trend: 'up' },
      { type: 'intrusion', count: 234, percentage: 18.8, trend: 'down' },
      { type: 'phishing', count: 189, percentage: 15.2, trend: 'stable' },
      { type: 'ddos', count: 123, percentage: 9.9, trend: 'up' },
      { type: 'vulnerability', count: 98, percentage: 7.9, trend: 'down' },
    ],
    topTargets: [
      { target: 'web-server-01', count: 45, severity: 'high', lastAttack: '2024-01-05T10:30:00Z' },
      { target: 'database-01', count: 32, severity: 'critical', lastAttack: '2024-01-05T09:15:00Z' },
      { target: 'email-server', count: 28, severity: 'medium', lastAttack: '2024-01-05T08:45:00Z' },
    ],
    geographicDistribution: [
      { country: 'Russia', count: 234, severity: 'critical', coordinates: [37.6176, 55.7558] },
      { country: 'China', count: 189, severity: 'high', coordinates: [116.4074, 39.9042] },
      { country: 'North Korea', count: 156, severity: 'high', coordinates: [125.7625, 39.0392] },
      { country: 'Iran', count: 123, severity: 'medium', coordinates: [51.3890, 35.6892] },
    ],
  };
};

const fetchThreatSignatures = async (): Promise<ThreatSignature[]> => {
  await mockApiDelay(600);
  
  return [
    {
      id: 'sig-1',
      name: 'Ransomware File Extension Detection',
      description: 'Detects files with common ransomware extensions',
      pattern: '\\.(encrypted|locked|crypto|vault|zepto|locky)$',
      type: 'host',
      severity: 'critical',
      enabled: true,
      lastUpdated: new Date().toISOString(),
      author: 'AIC Security Team',
      references: ['CVE-2023-1234', 'MITRE ATT&CK T1486'],
    },
    {
      id: 'sig-2',
      name: 'SQL Injection Attempt',
      description: 'Detects SQL injection patterns in web requests',
      pattern: '(union|select|insert|update|delete|drop)\\s+.*\\s+(from|into|table)',
      type: 'network',
      severity: 'high',
      enabled: true,
      lastUpdated: new Date().toISOString(),
      author: 'Web Security Team',
      references: ['OWASP Top 10', 'CWE-89'],
    },
  ];
};

// Provider component
export function ThreatDetectionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(threatDetectionReducer, initialState);
  const queryClient = useQueryClient();

  // Fetch threats
  const { data: threats, isLoading: threatsLoading } = useQuery(
    ['threats', state.filters],
    () => fetchThreats(state.filters),
    {
      refetchInterval: state.autoRefresh ? state.refreshInterval : false,
      onSuccess: (data) => {
        dispatch({ type: 'SET_THREATS', payload: data });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load threat data');
      },
    }
  );

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery(
    'security-metrics',
    fetchSecurityMetrics,
    {
      refetchInterval: state.autoRefresh ? state.refreshInterval : false,
      onSuccess: (data) => {
        dispatch({ type: 'SET_METRICS', payload: data });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load security metrics');
      },
    }
  );

  // Fetch signatures
  const { data: signatures, isLoading: signaturesLoading } = useQuery(
    'threat-signatures',
    fetchThreatSignatures,
    {
      onSuccess: (data) => {
        dispatch({ type: 'SET_SIGNATURES', payload: data });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load threat signatures');
      },
    }
  );

  // Mutations
  const updateThreatStatusMutation = useMutation(
    async ({ threatId, status }: { threatId: string; status: ThreatEvent['status'] }) => {
      await mockApiDelay(500);
      const threat = state.threats.find(t => t.id === threatId);
      if (!threat) throw new Error('Threat not found');
      return { ...threat, status, timestamp: new Date().toISOString() };
    },
    {
      onSuccess: (updatedThreat) => {
        dispatch({ type: 'UPDATE_THREAT', payload: updatedThreat });
        toast.success(`Threat status updated to ${updatedThreat.status}`);
      },
      onError: (error: any) => {
        toast.error('Failed to update threat status');
      },
    }
  );

  // Update loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: threatsLoading || metricsLoading || signaturesLoading });
  }, [threatsLoading, metricsLoading, signaturesLoading]);

  // Context value
  const contextValue: ThreatDetectionContextType = {
    ...state,
    
    // Actions
    setSelectedThreat: (threat) => dispatch({ type: 'SET_SELECTED_THREAT', payload: threat }),
    setFilters: (filters) => dispatch({ type: 'SET_FILTERS', payload: filters }),
    setRealTimeEnabled: (enabled) => dispatch({ type: 'SET_REAL_TIME', payload: enabled }),
    setAutoRefresh: (enabled) => dispatch({ type: 'SET_AUTO_REFRESH', payload: enabled }),
    setRefreshInterval: (interval) => dispatch({ type: 'SET_REFRESH_INTERVAL', payload: interval }),
    
    // API actions
    updateThreatStatus: async (threatId: string, status: ThreatEvent['status']) => {
      await updateThreatStatusMutation.mutateAsync({ threatId, status });
    },
    assignThreat: async (threatId: string, assignee: string) => {
      await mockApiDelay(500);
      const threat = state.threats.find(t => t.id === threatId);
      if (threat) {
        dispatch({ type: 'UPDATE_THREAT', payload: { ...threat, assignedTo: assignee } });
        toast.success(`Threat assigned to ${assignee}`);
      }
    },
    addThreatNote: async (threatId: string, note: string) => {
      await mockApiDelay(300);
      toast.success('Note added to threat');
    },
    createSignature: async (signature) => {
      await mockApiDelay(800);
      const newSignature: ThreatSignature = {
        ...signature,
        id: Date.now().toString(),
        lastUpdated: new Date().toISOString(),
      };
      dispatch({ type: 'SET_SIGNATURES', payload: [...state.signatures, newSignature] });
      toast.success('Threat signature created');
    },
    updateSignature: async (signature) => {
      await mockApiDelay(600);
      dispatch({ 
        type: 'SET_SIGNATURES', 
        payload: state.signatures.map(s => s.id === signature.id ? signature : s) 
      });
      toast.success('Threat signature updated');
    },
    deleteSignature: async (signatureId) => {
      await mockApiDelay(400);
      dispatch({ 
        type: 'SET_SIGNATURES', 
        payload: state.signatures.filter(s => s.id !== signatureId) 
      });
      toast.success('Threat signature deleted');
    },
    
    // Utility functions
    refreshData: async () => {
      await queryClient.invalidateQueries(['threats']);
      await queryClient.invalidateQueries('security-metrics');
    },
    exportThreats: async (format) => {
      await mockApiDelay(2000);
      toast.success(`Threats exported as ${format.toUpperCase()}`);
    },
    getThreatById: (id: string) => state.threats.find(t => t.id === id),
    getThreatsBy: (field: keyof ThreatEvent, value: any) => 
      state.threats.filter(t => t[field] === value),
    calculateRiskScore: (threat: ThreatEvent) => {
      const severityWeights = { critical: 100, high: 75, medium: 50, low: 25, info: 10 };
      const baseScore = severityWeights[threat.severity];
      const confidenceMultiplier = threat.confidence / 100;
      return Math.round(baseScore * confidenceMultiplier);
    },
  };

  return (
    <ThreatDetectionContext.Provider value={contextValue}>
      {children}
    </ThreatDetectionContext.Provider>
  );
}

// Hook
export function useThreatDetection() {
  const context = useContext(ThreatDetectionContext);
  if (context === undefined) {
    throw new Error('useThreatDetection must be used within a ThreatDetectionProvider');
  }
  return context;
}
