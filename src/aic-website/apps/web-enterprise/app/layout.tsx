import type { Metadata } from 'next'
import { Inter, Roboto } from 'next/font/google'
import { Header } from '@aic/ui'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Enterprise AI Solutions | Applied Innovation Corporation',
    template: '%s | AIC Enterprise'
  },
  description: 'Enterprise-scale AI transformation services with focus on security, compliance, and scalability. Custom AI solutions for large organizations.',
  keywords: ['enterprise AI', 'AI transformation', 'enterprise AI consulting', 'scalable AI solutions', 'AI compliance', 'enterprise automation'],
  authors: [{ name: 'Applied Innovation Corporation' }],
  creator: 'Applied Innovation Corporation',
  publisher: 'Applied Innovation Corporation',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://enterprise.aicorp.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://enterprise.aicorp.com',
    title: 'Enterprise AI Solutions | Applied Innovation Corporation',
    description: 'Enterprise-scale AI transformation services with focus on security, compliance, and scalability.',
    siteName: 'AIC Enterprise',
    images: [
      {
        url: '/og-enterprise.jpg',
        width: 1200,
        height: 630,
        alt: 'AIC Enterprise AI Solutions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Enterprise AI Solutions | Applied Innovation Corporation',
    description: 'Enterprise-scale AI transformation services with focus on security, compliance, and scalability.',
    images: ['/twitter-enterprise.jpg'],
    creator: '@AICorp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${roboto.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Header variant="enterprise" />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">AIC Enterprise</h3>
                <p className="text-sm text-muted-foreground">
                  Enterprise-scale AI transformation solutions.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Solutions</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/solutions" className="text-muted-foreground hover:text-foreground">AI Strategy</a></li>
                  <li><a href="/solutions/automation" className="text-muted-foreground hover:text-foreground">Process Automation</a></li>
                  <li><a href="/solutions/analytics" className="text-muted-foreground hover:text-foreground">Advanced Analytics</a></li>
                  <li><a href="/solutions/integration" className="text-muted-foreground hover:text-foreground">System Integration</a></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Security & Compliance</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/security" className="text-muted-foreground hover:text-foreground">Security Overview</a></li>
                  <li><a href="/compliance" className="text-muted-foreground hover:text-foreground">Compliance</a></li>
                  <li><a href="/certifications" className="text-muted-foreground hover:text-foreground">Certifications</a></li>
                  <li><a href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</a></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Enterprise Support</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/contact" className="text-muted-foreground hover:text-foreground">Contact Sales</a></li>
                  <li><a href="/case-studies" className="text-muted-foreground hover:text-foreground">Case Studies</a></li>
                  <li><a href="/resources" className="text-muted-foreground hover:text-foreground">Resources</a></li>
                  <li><a href="/support" className="text-muted-foreground hover:text-foreground">Enterprise Support</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
              <p>&copy; 2025 Applied Innovation Corporation. All rights reserved.</p>
              <div className="mt-2 space-x-4">
                <a href="/privacy" className="hover:text-foreground">Privacy Policy</a>
                <a href="/terms" className="hover:text-foreground">Terms of Service</a>
                <a href="/security" className="hover:text-foreground">Security</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
