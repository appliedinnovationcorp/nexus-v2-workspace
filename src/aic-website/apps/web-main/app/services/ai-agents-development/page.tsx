import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Bot, Zap, Users, Settings, Brain, Shield, Clock, TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'AI Agents Development - Applied Innovation Corporation',
  description: 'Custom AI agents development for SMBs. We design intelligent agents that automate tasks, optimize processes, and boost productivity.',
}

export default function AIAgentsDevelopmentPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              AI Agents Built for Business Results
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              We design AI agents that work for your business — simplifying complex tasks, optimizing processes, and boosting productivity. Applied Innovation delivers AI that fits your systems, scales with your needs, and helps you grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
                <Link href="/contact">
                  Build Your AI Agent <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
                <Link href="#agents">
                  Explore AI Agents
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What are AI Agents */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              AI Agents: Your Digital Workforce
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              AI agents are intelligent software programs that can perceive their environment, make decisions, and take actions to achieve specific goals. Unlike traditional automation, AI agents can adapt, learn, and handle complex scenarios that require reasoning and judgment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Intelligent Decision Making</h3>
              <p className="text-gray-600">
                AI agents analyze data, understand context, and make informed decisions based on business rules and learned patterns.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Autonomous Operation</h3>
              <p className="text-gray-600">
                Once deployed, AI agents work independently, handling tasks and processes without constant human supervision.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Adaptive Learning</h3>
              <p className="text-gray-600">
                AI agents continuously learn from interactions and outcomes, improving their performance over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Types of AI Agents */}
      <section id="agents" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Types of AI Agents We Build
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Custom AI agents tailored to your specific business needs and operational requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Customer Service Agents</h3>
              <p className="text-gray-600 mb-6">
                Intelligent agents that handle customer inquiries, resolve issues, and provide personalized support across multiple channels.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  24/7 customer support automation
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Multi-language support capabilities
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Integration with CRM and ticketing systems
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Escalation to human agents when needed
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Sales & Marketing Agents</h3>
              <p className="text-gray-600 mb-6">
                AI agents that qualify leads, nurture prospects, and optimize marketing campaigns for better conversion rates.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Lead qualification and scoring
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Personalized email campaign management
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Social media engagement automation
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Sales pipeline optimization
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Process Automation Agents</h3>
              <p className="text-gray-600 mb-6">
                Intelligent agents that automate complex business processes, handle exceptions, and optimize workflows.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Document processing and data extraction
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Invoice and expense management
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Inventory and supply chain optimization
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Quality control and compliance monitoring
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Analytics & Insights Agents</h3>
              <p className="text-gray-600 mb-6">
                Data-driven agents that analyze business metrics, identify trends, and provide actionable insights for decision-making.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Real-time business intelligence
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Predictive analytics and forecasting
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Anomaly detection and alerting
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Automated reporting and dashboards
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Applications */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              AI Agents Across Industries
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              See how different industries are leveraging AI agents to transform their operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Healthcare</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Patient appointment scheduling agents</li>
                <li>• Medical record processing agents</li>
                <li>• Insurance claim automation agents</li>
                <li>• Treatment reminder agents</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">E-commerce</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Personal shopping assistant agents</li>
                <li>• Inventory management agents</li>
                <li>• Price optimization agents</li>
                <li>• Customer support agents</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Services</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Fraud detection agents</li>
                <li>• Investment advisory agents</li>
                <li>• Loan processing agents</li>
                <li>• Risk assessment agents</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Manufacturing</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Quality control agents</li>
                <li>• Predictive maintenance agents</li>
                <li>• Supply chain optimization agents</li>
                <li>• Production planning agents</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Real Estate</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Property valuation agents</li>
                <li>• Lead qualification agents</li>
                <li>• Market analysis agents</li>
                <li>• Document processing agents</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Professional Services</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Project management agents</li>
                <li>• Client communication agents</li>
                <li>• Time tracking agents</li>
                <li>• Billing and invoicing agents</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Development Process */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our AI Agent Development Process
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              A systematic approach to building AI agents that deliver real business value.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Discovery & Design</h3>
              <p className="text-gray-600">
                Understand your business processes, identify automation opportunities, and design the optimal AI agent solution.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Development & Training</h3>
              <p className="text-gray-600">
                Build and train your AI agent using your specific data, business rules, and operational requirements.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Testing & Validation</h3>
              <p className="text-gray-600">
                Thoroughly test the AI agent in controlled environments to ensure reliability and performance.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Deployment & Monitoring</h3>
              <p className="text-gray-600">
                Deploy your AI agent into production with continuous monitoring and optimization for peak performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
              Benefits of AI Agents for SMBs
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Operational Benefits</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">24/7 Operation</h4>
                      <p className="text-gray-600">AI agents work around the clock without breaks or downtime</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Consistent Performance</h4>
                      <p className="text-gray-600">Deliver consistent quality and accuracy in task execution</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Scalable Capacity</h4>
                      <p className="text-gray-600">Handle increasing workloads without proportional cost increases</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Error Reduction</h4>
                      <p className="text-gray-600">Minimize human errors in repetitive and complex tasks</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Business Benefits</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Cost Reduction</h4>
                      <p className="text-gray-600">Reduce operational costs through intelligent automation</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Improved Customer Experience</h4>
                      <p className="text-gray-600">Provide faster, more personalized customer interactions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Employee Productivity</h4>
                      <p className="text-gray-600">Free up staff to focus on high-value, strategic activities</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Competitive Advantage</h4>
                      <p className="text-gray-600">Gain advantages through intelligent automation and insights</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Deploy Your AI Agent?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Let's discuss how custom AI agents can transform your business operations and drive measurable results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">
                Start Your AI Agent Project <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
              <Link href="/services/generative-ai-development-company">
                Explore Generative AI
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
