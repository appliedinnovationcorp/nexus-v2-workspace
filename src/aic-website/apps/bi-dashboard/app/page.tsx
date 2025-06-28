'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect authenticated users to dashboard
        router.push('/dashboard');
      } else {
        // Redirect unauthenticated users to login
        router.push('/auth/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading AIC Business Intelligence Dashboard...</p>
      </div>
    </div>
  );
}
