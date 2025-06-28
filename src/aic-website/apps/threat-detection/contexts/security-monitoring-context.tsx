'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';

// Types
export interface SecurityAsset {
  id: string;
  name: string;
  type: 'server' | 'workstation' | 'network_device' | 'database' | 'application' | 'cloud_service';
  status: 'online' | 'offline' | 'maintenance' | 'compromised' | 'suspicious';
  ipAddress: string;
  location: string;
  owner: string;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  lastSeen: string;
  vulnerabilities: number;
  patchLevel: number;
  securityScore: number;
  monitoring: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  alerts: SecurityAlert[];
  compliance: ComplianceStatus[];
}

export interface SecurityAlert {
  id: string;
  assetId: string;
  type: 'performance' | 'security' | 'compliance' | 'availability';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  timestamp: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'suppressed';
  assignedTo?: string;
  resolution?: string;
  tags: string[];
}

export interface ComplianceStatus {
  framework: 'SOC2' | 'ISO27001' | 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'NIST';
  status: 'compliant' | 'non_compliant' | 'partial' | 'unknown';
  score: number;
  lastAssessment: string;
  findings: ComplianceFinding[];
}

export interface ComplianceFinding {
  id: string;
  control: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  remediation: string;
  dueDate: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface NetworkTopology {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  subnets: NetworkSubnet[];
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'router' | 'switch' | 'firewall' | 'server' | 'workstation' | 'iot_device';
  ipAddress: string;
  macAddress: string;
  status: 'online' | 'offline' | 'suspicious';
  position: { x: number; y: number };
  ports: NetworkPort[];
  traffic: TrafficMetrics;
}

export interface NetworkConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'ethernet' | 'wifi' | 'vpn' | 'internet';
  status: 'active' | 'inactive' | 'suspicious';
  bandwidth: number;
  latency: number;
  packetLoss: number;
}

export interface NetworkSubnet {
  id: string;
  name: string;
  cidr: string;
  vlan: number;
  nodes: string[];
  securityZone: 'dmz' | 'internal' | 'guest' | 'management';
}

export interface NetworkPort {
  number: number;
  protocol: 'tcp' | 'udp';
  status: 'open' | 'closed' | 'filtered';
  service?: string;
  version?: string;
}

export interface TrafficMetrics {
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  connectionsActive: number;
  connectionsTotal: number;
  anomalies: TrafficAnomaly[];
}

export interface TrafficAnomaly {
  id: string;
  type: 'volume' | 'pattern' | 'destination' | 'protocol';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  timestamp: string;
  confidence: number;
}

export interface SecurityDashboard {
  overview: {
    totalAssets: number;
    onlineAssets: number;
    criticalAlerts: number;
    complianceScore: number;
    securityScore: number;
    lastUpdate: string;
  };
  threatLevel: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
  recentAlerts: SecurityAlert[];
  topVulnerabilities: VulnerabilityData[];
  complianceStatus: ComplianceOverview[];
  networkHealth: NetworkHealthMetrics;
}

export interface VulnerabilityData {
  id: string;
  cve: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedAssets: number;
  patchAvailable: boolean;
  exploitAvailable: boolean;
  firstSeen: string;
}

export interface ComplianceOverview {
  framework: string;
  score: number;
  status: 'compliant' | 'non_compliant' | 'partial';
  findings: number;
  lastAssessment: string;
}

export interface NetworkHealthMetrics {
  uptime: number;
  throughput: number;
  latency: number;
  packetLoss: number;
  securityEvents: number;
  anomalies: number;
}

// State
interface SecurityMonitoringState {
  assets: SecurityAsset[];
  alerts: SecurityAlert[];
  topology: NetworkTopology | null;
  dashboard: SecurityDashboard | null;
  selectedAsset: SecurityAsset | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    assetType: string[];
    status: string[];
    criticality: string[];
    location: string;
  };
  viewMode: 'grid' | 'list' | 'topology';
  realTimeEnabled: boolean;
}

// Actions
type SecurityMonitoringAction =
  | { type: 'SET_ASSETS'; payload: SecurityAsset[] }
  | { type: 'SET_ALERTS'; payload: SecurityAlert[] }
  | { type: 'SET_TOPOLOGY'; payload: NetworkTopology }
  | { type: 'SET_DASHBOARD'; payload: SecurityDashboard }
  | { type: 'SET_SELECTED_ASSET'; payload: SecurityAsset | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<SecurityMonitoringState['filters']> }
  | { type: 'SET_VIEW_MODE'; payload: SecurityMonitoringState['viewMode'] }
  | { type: 'SET_REAL_TIME'; payload: boolean }
  | { type: 'UPDATE_ASSET'; payload: SecurityAsset }
  | { type: 'UPDATE_ALERT'; payload: SecurityAlert };

