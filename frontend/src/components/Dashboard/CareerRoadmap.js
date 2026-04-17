import React from 'react';
import { RiCheckLine, RiEdit2Line, RiChatVoiceLine, RiAwardLine } from 'react-icons/ri';

const CareerRoadmap = ({ currentStep = 2 }) => {
    const steps = [
        { id: 1, label: 'Goal Set', icon: RiCheckLine, status: 'completed', description: 'Interested course selected' },
        { id: 2, label: 'Application', icon: RiEdit2Line, status: 'active', description: 'Begin your enrollment' },
        { id: 3, label: 'Counseling', icon: RiChatVoiceLine, status: 'upcoming', description: 'Connect with experts' },
        { id: 4, label: 'Success', icon: RiAwardLine, status: 'upcoming', description: 'Official enrollment' },
    ];

    return (
        <section style={{
            background: '#fff',
            borderRadius: '0',
            padding: '48px 0',
            border: 'none',
            boxShadow: 'none'
        }}>
            <header style={{ marginBottom: '40px', textAlign: 'left', padding: '0 5%' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Your Path to Success
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Follow these steps to complete your enrollment journey
                </p>
            </header>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                position: 'relative',
                gap: '24px',
                flexWrap: 'wrap',
                padding: '0 5%'
            }}>
                <style>{`
                    @media (max-width: 768px) {
                        .roadmap-connector { display: none !important; }
                    }
                `}</style>
                {/* Connector Line */}
                <div 
                    className="roadmap-connector"
                    style={{
                        position: 'absolute',
                        top: '24px',
                        left: '90px',
                        right: '90px',
                        height: '2px',
                        background: '#f1f5f9',
                        zIndex: 0,
                        display: 'block'
                    }} 
                />

                {steps.map((step) => (
                    <div 
                        key={step.id} 
                        style={{ 
                            flex: '1 1 120px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            zIndex: 1,
                            position: 'relative'
                        }}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            marginBottom: '12px',
                            transition: 'all 0.3s ease',
                            background: step.status === 'completed' 
                                ? 'var(--green)' 
                                : step.status === 'active' 
                                    ? 'var(--accent)' 
                                    : '#fff',
                            color: step.status === 'upcoming' ? 'var(--text-muted)' : '#fff',
                            border: step.status === 'upcoming' ? '2px solid var(--border)' : 'none',
                            boxShadow: step.status === 'active' ? '0 8px 16px rgba(179, 4, 55, 0.2)' : 'none',
                            animation: step.status === 'active' ? 'pulse-subtle 2s infinite' : 'none'
                        }}>
                            <step.icon />
                        </div>
                        <span style={{ 
                            fontSize: '14px', 
                            fontWeight: 700, 
                            color: step.status === 'upcoming' ? 'var(--text-secondary)' : 'var(--navy)',
                            marginBottom: '4px'
                        }}>
                            {step.label}
                        </span>
                        <p style={{ 
                            fontSize: '11px', 
                            color: 'var(--text-muted)', 
                            margin: 0, 
                            textAlign: 'center',
                            maxWidth: '100px'
                        }}>
                            {step.description}
                        </p>

                        {/* Mobile Pulse Animation CSS */}
                        {step.status === 'active' && (
                            <style>{`
                                @keyframes pulse-subtle {
                                    0% { transform: scale(1); }
                                    50% { transform: scale(1.05); }
                                    100% { transform: scale(1); }
                                }
                            `}</style>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default CareerRoadmap;
