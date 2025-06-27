import { Button } from '../src/components/ui/button'
import Link from 'next/link'
import { Database, ArrowRight, Brain, Zap, Shield, Users, TrendingUp, CheckCircle } from 'lucide-react'
import { HeroSection } from '../src/components/hero-section'
import { LogoTicker } from '../src/components/logo-ticker'

// Logo Ticker Section
const LogoTickerSection = () => {
  const logos = [
    { name: 'Microsoft', src: '/logos/microsoft.svg' },
    { name: 'Google', src: '/logos/google.svg' },
    { name: 'Amazon', src: '/logos/amazon.svg' },
    { name: 'IBM', src: '/logos/ibm.svg' },
    { name: 'Oracle', src: '/logos/oracle.svg' },
    { name: 'Salesforce', src: '/logos/salesforce.svg' },
    { name: 'Adobe', src: '/logos/adobe.svg' },
    { name: 'Nvidia', src: '/logos/nvidia.svg' },
    { name: 'Intel', src: '/logos/intel.svg' },
    { name: 'Cisco', src: '/logos/cisco.svg' },
  ]

  return (
    <section id="logo-ticker-sec-module" className="py-16 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-lg text-gray-600 font-medium">
            Trusted by leading companies worldwide
          </p>
        </div>
        <LogoTicker logos={logos} />
      </div>
    </section>
  )
}

// Value Proposition Section
const ValuePropositionSection = () => (
  <section className="py-24 bg-white">
    <div className="container mx-auto px-4">
      <div className="max-w-[900px] mx-auto">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-8 leading-tight">
          We help SMBs unlock the power of Generative AI to drive growth, improve efficiency, and stay competitive.
        </h2>
        <div className="text-lg sm:text-xl text-gray-600 leading-relaxed space-y-6">
          <p>
            Our experts guide your business through AI enablement and transformation — from strategy to deployment — ensuring you realize measurable ROI, reduce costs, and open new revenue streams.
          </p>
          <br />
          <p>
            Unlike traditional, slow-moving implementations, we deliver custom AI models, agents, and automation solutions ready for production in weeks, not years. Our approach combines practical AI expertise, deep business understanding, and proven processes to help you adopt AI with confidence and speed.
          </p>
        </div>
      </div>
    </div>
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
    },
    {
      icon: Brain,
      title: "Plan Your AI Adoption with Confidence",
      description: "We help SMBs navigate the complexities of AI adoption — from strategy to deployment. Our experts work alongside your team to design practical, tailored AI solutions that enhance your competitive advantage, improve efficiency, and unlock new growth opportunities.",
      href: "/services/ai-consulting-services"
    },
    {
      icon: Zap,
      title: "AI-Driven Decision-Making for SMBs",
      description: "We empower your business with AI tools that deliver deep insights, streamline operations, and provide the foresight needed to innovate and stay competitive. From automation to predictive analytics, we turn data into a strategic advantage.",
      href: "/services/ai-development-services"
    },
    {
      icon: Users,
      title: "Make AI Your Competitive Advantage",
      description: "We simplify Generative AI for SMBs — building custom AI agents that power personalized experiences, smarter products, and continuous innovation to help your business grow and stand apart.",
      href: "/services/generative-ai-development-company"
    },
    {
      icon: Brain,
      title: "AI-Powered Customer Engagement",
      description: "Applied Innovation designs AI chatbots customized to your operations, data, and audience. The result? More efficient support, improved customer experiences, and stronger engagement — all powered by intelligent automation.",
      href: "/services/ai-development-services"
    },
    {
      icon: Zap,
      title: "AI That Performs — At Scale",
      description: "Applied Innovation supports SMBs in building reliable, production-grade AI systems. Our MLOps team oversees development, deployment, and real-time monitoring — ensuring your AI operates efficiently, adapts to change, and delivers sustained business value.",
      href: "/services/mlops-consulting-services"
    },
    {
      icon: Users,
      title: "AI Agents Built for Business Results",
      description: "We design AI agents that work for your business — simplifying complex tasks, optimizing processes, and boosting productivity. Applied Innovation delivers AI that fits your systems, scales with your needs, and helps you grow.",
      href: "/services/ai-agents-development"
    }
  ]

  return (
    <section id="core-services" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h3 className="font-bold text-gray-1200 mb-4">
            What we Offer, Our Core Services
          </h3>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            We partner with SMBs to drive AI-enabled transformation and scalable growth.
          </h1>
          <div className="text-lg sm:text-xl text-gray-600 leading-relaxed space-y-6">
            <p>Applied Innovation integrates AI expertise, strategic insight, and proven technology to help businesses achieve operational efficiency, reduce costs, and realize sustainable value in a data-driven world.</p>
          </div>
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
      icon: Database,
      title: "Ethical AI",
      description: "At Applied Innovation, we believe AI should be built with integrity from the start. That’s why our solutions prioritize ethics, transparency, and bias mitigation — ensuring your business benefits from AI that is not only powerful and effective but also responsible, trustworthy, and aligned to real-world values."
    },
    {
      icon: Zap,
      title: "Tailored Solutions",
      description: "At Applied Innovation, we understand that no two businesses are alike. That’s why every AI solution we deliver is fully customized to your specific goals, industry requirements, and growth stage — ensuring practical, high-impact results that align with your vision and drive measurable success."
    },
    {
      icon: TrendingUp,
      title: "Enterprise-Grade",
      description: "Applied Innovation delivers production-ready, scalable AI solutions designed to meet the highest standards of security, reliability, and performance — so your business can deploy with confidence, operate at scale, and drive real-world results without compromising on safety or quality."
    },
    {
      icon: Shield,
      title: "Real-World AI Expertise You Can Trust",
      description: "With extensive experience building technology solutions for businesses like yours, Applied Innovation delivers more than theory — we provide proven AI solutions designed to solve your challenges, optimize operations, and fuel growth."
    },
    {
      icon: Zap,
      title: "Strategic AI Solutions, Custom-Fit to Your Business",
      description: "Applied Innovation partners with SMBs to design AI strategies and solutions precisely aligned to your unique challenges and objectives. Our bespoke approach ensures you achieve meaningful outcomes and lasting competitive advantage."
    },
    {
      icon: TrendingUp,
      title: "Advanced AI Solutions for Measurable Business Impact",
      description: "Applied Innovation combines deep expertise with the latest AI, ML, and data science advancements to help your business innovate faster, operate smarter, and maintain a competitive edge in a rapidly evolving market."
    },
    {
      icon: TrendingUp,
      title: "Full-Lifecycle AI Enablement",
      description: "Applied Innovation delivers comprehensive support across your entire AI journey. From strategic planning to seamless implementation and long-term optimization, we help SMBs reduce risk, ensure performance, and maximize ROI from AI adoption."
    },
    {
      icon: TrendingUp,
      title: "Practical AI, Delivered with Speed and Impact",
      description: "At Applied Innovation, we turn AI strategies into real, working solutions — fast. Our team helps SMBs move from concept to production in weeks, not years, ensuring every project drives measurable business value with minimal complexity."
    }
  ]

  return (
    <section className="py-24 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h3 className="text-xl sm:text-4xl font-bold mb-4">
            Why Choose AIC?
          </h3>
          <h2 className="text-3xl text-gray-300 max-w-3xl mx-auto">
            A Trusted Partner in AI-Driven Transformation.
          </h2><br></br>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We combine deep technical expertise with business acumen to deliver AI solutions that drive real results. With over a decade of experience building technology for digital businesses, Applied Innovation delivers the strategic guidance, technical excellence, and tailored AI solutions SMBs need to transform, scale, and compete in today’s market.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <div key={index} className="text-left">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <value.icon className="h-8 w-8 text-white text-left" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{value.title}</h3>
              <p className="text-gray-300">{value.description}</p>
            </div>
          ))}
        </div>
        <div className='spacer-50'></div>
        <div className='container mx-auto px-4'>
          <div className="text-center mb-16">
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-center">
              <div className="w-full flex-1 md:w-auto md:flex-none">
                <Button asChild className="flex items-center space-x-2 rounded-full text-white border-0" style={{
                  backgroundImage: 'linear-gradient(96.69deg, #6714cc 4.32%, #2673fb 92.12%)'
                }}>
                  <Link href="/contact" className="flex items-center space-x-2">
                    <span>Contact Us</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
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
            Book a Consultation
          </Link>
        </Button>
        <Button size="xl" variant="outline" asChild className="border-white text-black hover:bg-white/10">
          <Link href="https://nexus.aicorp.com">
            Try Nexus Platform
          </Link>
        </Button>
      </div>
    </div>
  </section>
)

