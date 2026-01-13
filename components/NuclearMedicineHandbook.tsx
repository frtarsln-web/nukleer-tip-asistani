import React, { useState } from 'react';

interface Procedure {
    id: string;
    name: string;
    isotope: string;
    radiopharmaceutical: string;
    dose: string;
    doseRange: string;
    preparation: string[];
    patientPosition: string;
    acquisitionTime: string;
    waitingTime: string;
    indication: string[];
    contraindications: string[];
    notes: string[];
}

interface ProcedureCategory {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    procedures: Procedure[];
}

const PROCEDURE_CATEGORIES: ProcedureCategory[] = [
    {
        id: 'pet',
        name: 'PET/BT Çekimleri',
        color: 'from-amber-500 to-orange-500',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        procedures: [
            {
                id: 'pet-fdg-oncology',
                name: 'FDG PET/BT - Onkolojik',
                isotope: 'F-18',
                radiopharmaceutical: '18F-FDG (Fluorodeoksiglukoz)',
                dose: '3.7-5.5 MBq/kg',
                doseRange: '185-370 MBq (5-10 mCi)',
                preparation: [
                    '6 saat açlık (su serbest)',
                    'Kan şekeri <150 mg/dL kontrolü',
                    'Yoğun egzersizden 24 saat önce kaçınma',
                    'Diyabetik hastalarda insülin 4-6 saat önce kesilir'
                ],
                patientPosition: 'Supin pozisyon, kollar yukarıda (gövde) veya yanda (baş-boyun)',
                acquisitionTime: '2-3 dk/yatak pozisyonu, toplam 20-30 dk',
                waitingTime: '45-60 dakika (sessiz, karanlık odada)',
                indication: [
                    'Primer tümör evrelemesi',
                    'Metastaz taraması',
                    'Tedavi yanıtı değerlendirmesi',
                    'Nüks tespiti',
                    'Biyopsi yeri belirleme'
                ],
                contraindications: [
                    'Kontrolsüz diyabet (KŞ >200)',
                    'Gebelik',
                    'Aktif enfeksiyon (yanlış pozitif riski)'
                ],
                notes: [
                    'Enjeksiyon sonrası hastayı sakin tutun',
                    'Hidrasyon önemli - bolca su içirin',
                    'Metal protezler artefakt yapabilir'
                ]
            },
            {
                id: 'pet-fdg-brain',
                name: 'FDG PET/BT - Beyin',
                isotope: 'F-18',
                radiopharmaceutical: '18F-FDG',
                dose: '185-370 MBq',
                doseRange: '5-10 mCi',
                preparation: [
                    '4-6 saat açlık',
                    'Sessiz, karanlık ortamda bekleme',
                    'Sedatif verilmemeli'
                ],
                patientPosition: 'Supin, baş sabitleyici ile',
                acquisitionTime: '10-20 dakika',
                waitingTime: '30-45 dakika',
                indication: [
                    'Epilepsi odağı lokalizasyonu',
                    'Demans ayırıcı tanısı',
                    'Beyin tümörü gradlemesi',
                    'Parkinson hastalığı'
                ],
                contraindications: [
                    'Kontrolsüz diyabet',
                    'Ciddi klostrofobi'
                ],
                notes: [
                    'Enjeksiyon öncesi ve sonrası konuşmayı minimize edin',
                    'Görsel uyaran minimize edilmeli'
                ]
            },
            {
                id: 'pet-psma',
                name: 'Ga-68 PSMA PET/BT',
                isotope: 'Ga-68',
                radiopharmaceutical: '68Ga-PSMA-11 veya PSMA-617',
                dose: '1.8-2.2 MBq/kg',
                doseRange: '111-185 MBq (3-5 mCi)',
                preparation: [
                    'Açlık gerekmez',
                    'Bol su içilmeli',
                    'İşlem öncesi mesane boşaltılmalı'
                ],
                patientPosition: 'Supin, kollar yukarıda',
                acquisitionTime: '3-4 dk/yatak pozisyonu',
                waitingTime: '45-60 dakika',
                indication: [
                    'Prostat kanseri evrelemesi',
                    'Biyokimyasal nüks değerlendirmesi',
                    'PSMA hedefli tedavi planlaması'
                ],
                contraindications: [
                    'Bilinen PSMA alerjisi'
                ],
                notes: [
                    'Mesane aktivitesi değerlendirmeyi zorlaştırabilir',
                    'Tükürük bezlerinde fizyolojik tutulum normal'
                ]
            }
        ]
    },
    {
        id: 'bone',
        name: 'Kemik Sintigrafisi',
        color: 'from-blue-500 to-cyan-500',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5h16M4 10h16M4 15h12M4 20h8" />
            </svg>
        ),
        procedures: [
            {
                id: 'bone-whole',
                name: 'Tüm Vücut Kemik Sintigrafisi',
                isotope: 'Tc-99m',
                radiopharmaceutical: '99mTc-MDP veya HDP',
                dose: '20-25 MBq/kg',
                doseRange: '555-925 MBq (15-25 mCi)',
                preparation: [
                    'Özel hazırlık gerekmez',
                    'Enjeksiyon sonrası bol su içilmeli (2-3 L)',
                    'Çekim öncesi mesane boşaltılmalı'
                ],
                patientPosition: 'Supin, tüm vücut tarama',
                acquisitionTime: 'Anterior + Posterior: 20-30 dk',
                waitingTime: '2-4 saat',
                indication: [
                    'Kemik metastazı taraması',
                    'Osteomiyelit şüphesi',
                    'Stres fraktürü',
                    'Metabolik kemik hastalıkları',
                    'Protez komplikasyonları'
                ],
                contraindications: [
                    'Gebelik (rölatif)',
                    'Emzirme (24 saat ara)'
                ],
                notes: [
                    '3 fazlı çekim gerekirse anjiyo fazı için hemen başlayın',
                    'Metal implantlar artefakt yapabilir',
                    'Böbrek yetmezliğinde bekleme süresi uzatılabilir'
                ]
            },
            {
                id: 'bone-3phase',
                name: '3 Fazlı Kemik Sintigrafisi',
                isotope: 'Tc-99m',
                radiopharmaceutical: '99mTc-MDP',
                dose: '555-740 MBq',
                doseRange: '15-20 mCi',
                preparation: [
                    'İlgili ekstremite açık olmalı',
                    'Enjeksiyon tarafı not edilmeli'
                ],
                patientPosition: 'İlgili bölge kamera altında',
                acquisitionTime: 'Faz 1: 60 sn dinamik, Faz 2: 5 dk statik, Faz 3: 2-4 saat sonra',
                waitingTime: 'Faz 3 için 2-4 saat',
                indication: [
                    'Osteomiyelit vs selülit ayırımı',
                    'RSD/CRPS',
                    'Protez enfeksiyonu',
                    'Akut fraktür'
                ],
                contraindications: [],
                notes: [
                    'Karşılaştırma için simetrik görüntüleme önemli',
                    'Faz 1 enjeksiyon anında başlamalı'
                ]
            }
        ]
    },
    {
        id: 'cardiac',
        name: 'Kardiyak Görüntüleme',
        color: 'from-red-500 to-pink-500',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        ),
        procedures: [
            {
                id: 'mps',
                name: 'Miyokard Perfüzyon SPECT (MPS)',
                isotope: 'Tc-99m',
                radiopharmaceutical: '99mTc-MIBI veya Tetrofosmin',
                dose: 'Stres: 296-444 MBq, İstirahat: 888-1110 MBq',
                doseRange: '8-12 mCi / 24-30 mCi',
                preparation: [
                    '4 saat açlık',
                    'Kafein 24 saat önce kesilmeli',
                    'Beta bloker (doktor kararıyla) kesilmeli',
                    'Yağlı yemek (15-30 dk sonra) hepatik klerensi artırır'
                ],
                patientPosition: 'Supin veya prone (diyafram atenüasyonu için)',
                acquisitionTime: '15-20 dakika/çekim',
                waitingTime: 'Stres sonrası 30-60 dk, İstirahat sonrası 45-60 dk',
                indication: [
                    'Koroner arter hastalığı tanısı',
                    'Miyokard canlılık değerlendirmesi',
                    'Risk stratifikasyonu',
                    'Tedavi yanıtı izlemi'
                ],
                contraindications: [
                    'Akut MI (<48 saat)',
                    'Unstabil anjina',
                    'Ciddi aort stenozu',
                    'Kontrolsüz aritmiler'
                ],
                notes: [
                    'Treadmill veya farmakolojik stres (adenozin/regadenoson)',
                    'Gated SPECT için EKG sinyali gerekli',
                    'Meme dokusu atenüasyon artefaktı yapabilir'
                ]
            }
        ]
    },
    {
        id: 'thyroid',
        name: 'Tiroid Çalışmaları',
        color: 'from-purple-500 to-violet-500',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        procedures: [
            {
                id: 'thyroid-scan',
                name: 'Tiroid Sintigrafisi',
                isotope: 'Tc-99m',
                radiopharmaceutical: '99mTc-Perteknetat',
                dose: '74-185 MBq',
                doseRange: '2-5 mCi',
                preparation: [
                    'Tiroid ilaçları (4-6 hafta önce) kesilmeli',
                    'İyotlu kontrast son 6-8 hafta içinde alınmamış olmalı',
                    'Açlık gerekmez'
                ],
                patientPosition: 'Supin, boyun ekstansiyonda',
                acquisitionTime: '10-15 dakika',
                waitingTime: '20-30 dakika',
                indication: [
                    'Nodül fonksiyonel değerlendirmesi',
                    'Hipertiroidi etyolojisi',
                    'Ektopik tiroid dokusu',
                    'Substernal guatr'
                ],
                contraindications: [
                    'Gebelik',
                    'Emzirme'
                ],
                notes: [
                    'Sıcak nodül = otonom, genellikle benign',
                    'Soğuk nodül = malignite riski daha yüksek',
                    'I-123 daha spesifik ama daha pahalı'
                ]
            },
            {
                id: 'rai-therapy',
                name: 'Radyoaktif İyot Tedavisi',
                isotope: 'I-131',
                radiopharmaceutical: 'I-131 Sodyum İyodür',
                dose: 'Hipertiroidi: 185-555 MBq, Kanser: 1.1-7.4 GBq',
                doseRange: '5-15 mCi / 30-200 mCi',
                preparation: [
                    '2-4 hafta düşük iyotlu diyet',
                    'Tiroid hormonları kesilmeli (T4: 4-6 hafta, T3: 2 hafta)',
                    'TSH >30 mU/L olmalı',
                    'Gebelik testi (kadınlarda)'
                ],
                patientPosition: 'Oral kapsül alımı',
                acquisitionTime: 'Post-tedavi tarama: 48-72 saat sonra',
                waitingTime: 'Taburculuk radyasyon düzeyine göre',
                indication: [
                    'Graves hastalığı',
                    'Toksik nodüler guatr',
                    'Diferansiye tiroid kanseri ablasyonu',
                    'Rezidü/metastaz tedavisi'
                ],
                contraindications: [
                    'Gebelik',
                    'Emzirme',
                    'Ciddi tiroid oftalmopatisi (rölatif)'
                ],
                notes: [
                    'Radyasyon izolasyonu gerekebilir',
                    'Tükürük bezi koruma için limon şekeri önerilir',
                    'Çocuk ve hamilelerden uzak durulmalı'
                ]
            }
        ]
    },
    {
        id: 'renal',
        name: 'Renal Çalışmalar',
        color: 'from-emerald-500 to-teal-500',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
        ),
        procedures: [
            {
                id: 'renogram',
                name: 'Dinamik Renal Sintigrafi (MAG3)',
                isotope: 'Tc-99m',
                radiopharmaceutical: '99mTc-MAG3',
                dose: '37-185 MBq',
                doseRange: '1-5 mCi',
                preparation: [
                    'İyi hidrasyon (500 mL su, 30 dk önce)',
                    'Çekim öncesi mesane boşaltılmalı',
                    'ACE inhibitörleri (renovasküler HT için) kesilmeli veya devam'
                ],
                patientPosition: 'Supin, posterior görüntüleme',
                acquisitionTime: '20-30 dakika dinamik',
                waitingTime: 'Hemen başlanır',
                indication: [
                    'Renal fonksiyon değerlendirmesi',
                    'Obstrüktif üropati',
                    'Renovasküler hipertansiyon',
                    'Transplant böbrek izlemi'
                ],
                contraindications: [],
                notes: [
                    'Furosemid testi obstrüksiyon için gerekebilir',
                    'Kaptopril testi renovasküler HT için',
                    'Split renal function hesaplanabilir'
                ]
            },
            {
                id: 'dmsa',
                name: 'DMSA Kortikal Sintigrafi',
                isotope: 'Tc-99m',
                radiopharmaceutical: '99mTc-DMSA',
                dose: '37-185 MBq',
                doseRange: '1-5 mCi',
                preparation: [
                    'İyi hidrasyon',
                    'Özel hazırlık gerekmez'
                ],
                patientPosition: 'Supin ve prone, posterior görüntüleme',
                acquisitionTime: '15-20 dakika',
                waitingTime: '2-4 saat',
                indication: [
                    'Akut piyelonefrit',
                    'Renal skar değerlendirmesi',
                    'Konjenital anomaliler',
                    'Diferansiyel fonksiyon'
                ],
                contraindications: [],
                notes: [
                    'Çocuklarda UTI sonrası skar değerlendirmesi önemli',
                    'SPECT görüntüleme duyarlılığı artırır'
                ]
            }
        ]
    },
    {
        id: 'neuro',
        name: 'Nörolojik Çalışmalar',
        color: 'from-indigo-500 to-blue-500',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
        procedures: [
            {
                id: 'dat-scan',
                name: 'DaTscan (I-123 Ioflupan)',
                isotope: 'I-123',
                radiopharmaceutical: 'I-123 Ioflupan (DaTscan)',
                dose: '111-185 MBq',
                doseRange: '3-5 mCi',
                preparation: [
                    'Tiroid blokajı (Lugol veya potasyum iyodür)',
                    'Dopaminerjik ilaçlar kesilmeli (24-72 saat)',
                    'Kokain, amfetamin kullanımı sorgulanmalı'
                ],
                patientPosition: 'Supin, baş sabitleyici ile',
                acquisitionTime: '30-45 dakika SPECT',
                waitingTime: '3-6 saat',
                indication: [
                    'Parkinson hastalığı vs esansiyel tremor',
                    'Lewy cisimcikli demans',
                    'Parkinsonizm ayırıcı tanısı'
                ],
                contraindications: [
                    'İyot alerjisi',
                    'Gebelik'
                ],
                notes: [
                    'Striatal tutulum paterni değerlendirilir',
                    'Kaudat/putamen oranları hesaplanır',
                    'Semikantitatif analiz önerilir'
                ]
            }
        ]
    }
];

