import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';
import { PageErrorBoundary, AccessibilityProvider, SkipLinks } from '@aic/ui';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AIC Business Intelligence Dashboard',
  description: 'Enterprise-grade Business Intelligence Dashboard for Applied Innovation Corporation',
  keywords: 'business intelligence, analytics, dashboard, data visualization, enterprise, AI insights',
  authors: [{ name: 'Applied Innovation Corporation' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow', // Private dashboard
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <AccessibilityProvider>
          <PageErrorBoundary>
            <SkipLinks links={[
              { href: '#main-content', label: 'Skip to main content' },
              { href: '#sidebar-navigation', label: 'Skip to navigation' },
              { href: '#dashboard-filters', label: 'Skip to filters' },
            ]} />
            <Providers>
              <main id="main-content" role="main">
                {children}
              </main>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </Providers>
          </PageErrorBoundary>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
