import { Metadata } from 'next'
import { Hero } from '@/components/ui/hero'
import { ServiceFeatures } from '@/components/services/service-features'
import { ProcessSteps } from '@/components/services/process-steps'
import { TechStack } from '@/components/services/tech-stack'
import { CaseStudies } from '@/components/services/case-studies'
import { FAQ } from '@/components/ui/faq'
import { CTA } from '@/components/ui/cta'

export const metadata: Metadata = {
  title: 'MLOps Consulting Services | ML Operations & DevOps | AIC',
  description: 'Expert MLOps consulting services. Implement ML operations, automate model deployment, and build scalable ML infrastructure for continuous delivery of AI solutions.',
  keywords: 'MLOps consulting, ML operations, machine learning DevOps, model deployment automation, ML infrastructure, continuous integration, model monitoring',
}

const features = [
  {
    title: 'MLOps Strategy & Assessment',
    description: 'Develop comprehensive MLOps strategy aligned with your business objectives.',
    icon: '🎯',
    benefits: [
      'Current state assessment',
      'MLOps maturity evaluation',
      'Strategic roadmap',
      'Best practices implementation'
    ]
  },
  {
    title: 'CI/CD for Machine Learning',
    description: 'Implement continuous integration and deployment pipelines for ML models.',
    icon: '🔄',
    benefits: [
      'Automated testing',
      'Model validation',
      'Deployment automation',
      'Rollback capabilities'
    ]
  },
  {
    title: 'Model Lifecycle Management',
    description: 'Establish comprehensive model lifecycle management processes.',
    icon: '♻️',
    benefits: [
      'Version control',
      'Experiment tracking',
      'Model registry',
      'Governance frameworks'
    ]
  },
  {
    title: 'Infrastructure as Code',
    description: 'Implement infrastructure automation for scalable ML operations.',
    icon: '🏗️',
    benefits: [
      'Automated provisioning',
      'Environment consistency',
      'Scalable infrastructure',
      'Cost optimization'
    ]
  },
  {
    title: 'Monitoring & Observability',
    description: 'Build comprehensive monitoring systems for ML models and infrastructure.',
    icon: '📊',
    benefits: [
      'Model performance monitoring',
      'Data drift detection',
      'Infrastructure monitoring',
      'Automated alerting'
    ]
  },
  {
    title: 'MLOps Platform Implementation',
    description: 'Deploy and configure MLOps platforms for your organization.',
    icon: '🚀',
    benefits: [
      'Platform selection',
      'Custom configuration',
      'Integration setup',
      'Team training'
    ]
  }
]

const processSteps = [
  {
    step: 1,
    title: 'MLOps Maturity Assessment',
    description: 'Evaluate current ML operations maturity and identify improvement areas.',
    details: [
      'Current process evaluation',
      'Tool and technology audit',
      'Team capability assessment',
      'Gap analysis'
    ]
  },
  {
    step: 2,
    title: 'MLOps Strategy Development',
    description: 'Design comprehensive MLOps strategy and implementation roadmap.',
    details: [
      'Strategic planning',
      'Technology selection',
      'Process design',
      'Implementation timeline'
    ]
  },
  {
    step: 3,
    title: 'Infrastructure Setup',
    description: 'Implement MLOps infrastructure and foundational components.',
    details: [
      'Platform deployment',
      'Infrastructure automation',
      'Security implementation',
      'Integration configuration'
    ]
  },
  {
    step: 4,
    title: 'Pipeline Development',
    description: 'Build automated ML pipelines for training, testing, and deployment.',
    details: [
      'CI/CD pipeline setup',
      'Automated testing',
      'Model validation',
      'Deployment automation'
    ]
  },
  {
    step: 5,
    title: 'Monitoring Implementation',
    description: 'Deploy comprehensive monitoring and observability solutions.',
    details: [
      'Monitoring setup',
      'Alerting configuration',
      'Dashboard creation',
      'Reporting automation'
    ]
  },
  {
    step: 6,
    title: 'Training & Optimization',
    description: 'Train teams and continuously optimize MLOps processes.',
    details: [
      'Team training',
      'Process optimization',
      'Performance tuning',
      'Continuous improvement'
    ]
  }
]

const techStack = {
  'MLOps Platforms': [
    'Kubeflow',
    'MLflow',
    'Apache Airflow',
    'Prefect',
    'Metaflow',
    'Kedro'
  ],
  'Model Serving': [
    'Seldon Core',
    'KServe',
    'BentoML',
    'TorchServe',
    'TensorFlow Serving',
    'Ray Serve'
  ],
  'Infrastructure': [
    'Kubernetes',
    'Docker',
    'Terraform',
    'Ansible',
    'Helm',
    'ArgoCD'
  ],
  'Monitoring': [
    'Prometheus',
    'Grafana',
    'Evidently AI',
    'Weights & Biases',
    'Neptune',
    'Comet'
  ]
}

