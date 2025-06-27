import { Metadata } from 'next'
import { Hero } from '@/components/ui/hero'
import { ServiceFeatures } from '@/components/services/service-features'
import { ProcessSteps } from '@/components/services/process-steps'
import { TechStack } from '@/components/services/tech-stack'
import { CaseStudies } from '@/components/services/case-studies'
import { FAQ } from '@/components/ui/faq'
import { CTA } from '@/components/ui/cta'

export const metadata: Metadata = {
  title: 'Large Language Model Development | Custom LLM Solutions | AIC',
  description: 'Expert LLM development services. Build custom large language models, fine-tune existing models, and create domain-specific AI language solutions for your business needs.',
  keywords: 'LLM development, large language models, custom language models, model fine-tuning, transformer models, NLP development, AI language solutions',
}

const features = [
  {
    title: 'Custom LLM Development',
    description: 'Build domain-specific large language models tailored to your industry and use cases.',
    icon: '🧠',
    benefits: [
      'Domain-specific training',
      'Custom architecture design',
      'Optimized performance',
      'Proprietary model ownership'
    ]
  },
  {
    title: 'Model Fine-Tuning',
    description: 'Fine-tune existing LLMs like GPT, BERT, or T5 for your specific requirements.',
    icon: '⚙️',
    benefits: [
      'Faster development',
      'Cost-effective approach',
      'Improved accuracy',
      'Task-specific optimization'
    ]
  },
  {
    title: 'Multi-Modal LLMs',
    description: 'Develop language models that understand and generate text, images, and other modalities.',
    icon: '🎭',
    benefits: [
      'Text-to-image generation',
      'Visual question answering',
      'Multi-modal understanding',
      'Cross-modal reasoning'
    ]
  },
  {
    title: 'Instruction-Tuned Models',
    description: 'Create models that follow complex instructions and perform diverse tasks.',
    icon: '📋',
    benefits: [
      'Task generalization',
      'Instruction following',
      'Few-shot learning',
      'Versatile applications'
    ]
  },
  {
    title: 'Retrieval-Augmented Generation',
    description: 'Enhance LLMs with external knowledge bases for accurate, up-to-date responses.',
    icon: '🔍',
    benefits: [
      'Knowledge integration',
      'Factual accuracy',
      'Real-time information',
      'Reduced hallucinations'
    ]
  },
  {
    title: 'Model Optimization',
    description: 'Optimize LLMs for deployment with techniques like quantization and distillation.',
    icon: '🚀',
    benefits: [
      'Reduced model size',
      'Faster inference',
      'Lower costs',
      'Edge deployment'
    ]
  }
]

const processSteps = [
  {
    step: 1,
    title: 'Requirements & Data Analysis',
    description: 'Analyze your specific needs and evaluate available data for model development.',
    details: [
      'Use case definition',
      'Data quality assessment',
      'Performance requirements',
      'Deployment constraints'
    ]
  },
  {
    step: 2,
    title: 'Model Architecture Design',
    description: 'Design optimal model architecture based on your requirements and constraints.',
    details: [
      'Architecture selection',
      'Parameter sizing',
      'Training strategy',
      'Evaluation metrics'
    ]
  },
  {
    step: 3,
    title: 'Data Preparation',
    description: 'Prepare high-quality training datasets with proper preprocessing and augmentation.',
    details: [
      'Data collection and curation',
      'Preprocessing pipelines',
      'Quality filtering',
      'Data augmentation'
    ]
  },
  {
    step: 4,
    title: 'Model Training',
    description: 'Train or fine-tune language models using advanced techniques and infrastructure.',
    details: [
      'Distributed training',
      'Hyperparameter optimization',
      'Regularization techniques',
      'Convergence monitoring'
    ]
  },
  {
    step: 5,
    title: 'Evaluation & Testing',
    description: 'Comprehensive evaluation using multiple metrics and real-world testing.',
    details: [
      'Benchmark evaluation',
      'Human evaluation',
      'Bias testing',
      'Safety assessment'
    ]
  },
  {
    step: 6,
    title: 'Deployment & Monitoring',
    description: 'Deploy models to production with continuous monitoring and improvement.',
    details: [
      'Production deployment',
      'Performance monitoring',
      'A/B testing',
      'Continuous improvement'
    ]
  }
]

const techStack = {
  'LLM Frameworks': [
    'Transformers',
    'DeepSpeed',
    'FairScale',
    'Megatron-LM',
    'PaLM',
    'LLaMA'
  ],
  'Training Infrastructure': [
    'PyTorch',
    'TensorFlow',
    'JAX/Flax',
    'NVIDIA NeMo',
    'Ray Train',
    'Horovod'
  ],
  'Optimization Tools': [
    'ONNX',
    'TensorRT',
    'Quantization',
    'Pruning',
    'Knowledge Distillation',
    'LoRA/QLoRA'
  ],
  'Cloud Platforms': [
    'AWS SageMaker',
    'Google Cloud TPU',
    'Azure ML',
    'Lambda Labs',
    'RunPod',
    'Paperspace'
  ]
}

