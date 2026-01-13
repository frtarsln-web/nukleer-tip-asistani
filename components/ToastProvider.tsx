import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

// Notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number; // ms, 0 = no auto-close
    timestamp: Date;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    removeToast: (id: string) => void;
    clearAll: () => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

// Toast Provider
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, title: string, message?: string, duration = 5000) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const toast: Toast = { id, type, title, message, duration, timestamp: new Date() };

        setToasts(prev => [...prev, toast].slice(-5)); // Keep max 5 toasts

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const success = useCallback((title: string, message?: string) => addToast('success', title, message), [addToast]);
    const error = useCallback((title: string, message?: string) => addToast('error', title, message, 0), [addToast]); // Errors don't auto-close
    const warning = useCallback((title: string, message?: string) => addToast('warning', title, message, 8000), [addToast]);
    const info = useCallback((title: string, message?: string) => addToast('info', title, message), [addToast]);

    const clearAll = useCallback(() => setToasts([]), []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

// Toast Container Component
const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
};

// Individual Toast Component
const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleRemove = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
    };

    const typeStyles = {
        success: {
            bg: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
            icon: '✓',
            iconBg: 'bg-emerald-500',
            text: 'text-emerald-400'
        },
        error: {
            bg: 'bg-gradient-to-r from-red-500/20 to-red-600/10 border-red-500/30',
            icon: '✕',
            iconBg: 'bg-red-500',
            text: 'text-red-400'
        },
        warning: {
            bg: 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-amber-500/30',
            icon: '⚠',
            iconBg: 'bg-amber-500',
            text: 'text-amber-400'
        },
        info: {
            bg: 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 border-blue-500/30',
            icon: 'ℹ',
            iconBg: 'bg-blue-500',
            text: 'text-blue-400'
        }
    };

    const style = typeStyles[toast.type];

    return (
        <div
            className={`
        pointer-events-auto
        ${style.bg} backdrop-blur-xl border rounded-xl p-4
        shadow-2xl shadow-black/20
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        animate-in slide-in-from-right-5 fade-in duration-300
      `}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`${style.iconBg} w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {style.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold ${style.text}`}>{toast.title}</h4>
                    {toast.message && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{toast.message}</p>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={handleRemove}
                    className="text-slate-500 hover:text-white transition-colors p-1 -m-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Progress bar for timed toasts */}
            {toast.duration && toast.duration > 0 && (
                <div className="mt-3 h-0.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${style.iconBg} rounded-full`}
                        style={{
                            animation: `shrink ${toast.duration}ms linear forwards`
                        }}
                    />
                </div>
            )}

            <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
        </div>
    );
};

export default ToastProvider;
