import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Edit } from 'lucide-react'

export const metadata = {
  title: 'Prompt Engineers - Applied Innovation Corporation',
  description: 'Professional prompt engineering services to optimize AI model performance and accuracy.',
}

export default function PromptEngineersPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">Prompt Engineers</h1>
            <p className="text-xl text-blue-100 mb-8">Expert prompt engineering for optimal AI performance</p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">Hire Prompt Engineers <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
              <Edit className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Precision Prompt Engineering</h2>
            <p className="text-lg text-gray-600 mb-8">Maximize your AI model performance with expertly crafted prompts that deliver consistent, accurate results.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div><h3 className="font-semibold text-gray-900">Prompt Optimization</h3><p className="text-gray-600">Maximum accuracy</p></div>
              <div><h3 className="font-semibold text-gray-900">Chain-of-Thought</h3><p className="text-gray-600">Complex reasoning</p></div>
              <div><h3 className="font-semibold text-gray-900">Few-Shot Learning</h3><p className="text-gray-600">Efficient training</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