// Reducer
function securityMonitoringReducer(state: SecurityMonitoringState, action: SecurityMonitoringAction): SecurityMonitoringState {
  switch (action.type) {
    case 'SET_ASSETS':
      return { ...state, assets: action.payload };
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };
    case 'SET_TOPOLOGY':
      return { ...state, topology: action.payload };
    case 'SET_DASHBOARD':
      return { ...state, dashboard: action.payload };
    case 'SET_SELECTED_ASSET':
      return { ...state, selectedAsset: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_REAL_TIME':
      return { ...state, realTimeEnabled: action.payload };
    case 'UPDATE_ASSET':
      return {
        ...state,
        assets: state.assets.map(a => a.id === action.payload.id ? action.payload : a),
        selectedAsset: state.selectedAsset?.id === action.payload.id ? action.payload : state.selectedAsset,
      };
    case 'UPDATE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(a => a.id === action.payload.id ? action.payload : a),
      };
    default:
      return state;
  }
}

// Initial state
const initialState: SecurityMonitoringState = {
  assets: [],
  alerts: [],
  topology: null,
  dashboard: null,
  selectedAsset: null,
  isLoading: false,
  error: null,
  filters: {
    assetType: [],
    status: [],
    criticality: [],
    location: '',
  },
  viewMode: 'grid',
  realTimeEnabled: true,
};

// Context
interface SecurityMonitoringContextType extends SecurityMonitoringState {
  // Actions
  setSelectedAsset: (asset: SecurityAsset | null) => void;
  setFilters: (filters: Partial<SecurityMonitoringState['filters']>) => void;
  setViewMode: (mode: SecurityMonitoringState['viewMode']) => void;
  setRealTimeEnabled: (enabled: boolean) => void;
  
  // API actions
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string, resolution: string) => Promise<void>;
  updateAssetStatus: (assetId: string, status: SecurityAsset['status']) => Promise<void>;
  runSecurityScan: (assetId: string) => Promise<void>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  getAssetById: (id: string) => SecurityAsset | undefined;
  getAlertsByAsset: (assetId: string) => SecurityAlert[];
  calculateSecurityScore: (asset: SecurityAsset) => number;
  exportSecurityReport: (format: 'pdf' | 'csv' | 'json') => Promise<void>;
}

const SecurityMonitoringContext = createContext<SecurityMonitoringContextType | undefined>(undefined);

// Mock API functions
const mockApiDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchSecurityAssets = async (): Promise<SecurityAsset[]> => {
  await mockApiDelay(1200);
  
  return [
    {
      id: 'asset-1',
      name: 'Web Server 01',
      type: 'server',
      status: 'online',
      ipAddress: '192.168.1.100',
      location: 'Data Center A',
      owner: 'IT Operations',
      criticality: 'critical',
      lastSeen: new Date().toISOString(),
      vulnerabilities: 3,
      patchLevel: 85,
      securityScore: 78,
      monitoring: {
        cpu: 45,
        memory: 67,
        disk: 23,
        network: 89,
      },
      alerts: [],
      compliance: [
        {
          framework: 'SOC2',
          status: 'compliant',
          score: 92,
          lastAssessment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          findings: [],
        },
      ],
    },
    {
      id: 'asset-2',
      name: 'Database Server',
      type: 'database',
      status: 'suspicious',
      ipAddress: '192.168.1.101',
      location: 'Data Center A',
      owner: 'Database Team',
      criticality: 'critical',
      lastSeen: new Date().toISOString(),
      vulnerabilities: 7,
      patchLevel: 72,
      securityScore: 65,
      monitoring: {
        cpu: 78,
        memory: 89,
        disk: 45,
        network: 67,
      },
      alerts: [],
      compliance: [
        {
          framework: 'PCI-DSS',
          status: 'partial',
          score: 78,
          lastAssessment: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          findings: [
            {
              id: 'finding-1',
              control: 'Access Control',
              severity: 'medium',
              description: 'Weak password policy detected',
              remediation: 'Implement stronger password requirements',
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'open',
            },
          ],
        },
      ],
    },
  ];
};

