import React from 'react';
import { useAppStore } from '../stores';

const SettingsPage: React.FC = () => {
    const { theme, setTheme, soundEnabled, toggleSound } = useAppStore();

    return (
        <div className="p-4 md:p-6">
            <div className="bg-gradient-to-r from-slate-800/40 to-slate-900/40 border border-white/10 rounded-2xl p-6 mb-6">
                <h1 className="text-2xl font-black text-white flex items-center gap-3">
                    <span>⚙️</span> Ayarlar
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Uygulama tercihleri ve yapılandırma
                </p>
            </div>

            <div className="space-y-4 max-w-2xl">
                {/* Theme Setting */}
                <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-white">Tema</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Arayüz görünümünü seçin</p>
                        </div>
                        <div className="flex gap-2">
                            {(['dark', 'light', 'system'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${theme === t
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                        }`}
                                >
                                    {t === 'dark' ? '🌙 Koyu' : t === 'light' ? '☀️ Açık' : '💻 Sistem'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sound Setting */}
                <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-white">Bildirim Sesleri</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Uyarı ve bildirim sesleri</p>
                        </div>
                        <button
                            onClick={toggleSound}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${soundEnabled
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-800/50 text-slate-500 border border-slate-700/30'
                                }`}
                        >
                            {soundEnabled ? '🔊 Açık' : '🔇 Kapalı'}
                        </button>
                    </div>
                </div>

                {/* Version Info */}
                <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-white">Uygulama Sürümü</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Nükleer Tıp Asistanı</p>
                        </div>
                        <span className="px-4 py-2 bg-purple-500/10 text-purple-400 rounded-xl text-sm font-bold border border-purple-500/20">
                            v2.0.0
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
