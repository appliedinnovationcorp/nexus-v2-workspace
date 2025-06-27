import { Button } from '@aic/ui'
import Link from 'next/link'
import { ArrowRight, DollarSign, Clock, TrendingUp, CheckCircle, Star } from 'lucide-react'

// SMB-specific Hero Section
const SMBHeroSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-[#00BCD4] via-[#1A237E] to-[#37474F] text-white">
    <div className="absolute inset-0 bg-black/10" />
    <div className="relative container mx-auto px-4 py-24 sm:py-32">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-6">
          <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-4">
            🚀 Built for Small & Medium Businesses
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          AI Solutions That{' '}
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Actually Work
          </span>{' '}
          for SMBs
        </h1>
        <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
          Affordable, practical AI solutions designed specifically for small and medium businesses. 
          Get started in weeks, not months, and see ROI within 90 days.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="xl" variant="default" asChild className="bg-white text-[#00BCD4] hover:bg-gray-100">
            <Link href="/contact">
              Start Free Consultation <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
            <Link href="/pricing">
              View Pricing
            </Link>
          </Button>
        </div>
        <div className="mt-8 flex items-center justify-center gap-8 text-sm text-blue-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>No Long-term Contracts</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>30-Day Money Back</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>Setup in 2 Weeks</span>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// SMB Value Propositions
const SMBValueProps = () => {
  const values = [
    {
      icon: DollarSign,
      title: "Affordable Packages",
      description: "AI transformation starting at $500/month. Flexible payment plans that fit your budget.",
      highlight: "Starting at $500/mo"
    },
    {
      icon: Clock,
      title: "Rapid Implementation",
      description: "Get up and running in 2-4 weeks. No lengthy enterprise sales cycles or complex integrations.",
      highlight: "Live in 2-4 weeks"
    },
    {
      icon: TrendingUp,
      title: "Proven ROI",
      description: "Our SMB clients see average ROI of 300% within the first year. Real results, not promises.",
      highlight: "300% average ROI"
    }
  ]

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why 500+ SMBs Choose AIC
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We understand the unique challenges facing small and medium businesses. 
            Our solutions are built specifically for your needs and budget.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 relative">
              <div className="absolute top-4 right-4 bg-[#00BCD4] text-white px-3 py-1 rounded-full text-sm font-medium">
                {value.highlight}
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-[#00BCD4] to-[#1A237E] rounded-lg flex items-center justify-center mb-6">
                <value.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
              <p className="text-gray-600">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// SMB Solutions Section
const SMBSolutions = () => {
  const solutions = [
    {
      title: "Customer Service Automation",
      description: "AI chatbots and automated support that handle 80% of customer inquiries 24/7.",
      features: ["24/7 AI Chat Support", "Email Automation", "Ticket Routing"],
      price: "From $299/mo",
      popular: false
    },
    {
      title: "Marketing Intelligence",
      description: "AI-powered marketing automation that increases leads by 150% on average.",
      features: ["Lead Scoring", "Social Media Automation", "Email Campaigns", "Analytics Dashboard"],
      price: "From $499/mo",
      popular: true
    },
    {
      title: "Operations Optimization",
      description: "Streamline your operations with AI-powered inventory, scheduling, and workflow management.",
      features: ["Inventory Prediction", "Staff Scheduling", "Process Automation", "Cost Optimization"],
      price: "From $699/mo",
      popular: false
    }
  ]

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            AI Solutions Built for SMBs
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose from our proven AI solutions or get a custom package tailored to your specific needs.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {solutions.map((solution, index) => (
            <div key={index} className={`relative rounded-2xl p-8 ${
              solution.popular 
                ? 'bg-gradient-to-br from-[#00BCD4]/5 to-[#1A237E]/5 border-2 border-[#00BCD4]' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              {solution.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-[#00BCD4] to-[#1A237E] text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{solution.title}</h3>
                <p className="text-gray-600 mb-4">{solution.description}</p>
                <div className="text-2xl font-bold text-[#00BCD4] mb-4">{solution.price}</div>
              </div>
              <ul className="space-y-3 mb-8">
                {solution.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                className={`w-full ${
                  solution.popular 
                    ? 'bg-gradient-to-r from-[#00BCD4] to-[#1A237E] hover:opacity-90' 
                    : 'bg-gray-900 hover:bg-gray-800'
                }`}
                asChild
              >
                <Link href="/contact">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Success Stories Section
const SuccessStories = () => {
  const stories = [
    {
      company: "TechStart Solutions",
      industry: "Software Development",
      result: "40% increase in lead conversion",
      quote: "AIC's AI solutions transformed our sales process. We're closing more deals with less effort.",
      avatar: "TS"
    },
    {
      company: "Green Valley Retail",
      industry: "Retail",
      result: "60% reduction in customer service costs",
      quote: "The AI chatbot handles most of our customer inquiries perfectly. Our team can focus on complex issues.",
      avatar: "GV"
    },
    {
      company: "Precision Manufacturing",
      industry: "Manufacturing",
      result: "25% improvement in operational efficiency",
      quote: "AI-powered scheduling and inventory management saved us thousands in operational costs.",
      avatar: "PM"
    }
  ]

  return (
    <section className="py-24 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Real Results from Real SMBs
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Don't just take our word for it. See how other small and medium businesses are succeeding with AI.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stories.map((story, index) => (
            <div key={index} className="bg-gray-800 rounded-xl p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-[#00BCD4] to-[#1A237E] rounded-full flex items-center justify-center text-white font-bold mr-4">
                  {story.avatar}
                </div>
                <div>
                  <h4 className="font-semibold">{story.company}</h4>
                  <p className="text-gray-400 text-sm">{story.industry}</p>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-[#00BCD4] font-semibold">{story.result}</p>
              </div>
              <blockquote className="text-gray-300 italic">
                "{story.quote}"
              </blockquote>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// CTA Section
const SMBCTASection = () => (
  <section className="py-24 bg-gradient-to-r from-[#00BCD4] to-[#1A237E] text-white">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold mb-6">
        Ready to Transform Your SMB with AI?
      </h2>
      <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
        Join hundreds of successful SMBs using AI to grow faster, serve customers better, and increase profits.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <Button size="xl" variant="default" asChild className="bg-white text-[#00BCD4] hover:bg-gray-100">
          <Link href="/contact">
            Start Free Consultation <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
          <Link href="/case-studies">
            See More Success Stories
          </Link>
        </Button>
      </div>
      <div className="text-sm text-blue-200">
        <p>✓ Free 30-minute consultation • ✓ Custom AI strategy • ✓ No obligation</p>
      </div>
    </div>
  </section>
)

// Main SMB Homepage Component
export default function SMBHomePage() {
  return (
    <>
      <SMBHeroSection />
      <SMBValueProps />
      <SMBSolutions />
      <SuccessStories />
      <SMBCTASection />
    </>
  )
}
