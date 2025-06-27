import { Metadata } from 'next'
import { Hero } from '@/components/ui/hero'
import { ServiceFeatures } from '@/components/services/service-features'
import { ProcessSteps } from '@/components/services/process-steps'
import { TechStack } from '@/components/services/tech-stack'
import { CaseStudies } from '@/components/services/case-studies'
import { FAQ } from '@/components/ui/faq'
import { CTA } from '@/components/ui/cta'

export const metadata: Metadata = {
  title: 'Generative AI Development Services | Custom AI Solutions | AIC',
  description: 'Expert generative AI development services. Build custom AI models, applications, and solutions with cutting-edge machine learning technologies. Transform your business with AI.',
  keywords: 'generative AI development, custom AI models, machine learning, AI applications, neural networks, deep learning, AI solutions',
}

const features = [
  {
    title: 'Custom AI Model Development',
    description: 'Build tailored generative AI models for your specific use cases and requirements.',
    icon: '🧠',
    benefits: [
      'Domain-specific model training',
      'Custom architecture design',
      'Performance optimization',
      'Scalable deployment'
    ]
  },
  {
    title: 'Multi-Modal AI Systems',
    description: 'Develop AI systems that work with text, images, audio, and video content.',
    icon: '🎭',
    benefits: [
      'Text-to-image generation',
      'Audio synthesis',
      'Video processing',
      'Cross-modal understanding'
    ]
  },
  {
    title: 'AI Application Development',
    description: 'Create end-to-end AI-powered applications with intuitive user interfaces.',
    icon: '📱',
    benefits: [
      'Full-stack AI apps',
      'Real-time processing',
      'User-friendly interfaces',
      'API integrations'
    ]
  },
  {
    title: 'Model Fine-Tuning',
    description: 'Optimize pre-trained models for your specific data and use cases.',
    icon: '⚙️',
    benefits: [
      'Transfer learning',
      'Domain adaptation',
      'Performance enhancement',
      'Reduced training time'
    ]
  },
  {
    title: 'AI Infrastructure Setup',
    description: 'Build robust, scalable infrastructure for AI model training and deployment.',
    icon: '🏗️',
    benefits: [
      'Cloud-native architecture',
      'Auto-scaling systems',
      'Cost optimization',
      'High availability'
    ]
  },
  {
    title: 'MLOps Implementation',
    description: 'Implement comprehensive MLOps pipelines for continuous AI development.',
    icon: '🔄',
    benefits: [
      'Automated training',
      'Model versioning',
      'Continuous deployment',
      'Performance monitoring'
    ]
  }
]

const processSteps = [
  {
    step: 1,
    title: 'Requirements Analysis',
    description: 'Deep dive into your business needs, data landscape, and AI objectives.',
    details: [
      'Business case evaluation',
      'Data assessment',
      'Technical feasibility study',
      'Success metrics definition'
    ]
  },
  {
    step: 2,
    title: 'AI Strategy & Architecture',
    description: 'Design comprehensive AI strategy and technical architecture.',
    details: [
      'Model selection and design',
      'Infrastructure planning',
      'Integration strategy',
      'Scalability considerations'
    ]
  },
  {
    step: 3,
    title: 'Data Preparation',
    description: 'Collect, clean, and prepare high-quality training datasets.',
    details: [
      'Data collection and curation',
      'Quality assessment',
      'Preprocessing pipelines',
      'Augmentation strategies'
    ]
  },
  {
    step: 4,
    title: 'Model Development',
    description: 'Build and train custom AI models using cutting-edge techniques.',
    details: [
      'Model architecture implementation',
      'Training and validation',
      'Hyperparameter optimization',
      'Performance evaluation'
    ]
  },
  {
    step: 5,
    title: 'Integration & Deployment',
    description: 'Deploy AI models into production with robust integration.',
    details: [
      'API development',
      'System integration',
      'Performance optimization',
      'Security implementation'
    ]
  },
  {
    step: 6,
    title: 'Monitoring & Optimization',
    description: 'Continuous monitoring and improvement of AI systems.',
    details: [
      'Performance tracking',
      'Model drift detection',
      'Continuous improvement',
      'User feedback integration'
    ]
  }
]

const techStack = {
  'AI Frameworks': [
    'TensorFlow',
    'PyTorch',
    'Hugging Face',
    'OpenAI API',
    'Anthropic Claude',
    'Google Vertex AI'
  ],
  'Development Tools': [
    'Python',
    'Jupyter Notebooks',
    'MLflow',
    'Weights & Biases',
    'DVC',
    'Git LFS'
  ],
  'Cloud Platforms': [
    'AWS SageMaker',
    'Google Cloud AI',
    'Azure ML',
    'Databricks',
    'Paperspace',
    'Lambda Labs'
  ],
  'Infrastructure': [
    'Kubernetes',
    'Docker',
    'NVIDIA GPUs',
    'Ray',
    'Apache Spark',
    'Redis'
  ]
}

