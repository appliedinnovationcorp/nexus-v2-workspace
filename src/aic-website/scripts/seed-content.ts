#!/usr/bin/env tsx
/**
 * Content Seeding Script for AIC Website
 * Seeds the CMS with initial content for all divisions
 */

import { MongoClient } from 'mongodb'
import { MeilisearchClient } from '../packages/ai-sdk/src/search/meilisearch-client'
import { SearchConfigFactory } from '../packages/ai-sdk/src/config/ai-config'

// Sample content data
const samplePages = [
  {
    title: 'Applied Innovation Corporation - Transforming Business Through AI',
    slug: 'home',
    division: 'general',
    status: 'published',
    hero: {
      type: 'gradient',
      title: 'Transforming Business with AI-driven Innovation',
      subtitle: 'Applied Innovation Corporation delivers enterprise-grade AI consulting, our flagship Nexus PaaS platform, and fractional CTO services to transform businesses of all sizes.',
      ctaButtons: [
        { text: 'Get Started', url: '/contact', style: 'primary' },
        { text: 'Learn More', url: '/about', style: 'outline' }
      ]
    },
    sections: [
      {
        type: 'featureGrid',
        featureGrid: {
          title: 'Our Core Services',
          subtitle: 'Comprehensive AI solutions designed to accelerate your digital transformation journey',
          features: [
            {
              icon: 'brain',
              title: 'AI Consulting & Transformation',
              description: 'End-to-end AI strategy, implementation, and transformation services tailored to your business needs.',
              link: '/services/consulting'
            },
            {
              icon: 'zap',
              title: 'Nexus Platform',
              description: 'Our flagship AI PaaS solution providing scalable, enterprise-grade AI infrastructure and tools.',
              link: 'https://nexus.aicorp.com'
            },
            {
              icon: 'users',
              title: 'Fractional CTO Services',
              description: 'Executive-level AI leadership and strategic guidance for organizations of all sizes.',
              link: '/services/fractional-cto'
            }
          ]
        }
      },
      {
        type: 'ctaSection',
        ctaSection: {
          title: 'Ready to Transform Your Business with AI?',
          description: 'Join hundreds of companies that have accelerated their growth with our AI solutions.',
          buttons: [
            { text: 'Book a Consultation', url: '/contact', style: 'primary' },
            { text: 'Try Nexus Platform', url: 'https://nexus.aicorp.com', style: 'outline' }
          ],
          backgroundColor: 'primary-gradient'
        }
      }
    ],
    seo: {
      title: 'Applied Innovation Corporation - AI Consulting & Transformation',
      description: 'Leading AI consulting company providing transformation services, Nexus PaaS platform, and fractional CTO services for SMBs and enterprises.',
      keywords: 'AI consulting, artificial intelligence, AI transformation, Nexus PaaS, fractional CTO, machine learning'
    }
  },
  {
    title: 'AI Solutions for Small & Medium Businesses',
    slug: 'smb-home',
    division: 'smb',
    status: 'published',
    hero: {
      type: 'default',
      title: 'AI Solutions Built for Small & Medium Businesses',
      subtitle: 'Affordable, scalable AI transformation that delivers immediate ROI for growing businesses.',
      ctaButtons: [
        { text: 'Get Started', url: '/contact', style: 'primary' },
        { text: 'View Pricing', url: '/pricing', style: 'outline' }
      ]
    },
    sections: [
      {
        type: 'textBlock',
        textBlock: {
          title: 'Why SMBs Choose AIC',
          content: 'We understand the unique challenges facing small and medium businesses. Our AI solutions are designed to be affordable, easy to implement, and deliver measurable results quickly.',
          alignment: 'center'
        }
      },
      {
        type: 'featureGrid',
        featureGrid: {
          title: 'SMB-Focused Solutions',
          features: [
            {
              icon: 'dollar-sign',
              title: 'Affordable Packages',
              description: 'AI transformation packages designed for SMB budgets with flexible payment options.'
            },
            {
              icon: 'clock',
              title: 'Rapid Implementation',
              description: 'Get up and running with AI solutions in weeks, not months.'
            },
            {
              icon: 'trending-up',
              title: 'Proven ROI',
              description: 'Our SMB clients see average ROI of 300% within the first year.'
            }
          ]
        }
      }
    ],
    seo: {
      title: 'AI Solutions for Small & Medium Businesses | AIC',
      description: 'Affordable AI transformation services designed specifically for SMBs. Get started with AI consulting, automation, and our Nexus platform.',
      keywords: 'SMB AI solutions, small business AI, affordable AI consulting, AI automation for SMBs'
    }
  },
  {
    title: 'Enterprise AI Transformation at Scale',
    slug: 'enterprise-home',
    division: 'enterprise',
    status: 'published',
    hero: {
      type: 'gradient',
      title: 'AI at Enterprise Scale',
      subtitle: 'Comprehensive AI transformation for large enterprises with focus on security, compliance, and scalability.',
      ctaButtons: [
        { text: 'Schedule Consultation', url: '/contact', style: 'primary' },
        { text: 'View Case Studies', url: '/case-studies', style: 'outline' }
      ]
    },
    sections: [
      {
        type: 'featureGrid',
        featureGrid: {
          title: 'Enterprise-Grade Solutions',
          features: [
            {
              icon: 'shield',
              title: 'Security & Compliance',
              description: 'SOC 2, GDPR, and industry-specific compliance built into every solution.'
            },
            {
              icon: 'layers',
              title: 'Scalable Architecture',
              description: 'AI infrastructure that scales with your enterprise needs and growth.'
            },
            {
              icon: 'settings',
              title: 'Custom Integration',
              description: 'Seamless integration with existing enterprise systems and workflows.'
            }
          ]
        }
      }
    ],
    seo: {
      title: 'Enterprise AI Transformation | Applied Innovation Corporation',
      description: 'Enterprise-scale AI transformation services with focus on security, compliance, and scalability. Custom AI solutions for large organizations.',
      keywords: 'enterprise AI, AI transformation, enterprise AI consulting, scalable AI solutions, AI compliance'
    }
  }
]