export const NuclearMedicineHandbook: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [activeCategory, setActiveCategory] = useState<string>('pet');
    const [activeProcedure, setActiveProcedure] = useState<string | null>(null);

    const currentCategory = PROCEDURE_CATEGORIES.find(c => c.id === activeCategory) || PROCEDURE_CATEGORIES[0];
    const currentProcedure = currentCategory.procedures.find(p => p.id === activeProcedure);

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-6xl h-[95vh] bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                {/* Header */}
                <div className="shrink-0 p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                📖 Nükleer Tıp El Kitabı
                            </h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Prosedürler, Dozlar ve Hasta Hazırlığı</p>
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

                    {/* Category Tabs */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
                        {PROCEDURE_CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setActiveCategory(cat.id);
                                    setActiveProcedure(null);
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${activeCategory === cat.id
                                    ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {cat.icon}
                                <span className="hidden sm:inline">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Procedure List */}
                    <div className="md:w-72 shrink-0 p-4 border-b md:border-b-0 md:border-r border-white/10 bg-black/20 overflow-y-auto">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Prosedürler</h3>
                        <div className="space-y-2">
                            {currentCategory.procedures.map((proc) => (
                                <button
                                    key={proc.id}
                                    onClick={() => setActiveProcedure(proc.id)}
                                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${activeProcedure === proc.id
                                        ? `bg-gradient-to-r ${currentCategory.color} text-white shadow-lg`
                                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                        }`}
                                >
                                    <p className="text-sm font-bold">{proc.name}</p>
                                    <p className="text-[10px] opacity-70 mt-1">{proc.isotope} • {proc.dose}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Procedure Details */}
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                        {currentProcedure ? (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                                {/* Title */}
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${currentCategory.color} text-white shrink-0`}>
                                        {currentCategory.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white">{currentProcedure.name}</h3>
                                        <p className="text-sm text-slate-400 mt-1">{currentProcedure.radiopharmaceutical}</p>
                                    </div>
                                </div>

                                {/* Quick Info Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                                        <p className="text-[9px] text-blue-400 font-bold uppercase">İzotop</p>
                                        <p className="text-sm font-bold text-white mt-1">{currentProcedure.isotope}</p>
                                    </div>
                                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                                        <p className="text-[9px] text-purple-400 font-bold uppercase">Doz</p>
                                        <p className="text-sm font-bold text-white mt-1">{currentProcedure.doseRange}</p>
                                    </div>
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                                        <p className="text-[9px] text-emerald-400 font-bold uppercase">Bekleme</p>
                                        <p className="text-sm font-bold text-white mt-1">{currentProcedure.waitingTime}</p>
                                    </div>
                                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                                        <p className="text-[9px] text-orange-400 font-bold uppercase">Çekim Süresi</p>
                                        <p className="text-sm font-bold text-white mt-1">{currentProcedure.acquisitionTime}</p>
                                    </div>
                                </div>

                                {/* Patient Position */}
                                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                                    <h4 className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Hasta Pozisyonu
                                    </h4>
                                    <p className="text-sm text-white mt-2">{currentProcedure.patientPosition}</p>
                                </div>

                                {/* Sections Grid */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Preparation */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <h4 className="text-xs font-bold text-yellow-400 uppercase mb-3">📋 Hazırlık</h4>
                                        <ul className="space-y-2">
                                            {currentProcedure.preparation.map((item, i) => (
                                                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                                    <span className="text-yellow-400 shrink-0">•</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Indications */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <h4 className="text-xs font-bold text-emerald-400 uppercase mb-3">✓ Endikasyonlar</h4>
                                        <ul className="space-y-2">
                                            {currentProcedure.indication.map((item, i) => (
                                                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                                    <span className="text-emerald-400 shrink-0">•</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Contraindications */}
                                    {currentProcedure.contraindications.length > 0 && (
                                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                                            <h4 className="text-xs font-bold text-red-400 uppercase mb-3">⚠️ Kontrendikasyonlar</h4>
                                            <ul className="space-y-2">
                                                {currentProcedure.contraindications.map((item, i) => (
                                                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                                        <span className="text-red-400 shrink-0">•</span>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <h4 className="text-xs font-bold text-blue-400 uppercase mb-3">💡 Önemli Notlar</h4>
                                        <ul className="space-y-2">
                                            {currentProcedure.notes.map((item, i) => (
                                                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                                    <span className="text-blue-400 shrink-0">•</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-center">
                                <div className="space-y-4">
                                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${currentCategory.color} text-white mx-auto flex items-center justify-center`}>
                                        {currentCategory.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{currentCategory.name}</h3>
                                        <p className="text-sm text-slate-400 mt-2">
                                            Sol taraftan bir prosedür seçin
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 p-3 border-t border-white/10 bg-black/20">
                    <p className="text-[9px] text-slate-500 text-center">
                        ⚠️ Bu bilgiler eğitim amaçlıdır. Klinik kararlar kurumsal protokollere göre verilmelidir.
                    </p>
                </div>
            </div>
        </div>
    );
};
