/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Threat detection specific colors
        threat: {
          critical: '#dc2626',
          high: '#ea580c',
          medium: '#d97706',
          low: '#65a30d',
          info: '#2563eb',
          safe: '#16a34a',
        },
        security: {
          alert: '#ef4444',
          warning: '#f59e0b',
          success: '#10b981',
          info: '#3b82f6',
          neutral: '#6b7280',
        },
        status: {
          online: '#10b981',
          offline: '#ef4444',
          pending: '#f59e0b',
          maintenance: '#8b5cf6',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pulse-danger': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(239, 68, 68, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)' },
        },
        'pulse-warning': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(245, 158, 11, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.8)' },
        },
        'pulse-success': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(16, 185, 129, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.8)' },
        },
        'scan-line': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'threat-blink': {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0.3' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'pulse-danger': 'pulse-danger 2s ease-in-out infinite',
        'pulse-warning': 'pulse-warning 2s ease-in-out infinite',
        'pulse-success': 'pulse-success 2s ease-in-out infinite',
        'scan-line': 'scan-line 2s linear infinite',
        'threat-blink': 'threat-blink 1s ease-in-out infinite',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function({ addUtilities }) {
      const newUtilities = {
        '.threat-glow-critical': {
          'box-shadow': '0 0 20px rgba(220, 38, 38, 0.6)',
        },
        '.threat-glow-high': {
          'box-shadow': '0 0 15px rgba(234, 88, 12, 0.6)',
        },
        '.threat-glow-medium': {
          'box-shadow': '0 0 10px rgba(217, 119, 6, 0.6)',
        },
        '.threat-glow-low': {
          'box-shadow': '0 0 5px rgba(101, 163, 13, 0.6)',
        },
        '.security-grid': {
          'background-image': 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
          'background-size': '20px 20px',
        },
        '.threat-scanner': {
          'background': 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.3), transparent)',
          'animation': 'scan-line 3s linear infinite',
        },
      }
      addUtilities(newUtilities)
    }
  ],
};
