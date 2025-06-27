import { Metadata } from 'next'
import { Hero } from '@/components/ui/hero'
import { ServiceFeatures } from '@/components/services/service-features'
import { ProcessSteps } from '@/components/services/process-steps'
import { TechStack } from '@/components/services/tech-stack'
import { CaseStudies } from '@/components/services/case-studies'
import { FAQ } from '@/components/ui/faq'
import { CTA } from '@/components/ui/cta'

export const metadata: Metadata = {
  title: 'ML Model Engineering Services | Machine Learning Infrastructure | AIC',
  description: 'Expert ML model engineering services. Build scalable machine learning infrastructure, implement model pipelines, and create production-ready ML systems.',
  keywords: 'ML model engineering, machine learning infrastructure, model deployment, ML pipelines, model serving, feature engineering, model monitoring',
}

const features = [
  {
    title: 'Model Development Pipeline',
    description: 'Build end-to-end ML model development pipelines from data to deployment.',
    icon: '🔬',
    benefits: [
      'Automated model training',
      'Experiment tracking',
      'Version control',
      'Reproducible workflows'
    ]
  },
  {
    title: 'Feature Engineering',
    description: 'Design and implement robust feature engineering pipelines for ML models.',
    icon: '⚙️',
    benefits: [
      'Feature store implementation',
      'Real-time feature serving',
      'Feature validation',
      'Automated feature generation'
    ]
  },
  {
    title: 'Model Serving Infrastructure',
    description: 'Build scalable infrastructure for serving ML models in production.',
    icon: '🚀',
    benefits: [
      'High-performance serving',
      'Auto-scaling',
      'A/B testing',
      'Multi-model deployment'
    ]
  },
  {
    title: 'Model Monitoring & Observability',
    description: 'Implement comprehensive monitoring for model performance and data drift.',
    icon: '📊',
    benefits: [
      'Performance monitoring',
      'Data drift detection',
      'Model degradation alerts',
      'Bias monitoring'
    ]
  },
  {
    title: 'AutoML Implementation',
    description: 'Implement automated machine learning solutions for faster model development.',
    icon: '🤖',
    benefits: [
      'Automated model selection',
      'Hyperparameter optimization',
      'Feature selection',
      'Model ensemble'
    ]
  },
  {
    title: 'Model Optimization',
    description: 'Optimize ML models for performance, latency, and resource efficiency.',
    icon: '⚡',
    benefits: [
      'Model compression',
      'Quantization',
      'Hardware optimization',
      'Inference acceleration'
    ]
  }
]

const processSteps = [
  {
    step: 1,
    title: 'ML Requirements Analysis',
    description: 'Analyze ML use cases, data requirements, and performance objectives.',
    details: [
      'Business problem definition',
      'Data assessment',
      'Success metrics definition',
      'Technical requirements'
    ]
  },
  {
    step: 2,
    title: 'ML Architecture Design',
    description: 'Design comprehensive ML architecture and infrastructure blueprint.',
    details: [
      'Model architecture planning',
      'Data pipeline design',
      'Serving infrastructure',
      'Monitoring strategy'
    ]
  },
  {
    step: 3,
    title: 'Data Pipeline Development',
    description: 'Build robust data pipelines for ML model training and inference.',
    details: [
      'Data ingestion pipelines',
      'Feature engineering',
      'Data validation',
      'Pipeline orchestration'
    ]
  },
  {
    step: 4,
    title: 'Model Development',
    description: 'Develop, train, and validate machine learning models.',
    details: [
      'Model experimentation',
      'Training pipeline setup',
      'Model validation',
      'Performance optimization'
    ]
  },
  {
    step: 5,
    title: 'Deployment & Serving',
    description: 'Deploy models to production with scalable serving infrastructure.',
    details: [
      'Model deployment',
      'Serving infrastructure',
      'API development',
      'Performance testing'
    ]
  },
  {
    step: 6,
    title: 'Monitoring & Maintenance',
    description: 'Implement monitoring and continuous improvement processes.',
    details: [
      'Performance monitoring',
      'Model retraining',
      'Drift detection',
      'Continuous optimization'
    ]
  }
]

const techStack = {
  'ML Frameworks': [
    'TensorFlow',
    'PyTorch',
    'Scikit-learn',
    'XGBoost',
    'LightGBM',
    'Keras'
  ],
  'ML Infrastructure': [
    'Kubeflow',
    'MLflow',
    'Apache Airflow',
    'Seldon Core',
    'KServe',
    'BentoML'
  ],
  'Feature Stores': [
    'Feast',
    'Tecton',
    'AWS SageMaker Feature Store',
    'Google Vertex Feature Store',
    'Azure ML Feature Store',
    'Databricks Feature Store'
  ],
  'Model Serving': [
    'TensorFlow Serving',
    'TorchServe',
    'NVIDIA Triton',
    'Ray Serve',
    'FastAPI',
    'gRPC'
  ]
}

