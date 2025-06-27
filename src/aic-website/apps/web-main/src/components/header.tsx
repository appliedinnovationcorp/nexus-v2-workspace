import Link from 'next/link'
import { Button } from './ui/button'
import { ArrowRight } from 'lucide-react'
import { NavigationDropdown } from './navigation-dropdown'
import { ServicesMegamenu } from './services-megamenu'

export function Header() {
  const solutionsItems = [
    { href: '/solutions/enterprise', label: 'Enterprise Solutions' },
    { href: '/solutions/smb', label: 'SMB Solutions' },
    { href: '/solutions/custom', label: 'Custom Solutions' },
  ]

  const industriesItems = [
    { href: '/industries/healthcare', label: 'Healthcare' },
    { href: '/industries/finance', label: 'Finance' },
    { href: '/industries/manufacturing', label: 'Manufacturing' },
  ]

  return (
    <header className="absolute top-0 z-50 w-full bg-transparent">
      <div className="container flex h-[120px] items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-white">
              Applied Innovation Corporation
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-base font-bold">
            {/* Dropdown Menus */}
            <NavigationDropdown title="Solutions" items={solutionsItems} />
            <ServicesMegamenu />
            <NavigationDropdown title="Industries" items={industriesItems} />

            {/* Standard Links */}
            <Link
              href="/work"
              className="transition-colors hover:text-white/80 text-white/90"
            >
              Work
            </Link>
            <Link
              href="/company"
              className="transition-colors hover:text-white/80 text-white/90"
            >
              Company
            </Link>
            <Link
              href="/blog"
              className="transition-colors hover:text-white/80 text-white/90"
            >
              Blog
            </Link>
            <Link
              href="/resources"
              className="transition-colors hover:text-white/80 text-white/90"
            >
              Resources
            </Link>
          </nav>
        </div>
        
        {/* Right-aligned CTA */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button asChild className="flex items-center space-x-2 rounded-full text-white border-0" style={{
              backgroundImage: 'linear-gradient(96.69deg, #6714cc 4.32%, #2673fb 92.12%)'
            }}>
              <Link href="/contact" className="flex items-center space-x-2">
                <span>Contact Us</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
