import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Icons } from '../ui/Icons';

export const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Get the current session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    throw error;
                }

                if (session) {
                    setStatus('success');
                    setMessage('Email verified successfully! Redirecting...');

                    // Wait a moment to show success message
                    setTimeout(() => {
                        navigate('/');
                    }, 2000);
                } else {
                    throw new Error('No session found');
                }
            } catch (error: any) {
                console.error('Auth callback error:', error);
                setStatus('error');
                setMessage(error.message || 'Failed to verify email. Please try again.');
            }
        };

        handleAuthCallback();

        // Also listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                setStatus('success');
                setMessage('Email verified successfully! Redirecting...');
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-surface rounded-2xl shadow-xl border border-surfaceHighlight p-8 text-center">
                    {/* Logo */}
                    <div className="w-16 h-16 mx-auto mb-6">
                        <img src="/snapkit.png" alt="SnapKit" className="w-full h-full object-cover" />
                    </div>

                    {/* Status Icon */}
                    {status === 'verifying' && (
                        <div className="relative w-16 h-16 mx-auto mb-6">
                            <div className="absolute inset-0 border-4 border-surfaceHighlight rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="w-16 h-16 mx-auto mb-6 bg-accent/20 rounded-full flex items-center justify-center">
                            <Icons.Check className="w-8 h-8 text-accent" />
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                            <Icons.AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                    )}

                    {/* Message */}
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {status === 'verifying' && 'Verifying Email'}
                        {status === 'success' && 'Email Verified!'}
                        {status === 'error' && 'Verification Failed'}
                    </h2>

                    <p className="text-text-muted mb-6">{message}</p>

                    {/* Action Button */}
                    {status === 'error' && (
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-primary hover:bg-primaryHover text-white rounded-lg font-medium transition-colors"
                        >
                            Go to Homepage
                        </button>
                    )}

                    {status === 'success' && (
                        <div className="flex items-center justify-center gap-2 text-sm text-accent">
                            <Icons.Sparkles className="w-4 h-4" />
                            <span>Get ready to create amazing content!</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
