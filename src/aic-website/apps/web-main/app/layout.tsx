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
        <Header variant="main" />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Applied Innovation Corporation</h3>
                <p className="text-sm text-muted-foreground">
                  Transforming business through applied AI solutions.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/about" className="text-muted-foreground hover:text-foreground">About</a></li>
                  <li><a href="/divisions" className="text-muted-foreground hover:text-foreground">Divisions</a></li>
                  <li><a href="/products" className="text-muted-foreground hover:text-foreground">Products</a></li>
                  <li><a href="/services" className="text-muted-foreground hover:text-foreground">Services</a></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/blog" className="text-muted-foreground hover:text-foreground">Blog</a></li>
                  <li><a href="/webinars" className="text-muted-foreground hover:text-foreground">Webinars</a></li>
                  <li><a href="/resources" className="text-muted-foreground hover:text-foreground">Resources</a></li>
                  <li><a href="/careers" className="text-muted-foreground hover:text-foreground">Careers</a></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Connect</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/contact" className="text-muted-foreground hover:text-foreground">Contact</a></li>
                  <li><a href="/investors" className="text-muted-foreground hover:text-foreground">Investor Relations</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground">LinkedIn</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground">GitHub</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
              <p>&copy; 2025 Applied Innovation Corporation. All rights reserved.</p>
              <div className="mt-2 space-x-4">
                <a href="/privacy" className="hover:text-foreground">Privacy Policy</a>
                <a href="/terms" className="hover:text-foreground">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
