import * as React from "react"
import Link from "next/link"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "../ui/navigation-menu"

interface HeaderProps {
  className?: string
  variant?: 'main' | 'smb' | 'enterprise' | 'nexus' | 'investors' | 'admin'
}

const AICLogo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center space-x-2", className)}>
    <div className="w-8 h-8 bg-gradient-to-br from-[#1A237E] to-[#00BCD4] rounded-lg flex items-center justify-center">
      <div className="w-6 h-6 grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={cn(
            "w-1 h-1 rounded-full bg-white",
            i === 4 ? "opacity-100" : "opacity-60"
          )} />
        ))}
      </div>
    </div>
    <span className="text-xl font-bold text-[#1A237E]">AIC</span>
  </div>
)

const navigationItems = {
  main: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Solutions",
      items: [
        { title: "Nexus AI Platform", href: "/solutions/platform", description: "Build and deploy AI applications" },
        { title: "AI Data Management", href: "/solutions/data-management", description: "Manage and optimize AI data" },
        { title: "AI Integration", href: "/solutions/integration", description: "Integrate AI into your business processes" },
        { title: "AI Analytics", href: "/solutions/analytics", description: "Advanced analytics for AI insights" },
        { title: "AI Automation", href: "/solutions/automation", description: "Automate tasks with AI" },
        { title: "AI Compliance", href: "/solutions/compliance", description: "Ensure AI compliance and governance" },
        { title: "AI Custom Solutions", href: "/solutions/custom", description: "Tailored AI solutions for your needs" },
        { title: "AI Training & Support", href: "/solutions/training", description: "Comprehensive AI training and support" },
        { title: "Nexus AI Ecosystem", href: "/solutions/ecosystem", description: "Join our AI ecosystem for collaboration" },
        { title: "Nexus AI Marketplace", href: "/solutions/marketplace", description: "Explore AI applications and services" },
        { title: "Nexus AI Learning Center", href: "/solutions/learning-center", description: "Learn AI with our comprehensive resources" },
        { title: "Nexus AI Certification Programs", href: "/solutions/certification", description: "Get certified in AI technologies" },
        { title: "Nexus AI Startup Support", href: "/solutions/startup-support", description: "Support for AI startups" }
      ]
    },
    {
      title: "About",
      href: "/about",
    },
    {
      title: "Divisions",
      items: [
        { title: "Small & Medium Business", href: "https://smb.aicorp.com", description: "AI solutions tailored for SMBs" },
        { title: "Enterprise", href: "https://enterprise.aicorp.com", description: "Enterprise-scale AI transformation" },
      ]
    },
    {
      title: "Products",
      items: [
        { title: "Nexus Platform", href: "https://nexus.aicorp.com", description: "Our flagship AI PaaS solution" },
        { title: "AI SaaS Tools", href: "/products/saas", description: "Suite of AI-powered SaaS products" },
      ]
    },
    {
      title: "Services",
      items: [
        { title: "AI Consulting & Transformation", href: "/services/consulting", description: "End-to-end AI transformation" },
        { title: "Enablement", href: "/services/enablement", description: "AI training and enablement programs" },
        { title: "Fractional CTO", href: "/services/fractional-cto", description: "Executive AI leadership services" },
        { title: "Generative AI", href: "/services/generative-ai", description: "Generative AI services" },
        { title: "AI Development", href: "/services/ai-development", description: "AI development services" },
        { title: "Data Engineering", href: "/services/data-engineering", description: "Data engineering services" },
        { title: "Gen AI POC Development", href: "/services/gen-ai-poc-development", description: "Gen AI POC development services" },
        { title: "Generative AI Consulting", href: "/services/generative-ai-consulting", description: "Generative AI consulting services" },
        { title: "Enterprise Generative AI", href: "/services/enterprise-generative-ai", description: "Enterprise Generative AI services" },
        { title: "Generative AI Development", href: "/services/generative-ai-development", description: "Generative AI development services" },
        { title: "AI Agent Development", href: "/services/ai-agent-development", description: "AI Agent development services" },
        { title: "LLM Development", href: "/services/llm-development", description: "LLM development services" },
        { title: "Generative AI Integration", href: "/services/generative-ai-integration", description: "Generative AI integration services" },
        { title: "Adaptive AI Development", href: "/services/adaptive-ai-development", description: "Adaptive AI development services" },
        { title: "ChatGPT Developers", href: "/services/chatgpt-developers", description: "ChatGPT development services" },
        { title: "Hire Prompt Engineers", href: "/services/hire-prompt-engineers", description: "Prompt engineering services" },
        { title: "ChatGPT Integration Services", href: "/services/chatgpt-integration-services", description: "ChatGPT integration services" },
        { title: "AI Development Services", href: "/services/ai-development-services", description: "Comprehensive AI development services" },
        { title: "AI POC Development", href: "/services/ai-poc-development", description: "AI POC Development" },
        { title: "AI Consulting Services", href: "/services/ai-consulting-services", description: "AI Consulting Services" },
        { title: "AI Chatbot Development", href: "/services/ai-chatbot-development", description: "AI Chatbot Development" },
        { title: "AI Development Services", href: "/services/ai-development-services", description: "AI Development Services" },
        { title: "Conversational AI Development", href: "/services/conversational-ai-development", description: "Conversational AI Development" },
        { title: "Enterprise AI Development", href: "/services/enterprise-ai-development", description: "Enterprise AI Development" },
        { title: "AI Software Development Lifecycle", href: "/services/ai-software-development-lifecycle", description: "AI Software Development Lifecycle" },
        { title: "Enterprise AI Chatbot", href: "/services/enterprise-ai-chatbot", description: "Enterprise AI Chatbot" },
        { title: "Computer Vision Development", href: "/services/computer-vision-development", description: "Computer Vision Development" },
        { title: "AI Automation Services", href: "/services/ai-automation-services", description: "AI Automation Services" },
        { title: "AI Engineers", href: "/services/ai-engineers", description: "AI Engineers" },
        { title: "Data Engineering Services", href: "/services/data-engineering-services", description: "Data engineering services for AI" },
        { title: "Data Engineering Services", href: "/services/data-engineering-services", description: "Data Engineering Services" },
        { title: "ML Model Engineering", href: "/services/ml-model-engineering", description: "ML Model Engineering" },
        { title: "ML Development", href: "/services/ml-development", description: "ML Development" },
        { title: "MLOps Consulting Services", href: "/services/mlops-consulting-services", description: "MLOps Consulting Services" },
        { title: "Cloud Services", href: "/services/cloud-services", description: "Cloud Services" },
      ]
    },
    {
      title: "Thought Leadership",
      items: [
        { title: "Blog", href: "/blog", description: "Latest insights and articles" },
        { title: "Webinars & Videos", href: "/webinars", description: "Educational content and demos" },
        { title: "Resources", href: "/resources", description: "Whitepapers and case studies" },
      ]
    },
    {
      title: "Investor Relations",
      href: "/investors",
    },
    {
      title: "Careers",
      href: "/careers",
    },
  ]
}

