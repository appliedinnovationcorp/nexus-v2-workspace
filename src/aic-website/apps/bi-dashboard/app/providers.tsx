'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider } from '@/contexts/auth-context';
import { AnalyticsProvider } from '@/contexts/analytics-context';
import { DashboardProvider } from '@/contexts/dashboard-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { ErrorFallback } from '@/components/ui/error-fallback';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Application Error:', error, errorInfo);
        // Here you could send error to monitoring service
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AnalyticsProvider>
              <DashboardProvider>
                {children}
                {process.env.NODE_ENV === 'development' && (
                  <ReactQueryDevtools initialIsOpen={false} />
                )}
              </DashboardProvider>
            </AnalyticsProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
