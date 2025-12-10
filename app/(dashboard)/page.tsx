'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';

export default function HomePage() {
  const router = useRouter();
  const { currentUser } = useUserStore();

  useEffect(() => {
    // Redirect based on user role
    if (currentUser?.role === 'maintenance') {
      router.replace('/maintenance-summary');
    } else {
      router.replace('/fleet-summary');
    }
  }, [currentUser, router]);

  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">Redirecting...</p>
      </div>
    </div>
  );
}