const fetchSecurityDashboard = async (): Promise<SecurityDashboard> => {
  await mockApiDelay(800);
  
  return {
    overview: {
      totalAssets: 247,
      onlineAssets: 234,
      criticalAlerts: 12,
      complianceScore: 87,
      securityScore: 82,
      lastUpdate: new Date().toISOString(),
    },
    threatLevel: 'medium',
    recentAlerts: [
      {
        id: 'alert-1',
        assetId: 'asset-2',
        type: 'security',
        severity: 'high',
        title: 'Suspicious Database Access',
        description: 'Unusual database queries detected from external IP',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        status: 'open',
        tags: ['database', 'suspicious-access'],
      },
    ],
    topVulnerabilities: [
      {
        id: 'vuln-1',
        cve: 'CVE-2023-1234',
        severity: 'critical',
        description: 'Remote code execution vulnerability in web server',
        affectedAssets: 5,
        patchAvailable: true,
        exploitAvailable: false,
        firstSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    complianceStatus: [
      { framework: 'SOC2', score: 92, status: 'compliant', findings: 2, lastAssessment: '2024-01-01' },
      { framework: 'ISO27001', score: 88, status: 'compliant', findings: 5, lastAssessment: '2024-01-01' },
      { framework: 'PCI-DSS', score: 78, status: 'partial', findings: 8, lastAssessment: '2024-01-01' },
    ],
    networkHealth: {
      uptime: 99.8,
      throughput: 85.2,
      latency: 12.5,
      packetLoss: 0.02,
      securityEvents: 23,
      anomalies: 3,
    },
  };
};

// Provider component
export function SecurityMonitoringProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(securityMonitoringReducer, initialState);
  const queryClient = useQueryClient();

  // Fetch assets
  const { data: assets, isLoading: assetsLoading } = useQuery(
    'security-assets',
    fetchSecurityAssets,
    {
      refetchInterval: state.realTimeEnabled ? 30000 : false,
      onSuccess: (data) => {
        dispatch({ type: 'SET_ASSETS', payload: data });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load security assets');
      },
    }
  );

  // Fetch dashboard
  const { data: dashboard, isLoading: dashboardLoading } = useQuery(
    'security-dashboard',
    fetchSecurityDashboard,
    {
      refetchInterval: state.realTimeEnabled ? 30000 : false,
      onSuccess: (data) => {
        dispatch({ type: 'SET_DASHBOARD', payload: data });
        dispatch({ type: 'SET_ALERTS', payload: data.recentAlerts });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load security dashboard');
      },
    }
  );

  // Update loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: assetsLoading || dashboardLoading });
  }, [assetsLoading, dashboardLoading]);

  // Context value
  const contextValue: SecurityMonitoringContextType = {
    ...state,
    
    // Actions
    setSelectedAsset: (asset) => dispatch({ type: 'SET_SELECTED_ASSET', payload: asset }),
    setFilters: (filters) => dispatch({ type: 'SET_FILTERS', payload: filters }),
    setViewMode: (mode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode }),
    setRealTimeEnabled: (enabled) => dispatch({ type: 'SET_REAL_TIME', payload: enabled }),
    
    // API actions
    acknowledgeAlert: async (alertId: string) => {
      await mockApiDelay(500);
      const alert = state.alerts.find(a => a.id === alertId);
      if (alert) {
        dispatch({ type: 'UPDATE_ALERT', payload: { ...alert, status: 'acknowledged' } });
        toast.success('Alert acknowledged');
      }
    },
    resolveAlert: async (alertId: string, resolution: string) => {
      await mockApiDelay(600);
      const alert = state.alerts.find(a => a.id === alertId);
      if (alert) {
        dispatch({ type: 'UPDATE_ALERT', payload: { ...alert, status: 'resolved', resolution } });
        toast.success('Alert resolved');
      }
    },
    updateAssetStatus: async (assetId: string, status: SecurityAsset['status']) => {
      await mockApiDelay(400);
      const asset = state.assets.find(a => a.id === assetId);
      if (asset) {
        dispatch({ type: 'UPDATE_ASSET', payload: { ...asset, status } });
        toast.success(`Asset status updated to ${status}`);
      }
    },
    runSecurityScan: async (assetId: string) => {
      await mockApiDelay(3000);
      toast.success('Security scan completed');
    },
    
    // Utility functions
    refreshData: async () => {
      await queryClient.invalidateQueries('security-assets');
      await queryClient.invalidateQueries('security-dashboard');
    },
    getAssetById: (id: string) => state.assets.find(a => a.id === id),
    getAlertsByAsset: (assetId: string) => state.alerts.filter(a => a.assetId === assetId),
    calculateSecurityScore: (asset: SecurityAsset) => {
      const vulnerabilityPenalty = asset.vulnerabilities * 5;
      const patchBonus = asset.patchLevel;
      return Math.max(0, Math.min(100, 100 - vulnerabilityPenalty + (patchBonus - 50)));
    },
    exportSecurityReport: async (format) => {
      await mockApiDelay(2000);
      toast.success(`Security report exported as ${format.toUpperCase()}`);
    },
  };

  return (
    <SecurityMonitoringContext.Provider value={contextValue}>
      {children}
    </SecurityMonitoringContext.Provider>
  );
}

// Hook
export function useSecurityMonitoring() {
  const context = useContext(SecurityMonitoringContext);
  if (context === undefined) {
    throw new Error('useSecurityMonitoring must be used within a SecurityMonitoringProvider');
  }
  return context;
}
