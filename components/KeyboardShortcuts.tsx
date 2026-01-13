import React, { useState, useEffect } from 'react';
import { useKeyPress } from '../hooks';

interface KeyboardShortcutsProps {
    onNewPatient?: () => void;
    onPrepareKit?: () => void;
    onExport?: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
    onNewPatient,
    onPrepareKit,
    onExport
}) => {
    const [showHelp, setShowHelp] = useState(false);

    // Show help modal with '?'
    useKeyPress('?', () => setShowHelp(true));

    // Close help modal with Escape
    useKeyPress('Escape', () => setShowHelp(false));

    // New patient: Ctrl/Cmd + N
    useKeyPress('n', () => onNewPatient?.(), { ctrl: true });

    // Prepare kit: Ctrl/Cmd + K
    useKeyPress('k', () => onPrepareKit?.(), { ctrl: true });

    // Export: Ctrl/Cmd + E
    useKeyPress('e', () => onExport?.(), { ctrl: true });

    if (!showHelp) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowHelp(false)} />
            <div className="relative bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md mx-4 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-white">Klavye Kısayolları</h2>
                    <button
                        onClick={() => setShowHelp(false)}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-3">
                    <ShortcutItem
                        keys={['?']}
                        description="Bu yardım menüsünü göster/gizle"
                    />
                    <ShortcutItem
                        keys={['Ctrl', 'N']}
                        description="Yeni hasta ekle"
                    />
                    <ShortcutItem
                        keys={['Ctrl', 'K']}
                        description="Kit hazırlama"
                    />
                    <ShortcutItem
                        keys={['Ctrl', 'E']}
                        description="Rapor dışa aktar"
                    />
                    <ShortcutItem
                        keys={['Esc']}
                        description="İptal / Kapat"
                    />
                </div>

                <div className="mt-6 pt-6 border-t border-white/5">
                    <p className="text-xs text-slate-500 text-center">
                        macOS'ta <kbd className="px-1.5 py-0.5 bg-white/5 rounded font-mono text-[10px]">Ctrl</kbd> yerine <kbd className="px-1.5 py-0.5 bg-white/5 rounded font-mono text-[10px]">⌘ Cmd</kbd> kullanın
                    </p>
                </div>
            </div>
        </div>
    );
};

const ShortcutItem: React.FC<{ keys: string[]; description: string }> = ({ keys, description }) => (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
        <span className="text-sm text-slate-300">{description}</span>
        <div className="flex gap-1">
            {keys.map((key, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <span className="text-slate-600 mx-1">+</span>}
                    <kbd className="px-2 py-1 bg-slate-800 border border-white/10 rounded-lg text-xs font-mono text-white min-w-[32px] text-center">
                        {key}
                    </kbd>
                </React.Fragment>
            ))}
        </div>
    </div>
);
