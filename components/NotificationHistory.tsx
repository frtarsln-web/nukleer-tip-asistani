import React, { useState } from 'react';
import { AppNotification, NotificationType } from '../types';

interface NotificationHistoryProps {
    notifications: AppNotification[];
    onClear: () => void;
    onClose: () => void;
    onMarkAsRead: (id: string) => void;
}

export const NotificationHistory: React.FC<NotificationHistoryProps> = ({
    notifications,
    onClear,
    onClose,
    onMarkAsRead
}) => {
    const [filter, setFilter] = useState<'all' | NotificationType>('all');

    const filteredNotifications = filter === 'all'
        ? notifications
        : notifications.filter(n => n.type === filter);

    const unreadCount = notifications.filter(n => !n.read).length;

    const typeStyles: Record<NotificationType, { bg: string; icon: string; label: string }> = {
        success: { bg: 'bg-emerald-500/20 border-emerald-500/30', icon: '✓', label: 'Başarılı' },
        error: { bg: 'bg-red-500/20 border-red-500/30', icon: '✕', label: 'Hata' },
        warning: { bg: 'bg-amber-500/20 border-amber-500/30', icon: '⚠', label: 'Uyarı' },
        info: { bg: 'bg-blue-500/20 border-blue-500/30', icon: 'ℹ', label: 'Bilgi' }
    };

    const formatTime = (date: Date) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'Az önce';
        if (diffMins < 60) return `${diffMins} dk önce`;
        if (diffHours < 24) return `${diffHours} sa önce`;
        return d.toLocaleDateString('tr-TR');
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-xl">🔔</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Bildirim Geçmişi</h2>
                            <p className="text-xs text-slate-500">
                                {unreadCount > 0 ? `${unreadCount} okunmamış` : 'Tümü okundu'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                            <button
                                onClick={onClear}
                                className="px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                Temizle
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-3 border-b border-slate-700/50 flex gap-2 overflow-x-auto">
                    {(['all', 'success', 'warning', 'error', 'info'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filter === type
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {type === 'all' ? 'Tümü' : typeStyles[type].label}
                            {type === 'all' && ` (${notifications.length})`}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-auto p-3">
                    {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                            <span className="text-4xl mb-2">📭</span>
                            <p className="text-sm">Bildirim yok</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredNotifications.map(notification => {
                                const style = typeStyles[notification.type];
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => !notification.read && onMarkAsRead(notification.id)}
                                        className={`${style.bg} border rounded-xl p-3 cursor-pointer hover:opacity-80 transition-opacity ${!notification.read ? 'ring-2 ring-indigo-500/30' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-lg">{style.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-bold text-white truncate">
                                                        {notification.message}
                                                    </p>
                                                    {!notification.read && (
                                                        <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                                                    )}
                                                </div>
                                                {notification.description && (
                                                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                                                        {notification.description}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-slate-500 mt-1">
                                                    {formatTime(notification.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationHistory;
