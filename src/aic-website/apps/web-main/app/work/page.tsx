import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, ExternalLink, CheckCircle, TrendingUp, Users, Zap, Clock } from 'lucide-react'

export const metadata = {
  title: 'Our Work - Applied Innovation Corporation',
  description: 'Explore our portfolio of successful AI implementations for SMBs. See real case studies and results from our AI consulting and development projects.',
}

export default function WorkPage() {
  const caseStudies = [
    {
      title: "E-commerce Revenue Optimization",
      client: "Mid-size Online Retailer",
      industry: "E-commerce",
      challenge: "Declining conversion rates and inefficient inventory management",
      solution: "AI-powered recommendation engine and predictive inventory system",
      results: [
        "35% increase in conversion rates",
        "28% reduction in inventory costs",
        "42% improvement in customer satisfaction",
        "ROI achieved in 3 months"
      ],
      technologies: ["Machine Learning", "Recommendation Systems", "Predictive Analytics"],
      timeline: "8 weeks",
      image: "/images/case-study-ecommerce.jpg"
    },
    {
      title: "Healthcare Practice Automation",
      client: "Regional Medical Practice",
      industry: "Healthcare",
      challenge: "Manual appointment scheduling and patient communication inefficiencies",
      solution: "AI chatbot for patient interactions and intelligent scheduling system",
      results: [
        "60% reduction in administrative workload",
        "45% improvement in appointment efficiency",
        "90% patient satisfaction with AI interactions",
        "Payback period of 4 months"
      ],
      technologies: ["Natural Language Processing", "Conversational AI", "Workflow Automation"],
      timeline: "6 weeks",
      image: "/images/case-study-healthcare.jpg"
    },
    {
      title: "Manufacturing Quality Control",
      client: "Small Manufacturing Company",
      industry: "Manufacturing",
      challenge: "Inconsistent quality control and high defect rates",
      solution: "Computer vision AI for automated quality inspection",
      results: [
        "78% reduction in defect rates",
        "50% faster quality inspection process",
        "25% reduction in waste and rework",
        "Full ROI in 5 months"
      ],
      technologies: ["Computer Vision", "Deep Learning", "IoT Integration"],
      timeline: "10 weeks",
      image: "/images/case-study-manufacturing.jpg"
    },
    {
      title: "Financial Services Automation",
      client: "Independent Financial Advisory",
      industry: "Financial Services",
      challenge: "Time-consuming client reporting and risk assessment processes",
      solution: "Automated report generation and AI-powered risk analysis",
      results: [
        "70% reduction in report preparation time",
        "40% improvement in risk assessment accuracy",
        "55% increase in client capacity",
        "Break-even achieved in 6 months"
      ],
      technologies: ["Document AI", "Risk Analytics", "Automated Reporting"],
      timeline: "12 weeks",
      image: "/images/case-study-financial.jpg"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Real Results from Real Businesses
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Discover how SMBs across various industries have transformed their operations and achieved measurable ROI with our AI solutions.
            </p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">
                Start Your Success Story <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Results Overview */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our Track Record
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Numbers that matter: real results from our AI implementations across different industries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">150%</div>
              <p className="text-gray-600">Average ROI within 6 months</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">8 weeks</div>
              <p className="text-gray-600">Average implementation time</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">50+</div>
              <p className="text-gray-600">Successful AI implementations</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">95%</div>
              <p className="text-gray-600">Client satisfaction rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Case Studies
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Deep dives into how we've helped SMBs transform their operations with AI.
            </p>
          </div>

          <div className="space-y-16">
            {caseStudies.map((study, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="p-8 lg:p-12">
                    <div className="mb-6">
                      <span className="inline-block px-3 py-1 bg-[#00BCD4]/10 text-[#00BCD4] rounded-full text-sm font-medium mb-4">
                        {study.industry}
                      </span>
                      <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                        {study.title}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        <strong>Client:</strong> {study.client}
                      </p>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Challenge</h4>
                      <p className="text-gray-600 mb-6">{study.challenge}</p>
                      
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Solution</h4>
                      <p className="text-gray-600 mb-6">{study.solution}</p>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Results</h4>
                      <ul className="space-y-2">
                        {study.results.map((result, resultIndex) => (
                          <li key={resultIndex} className="flex items-center text-gray-700">
                            <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                            {result}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-6">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Timeline:</span>
                        <span className="ml-2 text-sm text-gray-900">{study.timeline}</span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Technologies Used</h4>
                      <div className="flex flex-wrap gap-2">
                        {study.technologies.map((tech, techIndex) => (
                          <span key={techIndex} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 p-8 lg:p-12 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <div className="text-white text-4xl font-bold">
                          {study.industry.charAt(0)}
                        </div>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{study.industry}</h4>
                      <p className="text-gray-600">Success Story</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries We Serve */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Industries We Serve
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              We've successfully implemented AI solutions across diverse industries, each with unique challenges and opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "E-commerce & Retail", description: "Personalization, inventory optimization, customer service automation" },
              { name: "Healthcare", description: "Patient communication, scheduling optimization, clinical decision support" },
              { name: "Manufacturing", description: "Quality control, predictive maintenance, supply chain optimization" },
              { name: "Financial Services", description: "Risk assessment, automated reporting, fraud detection" },
              { name: "Professional Services", description: "Document automation, client communication, project management" },
              { name: "Real Estate", description: "Lead qualification, property analysis, market intelligence" }
            ].map((industry, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{industry.name}</h3>
                <p className="text-gray-600">{industry.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              What Our Clients Say
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Real feedback from real businesses that have transformed with AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="mb-6">
                <div className="flex text-[#00BCD4] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                  ))}
                </div>
                <blockquote className="text-lg text-gray-700 mb-4">
                  "Applied Innovation transformed our customer service with their AI chatbot. We've reduced response times by 80% and our customers love the instant, accurate support."
                </blockquote>
                <cite className="text-gray-600">
                  <strong>Sarah Johnson</strong><br />
                  CEO, TechStart Solutions
                </cite>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="mb-6">
                <div className="flex text-[#00BCD4] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                  ))}
                </div>
                <blockquote className="text-lg text-gray-700 mb-4">
                  "The predictive analytics solution has revolutionized our inventory management. We've cut costs by 30% while improving customer satisfaction. ROI was achieved in just 3 months."
                </blockquote>
                <cite className="text-gray-600">
                  <strong>Michael Chen</strong><br />
                  Operations Director, RetailMax
                </cite>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Write Your Success Story?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the growing number of SMBs that have transformed their operations and achieved measurable results with AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">
                Start Your AI Journey <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
              <Link href="/services/ai-consulting-services">
                Explore Our Services
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
