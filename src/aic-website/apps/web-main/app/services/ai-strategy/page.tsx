import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Target, Brain, TrendingUp, Users, Shield, Clock } from 'lucide-react'

export const metadata = {
  title: 'AI Strategy Services - Applied Innovation Corporation',
  description: 'Strategic AI planning and roadmap development for SMBs. We help you create winning AI strategies that drive growth and competitive advantage.',
}

export default function AIStrategyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Strategic AI Planning That Drives Results
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Transform your business vision into actionable AI strategy. We help SMBs develop comprehensive AI roadmaps that align with business goals and deliver measurable competitive advantages.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
                <Link href="/contact">
                  Develop Your AI Strategy <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
                <Link href="#strategy">
                  Explore Strategy Services
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why AI Strategy Matters */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Why AI Strategy is Critical for SMBs
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Without a clear AI strategy, businesses risk wasting resources on disconnected initiatives that fail to deliver value. A well-crafted AI strategy ensures every AI investment contributes to your competitive advantage and business growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Focused Investment</h3>
              <p className="text-gray-600">
                Prioritize AI initiatives that deliver the highest ROI and align with your business objectives.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Competitive Advantage</h3>
              <p className="text-gray-600">
                Identify unique AI opportunities that differentiate your business and create sustainable advantages.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Risk Mitigation</h3>
              <p className="text-gray-600">
                Avoid costly mistakes and implementation failures through strategic planning and risk assessment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our AI Strategy Services */}
      <section id="strategy" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our AI Strategy Services
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Comprehensive strategic planning services that transform your AI vision into executable roadmaps.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Vision & Strategy Development</h3>
              <p className="text-gray-600 mb-6">
                Create a comprehensive AI vision that aligns with your business strategy and defines clear success metrics.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Business objective alignment and goal setting
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  AI maturity assessment and gap analysis
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Competitive landscape analysis
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Success metrics and KPI definition
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Opportunity Assessment</h3>
              <p className="text-gray-600 mb-6">
                Identify and prioritize AI opportunities across your business operations for maximum impact.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Process analysis and automation opportunities
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Data asset evaluation and potential
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Customer experience enhancement opportunities
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Revenue generation and cost reduction potential
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Roadmap & Implementation Planning</h3>
              <p className="text-gray-600 mb-6">
                Develop detailed implementation roadmaps with clear timelines, milestones, and resource requirements.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Phased implementation planning
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Resource allocation and budget planning
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Technology stack recommendations
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Risk mitigation and contingency planning
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Organizational Change Strategy</h3>
              <p className="text-gray-600 mb-6">
                Prepare your organization for AI transformation with comprehensive change management strategies.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Stakeholder engagement and buy-in strategies
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Skills gap analysis and training plans
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Cultural transformation initiatives
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Communication and adoption strategies
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Strategy Process */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our Strategic Planning Process
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              A proven methodology for developing AI strategies that drive business results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Current State Analysis</h3>
              <p className="text-gray-600">
                Comprehensive assessment of your current capabilities, data assets, and business processes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Vision Definition</h3>
              <p className="text-gray-600">
                Define your AI vision, objectives, and success criteria aligned with business strategy.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Roadmap Development</h3>
              <p className="text-gray-600">
                Create detailed implementation roadmap with priorities, timelines, and resource requirements.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Execution Support</h3>
              <p className="text-gray-600">
                Ongoing support and guidance to ensure successful strategy implementation and adaptation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Strategy Deliverables */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
              What You'll Receive
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Strategic Documents</h3>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">AI Strategy Document</h4>
                      <p className="text-gray-600">Comprehensive strategy with vision, objectives, and success metrics</p>
                    </div>
                  </div>
                  
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Implementation Roadmap</h4>
                      <p className="text-gray-600">Detailed timeline with phases, milestones, and dependencies</p>
                    </div>
                  </div>
                  
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Business Case Analysis</h4>
                      <p className="text-gray-600">ROI projections and financial impact analysis</p>
                    </div>
                  </div>
                  
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Risk Assessment</h4>
                      <p className="text-gray-600">Identified risks and mitigation strategies</p>
                    </div>
                  </div>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Implementation Support</h3>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Executive Presentations</h4>
                      <p className="text-gray-600">Board-ready presentations for stakeholder buy-in</p>
                    </div>
                  </div>
                  
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Technology Recommendations</h4>
                      <p className="text-gray-600">Specific technology stack and vendor recommendations</p>
                    </div>
                  </div>
                  
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Change Management Plan</h4>
                      <p className="text-gray-600">Organizational change and adoption strategies</p>
                    </div>
                  </div>
                  
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Ongoing Advisory</h4>
                      <p className="text-gray-600">3 months of implementation support and guidance</p>
                    </div>
                  </div>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Strategy Success Stories
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              See how strategic AI planning has transformed SMBs across different industries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Manufacturing Company</h3>
              <p className="text-gray-600 mb-4">
                "The AI strategy helped us identify $2M in annual cost savings through predictive maintenance and quality control automation."
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Operations Director</span>
                <span>ROI: 300% in Year 1</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Professional Services Firm</h3>
              <p className="text-gray-600 mb-4">
                "Our AI roadmap guided us to automate 60% of our document processing, allowing us to take on 40% more clients."
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Managing Partner</span>
                <span>Revenue Growth: 40%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Develop Your Winning AI Strategy?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Let's create a comprehensive AI strategy that aligns with your business goals and drives measurable results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">
                Start Strategy Development <ArrowRight className="ml-2 h-5 w-5" />
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