const caseStudies = [
  {
    title: 'Legal Document Analysis LLM',
    client: 'Law Firm',
    challenge: 'Needed specialized language model for legal document analysis and contract review.',
    solution: 'Fine-tuned LLaMA model on legal corpus with custom training for contract analysis and legal reasoning.',
    results: [
      '85% accuracy in contract analysis',
      '70% reduction in review time',
      '95% compliance detection rate',
      '$500K annual cost savings'
    ],
    technologies: ['LLaMA Fine-tuning', 'Legal NLP', 'Document Processing', 'Compliance Checking']
  },
  {
    title: 'Medical Diagnosis Assistant LLM',
    client: 'Healthcare System',
    challenge: 'Required AI assistant for medical diagnosis support with high accuracy and safety.',
    solution: 'Developed custom medical LLM with retrieval-augmented generation using medical knowledge bases.',
    results: [
      '92% diagnostic accuracy',
      '50% faster diagnosis process',
      'Integration with 5 hospitals',
      'FDA compliance achieved'
    ],
    technologies: ['Medical NLP', 'RAG Architecture', 'Knowledge Graphs', 'Safety Alignment']
  },
  {
    title: 'Financial Analysis LLM',
    client: 'Investment Bank',
    challenge: 'Needed specialized model for financial report analysis and market sentiment understanding.',
    solution: 'Built domain-specific LLM trained on financial data with real-time market integration.',
    results: [
      '88% accuracy in sentiment analysis',
      '60% improvement in report processing',
      'Real-time market insights',
      '40% increase in analyst productivity'
    ],
    technologies: ['Financial NLP', 'Sentiment Analysis', 'Time Series Integration', 'Risk Assessment']
  }
]

const faqs = [
  {
    question: 'What is the difference between building a custom LLM and fine-tuning?',
    answer: 'Building a custom LLM involves training a model from scratch on your data, giving you complete control but requiring significant resources. Fine-tuning adapts an existing pre-trained model to your specific use case, which is faster and more cost-effective while still achieving excellent results for most applications.'
  },
  {
    question: 'How much data do I need to develop a custom LLM?',
    answer: 'Data requirements vary significantly based on the approach. For fine-tuning, you might need thousands to millions of examples depending on the task. For training from scratch, you typically need billions of tokens. We can help assess your data needs and suggest data augmentation strategies if needed.'
  },
  {
    question: 'What are the costs involved in LLM development?',
    answer: 'Costs depend on model size, training approach, and infrastructure needs. Fine-tuning projects typically range from $10K-$100K, while custom LLM development can range from $100K-$1M+. We provide detailed cost estimates based on your specific requirements and can suggest cost-optimization strategies.'
  },
  {
    question: 'How long does it take to develop a custom LLM?',
    answer: 'Fine-tuning projects typically take 2-8 weeks, while custom LLM development can take 3-12 months depending on complexity. Factors include data preparation time, model size, training requirements, and evaluation needs. We provide realistic timelines during the planning phase.'
  },
  {
    question: 'Can you help with model deployment and scaling?',
    answer: 'Yes, we provide end-to-end services including model optimization for deployment, infrastructure setup, API development, scaling solutions, and ongoing maintenance. We ensure your LLM performs efficiently in production environments.'
  },
  {
    question: 'How do you ensure LLM safety and prevent harmful outputs?',
    answer: 'We implement multiple safety measures including content filtering, bias testing, adversarial testing, human feedback training, and safety alignment techniques. We also provide monitoring tools to detect and prevent harmful outputs in production.'
  },
  {
    question: 'Can LLMs work with proprietary or sensitive data?',
    answer: 'Yes, we can develop LLMs that work with proprietary data while maintaining security and privacy. Options include on-premises deployment, private cloud solutions, data encryption, and federated learning approaches that keep sensitive data secure.'
  },
  {
    question: 'What ongoing support do you provide for LLMs?',
    answer: 'We provide comprehensive ongoing support including performance monitoring, model updates, retraining with new data, bug fixes, scaling assistance, and technical support. We also offer training for your team to manage and maintain the models.'
  }
]

export default function LLMDevelopmentPage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero
        title="Large Language Model Development"
        subtitle="Custom LLM Solutions for Your Business"
        description="Build powerful, domain-specific language models that understand your business context. From fine-tuning to custom development, we create LLMs that deliver exceptional results."
        primaryCTA={{
          text: "Start LLM Project",
          href: "/contact"
        }}
        secondaryCTA={{
          text: "View LLM Capabilities",
          href: "#features"
        }}
        backgroundImage="/images/llm-development-hero.jpg"
      />

      <ServiceFeatures
        title="Comprehensive LLM Development Services"
        subtitle="Advanced Language Model Solutions"
        features={features}
      />

      <ProcessSteps
        title="LLM Development Process"
        subtitle="From Concept to Production-Ready Models"
        steps={processSteps}
      />

      <TechStack
        title="LLM Development Technology Stack"
        subtitle="State-of-the-Art Tools and Frameworks"
        categories={techStack}
      />

      <CaseStudies
        title="LLM Development Success Stories"
        subtitle="Custom Language Models in Action"
        caseStudies={caseStudies}
      />

      <FAQ
        title="LLM Development FAQ"
        subtitle="Common Questions About Language Model Development"
        faqs={faqs}
      />

      <CTA
        title="Ready to Build Your Custom LLM?"
        description="Transform your business with a language model designed specifically for your domain and use cases."
        primaryCTA={{
          text: "Get Started Now",
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
