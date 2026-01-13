
import React, { useEffect, useState } from 'react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
    notifications: AppNotification[];
    onClose: (id: string) => void;
    onClearAll: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
    notifications,
    onClose,
    onClearAll
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    // Auto-close logic for toasts
    useEffect(() => {
        notifications.forEach(n => {
            if (n.autoClose) {
                const timer = setTimeout(() => onClose(n.id), 5000);
                return () => clearTimeout(timer);
            }
        });
    }, [notifications, onClose]);

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'success': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
            case 'warning': return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
            case 'error': return 'border-rose-500/30 bg-rose-500/10 text-rose-400';
            default: return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
        }
    };

    return (
        <>
            {/* Notification Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-6 right-6 z-[60] p-4 bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group"
            >
                <div className="relative">
                    <svg className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-slate-900 animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </button>

            {/* Notification Sidebar */}
            <div className={`fixed inset-y-0 right-0 w-80 bg-slate-950/95 backdrop-blur-2xl border-l border-white/5 z-[70] transform transition-transform duration-500 ease-out shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
                            BİLDİRİMLER
                        </h2>
                        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/5">
                        {notifications.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 filter grayscale">
                                <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                <span className="text-xs font-black uppercase tracking-widest">Henüz bildirim yok</span>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`p-4 rounded-2xl border ${getTypeStyles(n.type)} transition-all hover:bg-white/5 relative group`}
                                >
                                    <button
                                        onClick={() => onClose(n.id)}
                                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-3 h-3 text-slate-500 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                    <h4 className="text-[10px] font-black uppercase mb-1">{n.message}</h4>
                                    {n.description && <p className="text-[9px] opacity-70 leading-relaxed italic">{n.description}</p>}
                                    <span className="text-[8px] opacity-30 mt-2 block font-mono">{new Date(n.timestamp).toLocaleTimeString()}</span>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <button
                            onClick={onClearAll}
                            className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[9px] font-black uppercase rounded-xl transition-all border border-white/5"
                        >
                            TÜMÜNÜ TEMİZLE
                        </button>
                    )}
                </div>
            </div>

            {/* Background Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] animate-in fade-in duration-300"
                />
            )}
        </>
    );
};
