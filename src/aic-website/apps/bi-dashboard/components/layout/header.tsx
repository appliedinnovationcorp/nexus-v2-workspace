'use client';

import React from 'react';
import { Menu, Search, Bell, User, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
  collapsed: boolean;
}

export function Header({ onMenuClick, collapsed }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [notifications] = React.useState(3); // Mock notification count

  return (
    <header className={cn(
      'sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm transition-all duration-300',
      'lg:pl-64',
      collapsed && 'lg:pl-16'
    )}>
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          <div className="hidden sm:block relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search dashboards, reports..."
              className="pl-10 w-64 lg:w-80"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Search button for mobile */}
          <Button variant="ghost" size="sm" className="sm:hidden">
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {notifications}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-2 p-2">
                <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Revenue target exceeded
                    </p>
                    <p className="text-xs text-gray-500">
                      Monthly revenue is 15% above target
                    </p>
                    <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Data sync warning
                    </p>
                    <p className="text-xs text-gray-500">
                      Analytics data sync delayed by 5 minutes
                    </p>
                    <p className="text-xs text-gray-400 mt-1">10 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Report generated
                    </p>
                    <p className="text-xs text-gray-500">
                      Weekly performance report is ready
                    </p>
                    <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center justify-center">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/user.png" alt="User" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">John Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    john.doe@aicorp.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
