import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Eye } from 'lucide-react'

export const metadata = {
  title: 'Computer Vision Development - Applied Innovation Corporation',
  description: 'Advanced computer vision and image recognition AI solutions for business automation.',
}

export default function ComputerVisionPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">Computer Vision Development</h1>
            <p className="text-xl text-blue-100 mb-8">AI that sees and understands visual content</p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">Build Vision AI <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
              <Eye className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Advanced Computer Vision</h2>
            <p className="text-lg text-gray-600 mb-8">Develop sophisticated computer vision systems that can analyze, understand, and act on visual information in real-time.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div><h3 className="font-semibold text-gray-900">Object Detection</h3><p className="text-gray-600">Real-time recognition</p></div>
              <div><h3 className="font-semibold text-gray-900">Image Analysis</h3><p className="text-gray-600">Deep understanding</p></div>
              <div><h3 className="font-semibold text-gray-900">Video Processing</h3><p className="text-gray-600">Motion analysis</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
