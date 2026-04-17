import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLayout from '../components/Layout/PageLayout';
import CounsellorContact from '../components/Layout/CounsellorContact';

export default function ContactPage() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    // Protect the route and handle basic redirection logic
    useEffect(() => {
        if (loading) return;

        if (!user) {
            navigate('/login');
            return;
        }

        // Redirect admin/recruiter to their specific admin dashboard if they land here
        if (user.role === 'admin' || user.role === 'recruiter') {
            navigate('/admin/dashboard');
            return;
        }
    }, [user, loading, navigate]);

    // Loading state handling (matching project standard)
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--bg-primary)'
            }}>
                <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '3px solid #eadfd6',
                    borderTopColor: 'var(--accent)',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Final gate
    if (!user || user.role === 'admin' || user.role === 'recruiter') {
        return null;
    }

    return (
        <PageLayout
            title="Contact Support"
            subtitle="Have questions? Connect with our dedicated team of admissions counsellors for personalized guidance."
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

                {/* Main Contact Section */}
                <section>
                    <CounsellorContact />
                </section>

                {/* Informational Banner */}
                <div style={{
                    padding: '24px 32px',
                    background: 'linear-gradient(135deg, var(--navy) 0%, #1e293b 100%)',
                    borderRadius: 20,
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Helpful Tip</h3>
                    <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6, margin: 0 }}>
                        Before contacting us, make sure to check your <strong>Application Status</strong> for real-time updates on your submissions.
                        Many common questions are answered directly in the tracking dashboard.
                    </p>
                </div>

            </div>
        </PageLayout>
    );
}
