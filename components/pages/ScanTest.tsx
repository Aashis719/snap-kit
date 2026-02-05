import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/Icons';

export const ScanTest: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const startScan = () => {
        if (!image) return;
        setIsScanning(true);
        setScanProgress(0);
    };

    useEffect(() => {
        let interval: any;
        if (isScanning) {
            interval = setInterval(() => {
                setScanProgress(prev => {
                    if (prev >= 100) {
                        setIsScanning(false);
                        return 100;
                    }
                    return prev + 1;
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isScanning]);

    return (
        <div className="min-h-screen bg-background text-text-main p-8 flex flex-col items-center justify-center gap-12 font-sans overflow-hidden">
            <div className="max-w-4xl w-full text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                    AI <span className="text-primary italic">Scanner</span> Lab
                </h1>
                <p className="text-text-muted text-lg font-light tracking-wide">
                    Testing the next-gen visual analysis interface.
                </p>
            </div>

            <div className={`relative w-full max-w-lg group transition-all duration-500 ${!image ? 'aspect-[4/5]' : ''}`}>
                {/* Scanner Frame */}
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 rounded-[2.5rem] blur-2xl opacity-50"></div>

                <div className="relative w-full bg-surface rounded-[2rem] border border-surfaceHighlight shadow-2xl overflow-hidden flex flex-col">

                    {/* HUD Elements */}
                    <div className="absolute top-6 left-6 z-30 flex items-center gap-2 pointer-events-none">
                        <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-primary animate-pulse' : 'bg-text-muted'}`}></div>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{isScanning ? 'Scanning' : 'Ready'}</span>
                    </div>

                    <div className="absolute top-6 right-6 z-30 pointer-events-none">
                        <div className="px-3 hidden py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                            {/* <div className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-accent animate-pulse' : 'bg-primary'}`}></div> */}
                        </div>
                    </div>

                    {/* Corner Brackets */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/40 rounded-tl-sm z-30"></div>
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/40 rounded-tr-sm z-30"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/40 rounded-bl-sm z-30"></div>
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/40 rounded-br-sm z-30"></div>

                    {/* Main Content Area */}
                    <div className="relative bg-black flex items-center justify-center overflow-hidden">
                        {image ? (
                            <div className="w-full relative">
                                <img
                                    src={image}
                                    alt="Test"
                                    className={`w-full h-auto max-h-[70vh] object-contain transition-all duration-700 ${isScanning ? 'scale-105 blur-[1px]' : ''}`}
                                />

                                {/* Overlay Grid */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

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
                                            {[...Array(3)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute border border-primary/30 rounded-full animate-[ripple_4s_linear_infinite]"
                                                    style={{
                                                        width: '100px',
                                                        height: '100px',
                                                        animationDelay: `${i * 1.3}s`
                                                    }}
                                                ></div>
                                            ))}
                                        </div>

                                        {/* Digital Readout */}
                                        <div className="absolute inset-0 z-40 bg-black/20 flex flex-col items-center justify-center gap-4">
                                            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[10px] font-black text-primary tracking-[0.3em] uppercase animate-pulse">Analyzing Pixels</span>
                                                <span className="text-[20px] font-black text-white">{scanProgress}%</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <label className="w-full aspect-[4/5] flex flex-col items-center justify-center gap-6 cursor-pointer group/upload bg-surface">
                                <div className="w-20 h-20 rounded-[2rem] bg-surfaceHighlight/30 flex items-center justify-center border border-surfaceHighlight group-hover/upload:border-primary/50 transition-all duration-500">
                                    <Icons.Upload className="w-10 h-10 text-text-muted group-hover/upload:text-primary group-hover/upload:scale-110 transition-all duration-500" />
                                </div>
                                <div className="space-y-2 text-center">
                                    <span className="text-lg font-black block group-hover/upload:text-primary transition-colors">INITIALIZE UPLOAD</span>
                                    <span className="text-xs text-text-muted uppercase tracking-widest font-bold">Select source file for analysis</span>
                                </div>
                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                {image && !isScanning && (
                    <button
                        onClick={startScan}
                        className="px-12 py-5 bg-gradient-to-r from-primary via-primaryHover to-primary rounded-2xl text-white font-black text-lg shadow-2xl shadow-primary/30 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3 uppercase tracking-tighter"
                    >
                        <Icons.Sparkles className="w-6 h-6" />
                        Run High-Res Scan
                    </button>
                )}
                {image && (
                    <button
                        onClick={() => { setImage(null); setIsScanning(false); }}
                        className="px-8 py-5 bg-surfaceHighlight/30 border border-surfaceHighlight rounded-2xl text-text-muted font-black text-lg hover:bg-surfaceHighlight/50 hover:text-text-main transition-all uppercase tracking-tighter"
                    >
                        Reset
                    </button>
                )}
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
