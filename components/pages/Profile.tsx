import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../ui/Icons';
import { getUserProfile, updateUserProfile, deleteAccount, getUserStats, uploadAvatar } from '../../services/supabaseService';
import { useNavigate, Link } from 'react-router-dom';

interface ProfileProps {
    user: any;
    authInitialized: boolean;
    setShowAuth: (show: boolean) => void;
    onUpdateProfile?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, authInitialized, setShowAuth, onUpdateProfile }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [fullName, setFullName] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (!authInitialized) return;

        if (!user) {
            setShowAuth(true);
            navigate('/');
            return;
        }
        loadData();
    }, [user, authInitialized]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const loadData = async () => {
        try {
            const [profileData, statsData] = await Promise.all([
                getUserProfile(user.id),
                getUserStats(user.id)
            ]);
            setFullName(profileData.full_name || '');
            setAvatarUrl(profileData.avatar_url || '');
            setStats(statsData);
        } catch (error) {
            console.error('Error loading profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        // Check size (< 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image size must be less than 2MB' });
            return;
        }

        setIsUploading(true);
        try {
            const url = await uploadAvatar(user.id, file);
            setAvatarUrl(url);
            setMessage({ type: 'success', text: 'Avatar updated!' });
            if (onUpdateProfile) onUpdateProfile();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to upload avatar' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage(null);
        try {
            await updateUserProfile(user.id, { full_name: fullName });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            loadData();
            if (onUpdateProfile) onUpdateProfile();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmationText !== 'DELETE') return;

        setIsDeleting(true);
        try {
            await deleteAccount(user.id);
            navigate('/');
            window.location.reload();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to delete account' });
            setShowDeleteModal(false);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading || !authInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Icons.RefreshCw className="w-6 h-6 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen text-text-main pb-10 ">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-surfaceHighlight">
                    <div className="space-y-0">
                        <Link to="/generate" className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-sm group">
                            <Icons.ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Generate
                        </Link>
                    </div>


                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    <div className="lg:col-span-2 space-y-8">
                        <section className="space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Icons.User className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-lg">Personal Information</h3>
                            </div>

                            <div className="bg-white dark:bg-surface border border-surfaceHighlight rounded-2xl p-6 md:p-8 shadow-sm">
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    {/* Avatar Upload */}
                                    <div className="flex flex-col items-center gap-4 pb-6 border-b border-surfaceHighlight">
                                        <div className="relative group flex-shrink-0">
                                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-purple-600 p-[3px] shadow-2xl shadow-primary/20">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover bg-surface" />
                                                ) : (
                                                    <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                                                        <span className="text-4xl font-bold text-primary">
                                                            {(fullName || user.email || "").charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Overlay for upload */}
                                                <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-[2px]">
                                                    <Icons.Upload className="w-8 h-8 text-white drop-shadow-md" />
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploading} />
                                                </label>
                                            </div>
                                            {isUploading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-surface/80 rounded-full z-10">
                                                    <Icons.RefreshCw className="w-8 h-8 text-primary animate-spin" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Dynamic Name Display */}
                                        <div className="text-center ">
                                            <h2 className="text-2xl font-bold text-text-main tracking-tight">
                                                {fullName || 'Your Name'}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Display Name</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Enter your name"
                                            className="w-full bg-background border border-surfaceHighlight rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Email Address</label>
                                        <div className="relative group">
                                            <input
                                                type="email"
                                                value={user?.email}
                                                disabled
                                                className="w-full bg-surfaceHighlight/50 border border-surfaceHighlight rounded-xl px-4 py-3 text-sm text-text-muted cursor-not-allowed"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <Icons.Lock className="w-4 h-4 text-text-muted/40" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-text-muted">Primary login email cannot be changed.</p>
                                    </div>

                                    {message && (
                                        <div className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-3 animate-fade-in ${message.type === 'success'
                                            ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20'
                                            : 'bg-red-500/5 text-red-500 border-red-500/20'
                                            }`}>
                                            {message.type === 'success' ? <Icons.CheckCircle className="w-5 h-5" /> : <Icons.AlertCircle className="w-5 h-5" />}
                                            {message.text}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primaryHover text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                                    >
                                        {updating ? <Icons.RefreshCw className="w-4 h-4 animate-spin" /> : <Icons.Save className="w-4 h-4" />}
                                        {updating ? 'Saving...' : 'Update Profile'}
                                    </button>
                                </form>
                            </div>
                        </section>

                        {/* Danger Zone */}
                        <section className="pt-8 border-t border-surfaceHighlight hidden md:block">
                            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h4 className="text-base font-bold text-red-500 flex items-center gap-2">
                                        <Icons.Trash2 className="w-4 h-4" />
                                        Delete Account
                                    </h4>
                                    <p className="text-xs text-text-muted max-w-sm">
                                        This will permanently delete your account and all associated data. This action is irreversible.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setDeleteConfirmationText('');
                                        setShowDeleteModal(true);
                                    }}
                                    className="px-6 py-2.5 text-xs font-bold bg-transparent border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                >
                                    Terminate Account
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Stats Sidebar */}
                    <aside className="space-y-8">
                        <section className="space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-accent/10 text-accent">
                                    <Icons.Activity className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-lg">Usage Statistics</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { label: 'Total Creations', value: stats?.total_generations || 0, icon: Icons.Sparkles, color: 'text-primary' },
                                    { label: 'Credits Remaining', value: stats?.free_remaining || 0, icon: Icons.Zap, color: 'text-amber-500' },
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white dark:bg-surface border border-surfaceHighlight rounded-2xl p-6 shadow-sm group hover:border-primary/30 transition-colors">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`p-2 rounded-lg bg-surfaceHighlight/50 ${item.color}`}>
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <Icons.ArrowUpRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <p className="text-2xl font-bold">{item.value}</p>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{item.label}</p>
                                    </div>
                                ))}
                            </div>


                        </section>
                    </aside>


                </div>
                {/* Danger Zone */}
                <section className="pt-8 border-t border-surfaceHighlight md:hidden">
                    <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h4 className="text-base font-bold text-red-500 flex items-center gap-2">
                                <Icons.Trash2 className="w-4 h-4" />
                                Delete Account
                            </h4>
                            <p className="text-xs text-text-muted max-w-sm">
                                This will permanently delete your account and all associated data. This action is irreversible.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setDeleteConfirmationText('');
                                setShowDeleteModal(true);
                            }}
                            className="px-6 py-2.5 text-xs font-bold bg-transparent border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        >
                            Terminate Account
                        </button>
                    </div>
                </section>
            </div>

            {/* Modal */}
            {showDeleteModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in mb-10">
                    <div className="bg-white dark:bg-surface border border-surfaceHighlight rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-8 animate-fade-in-up">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-500/5">
                                <Icons.AlertTriangle className="w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold">Absolute Final Warning</h3>
                                <p className="text-xs text-text-muted leading-relaxed">
                                    All your data, history, and credits will be wiped instantly. This cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-muted uppercase text-center block tracking-widest">Type DELETE to confirm</label>
                                <input
                                    type="text"
                                    value={deleteConfirmationText}
                                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full bg-background border border-surfaceHighlight rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-center tracking-[0.2em]"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-3 bg-surfaceHighlight text-xs font-bold rounded-xl hover:bg-border transition-colors uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors uppercase tracking-widest shadow-lg shadow-red-600/20"
                                >
                                    {isDeleting ? 'Ending...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

