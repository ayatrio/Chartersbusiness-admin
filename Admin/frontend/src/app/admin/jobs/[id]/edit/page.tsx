"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getJobById, updateJobPosting, JobPosting } from '@/lib/server/api';
import RichTextEditor from '@/components/admin/RichTextEditor';

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    jobType: 'Full-time',
    category: '',
    salary: '',
    experience: '',
    description: '',
    isActive: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authorization
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!['admin', 'recruiter'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Fetch job data
  useEffect(() => {
    if (!token || authLoading) return;

    const fetchJob = async () => {
      try {
        const response = await getJobById(id);
        // response.data is the JobPosting object
        const jobData: JobPosting = response.data as JobPosting;

        setFormData({
          title: jobData.title || '',
          company: jobData.company || '',
          location: jobData.location || '',
          jobType: jobData.jobType || 'Full-time',
          category: jobData.category || '',
          salary: jobData.salary || '',
          experience: jobData.experience || '',
          description: jobData.description || '',
          isActive: jobData.isActive ?? true,
        });
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load job');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [id, token, authLoading]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleDescriptionChange = (html: string) => {
    setFormData({ ...formData, description: html });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Not authenticated');
      return;
    }

    if (!formData.title || !formData.location || !formData.category || !formData.description) {
      setError('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateJobPosting(id, formData, token);
      router.push('/admin/jobs');
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update job posting');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#B30437] border-r-transparent"></div>
      </div>
    );
  }

  if (!user || !['admin', 'recruiter'].includes(user.role)) {
    return null;
  }

  if (error && !formData.title) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/admin/jobs" className="text-[#B30437] hover:underline">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="mb-8">
          <Link href="/admin/jobs" className="text-[#B30437] hover:underline mb-4 inline-block">
            ← Back to Jobs
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Job Posting</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
          {error && <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>}

          {/* Job Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Company */}
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              Company *
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Location & Job Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-2">
                Job Type *
              </label>
              <select
                id="jobType"
                name="jobType"
                value={formData.jobType}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Salary & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-2">
                Salary *
              </label>
              <input
                type="text"
                id="salary"
                name="salary"
                value={formData.salary}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                Experience Required *
              </label>
              <input
                type="text"
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="w-4 h-4 text-[#B30437] border-gray-300 rounded focus:ring-[#B30437]"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active (visible to applicants)
            </label>
          </div>

          {/* Description - Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description *
            </label>
            <RichTextEditor
              content={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Update job description..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#B30437' }}
            >
              {isSubmitting ? 'Updating...' : 'Update Job Posting'}
            </button>
            <Link
              href="/admin/jobs"
              className="px-8 py-4 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
