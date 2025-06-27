import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Sparkles, MessageSquare, Image, FileText, Code, Users, Zap, Shield } from 'lucide-react'

export const metadata = {
  title: 'Generative AI Development Company - Applied Innovation Corporation',
  description: 'Leading generative AI development company for SMBs. We build custom AI agents, chatbots, and generative AI solutions that power personalized experiences and drive innovation.',
}

export default function GenerativeAIDevelopmentPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Make AI Your Competitive Advantage
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              We simplify Generative AI for SMBs — building custom AI agents that power personalized experiences, smarter products, and continuous innovation to help your business grow and stand apart.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
                <Link href="/contact">
                  Build Your AI Solution <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
                <Link href="#solutions">
                  Explore AI Solutions
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What is Generative AI */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Generative AI: The Future of Business Innovation
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Generative AI doesn't just analyze data—it creates new content, solutions, and experiences. From writing compelling marketing copy to generating product designs, generative AI is transforming how businesses operate and compete.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Creative Content Generation</h3>
              <p className="text-gray-600">
                Generate high-quality text, images, code, and multimedia content tailored to your brand and audience.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Intelligent Conversations</h3>
              <p className="text-gray-600">
                Create AI-powered chatbots and virtual assistants that understand context and provide human-like interactions.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Process Automation</h3>
              <p className="text-gray-600">
                Automate complex workflows and decision-making processes with AI that learns and adapts to your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Generative AI Solutions */}
      <section id="solutions" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our Generative AI Solutions
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Custom generative AI solutions designed to solve real business challenges and create competitive advantages.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Chatbots & Virtual Assistants</h3>
              <p className="text-gray-600 mb-6">
                Deploy intelligent conversational AI that understands your customers, provides accurate information, and handles complex inquiries 24/7.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Customer support automation
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Lead qualification and sales assistance
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Internal knowledge management
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Multi-channel deployment (web, mobile, social)
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Content Generation Systems</h3>
              <p className="text-gray-600 mb-6">
                Automate content creation with AI that understands your brand voice and generates high-quality marketing materials, documentation, and communications.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Marketing copy and social media content
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Product descriptions and documentation
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Email campaigns and newsletters
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Reports and business communications
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Code className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Custom AI Agents</h3>
              <p className="text-gray-600 mb-6">
                Build specialized AI agents that perform specific business tasks, make decisions, and integrate seamlessly with your existing workflows.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Data analysis and reporting agents
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Process automation and workflow management
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Quality control and compliance monitoring
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Personalized recommendation engines
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Image className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Visual AI Solutions</h3>
              <p className="text-gray-600 mb-6">
                Leverage AI for image generation, analysis, and processing to enhance your visual content and automate visual tasks.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Product image generation and enhancement
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Visual content analysis and tagging
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Brand-consistent visual asset creation
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Document processing and OCR
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Real-World Applications
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              See how SMBs are using generative AI to transform their operations and gain competitive advantages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">E-commerce</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Personalized product recommendations</li>
                <li>• Automated product descriptions</li>
                <li>• Customer service chatbots</li>
                <li>• Dynamic pricing optimization</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Professional Services</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Automated report generation</li>
                <li>• Client communication templates</li>
                <li>• Proposal and contract drafting</li>
                <li>• Knowledge base management</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Healthcare</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Patient communication automation</li>
                <li>• Medical documentation assistance</li>
                <li>• Appointment scheduling optimization</li>
                <li>• Treatment plan recommendations</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Manufacturing</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Quality control automation</li>
                <li>• Predictive maintenance alerts</li>
                <li>• Supply chain optimization</li>
                <li>• Safety compliance monitoring</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Real Estate</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Property description generation</li>
                <li>• Lead qualification chatbots</li>
                <li>• Market analysis reports</li>
                <li>• Virtual property assistants</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#1A237E]/5 to-[#00BCD4]/5 rounded-xl p-8 border border-[#00BCD4]/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Services</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Automated financial reporting</li>
                <li>• Risk assessment tools</li>
                <li>• Client advisory chatbots</li>
                <li>• Compliance documentation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
              Why Choose Us for Generative AI Development
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">SMB-Focused Expertise</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Practical Implementation</h4>
                      <p className="text-gray-600">We focus on AI solutions that deliver immediate business value</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Cost-Effective Solutions</h4>
                      <p className="text-gray-600">Maximize ROI with solutions designed for SMB budgets</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Rapid Deployment</h4>
                      <p className="text-gray-600">Get your AI solutions live in weeks, not months</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Easy Integration</h4>
                      <p className="text-gray-600">Seamlessly integrate with your existing systems</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Cutting-Edge Technology</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Latest AI Models</h4>
                      <p className="text-gray-600">Leverage GPT-4, Claude, and other state-of-the-art models</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Custom Training</h4>
                      <p className="text-gray-600">Fine-tune AI models on your specific data and use cases</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Security & Privacy</h4>
                      <p className="text-gray-600">Enterprise-grade security with data privacy protection</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Continuous Learning</h4>
                      <p className="text-gray-600">AI systems that improve and adapt over time</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Development Process */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our Generative AI Development Process
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              A proven methodology for delivering successful generative AI solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Use Case Definition</h3>
              <p className="text-gray-600">
                Identify specific business challenges and opportunities where generative AI can create value.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Preparation</h3>
              <p className="text-gray-600">
                Prepare and optimize your data for training and fine-tuning generative AI models.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Model Development</h3>
              <p className="text-gray-600">
                Build and train custom AI models tailored to your specific requirements and brand voice.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Integration & Deployment</h3>
              <p className="text-gray-600">
                Deploy your AI solution with seamless integration into your existing workflows and systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Harness the Power of Generative AI?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Let's discuss how generative AI can transform your business operations and create new opportunities for growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">
                Start Your AI Project <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
              <Link href="/services/ai-agents-development">
                Explore AI Agents
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
