import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Download, FileText, Video, BookOpen, Users, TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'AI Resources - Applied Innovation Corporation',
  description: 'Free AI resources for SMBs including whitepapers, guides, templates, and tools to accelerate your AI transformation journey.',
}

export default function ResourcesPage() {
  const resources = [
    {
      title: "The Complete SMB AI Implementation Guide",
      description: "A comprehensive 50-page guide covering everything from AI strategy to deployment for small and medium businesses.",
      type: "Guide",
      icon: BookOpen,
      downloadCount: "2,500+",
      category: "Strategy"
    },
    {
      title: "AI ROI Calculator & Template",
      description: "Excel template and methodology for calculating and tracking ROI on your AI investments with real-world examples.",
      type: "Template",
      icon: FileText,
      downloadCount: "1,800+",
      category: "Business Case"
    },
    {
      title: "AI Readiness Assessment Checklist",
      description: "Evaluate your organization's readiness for AI adoption with this comprehensive 25-point assessment framework.",
      type: "Checklist",
      icon: FileText,
      downloadCount: "3,200+",
      category: "Assessment"
    },
    {
      title: "Customer Service AI Implementation Webinar",
      description: "60-minute recorded webinar covering best practices for implementing AI in customer service operations.",
      type: "Webinar",
      icon: Video,
      downloadCount: "1,200+",
      category: "Implementation"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Free AI Resources for SMBs
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Accelerate your AI journey with our comprehensive collection of guides, templates, tools, and insights designed specifically for small and medium businesses.
            </p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="#resources">
                Explore Resources <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section id="resources" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Featured Resources
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our most popular resources to help you get started with AI implementation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {resources.map((resource, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center flex-shrink-0">
                      <resource.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="inline-block px-3 py-1 bg-[#00BCD4]/10 text-[#00BCD4] rounded-full text-sm font-medium">
                          {resource.type}
                        </span>
                        <span className="text-sm text-gray-500">{resource.downloadCount} downloads</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{resource.title}</h3>
                      <p className="text-gray-600 mb-4">{resource.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{resource.category}</span>
                        <Button variant="outline" size="sm" className="border-[#00BCD4] text-[#00BCD4] hover:bg-[#00BCD4] hover:text-white">
                          <Download className="h-4 w-4 mr-2" />
                          Download Free
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Browse by Category
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Find resources tailored to your specific needs and stage of AI adoption.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">AI Strategy & Planning</h3>
                <p className="text-gray-600 mb-6">Strategic frameworks, planning templates, and roadmap guides for AI adoption.</p>
                <div className="text-sm text-gray-500 mb-4">12 resources available</div>
                <Button variant="outline" className="border-[#00BCD4] text-[#00BCD4] hover:bg-[#00BCD4] hover:text-white">
                  Browse Strategy Resources
                </Button>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Implementation Guides</h3>
                <p className="text-gray-600 mb-6">Step-by-step guides for implementing specific AI solutions in your business.</p>
                <div className="text-sm text-gray-500 mb-4">8 resources available</div>
                <Button variant="outline" className="border-[#00BCD4] text-[#00BCD4] hover:bg-[#00BCD4] hover:text-white">
                  Browse Implementation
                </Button>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Case Studies</h3>
                <p className="text-gray-600 mb-6">Real-world examples of successful AI implementations across different industries.</p>
                <div className="text-sm text-gray-500 mb-4">15 resources available</div>
                <Button variant="outline" className="border-[#00BCD4] text-[#00BCD4] hover:bg-[#00BCD4] hover:text-white">
                  Browse Case Studies
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-2xl p-8 lg:p-12 text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Get New Resources First</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Subscribe to receive new AI resources, guides, and insights delivered directly to your inbox.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <Button className="bg-white text-[#1A237E] hover:bg-gray-100 px-6 py-3">
                  Subscribe
                </Button>
              </div>
              
              <p className="text-sm text-blue-100 mt-4">
                Join 5,000+ SMB leaders. No spam, unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Need Personalized AI Guidance?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            While our resources provide great starting points, every business is unique. Get personalized AI strategy and implementation guidance from our experts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" className="bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
              <Link href="/contact">
                Schedule Free Consultation <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="border-[#00BCD4] text-[#00BCD4] hover:bg-[#00BCD4] hover:text-white">
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
