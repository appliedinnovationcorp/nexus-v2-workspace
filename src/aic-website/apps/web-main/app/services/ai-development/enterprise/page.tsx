import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Building } from 'lucide-react'

export const metadata = {
  title: 'Enterprise AI Development - Applied Innovation Corporation',
  description: 'Enterprise-grade AI development solutions for large-scale business transformation.',
}

export default function EnterpriseAIDevelopmentPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">Enterprise AI Development</h1>
            <p className="text-xl text-blue-100 mb-8">Scalable AI solutions for enterprise transformation</p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">Transform with AI <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
              <Building className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Enterprise-Scale AI</h2>
            <p className="text-lg text-gray-600 mb-8">Deploy robust, scalable AI solutions that meet enterprise security, compliance, and performance requirements.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div><h3 className="font-semibold text-gray-900">Enterprise Security</h3><p className="text-gray-600">Bank-grade protection</p></div>
              <div><h3 className="font-semibold text-gray-900">Scalable Architecture</h3><p className="text-gray-600">Handle millions of requests</p></div>
              <div><h3 className="font-semibold text-gray-900">Compliance Ready</h3><p className="text-gray-600">Meet regulatory standards</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
