import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Tag } from 'lucide-react'

export const metadata = {
  title: 'Market Trends Articles - Applied Innovation Corporation',
  description: 'Latest AI market trends and insights for SMBs.',
}

export default function MarketTrendsPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Tag className="h-6 w-6" />
              <span className="text-xl">Market Trends</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">AI Market Trends</h1>
            <p className="text-xl text-blue-100 mb-8">Stay ahead with the latest AI market insights</p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/services/ai-consulting-services">Get Market Analysis <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Market Trends Articles Coming Soon</h2>
          <p className="text-gray-600 mb-8">We're preparing the latest AI market trend analysis for SMBs.</p>
          <Button variant="outline" asChild>
            <Link href="/blog">View All Articles</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
