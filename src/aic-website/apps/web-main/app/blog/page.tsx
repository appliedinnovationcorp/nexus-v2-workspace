import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Calendar, Clock, User, Tag } from 'lucide-react'

export const metadata = {
  title: 'AI Insights Blog - Applied Innovation Corporation',
  description: 'Latest insights, trends, and best practices in AI for SMBs. Expert analysis and practical guidance for AI transformation.',
}

export default function BlogPage() {
  const featuredPost = {
    title: "The SMB Guide to AI Implementation: 5 Steps to Success",
    excerpt: "A comprehensive guide for small and medium businesses looking to implement AI solutions that drive real business value. Learn the proven framework that has helped hundreds of SMBs transform their operations.",
    author: "Applied Innovation Team",
    date: "2025-06-20",
    readTime: "8 min read",
    category: "AI Strategy",
    image: "/images/blog/ai-implementation-guide.jpg",
    slug: "smb-guide-ai-implementation-5-steps"
  }

  const blogPosts = [
    {
      title: "Why 2025 is the Year SMBs Must Embrace AI",
      excerpt: "Market forces are creating unprecedented opportunities for SMBs to gain competitive advantages through AI. Here's why waiting is no longer an option.",
      author: "Sarah Chen",
      date: "2025-06-18",
      readTime: "5 min read",
      category: "Market Trends",
      image: "/images/blog/2025-ai-trends.jpg",
      slug: "2025-year-smbs-embrace-ai"
    },
    {
      title: "ROI Calculator: Measuring AI Success in Your Business",
      excerpt: "Learn how to calculate and track ROI for your AI initiatives. Includes a free downloadable calculator and real-world examples.",
      author: "Michael Rodriguez",
      date: "2025-06-15",
      readTime: "6 min read",
      category: "Business Value",
      image: "/images/blog/ai-roi-calculator.jpg",
      slug: "roi-calculator-measuring-ai-success"
    },
    {
      title: "Customer Service AI: Beyond Chatbots",
      excerpt: "Discover advanced AI applications for customer service that go far beyond simple chatbots. Real examples from successful SMB implementations.",
      author: "Jennifer Park",
      date: "2025-06-12",
      readTime: "7 min read",
      category: "Customer Experience",
      image: "/images/blog/customer-service-ai.jpg",
      slug: "customer-service-ai-beyond-chatbots"
    },
    {
      title: "Data Privacy in AI: A Practical Guide for SMBs",
      excerpt: "Navigate the complex landscape of AI data privacy and compliance. Essential guidelines for protecting customer data while leveraging AI.",
      author: "David Kim",
      date: "2025-06-10",
      readTime: "9 min read",
      category: "Compliance",
      image: "/images/blog/ai-data-privacy.jpg",
      slug: "data-privacy-ai-practical-guide-smbs"
    },
    {
      title: "AI-Powered Inventory Management: Case Study",
      excerpt: "How a mid-size retailer reduced inventory costs by 35% using AI-powered demand forecasting and automated reordering systems.",
      author: "Lisa Thompson",
      date: "2025-06-08",
      readTime: "6 min read",
      category: "Case Study",
      image: "/images/blog/ai-inventory-management.jpg",
      slug: "ai-powered-inventory-management-case-study"
    },
    {
      title: "The Future of Work: AI and Human Collaboration",
      excerpt: "Explore how AI is reshaping the workplace and creating new opportunities for human-AI collaboration in SMBs.",
      author: "Robert Johnson",
      date: "2025-06-05",
      readTime: "8 min read",
      category: "Future of Work",
      image: "/images/blog/future-work-ai-human.jpg",
      slug: "future-work-ai-human-collaboration"
    }
  ]

  const categories = [
    "All Posts",
    "AI Strategy",
    "Market Trends", 
    "Business Value",
    "Customer Experience",
    "Case Studies",
    "Compliance",
    "Future of Work"
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              AI Insights for SMBs
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Expert insights, practical guidance, and real-world examples to help you navigate your AI transformation journey.
            </p>
            <Button size="xl" variant="default" asChild className="bg-white text-[#1A237E] hover:bg-gray-100">
              <Link href="/contact">
                Get AI Guidance <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Article</h2>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-[#1A237E]/10 to-[#00BCD4]/10 p-8 lg:p-12 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <div className="text-white text-4xl font-bold">AI</div>
                    </div>
                    <div className="inline-block px-3 py-1 bg-[#00BCD4] text-white rounded-full text-sm font-medium">
                      Featured
                    </div>
                  </div>
                </div>
                
                <div className="p-8 lg:p-12">
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <span className="inline-block px-3 py-1 bg-[#00BCD4]/10 text-[#00BCD4] rounded-full font-medium">
                      {featuredPost.category}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(featuredPost.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{featuredPost.readTime}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                    {featuredPost.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <User className="h-4 w-4" />
                      <span>{featuredPost.author}</span>
                    </div>
                    
                    <Button variant="outline" className="border-[#00BCD4] text-[#00BCD4] hover:bg-[#00BCD4] hover:text-white">
                      Read Article <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 md:mb-0">Latest Articles</h2>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 4).map((category, index) => (
                  <button
                    key={index}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      index === 0 
                        ? 'bg-[#00BCD4] text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post, index) => (
                <article key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="h-48 bg-gradient-to-br from-[#1A237E]/10 to-[#00BCD4]/10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Tag className="h-8 w-8 text-white" />
                      </div>
                      <span className="text-sm text-gray-600">{post.category}</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        <span>{post.author}</span>
                      </div>
                      
                      <Link 
                        href={`/blog/${post.slug}`}
                        className="text-[#00BCD4] hover:text-[#1A237E] font-medium text-sm transition-colors"
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            
            {/* Load More Button */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" className="border-[#00BCD4] text-[#00BCD4] hover:bg-[#00BCD4] hover:text-white">
                Load More Articles
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-[#1A237E] to-[#00BCD4] rounded-2xl p-8 lg:p-12 text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Stay Updated with AI Insights</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Get the latest AI trends, case studies, and practical guidance delivered to your inbox weekly.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <Button className="bg-white text-[#1A237E] hover:bg-gray-100 px-6 py-3">
                  Subscribe
                </Button>
              </div>
              
              <p className="text-sm text-blue-100 mt-4">
                No spam. Unsubscribe anytime. Read our privacy policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories & Tags */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Explore by Topic
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(1).map((category, index) => (
                <Link
                  key={index}
                  href={`/blog/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                  className="bg-white rounded-lg p-4 text-center hover:shadow-lg transition-shadow duration-300 group"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-[#00BCD4] transition-colors">
                    {category}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {Math.floor(Math.random() * 10) + 3} articles
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
