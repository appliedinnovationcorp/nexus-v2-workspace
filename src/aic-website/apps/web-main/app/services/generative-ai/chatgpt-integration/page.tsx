import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Link2 } from 'lucide-react'

export const metadata = {
  title: 'ChatGPT Integration - Applied Innovation Corporation',
  description: 'Professional ChatGPT integration services for seamless AI-powered business applications.',
}

export default function ChatGPTIntegrationPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">ChatGPT Integration</h1>
            <p className="text-xl text-blue-100 mb-8">Seamless ChatGPT integration into your business systems</p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">Integrate ChatGPT <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
              <Link2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Enterprise ChatGPT Integration</h2>
            <p className="text-lg text-gray-600 mb-8">Connect ChatGPT's powerful AI capabilities directly to your existing business applications and workflows.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div><h3 className="font-semibold text-gray-900">API Integration</h3><p className="text-gray-600">Direct system connection</p></div>
              <div><h3 className="font-semibold text-gray-900">Custom Workflows</h3><p className="text-gray-600">Automated processes</p></div>
              <div><h3 className="font-semibold text-gray-900">Security First</h3><p className="text-gray-600">Enterprise-grade security</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
