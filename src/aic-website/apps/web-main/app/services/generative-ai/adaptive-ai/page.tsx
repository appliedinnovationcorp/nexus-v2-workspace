import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'

export const metadata = {
  title: 'Adaptive AI Solutions - Applied Innovation Corporation',
  description: 'Self-learning AI systems that continuously improve and adapt to changing business conditions.',
}

export default function AdaptiveAIPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">Adaptive AI Solutions</h1>
            <p className="text-xl text-blue-100 mb-8">Self-learning AI that evolves with your business</p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">Build Adaptive AI <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Continuously Learning AI</h2>
            <p className="text-lg text-gray-600 mb-8">Deploy AI systems that automatically adapt and improve their performance based on new data and changing business conditions.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div><h3 className="font-semibold text-gray-900">Self-Learning</h3><p className="text-gray-600">Continuous improvement</p></div>
              <div><h3 className="font-semibold text-gray-900">Real-Time Adaptation</h3><p className="text-gray-600">Dynamic responses</p></div>
              <div><h3 className="font-semibold text-gray-900">Performance Optimization</h3><p className="text-gray-600">Automated tuning</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
