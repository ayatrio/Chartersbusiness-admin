import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MAIN_APP_URL } from '../services/api';
import PageLayout from '../components/Layout/PageLayout';
import ApplicationList from '../components/Dashboard/ApplicationList';
import EnrollmentHero from '../components/Dashboard/EnrollmentHero';
import CareerRoadmap from '../components/Dashboard/CareerRoadmap';

const DashboardOverview = () => {
    const { user, generateRedirectCode, applications, refreshApplications } = useAuth();
    const [loadingApps, setLoadingApps] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        refreshApplications().finally(() => setLoadingApps(false));
    }, [refreshApplications]);

    const handleApply = async () => {
        const code = await generateRedirectCode();
        if (code) {
            window.location.href = `${MAIN_APP_URL}/apply?code=${code}`;
        } else {
            alert("Failed to generate redirection. Please try again.");
        }
    };

    const latestApp = applications?.[0] || null;
    const hasSubmittedApplication = latestApp && latestApp.status !== 'draft';

    if (loadingApps) {
        return (
            <PageLayout title={null} subtitle={null} fullWidth={true}>
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                    Loading…
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title={null} subtitle={null} fullWidth={true}>
            <div className="w-full flex flex-col bg-transparent">

                {!hasSubmittedApplication ? (
                    <div style={{
                        padding: '4rem 2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--navy)',
                        color: '#fff',
                        textAlign: 'center',
                        minHeight: '400px',
                        border: '1px solid var(--border)'
                    }}>
                        <div style={{
                            fontSize: '4rem',
                            marginBottom: '1rem'
                        }}>📝</div>
                        <h2 style={{
                            fontSize: '2rem',
                            fontWeight: 800,
                            marginBottom: '1rem',
                            color: '#fff',
                            fontFamily: 'var(--font-heading)'
                        }}>
                            No Active Application Found
                        </h2>
                        <p style={{
                            fontSize: '1.1rem',
                            color: 'var(--text-muted)',
                            maxWidth: '500px',
                            margin: '0 auto 2rem',
                            lineHeight: 1.6
                        }}>
                            You haven't submitted your admission application yet. Apply today to enroll and unlock access to the student dashboard.
                        </p>
                        <button
                            onClick={() => navigate('/apply-form')}
                            className="app-button app-button--primary app-button--lg"
                            style={{
                                borderRadius: '0px',
                                padding: '12px 32px',
                                fontSize: '1rem',
                                fontWeight: 700
                            }}
                        >
                            Start Application Form
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="border-b border-border">
                            <EnrollmentHero user={user} onApply={handleApply} />
                        </div>
                        <div className="border-b border-border">
                            <CareerRoadmap currentStep={2} />
                        </div>
                    </>
                )}

                {/* Only show application list if NOT approved/rejected */}
                {(!latestApp || latestApp.status === 'draft' || latestApp.status === 'pending' || latestApp.status === 'under_review') && (
                    <div>
                        <ApplicationList />
                    </div>
                )}

            </div>
        </PageLayout>
    );
};

export default DashboardOverview;