'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useUserStore } from '@/store/user-store';
import { LocalStorageService } from '@/lib/storage';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.currentUser);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage
    setIsHydrated(true);

    // Initialize data on mount
    LocalStorageService.initialize();
  }, []);

  useEffect(() => {
    // Only redirect after hydration is complete
    if (isHydrated && !currentUser) {
      router.push('/login');
    }
  }, [isHydrated, currentUser, router]);

  // Show nothing while hydrating to avoid flash
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