export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, variant = 'main', ...props }, ref) => {
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 10)
      }
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const getVariantStyles = () => {
      switch (variant) {
        case 'smb':
          return 'border-b-[#00BCD4]/20 bg-transparent'
        case 'enterprise':
          return 'border-b-[#1A237E]/20 bg-transparent'
        case 'nexus':
          return 'border-b-[#37474F]/20 bg-transparent'
        case 'investors':
          return 'border-b-[#1A237E]/30 bg-transparent'
        case 'admin':
          return 'border-b-gray-200 bg-transparent'
        default:
          return 'border-b-gray-200 bg-transparent'
      }
    }

    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-transparent transition-all duration-300",
          isScrolled ? "shadow-sm" : "",
          getVariantStyles(),
          className
        )}
        {...props}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <AICLogo />
            </Link>

            {/* Navigation */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList>
                {navigationItems.main.map((item) => (
                  <NavigationMenuItem key={item.title}>
                    {item.items ? (
                      <>
                        <NavigationMenuTrigger className="text-sm font-medium">
                          {item.title}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                            {item.items.map((subItem) => (
                              <li key={subItem.title}>
                                <NavigationMenuLink asChild>
                                  <Link
                                    href={subItem.href}
                                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                  >
                                    <div className="text-sm font-medium leading-none">
                                      {subItem.title}
                                    </div>
                                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                      {subItem.description}
                                    </p>
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href!}
                          className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                        >
                          {item.title}
                        </Link>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* CTA Button */}
            <div className="flex items-center space-x-4">
              <Button variant="aic" size="default" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    )
  }
)

Header.displayName = "Header"
