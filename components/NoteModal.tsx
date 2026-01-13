import React, { useState, useEffect } from 'react';

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
    initialNote?: string;
    onSave: (patientId: string, patientName: string, text: string) => void;
    onDelete?: (patientId: string) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
    isOpen,
    onClose,
    patientId,
    patientName,
    initialNote = '',
    onSave,
    onDelete
}) => {
    const [text, setText] = useState(initialNote);

    useEffect(() => {
        setText(initialNote);
    }, [initialNote, patientId]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(patientId, patientName, text);
        onClose();
    };

    const handleDelete = () => {
        if (onDelete && confirm('Bu notu silmek istediğinizden emin misiniz?')) {
            onDelete(patientId);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md mx-4 bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-white">📝 Hasta Notu</h3>
                        <p className="text-xs text-slate-500 font-bold mt-0.5">{patientName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Bu hasta için notunuzu yazın..."
                        className="w-full h-40 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                        autoFocus
                    />
                    <p className="text-[10px] text-slate-600 mt-2 text-right">
                        {text.length} karakter
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3">
                    {initialNote && onDelete ? (
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                        >
                            🗑️ Sil
                        </button>
                    ) : (
                        <div />
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                        >
                            💾 Kaydet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
