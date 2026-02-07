import React, { useMemo } from 'react';

interface VisualCombiningEffectProps {
    isGenerating: boolean;
    vertical?: boolean;
}

export const VisualCombiningEffect: React.FC<VisualCombiningEffectProps> = ({ isGenerating, vertical = false }) => {
    // Simplified straight wire connection
    // If vertical, path goes from top (50,0) to bottom (50,100)
    const wirePath = vertical ? "M 50,0 L 50,100" : "M 0,50 L 100,50";

    return (
        <div className={`relative overflow-visible flex items-center justify-center ${vertical ? 'w-12 h-16' : 'w-24 h-12'}`}>
            <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.2" />
                    </linearGradient>

                    <linearGradient id="activePulse" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
                        <stop offset="50%" stopColor="#fff" stopOpacity="1" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>

                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Base Wire (Always Visible) */}
                <path
                    d={wirePath}
                    stroke="var(--surfaceHighlight)"
                    strokeWidth="3"
                    fill="none"
                    opacity="0.6"
                />

                {/* Connection Nodes */}
                <circle cx={vertical ? "50" : "0"} cy={vertical ? "0" : "50"} r="3" fill="var(--surfaceHighlight)" />
                <circle cx={vertical ? "50" : "100"} cy={vertical ? "100" : "50"} r="3" fill="var(--surfaceHighlight)" />


                {/* Animated Data Flow (Only when generating) */}
                {isGenerating && (
                    <>
                        {/* Glowing Path */}
                        <path
                            d={wirePath}
                            stroke="url(#wireGradient)"
                            strokeWidth="3"
                            fill="none"
                            filter="url(#glow)"
                            className="opacity-80"
                        />

                        {/* Moving Energy Pulses */}
                        <circle r="4" fill="#fff" filter="url(#glow)">
                            <animateMotion
                                dur="1.5s"
                                repeatCount="indefinite"
                                path={wirePath}
                                calcMode="spline"
                                keySplines="0.4 0 0.2 1"
                                keyTimes="0;1"
                            />
                            <animate
                                attributeName="opacity"
                                values="0;1;0"
                                dur="1.5s"
                                repeatCount="indefinite"
                            />
                        </circle>

                        {/* Secondary trailing pulse */}
                        <circle r="2" fill="var(--primary)" filter="url(#glow)">
                            <animateMotion
                                dur="1.5s"
                                begin="0.2s"
                                repeatCount="indefinite"
                                path={wirePath}
                                calcMode="spline"
                                keySplines="0.4 0 0.2 1"
                                keyTimes="0;1"
                            />
                        </circle>
                    </>
                )}
            </svg>
        </div>
    );
};
