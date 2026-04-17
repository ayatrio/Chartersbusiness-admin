import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MAIN_APP_URL } from '../../services/api';

const ApplicationList = () => {
    const { user, applications, refreshApplications, generateRedirectCode } = useAuth();

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
        <div style={{ padding: '48px 0', background: '#fff' }}>
            {isEmpty ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 24px',
                    background: 'var(--surface-tint)',
                    borderRadius: 0,
                    border: '1px solid var(--border)',
                    margin: '0 5%'
                }}>
                    {/* ... internal content ... */}
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: '#f3f4f6',
                        borderRadius: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '24px'
                    }}>
                        <svg
                            style={{ width: '40px', height: '40px', color: '#9ca3af' }}
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
                    <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '1.125rem', 
                        marginBottom: '32px', 
                        textAlign: 'center', 
                        maxWidth: '500px',
                        lineHeight: 1.6
                    }}>
                        You haven't applied for your success yet! Your dream career in <strong>{user?.selectedCourse || 'your chosen field'}</strong> is just one application away. Let's get started!
                    </p>
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
                            background: 'linear-gradient(180deg, var(--accent-light), var(--accent))',
                            color: 'white',
                            fontWeight: 700,
                            padding: '12px 28px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '15px'
                        }}
                    >
                        Apply Now
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '0 5%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Application Status</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                            You have {applications.length} active application{applications.length > 1 ? 's' : ''}
                        </p>
                    </div>

                    {applications.map((application, index) => (
                        <article
                            key={application.applicationNumber || index}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                background: '#fff',
                                border: '1px solid var(--border)',
                                borderRadius: 0,
                                overflow: 'hidden'
                            }}
                        >
                            {/* ... internal card content ... */}
                            <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                        {application.program || 'Program Not Specified'}
                                    </h3>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, letterSpacing: '0.05em' }}>
                                        ID: #{application.applicationNumber}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Program</span>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>
                                            {application.program || 'N/A'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Submitted On</span>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {formatDate(application.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ApplicationList;
