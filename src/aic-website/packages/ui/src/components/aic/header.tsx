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
          return 'border-b-[#00BCD4]/20 bg-white/95'
        case 'enterprise':
          return 'border-b-[#1A237E]/20 bg-white/95'
        case 'nexus':
          return 'border-b-[#37474F]/20 bg-white/95'
        case 'investors':
          return 'border-b-[#1A237E]/30 bg-white/98'
        case 'admin':
          return 'border-b-gray-200 bg-gray-50/95'
        default:
          return 'border-b-gray-200 bg-white/95'
      }
    }

    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
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
