'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { createInternshipPosting } from '@/lib/server/api';
import RichTextEditor from '@/components/admin/RichTextEditor';

export default function CreateInternshipPage() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    company: 'Charters Business',
    location: '',
    internshipType: 'Hybrid',
    category: '',
    stipend: '',
    duration: '',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !['admin', 'recruiter'].includes(user.role)) {
      router.push('/');
    }
  }, [user, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      await createInternshipPosting(formData, token);
      router.push('/admin/internships');
    } catch (err: any) {
      setError(err.message || 'Failed to create internship posting');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !['admin', 'recruiter'].includes(user.role)) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="mb-8">
          <Link
            href="/admin/internships"
            className="text-[#B30437] hover:underline mb-4 inline-block"
          >
            ← Back to Internships
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Internship Posting</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Internship Title *
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                placeholder="e.g., Bangalore, Remote"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label
                htmlFor="internshipType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Type *
              </label>
              <select
                id="internshipType"
                name="internshipType"
                value={formData.internshipType}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Remote">Remote</option>
                <option value="In-office">In-office</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

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
              placeholder="e.g., Software Development, Design"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="stipend" className="block text-sm font-medium text-gray-700 mb-2">
                Stipend *
              </label>
              <input
                type="text"
                id="stipend"
                name="stipend"
                value={formData.stipend}
                onChange={handleInputChange}
                required
                placeholder="e.g., ₹15,000-25,000/month"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Duration *
              </label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                placeholder="e.g., 3-6 months"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Internship Description *
            </label>
            <RichTextEditor
              content={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Write the internship description including what you'll learn, requirements, etc."
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#B30437' }}
            >
              {isSubmitting ? 'Creating...' : 'Create Internship Posting'}
            </button>
            <Link
              href="/admin/internships"
              className="px-8 py-4 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
