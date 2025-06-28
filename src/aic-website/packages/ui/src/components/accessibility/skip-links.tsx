'use client';

import React from 'react';

interface SkipLink {
  href: string;
  label: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

const defaultLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
  { href: '#footer', label: 'Skip to footer' },
];

export const SkipLinks: React.FC<SkipLinksProps> = ({
  links = defaultLinks,
  className = '',
}) => {
  return (
    <div className={`skip-links ${className}`}>
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="skip-link"
          onFocus={(e) => {
            e.currentTarget.classList.add('skip-link-focused');
          }}
          onBlur={(e) => {
            e.currentTarget.classList.remove('skip-link-focused');
          }}
        >
          {link.label}
        </a>
      ))}
      
      <style jsx>{`
        .skip-links {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 9999;
        }
        
        .skip-link {
          position: absolute;
          top: -40px;
          left: 6px;
          background: #000;
          color: #fff;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 0 0 4px 4px;
          font-size: 14px;
          font-weight: 500;
          transition: top 0.3s ease;
          z-index: 10000;
        }
        
        .skip-link:focus,
        .skip-link-focused {
          top: 0;
          outline: 2px solid #4A90E2;
          outline-offset: 2px;
        }
        
        .skip-link:hover {
          background: #333;
        }
      `}</style>
    </div>
  );
};
