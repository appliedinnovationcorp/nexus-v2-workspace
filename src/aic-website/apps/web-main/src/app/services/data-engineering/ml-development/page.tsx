import { Metadata } from 'next'
import { Hero } from '@/components/ui/hero'
import { ServiceFeatures } from '@/components/services/service-features'
import { ProcessSteps } from '@/components/services/process-steps'
import { TechStack } from '@/components/services/tech-stack'
import { CaseStudies } from '@/components/services/case-studies'
import { FAQ } from '@/components/ui/faq'
import { CTA } from '@/components/ui/cta'

export const metadata: Metadata = {
  title: 'Machine Learning Development Services | Custom ML Solutions | AIC',
  description: 'Expert machine learning development services. Build custom ML models, implement AI algorithms, and create intelligent solutions for your business challenges.',
  keywords: 'machine learning development, ML model development, AI algorithms, predictive analytics, deep learning, neural networks, custom ML solutions',
}

const features = [
  {
    title: 'Custom ML Model Development',
    description: 'Build tailored machine learning models for your specific business problems.',
    icon: '🧠',
    benefits: [
      'Problem-specific algorithms',
      'Custom architecture design',
      'Domain expertise integration',
      'Performance optimization'
    ]
  },
  {
    title: 'Deep Learning Solutions',
    description: 'Develop advanced neural networks for complex pattern recognition and prediction.',
    icon: '🕸️',
    benefits: [
      'Neural network design',
      'Computer vision models',
      'Natural language processing',
      'Time series forecasting'
    ]
  },
  {
    title: 'Predictive Analytics',
    description: 'Create predictive models that forecast trends and business outcomes.',
    icon: '🔮',
    benefits: [
      'Demand forecasting',
      'Risk assessment',
      'Customer behavior prediction',
      'Market trend analysis'
    ]
  },
  {
    title: 'Computer Vision Development',
    description: 'Build intelligent systems that can see, understand, and analyze visual content.',
    icon: '👁️',
    benefits: [
      'Image classification',
      'Object detection',
      'Facial recognition',
      'Medical imaging analysis'
    ]
  },
  {
    title: 'Natural Language Processing',
    description: 'Develop NLP solutions for text analysis, understanding, and generation.',
    icon: '💬',
    benefits: [
      'Sentiment analysis',
      'Text classification',
      'Language translation',
      'Chatbot development'
    ]
  },
  {
    title: 'Recommendation Systems',
    description: 'Build intelligent recommendation engines for personalized user experiences.',
    icon: '🎯',
    benefits: [
      'Collaborative filtering',
      'Content-based recommendations',
      'Hybrid approaches',
      'Real-time personalization'
    ]
  }
]

