import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/Layout/PageLayout';
import AdmissionPortal from '../components/Dashboard/AdmissionPortal';

const ApplyFormPage = () => {
    const { user, applications, refreshApplications } = useAuth();
    const [loadingApps, setLoadingApps] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        refreshApplications().finally(() => setLoadingApps(false));
    }, [refreshApplications]);

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
                <AdmissionPortal existingApplication={latestApp} />
            </div>
        </PageLayout>
    );
};

export default ApplyFormPage;