const caseStudies = [
  {
    title: 'AI-Powered Content Generation Platform',
    client: 'Media Company',
    challenge: 'Needed to automate content creation while maintaining quality and brand consistency.',
    solution: 'Developed custom GPT-based models fine-tuned on brand content with quality control systems.',
    results: [
      '300% increase in content production',
      '85% reduction in content creation time',
      '95% brand consistency score',
      '$2M annual cost savings'
    ],
    technologies: ['GPT-4', 'Fine-tuning', 'Content Moderation', 'API Integration']
  },
  {
    title: 'Intelligent Document Processing System',
    client: 'Financial Services',
    challenge: 'Manual document processing was slow and error-prone for complex financial documents.',
    solution: 'Built multi-modal AI system combining OCR, NLP, and computer vision for automated processing.',
    results: [
      '90% reduction in processing time',
      '99.5% accuracy in data extraction',
      '70% cost reduction',
      'Real-time processing capability'
    ],
    technologies: ['Computer Vision', 'NLP', 'OCR', 'Document AI']
  },
  {
    title: 'Personalized AI Assistant',
    client: 'E-commerce Platform',
    challenge: 'Needed intelligent customer service that could handle complex queries and provide personalized recommendations.',
    solution: 'Developed conversational AI with product knowledge integration and personalization engine.',
    results: [
      '60% reduction in support tickets',
      '40% increase in customer satisfaction',
      '25% boost in sales conversion',
      '24/7 availability'
    ],
    technologies: ['Conversational AI', 'Recommendation Systems', 'Knowledge Graphs', 'Real-time Processing']
  }
]

const faqs = [
  {
    question: 'What types of generative AI models can you develop?',
    answer: 'We develop various types of generative AI models including large language models (LLMs), image generation models, audio synthesis models, code generation systems, and multi-modal AI systems. Our expertise covers both training from scratch and fine-tuning existing models for specific use cases.'
  },
  {
    question: 'How long does it take to develop a custom AI model?',
    answer: 'Development timelines vary based on complexity and requirements. Simple fine-tuning projects may take 2-4 weeks, while custom model development from scratch can take 3-6 months. We provide detailed timelines during the planning phase based on your specific needs.'
  },
  {
    question: 'Do you work with existing AI models or only build from scratch?',
    answer: 'We work with both approaches. Often, fine-tuning existing pre-trained models like GPT, BERT, or Stable Diffusion is more cost-effective and faster. However, for highly specialized use cases, we can develop custom models from the ground up.'
  },
  {
    question: 'What kind of data do you need for AI model development?',
    answer: 'Data requirements depend on the specific use case. Generally, we need high-quality, relevant datasets that represent your target domain. We can help with data collection, cleaning, and augmentation. For fine-tuning, smaller datasets (thousands of examples) may suffice, while training from scratch requires larger datasets.'
  },
  {
    question: 'How do you ensure AI model performance and reliability?',
    answer: 'We implement comprehensive testing and validation processes including cross-validation, A/B testing, performance benchmarking, and continuous monitoring. We also implement safeguards, bias detection, and quality control measures to ensure reliable and ethical AI systems.'
  },
  {
    question: 'Can you integrate AI models with existing systems?',
    answer: 'Yes, we specialize in seamless integration with existing systems through APIs, SDKs, and custom connectors. We ensure minimal disruption to your current workflows while maximizing the benefits of AI integration.'
  },
  {
    question: 'What ongoing support do you provide after deployment?',
    answer: 'We provide comprehensive post-deployment support including performance monitoring, model updates, bug fixes, scaling assistance, and continuous optimization. We also offer training for your team and documentation for long-term maintenance.'
  },
  {
    question: 'How do you handle data privacy and security?',
    answer: 'Data privacy and security are paramount in our development process. We implement encryption, secure data handling practices, compliance with regulations (GDPR, HIPAA, etc.), and can work with on-premises or private cloud deployments as needed.'
  }
]

export default function GenAIDevelopmentPage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero
        title="Generative AI Development Services"
        subtitle="Transform Your Business with Custom AI Solutions"
        description="Build cutting-edge generative AI applications, models, and systems that drive innovation and competitive advantage. From concept to deployment, we deliver AI solutions that scale."
        primaryCTA={{
          text: "Start Your AI Project",
          href: "/contact"
        }}
        secondaryCTA={{
          text: "View AI Portfolio",
          href: "/portfolio"
        }}
        backgroundImage="/images/ai-development-hero.jpg"
      />

      <ServiceFeatures
        title="Comprehensive AI Development Services"
        subtitle="End-to-End Generative AI Solutions"
        features={features}
      />

      <ProcessSteps
        title="Our AI Development Process"
        subtitle="Systematic Approach to AI Excellence"
        steps={processSteps}
      />

      <TechStack
        title="Advanced AI Technology Stack"
        subtitle="Cutting-Edge Tools and Frameworks"
        categories={techStack}
      />

      <CaseStudies
        title="AI Development Success Stories"
        subtitle="Real Results from Real Projects"
        caseStudies={caseStudies}
      />

      <FAQ
        title="Frequently Asked Questions"
        subtitle="Everything You Need to Know About AI Development"
        faqs={faqs}
      />

      <CTA
        title="Ready to Build Your AI Solution?"
        description="Let's discuss your AI development needs and create a custom solution that transforms your business."
        primaryCTA={{
          text: "Get Started Today",
          href: "/contact"
        }}
        secondaryCTA={{
          text: "Schedule Consultation",
          href: "/consultation"
        }}
      />
    </div>
  )
}