const caseStudies = [
  {
    title: 'Enterprise MLOps Transformation',
    client: 'Fortune 500 Financial Services',
    challenge: 'Manual ML processes causing delays and inconsistencies across 50+ models in production.',
    solution: 'Implemented comprehensive MLOps platform with automated CI/CD, monitoring, and governance.',
    results: [
      '80% reduction in model deployment time',
      '95% improvement in model reliability',
      '60% decrease in operational costs',
      'Standardized processes across 10+ teams'
    ],
    technologies: ['Kubeflow', 'MLflow', 'Kubernetes', 'Prometheus', 'GitLab CI/CD']
  },
  {
    title: 'Startup MLOps Implementation',
    client: 'AI-First Healthcare Startup',
    challenge: 'Needed scalable MLOps infrastructure to support rapid growth and regulatory compliance.',
    solution: 'Built cloud-native MLOps platform with automated compliance checks and audit trails.',
    results: [
      'FDA compliance achieved',
      '10x faster model iteration',
      'Automated regulatory reporting',
      'Scaled from 5 to 50+ models'
    ],
    technologies: ['AWS SageMaker', 'Apache Airflow', 'Docker', 'Terraform', 'Evidently AI']
  },
  {
    title: 'Retail MLOps Modernization',
    client: 'Global Retail Chain',
    challenge: 'Legacy ML infrastructure couldn\'t support real-time personalization at scale.',
    solution: 'Modernized MLOps with real-time serving, A/B testing, and automated retraining.',
    results: [
      'Real-time recommendations for 100M+ users',
      '40% improvement in recommendation accuracy',
      '90% reduction in manual interventions',
      'Automated A/B testing framework'
    ],
    technologies: ['Seldon Core', 'Apache Kafka', 'Redis', 'Kubernetes', 'Grafana']
  }
]

const faqs = [
  {
    question: 'What is MLOps and why is it important?',
    answer: 'MLOps (Machine Learning Operations) is the practice of applying DevOps principles to machine learning workflows. It\'s important because it enables organizations to deploy, monitor, and maintain ML models reliably at scale, reducing time-to-market and ensuring consistent model performance in production.'
  },
  {
    question: 'How do you assess MLOps maturity?',
    answer: 'We assess MLOps maturity across multiple dimensions including automation level, monitoring capabilities, governance processes, collaboration practices, and infrastructure scalability. We use established frameworks like Google\'s MLOps maturity model to provide objective assessments and improvement recommendations.'
  },
  {
    question: 'What are the key components of an MLOps platform?',
    answer: 'Key components include experiment tracking, model registry, automated training pipelines, model serving infrastructure, monitoring and observability, version control, automated testing, and governance frameworks. The specific components depend on your use cases and requirements.'
  },
  {
    question: 'How long does it take to implement MLOps?',
    answer: 'Implementation timelines vary based on current maturity, organizational size, and complexity. Basic MLOps setup can take 2-3 months, while comprehensive enterprise implementations may take 6-12 months. We provide phased approaches to deliver value incrementally.'
  },
  {
    question: 'Can you work with our existing ML tools and platforms?',
    answer: 'Yes, we specialize in working with existing tools and can integrate MLOps practices with your current technology stack. We assess your current setup and design solutions that enhance rather than replace your existing investments where possible.'
  },
  {
    question: 'How do you ensure model governance and compliance?',
    answer: 'We implement comprehensive governance frameworks including model documentation, audit trails, approval workflows, compliance checks, and automated reporting. We can customize governance processes to meet industry-specific regulations like FDA, GDPR, or financial services requirements.'
  },
  {
    question: 'What ROI can we expect from MLOps implementation?',
    answer: 'Organizations typically see 3-5x ROI from MLOps implementation through reduced deployment times, improved model reliability, decreased operational costs, and faster time-to-market. Specific ROI depends on your current processes and the scale of ML operations.'
  },
  {
    question: 'Do you provide ongoing MLOps support and optimization?',
    answer: 'Yes, we provide comprehensive ongoing support including platform maintenance, process optimization, team training, and continuous improvement. We can also provide managed MLOps services where we handle day-to-day operations while you focus on model development.'
  }
]

export default function MLOpsConsultingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero
        title="MLOps Consulting Services"
        subtitle="Streamline Your ML Operations"
        description="Transform your machine learning operations with expert MLOps consulting. Build scalable, automated ML pipelines that deliver reliable results and accelerate innovation."
        primaryCTA={{
          text: "Start MLOps Journey",
          href: "/contact"
        }}
        secondaryCTA={{
          text: "Assess MLOps Maturity",
          href: "#features"
        }}
        backgroundImage="/images/mlops-consulting-hero.jpg"
      />

      <ServiceFeatures
        title="Comprehensive MLOps Consulting"
        subtitle="End-to-End ML Operations Solutions"
        features={features}
      />

      <ProcessSteps
        title="MLOps Implementation Process"
        subtitle="Systematic Approach to ML Operations"
        steps={processSteps}
      />

      <TechStack
        title="MLOps Technology Stack"
        subtitle="Advanced Tools for ML Operations"
        categories={techStack}
      />

      <CaseStudies
        title="MLOps Transformation Success Stories"
        subtitle="Real Results from MLOps Implementation"
        caseStudies={caseStudies}
      />

      <FAQ
        title="MLOps Consulting FAQ"
        subtitle="Common Questions About ML Operations"
        faqs={faqs}
      />

      <CTA
        title="Ready to Transform Your ML Operations?"
        description="Accelerate your ML initiatives with expert MLOps consulting that delivers scalable, reliable, and automated machine learning operations."
        primaryCTA={{
          text: "Get Started Now",
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