const sampleBlogPosts = [
  {
    title: 'The Future of AI in Business Transformation',
    slug: 'future-ai-business-transformation',
    excerpt: 'Exploring how AI is reshaping business operations and creating new opportunities for growth and innovation.',
    content: `
# The Future of AI in Business Transformation

Artificial Intelligence is no longer a futuristic concept—it's a present reality that's transforming how businesses operate, compete, and grow. As we look toward the future, the integration of AI into business processes is becoming not just advantageous, but essential for survival in an increasingly competitive marketplace.

## The Current State of AI Adoption

Today's businesses are experiencing an AI revolution. From small startups to Fortune 500 companies, organizations are leveraging AI to:

- Automate routine tasks and processes
- Enhance decision-making with data-driven insights
- Improve customer experiences through personalization
- Optimize operations and reduce costs
- Drive innovation and create new revenue streams

## Key Trends Shaping the Future

### 1. Democratization of AI

AI tools are becoming more accessible to businesses of all sizes. No longer confined to tech giants with massive budgets, AI solutions are now available as affordable, user-friendly platforms that SMBs can implement quickly.

### 2. Edge AI and Real-Time Processing

The shift toward edge computing is enabling real-time AI processing, reducing latency and improving performance for applications that require immediate responses.

### 3. Explainable AI

As AI becomes more prevalent in critical business decisions, the need for transparency and explainability grows. Future AI systems will provide clear insights into their decision-making processes.

## Preparing Your Business for the AI Future

To stay competitive, businesses must:

1. **Develop an AI Strategy**: Create a comprehensive plan for AI adoption aligned with business objectives
2. **Invest in Data Infrastructure**: Ensure high-quality, accessible data to fuel AI initiatives
3. **Build AI Literacy**: Train teams to work effectively with AI tools and understand their capabilities
4. **Start Small, Scale Fast**: Begin with pilot projects and expand successful implementations
5. **Partner with Experts**: Work with experienced AI consultants to navigate the transformation journey

## The AIC Advantage

At Applied Innovation Corporation, we help businesses navigate this AI transformation with:

- **Strategic AI Consulting**: Develop comprehensive AI strategies tailored to your industry and goals
- **Nexus Platform**: Our flagship PaaS solution that makes AI implementation accessible and scalable
- **Fractional CTO Services**: Executive-level guidance for AI initiatives and digital transformation

The future of business is AI-driven. The question isn't whether to adopt AI, but how quickly and effectively you can integrate it into your operations. Contact us today to begin your AI transformation journey.
    `,
    tags: ['AI', 'Business Transformation', 'Digital Innovation', 'Strategy'],
    category: 'thought-leadership',
    status: 'published',
    publishedAt: new Date('2024-01-15').toISOString(),
    seo: {
      title: 'The Future of AI in Business Transformation | AIC Blog',
      description: 'Discover how AI is reshaping business operations and learn strategies for successful AI transformation in your organization.',
      keywords: 'AI business transformation, artificial intelligence strategy, AI adoption, business AI trends'
    }
  },
  {
    title: 'SMB Guide: Getting Started with AI on a Budget',
    slug: 'smb-ai-budget-guide',
    excerpt: 'A practical guide for small and medium businesses to implement AI solutions without breaking the bank.',
    content: `
# SMB Guide: Getting Started with AI on a Budget

Small and medium businesses often feel left behind in the AI revolution, assuming that artificial intelligence is only for large corporations with massive budgets. This couldn't be further from the truth. Today's AI landscape offers numerous affordable solutions that can deliver significant value to SMBs.

## Why SMBs Need AI Now

The competitive landscape is changing rapidly. Businesses that embrace AI early gain significant advantages:

- **Operational Efficiency**: Automate repetitive tasks and free up human resources for strategic work
- **Better Decision Making**: Use data analytics to make informed business decisions
- **Enhanced Customer Experience**: Provide personalized service that rivals larger competitors
- **Cost Reduction**: Streamline operations and reduce overhead costs
- **Competitive Advantage**: Stay ahead of competitors who haven't adopted AI

## Budget-Friendly AI Solutions for SMBs

### 1. Customer Service Automation
- **Chatbots**: Handle common customer inquiries 24/7
- **Email Automation**: Personalized email campaigns based on customer behavior
- **Cost**: $50-500/month depending on volume

### 2. Marketing Intelligence
- **Social Media Management**: AI-powered content scheduling and optimization
- **Lead Scoring**: Identify high-potential prospects automatically
- **Cost**: $100-1000/month

### 3. Operations Optimization
- **Inventory Management**: Predict demand and optimize stock levels
- **Scheduling**: AI-powered employee and resource scheduling
- **Cost**: $200-800/month

## Implementation Strategy for SMBs

### Phase 1: Assessment (Month 1)
- Identify pain points and opportunities
- Evaluate current data and systems
- Set realistic goals and budget

### Phase 2: Pilot Project (Months 2-3)
- Start with one high-impact, low-risk AI solution
- Measure results and gather feedback
- Refine approach based on learnings

### Phase 3: Scale (Months 4-6)
- Expand successful implementations
- Add complementary AI solutions
- Train team on new tools and processes

## Common Mistakes to Avoid

1. **Trying to Do Everything at Once**: Start small and scale gradually
2. **Ignoring Data Quality**: Ensure clean, organized data before implementing AI
3. **Lack of Training**: Invest in team education and change management
4. **Unrealistic Expectations**: Set achievable goals and timelines
5. **Going It Alone**: Consider partnering with AI experts for guidance

## How AIC Helps SMBs Succeed with AI

Our SMB-focused approach includes:

- **Affordable Packages**: AI transformation solutions designed for SMB budgets
- **Rapid Implementation**: Get results in weeks, not months
- **Ongoing Support**: Continuous guidance and optimization
- **Scalable Solutions**: Grow your AI capabilities as your business expands

## Getting Started

Ready to begin your AI journey? Here's what to do next:

1. **Assess Your Needs**: Identify the biggest challenges AI could solve
2. **Start Small**: Choose one area for your first AI implementation
3. **Get Expert Help**: Partner with experienced AI consultants
4. **Measure Success**: Track ROI and business impact
5. **Scale Gradually**: Expand AI use as you see results

Don't let budget constraints hold your business back from the AI revolution. With the right approach and partners, SMBs can successfully implement AI solutions that drive real business value.

Contact AIC today to learn how we can help your SMB get started with AI on a budget that works for you.
    `,
    tags: ['SMB', 'AI Implementation', 'Budget', 'Small Business'],
    category: 'how-to',
    status: 'published',
    publishedAt: new Date('2024-01-20').toISOString(),
    seo: {
      title: 'SMB AI Implementation Guide: Getting Started on a Budget | AIC',
      description: 'Learn how small and medium businesses can implement AI solutions affordably with this comprehensive budget-friendly guide.',
      keywords: 'SMB AI, affordable AI solutions, small business AI, AI on a budget, AI implementation guide'
    }
  }
]

