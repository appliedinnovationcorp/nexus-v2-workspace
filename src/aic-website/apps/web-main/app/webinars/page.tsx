import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Calendar, Clock, Users, Play } from 'lucide-react'

export const metadata = {
  title: 'AI Webinars & Events - Applied Innovation Corporation',
  description: 'Join our AI webinars and events designed for SMBs. Learn from experts, network with peers, and discover practical AI solutions.',
}

export default function WebinarsPage() {
  const upcomingWebinars = [
    {
      title: "AI Strategy Workshop: Building Your 2025 Roadmap",
      date: "2025-07-15",
      time: "2:00 PM EST",
      duration: "90 minutes",
      attendees: "250+ registered",
      description: "Interactive workshop to help SMBs develop comprehensive AI strategies for 2025 and beyond.",
      type: "Workshop"
    },
    {
      title: "Customer Service AI: Beyond Basic Chatbots",
      date: "2025-07-22",
      time: "1:00 PM EST", 
      duration: "60 minutes",
      attendees: "180+ registered",
      description: "Explore advanced AI applications for customer service that deliver real business value.",
      type: "Webinar"
    }
  ]

  const pastWebinars = [
    {
      title: "SMB AI Implementation: Lessons from 50+ Deployments",
      date: "2025-06-18",
      duration: "75 minutes",
      views: "1,200+",
      description: "Key insights and lessons learned from successful AI implementations across various SMB industries."
    },
    {
      title: "AI ROI: Measuring Success in Your Business",
      date: "2025-06-10", 
      duration: "60 minutes",
      views: "950+",
      description: "Practical frameworks for calculating and tracking ROI on your AI investments."
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              AI Learning Events for SMBs
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join our expert-led webinars, workshops, and events designed specifically for small and medium businesses ready to embrace AI transformation.
            </p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="#upcoming">
                View Upcoming Events <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Upcoming Webinars */}
      <section id="upcoming" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Upcoming Events
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Register for our upcoming webinars and workshops to accelerate your AI journey.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {upcomingWebinars.map((webinar, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="inline-block px-3 py-1 bg-[#00BCD4] text-white rounded-full text-sm font-medium">
                      {webinar.type}
                    </span>
                    <span className="text-sm text-gray-500">{webinar.attendees}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{webinar.title}</h3>
                  <p className="text-gray-600 mb-6">{webinar.description}</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Calendar className="h-5 w-5 text-[#00BCD4]" />
                      <span>{new Date(webinar.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Clock className="h-5 w-5 text-[#00BCD4]" />
                      <span>{webinar.time} ({webinar.duration})</span>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
                    Register Free
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Past Webinars */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                On-Demand Recordings
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Access recordings of our past webinars and workshops at your convenience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pastWebinars.map((webinar, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      On-Demand
                    </span>
                    <span className="text-sm text-gray-500">{webinar.views} views</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{webinar.title}</h3>
                  <p className="text-gray-600 mb-6">{webinar.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                    <span>{new Date(webinar.date).toLocaleDateString()}</span>
                    <span>{webinar.duration}</span>
                  </div>
                  
                  <Button variant="outline" className="w-full border-[#00BCD4] text-[#00BCD4] hover:bg-[#00BCD4] hover:text-white">
                    <Play className="h-4 w-4 mr-2" />
                    Watch Recording
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready for Personalized AI Guidance?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            While our webinars provide valuable insights, get personalized guidance tailored to your specific business needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">
                Schedule Consultation <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
              <Link href="/services/ai-consulting-services">
                Explore Services
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
