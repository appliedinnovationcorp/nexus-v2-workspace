import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Users } from 'lucide-react'

export const metadata = {
  title: 'AI Engineers - Applied Innovation Corporation',
  description: 'Expert AI engineers and developers for hire to build custom artificial intelligence solutions.',
}

export default function AIEngineersPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">AI Engineers</h1>
            <p className="text-xl text-blue-100 mb-8">Expert AI engineers ready to build your next breakthrough</p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">Hire AI Engineers <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">World-Class AI Talent</h2>
            <p className="text-lg text-gray-600 mb-8">Access our team of experienced AI engineers with deep expertise in machine learning, deep learning, and AI system architecture.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div><h3 className="font-semibold text-gray-900">PhD-Level Expertise</h3><p className="text-gray-600">Advanced AI knowledge</p></div>
              <div><h3 className="font-semibold text-gray-900">Production Experience</h3><p className="text-gray-600">Real-world deployments</p></div>
              <div><h3 className="font-semibold text-gray-900">Full-Stack AI</h3><p className="text-gray-600">End-to-end capabilities</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