const sampleCaseStudies = [
  {
    title: 'Manufacturing Company Increases Efficiency by 40% with AI Automation',
    slug: 'manufacturing-ai-automation-case-study',
    client: 'TechManufacturing Inc.',
    industry: 'Manufacturing',
    challenge: 'Manual quality control processes were slow and inconsistent, leading to increased defect rates and production delays.',
    solution: 'Implemented AI-powered computer vision system for automated quality control and predictive maintenance.',
    results: [
      '40% increase in production efficiency',
      '60% reduction in defect rates',
      '25% decrease in maintenance costs',
      'ROI achieved within 8 months'
    ],
    content: `
# Manufacturing AI Transformation: A Success Story

## The Challenge

TechManufacturing Inc., a mid-sized manufacturing company, was struggling with quality control issues that were impacting their bottom line. Their manual inspection processes were:

- Time-consuming and labor-intensive
- Prone to human error and inconsistency
- Creating bottlenecks in production
- Leading to increased customer complaints

## Our Approach

AIC worked closely with TechManufacturing to develop a comprehensive AI solution:

### Phase 1: Assessment and Planning
- Analyzed existing quality control processes
- Identified key pain points and opportunities
- Developed implementation roadmap

### Phase 2: AI System Development
- Deployed computer vision systems for automated inspection
- Integrated predictive maintenance algorithms
- Created real-time monitoring dashboard

### Phase 3: Training and Optimization
- Trained staff on new AI systems
- Fine-tuned algorithms based on production data
- Established continuous improvement processes

## The Results

The transformation exceeded expectations:

- **Production Efficiency**: 40% increase in overall efficiency
- **Quality Improvement**: 60% reduction in defect rates
- **Cost Savings**: 25% decrease in maintenance costs
- **ROI**: Full return on investment within 8 months

## Key Success Factors

1. **Executive Buy-in**: Strong leadership support throughout the project
2. **Employee Engagement**: Comprehensive training and change management
3. **Data Quality**: Investment in clean, organized production data
4. **Continuous Improvement**: Ongoing optimization and refinement

## Client Testimonial

"Working with AIC transformed our manufacturing operations. The AI solutions they implemented not only improved our quality control but also gave us insights we never had before. The ROI was faster than we expected, and our customers have noticed the improvement in product quality." - *John Smith, CEO, TechManufacturing Inc.*

This case study demonstrates how AI can transform traditional manufacturing processes, delivering measurable business value and competitive advantage.
    `,
    tags: ['Manufacturing', 'AI Automation', 'Quality Control', 'Case Study'],
    division: 'enterprise',
    status: 'published',
    publishedAt: new Date('2024-01-10').toISOString()
  }
]

