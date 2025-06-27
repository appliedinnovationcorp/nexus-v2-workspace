import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, TrendingUp, Users, Globe, Award } from 'lucide-react'

export const metadata = {
  title: 'Investor Relations - Applied Innovation Corporation',
  description: 'Learn about investment opportunities with Applied Innovation Corporation. Access financial information, company updates, and investor resources.',
}

export default function InvestorsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Investor Relations
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Partnering with investors who share our vision of democratizing AI for small and medium businesses worldwide.
            </p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="#overview">
                Investment Overview <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section id="overview" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Investment Opportunity
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Applied Innovation Corporation is positioned at the intersection of two massive trends: AI adoption and SMB digital transformation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">$2.6T</div>
                <p className="text-gray-600">Global SMB Market Size</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">40%</div>
                <p className="text-gray-600">AI Market CAGR</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">85%</div>
                <p className="text-gray-600">SMBs Without AI</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">150%</div>
                <p className="text-gray-600">Our Client Avg ROI</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Opportunity */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
              Market Opportunity
            </h2>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                The AI consulting market is experiencing unprecedented growth, but most solutions target large enterprises. Applied Innovation Corporation has identified and is capturing the underserved SMB segment, which represents 99.9% of all businesses globally.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Market Size</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li>• Global AI market: $1.8T by 2030</li>
                    <li>• SMB AI adoption: <15% currently</li>
                    <li>• Addressable market: $180B+</li>
                    <li>• Our target segment: $45B</li>
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Competitive Advantage</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li>• SMB-focused methodology</li>
                    <li>• Rapid deployment (weeks vs years)</li>
                    <li>• Cost-effective solutions</li>
                    <li>• Proven ROI track record</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Highlights */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-16">
              Financial Highlights
            </h2>
            
            <div className="bg-gradient-to-r from-[#1A237E]/5 to-[#00BCD4]/5 rounded-2xl p-8 border border-[#00BCD4]/20">
              <p className="text-lg text-gray-600 mb-8">
                Applied Innovation Corporation is currently in growth phase with strong fundamentals and expanding market presence.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">50+</div>
                  <p className="text-gray-600">Successful Implementations</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">95%</div>
                  <p className="text-gray-600">Client Retention Rate</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">8</div>
                  <p className="text-gray-600">Industry Verticals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Contact */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Investment Inquiries
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              For detailed financial information, investment opportunities, and partnership discussions, please contact our investor relations team.
            </p>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Investor Relations Contact</h3>
              <p className="text-gray-600 mb-6">
                Email: investors@aicorp.com<br />
                Phone: +1 (555) 123-4567
              </p>
              <Button className="bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
                Schedule Investor Meeting
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Partner With Us
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join us in democratizing AI for SMBs and capturing a significant share of this rapidly growing market.
          </p>
          <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
            <Link href="/contact">
              Contact Investor Relations <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
