import { Metadata } from 'next'
import { Hero } from '@/components/ui/hero'
import { ServiceFeatures } from '@/components/services/service-features'
import { ProcessSteps } from '@/components/services/process-steps'
import { TechStack } from '@/components/services/tech-stack'
import { CaseStudies } from '@/components/services/case-studies'
import { FAQ } from '@/components/ui/faq'
import { CTA } from '@/components/ui/cta'

export const metadata: Metadata = {
  title: 'Prompt Engineers | AI Prompt Optimization Experts | AIC',
  description: 'Professional prompt engineering services. Optimize AI prompts for better performance, create prompt libraries, and develop advanced prompt strategies for maximum AI effectiveness.',
  keywords: 'prompt engineering, AI prompt optimization, prompt design, LLM prompting, ChatGPT prompts, AI prompt strategies, prompt development',
}

const features = [
  {
    title: 'Advanced Prompt Design',
    description: 'Create sophisticated prompts that maximize AI model performance and accuracy.',
    icon: '✍️',
    benefits: [
      'Optimized prompt structure',
      'Context-aware design',
      'Performance maximization',
      'Error reduction'
    ]
  },
  {
    title: 'Prompt Engineering Strategy',
    description: 'Develop comprehensive prompt strategies aligned with your business objectives.',
    icon: '🎯',
    benefits: [
      'Strategic planning',
      'Use case optimization',
      'Performance benchmarking',
      'ROI maximization'
    ]
  },
  {
    title: 'Chain-of-Thought Prompting',
    description: 'Implement advanced reasoning techniques for complex problem-solving tasks.',
    icon: '🔗',
    benefits: [
      'Step-by-step reasoning',
      'Complex problem solving',
      'Improved accuracy',
      'Logical consistency'
    ]
  },
  {
    title: 'Few-Shot Learning Optimization',
    description: 'Design effective few-shot prompts that teach AI models through examples.',
    icon: '📚',
    benefits: [
      'Example-based learning',
      'Quick adaptation',
      'Minimal training data',
      'Rapid deployment'
    ]
  },
  {
    title: 'Prompt Library Development',
    description: 'Build comprehensive prompt libraries for consistent and reusable AI interactions.',
    icon: '📖',
    benefits: [
      'Standardized prompts',
      'Version control',
      'Team collaboration',
      'Quality assurance'
    ]
  },
  {
    title: 'Performance Optimization',
    description: 'Continuously optimize prompts for better results and cost efficiency.',
    icon: '⚡',
    benefits: [
      'A/B testing',
      'Performance metrics',
      'Cost optimization',
      'Continuous improvement'
    ]
  }
]

const processSteps = [
  {
    step: 1,
    title: 'Use Case Analysis',
    description: 'Analyze your specific AI use cases and performance requirements.',
    details: [
      'Objective identification',
      'Success metrics definition',
      'Current prompt assessment',
      'Performance baseline'
    ]
  },
  {
    step: 2,
    title: 'Prompt Strategy Design',
    description: 'Design comprehensive prompt engineering strategy and framework.',
    details: [
      'Prompting technique selection',
      'Template development',
      'Testing methodology',
      'Optimization roadmap'
    ]
  },
  {
    step: 3,
    title: 'Prompt Development',
    description: 'Create and refine prompts using advanced engineering techniques.',
    details: [
      'Initial prompt creation',
      'Iterative refinement',
      'Context optimization',
      'Edge case handling'
    ]
  },
  {
    step: 4,
    title: 'Testing & Validation',
    description: 'Comprehensive testing and validation of prompt performance.',
    details: [
      'A/B testing setup',
      'Performance evaluation',
      'Quality assessment',
      'Bias detection'
    ]
  },
  {
    step: 5,
    title: 'Implementation & Training',
    description: 'Deploy optimized prompts and train your team on best practices.',
    details: [
      'Production deployment',
      'Team training',
      'Documentation creation',
      'Best practices guide'
    ]
  },
  {
    step: 6,
    title: 'Monitoring & Optimization',
    description: 'Continuous monitoring and optimization of prompt performance.',
    details: [
      'Performance tracking',
      'Usage analytics',
      'Continuous optimization',
      'Regular updates'
    ]
  }
]

const techStack = {
  'Prompt Engineering Tools': [
    'PromptBase',
    'LangChain',
    'Prompt Flow',
    'OpenAI Playground',
    'Anthropic Console',
    'Weights & Biases'
  ],
  'Testing & Analytics': [
    'A/B Testing Frameworks',
    'Performance Metrics',
    'Analytics Dashboards',
    'Quality Assessment',
    'Bias Detection Tools',
    'Cost Tracking'
  ],
  'Development Platforms': [
    'Jupyter Notebooks',
    'Google Colab',
    'Python',
    'JavaScript',
    'API Testing Tools',
    'Version Control'
  ],
  'AI Models': [
    'GPT-4',
    'Claude',
    'Gemini',
    'LLaMA',
    'PaLM',
    'Custom Models'
  ]
}

