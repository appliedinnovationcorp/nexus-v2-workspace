import { Metadata } from 'next'
import { Hero } from '@/components/ui/hero'
import { ServiceFeatures } from '@/components/services/service-features'
import { ProcessSteps } from '@/components/services/process-steps'
import { TechStack } from '@/components/services/tech-stack'
import { CaseStudies } from '@/components/services/case-studies'
import { FAQ } from '@/components/ui/faq'
import { CTA } from '@/components/ui/cta'

export const metadata: Metadata = {
  title: 'Generative AI Integration Services | Seamless AI Implementation | AIC',
  description: 'Expert generative AI integration services. Seamlessly integrate AI models, APIs, and solutions into your existing systems. Transform your business with AI integration.',
  keywords: 'AI integration, generative AI implementation, API integration, system integration, AI deployment, enterprise AI integration, AI workflow automation',
}

const features = [
  {
    title: 'API Integration',
    description: 'Seamlessly integrate AI APIs like OpenAI, Anthropic, and Google AI into your applications.',
    icon: '🔌',
    benefits: [
      'RESTful API integration',
      'Real-time processing',
      'Error handling',
      'Rate limit management'
    ]
  },
  {
    title: 'Enterprise System Integration',
    description: 'Connect AI capabilities with your existing enterprise systems and databases.',
    icon: '🏢',
    benefits: [
      'CRM integration',
      'ERP connectivity',
      'Database synchronization',
      'Legacy system support'
    ]
  },
  {
    title: 'Workflow Automation',
    description: 'Automate complex business processes using generative AI capabilities.',
    icon: '⚡',
    benefits: [
      'Process automation',
      'Decision workflows',
      'Task orchestration',
      'Event-driven processing'
    ]
  },
  {
    title: 'Custom AI Pipelines',
    description: 'Build end-to-end AI processing pipelines for your specific use cases.',
    icon: '🔄',
    benefits: [
      'Data preprocessing',
      'Model chaining',
      'Output processing',
      'Quality assurance'
    ]
  },
  {
    title: 'Real-Time Integration',
    description: 'Implement real-time AI processing for immediate responses and actions.',
    icon: '⚡',
    benefits: [
      'Low-latency processing',
      'Streaming data support',
      'Real-time analytics',
      'Instant notifications'
    ]
  },
  {
    title: 'Security & Compliance',
    description: 'Ensure secure AI integration with proper authentication and compliance measures.',
    icon: '🔒',
    benefits: [
      'Data encryption',
      'Access control',
      'Audit logging',
      'Compliance frameworks'
    ]
  }
]

const processSteps = [
  {
    step: 1,
    title: 'System Assessment',
    description: 'Analyze your existing systems, infrastructure, and integration requirements.',
    details: [
      'Current system audit',
      'Integration point identification',
      'Performance requirements',
      'Security assessment'
    ]
  },
  {
    step: 2,
    title: 'Integration Strategy',
    description: 'Design comprehensive integration strategy and architecture.',
    details: [
      'Architecture design',
      'API selection',
      'Data flow mapping',
      'Security planning'
    ]
  },
  {
    step: 3,
    title: 'Development & Testing',
    description: 'Develop integration components with thorough testing and validation.',
    details: [
      'API development',
      'Integration coding',
      'Unit testing',
      'Integration testing'
    ]
  },
  {
    step: 4,
    title: 'Deployment & Configuration',
    description: 'Deploy integration solutions with proper configuration and monitoring.',
    details: [
      'Production deployment',
      'Configuration management',
      'Performance tuning',
      'Monitoring setup'
    ]
  },
  {
    step: 5,
    title: 'Training & Documentation',
    description: 'Provide comprehensive training and documentation for your team.',
    details: [
      'User training',
      'Technical documentation',
      'Best practices guide',
      'Troubleshooting manual'
    ]
  },
  {
    step: 6,
    title: 'Ongoing Support',
    description: 'Continuous monitoring, maintenance, and optimization of integrations.',
    details: [
      'Performance monitoring',
      'Issue resolution',
      'Updates and patches',
      'Optimization recommendations'
    ]
  }
]

const techStack = {
  'Integration Platforms': [
    'Zapier',
    'Microsoft Power Automate',
    'Apache Kafka',
    'MuleSoft',
    'Dell Boomi',
    'Workato'
  ],
  'API Technologies': [
    'REST APIs',
    'GraphQL',
    'WebSockets',
    'gRPC',
    'OpenAPI',
    'Webhooks'
  ],
  'Development Tools': [
    'Node.js',
    'Python',
    'Java',
    'C#',
    'Go',
    'TypeScript'
  ],
  'Cloud Services': [
    'AWS Lambda',
    'Azure Functions',
    'Google Cloud Functions',
    'Serverless Framework',
    'Docker',
    'Kubernetes'
  ]
}

