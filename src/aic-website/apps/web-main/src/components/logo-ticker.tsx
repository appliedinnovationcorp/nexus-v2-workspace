'use client'

interface Logo {
  name: string
  src: string
}

interface LogoTickerProps {
  logos: Logo[]
}

export function LogoTicker({ logos }: LogoTickerProps) {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget as HTMLImageElement;
    target.style.display = 'none';
    const fallback = target.nextElementSibling as HTMLElement;
    if (fallback) fallback.style.display = 'block';
  }

  return (
    <div className="relative">
      {/* Gradient overlays for smooth fade effect */}
      <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-gray-50 to-transparent z-10"></div>
      <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-gray-50 to-transparent z-10"></div>
      
      {/* Scrolling logos */}
      <div className="flex animate-logo-scroll">
        {/* First set of logos */}
        <div className="flex items-center justify-center min-w-max">
          {logos.map((logo, index) => (
            <div key={`first-${index}`} className="mx-8 flex-shrink-0">
              <div className="w-32 h-16 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
                <img
                  src={logo.src}
                  alt={`${logo.name} logo`}
                  className="max-w-full max-h-full object-contain"
                  onError={handleImageError}
                />
                <div className="hidden text-gray-500 font-semibold text-lg">
                  {logo.name}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Duplicate set for seamless loop */}
        <div className="flex items-center justify-center min-w-max">
          {logos.map((logo, index) => (
            <div key={`second-${index}`} className="mx-8 flex-shrink-0">
              <div className="w-32 h-16 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
                <img
                  src={logo.src}
                  alt={`${logo.name} logo`}
                  className="max-w-full max-h-full object-contain"
                  onError={handleImageError}
                />
                <div className="hidden text-gray-500 font-semibold text-lg">
                  {logo.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