const caseStudies = [
  {
    title: 'Real-Time Fraud Detection System',
    client: 'Financial Services Company',
    challenge: 'Needed real-time fraud detection with sub-100ms latency for millions of transactions.',
    solution: 'Built ML model engineering pipeline with real-time feature serving and high-performance model inference.',
    results: [
      '95% fraud detection accuracy',
      '50ms average inference latency',
      '99.9% system uptime',
      '$50M annual fraud prevention'
    ],
    technologies: ['XGBoost', 'Feast Feature Store', 'Kubernetes', 'Redis', 'Apache Kafka']
  },
  {
    title: 'Personalized Recommendation Engine',
    client: 'E-commerce Platform',
    challenge: 'Required scalable recommendation system for 10M+ users with real-time personalization.',
    solution: 'Implemented ML model engineering platform with automated retraining and A/B testing capabilities.',
    results: [
      '35% increase in click-through rates',
      '25% boost in conversion rates',
      'Real-time recommendations for 10M+ users',
      'Automated model retraining pipeline'
    ],
    technologies: ['TensorFlow', 'MLflow', 'Kubeflow', 'BigQuery', 'Google Cloud AI Platform']
  },
  {
    title: 'Predictive Maintenance System',
    client: 'Manufacturing Company',
    challenge: 'Needed predictive maintenance for industrial equipment to reduce downtime.',
    solution: 'Built ML engineering pipeline for time-series forecasting with IoT data integration and edge deployment.',
    results: [
      '60% reduction in unplanned downtime',
      '40% decrease in maintenance costs',
      'Real-time equipment monitoring',
      'Edge deployment for 500+ machines'
    ],
    technologies: ['PyTorch', 'Apache Airflow', 'InfluxDB', 'Docker', 'NVIDIA Triton']
  }
]

const faqs = [
  {
    question: 'What is ML model engineering and how is it different from data science?',
    answer: 'ML model engineering focuses on building the infrastructure, pipelines, and systems needed to deploy and maintain machine learning models in production. While data science focuses on model development and experimentation, ML engineering ensures models can be reliably deployed, monitored, and maintained at scale.'
  },
  {
    question: 'How do you ensure ML models perform well in production?',
    answer: 'We implement comprehensive monitoring including model performance tracking, data drift detection, feature monitoring, and automated alerting. We also establish model validation processes, A/B testing frameworks, and automated retraining pipelines to maintain model performance over time.'
  },
  {
    question: 'What is a feature store and do I need one?',
    answer: 'A feature store is a centralized repository for storing, managing, and serving machine learning features. You need one if you have multiple ML models, need consistent features across training and serving, require real-time feature serving, or want to enable feature reuse across teams.'
  },
  {
    question: 'How do you handle model versioning and deployment?',
    answer: 'We implement comprehensive model versioning using tools like MLflow or DVC, with automated deployment pipelines that include testing, validation, and rollback capabilities. We use blue-green deployments, canary releases, and A/B testing to ensure safe model deployments.'
  },
  {
    question: 'Can you optimize existing ML models for better performance?',
    answer: 'Yes, we provide model optimization services including model compression, quantization, pruning, and hardware-specific optimization. We can also optimize inference pipelines, implement caching strategies, and use specialized serving frameworks to improve performance.'
  },
  {
    question: 'How do you handle data drift and model degradation?',
    answer: 'We implement automated monitoring systems that track data distribution changes, feature drift, and model performance degradation. When drift is detected, we trigger alerts and can automatically retrain models or switch to backup models to maintain performance.'
  },
  {
    question: 'What cloud platforms do you work with for ML engineering?',
    answer: 'We work with all major cloud platforms including AWS SageMaker, Google Cloud AI Platform, Azure ML, and Databricks. We can also implement on-premises or hybrid solutions using open-source tools like Kubeflow and MLflow.'
  },
  {
    question: 'How do you ensure ML model security and compliance?',
    answer: 'We implement security best practices including model encryption, secure API endpoints, access controls, audit logging, and compliance frameworks. We can also implement privacy-preserving techniques like differential privacy and federated learning when required.'
  }
]

export default function MLModelEngineeringPage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero
        title="ML Model Engineering Services"
        subtitle="Production-Ready Machine Learning Infrastructure"
        description="Build robust, scalable ML systems that deliver reliable results in production. From model development to deployment and monitoring, we engineer ML solutions that work."
        primaryCTA={{
          text: "Start ML Engineering",
          href: "/contact"
        }}
        secondaryCTA={{
          text: "Explore ML Solutions",
          href: "#features"
        }}
        backgroundImage="/images/ml-engineering-hero.jpg"
      />

      <ServiceFeatures
        title="Comprehensive ML Model Engineering"
        subtitle="End-to-End ML Infrastructure Solutions"
        features={features}
      />

      <ProcessSteps
        title="ML Model Engineering Process"
        subtitle="From Development to Production"
        steps={processSteps}
      />

      <TechStack
        title="ML Engineering Technology Stack"
        subtitle="Advanced Tools for Production ML"
        categories={techStack}
      />

      <CaseStudies
        title="ML Engineering Success Stories"
        subtitle="Production ML Systems That Deliver"
        caseStudies={caseStudies}
      />

      <FAQ
        title="ML Model Engineering FAQ"
        subtitle="Common Questions About ML Engineering"
        faqs={faqs}
      />

      <CTA
        title="Ready to Engineer Production ML Systems?"
        description="Transform your ML models from experiments to production-ready systems that scale and deliver consistent results."
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