async function seedContent() {
  try {
    console.log('🌱 Starting content seeding process...')

    // Connect to MongoDB
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://aicadmin:password@localhost:27017/aicwebsite'
    const client = new MongoClient(mongoUrl)
    await client.connect()
    const db = client.db()

    console.log('📄 Seeding pages...')
    const pagesCollection = db.collection('pages')
    await pagesCollection.deleteMany({}) // Clear existing pages
    await pagesCollection.insertMany(samplePages.map(page => ({
      ...page,
      createdAt: new Date(),
      updatedAt: new Date()
    })))

    console.log('📝 Seeding blog posts...')
    const blogCollection = db.collection('blog-posts')
    await blogCollection.deleteMany({}) // Clear existing posts
    await blogCollection.insertMany(sampleBlogPosts.map(post => ({
      ...post,
      createdAt: new Date(),
      updatedAt: new Date()
    })))

    console.log('📊 Seeding case studies...')
    const caseStudiesCollection = db.collection('case-studies')
    await caseStudiesCollection.deleteMany({}) // Clear existing case studies
    await caseStudiesCollection.insertMany(sampleCaseStudies.map(study => ({
      ...study,
      createdAt: new Date(),
      updatedAt: new Date()
    })))

    // Initialize search index
    console.log('🔍 Initializing search index...')
    try {
      const searchConfig = SearchConfigFactory.createMeilisearchConfig()
      const searchClient = new MeilisearchClient(searchConfig)
      await searchClient.initialize()

      // Index pages
      const pageDocuments = samplePages.map((page, index) => ({
        id: `page-${page.slug}`,
        title: page.title,
        content: page.sections?.map(s => 
          s.textBlock?.content || 
          s.featureGrid?.title + ' ' + s.featureGrid?.subtitle ||
          s.ctaSection?.title + ' ' + s.ctaSection?.description || ''
        ).join(' ') || '',
        url: page.division === 'general' ? `/${page.slug}` : `/${page.division}/${page.slug}`,
        category: 'page',
        division: page.division,
        tags: [],
        createdAt: new Date().toISOString(),
        metadata: {
          type: 'page',
          status: page.status
        }
      }))

      // Index blog posts
      const blogDocuments = sampleBlogPosts.map(post => ({
        id: `blog-${post.slug}`,
        title: post.title,
        content: post.content,
        url: `/blog/${post.slug}`,
        category: 'blog',
        division: 'general',
        tags: post.tags,
        createdAt: post.publishedAt,
        metadata: {
          type: 'blog-post',
          excerpt: post.excerpt,
          category: post.category
        }
      }))

      // Index case studies
      const caseStudyDocuments = sampleCaseStudies.map(study => ({
        id: `case-study-${study.slug}`,
        title: study.title,
        content: study.content,
        url: `/case-studies/${study.slug}`,
        category: 'case-study',
        division: study.division,
        tags: study.tags,
        createdAt: study.publishedAt,
        metadata: {
          type: 'case-study',
          client: study.client,
          industry: study.industry
        }
      }))

      await searchClient.bulkAddDocuments([
        ...pageDocuments,
        ...blogDocuments,
        ...caseStudyDocuments
      ])

      console.log('✅ Search index populated successfully')
    } catch (searchError) {
      console.warn('⚠️ Search indexing failed (this is okay for development):', searchError.message)
    }

    await client.close()

    console.log('🎉 Content seeding completed successfully!')
    console.log(`
📊 Seeded Content Summary:
- ${samplePages.length} pages
- ${sampleBlogPosts.length} blog posts  
- ${sampleCaseStudies.length} case studies
- Search index populated

🚀 Your AIC website is now ready with sample content!
    `)

  } catch (error) {
    console.error('❌ Content seeding failed:', error)
    process.exit(1)
  }
}

// Run the seeding script
if (require.main === module) {
  seedContent()
}

export { seedContent }
