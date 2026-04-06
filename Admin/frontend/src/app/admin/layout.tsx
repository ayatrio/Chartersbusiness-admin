'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'recruiter') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#B30437] border-r-transparent"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'recruiter')) {
    return null;
  }

  return (
      <div className="min-h-screen bg-white">
        <DashboardNavbar/>

      {/* Content */}
      <div className='mt-12 flex flex-col'>

      {children}

       <Link
              href="/"
              className="text-gray-500 hover:text-[#B30437] text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Home
            </Link>
      </div>
    </div>
  );
}
