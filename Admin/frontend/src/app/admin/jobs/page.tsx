"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getMyJobPostings, deleteJobPosting } from "@/lib/server/api";

export default function AdminJobsPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Check authorization
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!["admin", "recruiter"].includes(user.role)) {
      router.push("/dashboard");
      return;
    }

    setIsChecking(false);
  }, [user, isLoading, router]);

  // Fetch job postings
  useEffect(() => {
    if (!token || isChecking) return;

    const fetchJobs = async () => {
      try {
        const response = await getMyJobPostings(token);
        setJobs(response.data.jobPostings);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [token, isChecking]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;
    if (!token) return;

    try {
      await deleteJobPosting(id, token);
      setJobs(jobs.filter((job) => job._id !== id));
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#B30437] border-r-transparent"></div>
      </div>
    );
  }

  if (!user || !["admin", "recruiter"].includes(user.role)) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 ">
      {/* Rest of the code remains same */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Postings</h1>
            <p className="text-gray-600 mt-1">Manage your job listings</p>
          </div>
          <Link
            href="/admin/jobs/create"
            className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105"
            style={{ backgroundColor: "#B30437" }}
          >
            + Create Job
          </Link>
        </div>

        {isLoadingJobs ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#B30437] border-r-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No jobs posted yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {job.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {job.company}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.applicationsCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            job.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {job.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Link
                            href={`/careers/jobs/${job._id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin/jobs/${job._id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </Link>{" "}
                          <Link
                            href={`/admin/jobs/${job._id}/applications`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Applications
                          </Link>
                          <button
                            onClick={() => handleDelete(job._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
