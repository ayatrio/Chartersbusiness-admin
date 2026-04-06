"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getMyInternshipPostings, deleteInternshipPosting } from "@/lib/server/api";

export default function AdminInternshipsPage() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [internships, setInternships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !["admin", "recruiter"].includes(user.role)) {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (!token) return;

    const fetchInternships = async () => {
      try {
        const response = await getMyInternshipPostings(token);
        setInternships(response.data.internshipPostings);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInternships();
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this internship posting?"))
      return;
    if (!token) return;

    try {
      await deleteInternshipPosting(id, token);
      setInternships(internships.filter((internship) => internship._id !== id));
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  if (!user || !["admin", "recruiter"].includes(user.role)) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Internship Postings
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your internship listings
            </p>
          </div>
          <Link
            href="/admin/internships/create"
            className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105"
            style={{ backgroundColor: "#B30437" }}
          >
            + Create Internship
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#B30437] border-r-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : internships.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No internships posted yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Internship Title
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
                  {internships.map((internship) => (
                    <tr key={internship._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {internship.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {internship.company}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {internship.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {internship.applicationsCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            internship.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {internship.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Link
                            href={`/careers/internships/${internship._id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin/internships/${internship._id}/applications`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Applications
                          </Link>
                          <Link
                            href={`/admin/internships/${internship._id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(internship._id)}
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
