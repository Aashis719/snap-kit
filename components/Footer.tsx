import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from './ui/Icons';
import ThrowableHeart from './ui/heart';

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative z-10 border-t border-border/50 bg-background mt-auto">
            <div className="container mx-auto px-6 py-8 max-w-7xl">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-6">

                    {/* Brand Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-0">
                            <a href="/" className='flex items-center gap-0'>
                            <div className="w-7 h-7">
                                <img src="/snapkit.png" alt="SnapKit Logo" className="w-full h-full object-cover" />
                            </div>
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-primary">
                                SnapKit
                            </h3></a>
                        </div>
                        <p className="text-sm text-text-main max-w-xs leading-relaxed">
                            Transform your photos into viral content with AI-powered captions, hashtags, and scripts.
                        </p>
                        {/* Social Links - Clean minimal style */}
                        <div className="flex items-center gap-4 pt-1">
                            <a
                                href="https://x.com/Aashis_19"
                                className="text-text-muted hover:text-primary transition-colors"
                                aria-label="Twitter"
                                target="_blank"
                            >
                                <Icons.Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="https://github.com/Aashis719/snap-kit"
                                className="text-text-muted hover:text-primary transition-colors"
                                aria-label="GitHub"
                                target="_blank"
                            >
                                <Icons.Github className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className='text-left md:text-center  '>
                        <h4 className="text-sm font-bold text-text-main mb-3">QUICK LINKS</h4>
                        <ul className="space-y-2 flex flex-col justify-center items-center align-left">
                            <li>
                                <Link to="/features" className="text-sm text-text-main/80 hover:text-primary transition-colors">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-sm text-text-main/80 hover:text-primary transition-colors">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy-policy" className="text-sm text-text-main/80 hover:text-primary transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar - Simplified */}
                <div className="pt-6 border-t border-border/30">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-text-main/80">
                        <p>
                            © {currentYear} <span className="text-primary font-medium animate-pulse"><a href="/">SnapKit</a></span>. All rights reserved.
                        </p>
                        <p className="flex items-center gap-1">
                            Made with
                            <ThrowableHeart Icon={Icons.Heart} />
                             by <a href="https://www.aashishneupane.com.np/" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:text-primaryHover transition-colors">Aashish</a>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
