'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Map,
  Users,
  BarChart3,
  Target,
  Lightbulb,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  Activity,
  TrendingUp,
  Zap,
  FileText,
  Bell,
  Database,
  Shield,
  TestTube,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface JourneySidebarProps {
  open: boolean;
  collapsed: boolean;
  onOpenChange: (open: boolean) => void;
  onCollapsedChange: (collapsed: boolean) => void;
}

const navigation = [
  {
    name: 'Overview',
    href: '/journey',
    icon: Home,
    description: 'Journey mapping overview',
  },
  {
    name: 'Journey Flow',
    href: '/journey/flow',
    icon: Map,
    description: 'Visual journey mapping',
  },
  {
    name: 'Personas',
    href: '/journey/personas',
    icon: Users,
    description: 'Customer personas management',
  },
  {
    name: 'Analytics',
    href: '/journey/analytics',
    icon: BarChart3,
    description: 'Journey analytics and metrics',
  },
  {
    name: 'Touchpoints',
    href: '/journey/touchpoints',
    icon: Activity,
    description: 'Touchpoint analysis',
  },
  {
    name: 'Optimization',
    href: '/journey/optimization',
    icon: Target,
    description: 'Journey optimization tools',
  },
  {
    name: 'A/B Testing',
    href: '/journey/testing',
    icon: TestTube,
    description: 'A/B testing and experiments',
  },
  {
    name: 'Insights',
    href: '/journey/insights',
    icon: Lightbulb,
    description: 'AI-powered insights',
  },
  {
    name: 'Performance',
    href: '/journey/performance',
    icon: TrendingUp,
    description: 'Performance tracking',
  },
  {
    name: 'Real-time',
    href: '/journey/realtime',
    icon: Zap,
    description: 'Real-time monitoring',
  },
  {
    name: 'Reports',
    href: '/journey/reports',
    icon: FileText,
    description: 'Journey reports',
  },
  {
    name: 'Alerts',
    href: '/journey/alerts',
    icon: Bell,
    description: 'Journey alerts and notifications',
  },
];

const bottomNavigation = [
  {
    name: 'Data Sources',
    href: '/journey/data-sources',
    icon: Database,
    description: 'Manage data connections',
  },
  {
    name: 'Security',
    href: '/journey/security',
    icon: Shield,
    description: 'Security and compliance',
  },
  {
    name: 'Settings',
    href: '/journey/settings',
    icon: Settings,
    description: 'Journey mapping settings',
  },
  {
    name: 'Help',
    href: '/journey/help',
    icon: HelpCircle,
    description: 'Help and documentation',
  },
];

export function JourneySidebar({ open, collapsed, onOpenChange, onCollapsedChange }: JourneySidebarProps) {
  const pathname = usePathname();

  const NavItem = ({ item, isBottom = false }: { item: any; isBottom?: boolean }) => {
    const isActive = pathname === item.href;

    const content = (
      <Link
        href={item.href}
        className={cn(
          'nav-link group relative',
          isActive && 'active',
          collapsed ? 'justify-center px-2' : 'px-3'
        )}
        onClick={() => {
          if (window.innerWidth < 1024) {
            onOpenChange(false);
          }
        }}
      >
        <item.icon className={cn('h-5 w-5 flex-shrink-0', collapsed ? '' : 'mr-3')} />
        {!collapsed && (
          <span className="truncate">{item.name}</span>
        )}
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r" />
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className={cn(
        'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300 z-50',
        collapsed ? 'lg:w-16' : 'lg:w-64'
      )}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          {/* Logo */}
          <div className={cn(
            'flex items-center flex-shrink-0 px-4 py-4 border-b border-gray-200',
            collapsed && 'justify-center px-2'
          )}>
            {collapsed ? (
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Map className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Map className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">AIC Journey</h1>
                  <p className="text-xs text-gray-500">Customer Journey Mapping</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>

            {/* Bottom navigation */}
            <nav className="px-2 py-4 border-t border-gray-200 space-y-1">
              {bottomNavigation.map((item) => (
                <NavItem key={item.name} item={item} isBottom />
              ))}
            </nav>
          </div>

          {/* Collapse button */}
          <div className="flex-shrink-0 border-t border-gray-200 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCollapsedChange(!collapsed)}
              className={cn(
                'w-full justify-center',
                collapsed ? 'px-2' : 'justify-start px-3'
              )}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Collapse
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={cn(
        'lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-lg">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Map className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AIC Journey</h1>
                <p className="text-xs text-gray-500">Customer Journey Mapping</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>

            {/* Bottom navigation */}
            <nav className="px-2 py-4 border-t border-gray-200 space-y-1">
              {bottomNavigation.map((item) => (
                <NavItem key={item.name} item={item} isBottom />
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
