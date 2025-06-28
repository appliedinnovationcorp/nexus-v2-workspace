# AIC Business Intelligence Dashboard - Usage Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation & Setup

1. **Install Dependencies**
   ```bash
   cd src/aic-website/apps/bi-dashboard
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Development Server**
   ```bash
   npm run dev
   # Dashboard available at http://localhost:3000
   ```

4. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## 📊 Dashboard Features

### Core Components

#### 1. **Dashboard Layout**
- Responsive sidebar navigation with collapsible design
- Professional header with search, notifications, and user menu
- Mobile-optimized with touch-friendly interactions

#### 2. **Widget System**
- **Metric Cards**: KPI displays with trend indicators
- **Chart Widgets**: Line, bar, pie, area, and funnel charts
- **Data Tables**: Sortable, searchable, exportable data grids
- **KPI Widgets**: Goal tracking with progress indicators

#### 3. **Navigation Structure**
```
Dashboard/
├── Overview (Main dashboard)
├── Analytics (Detailed metrics)
├── Real-time (Live monitoring)
├── Performance (KPI tracking)
├── Users (User analytics)
├── Revenue (Financial metrics)
├── Geography (Location data)
├── Goals (Target tracking)
├── AI Insights (ML-powered analysis)
├── Reports (Generated reports)
├── Alerts (Notifications)
└── Data Sources (Connection management)
```

## 🎛️ User Interface Guide

### Sidebar Navigation
- **Collapse/Expand**: Click the collapse button at bottom
- **Tooltips**: Hover over collapsed icons for descriptions
- **Mobile**: Tap hamburger menu to open sidebar

### Header Features
- **Search**: Global search across dashboards and reports
- **Notifications**: Real-time alerts and system updates
- **Theme Toggle**: Switch between light and dark modes
- **User Menu**: Profile, settings, and logout options

### Widget Interactions
- **Charts**: Hover for data points, click legend to toggle series
- **Tables**: Click headers to sort, use search to filter
- **Export**: Use dropdown menus to export data (PNG, SVG, PDF, CSV)
- **Fullscreen**: Expand widgets for detailed analysis

## 🔧 Customization

### Adding New Widgets

1. **Create Widget Component**
   ```typescript
   // components/widgets/custom-widget.tsx
   export function CustomWidget({ data, title }: CustomWidgetProps) {
     return (
       <ChartContainer title={title}>
         {/* Your custom content */}
       </ChartContainer>
     );
   }
   ```

2. **Add to Dashboard**
   ```typescript
   // app/dashboard/page.tsx
   import { CustomWidget } from '@/components/widgets/custom-widget';
   
   // In your dashboard component
   <CustomWidget data={customData} title="Custom Analytics" />
   ```

### Styling Customization

1. **Tailwind Configuration**
   ```javascript
   // tailwind.config.js
   module.exports = {
     theme: {
       extend: {
         colors: {
           primary: {
             // Your brand colors
           }
         }
       }
     }
   }
   ```

2. **CSS Variables**
   ```css
   /* app/globals.css */
   :root {
     --primary-color: #your-color;
     --secondary-color: #your-color;
   }
   ```

## 📈 Data Integration

### Mock Data Structure
```typescript
interface DashboardData {
  metrics: {
    revenue: { current: number; previous: number };
    users: { current: number; previous: number };
    // ... other metrics
  };
  chartData: Array<{
    name: string;
    value: number;
    // ... other properties
  }>;
}
```

### Real Data Integration
1. Replace mock data in `app/dashboard/page.tsx`
2. Implement API calls in `contexts/analytics-context.tsx`
3. Add error handling and loading states

## 🚀 Deployment

### Vercel Deployment
```bash
npm install -g vercel
vercel --prod
```

### Docker Deployment
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

### Environment Variables
```bash
# .env.production
NEXT_PUBLIC_API_URL=https://your-api.com
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
DATABASE_URL=your-database-url
```

## 🔒 Security Considerations

1. **Authentication**: Implement proper user authentication
2. **Authorization**: Role-based access control for different dashboard sections
3. **Data Validation**: Validate all incoming data
4. **HTTPS**: Always use HTTPS in production
5. **Environment Variables**: Keep sensitive data in environment variables

## 📱 Mobile Optimization

- Responsive grid system adapts to all screen sizes
- Touch-friendly interactions for mobile devices
- Optimized chart rendering for smaller screens
- Collapsible navigation for mobile space efficiency

## 🎨 Theme System

### Light/Dark Mode
- Automatic system preference detection
- Manual theme toggle in header
- Consistent color scheme across all components

### Custom Themes
```typescript
// Add to tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom theme colors
      }
    }
  }
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Build Errors**
   - Check Node.js version (18+)
   - Clear node_modules and reinstall
   - Verify TypeScript configuration

2. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check for conflicting CSS rules
   - Verify component imports

3. **Performance Issues**
   - Implement data pagination for large datasets
   - Use React.memo for expensive components
   - Optimize chart rendering with virtualization

## 📞 Support

For technical support and feature requests:
- Create issues in the project repository
- Contact the development team
- Check documentation for updates

---

**Built with ❤️ by Applied Innovation Corporation**
