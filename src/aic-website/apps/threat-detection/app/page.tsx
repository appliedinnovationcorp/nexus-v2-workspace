'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to security dashboard
    router.replace('/security');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-gray-300 text-lg">Initializing Security Operations Center...</p>
        <p className="text-gray-500 text-sm mt-2">Redirecting to Threat Detection Dashboard</p>
      </div>
    </div>
  );
}
