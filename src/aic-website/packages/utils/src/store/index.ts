import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Base store interface
export interface BaseStore {
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Create base store with common functionality
export const createBaseStore = <T extends BaseStore>(
  name: string,
  initialState: Omit<T, keyof BaseStore>,
  actions: (set: any, get: any) => Omit<T, keyof BaseStore>
) => {
  return create<T>()(
    devtools(
      persist(
        subscribeWithSelector(
          immer((set, get) => ({
            // Base state
            loading: false,
            error: null,
            
            // Base actions
            setLoading: (loading: boolean) =>
              set((state) => {
                state.loading = loading;
              }),
            
            setError: (error: string | null) =>
              set((state) => {
                state.error = error;
                state.loading = false;
              }),
            
            clearError: () =>
              set((state) => {
                state.error = null;
              }),
            
            // Initial state
            ...initialState,
            
            // Custom actions
            ...actions(set, get),
          }))
        ),
        {
          name: `aic-${name}`,
          partialize: (state) => {
            // Only persist non-sensitive data
            const { loading, error, ...persistedState } = state as any;
            return persistedState;
          },
        }
      ),
      { name: `AIC ${name} Store` }
    )
  );
};

// Global App Store
interface AppStore extends BaseStore {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  notifications: Notification[];
  user: User | null;
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setUser: (user: User | null) => void;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  preferences: Record<string, any>;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useAppStore = createBaseStore<AppStore>(
  'app',
  {
    theme: 'system',
    sidebarOpen: false,
    notifications: [],
    user: null,
  },
  (set, get) => ({
    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
      }),
    
    toggleSidebar: () =>
      set((state) => {
        state.sidebarOpen = !state.sidebarOpen;
      }),
    
    setSidebarOpen: (open) =>
      set((state) => {
        state.sidebarOpen = open;
      }),
    
    addNotification: (notification) =>
      set((state) => {
        const newNotification: Notification = {
          ...notification,
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          read: false,
        };
        state.notifications.unshift(newNotification);
        
        // Keep only last 50 notifications
        if (state.notifications.length > 50) {
          state.notifications = state.notifications.slice(0, 50);
        }
      }),
    
    removeNotification: (id) =>
      set((state) => {
        state.notifications = state.notifications.filter(n => n.id !== id);
      }),
    
    clearNotifications: () =>
      set((state) => {
        state.notifications = [];
      }),
    
    setUser: (user) =>
      set((state) => {
        state.user = user;
      }),
  })
);

// Analytics Store
interface AnalyticsStore extends BaseStore {
  metrics: AnalyticsMetrics | null;
  realTimeData: RealTimeData | null;
  dateRange: DateRange;
  filters: AnalyticsFilters;
  
  setMetrics: (metrics: AnalyticsMetrics) => void;
  setRealTimeData: (data: RealTimeData) => void;
  setDateRange: (range: DateRange) => void;
  updateFilters: (filters: Partial<AnalyticsFilters>) => void;
  resetFilters: () => void;
}

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
}

interface RealTimeData {
  activeUsers: number;
  pageViews: number;
  events: Array<{
    id: string;
    type: string;
    timestamp: number;
    data: Record<string, any>;
  }>;
}

interface DateRange {
  start: Date;
  end: Date;
  preset?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';
}

interface AnalyticsFilters {
  segment: string[];
  channel: string[];
  device: string[];
  location: string[];
}

export const useAnalyticsStore = createBaseStore<AnalyticsStore>(
  'analytics',
  {
    metrics: null,
    realTimeData: null,
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
      preset: '30d',
    },
    filters: {
      segment: [],
      channel: [],
      device: [],
      location: [],
    },
  },
  (set, get) => ({
    setMetrics: (metrics) =>
      set((state) => {
        state.metrics = metrics;
      }),
    
    setRealTimeData: (data) =>
      set((state) => {
        state.realTimeData = data;
      }),
    
    setDateRange: (range) =>
      set((state) => {
        state.dateRange = range;
      }),
    
    updateFilters: (filters) =>
      set((state) => {
        state.filters = { ...state.filters, ...filters };
      }),
    
    resetFilters: () =>
      set((state) => {
        state.filters = {
          segment: [],
          channel: [],
          device: [],
          location: [],
        };
      }),
  })
);

// Security Store
interface SecurityStore extends BaseStore {
  threats: ThreatData[];
  alerts: SecurityAlert[];
  systemStatus: SystemStatus;
  
  addThreat: (threat: ThreatData) => void;
  updateThreat: (id: string, updates: Partial<ThreatData>) => void;
  removeThreat: (id: string) => void;
  addAlert: (alert: Omit<SecurityAlert, 'id' | 'timestamp'>) => void;
  dismissAlert: (id: string) => void;
  setSystemStatus: (status: SystemStatus) => void;
}

interface ThreatData {
  id: string;
  type: 'malware' | 'phishing' | 'ddos' | 'intrusion' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  source: string;
  target: string;
  timestamp: number;
  description: string;
  indicators: string[];
  response: string[];
}

interface SecurityAlert {
  id: string;
  type: 'threat' | 'system' | 'compliance' | 'access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  source: string;
}

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  services: Record<string, 'up' | 'down' | 'degraded'>;
  lastUpdate: number;
}

export const useSecurityStore = createBaseStore<SecurityStore>(
  'security',
  {
    threats: [],
    alerts: [],
    systemStatus: {
      overall: 'healthy',
      services: {},
      lastUpdate: Date.now(),
    },
  },
  (set, get) => ({
    addThreat: (threat) =>
      set((state) => {
        state.threats.unshift(threat);
      }),
    
    updateThreat: (id, updates) =>
      set((state) => {
        const index = state.threats.findIndex(t => t.id === id);
        if (index !== -1) {
          state.threats[index] = { ...state.threats[index], ...updates };
        }
      }),
    
    removeThreat: (id) =>
      set((state) => {
        state.threats = state.threats.filter(t => t.id !== id);
      }),
    
    addAlert: (alert) =>
      set((state) => {
        const newAlert: SecurityAlert = {
          ...alert,
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          acknowledged: false,
        };
        state.alerts.unshift(newAlert);
      }),
    
    dismissAlert: (id) =>
      set((state) => {
        const index = state.alerts.findIndex(a => a.id === id);
        if (index !== -1) {
          state.alerts[index].acknowledged = true;
        }
      }),
    
    setSystemStatus: (status) =>
      set((state) => {
        state.systemStatus = { ...status, lastUpdate: Date.now() };
      }),
  })
);

// Store utilities
export const createAsyncAction = <T>(
  store: any,
  actionName: string,
  asyncFn: () => Promise<T>
) => {
  return async () => {
    try {
      store.getState().setLoading(true);
      store.getState().clearError();
      
      const result = await asyncFn();
      
      store.getState().setLoading(false);
      return result;
    } catch (error) {
      store.getState().setError(error instanceof Error ? error.message : 'An error occurred');
      throw error;
    }
  };
};

// Store selectors
export const createSelectors = <T extends Record<string, any>>(store: any) => {
  const selectors = {} as {
    [K in keyof T]: () => T[K];
  };

  Object.keys(store.getState()).forEach((key) => {
    (selectors as any)[key] = () => store((state: T) => state[key]);
  });

  return selectors;
};

// Export store selectors
export const appSelectors = createSelectors(useAppStore);
export const analyticsSelectors = createSelectors(useAnalyticsStore);
export const securitySelectors = createSelectors(useSecurityStore);
