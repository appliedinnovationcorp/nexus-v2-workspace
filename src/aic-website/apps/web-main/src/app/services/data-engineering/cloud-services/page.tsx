import { Metadata } from 'next'
import { Hero } from '@/components/ui/hero'
import { ServiceFeatures } from '@/components/services/service-features'
import { ProcessSteps } from '@/components/services/process-steps'
import { TechStack } from '@/components/services/tech-stack'
import { CaseStudies } from '@/components/services/case-studies'
import { FAQ } from '@/components/ui/faq'
import { CTA } from '@/components/ui/cta'

export const metadata: Metadata = {
  title: 'Cloud Data Engineering Services | Cloud Data Solutions | AIC',
  description: 'Expert cloud data engineering services. Build scalable cloud data platforms, implement cloud-native data pipelines, and optimize data infrastructure on AWS, Azure, and GCP.',
  keywords: 'cloud data engineering, cloud data platforms, AWS data services, Azure data services, GCP data services, cloud data pipelines, cloud data warehousing',
}

const features = [
  {
    title: 'Cloud Data Platform Design',
    description: 'Design and implement comprehensive cloud data platforms for scalable analytics.',
    icon: '☁️',
    benefits: [
      'Multi-cloud architecture',
      'Serverless data processing',
      'Auto-scaling capabilities',
      'Cost optimization'
    ]
  },
  {
    title: 'Cloud Data Migration',
    description: 'Migrate existing data infrastructure to cloud platforms with minimal disruption.',
    icon: '🔄',
    benefits: [
      'Zero-downtime migration',
      'Data validation',
      'Performance optimization',
      'Risk mitigation'
    ]
  },
  {
    title: 'Serverless Data Processing',
    description: 'Implement serverless data processing solutions for cost-effective scalability.',
    icon: '⚡',
    benefits: [
      'Event-driven processing',
      'Automatic scaling',
      'Pay-per-use pricing',
      'Reduced maintenance'
    ]
  },
  {
    title: 'Cloud Data Warehousing',
    description: 'Build modern cloud data warehouses for analytics and business intelligence.',
    icon: '🏢',
    benefits: [
      'Elastic compute',
      'Columnar storage',
      'Query optimization',
      'BI tool integration'
    ]
  },
  {
    title: 'Real-Time Streaming',
    description: 'Implement cloud-native streaming solutions for real-time data processing.',
    icon: '🌊',
    benefits: [
      'Low-latency processing',
      'Event streaming',
      'Real-time analytics',
      'Fault tolerance'
    ]
  },
  {
    title: 'Data Lake Implementation',
    description: 'Build scalable data lakes for storing and analyzing structured and unstructured data.',
    icon: '🏞️',
    benefits: [
      'Schema-on-read',
      'Multi-format support',
      'Lifecycle management',
      'Security controls'
    ]
  }
]

const processSteps = [
  {
    step: 1,
    title: 'Cloud Strategy & Assessment',
    description: 'Assess current infrastructure and develop cloud data strategy.',
    details: [
      'Current state analysis',
      'Cloud readiness assessment',
      'Cost-benefit analysis',
      'Migration planning'
    ]
  },
  {
    step: 2,
    title: 'Architecture Design',
    description: 'Design cloud-native data architecture optimized for your needs.',
    details: [
      'Reference architecture',
      'Service selection',
      'Security design',
      'Scalability planning'
    ]
  },
  {
    step: 3,
    title: 'Infrastructure Provisioning',
    description: 'Provision and configure cloud infrastructure using Infrastructure as Code.',
    details: [
      'Resource provisioning',
      'Network configuration',
      'Security setup',
      'Monitoring implementation'
    ]
  },
  {
    step: 4,
    title: 'Data Pipeline Development',
    description: 'Build cloud-native data pipelines and processing workflows.',
    details: [
      'Pipeline development',
      'Serverless functions',
      'Workflow orchestration',
      'Error handling'
    ]
  },
  {
    step: 5,
    title: 'Migration & Testing',
    description: 'Execute data migration and comprehensive testing.',
    details: [
      'Data migration',
      'Performance testing',
      'Validation testing',
      'User acceptance testing'
    ]
  },
  {
    step: 6,
    title: 'Optimization & Support',
    description: 'Optimize performance and provide ongoing support.',
    details: [
      'Performance tuning',
      'Cost optimization',
      'Monitoring setup',
      'Support handover'
    ]
  }
]

const techStack = {
  'AWS Services': [
    'Amazon S3',
    'Amazon Redshift',
    'AWS Glue',
    'Amazon Kinesis',
    'AWS Lambda',
    'Amazon EMR'
  ],
  'Azure Services': [
    'Azure Data Lake',
    'Azure Synapse',
    'Azure Data Factory',
    'Azure Stream Analytics',
    'Azure Functions',
    'Azure Databricks'
  ],
  'Google Cloud': [
    'BigQuery',
    'Cloud Storage',
    'Dataflow',
    'Pub/Sub',
    'Cloud Functions',
    'Dataproc'
  ],
  'Infrastructure': [
    'Terraform',
    'CloudFormation',
    'Kubernetes',
    'Docker',
    'Apache Airflow',
    'Prometheus'
  ]
}

