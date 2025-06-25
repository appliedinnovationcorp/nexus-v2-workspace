import { Button } from '@aic/ui'
import Link from 'next/link'
import { ArrowRight, Brain, Zap, Shield, Users, TrendingUp, CheckCircle } from 'lucide-react'

// Hero Section Component
const HeroSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-[#1A237E] via-[#00BCD4] to-[#37474F] text-white">
    <div className="absolute inset-0 bg-black/20" />
    <div className="relative container mx-auto px-4 py-24 sm:py-32">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          Transforming Business with{' '}
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            AI-driven Innovation
          </span>
        </h1>
        <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
          Applied Innovation Corporation delivers enterprise-grade AI consulting, our flagship Nexus PaaS platform, 
          and fractional CTO services to transform businesses of all sizes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
            <Link href="/contact">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
            <Link href="/about">
              Learn More
            </Link>
          </Button>
        </div>
      </div>
    </div>
    {/* Animated background elements */}
    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
  </section>
)

// Core Services Section
const CoreServicesSection = () => {
  const services = [
    {
      icon: Brain,
      title: "AI Consulting & Transformation",
      description: "End-to-end AI strategy, implementation, and transformation services tailored to your business needs.",
      href: "/services/consulting"
    },
    {
      icon: Zap,
      title: "Nexus Platform",
      description: "Our flagship AI PaaS solution providing scalable, enterprise-grade AI infrastructure and tools.",
      href: "https://nexus.aicorp.com"
    },
    {
      icon: Users,
      title: "Fractional CTO Services",
      description: "Executive-level AI leadership and strategic guidance for organizations of all sizes.",
      href: "/services/fractional-cto"
    }
  ]

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Our Core Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive AI solutions designed to accelerate your digital transformation journey
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <service.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{service.title}</h3>
              <p className="text-gray-600 mb-6">{service.description}</p>
              <Link href={service.href} className="text-[#1A237E] font-medium hover:text-[#00BCD4] transition-colors">
                Learn more <ArrowRight className="inline h-4 w-4 ml-1" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Divisions Section
const DivisionsSection = () => (
  <section className="py-24 bg-white">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Our Divisions
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Specialized expertise for different market segments, creating a powerful flywheel effect
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* SMB Division */}
        <div className="bg-gradient-to-br from-[#00BCD4]/5 to-[#00BCD4]/10 rounded-2xl p-8 border border-[#00BCD4]/20">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-[#00BCD4] rounded-lg flex items-center justify-center mr-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">SMB Division</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Tailored AI solutions for small and medium businesses, making enterprise-grade AI accessible and affordable.
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center text-gray-700">
              <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3" />
              Affordable AI transformation packages
            </li>
            <li className="flex items-center text-gray-700">
              <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3" />
              Rapid deployment and ROI
            </li>
            <li className="flex items-center text-gray-700">
              <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3" />
              Scalable solutions that grow with you
            </li>
          </ul>
          <Button asChild variant="outline" className="border-[#00BCD4] text-[#00BCD4] hover:bg-[#00BCD4] hover:text-white">
            <Link href="https://smb.aicorp.com">
              Explore SMB Solutions <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Enterprise Division */}
        <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#1A237E]/10 rounded-2xl p-8 border border-[#1A237E]/20">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-[#1A237E] rounded-lg flex items-center justify-center mr-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Enterprise Division</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Comprehensive AI transformation for large enterprises, with focus on scale, security, and compliance.
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center text-gray-700">
              <CheckCircle className="h-5 w-5 text-[#1A237E] mr-3" />
              Enterprise-scale AI architecture
            </li>
            <li className="flex items-center text-gray-700">
              <CheckCircle className="h-5 w-5 text-[#1A237E] mr-3" />
              Advanced security and compliance
            </li>
            <li className="flex items-center text-gray-700">
              <CheckCircle className="h-5 w-5 text-[#1A237E] mr-3" />
              Custom AI model development
            </li>
          </ul>
          <Button asChild variant="outline" className="border-[#1A237E] text-[#1A237E] hover:bg-[#1A237E] hover:text-white">
            <Link href="https://enterprise.aicorp.com">
              Explore Enterprise Solutions <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
)

// Why AIC Section
const WhyAICSection = () => {
  const values = [
    {
      icon: Shield,
      title: "Ethical AI",
      description: "We prioritize responsible AI development with built-in ethics, transparency, and bias mitigation."
    },
    {
      icon: Zap,
      title: "Tailored Solutions",
      description: "Every solution is customized to your specific business needs, industry, and growth stage."
    },
    {
      icon: TrendingUp,
      title: "Enterprise-Grade",
      description: "Production-ready, scalable solutions that meet the highest standards of security and performance."
    }
  ]

  return (
    <section className="py-24 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Why Choose AIC?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We combine deep technical expertise with business acumen to deliver AI solutions that drive real results
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <value.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{value.title}</h3>
              <p className="text-gray-300">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// CTA Section
const CTASection = () => (
  <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold mb-6">
        Ready to Transform Your Business with AI?
      </h2>
      <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
        Join hundreds of companies that have accelerated their growth with our AI solutions.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
          <Link href="/contact">
            Book a Consultation <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
          <Link href="https://nexus.aicorp.com">
            Try Nexus Platform
          </Link>
        </Button>
      </div>
    </div>
  </section>
)

// Main Homepage Component
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CoreServicesSection />
      <DivisionsSection />
      <WhyAICSection />
      <CTASection />
    </>
  )
}
