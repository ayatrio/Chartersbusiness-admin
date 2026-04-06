'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // Check authorization after loading
    if (!user) {
      router.push('/login');
      return;
    }

    if (!['admin', 'recruiter'].includes(user.role)) {
      router.push('/dashboard'); // Redirect to user dashboard
      return;
    }

    setIsChecking(false);
  }, [user, isLoading, router]);

  // Show loading while checking
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#B30437] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authorized
  if (!user || !['admin', 'recruiter'].includes(user.role)) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold capitalize text-gray-900">{user.role} Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Jobs Card */}
          <Link
            href="/admin/jobs"
            className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Jobs</h2>
              <svg
                className="h-12 w-12 text-[#B30437]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-600">Manage job postings and view applications</p>
            <div className="mt-4 text-[#B30437] font-semibold">View Jobs →</div>
          </Link>

          {/* Internships Card */}
          <Link
            href="/admin/internships"
            className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Internships</h2>
              <svg
                className="h-12 w-12 text-[#B30437]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <p className="text-gray-600">Manage internship postings and applications</p>
            <div className="mt-4 text-[#B30437] font-semibold">View Internships →</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
