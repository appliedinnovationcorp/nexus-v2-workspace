import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Users, Award, TrendingUp, Globe, Shield, Lightbulb } from 'lucide-react'

export const metadata = {
  title: 'Company - Applied Innovation Corporation',
  description: 'Learn about Applied Innovation Corporation - our leadership team, company culture, and commitment to democratizing AI for SMBs.',
}

export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Building the Future of AI for SMBs
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Applied Innovation Corporation is more than a consulting firm—we're your strategic partner in AI transformation, dedicated to making enterprise-grade AI accessible to every SMB.
            </p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">
                Partner With Us <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">50+</div>
                <p className="text-gray-600">SMBs Transformed</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">150%</div>
                <p className="text-gray-600">Average ROI</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">95%</div>
                <p className="text-gray-600">Client Satisfaction</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">8</div>
                <p className="text-gray-600">Industries Served</p>
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
                Applied Innovation Corporation was founded on a fundamental belief: every business, regardless of size, deserves access to the transformative power of artificial intelligence. While large enterprises were rapidly adopting AI to gain competitive advantages, small and medium businesses were being left behind—not by choice, but by circumstance.
              </p>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                The traditional AI consulting landscape was dominated by firms focused on multi-million dollar enterprise deals, leaving SMBs with limited options: expensive, over-engineered solutions or basic, off-the-shelf tools that barely scratched the surface of AI's potential.
              </p>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We saw an opportunity to bridge this gap. By combining enterprise-grade AI expertise with a deep understanding of SMB needs and constraints, we created a new model: high-quality, custom AI solutions delivered quickly and cost-effectively.
              </p>
              
              <div className="bg-white rounded-2xl p-8 border-l-4 border-[#00BCD4] my-12">
                <blockquote className="text-xl font-medium text-gray-900 mb-4">
                  "Our mission is simple: democratize AI for SMBs and help them compete on a level playing field with larger enterprises."
                </blockquote>
                <cite className="text-gray-600">— Applied Innovation Corporation Leadership Team</cite>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
              Leadership Team
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="text-white text-2xl font-bold">CEO</div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Chief Executive Officer</h3>
                <p className="text-gray-600 mb-4">Strategic Vision & Leadership</p>
                <p className="text-sm text-gray-500">
                  15+ years in AI and technology leadership, former enterprise AI executive with deep SMB market understanding.
                </p>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="text-white text-2xl font-bold">CTO</div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Chief Technology Officer</h3>
                <p className="text-gray-600 mb-4">Technical Innovation & Architecture</p>
                <p className="text-sm text-gray-500">
                  PhD in Machine Learning, 12+ years building scalable AI systems, expert in MLOps and production AI deployment.
                </p>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="text-white text-2xl font-bold">COO</div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Chief Operating Officer</h3>
                <p className="text-gray-600 mb-4">Operations & Client Success</p>
                <p className="text-sm text-gray-500">
                  MBA with 10+ years in consulting operations, specializes in SMB transformation and change management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Culture */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
              Our Culture & Values
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-lg text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">SMB-First Mindset</h3>
                <p className="text-gray-600">
                  Every decision we make is viewed through the lens of SMB needs, constraints, and opportunities. We design solutions that work for real businesses with real budgets.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lightbulb className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Innovation Excellence</h3>
                <p className="text-gray-600">
                  We stay at the forefront of AI technology while maintaining practical focus. Innovation without application is just expensive research.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Ethical AI</h3>
                <p className="text-gray-600">
                  We believe AI should augment human capabilities, not replace them. Our solutions are designed with ethics, transparency, and human oversight in mind.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Results-Driven</h3>
                <p className="text-gray-600">
                  We measure success by client outcomes, not project deliverables. Every AI solution must demonstrate clear, measurable business value.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quality Commitment</h3>
                <p className="text-gray-600">
                  We maintain enterprise-grade quality standards while delivering at SMB-friendly timelines and budgets. No compromises on excellence.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Partnership Approach</h3>
                <p className="text-gray-600">
                  We don't just deliver projects—we build long-term partnerships. Your success is our success, and we're invested in your growth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications & Partnerships */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-16">
              Certifications & Partnerships
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Industry Certifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700">AWS Advanced Consulting Partner</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700">Microsoft AI Partner</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700">Google Cloud AI Specialist</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700">ISO 27001 Certified</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Technology Partners</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center">
                      <Globe className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700">OpenAI Technology Partner</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center">
                      <Globe className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700">Anthropic Claude Integration</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center">
                      <Globe className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700">Hugging Face Enterprise</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#00BCD4] rounded-full flex items-center justify-center">
                      <Globe className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700">MLflow & Kubeflow Certified</span>
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
            Ready to Partner with Us?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the growing community of SMBs that have transformed their operations and achieved competitive advantages through strategic AI implementation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">
                Start Your AI Journey <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
              <Link href="/about">
                Learn More About Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
