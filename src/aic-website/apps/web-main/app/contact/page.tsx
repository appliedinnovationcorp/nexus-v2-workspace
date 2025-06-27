import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin, Clock, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Contact Us - Applied Innovation Corporation',
  description: 'Get in touch with our AI experts. Contact Applied Innovation Corporation for AI consulting, development, and transformation services.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Let's Transform Your Business with AI
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Ready to unlock the power of AI for your business? Our experts are here to help you navigate your AI transformation journey.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Get Started Today</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                    placeholder="Your Company"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                    Service Interest
                  </label>
                  <select
                    id="service"
                    name="service"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                  >
                    <option value="">Select a service</option>
                    <option value="ai-consulting">AI Consulting & Strategy</option>
                    <option value="ai-development">AI Development Services</option>
                    <option value="generative-ai">Generative AI Solutions</option>
                    <option value="mlops">MLOps Consulting</option>
                    <option value="ai-agents">AI Agents Development</option>
                    <option value="fractional-cto">Fractional CTO Services</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Description *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                    placeholder="Tell us about your AI needs, challenges, or goals..."
                  />
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-[#1A237E] to-[#00BCD4] hover:from-[#1A237E]/90 hover:to-[#00BCD4]/90"
                >
                  Send Message <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Get in Touch</h2>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#00BCD4] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
                    <p className="text-gray-600 mb-2">Ready to start your AI journey?</p>
                    <a href="mailto:hello@aicorp.com" className="text-[#00BCD4] hover:text-[#1A237E] font-medium">
                      hello@aicorp.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#00BCD4] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h3>
                    <p className="text-gray-600 mb-2">Speak directly with our AI experts</p>
                    <a href="tel:+15551234567" className="text-[#00BCD4] hover:text-[#1A237E] font-medium">
                      +1 (555) 123-4567
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#00BCD4] rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Visit Us</h3>
                    <p className="text-gray-600">
                      San Francisco, CA<br />
                      United States
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#00BCD4] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Hours</h3>
                    <div className="text-gray-600 space-y-1">
                      <p>Monday - Friday: 9:00 AM - 6:00 PM PST</p>
                      <p>Saturday: 10:00 AM - 2:00 PM PST</p>
                      <p>Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Box */}
              <div className="mt-12 p-8 bg-gradient-to-r from-[#1A237E]/5 to-[#00BCD4]/5 rounded-2xl border border-[#00BCD4]/20">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-6">
                  Schedule a free consultation to discuss your AI needs and discover how we can help transform your business.
                </p>
                <Button 
                  variant="outline" 
                  className="border-[#00BCD4] text-[#00BCD4] hover:bg-[#00BCD4] hover:text-white"
                >
                  Schedule Consultation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-8">
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  How quickly can you start working on my AI project?
                </h3>
                <p className="text-gray-600">
                  We typically begin initial consultations within 48 hours of contact. For most projects, we can start development within 1-2 weeks after project scoping and agreement.
                </p>
              </div>

              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  What industries do you work with?
                </h3>
                <p className="text-gray-600">
                  We work with SMBs across various industries including healthcare, finance, retail, manufacturing, and professional services. Our AI solutions are tailored to each industry's specific needs and compliance requirements.
                </p>
              </div>

              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Do you provide ongoing support after implementation?
                </h3>
                <p className="text-gray-600">
                  Yes, we offer comprehensive support packages including monitoring, maintenance, updates, and optimization. Our MLOps team ensures your AI systems continue to perform optimally as your business grows.
                </p>
              </div>

              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  What's the typical timeline for an AI project?
                </h3>
                <p className="text-gray-600">
                  Project timelines vary based on complexity, but most SMB AI implementations take 4-12 weeks from start to deployment. We focus on delivering production-ready solutions quickly while ensuring quality and reliability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
