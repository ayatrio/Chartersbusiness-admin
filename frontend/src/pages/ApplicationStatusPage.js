import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MAIN_APP_URL } from '../services/api';
import PageLayout from '../components/Layout/PageLayout';

export default function ApplicationStatusPage() {
    const { applications, refreshApplications, generateRedirectCode } = useAuth();

    useEffect(() => {
        refreshApplications();
    }, [refreshApplications]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not scheduled';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const isEmpty = !applications || applications.length === 0;

    return (
        <PageLayout
            title="Application Status"
            subtitle="Track the progress of your active university and program applications."
        >
            {isEmpty ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 16px'
                }}>
                    <div style={{
                        width: '96px',
                        height: '96px',
                        background: '#f3f4f6',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '24px'
                    }}>
                        <svg
                            style={{ width: '48px', height: '48px', color: '#9ca3af' }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <p style={{ color: '#4b5563', fontSize: '1.125rem', marginBottom: '16px' }}>No applications found</p>
                    <button
                        onClick={async () => {
                            const code = await generateRedirectCode();
                            if (code) {
                                window.location.href = `${MAIN_APP_URL}/apply?code=${code}`;
                            } else {
                                alert("Failed to generate redirection. Please try again.");
                            }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#B30437',
                            color: 'white',
                            fontWeight: 600,
                            padding: '12px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'none',
                            transition: 'background 0.2s'
                        }}
                    >
                        Apply Now
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '64rem', margin: '0 auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: 0 }}>Application Status</h1>
                        <p style={{ color: '#4b5563', margin: 0 }}>
                            You have {applications.length} application{applications.length > 1 ? 's' : ''}
                        </p>
                    </div>

                    {applications.map((application, index) => (
                        <article
                            key={application.applicationNumber || index}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                background: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', gap: '24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                                        {application.program || 'Program Not Specified'}
                                    </h2>
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                                        Application #{application.applicationNumber}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.025em', margin: 0 }}>
                                        Application Details
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                                            <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Application Number</span>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                                                {application.applicationNumber}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                                            <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Program</span>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', textAlign: 'right' }}>
                                                {application.program || 'N/A'}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                                            <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Submitted On</span>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                                                {formatDate(application.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </PageLayout>
    );
}
