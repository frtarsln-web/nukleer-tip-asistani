import React, { useState } from 'react';

interface RegionSelectorProps {
    isOpen: boolean;
    patientName: string;
    onSelect: (region: string) => void;
    onClose: () => void;
}

const POPULAR_REGIONS = [
    { name: 'Pelvis', icon: '🦴', color: 'from-purple-500 to-pink-500' },
    { name: 'Akciğer', icon: '🫁', color: 'from-blue-500 to-cyan-500' },
    { name: 'Beyin', icon: '🧠', color: 'from-pink-500 to-rose-500' },
    { name: 'Kemik Odağı', icon: '🦴', color: 'from-amber-500 to-orange-500' },
    { name: 'Toraks', icon: '💪', color: 'from-emerald-500 to-teal-500' },
    { name: 'Abdomen', icon: '🫀', color: 'from-red-500 to-pink-500' },
    { name: 'Kalp', icon: '❤️', color: 'from-rose-500 to-red-500' },
    { name: 'Karaciğer', icon: '🍖', color: 'from-yellow-500 to-amber-500' },
];

export const RegionSelector: React.FC<RegionSelectorProps> = ({ isOpen, patientName, onSelect, onClose }) => {
    const [customRegion, setCustomRegion] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    if (!isOpen) return null;

    const handleSelect = (region: string) => {
        onSelect(region);
        setCustomRegion('');
        setShowCustomInput(false);
    };

    const handleCustomSubmit = () => {
        if (customRegion.trim()) {
            handleSelect(customRegion.trim());
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-white mb-1 tracking-tight">
                                Ek Çekim Bölgesi Seçin
                            </h2>
                            <p className="text-sm text-slate-400">
                                <span className="font-bold text-blue-400">{patientName}</span> için ek çekim yapılacak bölgeyi belirleyin
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-xl transition-all active:scale-90"
                        >
                            <svg className="w-6 h-6 text-slate-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Popular Regions Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        {POPULAR_REGIONS.map((region, index) => (
                            <button
                                key={region.name}
                                onClick={() => handleSelect(region.name)}
                                className={`group relative overflow-hidden rounded-2xl p-4 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 active:scale-95`}
                                style={{
                                    animationDelay: `${index * 50}ms`,
                                    animation: 'slideUp 0.5s ease-out forwards'
                                }}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${region.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    <span className="text-3xl transform group-hover:scale-110 transition-transform">
                                        {region.icon}
                                    </span>
                                    <span className="text-xs font-black text-white uppercase tracking-wider">
                                        {region.name}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Custom Region Input */}
                    {!showCustomInput ? (
                        <button
                            onClick={() => setShowCustomInput(true)}
                            className="w-full py-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 group"
                        >
                            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-sm font-bold uppercase tracking-wider">Özel Bölge Gir</span>
                        </button>
                    ) : (
                        <div className="space-y-3 animate-in slide-in-from-bottom duration-300">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customRegion}
                                    onChange={(e) => setCustomRegion(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                                    placeholder="Örn: Lomber Omurga, Boyun, Tiroid..."
                                    autoFocus
                                    className="flex-1 px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                                <button
                                    onClick={handleCustomSubmit}
                                    disabled={!customRegion.trim()}
                                    className="px-6 py-3 bg-blue-500 hover:bg-blue-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Onayla
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCustomInput(false);
                                    setCustomRegion('');
                                }}
                                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                İptal
                            </button>
                        </div>
                    )}

                    {/* Info */}
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <p className="text-xs text-blue-300 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Seçtiğiniz bölge için otomatik olarak 60 dakika (1 saat) sonra çekim zamanı planlanacaktır.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
};