// Process Section
const ProcessSection = () => (
  <section className="py-24 bg-gray-900 text-white">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h3 className="text-xl sm:text-4xl font-bold mb-4">
          Our Process
        </h3>
        <h2 className="text-3xl text-gray-300 max-w-3xl mx-auto">
          Boost efficiency and cut operational costs with Generative AI — deployed in weeks, not years.
        </h2>
        <br />
        <div className="mt-12">
          <img 
            src="/images/our-process-sep-24-2.webp" 
            alt="Our AI Implementation Process" 
            className="mx-auto max-w-full h-auto rounded-lg shadow-2xl"
          />
        </div>
      </div>
    </div>
  </section>
)

// About Us Section
const AboutSection = () => (
  <section className="py-24 bg-gray-900 text-white">
    <div className="container mx-auto px-4">
      <div className="text-left mb-16">
        <h1 className="text-4xl text-white-300 mx-auto text-left">
          Partnering with SMBs to Enterprises with Tailored AI Solutions Since 2014
        </h1><br></br>
        <p className="text-2xl text-white-100 mx-auto text-left">Applied Innovation combines deep expertise in AI, Generative AI, Agentic AI, chatbots, and cloud technologies to deliver scalable, end-to-end solutions customized for your business. Our team of data scientists, engineers, developers, and MLOps specialists work closely with you—from data preparation to technology evaluation—to ensure measurable impact, robust data security, and solutions that evolve with your growth. 
          <Link href="/about-us" className="text-white font-medium hover:text-[#00BCD4] transition-colors"> Learn more <ArrowRight className="inline h-4 w-4 ml-1 text-[#00BCD4]" /></Link>
        </p>
      </div>
    </div>
  </section>
)

// Main Homepage Component
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LogoTickerSection />
      <ValuePropositionSection />
      <CoreServicesSection />
      <DivisionsSection />
      <WhyAICSection />
      <ProcessSection />
      <AboutSection />
      <CTASection />
    </>
  )
}
