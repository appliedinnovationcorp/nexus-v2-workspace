import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Users, Brain, Shield, TrendingUp, Clock, Target, Lightbulb, Award } from 'lucide-react'

export const metadata = {
  title: 'Fractional CTO Services - Applied Innovation Corporation',
  description: 'Executive-level AI leadership for SMBs. Our Fractional CTO services provide strategic AI guidance, technical leadership, and transformation expertise.',
}

export default function FractionalCTOPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Executive AI Leadership for Growing SMBs
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Get the strategic AI leadership your business needs without the full-time executive cost. Our Fractional CTO services provide expert guidance, technical strategy, and transformation leadership tailored for SMBs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
                <Link href="/contact">
                  Get Your AI Strategy Leader <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
                <Link href="#services">
                  Explore CTO Services
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What is a Fractional CTO */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              What is a Fractional CTO?
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              A Fractional CTO is a senior technology executive who works with your company on a part-time or project basis, providing the same strategic leadership and technical expertise as a full-time CTO, but at a fraction of the cost and commitment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Strategic Leadership</h3>
              <p className="text-gray-600">
                Executive-level technology strategy and vision aligned with your business goals and growth plans.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Team Development</h3>
              <p className="text-gray-600">
                Build and mentor your technical team, establish best practices, and create a culture of innovation.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Risk Management</h3>
              <p className="text-gray-600">
                Identify and mitigate technology risks while ensuring security, compliance, and operational excellence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Fractional CTO Services */}
      <section id="services" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our Fractional CTO Services
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Comprehensive technology leadership services designed specifically for SMBs ready to scale with AI.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Strategy & Roadmap Development</h3>
              <p className="text-gray-600 mb-6">
                Develop comprehensive AI strategies that align with your business objectives and create competitive advantages.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  AI opportunity assessment and prioritization
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Technology roadmap and implementation planning
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  ROI modeling and business case development
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Competitive analysis and market positioning
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Technical Team Leadership</h3>
              <p className="text-gray-600 mb-6">
                Build, lead, and mentor your technical team to execute AI initiatives successfully and efficiently.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Team structure design and hiring strategy
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Technical mentoring and skill development
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Process optimization and best practices
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Performance management and goal setting
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Technology Architecture & Governance</h3>
              <p className="text-gray-600 mb-6">
                Establish robust technology architecture and governance frameworks that support scalable growth.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Enterprise architecture design and review
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Security and compliance framework setup
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Technology vendor evaluation and selection
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Data governance and privacy policies
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Digital Transformation Leadership</h3>
              <p className="text-gray-600 mb-6">
                Lead comprehensive digital transformation initiatives that modernize operations and drive growth.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Digital transformation strategy and execution
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Legacy system modernization planning
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Change management and adoption strategies
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Innovation culture development
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who Needs a Fractional CTO */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Is a Fractional CTO Right for Your Business?
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Fractional CTO services are ideal for SMBs at critical growth stages who need executive-level technology leadership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Growing SMBs</h3>
              <p className="text-gray-600 mb-4">
                Companies experiencing rapid growth who need strategic technology leadership to scale effectively.
              </p>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• 10-100 employees</li>
                <li>• $1M-$50M revenue</li>
                <li>• Technology-dependent operations</li>
                <li>• Scaling challenges</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI-First Companies</h3>
              <p className="text-gray-600 mb-4">
                Businesses looking to integrate AI into their core operations and competitive strategy.
              </p>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• AI transformation initiatives</li>
                <li>• Data-driven decision making</li>
                <li>• Automation opportunities</li>
                <li>• Competitive differentiation</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Digital Transformers</h3>
              <p className="text-gray-600 mb-4">
                Traditional businesses undergoing digital transformation who need expert guidance.
              </p>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Legacy system modernization</li>
                <li>• Cloud migration projects</li>
                <li>• Process digitization</li>
                <li>• Technology strategy gaps</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement Models */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Flexible Engagement Models
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Choose the engagement model that best fits your needs, timeline, and budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Part-Time Ongoing</h3>
              <p className="text-gray-600 mb-6">
                Regular, ongoing engagement for continuous strategic leadership and guidance.
              </p>
              <ul className="space-y-3 text-left mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  10-20 hours per week
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Monthly strategic reviews
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Team leadership and mentoring
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Continuous optimization
                </li>
              </ul>
              <p className="text-sm text-gray-500">Best for: Growing companies needing ongoing leadership</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg text-center border-2 border-[#00BCD4]">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Project-Based</h3>
              <div className="inline-block px-3 py-1 bg-[#00BCD4] text-white rounded-full text-sm font-medium mb-4">
                Most Popular
              </div>
              <p className="text-gray-600 mb-6">
                Focused engagement for specific initiatives, transformations, or strategic projects.
              </p>
              <ul className="space-y-3 text-left mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  3-6 month engagements
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Specific deliverables
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Clear success metrics
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Knowledge transfer
                </li>
              </ul>
              <p className="text-sm text-gray-500">Best for: Specific AI initiatives or transformations</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Strategic Advisory</h3>
              <p className="text-gray-600 mb-6">
                High-level strategic guidance and advisory services for key technology decisions.
              </p>
              <ul className="space-y-3 text-left mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Monthly strategy sessions
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Technology roadmap reviews
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Executive-level guidance
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Ad-hoc consultation
                </li>
              </ul>
              <p className="text-sm text-gray-500">Best for: Companies with existing tech leadership</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
              Benefits of Our Fractional CTO Services
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Cost & Efficiency Benefits</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Cost-Effective Leadership</h4>
                      <p className="text-gray-600">Get executive-level expertise at 30-50% of full-time CTO cost</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Immediate Impact</h4>
                      <p className="text-gray-600">Start seeing results within weeks, not months</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Flexible Commitment</h4>
                      <p className="text-gray-600">Scale engagement up or down based on your needs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">No Recruitment Risk</h4>
                      <p className="text-gray-600">Avoid the time and cost of executive hiring</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Strategic Benefits</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Proven AI Expertise</h4>
                      <p className="text-gray-600">Access to deep AI and technology expertise</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Objective Perspective</h4>
                      <p className="text-gray-600">Unbiased, external viewpoint on technology decisions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Network Access</h4>
                      <p className="text-gray-600">Leverage our network of technology partners and experts</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Risk Mitigation</h4>
                      <p className="text-gray-600">Reduce technology and implementation risks</p>
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
            Ready for Executive AI Leadership?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Let's discuss how our Fractional CTO services can accelerate your AI transformation and drive strategic growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">
                Schedule CTO Consultation <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
              <Link href="/services/ai-consulting-services">
                Explore Consulting Services
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
