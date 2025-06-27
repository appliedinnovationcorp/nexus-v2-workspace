import { Button } from './ui/button'
import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/hero-image-2.png')"
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 w-full h-full bg-black/50" />
      
      {/* Content */}
      <div className="relative z-10 flex h-full w-full items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Transforming Business with{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
              AI Innovation
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl sm:text-2xl lg:text-3xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            Applied Innovation Corporation delivers enterprise-grade AI consulting, 
            our flagship Nexus PaaS platform, and fractional CTO services.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg" 
              asChild 
              className="text-lg px-8 py-4 h-auto rounded-full"
              style={{
                backgroundImage: 'linear-gradient(96.69deg, #6714cc 4.32%, #2673fb 92.12%)'
              }}
            >
              <Link href="/contact" className="flex items-center space-x-2">
                <span>Get Started</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="text-lg px-8 py-4 h-auto rounded-full border-white text-black bg-white hover:bg-white/90 hover:text-black transition-all duration-300"
            >
              <Link href="#core-services" className="flex items-center space-x-2">
                <Play className="h-5 w-5" />
                <span>Learn More</span>
              </Link>
            </Button>
          </div>
          
          {/* Optional: Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Optional: Animated elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
    </section>
  )
}
