
import React from 'react';

interface RegionHighlightProps {
    region: string;
}

export const RegionHighlight: React.FC<RegionHighlightProps> = ({ region }) => {
    // Basic body regions mapping to approximate CSS positions
    const getRegionPosition = (r: string) => {
        const lower = r.toLowerCase();
        if (lower.includes('pelvis') || lower.includes('idrar')) return { top: '65%', left: '50%' };
        if (lower.includes('akciğer') || lower.includes('toraks') || lower.includes('thorax')) return { top: '35%', left: '50%' };
        if (lower.includes('kafa') || lower.includes('beyin') || lower.includes('baş')) return { top: '10%', left: '50%' };
        if (lower.includes('karın') || lower.includes('batın') || lower.includes('abdomen')) return { top: '50%', left: '50%' };
        return { top: '40%', left: '50%' };
    };

    const pos = getRegionPosition(region);

    return (
        <div className="relative w-full aspect-[1/2] max-w-[120px] mx-auto bg-slate-900/50 rounded-3xl border border-white/5 overflow-hidden group">
            {/* Simple Stylized Body Silhouette */}
            <svg viewBox="0 0 100 200" className="w-full h-full opacity-20 fill-white">
                <circle cx="50" cy="25" r="15" /> {/* Head */}
                <path d="M30 45 h40 v60 l-10 80 h-20 l-10-80 z" /> {/* Torso & Legs */}
                <path d="M30 45 l-15 40 M70 45 l15 40" stroke="white" strokeWidth="8" strokeLinecap="round" /> {/* Arms */}
            </svg>

            {/* Glowing Scanline */}
            <div className="absolute inset-x-0 h-px bg-blue-400/50 shadow-[0_0_15px_rgba(96,165,250,0.5)] animate-[scan_3s_linear_infinite]"></div>

            {/* Target Highlight */}
            <div
                className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                style={pos}
            >
                {/* Pulse Ripples */}
                <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping"></div>
                <div className="absolute inset-2 bg-rose-500/40 rounded-full animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.6)]"></div>

                {/* Crosshair */}
                <div className="absolute top-0 bottom-0 w-px bg-rose-400/60"></div>
                <div className="absolute left-0 right-0 h-px bg-rose-400/60"></div>
            </div>

            {/* Label Overlay */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-[7px] font-black text-rose-400 uppercase tracking-[0.2em] bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-500/30">
                    EK ÇEKİM: {region}
                </span>
            </div>

            <style>{`
                @keyframes scan {
                    0% { top: 0%; }
                    100% { top: 100%; }
                }
            `}</style>
        </div>
    );
};
