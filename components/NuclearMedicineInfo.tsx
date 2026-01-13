import React, { useState } from 'react';

interface InfoSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    color: string;
    items: string[];
}

const INFO_SECTIONS: InfoSection[] = [
    {
        id: 'protection',
        title: 'Radyasyondan Korunma İlkeleri',
        color: 'from-yellow-500 to-orange-500',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        items: [
            '⏱️ SÜRE: Radyasyon kaynağı yanında geçirilen süreyi minimumda tutun',
            '📏 MESAFE: Kaynaktan mümkün olduğunca uzak durun (ters kare yasası)',
            '🛡️ ZIRHLAMA: Uygun kurşun koruyucular ve bariyerler kullanın',
            '👁️ İZLEME: Dozimetrenizi düzenli kontrol edin',
            '🧤 KKE: Eldiven, önlük ve göz koruyucu kullanın'
        ]
    },
    {
        id: 'isotopes',
        title: 'Yaygın Radyoizotoplar',
        color: 'from-blue-500 to-cyan-500',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
        ),
        items: [
            '⚛️ Tc-99m: T½ = 6 saat | γ = 140 keV | En yaygın tanısal izotop',
            '⚛️ F-18 (FDG): T½ = 110 dk | β+ | PET görüntüleme için standart',
            '⚛️ Ga-68: T½ = 68 dk | β+ | Nöroendokrin tümör görüntüleme',
            '⚛️ I-131: T½ = 8 gün | β- ve γ | Tiroid tedavisi',
            '⚛️ Lu-177: T½ = 6.7 gün | β- | Peptit reseptör tedavisi'
        ]
    },
    {
        id: 'emergency',
        title: 'Acil Durum Protokolleri',
        color: 'from-red-500 to-rose-500',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        ),
        items: [
            '🚨 Dökülme: Alanı izole et, dekontaminasyon kiti kullan',
            '🧹 Temizlik: Merkezden dışa doğru temizle, atıkları topla',
            '📞 Bildir: Radyasyon güvenliği sorumlusunu hemen bilgilendir',
            '📝 Kayıt: Olayı detaylı şekilde dokümante et',
            '🏥 Kontaminasyon: Cilt kontaminasyonunda bol su ile yıka'
        ]
    },
    {
        id: 'limits',
        title: 'Doz Limitleri (TAEK)',
        color: 'from-purple-500 to-pink-500',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        items: [
            '👷 Çalışanlar: Yıllık 20 mSv (5 yıllık ortalama)',
            '👁️ Göz merceği: Yıllık 20 mSv',
            '🖐️ El/Ayak: Yıllık 500 mSv',
            '🤰 Hamile çalışan: Gebelik süresince 1 mSv (fetüs)',
            '👥 Halk: Yıllık 1 mSv'
        ]
    },
    {
        id: 'quality',
        title: 'Kalite Kontrol',
        color: 'from-emerald-500 to-green-500',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        items: [
            '✅ Radyonüklit saflık: >%99 olmalı',
            '✅ Radyokimyasal saflık: Kit bazlı kontrol',
            '✅ Mo-99 atılımı: <0.15 kBq Mo/MBq Tc',
            '✅ pH kontrolü: 4.5-8.5 arası kabul edilebilir',
            '✅ Sterilite: Her üretim partisi için zorunlu'
        ]
    }
];

export const NuclearMedicineInfo: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [activeSection, setActiveSection] = useState<string>('protection');

    const currentSection = INFO_SECTIONS.find(s => s.id === activeSection) || INFO_SECTIONS[0];

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                Nükleer Tıp Bilgi Merkezi
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">Temel bilgiler ve korunma prensipleri</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row">
                    {/* Sidebar - Section Tabs */}
                    <div className="md:w-64 p-4 border-b md:border-b-0 md:border-r border-white/10 bg-black/20">
                        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                            {INFO_SECTIONS.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 whitespace-nowrap ${activeSection === section.id
                                            ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {section.icon}
                                    <span className="text-xs font-bold hidden md:block">{section.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 overflow-y-auto max-h-[60vh]">
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300" key={currentSection.id}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${currentSection.color} text-white`}>
                                    {currentSection.icon}
                                </div>
                                <h3 className="text-lg font-black text-white">{currentSection.title}</h3>
                            </div>

                            <div className="space-y-3">
                                {currentSection.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-black/20">
                    <p className="text-[10px] text-slate-500 text-center">
                        ⚠️ Bu bilgiler genel referans amaçlıdır. Güncel mevzuat ve kurumsal protokoller için yetkili kaynaklara başvurun.
                    </p>
                </div>
            </div>
        </div>
    );
};
