import { Button } from '@aic/ui'
import Link from 'next/link'
import { ArrowRight, Shield, Layers, Settings, Building2, Globe, Lock, Zap, BarChart3, Users, CheckCircle, Star, Award } from 'lucide-react'

// Enterprise Hero Section
const EnterpriseHeroSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-[#1A237E] via-[#37474F] to-[#00BCD4] text-white">
    <div className="absolute inset-0 bg-black/20" />
    <div className="relative container mx-auto px-4 py-24 sm:py-32">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-4">
                🏢 Enterprise-Grade AI Solutions
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              AI at{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Enterprise Scale
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8">
              Comprehensive AI transformation for large enterprises with focus on security, 
              compliance, and scalability. Transform your organization with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
                <Link href="/contact">
                  Schedule Enterprise Consultation <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
                <Link href="/case-studies">
                  View Case Studies
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-blue-200">Fortune 500 Clients</span>
                  <span className="text-2xl font-bold">150+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-200">Average ROI</span>
                  <span className="text-2xl font-bold">450%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-200">Implementation Time</span>
                  <span className="text-2xl font-bold">90 Days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-200">Compliance Certifications</span>
                  <span className="text-2xl font-bold">SOC 2 + GDPR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// Enterprise Value Propositions
const EnterpriseValueProps = () => {
  const values = [
    {
      icon: Shield,
      title: "Security & Compliance",
      description: "SOC 2 Type II, GDPR, HIPAA, and industry-specific compliance built into every solution. Zero-trust architecture with end-to-end encryption.",
      features: ["SOC 2 Type II Certified", "GDPR Compliant", "Zero-Trust Architecture", "End-to-End Encryption"]
    },
    {
      icon: Layers,
      title: "Scalable Architecture",
      description: "AI infrastructure that scales with your enterprise needs. Handle millions of transactions with 99.99% uptime SLA.",
      features: ["99.99% Uptime SLA", "Auto-scaling Infrastructure", "Global CDN", "Multi-region Deployment"]
    },
    {
      icon: Settings,
      title: "Custom Integration",
      description: "Seamless integration with existing enterprise systems. APIs, webhooks, and custom connectors for any platform.",
      features: ["Enterprise APIs", "Custom Connectors", "Legacy System Integration", "Real-time Sync"]
    }
  ]

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Enterprise-Grade AI Solutions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built for the most demanding enterprise environments with security, 
            scalability, and compliance as core principles.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <value.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
              <p className="text-gray-600 mb-6">{value.description}</p>
              <ul className="space-y-2">
                {value.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-[#1A237E] mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Enterprise Solutions Section
const EnterpriseSolutions = () => {
  const solutions = [
    {
      icon: BarChart3,
      title: "AI Strategy & Roadmap",
      description: "Comprehensive AI strategy development with clear roadmap and ROI projections.",
      capabilities: [
        "AI Maturity Assessment",
        "Strategic Roadmap Development", 
        "ROI Modeling & Projections",
        "Change Management Planning"
      ]
    },
    {
      icon: Zap,
      title: "Process Automation",
      description: "Intelligent automation of complex business processes with AI-powered decision making.",
      capabilities: [
        "Workflow Automation",
        "Document Processing",
        "Decision Intelligence",
        "Exception Handling"
      ]
    },
    {
      icon: Globe,
      title: "Advanced Analytics",
      description: "Enterprise-scale analytics with predictive modeling and real-time insights.",
      capabilities: [
        "Predictive Analytics",
        "Real-time Dashboards",
        "Custom ML Models",
        "Data Visualization"
      ]
    },
    {
      icon: Building2,
      title: "System Integration",
      description: "Seamless AI integration with existing enterprise systems and workflows.",
      capabilities: [
        "ERP Integration",
        "CRM Enhancement",
        "API Development",
        "Legacy Modernization"
      ]
    }
  ]

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Enterprise AI Solutions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            End-to-end AI transformation services designed for enterprise complexity and scale.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {solutions.map((solution, index) => (
            <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 border border-gray-200 hover:border-[#1A237E]/20 transition-colors duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center flex-shrink-0">
                  <solution.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{solution.title}</h3>
                  <p className="text-gray-600 mb-4">{solution.description}</p>
                  <ul className="space-y-2">
                    {solution.capabilities.map((capability, capIndex) => (
                      <li key={capIndex} className="flex items-center text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-[#1A237E] rounded-full mr-3 flex-shrink-0" />
                        {capability}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Enterprise Case Studies Section
const EnterpriseCaseStudies = () => {
  const caseStudies = [
    {
      company: "Global Financial Services",
      industry: "Financial Services",
      challenge: "Manual fraud detection processes",
      solution: "AI-powered fraud detection system",
      results: [
        "95% reduction in false positives",
        "60% faster fraud detection",
        "$50M annual savings"
      ],
      logo: "GFS"
    },
    {
      company: "International Manufacturing",
      industry: "Manufacturing",
      challenge: "Supply chain optimization",
      solution: "Predictive analytics platform",
      results: [
        "30% reduction in inventory costs",
        "25% improvement in delivery times",
        "$100M cost savings"
      ],
      logo: "IM"
    },
    {
      company: "Healthcare Enterprise",
      industry: "Healthcare",
      challenge: "Patient data analysis",
      solution: "HIPAA-compliant AI analytics",
      results: [
        "40% improvement in diagnosis accuracy",
        "50% reduction in processing time",
        "Enhanced patient outcomes"
      ],
      logo: "HE"
    }
  ]

  return (
    <section className="py-24 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Proven Enterprise Success
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See how we've helped Fortune 500 companies transform their operations with AI.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {caseStudies.map((study, index) => (
            <div key={index} className="bg-gray-800 rounded-xl p-8 hover:bg-gray-750 transition-colors duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center text-white font-bold mr-4">
                  {study.logo}
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{study.company}</h4>
                  <p className="text-gray-400 text-sm">{study.industry}</p>
                </div>
              </div>
              <div className="mb-4">
                <h5 className="font-medium text-[#00BCD4] mb-2">Challenge</h5>
                <p className="text-gray-300 text-sm mb-4">{study.challenge}</p>
                <h5 className="font-medium text-[#00BCD4] mb-2">Solution</h5>
                <p className="text-gray-300 text-sm mb-4">{study.solution}</p>
                <h5 className="font-medium text-[#00BCD4] mb-2">Results</h5>
                <ul className="space-y-1">
                  {study.results.map((result, resultIndex) => (
                    <li key={resultIndex} className="flex items-center text-sm text-gray-300">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                      {result}
                    </li>
                  ))}
                </ul>
              </div>
              <Button variant="outline" size="sm" asChild className="border-gray-600 text-gray-300 hover:bg-gray-700">
                <Link href={`/case-studies/${study.company.toLowerCase().replace(/\s+/g, '-')}`}>
                  Read Full Case Study <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Security & Compliance Section
const SecurityComplianceSection = () => {
  const certifications = [
    { name: "SOC 2 Type II", icon: Shield },
    { name: "GDPR Compliant", icon: Lock },
    { name: "HIPAA Ready", icon: Award },
    { name: "ISO 27001", icon: CheckCircle }
  ]

  return (
    <section className="py-24 bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Security & Compliance First
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Enterprise-grade security and compliance built into every solution from day one.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Trusted by Regulated Industries
            </h3>
            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-[#1A237E] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Zero-Trust Architecture</h4>
                  <p className="text-gray-600 text-sm">Every request is verified, encrypted, and monitored.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-[#1A237E] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">End-to-End Encryption</h4>
                  <p className="text-gray-600 text-sm">Data encrypted at rest, in transit, and in processing.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-[#1A237E] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Audit & Monitoring</h4>
                  <p className="text-gray-600 text-sm">Comprehensive logging and real-time security monitoring.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-[#1A237E] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Data Residency</h4>
                  <p className="text-gray-600 text-sm">Control where your data is stored and processed globally.</p>
                </div>
              </div>
            </div>
            <Button asChild className="bg-gradient-to-r from-[#1A237E] to-[#00BCD4]">
              <Link href="/security">
                Learn More About Security <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div>
            <div className="grid grid-cols-2 gap-6">
              {certifications.map((cert, index) => (
                <div key={index} className="bg-white rounded-xl p-6 text-center shadow-lg">
                  <cert.icon className="h-8 w-8 text-[#1A237E] mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                </div>
              ))}
            </div>
            <div className="mt-8 bg-white rounded-xl p-6 shadow-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Industry Compliance</h4>
              <div className="flex flex-wrap gap-2">
                {['Financial Services', 'Healthcare', 'Government', 'Manufacturing', 'Retail'].map((industry) => (
                  <span key={industry} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {industry}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Enterprise CTA Section
const EnterpriseCTASection = () => (
  <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold mb-6">
        Ready to Transform Your Enterprise with AI?
      </h2>
      <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
        Join 150+ Fortune 500 companies that trust AIC for their AI transformation. 
        Get a custom strategy session with our enterprise AI experts.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
          <Link href="/contact">
            Schedule Enterprise Consultation <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
          <Link href="/demo">
            Request Custom Demo
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto text-sm text-blue-200">
        <div className="flex items-center justify-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <span>Free Strategy Session</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <span>Custom ROI Analysis</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <span>Enterprise-Grade Security</span>
        </div>
      </div>
    </div>
  </section>
)

// Main Enterprise Homepage Component
export default function EnterpriseHomePage() {
  return (
    <>
      <EnterpriseHeroSection />
      <EnterpriseValueProps />
      <EnterpriseSolutions />
      <EnterpriseCaseStudies />
      <SecurityComplianceSection />
      <EnterpriseCTASection />
    </>
  )
}
