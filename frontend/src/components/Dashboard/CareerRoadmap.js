import React, { useEffect, useMemo } from 'react';
import {
    RiCheckLine,
    RiEdit2Line,
    RiChatVoiceLine,
    RiAwardLine,
} from 'react-icons/ri';

import { useAuth } from '../../context/AuthContext';
import { MAIN_APP_URL } from '../../services/api';

const CareerRoadmap = () => {
    const {
        user,
        applications,
        counselings,
        refreshApplications,
        refreshCounselings,
        generateRedirectCode,
    } = useAuth();

    useEffect(() => {
        refreshApplications();
        refreshCounselings();
    }, [refreshApplications, refreshCounselings]);

    // =====================================================
    // ROADMAP STATE
    // =====================================================

    const roadmapState = useMemo(() => {
        const isEnrolled =
            user?.role === 'candidate' ||
            user?.role === 'admin' ||
            user?.role === 'enrolled_user';

        const hasApplication =
            (applications || []).length > 0 || isEnrolled;

        const hasCounseling =
            (counselings || []).length > 0 || isEnrolled;

        let currentStep = 1;

        if (isEnrolled) {
            currentStep = 4;
        } else if (!hasApplication) {
            currentStep = 2;
        } else if (!hasCounseling) {
            currentStep = 3;
        } else {
            currentStep = 4;
        }

        const steps = [
            {
                id: 1,
                label: 'Goal Set',
                icon: RiCheckLine,
                status: 'completed',
                description: 'Interested course selected',
            },

            {
                id: 2,
                label: 'Application',
                icon: RiEdit2Line,
                status:
                    hasApplication || isEnrolled
                        ? 'completed'
                        : currentStep === 2
                            ? 'active'
                            : 'upcoming',

                description: 'Begin your enrollment',
            },

            {
                id: 3,
                label: 'Counseling',
                icon: RiChatVoiceLine,
                status:
                    hasCounseling || isEnrolled
                        ? 'completed'
                        : currentStep === 3
                            ? 'active'
                            : 'upcoming',

                description: 'Connect with experts',
            },

            {
                id: 4,
                label: 'Success',
                icon: RiAwardLine,

                status:
                    currentStep === 4
                        ? isEnrolled
                            ? 'completed'
                            : 'active'
                        : 'upcoming',

                description: isEnrolled
                    ? 'Enrollment Confirmed'
                    : 'Official enrollment',
            },
        ];

        return {
            steps,
            currentStep,
            isEnrolled,
        };
    }, [applications, counselings, user]);

    const { steps, currentStep, isEnrolled } = roadmapState;

    // =====================================================
    // NEXT STEP ACTION
    // =====================================================

    const handleNextStep = async () => {
        const code = await generateRedirectCode();

        if (!code) {
            alert('Redirection failed. Please try again.');
            return;
        }

        let path = '/apply';

        if (currentStep === 3) {
            path = '/apply?type=counseling';
        }

        if (currentStep === 4) {
            path = '/';
        }

        window.location.href =
            `${MAIN_APP_URL}${path}${path.includes('?') ? '&' : '?'}code=${code}`;
    };

    // =====================================================
    // ENROLLED STATE UI
    // =====================================================

    if (isEnrolled) {
        return (
            <section className="bg-white rounded-none py-12 border-none">

                <div className="px-6">

                    {/* HEADER */}

                    <div className="mb-10 text-left">

                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-8 h-1 bg-green" />

                            <h3 className="text-[14px] font-extrabold text-green uppercase tracking-[0.2em]">
                                Enrollment Complete
                            </h3>
                        </div>

                        <h2 className="text-[32px] font-extrabold text-navy leading-tight m-0">
                            Your Journey is Successfully Completed
                        </h2>

                    </div>

                    {/* MAIN CARD */}

                    <div className="border border-green bg-[#f0fdf4] p-8 flex flex-col gap-6">

                        {/* TOP SUCCESS */}

                        <div className="flex items-center gap-4">

                            <div className="w-16 h-16 bg-green text-white flex items-center justify-center text-[32px]">
                                <RiCheckLine />
                            </div>

                            <div>

                                <h3 className="text-[24px] font-extrabold text-navy m-0">
                                    Congratulations!
                                </h3>

                                <p className="text-text-secondary text-[15px] mt-2 mb-0">
                                    Your enrollment has been successfully confirmed.
                                    You are now officially part of the program.
                                </p>

                            </div>
                        </div>

                        {/* COMPLETED STEPS */}

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                            {steps.map((step) => (
                                <div
                                    key={step.id}
                                    className="border border-border p-5 bg-white flex flex-col items-center text-center"
                                >

                                    <div className="w-12 h-12 bg-green text-white flex items-center justify-center text-[22px] mb-4">
                                        <RiCheckLine />
                                    </div>

                                    <h4 className="text-[14px] font-extrabold uppercase tracking-wider text-navy m-0 mb-2">
                                        {step.label}
                                    </h4>

                                    <p className="text-[12px] text-text-secondary m-0">
                                        {step.description}
                                    </p>

                                </div>
                            ))}

                        </div>

                        {/* STATUS */}

                        <div className="border-l-4 border-green bg-white p-5">

                            <span className="text-[11px] font-bold text-green uppercase tracking-widest block mb-1">
                                Status
                            </span>

                            <p className="text-[16px] text-navy font-bold m-0">
                                Your admission and enrollment process has been fully completed.
                            </p>

                        </div>

                    </div>
                </div>
            </section>
        );
    }

    // =====================================================
    // NORMAL ROADMAP FLOW
    // =====================================================

    return (
        <section className="bg-white rounded-none py-12 border-none">

            {/* HEADER */}

            <header className="mb-12 text-left px-6">

                <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-1 bg-accent" />

                    <h3 className="text-[14px] font-extrabold text-accent uppercase tracking-[0.2em]">
                        The Journey
                    </h3>
                </div>

                <h2 className="text-[28px] font-extrabold text-navy m-0 font-display leading-tight">
                    Tracking Your Path to Success
                </h2>

            </header>

            <div className="px-6">

                <div className="relative flex justify-between gap-0">

                    {/* TRACK LINE */}

                    <div className="absolute top-[28px] left-0 right-0 h-1 bg-[#f1f5f9] z-0" />

                    {/* ACTIVE LINE */}

                    <div
                        className="absolute top-[28px] left-0 h-1 bg-green z-[5] transition-all duration-500"
                        style={{
                            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                        }}
                    />

                    {/* STEPS */}

                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className="flex-1 flex flex-col items-center z-10 relative group"
                        >

                            <div
                                className={`
                                    w-14 h-14 rounded-none flex items-center justify-center text-[22px] mb-4 transition-all duration-300 border-2
                                    ${step.status === 'completed'
                                        ? 'bg-green border-green text-white'
                                        : step.status === 'active'
                                            ? 'bg-accent border-accent text-white scale-110'
                                            : 'bg-white border-[#f1f5f9] text-text-muted'}
                                `}
                            >
                                {step.status === 'completed'
                                    ? <RiCheckLine />
                                    : <step.icon />}
                            </div>

                            <div className="text-center px-2">

                                <div
                                    className={`
                                        text-[15px] font-extrabold mb-1 uppercase tracking-wider
                                        ${step.status === 'upcoming'
                                            ? 'text-text-muted'
                                            : 'text-navy'}
                                    `}
                                >
                                    {step.label}
                                </div>

                                <p
                                    className={`
                                        text-[12px] m-0 max-w-[140px] leading-relaxed
                                        ${step.status === 'active'
                                            ? 'text-text-secondary font-medium'
                                            : 'text-text-muted'}
                                    `}
                                >
                                    {step.description}
                                </p>

                            </div>
                        </div>
                    ))}

                </div>
            </div>

            {/* CURRENT FOCUS */}

            <div className="mt-12 mx-6 p-6 bg-surface-tint border-l-4 border-accent flex justify-between items-center flex-wrap gap-4">

                <div className="flex-1 min-w-[300px]">

                    <span className="text-[11px] font-bold text-accent uppercase tracking-widest block mb-1">
                        Current Focus
                    </span>

                    <p className="text-[16px] text-navy font-bold m-0">
                        {`Step ${currentStep}: ${steps.find(s => s.id === currentStep)?.description}`}
                    </p>

                </div>

                {currentStep < 4 && (
                    <button
                        onClick={handleNextStep}
                        className="bg-navy text-white hover:bg-navy-soft px-8 py-4 font-extrabold text-sm transition-all duration-200 transform active:scale-95"
                    >
                        {currentStep === 2
                            ? 'Start Application'
                            : 'Book Counseling'}
                    </button>
                )}

            </div>
        </section>
    );
};

export default CareerRoadmap;