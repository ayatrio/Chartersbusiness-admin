"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  getApplicationsForInternship,
  updateApplicationStatus,
  getInternshipById,
  type JobApplication,
  type InternshipPosting,
} from "@/lib/server/api";

export default function InternshipApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const internshipId = params.id as string;

  const [internship, setInternship] = useState<InternshipPosting | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Check authorization
  useEffect(() => {
    if (!user || !["admin", "recruiter"].includes(user.role)) {
      router.push("/");
    }
  }, [user, router]);

  // Fetch job details and applications
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !internshipId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch internship details
        const internshipResponse = await getInternshipById(internshipId);
        setInternship(internshipResponse.data || null);

        // Fetch applications
        const applicationsResponse = await getApplicationsForInternship(
          internshipId,
          token,
          statusFilter ? { status: statusFilter } : undefined
        );
        setApplications(applicationsResponse.data || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, internshipId, statusFilter]);

  const handleStatusChange = async (
    applicationId: string,
    newStatus: string
  ) => {
    if (!token) return;

    try {
      setUpdatingStatus(applicationId);
      await updateApplicationStatus(applicationId, newStatus, token);

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app._id === applicationId ? { ...app, status: newStatus as any } : app
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewing":
        return "bg-blue-100 text-blue-800";
      case "shortlisted":
        return "bg-purple-100 text-purple-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user || !["admin", "recruiter"].includes(user.role)) {
    return null;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B30437] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/internships"
            className="text-[#B30437] hover:underline mb-4 inline-block"
          >
            ← Back to Internships
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {internship?.title || "Internship"} - Applications
              </h1>
              {internship && (
                <p className="text-gray-600 mt-2">
                  {internship.company} • {internship.location} •{" "}
                  {applications.length}{" "}
                  {applications.length === 1 ? "Application" : "Applications"}
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-600 mb-6">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              Filter by Status:
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Applications Yet
            </h3>
            <p className="text-gray-600">
              {statusFilter
                ? `No applications with status "${statusFilter}"`
                : "This internship posting hasn't received any applications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application._id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Applicant Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2 ">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.user.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {application.user.email}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {application.status.charAt(0).toUpperCase() +
                          application.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                      <span>
                        📋 Application #{application.applicationNumber}
                      </span>
                      <span>
                        📅 Applied:{" "}
                        {new Date(application.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Resume Download */}
                    <a
                      href={application.resumeUrl}
                      download={`${application.user.name.replace(
                        /\s+/g,
                        "_"
                      )}_Resume.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg border-2 border-[#B30437] text-[#B30437] font-semibold hover:bg-[#B30437] hover:text-white transition-all text-center"
                    >
                      📄 View Resume
                    </a>

                    {/* Status Update */}
                    <select
                      value={application.status}
                      onChange={(e) =>
                        handleStatusChange(application._id, e.target.value)
                      }
                      disabled={updatingStatus === application._id}
                      className="rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
