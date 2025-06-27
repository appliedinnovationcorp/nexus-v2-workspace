import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, MapPin, Clock, Users, Briefcase } from 'lucide-react'

export const metadata = {
  title: 'Careers - Applied Innovation Corporation',
  description: 'Join our team of AI experts helping SMBs transform their businesses. Explore career opportunities at Applied Innovation Corporation.',
}

export default function CareersPage() {
  const openPositions = [
    {
      title: "Senior AI Consultant",
      department: "Consulting",
      location: "Remote / San Francisco",
      type: "Full-time",
      description: "Lead AI transformation projects for SMB clients, develop strategies, and guide implementation."
    },
    {
      title: "Machine Learning Engineer",
      department: "Engineering", 
      location: "Remote / San Francisco",
      type: "Full-time",
      description: "Build and deploy AI solutions, develop MLOps pipelines, and ensure production reliability."
    },
    {
      title: "Business Development Manager",
      department: "Sales",
      location: "Remote",
      type: "Full-time", 
      description: "Drive growth by identifying and developing new business opportunities in the SMB market."
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Join Our Mission to Democratize AI
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Help us make enterprise-grade AI accessible to every SMB. Join a team of passionate experts building the future of AI transformation.
            </p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="#positions">
                View Open Positions <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why Work With Us
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Join a company that's making a real impact in the AI space while building a rewarding career.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Meaningful Impact</h3>
                <p className="text-gray-600">
                  Help SMBs transform their businesses and compete with larger enterprises through AI.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Growth Opportunities</h3>
                <p className="text-gray-600">
                  Advance your career in a rapidly growing company at the forefront of AI innovation.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Remote-First Culture</h3>
                <p className="text-gray-600">
                  Work from anywhere with flexible schedules and a focus on results, not hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Open Positions
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Join our growing team and help shape the future of AI for SMBs.
              </p>
            </div>

            <div className="space-y-6">
              {openPositions.map((position, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{position.title}</h3>
                      <p className="text-gray-600 mb-4">{position.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{position.department}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{position.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{position.type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 md:mt-0 md:ml-8">
                      <Button className="bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">Don't see a perfect fit?</p>
              <Button variant="outline" className="border-[#00BCD4] text-[#00BCD4] hover:bg-[#00BCD4] hover:text-white">
                Send Us Your Resume
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our mission to democratize AI and help SMBs compete in the digital economy.
          </p>
          <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
            <Link href="/contact">
              Get In Touch <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
