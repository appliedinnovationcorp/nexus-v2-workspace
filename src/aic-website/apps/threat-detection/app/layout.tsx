import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AIC Threat Detection | Enterprise Security Monitoring',
  description: 'Advanced threat detection and security monitoring platform for Applied Innovation Corporation. Real-time threat analysis, incident response, and comprehensive security operations center.',
  keywords: [
    'threat detection',
    'security monitoring',
    'intrusion detection',
    'SIEM',
    'cybersecurity',
    'incident response',
    'security operations',
    'enterprise security',
    'threat intelligence',
    'security analytics',
  ],
  authors: [{ name: 'Applied Innovation Corporation' }],
  creator: 'Applied Innovation Corporation',
  publisher: 'Applied Innovation Corporation',
  robots: {
    index: false, // Private enterprise security application
    follow: false,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://security.aicorp.com',
    title: 'AIC Threat Detection Platform',
    description: 'Enterprise threat detection and security monitoring platform',
    siteName: 'AIC Security Operations',
    images: [
      {
        url: '/og-security.png',
        width: 1200,
        height: 630,
        alt: 'AIC Threat Detection Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIC Threat Detection Platform',
    description: 'Enterprise threat detection and security monitoring platform',
    images: ['/twitter-security.png'],
    creator: '@AICorp',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="AIC Threat Detection" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AIC Security" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#dc2626" />
        
        {/* Enhanced security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=()" />
        <meta httpEquiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains; preload" />
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:; font-src 'self' data:;" />
        
        {/* Preload critical security resources */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/security/threat-signatures.json" as="fetch" crossOrigin="anonymous" />
        
        {/* DNS prefetch for security services */}
        <link rel="dns-prefetch" href="//threat-intel.aicorp.com" />
        <link rel="dns-prefetch" href="//siem.aicorp.com" />
        <link rel="preconnect" href="https://security-api.aicorp.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background font-sans antialiased">
            {children}
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 6000,
              style: {
                background: '#1f2937',
                color: '#f9fafb',
                border: '1px solid #374151',
              },
              success: {
                duration: 4000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f9fafb',
                },
              },
              error: {
                duration: 8000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f9fafb',
                },
              },
              loading: {
                duration: Infinity,
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#f9fafb',
                },
              },
            }}
          />
        </Providers>
        
        {/* Security monitoring and analytics scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Security event monitoring
              window.securityConfig = {
                threatLevel: 'enterprise',
                monitoringEnabled: true,
                realTimeAlerts: true,
                incidentResponse: true
              };
              
              // Performance and security monitoring
              if ('performance' in window) {
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
                    
                    // Log performance metrics for security analysis
                    if (window.securityLogger) {
                      window.securityLogger.logPerformance({
                        loadTime: loadTime,
                        timestamp: Date.now(),
                        userAgent: navigator.userAgent,
                        url: window.location.href
                      });
                    }
                  }, 0);
                });
              }
              
              // Enhanced error tracking for security events
              window.addEventListener('error', function(e) {
                const errorData = {
                  message: e.message,
                  filename: e.filename,
                  lineno: e.lineno,
                  colno: e.colno,
                  stack: e.error?.stack,
                  timestamp: Date.now(),
                  userAgent: navigator.userAgent,
                  url: window.location.href
                };
                
                // Send to security monitoring service
                if (window.securityLogger) {
                  window.securityLogger.logSecurityEvent('javascript_error', errorData);
                }
                
                console.error('Security-monitored error:', errorData);
              });
              
              // Unhandled promise rejection tracking
              window.addEventListener('unhandledrejection', function(e) {
                const rejectionData = {
                  reason: e.reason,
                  promise: e.promise,
                  timestamp: Date.now(),
                  userAgent: navigator.userAgent,
                  url: window.location.href
                };
                
                if (window.securityLogger) {
                  window.securityLogger.logSecurityEvent('unhandled_rejection', rejectionData);
                }
                
                console.error('Security-monitored rejection:', rejectionData);
              });
              
              // Security-focused visibility change detection
              document.addEventListener('visibilitychange', function() {
                if (window.securityLogger) {
                  window.securityLogger.logSecurityEvent('visibility_change', {
                    hidden: document.hidden,
                    timestamp: Date.now(),
                    url: window.location.href
                  });
                }
              });
              
              // Detect potential security threats in console
              const originalConsole = window.console;
              window.console = new Proxy(originalConsole, {
                get: function(target, prop) {
                  if (typeof target[prop] === 'function') {
                    return function(...args) {
                      // Monitor for potential security-related console activity
                      const message = args.join(' ');
                      if (message.includes('XSS') || message.includes('injection') || message.includes('exploit')) {
                        if (window.securityLogger) {
                          window.securityLogger.logSecurityEvent('suspicious_console_activity', {
                            method: prop,
                            message: message,
                            timestamp: Date.now(),
                            url: window.location.href
                          });
                        }
                      }
                      return target[prop].apply(target, args);
                    };
                  }
                  return target[prop];
                }
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
