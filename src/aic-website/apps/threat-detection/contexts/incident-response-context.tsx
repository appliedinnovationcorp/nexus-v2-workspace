'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';

// Types
export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  type: 'data_breach' | 'malware' | 'phishing' | 'ddos' | 'insider_threat' | 'system_compromise' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  assignedTo: string;
  reporter: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  affectedSystems: string[];
  impactAssessment: ImpactAssessment;
  timeline: IncidentTimelineEntry[];
  artifacts: IncidentArtifact[];
  playbook?: string;
  tags: string[];
  communicationLog: CommunicationEntry[];
  lessons: string[];
}

export interface ImpactAssessment {
  confidentiality: 'none' | 'low' | 'medium' | 'high' | 'critical';
  integrity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  availability: 'none' | 'low' | 'medium' | 'high' | 'critical';
  businessImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
  financialImpact: number;
  affectedUsers: number;
  dataCompromised: boolean;
  regulatoryImplications: boolean;
}

export interface IncidentTimelineEntry {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  actor: string;
  type: 'detection' | 'analysis' | 'containment' | 'eradication' | 'recovery' | 'communication' | 'documentation';
  automated: boolean;
}

export interface IncidentArtifact {
  id: string;
  name: string;
  type: 'log' | 'screenshot' | 'memory_dump' | 'network_capture' | 'document' | 'evidence';
  size: number;
  hash: string;
  uploadedBy: string;
  uploadedAt: string;
  description: string;
  tags: string[];
}

export interface CommunicationEntry {
  id: string;
  timestamp: string;
  type: 'internal' | 'external' | 'stakeholder' | 'regulatory' | 'media';
  recipient: string;
  sender: string;
  subject: string;
  content: string;
  method: 'email' | 'phone' | 'meeting' | 'chat' | 'notification';
}

export interface IncidentPlaybook {
  id: string;
  name: string;
  description: string;
  incidentTypes: string[];
  steps: PlaybookStep[];
  estimatedDuration: number;
  requiredRoles: string[];
  automationLevel: 'manual' | 'semi_automated' | 'fully_automated';
  lastUpdated: string;
  version: string;
}

export interface PlaybookStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: 'detection' | 'analysis' | 'containment' | 'eradication' | 'recovery' | 'communication';
  automated: boolean;
  estimatedTime: number;
  requiredRole: string;
  dependencies: string[];
  checklist: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  description: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  notes?: string;
}

export interface IncidentMetrics {
  totalIncidents: number;
  openIncidents: number;
  criticalIncidents: number;
  meanTimeToDetection: number;
  meanTimeToContainment: number;
  meanTimeToResolution: number;
  incidentsByType: IncidentTypeData[];
  incidentsBySeverity: IncidentSeverityData[];
  incidentTrends: IncidentTrendData[];
  responseTeamPerformance: TeamPerformanceData[];
}

export interface IncidentTypeData {
  type: string;
  count: number;
  percentage: number;
  avgResolutionTime: number;
}

export interface IncidentSeverityData {
  severity: string;
  count: number;
  percentage: number;
  avgResolutionTime: number;
}

export interface IncidentTrendData {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface TeamPerformanceData {
  member: string;
  assignedIncidents: number;
  resolvedIncidents: number;
  avgResolutionTime: number;
  performance: 'excellent' | 'good' | 'average' | 'needs_improvement';
}

// State
interface IncidentResponseState {
  incidents: SecurityIncident[];
  playbooks: IncidentPlaybook[];
  metrics: IncidentMetrics | null;
  selectedIncident: SecurityIncident | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status: string[];
    severity: string[];
    type: string[];
    assignee: string;
    dateRange: { start: Date; end: Date };
  };
  sortBy: 'createdAt' | 'updatedAt' | 'severity' | 'priority';
  sortOrder: 'asc' | 'desc';
}

// Actions
type IncidentResponseAction =
  | { type: 'SET_INCIDENTS'; payload: SecurityIncident[] }
  | { type: 'SET_PLAYBOOKS'; payload: IncidentPlaybook[] }
  | { type: 'SET_METRICS'; payload: IncidentMetrics }
  | { type: 'SET_SELECTED_INCIDENT'; payload: SecurityIncident | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<IncidentResponseState['filters']> }
  | { type: 'SET_SORT'; payload: { sortBy: IncidentResponseState['sortBy']; sortOrder: IncidentResponseState['sortOrder'] } }
  | { type: 'UPDATE_INCIDENT'; payload: SecurityIncident }
  | { type: 'ADD_INCIDENT'; payload: SecurityIncident };

