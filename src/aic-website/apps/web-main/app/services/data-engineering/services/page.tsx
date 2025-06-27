import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Database } from 'lucide-react'

export const metadata = {
  title: 'Data Engineering Services - Applied Innovation Corporation',
  description: 'Comprehensive data engineering services to build robust data infrastructure and pipelines.',
}

export default function DataEngineeringServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">Data Engineering Services</h1>
            <p className="text-xl text-blue-100 mb-8">Build robust data infrastructure for AI and analytics</p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">Start Data Project <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
              <Database className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Enterprise Data Infrastructure</h2>
            <p className="text-lg text-gray-600 mb-8">Design and implement scalable data engineering solutions that power your AI initiatives and business intelligence.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div><h3 className="font-semibold text-gray-900">Data Pipelines</h3><p className="text-gray-600">Automated data flow</p></div>
              <div><h3 className="font-semibold text-gray-900">Real-Time Processing</h3><p className="text-gray-600">Stream analytics</p></div>
              <div><h3 className="font-semibold text-gray-900">Data Quality</h3><p className="text-gray-600">Clean, reliable data</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
