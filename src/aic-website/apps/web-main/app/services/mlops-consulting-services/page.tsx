import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Settings, Monitor, Shield, Zap, TrendingUp, Users, Clock, Database } from 'lucide-react'

export const metadata = {
  title: 'MLOps Consulting Services - Applied Innovation Corporation',
  description: 'Expert MLOps consulting for SMBs. We build reliable, production-grade AI systems with continuous monitoring, deployment, and optimization.',
}

export default function MLOpsConsultingServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              AI That Performs — At Scale
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Applied Innovation supports SMBs in building reliable, production-grade AI systems. Our MLOps team oversees development, deployment, and real-time monitoring — ensuring your AI operates efficiently, adapts to change, and delivers sustained business value.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
                <Link href="/contact">
                  Scale Your AI Systems <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
                <Link href="#services">
                  Explore MLOps Services
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What is MLOps */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              MLOps: The Foundation of Reliable AI
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              MLOps (Machine Learning Operations) is the practice of deploying, monitoring, and maintaining AI systems in production. It ensures your AI solutions remain accurate, efficient, and valuable as your business grows and data changes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Monitor className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Continuous Monitoring</h3>
              <p className="text-gray-600">
                Real-time monitoring of AI performance, data quality, and system health to prevent issues before they impact your business.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Automated Deployment</h3>
              <p className="text-gray-600">
                Streamlined deployment pipelines that ensure consistent, reliable updates to your AI systems without downtime.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quality Assurance</h3>
              <p className="text-gray-600">
                Comprehensive testing and validation processes that maintain AI accuracy and reliability in production environments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our MLOps Services */}
      <section id="services" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our MLOps Services
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Comprehensive MLOps solutions designed to keep your AI systems running smoothly and delivering consistent value.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI System Architecture & Setup</h3>
              <p className="text-gray-600 mb-6">
                Design and implement robust MLOps infrastructure that scales with your business and ensures reliable AI operations.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Cloud infrastructure setup and optimization
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  CI/CD pipeline implementation for AI models
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Container orchestration and deployment automation
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Security and compliance framework setup
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Monitoring & Observability</h3>
              <p className="text-gray-600 mb-6">
                Comprehensive monitoring solutions that provide real-time insights into AI performance, data quality, and system health.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Model performance tracking and alerting
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Data drift detection and quality monitoring
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  System resource utilization monitoring
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Custom dashboards and reporting
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <Database className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Data Pipeline Management</h3>
              <p className="text-gray-600 mb-6">
                Robust data pipelines that ensure your AI systems have access to clean, reliable, and up-to-date information.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Automated data ingestion and processing
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Data validation and quality assurance
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Feature store implementation and management
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Data versioning and lineage tracking
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Model Lifecycle Management</h3>
              <p className="text-gray-600 mb-6">
                End-to-end model management from development to retirement, ensuring optimal performance throughout the AI lifecycle.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Model versioning and experiment tracking
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  A/B testing and gradual rollout strategies
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Automated retraining and model updates
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-[#00BCD4] mr-3 flex-shrink-0" />
                  Model governance and compliance tracking
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* MLOps Process */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our MLOps Implementation Process
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              A systematic approach to implementing MLOps that ensures your AI systems are production-ready and maintainable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Assessment</h3>
              <p className="text-gray-600">
                Evaluate your current AI systems, infrastructure, and operational processes to identify MLOps opportunities.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Design</h3>
              <p className="text-gray-600">
                Create a comprehensive MLOps architecture tailored to your business needs and technical requirements.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Implementation</h3>
              <p className="text-gray-600">
                Deploy MLOps infrastructure, tools, and processes with minimal disruption to existing operations.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Optimization</h3>
              <p className="text-gray-600">
                Continuously monitor, optimize, and improve your MLOps processes for maximum efficiency and reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
              Benefits of Professional MLOps
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Operational Benefits</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Reduced Downtime</h4>
                      <p className="text-gray-600">Minimize AI system failures and service interruptions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Faster Deployment</h4>
                      <p className="text-gray-600">Deploy AI updates and new models quickly and safely</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Improved Reliability</h4>
                      <p className="text-gray-600">Consistent AI performance across different conditions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Cost Optimization</h4>
                      <p className="text-gray-600">Optimize resource usage and reduce operational costs</p>
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
                      <h4 className="font-semibold text-gray-900">Sustained ROI</h4>
                      <p className="text-gray-600">Maintain AI value delivery over time</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Scalable Growth</h4>
                      <p className="text-gray-600">Scale AI systems as your business grows</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Risk Mitigation</h4>
                      <p className="text-gray-600">Reduce risks associated with AI system failures</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-[#00BCD4] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Competitive Advantage</h4>
                      <p className="text-gray-600">Maintain AI-driven advantages over competitors</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our MLOps Technology Stack
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Industry-leading tools and platforms for robust MLOps implementation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Orchestration & Deployment</h3>
              <div className="text-gray-600 space-y-2">
                <p>Kubernetes & Docker</p>
                <p>MLflow & Kubeflow</p>
                <p>Apache Airflow</p>
                <p>Jenkins & GitLab CI</p>
              </div>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Monitor className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Monitoring & Observability</h3>
              <div className="text-gray-600 space-y-2">
                <p>Prometheus & Grafana</p>
                <p>ELK Stack (Elasticsearch)</p>
                <p>DataDog & New Relic</p>
                <p>Custom Monitoring Solutions</p>
              </div>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Cloud & Infrastructure</h3>
              <div className="text-gray-600 space-y-2">
                <p>AWS, Azure & Google Cloud</p>
                <p>Terraform & CloudFormation</p>
                <p>Vault & Security Tools</p>
                <p>Load Balancers & CDNs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Scale Your AI Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Let our MLOps experts help you build reliable, scalable AI systems that deliver consistent business value.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">
                Get MLOps Assessment <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="border-white text-white hover:bg-white/10">
              <Link href="/services/ai-development-services">
                Explore Development Services
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