const processSteps = [
  {
    step: 1,
    title: 'Problem Definition & Analysis',
    description: 'Understand business objectives and define the machine learning problem.',
    details: [
      'Business problem analysis',
      'Success criteria definition',
      'Data availability assessment',
      'Feasibility study'
    ]
  },
  {
    step: 2,
    title: 'Data Exploration & Preparation',
    description: 'Explore, clean, and prepare data for machine learning model development.',
    details: [
      'Exploratory data analysis',
      'Data cleaning and preprocessing',
      'Feature engineering',
      'Data validation'
    ]
  },
  {
    step: 3,
    title: 'Model Selection & Development',
    description: 'Select appropriate algorithms and develop machine learning models.',
    details: [
      'Algorithm selection',
      'Model architecture design',
      'Training and validation',
      'Hyperparameter tuning'
    ]
  },
  {
    step: 4,
    title: 'Model Evaluation & Testing',
    description: 'Rigorously evaluate model performance and validate results.',
    details: [
      'Performance metrics evaluation',
      'Cross-validation',
      'Bias and fairness testing',
      'Robustness analysis'
    ]
  },
  {
    step: 5,
    title: 'Model Deployment',
    description: 'Deploy models to production with proper infrastructure and monitoring.',
    details: [
      'Production deployment',
      'API development',
      'Performance monitoring',
      'Scaling configuration'
    ]
  },
  {
    step: 6,
    title: 'Monitoring & Maintenance',
    description: 'Continuous monitoring and improvement of deployed models.',
    details: [
      'Performance tracking',
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
    'Keras',
    'XGBoost',
    'LightGBM'
  ],
  'Deep Learning': [
    'TensorFlow',
    'PyTorch',
    'Hugging Face',
    'OpenCV',
    'NLTK',
    'spaCy'
  ],
  'Data Science': [
    'Pandas',
    'NumPy',
    'Matplotlib',
    'Seaborn',
    'Jupyter',
    'R'
  ],
  'Cloud ML': [
    'AWS SageMaker',
    'Google Cloud AI',
    'Azure ML',
    'Databricks',
    'H2O.ai',
    'DataRobot'
  ]
}

const caseStudies = [
  {
    title: 'Predictive Maintenance for Manufacturing',
    client: 'Industrial Equipment Manufacturer',
    challenge: 'Reduce equipment downtime and maintenance costs through predictive analytics.',
    solution: 'Developed ML models using sensor data to predict equipment failures before they occur.',
    results: [
      '70% reduction in unplanned downtime',
      '45% decrease in maintenance costs',
      '90% accuracy in failure prediction',
      'ROI of 400% within first year'
    ],
    technologies: ['Random Forest', 'LSTM Networks', 'Time Series Analysis', 'IoT Integration']
  },
  {
    title: 'Customer Churn Prediction',
    client: 'Telecommunications Company',
    challenge: 'Identify customers likely to churn and implement retention strategies.',
    solution: 'Built ensemble ML models combining customer behavior, usage patterns, and demographic data.',
    results: [
      '85% accuracy in churn prediction',
      '30% reduction in customer churn',
      '$5M annual revenue retention',
      '60% improvement in retention campaign effectiveness'
    ],
    technologies: ['Gradient Boosting', 'Feature Engineering', 'Ensemble Methods', 'A/B Testing']
  },
  {
    title: 'Medical Image Analysis System',
    client: 'Healthcare Provider',
    challenge: 'Automate medical image analysis to assist radiologists in diagnosis.',
    solution: 'Developed deep learning models for medical image classification and anomaly detection.',
    results: [
      '95% diagnostic accuracy',
      '50% faster image analysis',
      'FDA approval obtained',
      'Deployed across 20+ hospitals'
    ],
    technologies: ['Convolutional Neural Networks', 'Transfer Learning', 'Medical Imaging', 'DICOM Processing']
  }
]

const faqs = [
  {
    question: 'What types of machine learning problems can you solve?',
    answer: 'We can solve a wide range of ML problems including classification, regression, clustering, recommendation systems, time series forecasting, computer vision, natural language processing, and reinforcement learning. We work across industries including healthcare, finance, retail, manufacturing, and technology.'
  },
  {
    question: 'How do you determine which ML algorithm to use?',
    answer: 'Algorithm selection depends on factors like problem type, data size and quality, interpretability requirements, performance needs, and deployment constraints. We use systematic approaches including baseline comparisons, cross-validation, and business requirement analysis to select the optimal algorithm.'
  },
  {
    question: 'What data do you need to build ML models?',
    answer: 'Data requirements vary by problem type, but generally we need relevant, high-quality data that represents the problem domain. This could include historical records, sensor data, text, images, or user interactions. We can help assess your data readiness and suggest data collection strategies if needed.'
  },
  {
    question: 'How long does it take to develop a machine learning model?',
    answer: 'Development timelines vary based on problem complexity, data availability, and requirements. Simple models might take 2-4 weeks, while complex deep learning solutions can take 3-6 months. We provide detailed timelines during the planning phase based on your specific needs.'
  },
  {
    question: 'How do you ensure ML model accuracy and reliability?',
    answer: 'We use rigorous validation techniques including cross-validation, holdout testing, and real-world validation. We also implement bias testing, robustness analysis, and continuous monitoring to ensure models maintain accuracy over time. We follow ML best practices for reproducible and reliable results.'
  },
  {
    question: 'Can you integrate ML models with existing systems?',
    answer: 'Yes, we specialize in integrating ML models with existing systems through APIs, batch processing, real-time streaming, or embedded solutions. We ensure seamless integration that enhances your current workflows without disrupting operations.'
  },
  {
    question: 'How do you handle model interpretability and explainability?',
    answer: 'We implement various explainability techniques including SHAP values, LIME, feature importance analysis, and model-agnostic methods. For regulated industries, we can prioritize interpretable models and provide detailed explanations of model decisions.'
  },
  {
    question: 'What ongoing support do you provide after model deployment?',
    answer: 'We provide comprehensive post-deployment support including performance monitoring, model retraining, drift detection, bug fixes, and optimization. We also offer training for your team and can provide different levels of ongoing support based on your needs.'
  }
]

export default function MLDevelopmentPage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero
        title="Machine Learning Development Services"
        subtitle="Custom ML Solutions for Your Business"
        description="Transform your data into intelligent solutions with custom machine learning development. From predictive analytics to deep learning, we build ML systems that drive results."
        primaryCTA={{
          text: "Start ML Project",
          href: "/contact"
        }}
        secondaryCTA={{
          text: "Explore ML Solutions",
          href: "#features"
        }}
        backgroundImage="/images/ml-development-hero.jpg"
      />

      <ServiceFeatures
        title="Comprehensive ML Development Services"
        subtitle="Custom Machine Learning Solutions"
        features={features}
      />

      <ProcessSteps
        title="ML Development Process"
        subtitle="From Problem to Production"
        steps={processSteps}
      />

      <TechStack
        title="ML Development Technology Stack"
        subtitle="Advanced Tools and Frameworks"
        categories={techStack}
      />

      <CaseStudies
        title="ML Development Success Stories"
        subtitle="Real-World Machine Learning Solutions"
        caseStudies={caseStudies}
      />

      <FAQ
        title="ML Development FAQ"
        subtitle="Common Questions About Machine Learning Development"
        faqs={faqs}
      />

      <CTA
        title="Ready to Build Custom ML Solutions?"
        description="Transform your business challenges into intelligent solutions with custom machine learning development tailored to your needs."
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
