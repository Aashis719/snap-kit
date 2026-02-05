import React, { useState, useEffect } from 'react';
import { Icons } from './ui/Icons';

interface ScannerProps {
    image: string;
    isScanning: boolean;
    onClear: () => void;
    progress?: number;
}

export const Scanner: React.FC<ScannerProps> = ({ image, isScanning, onClear, progress }) => {
    const [internalScanProgress, setInternalScanProgress] = useState(0);

    useEffect(() => {
        let interval: any;
        if (isScanning && typeof progress === 'undefined') {
            setInternalScanProgress(0);
            interval = setInterval(() => {
                setInternalScanProgress(prev => {
                    if (prev >= 99) return 99;
                    return prev + 1;
                });
            }, 100);
        } else if (!isScanning) {
            setInternalScanProgress(0);
        }
        return () => clearInterval(interval);
    }, [isScanning, progress]);

    const displayProgress = typeof progress !== 'undefined' ? progress : internalScanProgress;

    return (
        <div className={`relative w-full group transition-all duration-500 ${!image ? 'aspect-square' : ''}`}>
            {/* Scanner Frame */}
            <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 rounded-3xl blur-xl opacity-50"></div>

            <div className="relative w-full bg-surface rounded-2xl border border-surfaceHighlight shadow-2xl overflow-hidden flex flex-col">

                {/* HUD Elements */}
                <div className="absolute top-4 left-4 z-30 flex items-center gap-2 pointer-events-none">
                    <div className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-primary animate-pulse' : 'bg-text-muted'}`}></div>
                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-[0.2em]">{isScanning ? 'Scanning' : 'Ready'}</span>
                </div>

                {/* Corner Brackets */}
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-primary/40 rounded-tl-sm z-30"></div>
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-primary/40 rounded-tr-sm z-30"></div>
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-primary/40 rounded-bl-sm z-30"></div>
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-primary/40 rounded-br-sm z-30"></div>

                {/* Main Content Area */}
                <div className="relative bg-black flex items-center justify-center overflow-hidden">
                    <div className="w-full relative">
                        <img
                            src={image}
                            alt="Preview"
                            className={`w-full h-auto max-h-[60vh] object-contain transition-all duration-700 ${isScanning ? 'scale-105 blur-[1px]' : ''}`}
                        />

                        {/* Overlay Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>

                        {/* Clear Button (only when not scanning) */}
                        {!isScanning && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm z-50">
                                <button
                                    onClick={onClear}
                                    className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                                    title="Remove Image"
                                >
                                    <Icons.X className="w-6 h-6" />
                                </button>
                            </div>
                        )}

                        {isScanning && (
                            <>
                                {/* Scanner Beam */}
                                <div
                                    className="absolute top-0 left-0 w-full h-[20%] bg-gradient-to-b from-primary/60 to-transparent z-40 animate-[beam_2s_ease-in-out_infinite]"
                                    style={{ boxShadow: '0 -10px 40px var(--primary)' }}
                                >
                                    <div className="w-full h-[2px] bg-white shadow-[0_0_20px_#fff]"></div>
                                </div>

                                {/* Data Ripples */}
                                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none overflow-hidden">
                                    {[...Array(2)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute border border-primary/30 rounded-full animate-[ripple_4s_linear_infinite]"
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                animationDelay: `${i * 2}s`
                                            }}
                                        ></div>
                                    ))}
                                </div>

                                {/* Digital Readout */}
                                <div className="absolute inset-0 z-40 bg-black/20 flex flex-col items-center justify-center gap-4">
                                    <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${displayProgress}%` }}></div>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[8px] font-black text-primary tracking-[0.2em] uppercase animate-pulse">Analyzing Pixels</span>
                                        <span className="text-[14px] font-black text-white">{displayProgress}%</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Animations Styles */}
            <style>{`
                @keyframes beam {
                    0%, 100% { top: 0%; transform: translateY(0); }
                    50% { top: 100%; transform: translateY(-100%); }
                }
                @keyframes ripple {
                    0% { transform: scale(0.5); opacity: 0; }
                    20% { opacity: 0.5; }
                    100% { transform: scale(4); opacity: 0; }
                }
            `}</style>
        </div>
    );
};
