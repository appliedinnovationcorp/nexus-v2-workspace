import { Metadata } from 'next'
import { Hero } from '@/components/ui/hero'
import { ServiceFeatures } from '@/components/services/service-features'
import { ProcessSteps } from '@/components/services/process-steps'
import { TechStack } from '@/components/services/tech-stack'
import { CaseStudies } from '@/components/services/case-studies'
import { FAQ } from '@/components/ui/faq'
import { CTA } from '@/components/ui/cta'

export const metadata: Metadata = {
  title: 'Data Engineering Services | Big Data Solutions | AIC',
  description: 'Comprehensive data engineering services. Build scalable data pipelines, implement ETL/ELT processes, and create robust data infrastructure for analytics and machine learning.',
  keywords: 'data engineering, data pipelines, ETL, ELT, big data, data infrastructure, data warehousing, real-time processing, data architecture',
}

const features = [
  {
    title: 'Data Pipeline Development',
    description: 'Build robust, scalable data pipelines for batch and real-time data processing.',
    icon: '🔄',
    benefits: [
      'Automated data ingestion',
      'Real-time processing',
      'Error handling & recovery',
      'Scalable architecture'
    ]
  },
  {
    title: 'ETL/ELT Implementation',
    description: 'Design and implement efficient Extract, Transform, Load processes for data integration.',
    icon: '⚡',
    benefits: [
      'Data transformation',
      'Quality validation',
      'Performance optimization',
      'Monitoring & alerting'
    ]
  },
  {
    title: 'Data Warehouse Solutions',
    description: 'Create modern data warehouses and data lakes for analytics and reporting.',
    icon: '🏢',
    benefits: [
      'Centralized data storage',
      'Query optimization',
      'Historical data management',
      'Business intelligence ready'
    ]
  },
  {
    title: 'Real-Time Data Processing',
    description: 'Implement streaming data solutions for real-time analytics and decision making.',
    icon: '⚡',
    benefits: [
      'Low-latency processing',
      'Event-driven architecture',
      'Stream analytics',
      'Real-time dashboards'
    ]
  },
  {
    title: 'Data Quality Management',
    description: 'Ensure data accuracy, completeness, and consistency across all systems.',
    icon: '✅',
    benefits: [
      'Data validation rules',
      'Quality monitoring',
      'Anomaly detection',
      'Data lineage tracking'
    ]
  },
  {
    title: 'Cloud Data Architecture',
    description: 'Design cloud-native data architectures for scalability and cost efficiency.',
    icon: '☁️',
    benefits: [
      'Multi-cloud solutions',
      'Auto-scaling',
      'Cost optimization',
      'High availability'
    ]
  }
]

const processSteps = [
  {
    step: 1,
    title: 'Data Assessment & Strategy',
    description: 'Analyze current data landscape and define comprehensive data strategy.',
    details: [
      'Data audit and inventory',
      'Requirements gathering',
      'Architecture planning',
      'Technology selection'
    ]
  },
  {
    step: 2,
    title: 'Architecture Design',
    description: 'Design scalable data architecture and infrastructure blueprint.',
    details: [
      'System architecture design',
      'Data flow mapping',
      'Security framework',
      'Performance planning'
    ]
  },
  {
    step: 3,
    title: 'Infrastructure Setup',
    description: 'Implement data infrastructure and foundational components.',
    details: [
      'Cloud infrastructure setup',
      'Database configuration',
      'Security implementation',
      'Monitoring setup'
    ]
  },
  {
    step: 4,
    title: 'Pipeline Development',
    description: 'Build and test data pipelines and processing workflows.',
    details: [
      'ETL/ELT development',
      'Data transformation logic',
      'Error handling',
      'Performance optimization'
    ]
  },
  {
    step: 5,
    title: 'Testing & Validation',
    description: 'Comprehensive testing of data pipelines and quality validation.',
    details: [
      'Unit and integration testing',
      'Data quality validation',
      'Performance testing',
      'Security testing'
    ]
  },
  {
    step: 6,
    title: 'Deployment & Monitoring',
    description: 'Deploy to production with comprehensive monitoring and maintenance.',
    details: [
      'Production deployment',
      'Monitoring setup',
      'Alerting configuration',
      'Documentation delivery'
    ]
  }
]

const techStack = {
  'Data Processing': [
    'Apache Spark',
    'Apache Kafka',
    'Apache Airflow',
    'Apache Beam',
    'Databricks',
    'Snowflake'
  ],
  'Cloud Platforms': [
    'AWS (S3, Redshift, EMR)',
    'Google Cloud (BigQuery, Dataflow)',
    'Azure (Synapse, Data Factory)',
    'Kubernetes',
    'Docker',
    'Terraform'
  ],
  'Databases': [
    'PostgreSQL',
    'MongoDB',
    'Cassandra',
    'Redis',
    'Elasticsearch',
    'ClickHouse'
  ],
  'Programming': [
    'Python',
    'Scala',
    'Java',
    'SQL',
    'R',
    'Go'
  ]
}