const caseStudies = [
  {
    title: 'E-commerce Product Description Optimization',
    client: 'Online Retailer',
    challenge: 'Needed consistent, high-quality product descriptions across 50,000+ products.',
    solution: 'Developed advanced prompt templates with few-shot learning for automated product description generation.',
    results: [
      '90% improvement in description quality',
      '80% reduction in generation time',
      '95% consistency across products',
      '$200K annual cost savings'
    ],
    technologies: ['GPT-4 Prompting', 'Few-shot Learning', 'Template Optimization', 'Quality Assessment']
  },
  {
    title: 'Legal Document Analysis Prompts',
    client: 'Law Firm',
    challenge: 'Required accurate AI analysis of complex legal documents with high precision.',
    solution: 'Created specialized chain-of-thought prompts for legal reasoning and document analysis.',
    results: [
      '95% accuracy in document analysis',
      '60% faster contract review',
      '85% reduction in manual work',
      'Consistent legal reasoning'
    ],
    technologies: ['Chain-of-Thought Prompting', 'Legal Domain Expertise', 'Accuracy Optimization', 'Bias Mitigation']
  },
  {
    title: 'Customer Service Chatbot Optimization',
    client: 'Telecommunications Company',
    challenge: 'Chatbot responses were inconsistent and often failed to resolve customer issues.',
    solution: 'Engineered comprehensive prompt library with context-aware templates and escalation logic.',
    results: [
      '75% improvement in resolution rate',
      '40% increase in customer satisfaction',
      '50% reduction in escalations',
      'Consistent brand voice'
    ],
    technologies: ['Context-Aware Prompting', 'Conversation Design', 'Brand Voice Optimization', 'Performance Testing']
  }
]

const faqs = [
  {
    question: 'What is prompt engineering and why is it important?',
    answer: 'Prompt engineering is the art and science of designing inputs to AI models to get optimal outputs. It\'s crucial because the quality of your prompts directly impacts AI performance, accuracy, and cost-effectiveness. Well-engineered prompts can dramatically improve results while reducing API costs.'
  },
  {
    question: 'How much can good prompt engineering improve AI performance?',
    answer: 'Good prompt engineering can improve AI performance by 50-300% depending on the use case. We\'ve seen accuracy improvements of 20-90%, cost reductions of 30-70%, and significant improvements in consistency and reliability across various applications.'
  },
  {
    question: 'What types of prompting techniques do you use?',
    answer: 'We use advanced techniques including chain-of-thought prompting, few-shot learning, zero-shot prompting, role-based prompting, template-based approaches, and custom techniques tailored to specific use cases and AI models.'
  },
  {
    question: 'Can you optimize prompts for different AI models?',
    answer: 'Yes, we optimize prompts for various AI models including GPT-4, Claude, Gemini, LLaMA, and custom models. Each model has unique characteristics, and we tailor prompts to leverage the strengths of each specific model.'
  },
  {
    question: 'How do you measure prompt performance?',
    answer: 'We use comprehensive metrics including accuracy, relevance, consistency, cost per query, response time, user satisfaction, and task-specific KPIs. We also conduct A/B testing and human evaluation to ensure optimal performance.'
  },
  {
    question: 'Do you provide prompt libraries and templates?',
    answer: 'Yes, we create comprehensive prompt libraries with reusable templates, version control, and documentation. These libraries ensure consistency across your organization and make it easy for teams to use optimized prompts.'
  },
  {
    question: 'How do you handle bias and safety in prompts?',
    answer: 'We implement bias detection and mitigation strategies, safety guidelines, content filtering, and ethical AI practices. We test prompts for potential biases and ensure they align with responsible AI principles and your company values.'
  },
  {
    question: 'Can you train our team on prompt engineering?',
    answer: 'Absolutely! We provide comprehensive training programs covering prompt engineering fundamentals, advanced techniques, best practices, and hands-on workshops. We can customize training for your specific use cases and team needs.'
  }
]

export default function PromptEngineersPage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero
        title="Expert Prompt Engineers"
        subtitle="Maximize Your AI Performance"
        description="Unlock the full potential of AI with expertly crafted prompts. Our prompt engineering specialists optimize AI interactions for better results, lower costs, and consistent performance."
        primaryCTA={{
          text: "Optimize Your Prompts",
          href: "/contact"
        }}
        secondaryCTA={{
          text: "Learn About Prompting",
          href: "#features"
        }}
        backgroundImage="/images/prompt-engineering-hero.jpg"
      />

      <ServiceFeatures
        title="Professional Prompt Engineering Services"
        subtitle="Advanced AI Optimization Techniques"
        features={features}
      />

      <ProcessSteps
        title="Prompt Engineering Process"
        subtitle="Systematic Approach to AI Optimization"
        steps={processSteps}
      />

      <TechStack
        title="Prompt Engineering Technology Stack"
        subtitle="Advanced Tools for AI Optimization"
        categories={techStack}
      />

      <CaseStudies
        title="Prompt Engineering Success Stories"
        subtitle="Real Results from Optimized AI"
        caseStudies={caseStudies}
      />

      <FAQ
        title="Prompt Engineering FAQ"
        subtitle="Common Questions About AI Prompt Optimization"
        faqs={faqs}
      />

      <CTA
        title="Ready to Optimize Your AI Performance?"
        description="Let our expert prompt engineers unlock the full potential of your AI systems with optimized prompts and advanced techniques."
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
