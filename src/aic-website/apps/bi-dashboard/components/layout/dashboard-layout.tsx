'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onOpenChange={setSidebarOpen}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={cn(
        'flex flex-col transition-all duration-300',
        'lg:pl-64',
        sidebarCollapsed && 'lg:pl-16'
      )}>
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          collapsed={sidebarCollapsed}
        />

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
