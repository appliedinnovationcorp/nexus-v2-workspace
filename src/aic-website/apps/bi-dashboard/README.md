# 📊 AIC Business Intelligence Dashboard

> Enterprise-grade Business Intelligence Dashboard built with Next.js 14, TypeScript, and modern web technologies.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![React](https://img.shields.io/badge/React-18+-blue)

## 🌟 Features

### 📈 **Comprehensive Analytics**
- Real-time data visualization with interactive charts
- KPI tracking with goal progress indicators
- Advanced data tables with search, sort, and export
- AI-powered insights and trend analysis

### 🎨 **Modern UI/UX**
- Responsive design optimized for all devices
- Professional dark/light theme support
- Intuitive navigation with collapsible sidebar
- Enterprise-grade component library

### 🔧 **Technical Excellence**
- Built with Next.js 14 App Router
- Full TypeScript support with strict typing
- Modular widget-based architecture
- Performance-optimized with lazy loading

### 📊 **Visualization Types**
- Line, Bar, Pie, Area, and Funnel charts
- Geographic distribution maps
- Real-time metric cards
- Interactive data grids

## 🚀 Quick Start

```bash
# Clone and navigate to project
cd src/aic-website/apps/bi-dashboard

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

## 📁 Project Structure

```
bi-dashboard/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard pages
│   ├── layout.tsx         # Root layout
│   └── providers.tsx      # Context providers
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── ui/               # Base UI components
│   └── widgets/          # Dashboard widgets
├── contexts/             # React contexts
├── lib/                  # Utility functions
└── public/               # Static assets
```

## 🎯 Core Components

### Layout System
- **DashboardLayout**: Main layout wrapper
- **Sidebar**: Collapsible navigation
- **Header**: Top navigation with search and notifications

### Widget Library
- **MetricCard**: KPI display with trend indicators
- **ChartWidget**: Configurable chart component
- **DataTable**: Advanced data grid
- **KPIWidget**: Goal tracking widget
- **ChartContainer**: Chart wrapper with controls

### UI Components
- **Button**: Customizable button component
- **Input**: Form input with validation
- **Badge**: Status and category indicators
- **Avatar**: User profile images
- **Tooltip**: Contextual help text

## 🔧 Configuration

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://your-api.com
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
DATABASE_URL=your-database-url
```

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    }
  }
}
```

## 📊 Data Integration

### Mock Data Example
```typescript
const dashboardData = {
  metrics: {
    revenue: { current: 125000, previous: 108000 },
    users: { current: 2847, previous: 2654 },
    conversion: { current: 3.2, previous: 2.8 }
  },
  chartData: [
    { name: 'Jan', value: 4000, users: 2400 },
    { name: 'Feb', value: 3000, users: 1398 },
    // ... more data
  ]
};
```

### API Integration
```typescript
// contexts/analytics-context.tsx
export function useAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchAnalyticsData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);
  
  return { data, loading };
}
```

## 🎨 Customization

### Adding Custom Widgets
```typescript
// components/widgets/custom-widget.tsx
export function CustomWidget({ title, data }: CustomWidgetProps) {
  return (
    <ChartContainer title={title}>
      <div className="p-4">
        {/* Your custom content */}
      </div>
    </ChartContainer>
  );
}
```

### Theme Customization
```css
/* app/globals.css */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
}
```

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Adaptive layout for tablets
- **Desktop**: Full-featured desktop experience
- **Touch Friendly**: Optimized for touch interactions

## 🔒 Security Features

- **Type Safety**: Full TypeScript coverage
- **Input Validation**: Client-side validation
- **XSS Protection**: Sanitized data rendering
- **CSRF Protection**: Built-in Next.js security

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Manual Deployment
```bash
npm run build
npm start
```

## 📈 Performance

- **Bundle Size**: Optimized with tree shaking
- **Loading Speed**: Lazy loading and code splitting
- **Runtime Performance**: Memoized components
- **SEO Optimized**: Server-side rendering

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📚 Documentation

- [Usage Guide](./USAGE_GUIDE.md) - Detailed usage instructions
- [API Documentation](./docs/api.md) - API integration guide
- [Component Library](./docs/components.md) - Component documentation
- [Deployment Guide](./docs/deployment.md) - Deployment instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software owned by Applied Innovation Corporation.

## 🆘 Support

- **Documentation**: Check the docs folder
- **Issues**: Create GitHub issues
- **Email**: support@aicorp.com
- **Slack**: #bi-dashboard channel

## 🏆 Acknowledgments

- **Next.js Team**: For the amazing framework
- **Vercel**: For hosting and deployment
- **Tailwind CSS**: For the utility-first CSS framework
- **Radix UI**: For accessible component primitives

---

**Built with ❤️ by Applied Innovation Corporation**

*Empowering data-driven decisions through intelligent visualization*