// Reducer
function incidentResponseReducer(state: IncidentResponseState, action: IncidentResponseAction): IncidentResponseState {
  switch (action.type) {
    case 'SET_INCIDENTS':
      return { ...state, incidents: action.payload };
    case 'SET_PLAYBOOKS':
      return { ...state, playbooks: action.payload };
    case 'SET_METRICS':
      return { ...state, metrics: action.payload };
    case 'SET_SELECTED_INCIDENT':
      return { ...state, selectedIncident: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_SORT':
      return { ...state, sortBy: action.payload.sortBy, sortOrder: action.payload.sortOrder };
    case 'UPDATE_INCIDENT':
      return {
        ...state,
        incidents: state.incidents.map(i => i.id === action.payload.id ? action.payload : i),
        selectedIncident: state.selectedIncident?.id === action.payload.id ? action.payload : state.selectedIncident,
      };
    case 'ADD_INCIDENT':
      return { ...state, incidents: [action.payload, ...state.incidents] };
    default:
      return state;
  }
}

// Initial state
const initialState: IncidentResponseState = {
  incidents: [],
  playbooks: [],
  metrics: null,
  selectedIncident: null,
  isLoading: false,
  error: null,
  filters: {
    status: [],
    severity: [],
    type: [],
    assignee: '',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    },
  },
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

// Context
interface IncidentResponseContextType extends IncidentResponseState {
  // Actions
  setSelectedIncident: (incident: SecurityIncident | null) => void;
  setFilters: (filters: Partial<IncidentResponseState['filters']>) => void;
  setSort: (sortBy: IncidentResponseState['sortBy'], sortOrder: IncidentResponseState['sortOrder']) => void;
  
  // API actions
  createIncident: (incident: Omit<SecurityIncident, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>) => Promise<void>;
  updateIncident: (incident: SecurityIncident) => Promise<void>;
  updateIncidentStatus: (incidentId: string, status: SecurityIncident['status']) => Promise<void>;
  assignIncident: (incidentId: string, assignee: string) => Promise<void>;
  addTimelineEntry: (incidentId: string, entry: Omit<IncidentTimelineEntry, 'id' | 'timestamp'>) => Promise<void>;
  addArtifact: (incidentId: string, artifact: Omit<IncidentArtifact, 'id' | 'uploadedAt'>) => Promise<void>;
  executePlaybook: (incidentId: string, playbookId: string) => Promise<void>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  exportIncident: (incidentId: string, format: 'pdf' | 'json') => Promise<void>;
  getIncidentById: (id: string) => SecurityIncident | undefined;
  calculateSLA: (incident: SecurityIncident) => { breached: boolean; timeRemaining: number };
}

const IncidentResponseContext = createContext<IncidentResponseContextType | undefined>(undefined);

// Mock API functions
const mockApiDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchIncidents = async (): Promise<SecurityIncident[]> => {
  await mockApiDelay(1000);
  
  return [
    {
      id: 'inc-001',
      title: 'Ransomware Attack on Web Server',
      description: 'Critical ransomware infection detected on primary web server with file encryption in progress',
      type: 'malware',
      severity: 'critical',
      priority: 'p1',
      status: 'investigating',
      assignedTo: 'security-team-lead',
      reporter: 'monitoring-system',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      affectedSystems: ['web-server-01', 'database-01'],
      impactAssessment: {
        confidentiality: 'high',
        integrity: 'critical',
        availability: 'critical',
        businessImpact: 'critical',
        financialImpact: 500000,
        affectedUsers: 10000,
        dataCompromised: true,
        regulatoryImplications: true,
      },
      timeline: [
        {
          id: 'tl-001',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          action: 'Initial Detection',
          description: 'Automated monitoring detected suspicious file encryption activity',
          actor: 'monitoring-system',
          type: 'detection',
          automated: true,
        },
        {
          id: 'tl-002',
          timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          action: 'Incident Created',
          description: 'Security incident created and assigned to response team',
          actor: 'security-team-lead',
          type: 'analysis',
          automated: false,
        },
      ],
      artifacts: [],
      playbook: 'ransomware-response',
      tags: ['ransomware', 'critical', 'web-server'],
      communicationLog: [],
      lessons: [],
    },
    {
      id: 'inc-002',
      title: 'Phishing Campaign Targeting Employees',
      description: 'Large-scale phishing campaign detected targeting employee credentials',
      type: 'phishing',
      severity: 'high',
      priority: 'p2',
      status: 'contained',
      assignedTo: 'security-analyst-1',
      reporter: 'email-security-gateway',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      affectedSystems: ['email-system'],
      impactAssessment: {
        confidentiality: 'medium',
        integrity: 'low',
        availability: 'none',
        businessImpact: 'medium',
        financialImpact: 25000,
        affectedUsers: 500,
        dataCompromised: false,
        regulatoryImplications: false,
      },
      timeline: [],
      artifacts: [],
      tags: ['phishing', 'email', 'social-engineering'],
      communicationLog: [],
      lessons: [],
    },
  ];
};

const fetchIncidentMetrics = async (): Promise<IncidentMetrics> => {
  await mockApiDelay(800);
  
  return {
    totalIncidents: 247,
    openIncidents: 23,
    criticalIncidents: 5,
    meanTimeToDetection: 15.2, // minutes
    meanTimeToContainment: 45.7, // minutes
    meanTimeToResolution: 180.5, // minutes
    incidentsByType: [
      { type: 'malware', count: 89, percentage: 36.0, avgResolutionTime: 240 },
      { type: 'phishing', count: 67, percentage: 27.1, avgResolutionTime: 120 },
      { type: 'data_breach', count: 34, percentage: 13.8, avgResolutionTime: 480 },
      { type: 'ddos', count: 28, percentage: 11.3, avgResolutionTime: 90 },
      { type: 'insider_threat', count: 29, percentage: 11.7, avgResolutionTime: 360 },
    ],
    incidentsBySeverity: [
      { severity: 'critical', count: 23, percentage: 9.3, avgResolutionTime: 360 },
      { severity: 'high', count: 67, percentage: 27.1, avgResolutionTime: 240 },
      { severity: 'medium', count: 89, percentage: 36.0, avgResolutionTime: 180 },
      { severity: 'low', count: 68, percentage: 27.5, avgResolutionTime: 120 },
    ],
    incidentTrends: [
      { date: '2024-01-01', critical: 2, high: 5, medium: 8, low: 6, total: 21 },
      { date: '2024-01-02', critical: 1, high: 7, medium: 12, low: 9, total: 29 },
      { date: '2024-01-03', critical: 3, high: 4, medium: 9, low: 7, total: 23 },
      { date: '2024-01-04', critical: 0, high: 6, medium: 15, low: 11, total: 32 },
      { date: '2024-01-05', critical: 2, high: 8, medium: 11, low: 8, total: 29 },
    ],
    responseTeamPerformance: [
      { member: 'security-team-lead', assignedIncidents: 45, resolvedIncidents: 42, avgResolutionTime: 180, performance: 'excellent' },
      { member: 'security-analyst-1', assignedIncidents: 38, resolvedIncidents: 35, avgResolutionTime: 210, performance: 'good' },
      { member: 'security-analyst-2', assignedIncidents: 32, resolvedIncidents: 28, avgResolutionTime: 240, performance: 'average' },
    ],
  };
};

// Provider component
export function IncidentResponseProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(incidentResponseReducer, initialState);
  const queryClient = useQueryClient();

  // Fetch incidents
  const { data: incidents, isLoading: incidentsLoading } = useQuery(
    'security-incidents',
    fetchIncidents,
    {
      refetchInterval: 60000, // Refresh every minute
      onSuccess: (data) => {
        dispatch({ type: 'SET_INCIDENTS', payload: data });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load security incidents');
      },
    }
  );

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery(
    'incident-metrics',
    fetchIncidentMetrics,
    {
      refetchInterval: 300000, // Refresh every 5 minutes
      onSuccess: (data) => {
        dispatch({ type: 'SET_METRICS', payload: data });
      },
      onError: (error: any) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast.error('Failed to load incident metrics');
      },
    }
  );

  // Update loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: incidentsLoading || metricsLoading });
  }, [incidentsLoading, metricsLoading]);

  // Context value
  const contextValue: IncidentResponseContextType = {
    ...state,
    
    // Actions
    setSelectedIncident: (incident) => dispatch({ type: 'SET_SELECTED_INCIDENT', payload: incident }),
    setFilters: (filters) => dispatch({ type: 'SET_FILTERS', payload: filters }),
    setSort: (sortBy, sortOrder) => dispatch({ type: 'SET_SORT', payload: { sortBy, sortOrder } }),
    
    // API actions
    createIncident: async (incidentData) => {
      await mockApiDelay(1000);
      const newIncident: SecurityIncident = {
        ...incidentData,
        id: `inc-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [{
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Incident Created',
          description: 'Security incident created and assigned to response team',
          actor: incidentData.assignedTo,
          type: 'analysis',
          automated: false,
        }],
      };
      dispatch({ type: 'ADD_INCIDENT', payload: newIncident });
      toast.success('Security incident created successfully');
    },
    updateIncident: async (incident) => {
      await mockApiDelay(600);
      dispatch({ type: 'UPDATE_INCIDENT', payload: { ...incident, updatedAt: new Date().toISOString() } });
      toast.success('Incident updated successfully');
    },
    updateIncidentStatus: async (incidentId, status) => {
      await mockApiDelay(500);
      const incident = state.incidents.find(i => i.id === incidentId);
      if (incident) {
        const updatedIncident = {
          ...incident,
          status,
          updatedAt: new Date().toISOString(),
          resolvedAt: status === 'resolved' ? new Date().toISOString() : incident.resolvedAt,
        };
        dispatch({ type: 'UPDATE_INCIDENT', payload: updatedIncident });
        toast.success(`Incident status updated to ${status}`);
      }
    },
    assignIncident: async (incidentId, assignee) => {
      await mockApiDelay(400);
      const incident = state.incidents.find(i => i.id === incidentId);
      if (incident) {
        dispatch({ type: 'UPDATE_INCIDENT', payload: { ...incident, assignedTo: assignee, updatedAt: new Date().toISOString() } });
        toast.success(`Incident assigned to ${assignee}`);
      }
    },
    addTimelineEntry: async (incidentId, entryData) => {
      await mockApiDelay(300);
      const incident = state.incidents.find(i => i.id === incidentId);
      if (incident) {
        const newEntry: IncidentTimelineEntry = {
          ...entryData,
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
        const updatedIncident = {
          ...incident,
          timeline: [...incident.timeline, newEntry],
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: 'UPDATE_INCIDENT', payload: updatedIncident });
        toast.success('Timeline entry added');
      }
    },
    addArtifact: async (incidentId, artifactData) => {
      await mockApiDelay(800);
      const incident = state.incidents.find(i => i.id === incidentId);
      if (incident) {
        const newArtifact: IncidentArtifact = {
          ...artifactData,
          id: `art-${Date.now()}`,
          uploadedAt: new Date().toISOString(),
        };
        const updatedIncident = {
          ...incident,
          artifacts: [...incident.artifacts, newArtifact],
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: 'UPDATE_INCIDENT', payload: updatedIncident });
        toast.success('Artifact uploaded successfully');
      }
    },
    executePlaybook: async (incidentId, playbookId) => {
      await mockApiDelay(2000);
      toast.success('Incident response playbook executed');
    },
    
    // Utility functions
    refreshData: async () => {
      await queryClient.invalidateQueries('security-incidents');
      await queryClient.invalidateQueries('incident-metrics');
    },
    exportIncident: async (incidentId, format) => {
      await mockApiDelay(1500);
      toast.success(`Incident report exported as ${format.toUpperCase()}`);
    },
    getIncidentById: (id: string) => state.incidents.find(i => i.id === id),
    calculateSLA: (incident: SecurityIncident) => {
      const slaHours = incident.severity === 'critical' ? 4 : incident.severity === 'high' ? 8 : 24;
      const createdTime = new Date(incident.createdAt).getTime();
      const currentTime = new Date().getTime();
      const elapsedHours = (currentTime - createdTime) / (1000 * 60 * 60);
      const timeRemaining = Math.max(0, slaHours - elapsedHours);
      return {
        breached: elapsedHours > slaHours,
        timeRemaining: timeRemaining,
      };
    },
  };

  return (
    <IncidentResponseContext.Provider value={contextValue}>
      {children}
    </IncidentResponseContext.Provider>
  );
}

// Hook
export function useIncidentResponse() {
  const context = useContext(IncidentResponseContext);
  if (context === undefined) {
    throw new Error('useIncidentResponse must be used within an IncidentResponseProvider');
  }
  return context;
}
