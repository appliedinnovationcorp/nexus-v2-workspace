'use client'

import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useState, useRef } from 'react'

export function ServicesMegamenu() {
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

  const servicesData = {
    'Generative AI': [
      { href: '/services/generative-ai/poc-development', label: 'Gen AI POC Development' },
      { href: '/services/generative-ai/consulting', label: 'Generative AI Consulting' },
      { href: '/services/generative-ai/enterprise', label: 'Enterprise Generative AI' },
      { href: '/services/generative-ai/development', label: 'Generative AI Development' },
      { href: '/services/generative-ai/ai-agent-development', label: 'AI Agent Development' },
      { href: '/services/generative-ai/llm-development', label: 'LLM Development' },
      { href: '/services/generative-ai/integration', label: 'Generative AI Integration' },
      { href: '/services/generative-ai/adaptive-ai', label: 'Adaptive AI Development' },
      { href: '/services/generative-ai/chatgpt-developers', label: 'ChatGPT Developers' },
      { href: '/services/generative-ai/prompt-engineers', label: 'Hire Prompt Engineers' },
      { href: '/services/generative-ai/chatgpt-integration', label: 'ChatGPT Integration Services' },
    ],
    'AI Development': [
      { href: '/services/ai-development/poc-development', label: 'AI POC Development' },
      { href: '/services/ai-development/consulting', label: 'AI Consulting Services' },
      { href: '/services/ai-development/chatbot', label: 'AI Chatbot Development' },
      { href: '/services/ai-development/services', label: 'AI Development Services' },
      { href: '/services/ai-development/conversational-ai', label: 'Conversational AI Development' },
      { href: '/services/ai-development/enterprise', label: 'Enterprise AI Development' },
      { href: '/services/ai-development/sdlc', label: 'AI Software Development Lifecycle' },
      { href: '/services/ai-development/enterprise-chatbot', label: 'Enterprise AI Chatbot' },
      { href: '/services/ai-development/computer-vision', label: 'Computer Vision Development' },
      { href: '/services/ai-development/automation', label: 'AI Automation Services' },
      { href: '/services/ai-development/engineers', label: 'AI Engineers' },
    ],
    'Data Engineering': [
      { href: '/services/data-engineering/services', label: 'Data Engineering Services' },
      { href: '/services/data-engineering/ml-model-engineering', label: 'ML Model Engineering' },
      { href: '/services/data-engineering/ml-development', label: 'ML Development' },
      { href: '/services/data-engineering/mlops-consulting', label: 'MLOps Consulting Services' },
      { href: '/services/data-engineering/cloud-services', label: 'Cloud Services' },
    ],
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
        <span>Services</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-0 w-[800px] bg-black/90 border border-white/20 rounded-md shadow-lg p-6 z-50"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="grid grid-cols-3 gap-8">
            {Object.entries(servicesData).map(([category, items]) => (
              <div key={category} className="space-y-3">
                <h3 className="font-semibold text-white border-b border-white/20 pb-2">
                  {category}
                </h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.href}>
                      <Link 
                        href={item.href}
                        className="block text-sm text-white/90 hover:text-white hover:bg-white/10 px-2 py-1 rounded transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
