'use client'

import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useState, useRef } from 'react'

interface DropdownItem {
  href: string
  label: string
}

interface NavigationDropdownProps {
  title: string
  items: DropdownItem[]
}

export function NavigationDropdown({ title, items }: NavigationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 150) // Small delay to allow moving to dropdown
  }

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 transition-colors hover:text-white/80 text-white/90 font-bold"
      >
        <span>{title}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-0 w-48 bg-black/90 border border-white/20 rounded-md shadow-lg py-2 z-50"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {items.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
