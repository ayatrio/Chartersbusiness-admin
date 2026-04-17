import React from 'react';
import { RiRocket2Line, RiMagicLine, RiArrowRightLine } from 'react-icons/ri';

const EnrollmentHero = ({ user, onApply }) => {
    return (
        <section style={{
            background: 'linear-gradient(135deg, var(--navy) 0%, #1e293b 100%)',
            borderRadius: '0',
            padding: '20px 0',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'none',
            minHeight: '500px',
            display: 'flex',
            alignItems: 'center'
        }}>
            {/* Background Decorative Elements */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-5%',
                width: '300px',
                height: '300px',
                background: 'rgba(179, 4, 55, 0.1)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                zIndex: 0
            }} />

            <div style={{ 
                position: 'relative', 
                zIndex: 1, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: '32px',
                padding: '0 5%'
            }}>
                <div style={{ flex: '1 1 400px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <span style={{ 
                            background: 'rgba(255, 255, 255, 0.1)', 
                            padding: '6px 14px', 
                            borderRadius: '99px',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            Next Step: Enrollment
                        </span>
                    </div>

                    <h1 style={{ 
                        fontSize: 'clamp(32px, 4vw, 42px)', 
                        fontWeight: 800, 
                        lineHeight: 1.1, 
                        marginBottom: '20px',
                        fontFamily: 'var(--font-display)' 
                    }}>
                        Hey {user?.firstName || 'there'}, your future in <span style={{ color: 'var(--accent-light)' }}>{user?.selectedCourse || 'your dream field'}</span> starts now.
                    </h1>

                    <p style={{ 
                        fontSize: '18px', 
                        opacity: 0.9, 
                        lineHeight: 1.6, 
                        marginBottom: '32px',
                        maxWidth: '540px' 
                    }}>
                        You've expressed interest in our prestigious {user?.selectedCourse} program. 
                        Begin your application today to lock in priority reviews and early-bird counseling.
                    </p>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <button
                            onClick={onApply}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                background: 'linear-gradient(180deg, var(--accent-light), var(--accent))',
                                color: '#white',
                                fontWeight: 800,
                                padding: '16px 32px',
                                borderRadius: '16px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 10px 20px rgba(179, 4, 55, 0.3)',
                                textDecoration: 'none'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 15px 30px rgba(179, 4, 55, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 10px 20px rgba(179, 4, 55, 0.3)';
                            }}
                        >
                            Start Application
                            <RiArrowRightLine style={{ fontSize: '20px' }} />
                        </button>

                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                                <RiMagicLine style={{ color: 'var(--accent-light)' }} />
                                5-Min Process
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>Secure & SSO Enabled</div>
                        </div>
                    </div>
                </div>

                {/* Benefits List Card */}
                <div style={{
                    flex: '0 1 300px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '32px',
                    borderRadius: '24px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Why apply today?</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <BenefitItem text="Priority Counsellor Match" />
                        <BenefitItem text="Application Fee Waiver" />
                        <BenefitItem text="Early-Bird Scholarships" />
                        <BenefitItem text="Document Pre-verification" />
                    </ul>
                </div>
            </div>
        </section>
    );
};

const BenefitItem = ({ text }) => (
    <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 500 }}>
        <div style={{ 
            width: '20px', 
            height: '20px', 
            borderRadius: '50%', 
            background: 'var(--accent)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '10px'
        }}>
            ✓
        </div>
        {text}
    </li>
);

export default EnrollmentHero;
