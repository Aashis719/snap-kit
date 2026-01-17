import React from 'react';
import { Icons } from './ui/Icons';

interface FreeGenerationBadgeProps {
    used: number;
    limit: number;
    hasOwnKey: boolean;
}

export const FreeGenerationBadge: React.FC<FreeGenerationBadgeProps> = ({
    used,
    limit,
    hasOwnKey
}) => {
    if (hasOwnKey) {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                <Icons.Check className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium text-accent">Unlimited</span>
            </div>
        );
    }

    const remaining = Math.max(0, limit - used);
    const percentage = (remaining / limit) * 100;

    // Color based on remaining generations
    let colorClass = 'text-accent border-accent/20 bg-accent/10';
    if (percentage <= 33) {
        colorClass = 'text-red-400 border-red-400/20 bg-red-400/10';
    } else if (percentage <= 66) {
        colorClass = 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10';
    }

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${colorClass}`}>
            <Icons.Sparkles className="w-4 h-4" />
            <span className="text-xs font-medium">
                {remaining}/{limit} Free
            </span>
        </div>
    );
};

interface FreeGenerationCounterProps {
    used: number;
    limit: number;
    hasOwnKey: boolean;
    className?: string;
}

export const FreeGenerationCounter: React.FC<FreeGenerationCounterProps> = ({
    used,
    limit,
    hasOwnKey,
    className = ''
}) => {
    if (hasOwnKey) {
        return (
            <div className={`flex items-center gap-2 text-sm ${className}`}>
                <div className="flex items-center gap-1.5 text-accent">
                    <Icons.Zap className="w-4 h-4" />
                    <span className="font-medium">Unlimited Generations</span>
                </div>
                <span className="text-text-muted text-xs">(Using your API key)</span>
            </div>
        );
    }

    const remaining = Math.max(0, limit - used);

    return (
        <div className={`${className}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-main">Free Generations</span>
                <span className="text-sm font-bold text-primary">{remaining}/{limit}</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-surfaceHighlight rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${(remaining / limit) * 100}%` }}
                />
            </div>

            {remaining === 0 && (
                <p className="text-xs text-text-muted mt-2">
                    Add your API key to continue generating
                </p>
            )}
        </div>
    );
};