const caseStudies = [
  {
    title: 'E-commerce AI Integration',
    client: 'Online Retailer',
    challenge: 'Needed to integrate AI-powered product recommendations and customer service across multiple platforms.',
    solution: 'Integrated OpenAI GPT models with existing e-commerce platform, CRM, and customer service systems.',
    results: [
      '35% increase in conversion rates',
      '50% reduction in customer service response time',
      '90% automation of product descriptions',
      'Seamless omnichannel experience'
    ],
    technologies: ['OpenAI API', 'Shopify Integration', 'CRM Connector', 'Real-time Processing']
  },
  {
    title: 'Healthcare System AI Integration',
    client: 'Hospital Network',
    challenge: 'Required integration of AI diagnostic tools with existing electronic health record systems.',
    solution: 'Built secure integration layer connecting AI models with EHR systems while maintaining HIPAA compliance.',
    results: [
      '40% faster diagnosis processing',
      '95% accuracy in data extraction',
      'HIPAA compliant implementation',
      'Integration with 3 major EHR systems'
    ],
    technologies: ['FHIR API', 'HL7 Integration', 'Medical AI Models', 'Security Framework']
  },
  {
    title: 'Financial Services AI Automation',
    client: 'Investment Firm',
    challenge: 'Needed to automate document processing and compliance checking across multiple systems.',
    solution: 'Integrated AI document processing with trading systems, compliance databases, and reporting tools.',
    results: [
      '80% reduction in manual processing',
      '99% accuracy in compliance checking',
      'Real-time risk assessment',
      '$2M annual operational savings'
    ],
    technologies: ['Document AI', 'Trading System APIs', 'Compliance Integration', 'Risk Management']
  }
]

const faqs = [
  {
    question: 'What types of systems can you integrate with AI?',
    answer: 'We can integrate AI with virtually any system that has an API or database connection, including CRM systems, ERP platforms, e-commerce sites, mobile apps, web applications, databases, cloud services, and legacy systems. Our integration approach is flexible and adaptable to your existing infrastructure.'
  },
  {
    question: 'How long does AI integration typically take?',
    answer: 'Integration timelines vary based on complexity and scope. Simple API integrations can be completed in 1-2 weeks, while complex enterprise integrations may take 2-6 months. We provide detailed project timelines during the planning phase based on your specific requirements.'
  },
  {
    question: 'Do you work with existing AI models or only new ones?',
    answer: 'We work with both existing AI models (like OpenAI GPT, Google AI, Anthropic Claude) and custom models. Our integration services can connect any AI model or service to your systems, whether it\'s a third-party API or a custom model you\'ve developed.'
  },
  {
    question: 'How do you ensure data security during integration?',
    answer: 'We implement comprehensive security measures including data encryption in transit and at rest, secure authentication protocols, access controls, audit logging, and compliance with relevant regulations (GDPR, HIPAA, SOC 2). Security is built into every aspect of our integration process.'
  },
  {
    question: 'Can you integrate AI with legacy systems?',
    answer: 'Yes, we specialize in integrating modern AI capabilities with legacy systems. We use various approaches including API wrappers, database connectors, file-based integration, and middleware solutions to bridge the gap between old and new technologies.'
  },
  {
    question: 'What happens if the AI service goes down or changes?',
    answer: 'We build resilient integrations with fallback mechanisms, error handling, retry logic, and alternative service options. We also provide monitoring and alerting systems to quickly identify and resolve any issues. Our integrations are designed to be robust and maintainable.'
  },
  {
    question: 'How do you handle API rate limits and costs?',
    answer: 'We implement intelligent rate limiting, request queuing, caching strategies, and cost optimization techniques. We monitor usage patterns and provide recommendations for cost-effective AI service usage while maintaining performance requirements.'
  },
  {
    question: 'Do you provide ongoing support after integration?',
    answer: 'Yes, we provide comprehensive ongoing support including monitoring, maintenance, updates, troubleshooting, and optimization. We also offer training for your team and can provide different levels of support based on your needs and budget.'
  }
]

export default function GenAIIntegrationPage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero
        title="Generative AI Integration Services"
        subtitle="Seamlessly Connect AI to Your Business"
        description="Transform your existing systems with powerful AI capabilities. We integrate cutting-edge generative AI into your workflows, applications, and processes for maximum impact."
        primaryCTA={{
          text: "Start Integration Project",
          href: "/contact"
        }}
        secondaryCTA={{
          text: "View Integration Options",
          href: "#features"
        }}
        backgroundImage="/images/ai-integration-hero.jpg"
      />

      <ServiceFeatures
        title="Comprehensive AI Integration Services"
        subtitle="Connect AI to Every Part of Your Business"
        features={features}
      />

      <ProcessSteps
        title="AI Integration Process"
        subtitle="Systematic Approach to Seamless Integration"
        steps={processSteps}
      />

      <TechStack
        title="Integration Technology Stack"
        subtitle="Robust Tools for Reliable AI Integration"
        categories={techStack}
      />

      <CaseStudies
        title="AI Integration Success Stories"
        subtitle="Real-World Integration Implementations"
        caseStudies={caseStudies}
      />

      <FAQ
        title="AI Integration FAQ"
        subtitle="Common Questions About AI Integration"
        faqs={faqs}
      />

      <CTA
        title="Ready to Integrate AI Into Your Systems?"
        description="Let's connect your existing infrastructure with powerful AI capabilities to unlock new possibilities and efficiencies."
        primaryCTA={{
          text: "Get Started Today",
          href: "/contact"
        }}
        secondaryCTA={{
          text: "Schedule Assessment",
          href: "/consultation"
        }}
      />
    </div>
  )
}
