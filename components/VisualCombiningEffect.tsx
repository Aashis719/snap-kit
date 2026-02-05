import React, { useMemo } from 'react';

interface VisualCombiningEffectProps {
    isGenerating: boolean;
}

export const VisualCombiningEffect: React.FC<VisualCombiningEffectProps> = ({ isGenerating }) => {
    // Generate some random paths for "wires"
    const wires = useMemo(() => {
        return Array.from({ length: 5 }).map((_, i) => {
            const yStart = 30 + i * 10; // Start points spread out
            const yEnd = 40 + (i % 3) * 10; // End points spread out
            const controlPointX1 = 30 + Math.random() * 20;
            const controlPointX2 = 50 + Math.random() * 20;

            return {
                id: i,
                d: `M 0,${yStart} C ${controlPointX1},${yStart} ${controlPointX2},${yEnd} 100,${yEnd}`,
                delay: i * 0.3,
                duration: 1.5 + Math.random() * 1
            };
        });
    }, []);

    if (!isGenerating) return null;

    return (
        <div className="absolute top-1/2 left-full w-8 h-40 pointer-events-none z-0 overflow-visible hidden xl:block -translate-y-1/2">
            <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="wirePulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
                        <stop offset="50%" stopColor="white" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>

                    <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {wires.map((wire) => (
                    <g key={wire.id}>
                        {/* Static Path Background (the wire itself) */}
                        <path
                            d={wire.d}
                            stroke="currentColor"
                            strokeWidth="0.4"
                            fill="none"
                            className="text-primary/10"
                        />

                        {/* Glow Layer */}
                        <path
                            d={wire.d}
                            stroke="var(--primary)"
                            strokeWidth="0.8"
                            fill="none"
                            className="opacity-20"
                            filter="url(#glowEffect)"
                        />

                        {/* Animated Energy Pulse */}
                        <path
                            d={wire.d}
                            stroke="url(#wirePulseGradient)"
                            strokeWidth="1.2"
                            fill="none"
                            strokeDasharray="15 85"
                            filter="url(#glowEffect)"
                        >
                            <animate
                                attributeName="stroke-dashoffset"
                                from="100"
                                to="-100"
                                dur={`${wire.duration}s`}
                                begin={`${wire.delay}s`}
                                repeatCount="indefinite"
                            />
                        </path>

                        {/* Leading Energy Sparkle */}
                        <circle r="1" fill="white" filter="url(#glowEffect)">
                            <animateMotion
                                dur={`${wire.duration}s`}
                                begin={`${wire.delay}s`}
                                repeatCount="indefinite"
                                path={wire.d}
                            />
                            <animate
                                attributeName="opacity"
                                values="0;1;0.5;0"
                                dur={`${wire.duration}s`}
                                repeatCount="indefinite"
                            />
                        </circle>
                    </g>
                ))}
            </svg>
        </div>
    );
};
