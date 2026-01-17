import React from 'react';
import { AppStatus } from '../types';

interface VisualFlowConnectorProps {
    status: AppStatus;
}

export const VisualFlowConnector: React.FC<VisualFlowConnectorProps> = ({ status }) => {
    const isActive = status === 'uploading' || status === 'analyzing' || status === 'generating';

    // Desktop horizontal boundaries (estimated based on lg:col-span-4 / lg:col-span-8 with lg:gap-12)
    const leftEdge = 31.5;  // End of Left Column
    const rightEdge = 35.5; // Start of Right Column

    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-visible">
            <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* DESKTOP CONNECTIONS */}
                <g className="hidden lg:block">
                    {/* Path from Image Card Border to Results Border */}
                    <path
                        d={`M ${leftEdge},8 C 34.5,8 34.5,28 ${rightEdge},28`}
                        stroke="#9419C1"
                        strokeWidth="0.2"
                        className={`transition-opacity duration-700 ${isActive ? 'opacity-80' : 'opacity-30'}`}
                    />

                    {/* Path from Config Card Border to Results Border */}
                    <path
                        d={`M ${leftEdge},58 C 34.5,58 34.5,28 ${rightEdge},28`}
                        stroke="#9419C1"
                        strokeWidth="0.2"
                        className={`transition-opacity duration-700 ${isActive ? 'opacity-80' : 'opacity-30'}`}
                    />

                    {/* Port Nodes at Div Borders */}
                    {/* Left Side (Source) Nodes */}
                    <circle cx={leftEdge} cy="8" r="0.5" stroke="#9419C1" strokeWidth="0.15" fill="white" />
                    <circle cx={leftEdge} cy="8" r="0.25" fill="#9419C1" />

                    <circle cx={leftEdge} cy="58" r="0.5" stroke="#9419C1" strokeWidth="0.15" fill="white" />
                    <circle cx={leftEdge} cy="58" r="0.25" fill="#9419C1" />

                    {/* Right Side (Destination) Node */}
                    <circle cx={rightEdge} cy="28" r="0.5" stroke="#9419C1" strokeWidth="0.15" fill="white" />
                    <circle cx={rightEdge} cy="28" r="0.25" fill="#9419C1" />

                    {/* Shifting Data Pulse Animation */}
                    {isActive && (
                        <>
                            <circle r="0.3" fill="#9419C1">
                                <animateMotion
                                    dur="1.5s"
                                    repeatCount="indefinite"
                                    path={`M ${leftEdge},8 C 34.5,8 34.5,28 ${rightEdge},28`}
                                />
                                <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                            <circle r="0.3" fill="#9419C1">
                                <animateMotion
                                    dur="1.8s"
                                    begin="0.5s"
                                    repeatCount="indefinite"
                                    path={`M ${leftEdge},58 C 34.5,58 34.5,28 ${rightEdge},28`}
                                />
                                <animate attributeName="opacity" values="0;1;0" dur="1.8s" repeatCount="indefinite" />
                            </circle>
                        </>
                    )}
                </g>

                {/* MOBILE/TABLET VIEW */}
                <g className="lg:hidden hidden">
                    <path
                        d="M 50,28 L 50,72"
                        stroke="#9419C1"
                        strokeWidth="0.4"
                        strokeDasharray="1.5 2"
                        className={isActive ? 'animate-flow-dash' : 'opacity-20'}
                    />
                    <circle cx="50" cy="28" r="1.2" stroke="#9419C1" strokeWidth="0.4" fill="white" />
                    <circle cx="50" cy="72" r="1.2" stroke="#9419C1" strokeWidth="0.4" fill="white" />
                </g>
            </svg>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes flow-dash {
                    to { stroke-dashoffset: -20; }
                }
                .animate-flow-dash {
                    animation: flow-dash 1s linear infinite;
                }
            `}} />
        </div>
    );
};
