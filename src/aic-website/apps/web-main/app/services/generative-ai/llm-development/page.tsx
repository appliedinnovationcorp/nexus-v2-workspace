import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Cpu } from 'lucide-react'

export const metadata = {
  title: 'LLM Development - Applied Innovation Corporation',
  description: 'Custom Large Language Model development and fine-tuning services for enterprise applications.',
}

export default function LLMDevelopmentPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">LLM Development</h1>
            <p className="text-xl text-blue-100 mb-8">Custom Large Language Models tailored to your business domain</p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">Develop Custom LLM <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
              <Cpu className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Domain-Specific LLMs</h2>
            <p className="text-lg text-gray-600 mb-8">Build and fine-tune Large Language Models specifically for your industry, ensuring superior performance and accuracy.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div><h3 className="font-semibold text-gray-900">Model Fine-Tuning</h3><p className="text-gray-600">Domain-specific training</p></div>
              <div><h3 className="font-semibold text-gray-900">Custom Architecture</h3><p className="text-gray-600">Optimized for your use case</p></div>
              <div><h3 className="font-semibold text-gray-900">Performance Optimization</h3><p className="text-gray-600">Efficient inference</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
