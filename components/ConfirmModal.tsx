import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'red' | 'blue' | 'green';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    confirmColor = 'red',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const colorClasses = {
        red: 'bg-red-600 hover:bg-red-700 border-red-500',
        blue: 'bg-blue-600 hover:bg-blue-700 border-blue-500',
        green: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500'
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-black text-white">{title}</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{message}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 py-4 bg-black/20 border-t border-white/5">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl transition-all border border-white/10"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-3 px-4 ${colorClasses[confirmColor]} text-white font-bold text-sm rounded-xl transition-all border shadow-lg`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
