import { Button } from '@aic/ui'
import Link from 'next/link'
import { ArrowRight, Zap, Code, Database, Shield, BarChart3, Cpu, Globe, CheckCircle, Play, BookOpen, Users } from 'lucide-react'

// Nexus Hero Section
const NexusHeroSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-[#37474F] via-[#1A237E] to-[#00BCD4] text-white">
    <div className="absolute inset-0 bg-black/10" />
    <div className="relative container mx-auto px-4 py-24 sm:py-32">
      <div className="max-w-5xl mx-auto text-center">
        <div className="mb-6">
          <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-4">
            ⚡ AI Platform as a Service
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          Meet{' '}
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Nexus
          </span>
          <br />
          Your AI Infrastructure Platform
        </h1>
        <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto">
          The most advanced AI Platform-as-a-Service. Deploy, scale, and manage AI applications 
          with enterprise-grade infrastructure, built-in security, and developer-friendly tools.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button size="xl" variant="default" asChild className="bg-white text-[#37474F] hover:bg-gray-100">
            <Link href="/signup">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
            <Link href="/demo">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto text-sm text-blue-200">
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Deploy in minutes</span>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// Platform Features Section
const PlatformFeatures = () => {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast Deployment",
      description: "Deploy AI models and applications in minutes, not weeks. One-click deployment with automatic scaling.",
      highlight: "Deploy in 60 seconds"
    },
    {
      icon: Code,
      title: "Developer-First APIs",
      description: "RESTful APIs, GraphQL, and SDKs for Python, JavaScript, and more. Built for developers, by developers.",
      highlight: "10+ SDKs available"
    },
    {
      icon: Database,
      title: "Managed AI Infrastructure",
      description: "GPU clusters, vector databases, and model serving infrastructure managed for you. Focus on building, not ops.",
      highlight: "99.9% uptime SLA"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "SOC 2 compliant with end-to-end encryption, VPC isolation, and audit logging built-in.",
      highlight: "SOC 2 certified"
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Monitor performance, usage, and costs with real-time dashboards and intelligent alerting.",
      highlight: "Live monitoring"
    },
    {
      icon: Globe,
      title: "Global Edge Network",
      description: "Deploy AI applications globally with our edge network for ultra-low latency worldwide.",
      highlight: "15+ regions"
    }
  ]

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Build AI Applications
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From model training to production deployment, Nexus provides the complete AI infrastructure stack.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 relative">
              <div className="absolute top-4 right-4 bg-[#37474F] text-white px-3 py-1 rounded-full text-xs font-medium">
                {feature.highlight}
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-[#37474F] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Use Cases Section
const UseCasesSection = () => {
  const useCases = [
    {
      title: "AI-Powered Applications",
      description: "Build and deploy intelligent applications with natural language processing, computer vision, and predictive analytics.",
      examples: ["Chatbots & Virtual Assistants", "Document Processing", "Image Recognition", "Recommendation Systems"],
      icon: Cpu
    },
    {
      title: "Machine Learning Workflows",
      description: "End-to-end ML pipelines from data ingestion to model deployment with automated retraining and monitoring.",
      examples: ["Model Training & Tuning", "Feature Engineering", "A/B Testing", "Model Monitoring"],
      icon: BarChart3
    },
    {
      title: "Enterprise AI Integration",
      description: "Seamlessly integrate AI capabilities into existing enterprise systems and workflows.",
      examples: ["CRM Enhancement", "ERP Automation", "Business Intelligence", "Process Optimization"],
      icon: Database
    }
  ]

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Built for Every AI Use Case
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Whether you're building your first AI application or scaling enterprise ML workflows, 
            Nexus adapts to your needs.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 border border-gray-200">
              <div className="w-12 h-12 bg-gradient-to-r from-[#37474F] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <useCase.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{useCase.title}</h3>
              <p className="text-gray-600 mb-6">{useCase.description}</p>
              <ul className="space-y-2">
                {useCase.examples.map((example, exampleIndex) => (
                  <li key={exampleIndex} className="flex items-center text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-[#37474F] rounded-full mr-3 flex-shrink-0" />
                    {example}
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

// Pricing Preview Section
const PricingPreview = () => {
  const plans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "Perfect for developers and small projects",
      features: [
        "5 AI models",
        "10K API calls/month",
        "Community support",
        "Basic analytics"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$99",
      period: "/month",
      description: "For growing businesses and teams",
      features: [
        "25 AI models",
        "100K API calls/month",
        "Priority support",
        "Advanced analytics",
        "Custom domains"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations with custom needs",
      features: [
        "Unlimited models",
        "Custom API limits",
        "24/7 dedicated support",
        "SLA guarantees",
        "On-premise deployment"
      ],
      popular: false
    }
  ]

  return (
    <section className="py-24 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Start free, scale as you grow. No hidden fees, no vendor lock-in.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div key={index} className={`relative rounded-2xl p-8 ${
              plan.popular 
                ? 'bg-gradient-to-br from-[#37474F] to-[#1A237E] border-2 border-[#00BCD4]' 
                : 'bg-gray-800 border border-gray-700'
            }`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-[#00BCD4] to-[#37474F] text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <p className="text-gray-300 text-sm">{plan.description}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-300">
                    <CheckCircle className="h-4 w-4 text-[#00BCD4] mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                className={`w-full ${
                  plan.popular 
                    ? 'bg-white text-[#37474F] hover:bg-gray-100' 
                    : 'bg-[#37474F] hover:bg-[#37474F]/80'
                }`}
                asChild
              >
                <Link href={plan.name === 'Enterprise' ? '/contact' : '/signup'}>
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Developer Resources Section
const DeveloperResources = () => {
  const resources = [
    {
      icon: BookOpen,
      title: "Documentation",
      description: "Comprehensive guides, API references, and tutorials to get you started quickly.",
      link: "/docs"
    },
    {
      icon: Code,
      title: "SDKs & Libraries",
      description: "Official SDKs for Python, JavaScript, Go, and more. Start building in your favorite language.",
      link: "/sdks"
    },
    {
      icon: Users,
      title: "Community",
      description: "Join thousands of developers building with Nexus. Get help, share ideas, and collaborate.",
      link: "/community"
    }
  ]

  return (
    <section className="py-24 bg-gradient-to-br from-[#37474F]/5 to-[#00BCD4]/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything Developers Need
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From comprehensive documentation to active community support, we've got you covered.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {resources.map((resource, index) => (
            <Link key={index} href={resource.link} className="group">
              <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-r from-[#37474F] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                  <resource.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-[#37474F] transition-colors">
                  {resource.title}
                </h3>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <div className="flex items-center text-[#37474F] font-medium group-hover:text-[#00BCD4] transition-colors">
                  Learn more <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// Nexus CTA Section
const NexusCTASection = () => (
  <section className="py-24 bg-gradient-to-r from-[#37474F] to-[#00BCD4] text-white">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold mb-6">
        Ready to Build the Future with AI?
      </h2>
      <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
        Join thousands of developers and companies using Nexus to build, deploy, 
        and scale AI applications. Start your free trial today.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <Button size="xl" variant="default" asChild className="bg-white text-[#37474F] hover:bg-gray-100">
          <Link href="/signup">
            Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
          <Link href="/contact">
            Talk to Sales
          </Link>
        </Button>
      </div>
      <div className="text-sm text-blue-200">
        <p>✓ 14-day free trial • ✓ No setup fees • ✓ Cancel anytime</p>
      </div>
    </div>
  </section>
)

// Main Nexus Homepage Component
export default function NexusHomePage() {
  return (
    <>
      <NexusHeroSection />
      <PlatformFeatures />
      <UseCasesSection />
      <PricingPreview />
      <DeveloperResources />
      <NexusCTASection />
    </>
  )
}
