import Link from 'next/link'
import { Mail, Phone, MapPin, Linkedin, Github, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-4">Applied Innovation Corporation</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                Transforming business through applied AI solutions. We help SMBs unlock the power of Generative AI to drive growth, improve efficiency, and stay competitive.
              </p>
            </div>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-[#00BCD4]" />
                <span className="text-sm text-gray-300">hello@aicorp.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-[#00BCD4]" />
                <span className="text-sm text-gray-300">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-[#00BCD4]" />
                <span className="text-sm text-gray-300">San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Services</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/services/consulting" className="text-gray-300 hover:text-[#00BCD4] transition-colors text-sm">
                  AI Consulting & Transformation
                </Link>
              </li>
              <li>
                <Link href="https://nexus.aicorp.com" className="text-gray-300 hover:text-[#00BCD4] transition-colors text-sm">
                  Nexus Platform
                </Link>
              </li>
              <li>
                <Link href="/services/fractional-cto" className="text-gray-300 hover:text-[#00BCD4] transition-colors text-sm">
                  Fractional CTO Services
                </Link>
              </li>
              <li>
                <Link href="/services/ai-strategy" className="text-gray-300 hover:text-[#00BCD4] transition-colors text-sm">
                  AI Strategy & Planning
                </Link>
              </li>
              <li>
                <Link href="/services/custom-ai" className="text-gray-300 hover:text-[#00BCD4] transition-colors text-sm">
                  Custom AI Development
                </Link>
              </li>
            </ul>
          </div>

          {/* Divisions */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Divisions</h4>
            <ul className="space-y-3">
              <li>
                <Link href="https://smb.aicorp.com" className="text-gray-300 hover:text-[#00BCD4] transition-colors text-sm">
                  SMB Division
                </Link>
              </li>
              <li>
                <Link href="https://enterprise.aicorp.com" className="text-gray-300 hover:text-[#00BCD4] transition-colors text-sm">
                  Enterprise Division
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-[#00BCD4] transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-300 hover:text-[#00BCD4] transition-colors text-sm">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/investors" className="text-gray-300 hover:text-[#00BCD4] transition-colors text-sm">
                  Investor Relations
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Connect */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Resources</h4>
            <ul className="space-y-3 mb-8">
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-[#00BCD4] transition-colors text-sm">
                  Blog & Insights
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-gray-300 hover:text-[#00BCD4] transition-colors text-sm">
                  Resource Center
                </Link>
              </li>
              <li>
                <Link href="/webinars" className="text-gray-300 hover:text-[#00BCD4] transition-colors text-sm">
                  Webinars & Events
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-[#00BCD4] transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
            </ul>

            {/* Social Links */}
            <div>
              <h5 className="text-sm font-semibold mb-4 text-gray-400">Follow Us</h5>
              <div className="flex space-x-4">
                <Link 
                  href="#" 
                  className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#00BCD4] transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </Link>
                <Link 
                  href="#" 
                  className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#00BCD4] transition-colors"
                >
                  <Github className="h-4 w-4" />
                </Link>
                <Link 
                  href="#" 
                  className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#00BCD4] transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h4 className="text-lg font-semibold mb-2">Stay Updated</h4>
              <p className="text-gray-300 text-sm">Get the latest AI insights and updates delivered to your inbox.</p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-md text-white placeholder-gray-400 focus:outline-none focus:border-[#00BCD4]"
              />
              <button className="px-6 py-2 bg-[#00BCD4] text-white rounded-r-md hover:bg-[#00ACC1] transition-colors font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
            <div className="mb-4 md:mb-0">
              <p>&copy; 2025 Applied Innovation Corporation. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy" className="hover:text-[#00BCD4] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[#00BCD4] transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="hover:text-[#00BCD4] transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
