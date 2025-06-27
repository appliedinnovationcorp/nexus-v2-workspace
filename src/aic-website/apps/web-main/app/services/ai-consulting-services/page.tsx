import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Brain, Target, Zap, Users, Clock, DollarSign, TrendingUp, Shield } from 'lucide-react'

export const metadata = {
  title: 'AI Consulting Services - Applied Innovation Corporation',
  description: 'Expert AI consulting and strategy services for SMBs. Plan your AI adoption with confidence through our proven methodology and practical approach.',
}

export default function AIConsultingServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Plan Your AI Adoption with Confidence
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              We help SMBs navigate the complexities of AI adoption — from strategy to deployment. Our experts work alongside your team to design practical, tailored AI solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
                <Link href="/contact">
                  Start Your AI Strategy <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
                <Link href="#services">
                  Explore Our Services
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Why SMBs Choose Our AI Consulting
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Unlike traditional consulting firms that focus on enterprise clients, we specialize in making AI accessible and profitable for small and medium businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Fast Implementation</h3>
              <p className="text-gray-600">
                Get AI solutions deployed in weeks, not years. Our streamlined process is designed for SMB timelines.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">SMB-Friendly Pricing</h3>
              <p className="text-gray-600">
                Transparent, predictable pricing designed for SMB budgets. No hidden costs or enterprise-level fees.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Measurable ROI</h3>
              <p className="text-gray-600">
                Every AI solution is designed to deliver clear, measurable business value and return on investment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section id="services" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our AI Consulting Services
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Comprehensive AI consulting services tailored specifically for SMB needs and constraints.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Strategy & Roadmap</h3>
              <p className="text-gray-600 mb-6">
                Develop a comprehensive AI strategy aligned with your business goals, including technology roadmap, implementation timeline, and ROI projections.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Business process analysis and AI opportunity identification
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Technology stack recommendations and architecture planning
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Implementation roadmap with clear milestones and timelines
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  ROI projections and success metrics definition
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Readiness Assessment</h3>
              <p className="text-gray-600 mb-6">
                Comprehensive evaluation of your organization's readiness for AI adoption, including data maturity, technical infrastructure, and team capabilities.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Data quality and availability assessment
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Technical infrastructure evaluation
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Team skills gap analysis and training recommendations
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Change management and adoption strategy
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Implementation Planning</h3>
              <p className="text-gray-600 mb-6">
                Detailed planning for AI solution implementation, including technical specifications, resource requirements, and risk mitigation strategies.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Technical architecture design and documentation
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Resource allocation and budget planning
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Risk assessment and mitigation strategies
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Integration planning with existing systems
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Training & Change Management</h3>
              <p className="text-gray-600 mb-6">
                Comprehensive training programs and change management support to ensure successful AI adoption across your organization.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Executive and leadership AI education
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Technical team training and upskilling
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  End-user training and support materials
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Change management and adoption strategies
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our Proven Consulting Process
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              A structured, proven methodology designed specifically for SMB AI adoption success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Discovery</h3>
              <p className="text-gray-600">
                Deep dive into your business processes, challenges, and AI opportunities through workshops and analysis.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Strategy</h3>
              <p className="text-gray-600">
                Develop comprehensive AI strategy and roadmap aligned with your business goals and constraints.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Planning</h3>
              <p className="text-gray-600">
                Create detailed implementation plans with clear timelines, resources, and success metrics.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Support</h3>
              <p className="text-gray-600">
                Ongoing guidance and support throughout implementation to ensure success and maximize ROI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
              Benefits of Our AI Consulting
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Business Benefits</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Reduced Risk</h4>
                      <p className="text-gray-600">Minimize AI implementation risks through proven methodologies</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Faster Time-to-Value</h4>
                      <p className="text-gray-600">Accelerate AI adoption and realize benefits sooner</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Cost Optimization</h4>
                      <p className="text-gray-600">Avoid costly mistakes and optimize AI investments</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Competitive Advantage</h4>
                      <p className="text-gray-600">Gain strategic advantages through smart AI implementation</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Technical Benefits</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Expert Guidance</h4>
                      <p className="text-gray-600">Access to experienced AI professionals and best practices</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Technology Selection</h4>
                      <p className="text-gray-600">Choose the right AI technologies for your specific needs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Scalable Architecture</h4>
                      <p className="text-gray-600">Build AI solutions that scale with your business growth</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Quality Assurance</h4>
                      <p className="text-gray-600">Ensure AI solutions meet enterprise-grade quality standards</p>
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
            Ready to Start Your AI Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Let our AI experts help you develop a winning strategy and roadmap for AI adoption in your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">
                Schedule a Consultation <ArrowRight className="ml-2 h-5 w-5" />
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