const caseStudies = [
  {
    title: 'Real-Time Analytics Platform',
    client: 'E-commerce Giant',
    challenge: 'Needed real-time customer behavior analytics to personalize shopping experiences across millions of users.',
    solution: 'Built scalable streaming data pipeline using Kafka, Spark, and cloud infrastructure for real-time processing.',
    results: [
      '99.9% uptime for real-time processing',
      '50ms average processing latency',
      '300% increase in personalization accuracy',
      '$5M annual revenue increase'
    ],
    technologies: ['Apache Kafka', 'Spark Streaming', 'AWS Kinesis', 'Redis', 'Elasticsearch']
  },
  {
    title: 'Healthcare Data Warehouse',
    client: 'Hospital Network',
    challenge: 'Fragmented patient data across multiple systems hindering clinical decision-making and research.',
    solution: 'Implemented HIPAA-compliant data warehouse with automated ETL processes and real-time data integration.',
    results: [
      '90% reduction in data retrieval time',
      'HIPAA compliance achieved',
      '95% data accuracy improvement',
      'Integration of 15+ source systems'
    ],
    technologies: ['Snowflake', 'Apache Airflow', 'Python', 'FHIR APIs', 'Tableau']
  },
  {
    title: 'Financial Risk Analytics',
    client: 'Investment Bank',
    challenge: 'Required real-time risk calculation and regulatory reporting across global trading operations.',
    solution: 'Built high-performance data pipeline for real-time risk calculations with automated regulatory reporting.',
    results: [
      '10x faster risk calculations',
      'Real-time regulatory compliance',
      '99.99% data accuracy',
      '$10M operational cost savings'
    ],
    technologies: ['Apache Spark', 'Kafka', 'ClickHouse', 'Python', 'Kubernetes']
  }
]

const faqs = [
  {
    question: 'What is data engineering and why is it important?',
    answer: 'Data engineering involves designing, building, and maintaining the infrastructure and systems that collect, store, and process data. It\'s crucial because it provides the foundation for analytics, machine learning, and data-driven decision making. Without proper data engineering, organizations struggle with data quality, accessibility, and scalability issues.'
  },
  {
    question: 'How do you ensure data quality in your pipelines?',
    answer: 'We implement comprehensive data quality measures including validation rules, schema enforcement, anomaly detection, data profiling, and automated testing. We also establish data lineage tracking and implement monitoring systems that alert on quality issues in real-time.'
  },
  {
    question: 'What\'s the difference between ETL and ELT?',
    answer: 'ETL (Extract, Transform, Load) transforms data before loading it into the destination, while ELT (Extract, Load, Transform) loads raw data first and transforms it in the destination system. ELT is often preferred for cloud data warehouses as it leverages their processing power and allows for more flexible transformations.'
  },
  {
    question: 'How do you handle real-time data processing requirements?',
    answer: 'We use streaming technologies like Apache Kafka, Spark Streaming, and cloud-native services (AWS Kinesis, Google Pub/Sub) to process data in real-time. We design event-driven architectures that can handle high-velocity data streams with low latency and high reliability.'
  },
  {
    question: 'Can you work with our existing data infrastructure?',
    answer: 'Yes, we specialize in working with existing systems and can integrate with your current infrastructure. We assess your current setup, identify improvement opportunities, and implement solutions that enhance rather than replace your existing investments where possible.'
  },
  {
    question: 'How do you ensure data security and compliance?',
    answer: 'We implement comprehensive security measures including encryption at rest and in transit, access controls, audit logging, and compliance frameworks (GDPR, HIPAA, SOX). We follow security best practices and can implement industry-specific compliance requirements.'
  },
  {
    question: 'What cloud platforms do you work with?',
    answer: 'We work with all major cloud platforms including AWS, Google Cloud, and Microsoft Azure. We can also implement multi-cloud and hybrid solutions based on your requirements. Our approach is cloud-agnostic, focusing on the best solution for your specific needs.'
  },
  {
    question: 'How do you handle data pipeline monitoring and maintenance?',
    answer: 'We implement comprehensive monitoring using tools like Apache Airflow, Prometheus, and cloud-native monitoring services. We set up alerting for failures, performance issues, and data quality problems. We also provide ongoing maintenance and optimization services.'
  }
]

export default function DataEngineeringServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero
        title="Data Engineering Services"
        subtitle="Build Scalable Data Infrastructure"
        description="Transform your data into a strategic asset with robust data engineering solutions. From real-time pipelines to cloud data warehouses, we build the foundation for data-driven success."
        primaryCTA={{
          text: "Start Your Data Project",
          href: "/contact"
        }}
        secondaryCTA={{
          text: "Explore Our Services",
          href: "#features"
        }}
        backgroundImage="/images/data-engineering-hero.jpg"
      />

      <ServiceFeatures
        title="Comprehensive Data Engineering Solutions"
        subtitle="End-to-End Data Infrastructure Services"
        features={features}
      />

      <ProcessSteps
        title="Our Data Engineering Process"
        subtitle="Systematic Approach to Data Excellence"
        steps={processSteps}
      />

      <TechStack
        title="Advanced Data Technology Stack"
        subtitle="Cutting-Edge Tools and Platforms"
        categories={techStack}
      />

      <CaseStudies
        title="Data Engineering Success Stories"
        subtitle="Real Results from Real Projects"
        caseStudies={caseStudies}
      />

      <FAQ
        title="Data Engineering FAQ"
        subtitle="Common Questions About Data Engineering"
        faqs={faqs}
      />

      <CTA
        title="Ready to Transform Your Data Infrastructure?"
        description="Let's build scalable, reliable data systems that power your analytics and machine learning initiatives."
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
