import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Mic } from 'lucide-react'

export const metadata = {
  title: 'Conversational AI Development - Applied Innovation Corporation',
  description: 'Advanced conversational AI development for natural language interactions and voice assistants.',
}

export default function ConversationalAIPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">Conversational AI Development</h1>
            <p className="text-xl text-blue-100 mb-8">Natural language AI that understands and responds like humans</p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">Build Conversational AI <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Advanced Conversational AI</h2>
            <p className="text-lg text-gray-600 mb-8">Create sophisticated AI systems that engage in natural, context-aware conversations across voice and text channels.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div><h3 className="font-semibold text-gray-900">Voice & Text</h3><p className="text-gray-600">Multi-modal interaction</p></div>
              <div><h3 className="font-semibold text-gray-900">Context Awareness</h3><p className="text-gray-600">Intelligent responses</p></div>
              <div><h3 className="font-semibold text-gray-900">Emotion Recognition</h3><p className="text-gray-600">Empathetic AI</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
