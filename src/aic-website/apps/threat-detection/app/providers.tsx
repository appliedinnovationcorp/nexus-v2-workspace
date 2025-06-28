'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { ThemeProvider } from 'next-themes';
import { ThreatDetectionProvider } from '@/contexts/threat-detection-context';
import { SecurityMonitoringProvider } from '@/contexts/security-monitoring-context';
import { IncidentResponseProvider } from '@/contexts/incident-response-context';
import { ThreatIntelligenceProvider } from '@/contexts/threat-intelligence-context';
import { SIEMProvider } from '@/contexts/siem-context';
import { TooltipProvider } from '@/components/ui/tooltip';

// Create a client with security-focused configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Important for security monitoring
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: 30 * 1000, // 30 seconds - shorter for security data
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds for security data
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry security-critical mutations on auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: 1000,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark" // Default to dark theme for security operations
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <ThreatIntelligenceProvider>
            <SecurityMonitoringProvider>
              <ThreatDetectionProvider>
                <IncidentResponseProvider>
                  <SIEMProvider>
                    {children}
                  </SIEMProvider>
                </IncidentResponseProvider>
              </ThreatDetectionProvider>
            </SecurityMonitoringProvider>
          </ThreatIntelligenceProvider>
        </TooltipProvider>
      </ThemeProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
