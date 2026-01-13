import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
    const { theme, effectiveTheme, setTheme } = useTheme();
    const [showMenu, setShowMenu] = useState(false);

    const themes: Array<{ value: 'light' | 'dark' | 'system'; label: string; icon: string }> = [
        { value: 'light', label: 'Açık', icon: '☀️' },
        { value: 'dark', label: 'Koyu', icon: '🌙' },
        { value: 'system', label: 'Sistem', icon: '💻' }
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                title="Tema Değiştir"
            >
                <span className="text-lg">{effectiveTheme === 'dark' ? '🌙' : '☀️'}</span>
            </button>

            {showMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {themes.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => {
                                    setTheme(t.value);
                                    setShowMenu(false);
                                }}
                                className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all hover:bg-white/5 ${theme === t.value ? 'bg-white/10 text-white' : 'text-slate-400'
                                    }`}
                            >
                                <span className="text-lg">{t.icon}</span>
                                <span className="text-sm font-bold">{t.label}</span>
                                {theme === t.value && (
                                    <svg className="w-4 h-4 ml-auto text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
