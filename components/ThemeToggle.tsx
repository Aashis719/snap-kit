import React from 'react';
import { useTheme } from './ThemeContext';
import { Icons } from './ui/Icons';

export const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-text-muted hover:text-text-main hover:bg-surfaceHighlight transition-colors duration-200"
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? (
                <Icons.Sun className="w-5 h-5" />
            ) : (
                <Icons.Moon className="w-5 h-5" />
            )}
        </button>
    );
};
