import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'

export const metadata = {
  title: 'AI Chatbot Development - Applied Innovation Corporation',
  description: 'Custom AI chatbot development services for enhanced customer engagement and support.',
}

export default function AIChatbotPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">AI Chatbot Development</h1>
            <p className="text-xl text-blue-100 mb-8">Intelligent chatbots that enhance customer experience</p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">Build AI Chatbot <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Smart Conversational AI</h2>
            <p className="text-lg text-gray-600 mb-8">Deploy intelligent chatbots that understand context, provide accurate responses, and improve customer satisfaction.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div><h3 className="font-semibold text-gray-900">Natural Language</h3><p className="text-gray-600">Human-like conversations</p></div>
              <div><h3 className="font-semibold text-gray-900">24/7 Support</h3><p className="text-gray-600">Always available</p></div>
              <div><h3 className="font-semibold text-gray-900">Multi-Platform</h3><p className="text-gray-600">Web, mobile, messaging</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
