import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Code, Zap, Shield, Users } from 'lucide-react'

export const metadata = {
  title: 'Custom AI Development - Applied Innovation Corporation',
  description: 'Bespoke AI solution development for SMBs. We build custom AI applications tailored to your specific business needs and requirements.',
}

export default function CustomAIPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Custom AI Solutions Built for Your Business
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              When off-the-shelf solutions don't fit, we build bespoke AI applications tailored to your unique business requirements, processes, and goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
                <Link href="/contact">
                  Start Custom Development <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
                <Link href="#solutions">
                  Explore Solutions
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Custom AI Solutions */}
      <section id="solutions" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Tailored AI Solutions
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Every business is unique. Our custom AI development ensures your solution fits perfectly with your operations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Code className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Custom Applications</h3>
                <p className="text-gray-600">
                  Build AI applications from scratch designed specifically for your business processes and requirements.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">System Integration</h3>
                <p className="text-gray-600">
                  Seamlessly integrate AI capabilities into your existing systems and workflows.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Enterprise Security</h3>
                <p className="text-gray-600">
                  Built with enterprise-grade security, compliance, and data protection standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Development Process */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-16">
              Our Development Process
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Requirements Analysis</h3>
                <p className="text-gray-600">
                  Deep dive into your business needs, processes, and technical requirements.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Custom Design</h3>
                <p className="text-gray-600">
                  Design AI architecture and user experience tailored to your specific needs.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Agile Development</h3>
                <p className="text-gray-600">
                  Build your solution using agile methodology with regular feedback and iterations.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                  4
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Deployment & Support</h3>
                <p className="text-gray-600">
                  Deploy to production with comprehensive testing, training, and ongoing support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
              Why Choose Custom AI Development
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Perfect Fit</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Tailored to Your Needs</h4>
                      <p className="text-gray-600">Built specifically for your business processes and requirements</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Seamless Integration</h4>
                      <p className="text-gray-600">Integrates perfectly with your existing systems and workflows</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Scalable Architecture</h4>
                      <p className="text-gray-600">Designed to grow and evolve with your business</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Competitive Advantage</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Unique Capabilities</h4>
                      <p className="text-gray-600">AI solutions that differentiate you from competitors</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Intellectual Property</h4>
                      <p className="text-gray-600">You own the custom AI solution we build for you</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Long-term Value</h4>
                      <p className="text-gray-600">Investment that continues to deliver value as you grow</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready for Your Custom AI Solution?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Let's discuss your unique requirements and build an AI solution that perfectly fits your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">
                Start Custom Project <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
              <Link href="/services/ai-development-services">
                Explore Development Services
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
