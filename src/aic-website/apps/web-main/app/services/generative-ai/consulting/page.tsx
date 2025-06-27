import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Brain } from 'lucide-react'

export const metadata = {
  title: 'Generative AI Consulting - Applied Innovation Corporation',
  description: 'Expert Generative AI consulting services for SMBs.',
}

export default function GenAIConsultingPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">Generative AI Consulting</h1>
            <p className="text-xl text-blue-100 mb-8">Strategic guidance for Generative AI adoption</p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">Get AI Consulting <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Expert GenAI Strategy</h2>
            <p className="text-lg text-gray-600 mb-8">Navigate the Generative AI landscape with expert guidance tailored for SMBs.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div><h3 className="font-semibold text-gray-900">Strategy Development</h3><p className="text-gray-600">Custom AI roadmaps</p></div>
              <div><h3 className="font-semibold text-gray-900">Technology Selection</h3><p className="text-gray-600">Right tools for your needs</p></div>
              <div><h3 className="font-semibold text-gray-900">Implementation Planning</h3><p className="text-gray-600">Step-by-step guidance</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
