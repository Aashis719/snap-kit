import React from 'react';
import { Icons } from './ui/Icons';

interface FreeGenerationBadgeProps {
    remaining: number;
    limit: number;
    hasOwnKey: boolean;
}

export const FreeGenerationBadge: React.FC<FreeGenerationBadgeProps> = ({ remaining, limit, hasOwnKey }) => {
    if (hasOwnKey) {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold animate-fade-in shadow-sm shadow-accent/5">
                <Icons.Zap className="w-3.5 h-3.5" />
                <span>Unlimited Pro</span>
            </div>
        );
    }

    const percentage = (remaining / limit) * 100;
    const isLow = remaining === 1;
    const isExhausted = remaining === 0;

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 animate-fade-in shadow-sm
            ${isExhausted
                ? 'bg-red-500/10 border-red-500/30 text-red-500'
                : isLow
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-500'
                    : 'bg-primary/10 border-primary/30 text-primary'
            }`}
        >
            <div className="relative flex h-2 w-2">
                {!isExhausted && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 
                        ${isLow ? 'bg-orange-500' : 'bg-primary'}`}
                    ></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 
                    ${isExhausted ? 'bg-red-500' : isLow ? 'bg-orange-500' : 'bg-primary'}`}
                ></span>
            </div>
            <span className="text-xs font-bold tracking-tight">
                {isExhausted ? 'Credits Exhausted' : `${remaining}/${limit} Free Credits`}
            </span>
        </div>
    );
};
