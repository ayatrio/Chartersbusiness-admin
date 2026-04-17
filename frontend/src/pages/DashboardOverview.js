import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MAIN_APP_URL } from '../services/api';
import PageLayout from '../components/Layout/PageLayout';
import ContactSection from '../components/Dashboard/ContactSection';
import ApplicationList from '../components/Dashboard/ApplicationList';
import EnrollmentHero from '../components/Dashboard/EnrollmentHero';
import CareerRoadmap from '../components/Dashboard/CareerRoadmap';

const DashboardOverview = () => {
    const { user, generateRedirectCode } = useAuth();

    const handleApply = async () => {
        const code = await generateRedirectCode();
        if (code) {
            window.location.href = `${MAIN_APP_URL}/apply?code=${code}`;
        } else {
            alert("Failed to generate redirection. Please try again.");
        }
    };
    
    return (
        <PageLayout
            title={null}
            subtitle={null}
            fullWidth={true}
        >
            <div style={{ 
                width: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                background: 'transparent'
            }}>
                
                {/* 1. Enrollment Hero CTA (Full Bleed) */}
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <EnrollmentHero user={user} onApply={handleApply} />
                </div>

                {/* 2. Career Roadmap (Full Width Visual Path) */}
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <CareerRoadmap currentStep={2} />
                </div>

                {/* 3. Professional Support (Horizontal row with separators) */}
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <ContactSection />
                </div>

                {/* 4. Application Activity (Sharp Bottom Tracking) */}
                <div>
                    <ApplicationList />
                </div>
            </div>
        </PageLayout>
    );
};

export default DashboardOverview;
