import type { Metadata } from 'next'
import { Inter, Roboto } from 'next/font/google'
import { Header } from '../src/components/header'
import { Footer } from '../src/components/footer'
import { PageErrorBoundary, AccessibilityProvider, SkipLinks } from '@aic/ui'
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
    default: 'Applied Innovation Corporation - Transforming Business Through Applied AI',
    template: '%s | AIC'
  },
  description: 'Applied Innovation Corporation (AIC) provides AI-specific transformation, consulting, and enablement services, along with our flagship Nexus PaaS platform and fractional CTO services.',
  keywords: ['AI consulting', 'artificial intelligence', 'AI transformation', 'Nexus PaaS', 'fractional CTO', 'AI enablement'],
  authors: [{ name: 'Applied Innovation Corporation' }],
  creator: 'Applied Innovation Corporation',
  publisher: 'Applied Innovation Corporation',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://aicorp.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aicorp.com',
    title: 'Applied Innovation Corporation - Transforming Business Through Applied AI',
    description: 'AI consulting, transformation, and enablement services with our flagship Nexus PaaS platform.',
    siteName: 'Applied Innovation Corporation',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Applied Innovation Corporation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Applied Innovation Corporation - Transforming Business Through Applied AI',
    description: 'AI consulting, transformation, and enablement services with our flagship Nexus PaaS platform.',
    images: ['/twitter-image.jpg'],
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
  verification: {
    google: 'your-google-verification-code',
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
        <AccessibilityProvider>
          <PageErrorBoundary>
            <SkipLinks />
            <Header />
            <main id="main-content" className="flex-1" role="main">
              {children}
            </main>
            <Footer />
          </PageErrorBoundary>
        </AccessibilityProvider>
      </body>
    </html>
  )
}
