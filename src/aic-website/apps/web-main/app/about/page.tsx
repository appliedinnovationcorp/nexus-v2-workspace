import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Users, Target, Lightbulb, Award, CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'About Us - Applied Innovation Corporation',
  description: 'Learn about Applied Innovation Corporation, our mission to democratize AI for SMBs, and our team of AI experts dedicated to driving business transformation.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Democratizing AI for Small & Medium Businesses
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              We believe every business deserves access to enterprise-grade AI solutions. Our mission is to make AI transformation accessible, practical, and profitable for SMBs.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                At Applied Innovation Corporation, we're on a mission to level the playing field by bringing enterprise-grade AI capabilities to small and medium businesses. We believe that AI shouldn't be a luxury reserved for Fortune 500 companies.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our approach combines cutting-edge AI technology with deep business understanding, delivering solutions that are not just technically impressive, but practically transformative for your bottom line.
              </p>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#00BCD4] rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Our Goal</h3>
                  <p className="text-gray-600">Make AI accessible, practical, and profitable for every SMB</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-[#1A237E]/10 to-[#00BCD4]/10 rounded-2xl flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lightbulb className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Innovation First</h3>
                  <p className="text-gray-600">
                    We don't just implement AI—we innovate with it, creating custom solutions that give you a competitive edge.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
              Our Story
            </h2>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Applied Innovation Corporation was founded on a simple observation: while large enterprises were rapidly adopting AI to gain competitive advantages, small and medium businesses were being left behind—not by choice, but by circumstance.
              </p>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Traditional AI consulting firms focused on multi-million dollar enterprise deals, leaving SMBs with limited options: expensive, over-engineered solutions or basic, off-the-shelf tools that barely scratched the surface of AI's potential.
              </p>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We saw an opportunity to bridge this gap. By combining enterprise-grade AI expertise with a deep understanding of SMB needs and constraints, we created a new model: high-quality, custom AI solutions delivered quickly and cost-effectively.
              </p>
              
              <div className="bg-white rounded-2xl p-8 border-l-4 border-[#00BCD4] my-12">
                <blockquote className="text-xl font-medium text-gray-900 mb-4">
                  "Every business deserves the competitive advantage that AI provides. Our job is to make that a reality, not just a dream."
                </blockquote>
                <cite className="text-gray-600">— Applied Innovation Corporation Founding Team</cite>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
            Our Core Values
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">SMB-First</h3>
              <p className="text-gray-600">
                We design every solution with SMB needs, budgets, and timelines in mind. No over-engineering, no unnecessary complexity.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Results-Driven</h3>
              <p className="text-gray-600">
                Every AI solution we build is designed to deliver measurable ROI and tangible business value from day one.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Innovation</h3>
              <p className="text-gray-600">
                We stay at the forefront of AI technology, bringing the latest innovations to our clients in practical, usable ways.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Excellence</h3>
              <p className="text-gray-600">
                We maintain enterprise-grade quality standards while delivering solutions at SMB-friendly timelines and budgets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
              Our Approach
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">What Makes Us Different</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">SMB-Focused Methodology</h4>
                      <p className="text-gray-600">Purpose-built processes designed for SMB constraints and opportunities</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Rapid Deployment</h4>
                      <p className="text-gray-600">Production-ready AI solutions in weeks, not months or years</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Business-First Thinking</h4>
                      <p className="text-gray-600">Every technical decision is made with business impact in mind</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Transparent Pricing</h4>
                      <p className="text-gray-600">Clear, predictable pricing with no hidden costs or surprises</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Process</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Discovery & Strategy</h4>
                      <p className="text-gray-600">We understand your business, challenges, and AI opportunities</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Custom Development</h4>
                      <p className="text-gray-600">We build AI solutions tailored to your specific needs and systems</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Deployment & Training</h4>
                      <p className="text-gray-600">We deploy your AI solution and train your team for success</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Ongoing Support</h4>
                      <p className="text-gray-600">We provide continuous monitoring, optimization, and support</p>
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
            Ready to Transform Your Business with AI?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the growing number of SMBs that are gaining competitive advantages through practical AI implementation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">
                Start Your AI Journey <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
              <Link href="/services/ai-consulting-services">
                Learn About Our Services
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