const caseStudies = [
  {
    title: 'Multi-Cloud Data Platform',
    client: 'Global Manufacturing Company',
    challenge: 'Needed unified data platform across multiple cloud providers and on-premises systems.',
    solution: 'Built multi-cloud data platform with standardized APIs and cross-cloud data synchronization.',
    results: [
      '70% reduction in data silos',
      '50% faster analytics delivery',
      '40% cost reduction',
      'Unified view across 15+ countries'
    ],
    technologies: ['AWS', 'Azure', 'GCP', 'Terraform', 'Apache Airflow', 'Kubernetes']
  },
  {
    title: 'Serverless Data Lake',
    client: 'Media & Entertainment Company',
    challenge: 'Required scalable solution for processing petabytes of video and metadata.',
    solution: 'Implemented serverless data lake with automated content processing and metadata extraction.',
    results: [
      '90% reduction in infrastructure costs',
      'Automatic scaling to handle traffic spikes',
      'Real-time content analysis',
      'Processing 10TB+ daily'
    ],
    technologies: ['AWS S3', 'AWS Lambda', 'Amazon Kinesis', 'AWS Glue', 'Amazon Rekognition']
  },
  {
    title: 'Real-Time Analytics Platform',
    client: 'Financial Trading Firm',
    challenge: 'Needed real-time market data processing for algorithmic trading decisions.',
    solution: 'Built cloud-native streaming platform with sub-millisecond latency requirements.',
    results: [
      'Sub-10ms processing latency',
      '99.99% system availability',
      'Processing 1M+ events/second',
      '25% improvement in trading performance'
    ],
    technologies: ['Google Cloud Pub/Sub', 'Dataflow', 'BigQuery', 'Cloud Functions', 'Kubernetes']
  }
]

const faqs = [
  {
    question: 'What are the benefits of cloud data engineering over on-premises?',
    answer: 'Cloud data engineering offers scalability, cost efficiency, reduced maintenance, faster deployment, built-in security, disaster recovery, and access to managed services. You pay only for what you use and can scale resources up or down based on demand, while cloud providers handle infrastructure maintenance and updates.'
  },
  {
    question: 'Which cloud platform is best for data engineering?',
    answer: 'The best platform depends on your specific needs, existing infrastructure, and requirements. AWS offers the most comprehensive data services, Google Cloud excels in analytics and ML, while Azure integrates well with Microsoft ecosystems. We can help assess your needs and recommend the optimal platform or multi-cloud approach.'
  },
  {
    question: 'How do you handle data security in the cloud?',
    answer: 'We implement comprehensive security measures including encryption at rest and in transit, identity and access management, network security, audit logging, and compliance frameworks. We follow cloud security best practices and can implement industry-specific compliance requirements like HIPAA, PCI-DSS, or GDPR.'
  },
  {
    question: 'What is the typical cost of cloud data engineering projects?',
    answer: 'Costs vary based on data volume, processing requirements, and complexity. Cloud solutions often reduce total cost of ownership by 30-50% compared to on-premises infrastructure. We provide detailed cost analysis and optimization strategies to ensure you get maximum value from your cloud investment.'
  },
  {
    question: 'How long does cloud migration take?',
    answer: 'Migration timelines depend on data volume, complexity, and requirements. Simple migrations might take 2-3 months, while complex enterprise migrations can take 6-12 months. We use phased approaches to minimize disruption and deliver value incrementally throughout the migration process.'
  },
  {
    question: 'Can you implement multi-cloud or hybrid solutions?',
    answer: 'Yes, we specialize in multi-cloud and hybrid architectures that leverage the best services from each provider while avoiding vendor lock-in. We can design solutions that span multiple clouds or integrate cloud services with on-premises infrastructure based on your requirements.'
  },
  {
    question: 'How do you ensure high availability and disaster recovery?',
    answer: 'We design resilient architectures with redundancy across multiple availability zones or regions, implement automated backup and recovery procedures, and establish monitoring and alerting systems. We can achieve 99.9%+ uptime with proper architecture and disaster recovery planning.'
  },
  {
    question: 'Do you provide ongoing cloud infrastructure management?',
    answer: 'Yes, we offer managed services including infrastructure monitoring, performance optimization, cost management, security updates, and 24/7 support. We can provide different levels of managed services based on your needs and internal capabilities.'
  }
]

export default function CloudServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero
        title="Cloud Data Engineering Services"
        subtitle="Scalable Cloud Data Solutions"
        description="Transform your data infrastructure with cloud-native solutions. Build scalable, cost-effective data platforms that grow with your business on AWS, Azure, and Google Cloud."
        primaryCTA={{
          text: "Start Cloud Migration",
          href: "/contact"
        }}
        secondaryCTA={{
          text: "Explore Cloud Solutions",
          href: "#features"
        }}
        backgroundImage="/images/cloud-data-engineering-hero.jpg"
      />

      <ServiceFeatures
        title="Comprehensive Cloud Data Services"
        subtitle="Modern Cloud Data Solutions"
        features={features}
      />

      <ProcessSteps
        title="Cloud Data Engineering Process"
        subtitle="From Strategy to Implementation"
        steps={processSteps}
      />

      <TechStack
        title="Cloud Data Technology Stack"
        subtitle="Leading Cloud Platforms and Services"
        categories={techStack}
      />

      <CaseStudies
        title="Cloud Data Engineering Success Stories"
        subtitle="Real-World Cloud Transformations"
        caseStudies={caseStudies}
      />

      <FAQ
        title="Cloud Data Engineering FAQ"
        subtitle="Common Questions About Cloud Data Solutions"
        faqs={faqs}
      />

      <CTA
        title="Ready to Move Your Data to the Cloud?"
        description="Accelerate your data initiatives with scalable, cost-effective cloud data engineering solutions that deliver results."
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
