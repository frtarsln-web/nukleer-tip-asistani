import React, { useState } from 'react';

interface AcademicResourceProps {
    onClose: () => void;
}

type TabType = 'decision' | 'pharma' | 'staging' | 'theranostics' | 'safety' | 'tools' | 'dosimetry' | 'ai' | 'radiobiology' | 'kinetics' | 'anatomy' | 'cases' | 'artifacts' | 'protocols' | 'tnm' | 'emergency' | 'drugs';

export const DoctorAcademicResource: React.FC<AcademicResourceProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('anatomy');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const tabs = [
        { id: 'anatomy', label: 'Anatomi Atlası', icon: '🫀' },
        { id: 'cases', label: 'Vaka Kütüphanesi', icon: '📚' },
        { id: 'artifacts', label: 'PET Artefaktları', icon: '⚠️' },
        { id: 'protocols', label: 'Protokoller', icon: '📋' },
        { id: 'tnm', label: 'TNM Evreleme', icon: '🎯' },
        { id: 'emergency', label: 'Acil Kartlar', icon: '🚨' },
        { id: 'drugs', label: 'İlaç Etkileşimleri', icon: '💊' },
        { id: 'decision', label: 'Klinik Karar', icon: '🧠' },
        { id: 'dosimetry', label: 'Dozimetri', icon: '📐' },
        { id: 'ai', label: 'AI Asistan', icon: '🤖' },
        { id: 'radiobiology', label: 'Radyobiyoloji', icon: '🧬' },
        { id: 'kinetics', label: 'Kinetik', icon: '📈' },
        { id: 'pharma', label: 'Radyofarmasötik', icon: '💉' },
        { id: 'staging', label: 'Evreleme', icon: '📊' },
        { id: 'theranostics', label: 'Teranostik', icon: '☢️' },
        { id: 'safety', label: 'Güvenlik', icon: '🛡️' },
        { id: 'tools', label: 'Araçlar', icon: '🔧' },
    ];

    return (
        <div className="fixed inset-0 z-[300] bg-black/95 flex animate-in fade-in duration-200">
            <div className="w-full h-full flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-slate-900/80 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white"
                        >
                            {isMobileMenuOpen ? '✕' : '☰'}
                        </button>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-white">Klinik Karar Rehberi</h1>
                            <p className="text-xs text-indigo-400 hidden md:block">Nükleer Tıp Uzmanlık Referansı</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors">✕</button>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    {isMobileMenuOpen && <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setIsMobileMenuOpen(false)} />}
                    <nav className={`fixed md:relative inset-y-0 left-0 z-50 md:z-auto w-56 bg-slate-900 md:bg-slate-900/50 border-r border-white/5 p-4 transform transition-transform duration-200 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                        <div className="space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id as TabType); setIsMobileMenuOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <span className="text-lg">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </nav>

                    {/* Content */}
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                        {activeTab === 'anatomy' && <AnatomyAtlas />}
                        {activeTab === 'cases' && <CaseLibrary />}
                        {activeTab === 'artifacts' && <PETArtifacts />}
                        {activeTab === 'protocols' && <ProtocolLibrary />}
                        {activeTab === 'tnm' && <TNMStaging />}
                        {activeTab === 'emergency' && <EmergencyCards />}
                        {activeTab === 'drugs' && <DrugInteractions />}
                        {activeTab === 'decision' && <ClinicalDecision />}
                        {activeTab === 'dosimetry' && <Dosimetry />}
                        {activeTab === 'ai' && <AIAssistant />}
                        {activeTab === 'radiobiology' && <Radiobiology />}
                        {activeTab === 'kinetics' && <Pharmacokinetics />}
                        {activeTab === 'pharma' && <Radiopharmaceuticals />}
                        {activeTab === 'staging' && <StagingScoring />}
                        {activeTab === 'theranostics' && <Theranostics />}
                        {activeTab === 'safety' && <Safety />}
                        {activeTab === 'tools' && <Tools />}
                    </main>
                </div>
            </div>
        </div>
    );
};

// ========== 1. KLİNİK KARAR DESTEĞİ ==========
function ClinicalDecision() {
    const [selected, setSelected] = useState('lung');

    const algorithms = {
        lung: {
            title: 'Akciğer Nodülü', steps: [
                { q: 'Nodül boyutu?', a: ['< 6mm → İzlem gereksiz', '6-8mm → 6-12 ay BT', '> 8mm → PET/BT'] },
                { q: 'SUVmax?', a: ['< 2.5 → Düşük şüphe', '2.5-5 → Biyopsi düşün', '> 5 → Yüksek şüphe'] }
            ]
        },
        lymphoma: {
            title: 'Lenfoma Yanıt', steps: [
                { q: 'Deauville Skoru?', a: ['1-2 → CMR', '3 → Klinik karar', '4-5 → Progresyon'] }
            ]
        },
        prostate: {
            title: 'Prostat PSMA', steps: [
                { q: 'PSA düzeyi?', a: ['< 0.5 → Saptama düşük', '0.5-2 → PSMA endike', '> 2 → Yüksek saptama'] },
                { q: 'Tutulum?', a: ['Lokal → Kurtarma RT', 'Oligomet → SBRT', 'Yaygın → Lu-177'] }
            ]
        },
        net: {
            title: 'NET Algoritması', steps: [
                { q: 'Tümör gradı?', a: ['G1-G2 → Dotatate önce', 'G3/NEC → FDG önce'] },
                { q: 'Krenning skoru?', a: ['3-4 → Lu-177 adayı', '1-2 → Alternatif tedavi'] }
            ]
        }
    };

    const ddx = [
        { suv: '< 2.5', list: ['Granülom', 'Hamartom', 'Skar'], risk: 'low' },
        { suv: '2.5-5', list: ['Düşük grade CA', 'Aktif granülom'], risk: 'medium' },
        { suv: '5-10', list: ['Primer CA', 'Lenfoma', 'Metastaz'], risk: 'high' },
        { suv: '> 10', list: ['Agresif CA', 'SCLC', 'Aktif TB'], risk: 'critical' }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🎯 Klinik Karar Desteği</h2>

            {/* Algorithm Selector */}
            <div className="flex flex-wrap gap-2">
                {Object.entries(algorithms).map(([key, val]) => (
                    <button key={key} onClick={() => setSelected(key)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selected === key ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{val.title}</button>
                ))}
            </div>

            {/* Algorithm Steps */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                <h3 className="text-lg font-bold text-white mb-4">{algorithms[selected as keyof typeof algorithms].title}</h3>
                <div className="space-y-4">
                    {algorithms[selected as keyof typeof algorithms].steps.map((step, i) => (
                        <div key={i} className="pl-4 border-l-2 border-indigo-500">
                            <p className="text-indigo-300 font-bold mb-2">{step.q}</p>
                            {step.a.map((ans, j) => <p key={j} className="text-sm text-slate-300 py-1">→ {ans}</p>)}
                        </div>
                    ))}
                </div>
            </div>

            {/* DDx by SUV */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                <h3 className="text-lg font-bold text-white mb-4">SUVmax'a Göre Ayırıcı Tanı</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {ddx.map((item, i) => (
                        <div key={i} className={`p-4 rounded-lg border ${item.risk === 'low' ? 'bg-emerald-500/10 border-emerald-500/30' : item.risk === 'medium' ? 'bg-amber-500/10 border-amber-500/30' : item.risk === 'high' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                            <p className="font-bold text-white mb-2">SUV {item.suv}</p>
                            {item.list.map((d, j) => <p key={j} className="text-xs text-slate-300">• {d}</p>)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ========== 2. RADYOFARMASÖTİK REHBERİ ==========
function Radiopharmaceuticals() {
    const comparison = [
        { prop: 'Yarı Ömür', fdg: '110 dk', psma: '68 dk', dota: '68 dk' },
        { prop: 'Uptake', fdg: '60 dk', psma: '60-90 dk', dota: '60 dk' },
        { prop: 'Hedef', fdg: 'Glikoz met.', psma: 'PSMA', dota: 'SSTR' },
        { prop: 'Ana End.', fdg: 'Onkoloji', psma: 'Prostat', dota: 'NET' },
        { prop: 'Beyin', fdg: 'Yoğun', psma: 'Minimal', dota: 'Hipofiz' },
        { prop: 'KC', fdg: 'Referans', psma: 'Yoğun', dota: 'Orta' },
        { prop: 'Dalak', fdg: 'Düşük', psma: 'Orta', dota: 'Yoğun' },
        { prop: 'KŞ Etkisi', fdg: 'Kritik', psma: 'Yok', dota: 'Yok' },
        { prop: 'Teranostik', fdg: '—', psma: 'Lu-177', dota: 'Lu-177' }
    ];

    const drugs = [
        { name: 'Metformin', effect: 'Barsak ↑', action: '48-72 saat kes', critical: true },
        { name: 'Steroid', effect: 'Lenfoid ↓', action: 'Lenfomada dikkat', critical: true },
        { name: 'G-CSF', effect: 'Kemik iliği ↑', action: '2-4 hafta bekle', critical: true },
        { name: 'İnsülin', effect: 'Kas ↑', action: '4-6 saat önce yok', critical: true },
        { name: 'SSA', effect: 'Dotatate ↓', action: 'LAR: 4-6 hafta', critical: true },
        { name: 'Kemo', effect: 'Yalancı (–)', action: '2-3 hafta bekle', critical: false },
        { name: 'RT', effect: 'İnflamasyon ↑', action: '2-3 ay bekle', critical: false }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">💊 PET Radyofarmasötik Rehberi</h2>

            {/* Comparison Table */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-indigo-600/20">
                        <tr>
                            <th className="px-4 py-3 text-left text-white font-bold">Özellik</th>
                            <th className="px-4 py-3 text-center text-rose-400 font-bold">FDG</th>
                            <th className="px-4 py-3 text-center text-purple-400 font-bold">PSMA</th>
                            <th className="px-4 py-3 text-center text-emerald-400 font-bold">Dotatate</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {comparison.map((row, i) => (
                            <tr key={i} className="hover:bg-white/5">
                                <td className="px-4 py-2 text-slate-300 font-medium">{row.prop}</td>
                                <td className="px-4 py-2 text-center text-slate-400">{row.fdg}</td>
                                <td className="px-4 py-2 text-center text-slate-400">{row.psma}</td>
                                <td className="px-4 py-2 text-center text-slate-400">{row.dota}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Drug Interactions */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                <h3 className="text-lg font-bold text-white mb-4">⚠️ İlaç Etkileşimleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {drugs.map((d, i) => (
                        <div key={i} className={`p-3 rounded-lg border ${d.critical ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-white">{d.name}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded ${d.critical ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>{d.critical ? 'KRİTİK' : 'DİKKAT'}</span>
                            </div>
                            <p className="text-xs text-slate-400">{d.effect} • {d.action}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ========== 3. EVRELEME & SKORLAMA ==========
function StagingScoring() {
    const [selectedSystem, setSelectedSystem] = useState('deauville');

    const systems = {
        deauville: {
            title: 'Deauville (Lenfoma)', data: [
                { score: '1', desc: 'Tutulum yok', action: 'CMR' },
                { score: '2', desc: 'Mediastin altı', action: 'CMR' },
                { score: '3', desc: 'Mediastin üstü, KC altı', action: 'Klinik karar' },
                { score: '4', desc: 'KC üstü, orta', action: 'PMD olası' },
                { score: '5', desc: 'KC üstü belirgin veya yeni lezyon', action: 'PMD' }
            ]
        },
        percist: {
            title: 'PERCIST', data: [
                { score: 'CMR', desc: 'Target lezyon kayboldu', action: 'Komplet yanıt' },
                { score: 'PMR', desc: 'SULpeak ≥30% azalma', action: 'Parsiyel yanıt' },
                { score: 'SMD', desc: '<%30 değişim', action: 'Stabil hastalık' },
                { score: 'PMD', desc: '≥30% artış veya yeni lezyon', action: 'Progresyon' }
            ]
        },
        krenning: {
            title: 'Krenning (NET)', data: [
                { score: '0', desc: 'Tutulum yok', action: 'PRRT uygun değil' },
                { score: '1', desc: 'KC altı tutulum', action: 'PRRT uygun değil' },
                { score: '2', desc: 'KC eşit tutulum', action: 'Sınırda' },
                { score: '3', desc: 'KC üstü tutulum', action: 'PRRT uygun' },
                { score: '4', desc: 'Dalak/böbrek üstü', action: 'PRRT ideal' }
            ]
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">📊 Evreleme & Skorlama</h2>

            <div className="flex flex-wrap gap-2">
                {Object.entries(systems).map(([key, val]) => (
                    <button key={key} onClick={() => setSelectedSystem(key)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedSystem === key ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{val.title}</button>
                ))}
            </div>

            <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-indigo-600/20">
                        <tr>
                            <th className="px-4 py-3 text-left text-white font-bold">Skor</th>
                            <th className="px-4 py-3 text-left text-white font-bold">Tanım</th>
                            <th className="px-4 py-3 text-left text-white font-bold">Yorum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {systems[selectedSystem as keyof typeof systems].data.map((row, i) => (
                            <tr key={i} className="hover:bg-white/5">
                                <td className="px-4 py-3 text-indigo-400 font-bold">{row.score}</td>
                                <td className="px-4 py-3 text-slate-300">{row.desc}</td>
                                <td className="px-4 py-3 text-slate-400">{row.action}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ========== 4. TERANOSTİK PROTOKOLLER ==========
function Theranostics() {
    const protocols = [
        { agent: 'Lu-177 PSMA', indication: 'mCRPC', dose: '7.4 GBq (200 mCi)', cycles: '4-6 kür / 6-8 hafta', monitoring: 'Böbrek, kemik iliği, tükürük bezi' },
        { agent: 'Lu-177 Dotatate', indication: 'NET (G1-G2)', dose: '7.4 GBq (200 mCi)', cycles: '4 kür / 8 hafta', monitoring: 'Böbrek, kemik iliği, KC' },
        { agent: 'I-131 MIBG', indication: 'Feokromasitoma/Nöroblastom', dose: '3.7-11.1 GBq', cycles: 'İndividüalize', monitoring: 'Tiroid, kemik iliği' },
        { agent: 'I-131 (Tiroid)', indication: 'DTC Ablasyon/Tedavi', dose: '1.1-5.5 GBq', cycles: 'Tek/Tekrar', monitoring: 'Kemik iliği, akciğer' }
    ];

    const eligibility = [
        { criterion: 'ECOG PS', requirement: '0-2' },
        { criterion: 'GFR', requirement: '> 30-40 mL/min' },
        { criterion: 'Hb', requirement: '> 8-9 g/dL' },
        { criterion: 'PLT', requirement: '> 75.000/µL' },
        { criterion: 'WBC', requirement: '> 2.000/µL' },
        { criterion: 'Target tutulum', requirement: 'KC veya dalak üstü' }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">☢️ Teranostik Protokoller</h2>

            {/* Protocols */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {protocols.map((p, i) => (
                    <div key={i} className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                        <h3 className="text-lg font-bold text-indigo-400 mb-3">{p.agent}</h3>
                        <div className="space-y-2 text-sm">
                            <p className="text-slate-300"><span className="text-slate-500">Endikasyon:</span> {p.indication}</p>
                            <p className="text-slate-300"><span className="text-slate-500">Doz:</span> {p.dose}</p>
                            <p className="text-slate-300"><span className="text-slate-500">Siklus:</span> {p.cycles}</p>
                            <p className="text-slate-300"><span className="text-slate-500">İzlem:</span> {p.monitoring}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Eligibility */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                <h3 className="text-lg font-bold text-white mb-4">✅ Uygunluk Kriterleri</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {eligibility.map((e, i) => (
                        <div key={i} className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
                            <p className="text-xs text-slate-400">{e.criterion}</p>
                            <p className="text-sm font-bold text-emerald-400">{e.requirement}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ========== 5. GÜVENLİK ==========
function Safety() {
    const emergencies = [
        { title: 'Anafilaksi', severity: 'critical', steps: ['RF infüzyonunu durdur', 'Adrenalin 0.5mg IM', 'O2 + IV sıvı', 'Antihistaminik'] },
        { title: 'Ekstravazasyon', severity: 'moderate', steps: ['Enjeksiyonu durdur', 'Bölgeyi yükselt', 'Ilık kompres', 'Belgeleme'] },
        { title: 'Lu-177 Sonrası', severity: 'high', steps: ['Bulantı: Antiemetik', 'Ağrı: Analjezik', 'Pansitopeni: Hematoloji'] }
    ];

    const pregnancy = [
        { trimester: '1. Trimester', risk: 'Teratojenik etki riski yüksek', action: 'Kesinlikle kontrendike' },
        { trimester: '2-3. Trimester', risk: 'Fetal tiroid/kemik iliği', action: 'Zorunlu değilse kaçın' },
        { trimester: 'Emzirme', risk: 'RF süte geçer', action: 'FDG: 12 saat, Tc-99m: 24 saat' }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🛡️ Komplikasyon & Güvenlik</h2>

            {/* Emergencies */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {emergencies.map((e, i) => (
                    <div key={i} className={`rounded-xl p-5 border ${e.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' : e.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${e.severity === 'critical' ? 'bg-red-500 text-white' : e.severity === 'high' ? 'bg-orange-500 text-white' : 'bg-amber-500 text-white'}`}>{e.severity === 'critical' ? 'KRİTİK' : e.severity === 'high' ? 'YÜKSEK' : 'ORTA'}</span>
                            <h3 className="font-bold text-white">{e.title}</h3>
                        </div>
                        <ol className="space-y-1">
                            {e.steps.map((s, j) => <li key={j} className="text-sm text-slate-300 flex gap-2"><span className="text-indigo-400 font-bold">{j + 1}.</span>{s}</li>)}
                        </ol>
                    </div>
                ))}
            </div>

            {/* Pregnancy */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                <h3 className="text-lg font-bold text-white mb-4">🤰 Gebelik & Emzirme</h3>
                <div className="space-y-3">
                    {pregnancy.map((p, i) => (
                        <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-3 bg-pink-500/10 border border-pink-500/30 rounded-lg">
                            <span className="font-bold text-pink-400 md:w-32">{p.trimester}</span>
                            <span className="text-sm text-slate-300 flex-1">{p.risk}</span>
                            <span className="text-sm text-white font-medium">{p.action}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ========== 6. ARAÇLAR ==========
function Tools() {
    const [gfr, setGfr] = useState({ age: 60, cr: 1.0, gender: 'M' });
    const [bsa, setBsa] = useState({ height: 170, weight: 70 });

    const calcGFR = () => {
        const k = gfr.gender === 'F' ? 0.7 : 0.9;
        const a = gfr.gender === 'F' ? -0.329 : -0.411;
        const mult = gfr.gender === 'F' ? 1.018 : 1;
        return Math.round(141 * Math.pow(Math.min(gfr.cr / k, 1), a) * Math.pow(Math.max(gfr.cr / k, 1), -1.209) * Math.pow(0.993, gfr.age) * mult);
    };

    const calcBSA = () => ((Math.sqrt(bsa.height * bsa.weight)) / 60).toFixed(2);

    const guidelines = [
        { org: 'EANM', title: 'FDG PET/CT Prosedür', year: '2024' },
        { org: 'SNMMI', title: 'PSMA PET Appropriate Use', year: '2024' },
        { org: 'NCCN', title: 'Lenfoma PET Kullanım', year: '2024' },
        { org: 'ESC', title: 'Kardiyak Amiloidoz', year: '2023' }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🔧 Hızlı Araçlar</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* GFR Calculator */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-indigo-400 mb-4">GFR (CKD-EPI)</h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div>
                            <label className="text-xs text-slate-500">Yaş</label>
                            <input type="number" value={gfr.age} onChange={e => setGfr({ ...gfr, age: +e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Kreatinin</label>
                            <input type="number" step="0.1" value={gfr.cr} onChange={e => setGfr({ ...gfr, cr: +e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Cinsiyet</label>
                            <select value={gfr.gender} onChange={e => setGfr({ ...gfr, gender: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm">
                                <option value="M">Erkek</option>
                                <option value="F">Kadın</option>
                            </select>
                        </div>
                    </div>
                    <div className="bg-indigo-500/20 rounded-lg p-4 text-center">
                        <p className="text-xs text-indigo-300">GFR (mL/min/1.73m²)</p>
                        <p className="text-3xl font-bold text-white">{calcGFR()}</p>
                    </div>
                </div>

                {/* BSA Calculator */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-emerald-400 mb-4">BSA (Mosteller)</h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="text-xs text-slate-500">Boy (cm)</label>
                            <input type="number" value={bsa.height} onChange={e => setBsa({ ...bsa, height: +e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Kilo (kg)</label>
                            <input type="number" value={bsa.weight} onChange={e => setBsa({ ...bsa, weight: +e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" />
                        </div>
                    </div>
                    <div className="bg-emerald-500/20 rounded-lg p-4 text-center">
                        <p className="text-xs text-emerald-300">BSA (m²)</p>
                        <p className="text-3xl font-bold text-white">{calcBSA()}</p>
                    </div>
                </div>
            </div>

            {/* Guidelines Summary */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                <h3 className="text-lg font-bold text-white mb-4">📋 Güncel Kılavuzlar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {guidelines.map((g, i) => (
                        <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">{g.org}</span>
                            <p className="text-sm text-white font-medium mt-2">{g.title}</p>
                            <p className="text-xs text-slate-500">{g.year}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DoctorAcademicResource;

// ========== GELİŞMİŞ DOZİMETRİ ARAÇLARI ==========
function Dosimetry() {
    const [patientData, setPatientData] = useState({ weight: 70, height: 170, gfr: 80, liverVol: 1500 });
    const [isotope, setIsotope] = useState('lu177');
    const [activity, setActivity] = useState(7.4);

    const isotopes = {
        lu177: { name: 'Lu-177', halfLife: 6.647, gamma: 0.11, particleRange: 2.0, kidneyLimit: 23, bmLimit: 2 },
        i131: { name: 'I-131', halfLife: 8.02, gamma: 0.82, particleRange: 0.4, kidneyLimit: 23, bmLimit: 2 },
        y90: { name: 'Y-90', halfLife: 2.67, gamma: 0, particleRange: 5.3, kidneyLimit: 0, bmLimit: 0 }
    };

    const current = isotopes[isotope as keyof typeof isotopes];
    const bsa = Math.sqrt((patientData.height * patientData.weight) / 3600);
    const kidneyDose = (activity * 0.8 * (1 - Math.exp(-0.693 * 48 / current.halfLife / 24))) * (120 / patientData.gfr);
    const bmDose = activity * 0.02 * current.gamma;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">📐 Gelişmiş Dozimetri</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Parameters */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-indigo-400 mb-4">Hasta Parametreleri</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-slate-500">Kilo (kg)</label><input type="number" value={patientData.weight} onChange={e => setPatientData({ ...patientData, weight: +e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" /></div>
                        <div><label className="text-xs text-slate-500">Boy (cm)</label><input type="number" value={patientData.height} onChange={e => setPatientData({ ...patientData, height: +e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" /></div>
                        <div><label className="text-xs text-slate-500">GFR (mL/min)</label><input type="number" value={patientData.gfr} onChange={e => setPatientData({ ...patientData, gfr: +e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" /></div>
                        <div><label className="text-xs text-slate-500">KC Vol (mL)</label><input type="number" value={patientData.liverVol} onChange={e => setPatientData({ ...patientData, liverVol: +e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" /></div>
                    </div>
                    <div className="mt-4 p-3 bg-indigo-500/10 rounded-lg"><p className="text-xs text-slate-400">BSA: <span className="text-white font-bold">{bsa.toFixed(2)} m²</span></p></div>
                </div>

                {/* Treatment Parameters */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-purple-400 mb-4">Tedavi Parametreleri</h3>
                    <div className="space-y-4">
                        <div><label className="text-xs text-slate-500">İzotop</label><select value={isotope} onChange={e => setIsotope(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm">{Object.entries(isotopes).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select></div>
                        <div><label className="text-xs text-slate-500">Aktivite (GBq)</label><input type="number" step="0.1" value={activity} onChange={e => setActivity(+e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" /></div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="p-3 bg-amber-500/10 rounded-lg text-center"><p className="text-[10px] text-slate-400">T½</p><p className="text-lg font-bold text-amber-400">{current.halfLife} gün</p></div>
                        <div className="p-3 bg-emerald-500/10 rounded-lg text-center"><p className="text-[10px] text-slate-400">β Range</p><p className="text-lg font-bold text-emerald-400">{current.particleRange} mm</p></div>
                    </div>
                </div>
            </div>

            {/* Dose Estimates */}
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-5">
                <h3 className="text-lg font-bold text-white mb-4">⚠️ Tahmini Organ Dozları</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/30 p-4 rounded-lg text-center">
                        <p className="text-xs text-slate-400">Böbrek Dozu</p>
                        <p className={`text-2xl font-bold ${kidneyDose > current.kidneyLimit ? 'text-red-400' : 'text-emerald-400'}`}>{kidneyDose.toFixed(1)} Gy</p>
                        <p className="text-[10px] text-slate-500">Limit: {current.kidneyLimit} Gy</p>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg text-center">
                        <p className="text-xs text-slate-400">Kemik İliği</p>
                        <p className={`text-2xl font-bold ${bmDose > current.bmLimit ? 'text-red-400' : 'text-emerald-400'}`}>{bmDose.toFixed(2)} Gy</p>
                        <p className="text-[10px] text-slate-500">Limit: {current.bmLimit} Gy</p>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg text-center">
                        <p className="text-xs text-slate-400">Toplam Vücut</p>
                        <p className="text-2xl font-bold text-blue-400">{(activity * 0.05).toFixed(2)} Gy</p>
                        <p className="text-[10px] text-slate-500">Ortalama</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ========== AI DESTEKLİ ÖZELLİKLER ==========
function AIAssistant() {
    const [suvInput, setSuvInput] = useState('');
    const [location, setLocation] = useState('lung');
    const [result, setResult] = useState<string | null>(null);

    const locations = ['lung', 'liver', 'lymph', 'bone', 'adrenal', 'thyroid'];
    const locationNames: Record<string, string> = { lung: 'Akciğer', liver: 'Karaciğer', lymph: 'Lenf Nodu', bone: 'Kemik', adrenal: 'Adrenal', thyroid: 'Tiroid' };

    const analyze = () => {
        const suv = parseFloat(suvInput);
        if (isNaN(suv)) return;

        let ddx: string[] = [];
        let risk = '';

        if (location === 'lung') {
            if (suv < 2.5) { ddx = ['Granülom', 'Hamartom', 'Organize pnömoni']; risk = 'Düşük'; }
            else if (suv < 5) { ddx = ['Adenokarsinom (düşük grade)', 'Aktif granülomatöz hastalık']; risk = 'Orta'; }
            else { ddx = ['NSCLC', 'SCLC', 'Metastaz', 'Lenfoma']; risk = 'Yüksek'; }
        } else if (location === 'lymph') {
            if (suv < 3) { ddx = ['Reaktif LAP', 'Kronik inflamasyon']; risk = 'Düşük'; }
            else if (suv < 8) { ddx = ['Metastaz', 'Low-grade lenfoma', 'Sarkoidoz']; risk = 'Orta'; }
            else { ddx = ['High-grade lenfoma', 'Agresif metastaz']; risk = 'Yüksek'; }
        } else if (location === 'adrenal') {
            if (suv < 3.5) { ddx = ['Adenom', 'Normal adrenal']; risk = 'Düşük'; }
            else { ddx = ['Metastaz', 'Feokromasitoma', 'Kortikal karsinom']; risk = 'Yüksek'; }
        } else {
            if (suv < 3) { ddx = ['Benign olası']; risk = 'Düşük'; }
            else { ddx = ['Malignite şüphesi']; risk = 'Yüksek'; }
        }

        setResult(JSON.stringify({ ddx, risk, suv, location: locationNames[location] }));
    };

    const parsed = result ? JSON.parse(result) : null;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🤖 AI Asistan</h2>

            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-5">
                <h3 className="text-lg font-bold text-purple-400 mb-4">SUV Bazlı Ayırıcı Tanı Önerisi</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div><label className="text-xs text-slate-500">SUVmax</label><input type="number" step="0.1" value={suvInput} onChange={e => setSuvInput(e.target.value)} placeholder="örn: 8.5" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white" /></div>
                    <div><label className="text-xs text-slate-500">Lokalizasyon</label><select value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white">{locations.map(l => <option key={l} value={l}>{locationNames[l]}</option>)}</select></div>
                    <div className="flex items-end"><button onClick={analyze} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors">Analiz Et</button></div>
                </div>

                {parsed && (
                    <div className="bg-black/30 rounded-lg p-4 mt-4 animate-in fade-in duration-300">
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${parsed.risk === 'Yüksek' ? 'bg-red-500 text-white' : parsed.risk === 'Orta' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>{parsed.risk} Risk</span>
                            <span className="text-slate-400 text-sm">{parsed.location} • SUV: {parsed.suv}</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">Olası Tanılar:</p>
                        <div className="flex flex-wrap gap-2">
                            {parsed.ddx.map((d: string, i: number) => <span key={i} className="px-3 py-1 bg-white/10 rounded-lg text-sm text-white">{d}</span>)}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                    <h3 className="font-bold text-white mb-3">⚡ Hızlı Referanslar</h3>
                    <div className="space-y-2 text-sm text-slate-300">
                        <p>• Akciğer: SUV {'>'} 2.5 şüpheli</p>
                        <p>• Adrenal: SUV {'>'} 3.5 metastaz şüphesi</p>
                        <p>• Lenfoma: Deauville 4-5 progresyon</p>
                        <p>• Prostat PSMA: Liver üzeri pozitif</p>
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                    <h3 className="font-bold text-white mb-3">🎯 Yalancı Pozitif Uyarıları</h3>
                    <div className="space-y-2 text-sm text-slate-300">
                        <p>• Sarkoidoz → Bilateral LAP</p>
                        <p>• Kahverengi yağ → Paravertebral</p>
                        <p>• Enfeksiyon → Odak tutulum</p>
                        <p>• G-CSF → Kemik iliği yaygın</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ========== RADYOBİYOLOJİ ==========
function Radiobiology() {
    const [bedInput, setBedInput] = useState({ dose: 2, fractions: 25, alphabeta: 10 });

    const bed = bedInput.dose * bedInput.fractions * (1 + bedInput.dose / bedInput.alphabeta);
    const eqd2 = bed / (1 + 2 / bedInput.alphabeta);

    const alphabetaValues = [
        { tissue: 'Tümör (hızlı)', ab: '10', type: 'tumor' },
        { tissue: 'Tümör (yavaş)', ab: '3-4', type: 'tumor' },
        { tissue: 'Kemik iliği', ab: '10', type: 'oar' },
        { tissue: 'Böbrek', ab: '2-3', type: 'oar' },
        { tissue: 'Tükürük bezi', ab: '3', type: 'oar' },
        { tissue: 'Akciğer', ab: '3-4', type: 'oar' },
        { tissue: 'Karaciğer', ab: '2-3', type: 'oar' },
        { tissue: 'Spinal kord', ab: '2', type: 'oar' }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🧬 Radyobiyoloji</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* BED Calculator */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-emerald-400 mb-4">BED/EQD2 Hesaplayıcı</h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div><label className="text-xs text-slate-500">Doz/Fr (Gy)</label><input type="number" step="0.1" value={bedInput.dose} onChange={e => setBedInput({ ...bedInput, dose: +e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" /></div>
                        <div><label className="text-xs text-slate-500">Fraksiyon</label><input type="number" value={bedInput.fractions} onChange={e => setBedInput({ ...bedInput, fractions: +e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" /></div>
                        <div><label className="text-xs text-slate-500">α/β</label><input type="number" value={bedInput.alphabeta} onChange={e => setBedInput({ ...bedInput, alphabeta: +e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-500/10 p-4 rounded-lg text-center">
                            <p className="text-xs text-slate-400">BED (Gy)</p>
                            <p className="text-3xl font-bold text-emerald-400">{bed.toFixed(1)}</p>
                        </div>
                        <div className="bg-blue-500/10 p-4 rounded-lg text-center">
                            <p className="text-xs text-slate-400">EQD2 (Gy)</p>
                            <p className="text-3xl font-bold text-blue-400">{eqd2.toFixed(1)}</p>
                        </div>
                    </div>
                </div>

                {/* Alpha/Beta Reference */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-amber-400 mb-4">α/β Değerleri</h3>
                    <div className="space-y-2">
                        {alphabetaValues.map((v, i) => (
                            <div key={i} className={`flex justify-between p-2 rounded-lg ${v.type === 'tumor' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                                <span className="text-sm text-slate-300">{v.tissue}</span>
                                <span className={`text-sm font-bold ${v.type === 'tumor' ? 'text-red-400' : 'text-blue-400'}`}>{v.ab}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Formulas */}
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-white/10 rounded-xl p-5">
                <h3 className="text-lg font-bold text-white mb-4">📝 Formüller</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
                    <div className="p-3 bg-black/30 rounded-lg"><span className="text-indigo-400">BED</span> = n × d × (1 + d/αβ)</div>
                    <div className="p-3 bg-black/30 rounded-lg"><span className="text-indigo-400">EQD2</span> = BED / (1 + 2/αβ)</div>
                    <div className="p-3 bg-black/30 rounded-lg"><span className="text-indigo-400">SF</span> = exp(-αD - βD²)</div>
                    <div className="p-3 bg-black/30 rounded-lg"><span className="text-indigo-400">TCP</span> = exp(-N₀ × SF)</div>
                </div>
            </div>
        </div>
    );
}

// ========== FARMAKOKİNETİK ==========
function Pharmacokinetics() {
    const [timePoints, setTimePoints] = useState([{ time: 0, activity: 100 }, { time: 1, activity: 85 }, { time: 4, activity: 45 }, { time: 24, activity: 12 }]);

    // Simple mono-exponential fit
    const lambda = timePoints.length >= 2 ? Math.log(timePoints[0].activity / timePoints[timePoints.length - 1].activity) / (timePoints[timePoints.length - 1].time - timePoints[0].time) : 0;
    const halfLife = lambda > 0 ? (0.693 / lambda) : 0;
    const auc = timePoints.reduce((sum, pt, i) => {
        if (i === 0) return sum;
        const dt = pt.time - timePoints[i - 1].time;
        const avgActivity = (pt.activity + timePoints[i - 1].activity) / 2;
        return sum + avgActivity * dt;
    }, 0);

    const updatePoint = (idx: number, field: 'time' | 'activity', value: number) => {
        const newPoints = [...timePoints];
        newPoints[idx][field] = value;
        setTimePoints(newPoints);
    };

    const kineticsData = [
        { agent: 'Lu-177 PSMA', t1: '0.5-2h', t2: '24-48h', clearance: 'Renal' },
        { agent: 'Lu-177 Dotatate', t1: '0.5-4h', t2: '48-72h', clearance: 'Renal' },
        { agent: 'I-131', t1: '2-6h', t2: '~8 gün', clearance: 'Renal/Tiroid' },
        { agent: 'F-18 FDG', t1: '~1h', t2: '~2h', clearance: 'Renal' }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">📈 Farmakokinetik Modelleme</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Data Input */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-cyan-400 mb-4">Zaman-Aktivite Verileri</h3>
                    <div className="space-y-2">
                        {timePoints.map((pt, i) => (
                            <div key={i} className="grid grid-cols-2 gap-2">
                                <input type="number" value={pt.time} onChange={e => updatePoint(i, 'time', +e.target.value)} placeholder="Saat" className="bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" />
                                <input type="number" value={pt.activity} onChange={e => updatePoint(i, 'activity', +e.target.value)} placeholder="Aktivite %" className="bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm" />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setTimePoints([...timePoints, { time: 0, activity: 0 }])} className="mt-3 text-sm text-indigo-400 hover:text-indigo-300">+ Nokta Ekle</button>
                </div>

                {/* Results */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-orange-400 mb-4">Kinetik Parametreler</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-orange-500/10 p-4 rounded-lg text-center">
                            <p className="text-xs text-slate-400">Efektif T½</p>
                            <p className="text-2xl font-bold text-orange-400">{halfLife.toFixed(1)} saat</p>
                        </div>
                        <div className="bg-cyan-500/10 p-4 rounded-lg text-center">
                            <p className="text-xs text-slate-400">AUC</p>
                            <p className="text-2xl font-bold text-cyan-400">{auc.toFixed(0)} %·h</p>
                        </div>
                        <div className="bg-purple-500/10 p-4 rounded-lg text-center">
                            <p className="text-xs text-slate-400">λ (bozunma sabiti)</p>
                            <p className="text-2xl font-bold text-purple-400">{lambda.toFixed(3)} h⁻¹</p>
                        </div>
                        <div className="bg-emerald-500/10 p-4 rounded-lg text-center">
                            <p className="text-xs text-slate-400">Rezidans Zamanı</p>
                            <p className="text-2xl font-bold text-emerald-400">{(1 / lambda || 0).toFixed(1)} h</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reference Table */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-indigo-600/20">
                        <tr>
                            <th className="px-4 py-3 text-left text-white font-bold">Ajan</th>
                            <th className="px-4 py-3 text-center text-white font-bold">Hızlı Faz (T½α)</th>
                            <th className="px-4 py-3 text-center text-white font-bold">Yavaş Faz (T½β)</th>
                            <th className="px-4 py-3 text-center text-white font-bold">Atılım</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {kineticsData.map((k, i) => (
                            <tr key={i} className="hover:bg-white/5">
                                <td className="px-4 py-3 text-indigo-400 font-medium">{k.agent}</td>
                                <td className="px-4 py-3 text-center text-slate-300">{k.t1}</td>
                                <td className="px-4 py-3 text-center text-slate-300">{k.t2}</td>
                                <td className="px-4 py-3 text-center text-slate-400">{k.clearance}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ========== İNTERAKTİF ANATOMİ ATLASI ==========
function AnatomyAtlas() {
    const [selectedRegion, setSelectedRegion] = useState<string | null>('toraks');
    const [selectedSubRegion, setSelectedSubRegion] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');
    const [showImage, setShowImage] = useState<string | null>(null);

    // Image mapping for sub-regions
    const imageMap: Record<string, string> = {
        'beyin': '/anatomy/brain_anatomy.png',
        'boyun-lap': '/anatomy/neck_lymph_nodes.png',
        'akciger': '/anatomy/lung_lobes.png',
        'kalp': '/anatomy/heart_anatomy.png',
        'toraks-lap': '/anatomy/lymph_node_stations.png',
        'karaciger': '/anatomy/liver_segments.png',
        'pankreas': '/anatomy/pancreas_anatomy.png',
        'bobrek': '/anatomy/kidney_anatomy.png',
        'gi': '/anatomy/gi_tract.png',
        'batin-damar': '/anatomy/abdominal_vessels.png',
        'erkek': '/anatomy/prostate_anatomy.png',
    };

    // Comprehensive anatomical database
    const anatomyData: Record<string, { name: string; color: string; image?: string; subRegions: Record<string, { name: string; image?: string; structures: { type: string; name: string; latin?: string; details?: string }[] }> }> = {
        'bas-boyun': {
            name: 'Baş-Boyun',
            color: 'from-purple-500 to-pink-500',
            subRegions: {
                'beyin': {
                    name: 'Beyin', structures: [
                        { type: 'organ', name: 'Serebrum', latin: 'Cerebrum', details: 'Frontal, Parietal, Temporal, Oksipital loblar' },
                        { type: 'organ', name: 'Serebellum', latin: 'Cerebellum', details: 'Vermis, Hemisferler' },
                        { type: 'organ', name: 'Beyin Sapı', latin: 'Truncus encephali', details: 'Mezensefalon, Pons, Medulla oblongata' },
                        { type: 'organ', name: 'Talamus', latin: 'Thalamus' },
                        { type: 'organ', name: 'Hipotalamus', latin: 'Hypothalamus' },
                        { type: 'organ', name: 'Bazal Ganglionlar', details: 'Kaudat, Putamen, Globus pallidus' },
                        { type: 'organ', name: 'Hipokampus', latin: 'Hippocampus' },
                    ]
                },
                'tiroid': {
                    name: 'Tiroid & Paratiroid', structures: [
                        { type: 'organ', name: 'Tiroid Bezi', latin: 'Glandula thyroidea', details: 'Sağ lob, Sol lob, İstmus' },
                        { type: 'organ', name: 'Paratiroid Bezleri', latin: 'Glandulae parathyroideae', details: '4 adet (süperior ve inferior)' },
                    ]
                },
                'tukuruk': {
                    name: 'Tükürük Bezleri', structures: [
                        { type: 'organ', name: 'Parotis', latin: 'Glandula parotidea', details: 'Yüzeyel ve derin lob' },
                        { type: 'organ', name: 'Submandibular', latin: 'Glandula submandibularis' },
                        { type: 'organ', name: 'Sublingual', latin: 'Glandula sublingualis' },
                    ]
                },
                'farenks': {
                    name: 'Farenks & Larenks', structures: [
                        { type: 'organ', name: 'Nazofarenks', latin: 'Nasopharynx', details: 'Torus tubarius, Rosenmuller fossası' },
                        { type: 'organ', name: 'Orofarenks', latin: 'Oropharynx', details: 'Tonsil, Dil kökü, Yumuşak damak' },
                        { type: 'organ', name: 'Hipofarenks', latin: 'Hypopharynx', details: 'Piriform sinüs, Postkrikoid' },
                        { type: 'organ', name: 'Larenks', latin: 'Larynx', details: 'Supraglottik, Glottik, Subglottik' },
                    ]
                },
                'boyun-lap': {
                    name: 'Boyun Lenf Nodları', structures: [
                        { type: 'lymph', name: 'Level IA', details: 'Submental' },
                        { type: 'lymph', name: 'Level IB', details: 'Submandibular' },
                        { type: 'lymph', name: 'Level IIA', details: 'Üst juguler (ön)' },
                        { type: 'lymph', name: 'Level IIB', details: 'Üst juguler (arka)' },
                        { type: 'lymph', name: 'Level III', details: 'Orta juguler' },
                        { type: 'lymph', name: 'Level IV', details: 'Alt juguler' },
                        { type: 'lymph', name: 'Level VA', details: 'Posterior üçgen (üst)' },
                        { type: 'lymph', name: 'Level VB', details: 'Posterior üçgen (alt)' },
                        { type: 'lymph', name: 'Level VI', details: 'Ön kompartman (prelaringeal, pretrakeal)' },
                        { type: 'lymph', name: 'Level VII', details: 'Süperior mediastinal' },
                    ]
                },
                'boyun-damar': {
                    name: 'Boyun Damarları', structures: [
                        { type: 'vessel', name: 'A. Carotis Communis', latin: 'Arteria carotis communis' },
                        { type: 'vessel', name: 'A. Carotis Interna', latin: 'Arteria carotis interna' },
                        { type: 'vessel', name: 'A. Carotis Externa', latin: 'Arteria carotis externa' },
                        { type: 'vessel', name: 'V. Jugularis Interna', latin: 'Vena jugularis interna' },
                        { type: 'vessel', name: 'V. Jugularis Externa', latin: 'Vena jugularis externa' },
                        { type: 'vessel', name: 'A. Vertebralis', latin: 'Arteria vertebralis' },
                    ]
                },
            }
        },
        'toraks': {
            name: 'Toraks',
            color: 'from-blue-500 to-cyan-500',
            subRegions: {
                'akciger': {
                    name: 'Akciğerler', structures: [
                        { type: 'organ', name: 'Sağ Üst Lob', latin: 'Lobus superior dexter', details: 'Apikal, Posterior, Anterior segmentler' },
                        { type: 'organ', name: 'Sağ Orta Lob', latin: 'Lobus medius', details: 'Lateral, Medial segmentler' },
                        { type: 'organ', name: 'Sağ Alt Lob', latin: 'Lobus inferior dexter', details: 'Superior, Medial bazal, Anterior bazal, Lateral bazal, Posterior bazal' },
                        { type: 'organ', name: 'Sol Üst Lob', latin: 'Lobus superior sinister', details: 'Apikoposterior, Anterior, Superior lingular, Inferior lingular' },
                        { type: 'organ', name: 'Sol Alt Lob', latin: 'Lobus inferior sinister', details: 'Superior, Anteromedial bazal, Lateral bazal, Posterior bazal' },
                        { type: 'organ', name: 'Bronşlar', details: 'Ana bronş, Lober bronş, Segmental bronş' },
                    ]
                },
                'mediastinum': {
                    name: 'Mediastinum', structures: [
                        { type: 'organ', name: 'Anterior Mediastinum', details: 'Timus, Yağ dokusu' },
                        { type: 'organ', name: 'Orta Mediastinum', details: 'Kalp, Perikard, Aort kökü' },
                        { type: 'organ', name: 'Posterior Mediastinum', details: 'Özofagus, Desendan aorta, Torasik duktus' },
                        { type: 'organ', name: 'Timus', latin: 'Thymus' },
                    ]
                },
                'kalp': {
                    name: 'Kalp', structures: [
                        { type: 'organ', name: 'Sağ Atrium', latin: 'Atrium dextrum' },
                        { type: 'organ', name: 'Sağ Ventrikül', latin: 'Ventriculus dexter' },
                        { type: 'organ', name: 'Sol Atrium', latin: 'Atrium sinistrum' },
                        { type: 'organ', name: 'Sol Ventrikül', latin: 'Ventriculus sinister' },
                        { type: 'organ', name: 'İnterventriküler Septum' },
                        { type: 'organ', name: 'Mitral Kapak', latin: 'Valva mitralis' },
                        { type: 'organ', name: 'Aort Kapağı', latin: 'Valva aortae' },
                        { type: 'organ', name: 'Triküspid Kapak', latin: 'Valva tricuspidalis' },
                        { type: 'organ', name: 'Pulmoner Kapak', latin: 'Valva pulmonalis' },
                    ]
                },
                'toraks-lap': {
                    name: 'Torasik Lenf Nodları', structures: [
                        { type: 'lymph', name: '1 - Supraklavikular', details: 'En üst mediastinal' },
                        { type: 'lymph', name: '2R/2L - Üst Paratrakeal', details: 'Sağ ve sol' },
                        { type: 'lymph', name: '3A - Prevasküler', details: 'Anterior mediastinal' },
                        { type: 'lymph', name: '3P - Retrotrakeal', details: 'Posterior trakeal' },
                        { type: 'lymph', name: '4R/4L - Alt Paratrakeal', details: 'Sağ ve sol' },
                        { type: 'lymph', name: '5 - Subaortik (AP window)' },
                        { type: 'lymph', name: '6 - Paraaortik', details: 'Asendan aorta laterali' },
                        { type: 'lymph', name: '7 - Subkarinal', details: 'Karina altı' },
                        { type: 'lymph', name: '8 - Paraözofageal' },
                        { type: 'lymph', name: '9 - Pulmoner ligaman' },
                        { type: 'lymph', name: '10R/10L - Hiler' },
                        { type: 'lymph', name: '11 - İnterlober' },
                        { type: 'lymph', name: '12 - Lober' },
                        { type: 'lymph', name: '13 - Segmental' },
                        { type: 'lymph', name: '14 - Subsegmental' },
                    ]
                },
                'toraks-damar': {
                    name: 'Torasik Damarlar', structures: [
                        { type: 'vessel', name: 'Aorta Ascendens', latin: 'Aorta ascendens' },
                        { type: 'vessel', name: 'Arkus Aorta', latin: 'Arcus aortae' },
                        { type: 'vessel', name: 'Aorta Descendens', latin: 'Aorta descendens' },
                        { type: 'vessel', name: 'Truncus Brachiocephalicus' },
                        { type: 'vessel', name: 'A. Subclavia', latin: 'Arteria subclavia' },
                        { type: 'vessel', name: 'A. Pulmonalis', latin: 'Arteria pulmonalis' },
                        { type: 'vessel', name: 'V. Cava Superior', latin: 'Vena cava superior' },
                        { type: 'vessel', name: 'V. Pulmonalis', latin: 'Venae pulmonales' },
                        { type: 'vessel', name: 'V. Azygos', latin: 'Vena azygos' },
                    ]
                },
            }
        },
        'batin': {
            name: 'Batın',
            color: 'from-emerald-500 to-teal-500',
            subRegions: {
                'karaciger': {
                    name: 'Karaciğer', structures: [
                        { type: 'organ', name: 'Sağ Lob', latin: 'Lobus hepatis dexter' },
                        { type: 'organ', name: 'Sol Lob', latin: 'Lobus hepatis sinister' },
                        { type: 'organ', name: 'Segment I (Kaudat)', details: 'Posterior' },
                        { type: 'organ', name: 'Segment II', details: 'Sol lateral superior' },
                        { type: 'organ', name: 'Segment III', details: 'Sol lateral inferior' },
                        { type: 'organ', name: 'Segment IVa', details: 'Sol medial superior' },
                        { type: 'organ', name: 'Segment IVb', details: 'Sol medial inferior' },
                        { type: 'organ', name: 'Segment V', details: 'Sağ anterior inferior' },
                        { type: 'organ', name: 'Segment VI', details: 'Sağ posterior inferior' },
                        { type: 'organ', name: 'Segment VII', details: 'Sağ posterior superior' },
                        { type: 'organ', name: 'Segment VIII', details: 'Sağ anterior superior' },
                        { type: 'organ', name: 'Safra Kesesi', latin: 'Vesica biliaris' },
                        { type: 'organ', name: 'Hepatik Duktus', details: 'Sağ ve Sol hepatik duktus' },
                        { type: 'organ', name: 'Koledok', latin: 'Ductus choledochus' },
                    ]
                },
                'pankreas': {
                    name: 'Pankreas', structures: [
                        { type: 'organ', name: 'Pankreas Başı', latin: 'Caput pancreatis', details: 'Unsinat proses dahil' },
                        { type: 'organ', name: 'Pankreas Boynu', latin: 'Collum pancreatis' },
                        { type: 'organ', name: 'Pankreas Gövdesi', latin: 'Corpus pancreatis' },
                        { type: 'organ', name: 'Pankreas Kuyruğu', latin: 'Cauda pancreatis' },
                        { type: 'organ', name: 'Wirsung Kanalı', latin: 'Ductus pancreaticus major' },
                    ]
                },
                'dalak': {
                    name: 'Dalak', structures: [
                        { type: 'organ', name: 'Dalak', latin: 'Splen/Lien', details: 'Hilum, Parankimi' },
                        { type: 'organ', name: 'Splenik Arter', latin: 'Arteria splenica' },
                        { type: 'organ', name: 'Splenik Ven', latin: 'Vena splenica' },
                    ]
                },
                'bobrek': {
                    name: 'Böbrekler & Adrenal', structures: [
                        { type: 'organ', name: 'Sağ Böbrek', latin: 'Ren dexter', details: 'Korteks, Medulla, Pelvis' },
                        { type: 'organ', name: 'Sol Böbrek', latin: 'Ren sinister' },
                        { type: 'organ', name: 'Sağ Adrenal', latin: 'Glandula suprarenalis dextra' },
                        { type: 'organ', name: 'Sol Adrenal', latin: 'Glandula suprarenalis sinistra' },
                        { type: 'organ', name: 'Üreter', latin: 'Ureter', details: 'Proksimal, Orta, Distal' },
                    ]
                },
                'gi': {
                    name: 'Gastrointestinal', structures: [
                        { type: 'organ', name: 'Mide', latin: 'Gaster', details: 'Fundus, Korpus, Antrum, Pilor' },
                        { type: 'organ', name: 'Duodenum', details: '1. kısım (bulbus), 2-4. kısımlar' },
                        { type: 'organ', name: 'Jejunum', latin: 'Jejunum' },
                        { type: 'organ', name: 'İleum', latin: 'Ileum' },
                        { type: 'organ', name: 'Çekum', latin: 'Caecum' },
                        { type: 'organ', name: 'Apendiks', latin: 'Appendix vermiformis' },
                        { type: 'organ', name: 'Asendan Kolon', latin: 'Colon ascendens' },
                        { type: 'organ', name: 'Transvers Kolon', latin: 'Colon transversum' },
                        { type: 'organ', name: 'Desendan Kolon', latin: 'Colon descendens' },
                        { type: 'organ', name: 'Sigmoid Kolon', latin: 'Colon sigmoideum' },
                        { type: 'organ', name: 'Hepatik Fleksura' },
                        { type: 'organ', name: 'Splenik Fleksura' },
                    ]
                },
                'batin-lap': {
                    name: 'Abdominal Lenf Nodları', structures: [
                        { type: 'lymph', name: 'Hepatoduodenal Ligaman', details: 'Perikoledokal' },
                        { type: 'lymph', name: 'Çöliak', details: 'Çöliak aks çevresi' },
                        { type: 'lymph', name: 'Gastrik', details: 'Küçük kurvatur, Büyük kurvatur' },
                        { type: 'lymph', name: 'Pankreatikoduodenal' },
                        { type: 'lymph', name: 'Splenik Hilum' },
                        { type: 'lymph', name: 'Paraaortik', details: 'Sağ ve Sol lateral aortik' },
                        { type: 'lymph', name: 'İnteraortakaval', details: 'Aorta-Kava arası' },
                        { type: 'lymph', name: 'Retrokaval', details: 'Kava arkası' },
                        { type: 'lymph', name: 'Mezenterik', details: 'Superior ve Inferior' },
                        { type: 'lymph', name: 'Retroperitoneal' },
                    ]
                },
                'batin-damar': {
                    name: 'Abdominal Damarlar', structures: [
                        { type: 'vessel', name: 'Abdominal Aorta', latin: 'Aorta abdominalis' },
                        { type: 'vessel', name: 'Çöliak Trunk', latin: 'Truncus coeliacus' },
                        { type: 'vessel', name: 'A. Mesenterica Superior', latin: 'Arteria mesenterica superior' },
                        { type: 'vessel', name: 'A. Mesenterica Inferior', latin: 'Arteria mesenterica inferior' },
                        { type: 'vessel', name: 'A. Renalis', latin: 'Arteria renalis' },
                        { type: 'vessel', name: 'V. Cava Inferior', latin: 'Vena cava inferior' },
                        { type: 'vessel', name: 'V. Porta', latin: 'Vena portae hepatis' },
                        { type: 'vessel', name: 'V. Mesenterica Superior' },
                        { type: 'vessel', name: 'V. Renalis', latin: 'Vena renalis' },
                    ]
                },
            }
        },
        'pelvis': {
            name: 'Pelvis',
            color: 'from-orange-500 to-red-500',
            subRegions: {
                'mesane': {
                    name: 'Mesane & Üriner', structures: [
                        { type: 'organ', name: 'Mesane', latin: 'Vesica urinaria', details: 'Kubba, Trigon, Boyun' },
                        { type: 'organ', name: 'Üretra', latin: 'Urethra' },
                    ]
                },
                'erkek': {
                    name: 'Erkek Genital', structures: [
                        { type: 'organ', name: 'Prostat', latin: 'Prostata', details: 'Periferik zon, Santral zon, Transizyonel zon' },
                        { type: 'organ', name: 'Seminal Veziküller', latin: 'Vesiculae seminales' },
                        { type: 'organ', name: 'Testis', latin: 'Testis' },
                        { type: 'organ', name: 'Epididim', latin: 'Epididymis' },
                    ]
                },
                'kadin': {
                    name: 'Kadın Genital', structures: [
                        { type: 'organ', name: 'Uterus', latin: 'Uterus', details: 'Fundus, Korpus, Serviks' },
                        { type: 'organ', name: 'Overler', latin: 'Ovarium', details: 'Sağ ve Sol' },
                        { type: 'organ', name: 'Tuba Uterina', latin: 'Tuba uterina', details: 'Fallop tüpü' },
                        { type: 'organ', name: 'Vagina', latin: 'Vagina' },
                    ]
                },
                'rektum': {
                    name: 'Rektum & Anal', structures: [
                        { type: 'organ', name: 'Rektum', latin: 'Rectum', details: 'Üst, Orta, Alt 1/3' },
                        { type: 'organ', name: 'Anal Kanal', latin: 'Canalis analis' },
                        { type: 'organ', name: 'Mezorektum' },
                    ]
                },
                'pelvis-lap': {
                    name: 'Pelvik Lenf Nodları', structures: [
                        { type: 'lymph', name: 'Eksternal İliak', details: 'Lateral, Medial, Anterior' },
                        { type: 'lymph', name: 'İnternal İliak', details: 'Hipogastrik' },
                        { type: 'lymph', name: 'Obturator' },
                        { type: 'lymph', name: 'Preskaral' },
                        { type: 'lymph', name: 'Parametrial' },
                        { type: 'lymph', name: 'Mezrektal' },
                        { type: 'lymph', name: 'İnguinal', details: 'Yüzeyel ve Derin' },
                    ]
                },
            }
        },
        'kemik': {
            name: 'İskelet',
            color: 'from-gray-500 to-slate-500',
            subRegions: {
                'kafa': {
                    name: 'Kranium', structures: [
                        { type: 'organ', name: 'Frontal Kemik', latin: 'Os frontale' },
                        { type: 'organ', name: 'Parietal Kemik', latin: 'Os parietale' },
                        { type: 'organ', name: 'Oksipital Kemik', latin: 'Os occipitale' },
                        { type: 'organ', name: 'Temporal Kemik', latin: 'Os temporale' },
                        { type: 'organ', name: 'Sfenoid Kemik', latin: 'Os sphenoidale' },
                        { type: 'organ', name: 'Mandibula', latin: 'Mandibula' },
                        { type: 'organ', name: 'Maksilla', latin: 'Maxilla' },
                    ]
                },
                'vertebra': {
                    name: 'Vertebral Kolon', structures: [
                        { type: 'organ', name: 'Servikal (C1-C7)', details: '7 vertebra' },
                        { type: 'organ', name: 'Torakal (T1-T12)', details: '12 vertebra' },
                        { type: 'organ', name: 'Lomber (L1-L5)', details: '5 vertebra' },
                        { type: 'organ', name: 'Sakrum', latin: 'Os sacrum', details: '5 füzyone vertebra' },
                        { type: 'organ', name: 'Koksiks', latin: 'Os coccygis' },
                    ]
                },
                'toraks-kemik': {
                    name: 'Torasik Kafes', structures: [
                        { type: 'organ', name: 'Sternum', latin: 'Sternum', details: 'Manubrium, Korpus, Ksifoid' },
                        { type: 'organ', name: 'Kostalar (1-12)', latin: 'Costae', details: '12 çift' },
                        { type: 'organ', name: 'Klavikula', latin: 'Clavicula' },
                        { type: 'organ', name: 'Skapula', latin: 'Scapula' },
                    ]
                },
                'pelvis-kemik': {
                    name: 'Pelvik Kemikler', structures: [
                        { type: 'organ', name: 'İlium', latin: 'Os ilium' },
                        { type: 'organ', name: 'İskium', latin: 'Os ischii' },
                        { type: 'organ', name: 'Pubis', latin: 'Os pubis' },
                        { type: 'organ', name: 'Asetabulum' },
                    ]
                },
                'ust-eks': {
                    name: 'Üst Ekstremite', structures: [
                        { type: 'organ', name: 'Humerus', latin: 'Humerus' },
                        { type: 'organ', name: 'Radius', latin: 'Radius' },
                        { type: 'organ', name: 'Ulna', latin: 'Ulna' },
                        { type: 'organ', name: 'Karpal Kemikler', details: '8 kemik' },
                        { type: 'organ', name: 'Metakarplar', details: '5 kemik' },
                        { type: 'organ', name: 'Falankslar', details: '14 kemik' },
                    ]
                },
                'alt-eks': {
                    name: 'Alt Ekstremite', structures: [
                        { type: 'organ', name: 'Femur', latin: 'Femur', details: 'Baş, Boyun, Trokanterler, Şaft' },
                        { type: 'organ', name: 'Patella', latin: 'Patella' },
                        { type: 'organ', name: 'Tibia', latin: 'Tibia' },
                        { type: 'organ', name: 'Fibula', latin: 'Fibula' },
                        { type: 'organ', name: 'Tarsal Kemikler', details: '7 kemik (Talus, Kalkaneus...)' },
                        { type: 'organ', name: 'Metatarslar', details: '5 kemik' },
                        { type: 'organ', name: 'Falankslar', details: '14 kemik' },
                    ]
                },
            }
        },
    };

    const bodyRegions = [
        { id: 'bas-boyun', label: 'Baş-Boyun', y: 8, icon: '🧠' },
        { id: 'toraks', label: 'Toraks', y: 28, icon: '🫁' },
        { id: 'batin', label: 'Batın', y: 48, icon: '🫀' },
        { id: 'pelvis', label: 'Pelvis', y: 65, icon: '🦴' },
        { id: 'kemik', label: 'İskelet', y: 82, icon: '💀' },
    ];

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'organ': return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
            case 'lymph': return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
            case 'vessel': return 'bg-red-500/20 border-red-500/50 text-red-400';
            default: return 'bg-slate-500/20 border-slate-500/50 text-slate-400';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) { case 'organ': return 'ORGAN'; case 'lymph': return 'LENF'; case 'vessel': return 'DAMAR'; default: return 'DİĞER'; }
    };

    // Search functionality
    const searchResults = searchQuery.length > 1 ? Object.entries(anatomyData).flatMap(([regionId, region]) =>
        Object.entries(region.subRegions).flatMap(([subId, sub]) =>
            sub.structures.filter(s =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.latin && s.latin.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (s.details && s.details.toLowerCase().includes(searchQuery.toLowerCase()))
            ).map(s => ({ ...s, regionId, regionName: region.name, subId, subName: sub.name }))
        )
    ) : [];

    const currentRegion = selectedRegion ? anatomyData[selectedRegion] : null;
    const currentSubRegion = selectedRegion && selectedSubRegion ? anatomyData[selectedRegion]?.subRegions[selectedSubRegion] : null;

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-2xl font-bold text-white">🫀 İnteraktif Anatomi Atlası</h2>
                <div className="flex gap-2">
                    <button onClick={() => setViewMode('visual')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'visual' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>Görsel</button>
                    <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>Liste</button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Organ, lenf nodu veya damar ara..." className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-white placeholder-slate-500" />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl max-h-80 overflow-auto z-50">
                        {searchResults.slice(0, 20).map((r, i) => (
                            <button key={i} onClick={() => { setSelectedRegion(r.regionId); setSelectedSubRegion(r.subId); setSearchQuery(''); }} className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${getTypeColor(r.type)}`}>{getTypeLabel(r.type)}</span>
                                    <span className="text-white font-medium">{r.name}</span>
                                    {r.latin && <span className="text-xs text-slate-500 italic">({r.latin})</span>}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{r.regionName} → {r.subName}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Visual Body Map */}
                {viewMode === 'visual' && (
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 relative min-h-[400px]">
                        <h3 className="text-sm font-bold text-slate-400 mb-4">Vücut Bölgeleri</h3>
                        <div className="relative h-[350px]">
                            {/* Body outline visualization */}
                            <div className="absolute left-1/2 -translate-x-1/2 w-24 h-full flex flex-col items-center">
                                {/* Head */}
                                <div className="w-16 h-16 rounded-full border-2 border-slate-600 mb-1" />
                                {/* Neck */}
                                <div className="w-8 h-4 border-2 border-slate-600 border-t-0" />
                                {/* Torso */}
                                <div className="w-20 h-24 border-2 border-slate-600 rounded-t-lg" />
                                {/* Pelvis */}
                                <div className="w-20 h-12 border-2 border-slate-600 border-t-0 rounded-b-xl" />
                                {/* Legs */}
                                <div className="flex gap-4 mt-1">
                                    <div className="w-6 h-24 border-2 border-slate-600 rounded-b-lg" />
                                    <div className="w-6 h-24 border-2 border-slate-600 rounded-b-lg" />
                                </div>
                            </div>
                            {/* Clickable regions */}
                            {bodyRegions.map(region => (
                                <button key={region.id} onClick={() => { setSelectedRegion(region.id); setSelectedSubRegion(null); }} style={{ top: `${region.y}%` }} className={`absolute right-2 transform -translate-y-1/2 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${selectedRegion === region.id ? `bg-gradient-to-r ${anatomyData[region.id].color} text-white` : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                                    <span>{region.icon}</span>
                                    <span>{region.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sub-regions List */}
                <div className={`bg-slate-800/50 border border-white/10 rounded-xl p-4 ${viewMode === 'list' ? 'lg:col-span-1' : ''}`}>
                    <h3 className="text-sm font-bold text-slate-400 mb-3">{currentRegion ? currentRegion.name + ' Alt Bölgeleri' : 'Bölge Seçin'}</h3>
                    {currentRegion && (
                        <div className="space-y-2 max-h-[350px] overflow-auto">
                            {Object.entries(currentRegion.subRegions).map(([subId, sub]) => (
                                <button key={subId} onClick={() => setSelectedSubRegion(subId)} className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm ${selectedSubRegion === subId ? `bg-gradient-to-r ${currentRegion.color} text-white` : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                                    <span className="font-bold">{sub.name}</span>
                                    <span className="text-xs ml-2 opacity-70">({sub.structures.length})</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Structures Detail */}
                <div className={`bg-slate-800/50 border border-white/10 rounded-xl p-4 ${viewMode === 'list' ? 'lg:col-span-2' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-slate-400">{currentSubRegion ? currentSubRegion.name : 'Alt Bölge Seçin'}</h3>
                        {selectedSubRegion && imageMap[selectedSubRegion] && (
                            <button onClick={() => setShowImage(imageMap[selectedSubRegion])} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg flex items-center gap-1 transition-colors">
                                🖼️ Görsel
                            </button>
                        )}
                    </div>
                    {currentSubRegion && (
                        <div className="space-y-2 max-h-[350px] overflow-auto">
                            {currentSubRegion.structures.map((s, i) => (
                                <div key={i} className={`p-3 rounded-lg border ${getTypeColor(s.type)}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${getTypeColor(s.type)} mr-2`}>{getTypeLabel(s.type)}</span>
                                            <span className="font-bold text-white">{s.name}</span>
                                            {s.latin && <span className="text-xs text-slate-400 italic ml-2">({s.latin})</span>}
                                        </div>
                                    </div>
                                    {s.details && <p className="text-xs text-slate-400 mt-1 pl-14">{s.details}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-500"></span><span className="text-slate-400">Organ</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-500"></span><span className="text-slate-400">Lenf Nodu</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-500"></span><span className="text-slate-400">Damar</span></div>
            </div>

            {/* Image Modal */}
            {showImage && (
                <div className="fixed inset-0 z-[400] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowImage(null)}>
                    <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowImage(null)} className="absolute -top-12 right-0 text-white text-2xl hover:text-red-400 transition-colors">✕</button>
                        <img src={showImage} alt="Anatomik İllüstrasyon" className="max-w-full max-h-[80vh] rounded-xl shadow-2xl" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="%23334155" width="400" height="300"/><text fill="%2394a3b8" x="200" y="150" text-anchor="middle" font-size="14">Görsel yüklenemedi</text></svg>'; }} />
                        <p className="text-center text-slate-400 text-sm mt-4">{currentSubRegion?.name} - Anatomik İllüstrasyon</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ========== VAKA KÜTÜPHANESİ ==========
function CaseLibrary() {
    const [selectedCategory, setSelectedCategory] = useState('onkoloji');
    const [selectedCase, setSelectedCase] = useState<number | null>(null);

    const cases = {
        onkoloji: [
            { id: 1, title: 'Akciğer Adenokarsinomu', difficulty: 'Orta', suv: '12.5', desc: 'Sağ üst lob 3cm kitle, mediastinal LAP', teaching: 'T2N2M0 evreleme, SUV>10 agresif tümör', images: ['PET/BT aksiyel', 'MIP görüntü'] },
            { id: 2, title: 'Diffüz Büyük B Hücreli Lenfoma', difficulty: 'Zor', suv: '22.0', desc: 'Yaygın nodal ve ekstranodal tutulum', teaching: 'Deauville 5, yüksek metabolik aktivite', images: ['Baseline', 'İnterim'] },
            { id: 3, title: 'Meme Kanseri - Kemik Metastazı', difficulty: 'Kolay', suv: '8.2', desc: 'Multipl kemik lezyonları', teaching: 'Osteolitik vs osteoblastik patern', images: ['Tüm vücut'] },
        ],
        nöroloji: [
            { id: 4, title: 'Alzheimer Hastalığı', difficulty: 'Orta', suv: '-', desc: 'Parietotemporal hipometabolizma', teaching: 'Posterior singulat tutulum karakteristik', images: ['FDG beyin'] },
            { id: 5, title: 'Epilepsi - Temporal Lob', difficulty: 'Zor', suv: '-', desc: 'Sol temporal hipometabolizma', teaching: 'İnteriktal dönemde azalmış metabolizma', images: ['FDG beyin'] },
        ],
        kardiyoloji: [
            { id: 6, title: 'Miyokard Viabilitesi', difficulty: 'Orta', suv: '-', desc: 'Anterior duvar hiberne miyokard', teaching: 'Mismatch patern - canlı doku', images: ['Rest', 'FDG'] },
        ],
        enfeksiyon: [
            { id: 7, title: 'Ateş Nedeni Araştırması (FUO)', difficulty: 'Zor', suv: '6.8', desc: 'Aort kökü ve mitral kapak tutulumu', teaching: 'Endokardit tanısı, Duke kriterleri', images: ['Kardiyak PET'] },
        ],
    };

    const categories = [
        { id: 'onkoloji', label: 'Onkoloji', count: 3 },
        { id: 'nöroloji', label: 'Nöroloji', count: 2 },
        { id: 'kardiyoloji', label: 'Kardiyoloji', count: 1 },
        { id: 'enfeksiyon', label: 'Enfeksiyon', count: 1 },
    ];

    const currentCases = cases[selectedCategory as keyof typeof cases] || [];
    const activeCase = selectedCase ? currentCases.find(c => c.id === selectedCase) : null;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">📚 Vaka Kütüphanesi</h2>
            <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                    <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSelectedCase(null); }} className={`px-4 py-2 rounded-lg text-sm font-bold ${selectedCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>
                        {cat.label} ({cat.count})
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                    {currentCases.map(c => (
                        <button key={c.id} onClick={() => setSelectedCase(c.id)} className={`w-full text-left p-4 rounded-xl border ${selectedCase === c.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-800/50 border-white/10'}`}>
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-white">{c.title}</h3>
                                <span className={`text-xs px-2 py-1 rounded ${c.difficulty === 'Kolay' ? 'bg-green-500/20 text-green-400' : c.difficulty === 'Orta' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{c.difficulty}</span>
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{c.desc}</p>
                            {c.suv !== '-' && <p className="text-xs text-indigo-400 mt-1">SUVmax: {c.suv}</p>}
                        </button>
                    ))}
                </div>
                {activeCase && (
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                        <h3 className="text-lg font-bold text-white mb-3">{activeCase.title}</h3>
                        <div className="space-y-3 text-sm">
                            <div><span className="text-slate-400">Bulgular:</span> <span className="text-white">{activeCase.desc}</span></div>
                            {activeCase.suv !== '-' && <div><span className="text-slate-400">SUVmax:</span> <span className="text-indigo-400 font-bold">{activeCase.suv}</span></div>}
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                <span className="text-emerald-400 font-bold">💡 Öğretici Nokta:</span>
                                <p className="text-slate-300 mt-1">{activeCase.teaching}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ========== PET ARTEFAKTLARI ==========
function PETArtifacts() {
    const [selectedType, setSelectedType] = useState('fizyolojik');

    const artifacts = {
        fizyolojik: [
            { name: 'Brown Fat (Kahverengi Yağ)', location: 'Boyun, supraklavikular, paravertebral', cause: 'Soğuk ortam, anksiyete', solution: 'Sıcak ortam, beta-bloker, diazepam', suv: '2-15' },
            { name: 'Kas Tutulumu', location: 'Larenks, diyafragma, göz kasları', cause: 'Konuşma, çiğneme, hareket', solution: 'Sessiz bekleme, kas gevşetici', suv: '2-5' },
            { name: 'GI Aktivite', location: 'Mide, bağırsaklar, kolon', cause: 'Fizyolojik metabolizma, metformin', solution: 'Metformin 48 saat kesme', suv: '2-8' },
            { name: 'Üriner Aktivite', location: 'Böbrek, üreter, mesane', cause: 'Renal atılım', solution: 'Hidrasyon, mesane boşaltma', suv: 'Yüksek' },
        ],
        teknik: [
            { name: 'Metal Artefakt', location: 'Protez, implant bölgeleri', cause: 'Atenüasyon düzeltme hatası', solution: 'Non-AC görüntüleri kontrol', suv: 'Yanlış yüksek' },
            { name: 'Hareket Artefaktı', location: 'Diyafragma, kalp', cause: 'Solunum, kardiyak hareket', solution: 'Respiratory gating', suv: 'Blur/mismatch' },
            { name: 'Truncation Artefakt', location: 'Periferik bölgeler', cause: 'FOV dışı doku', solution: 'Extended FOV CT', suv: 'Yanlış düşük' },
            { name: 'Ekstravazasyon', location: 'Enjeksiyon bölgesi', cause: 'Paravenöz enjeksiyon', solution: 'Tekrar çekim gerekebilir', suv: 'Fokal yüksek' },
        ],
        patolojik: [
            { name: 'Post-RT Değişiklikler', location: 'Radyoterapi alanı', cause: 'Radyasyon pnömonisi', solution: 'Klinik korelasyon, 3 ay bekle', suv: '2-6' },
            { name: 'İnflamasyon', location: 'Cerrahi saha, enfeksiyon', cause: 'İnflamatuar hücreler', solution: 'WBC sintigrafi', suv: '3-10' },
            { name: 'Granülomatöz', location: 'Sarkoidoz, tüberküloz', cause: 'Granülom aktivitesi', solution: 'Klinik/biyopsi', suv: '3-15' },
        ],
    };

    const types = [
        { id: 'fizyolojik', label: 'Fizyolojik', color: 'emerald' },
        { id: 'teknik', label: 'Teknik', color: 'blue' },
        { id: 'patolojik', label: 'Patolojik', color: 'orange' },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">⚠️ PET Artefaktları & Pitfalls</h2>
            <div className="flex gap-2">
                {types.map(t => (
                    <button key={t.id} onClick={() => setSelectedType(t.id)} className={`px-4 py-2 rounded-lg text-sm font-bold ${selectedType === t.id ? `bg-${t.color}-600 text-white` : 'bg-white/5 text-slate-400'}`}>{t.label}</button>
                ))}
            </div>
            <div className="grid gap-4">
                {artifacts[selectedType as keyof typeof artifacts]?.map((a, i) => (
                    <div key={i} className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                        <h3 className="font-bold text-white text-lg">{a.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div><span className="text-slate-500">Lokalizasyon:</span><p className="text-slate-300">{a.location}</p></div>
                            <div><span className="text-slate-500">Sebep:</span><p className="text-slate-300">{a.cause}</p></div>
                            <div><span className="text-slate-500">Çözüm:</span><p className="text-emerald-400">{a.solution}</p></div>
                            <div><span className="text-slate-500">SUV:</span><p className="text-indigo-400 font-bold">{a.suv}</p></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ========== PROTOKOL KÜTÜPHANESİ ==========
function ProtocolLibrary() {
    const [selectedExam, setSelectedExam] = useState<string | null>(null);

    const protocols = [
        { id: 'fdg', name: 'F-18 FDG PET/BT', prep: ['6 saat açlık', 'Kan şekeri <150 mg/dL', 'Su serbesttir', 'Diyabet: sabah insülin atla'], dose: '5-7 MBq/kg', uptake: '60 dk', notes: 'Egzersiz yasak, sıcak ortam' },
        { id: 'psma', name: 'Ga-68 PSMA PET/BT', prep: ['Açlık gerekli değil', 'Hidrasyon önemli', 'Mesane boşaltma'], dose: '2-3 MBq/kg', uptake: '60-90 dk', notes: 'Furosemid 20mg IV düşün' },
        { id: 'dota', name: 'Ga-68 DOTATATE PET/BT', prep: ['4 saat açlık', 'SSA 4-6 hafta önce kes'], dose: '100-200 MBq', uptake: '60 dk', notes: 'NET tümör görüntüleme' },
        { id: 'bone', name: 'Tc-99m Kemik Sintigrafisi', prep: ['Özel hazırlık yok', 'Hidrasyon'], dose: '740-925 MBq', uptake: '2-4 saat', notes: 'Mesane boşalt, metal çıkar' },
        { id: 'thyroid', name: 'I-131 Tüm Vücut', prep: ['TSH >30 veya rhTSH', 'Düşük iyot diyeti 2 hafta', 'LT4 4 hafta, T3 2 hafta önce kes'], dose: '74-185 MBq tanısal', uptake: '48-72 saat', notes: 'İyotlu kontrast yasak' },
        { id: 'mibg', name: 'I-123 MIBG', prep: ['Tiroid blokajı (KI)', 'İlaç etkileşimleri kontrol'], dose: '185-370 MBq', uptake: '24 saat', notes: 'Feokromasitoma, nöroblastom' },
    ];

    const activeProtocol = selectedExam ? protocols.find(p => p.id === selectedExam) : null;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">📋 Protokol Kütüphanesi</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {protocols.map(p => (
                    <button key={p.id} onClick={() => setSelectedExam(p.id)} className={`p-3 rounded-xl text-center ${selectedExam === p.id ? 'bg-indigo-600 text-white' : 'bg-slate-800/50 text-slate-300 border border-white/10'}`}>
                        <span className="text-sm font-bold">{p.name}</span>
                    </button>
                ))}
            </div>
            {activeProtocol && (
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">{activeProtocol.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-bold text-indigo-400 mb-2">Hasta Hazırlığı</h4>
                            <ul className="space-y-1">{activeProtocol.prep.map((p, i) => <li key={i} className="text-sm text-slate-300 flex items-center gap-2"><span className="text-emerald-500">✓</span>{p}</li>)}</ul>
                        </div>
                        <div className="space-y-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg"><span className="text-blue-400 font-bold">Doz:</span> <span className="text-white">{activeProtocol.dose}</span></div>
                            <div className="p-3 bg-purple-500/10 rounded-lg"><span className="text-purple-400 font-bold">Uptake:</span> <span className="text-white">{activeProtocol.uptake}</span></div>
                            <div className="p-3 bg-yellow-500/10 rounded-lg"><span className="text-yellow-400 font-bold">⚠️ Not:</span> <span className="text-white">{activeProtocol.notes}</span></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ========== TNM EVRELEME ==========
function TNMStaging() {
    const [selectedCancer, setSelectedCancer] = useState('lung');
    const [t, setT] = useState('');
    const [n, setN] = useState('');
    const [m, setM] = useState('');

    const cancers = {
        lung: { name: 'Akciğer Kanseri', t: ['Tx', 'T0', 'Tis', 'T1a', 'T1b', 'T1c', 'T2a', 'T2b', 'T3', 'T4'], n: ['Nx', 'N0', 'N1', 'N2', 'N3'], m: ['M0', 'M1a', 'M1b', 'M1c'] },
        breast: { name: 'Meme Kanseri', t: ['Tx', 'T0', 'Tis', 'T1', 'T2', 'T3', 'T4'], n: ['Nx', 'N0', 'N1', 'N2', 'N3'], m: ['M0', 'M1'] },
        colon: { name: 'Kolon Kanseri', t: ['Tx', 'T0', 'Tis', 'T1', 'T2', 'T3', 'T4a', 'T4b'], n: ['Nx', 'N0', 'N1a', 'N1b', 'N2a', 'N2b'], m: ['M0', 'M1a', 'M1b', 'M1c'] },
        prostate: { name: 'Prostat Kanseri', t: ['Tx', 'T1a', 'T1b', 'T1c', 'T2a', 'T2b', 'T2c', 'T3a', 'T3b', 'T4'], n: ['Nx', 'N0', 'N1'], m: ['M0', 'M1a', 'M1b', 'M1c'] },
    };

    const getStage = () => {
        if (!t || !n || !m) return '-';
        if (m.startsWith('M1')) return 'Evre IV';
        if (selectedCancer === 'lung') {
            if (n === 'N3') return 'Evre IIIC';
            if (n === 'N2') return t === 'T4' ? 'Evre IIIB' : 'Evre IIIA';
            if (n === 'N1') return 'Evre IIB';
            if (t === 'T1a' || t === 'T1b') return 'Evre IA';
            if (t === 'T2a') return 'Evre IB';
        }
        return 'Evre II-III';
    };

    const current = cancers[selectedCancer as keyof typeof cancers];

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">🎯 TNM Evreleme Aracı</h2>
            <div className="flex flex-wrap gap-2">
                {Object.entries(cancers).map(([id, c]) => (
                    <button key={id} onClick={() => { setSelectedCancer(id); setT(''); setN(''); setM(''); }} className={`px-4 py-2 rounded-lg text-sm font-bold ${selectedCancer === id ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>{c.name}</button>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                    <h3 className="font-bold text-blue-400 mb-3">T (Tümör)</h3>
                    <div className="flex flex-wrap gap-2">{current.t.map(v => <button key={v} onClick={() => setT(v)} className={`px-3 py-1 rounded ${t === v ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300'}`}>{v}</button>)}</div>
                </div>
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                    <h3 className="font-bold text-emerald-400 mb-3">N (Nod)</h3>
                    <div className="flex flex-wrap gap-2">{current.n.map(v => <button key={v} onClick={() => setN(v)} className={`px-3 py-1 rounded ${n === v ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-300'}`}>{v}</button>)}</div>
                </div>
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                    <h3 className="font-bold text-red-400 mb-3">M (Metastaz)</h3>
                    <div className="flex flex-wrap gap-2">{current.m.map(v => <button key={v} onClick={() => setM(v)} className={`px-3 py-1 rounded ${m === v ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-300'}`}>{v}</button>)}</div>
                </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-center">
                <h3 className="text-white text-lg">Seçim: <span className="font-bold">{t || '-'} {n || '-'} {m || '-'}</span></h3>
                <p className="text-3xl font-bold text-white mt-2">{getStage()}</p>
            </div>
        </div>
    );
}

// ========== ACİL KARTLAR ==========
function EmergencyCards() {
    const [selectedCard, setSelectedCard] = useState<number | null>(null);

    const cards = [
        { id: 1, title: 'Radyoaktif Sızıntı', icon: '☢️', color: 'red', steps: ['Alanı boşalt', 'Radyasyon Güvenliği\'ni ara', 'Kontamine alanı işaretle', 'Kontamine giysileri çıkar', 'El ve yüzü yıka', 'Dozimetri kontrolü'] },
        { id: 2, title: 'Anafilaksi', icon: '💉', color: 'orange', steps: ['Adrenalin 0.5mg IM (uyluk)', 'Oksijen ver', 'IV erişim aç', 'Sıvı resüsitasyonu', 'Antihistaminik', 'Steroid', '112\'yi ara'] },
        { id: 3, title: 'Ekstravazasyon', icon: '💧', color: 'yellow', steps: ['Enjeksiyonu durdur', 'Kanülü çıkarma', 'Aspire etmeye çalış', 'Soğuk kompres (FDG)', 'Elevate extremite', 'Belgeleme yap'] },
        { id: 4, title: 'Kardiyak Arrest', icon: '❤️', color: 'red', steps: ['Yardım çağır', 'CPR başlat 30:2', 'AED/Defibrilatör', 'Adrenalin 1mg IV/IO', '2dk döngü', 'Geri dönüşümlü nedenler'] },
        { id: 5, title: 'Terapötik I-131 Sızıntı', icon: '🧪', color: 'purple', steps: ['Hastayı izole et', 'Fizik uzmanını ara', 'Kontaminasyon survey', 'Dekontaminasyon', 'Doz hesaplama', 'Olay raporu'] },
    ];

    const activeCard = selectedCard ? cards.find(c => c.id === selectedCard) : null;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">🚨 Acil Durum Kartları</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {cards.map(c => (
                    <button key={c.id} onClick={() => setSelectedCard(c.id)} className={`p-4 rounded-xl text-center border-2 ${selectedCard === c.id ? `border-${c.color}-500 bg-${c.color}-500/20` : 'border-white/10 bg-slate-800/50'}`}>
                        <span className="text-3xl">{c.icon}</span>
                        <p className="text-sm font-bold text-white mt-2">{c.title}</p>
                    </button>
                ))}
            </div>
            {activeCard && (
                <div className={`bg-${activeCard.color}-500/10 border-2 border-${activeCard.color}-500/50 rounded-xl p-6`}>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">{activeCard.icon} {activeCard.title}</h3>
                    <ol className="mt-4 space-y-3">
                        {activeCard.steps.map((s, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-full bg-${activeCard.color}-500 text-white flex items-center justify-center font-bold`}>{i + 1}</span>
                                <span className="text-white text-lg">{s}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}

// ========== İLAÇ ETKİLEŞİMLERİ ==========
function DrugInteractions() {
    const [searchQuery, setSearchQuery] = useState('');

    const drugs = [
        { name: 'Metformin', exam: 'FDG PET', effect: 'GI uptake artışı', action: '48 saat önce kes', severity: 'orta' },
        { name: 'Somatostatin Analogları', exam: 'Ga-68 DOTATATE', effect: 'Reseptör blokajı', action: '4-6 hafta önce kes', severity: 'yüksek' },
        { name: 'Levotiroksin (LT4)', exam: 'I-131 Tarama', effect: 'TSH supresyonu', action: '4 hafta önce kes', severity: 'yüksek' },
        { name: 'Liyotironin (T3)', exam: 'I-131 Tarama', effect: 'TSH supresyonu', action: '2 hafta önce kes', severity: 'yüksek' },
        { name: 'Amiodaron', exam: 'Tiroid sintigrafi', effect: 'İyot içeriği', action: '3-6 ay bekle', severity: 'yüksek' },
        { name: 'Trisiklik Antidepresanlar', exam: 'MIBG', effect: 'Uptake inhibisyonu', action: '2 hafta önce kes', severity: 'yüksek' },
        { name: 'Labetalol', exam: 'MIBG', effect: 'Uptake inhibisyonu', action: '72 saat önce kes', severity: 'orta' },
        { name: 'Steroidler', exam: 'FDG PET', effect: 'İnflamasyon baskılama', action: 'Dikkatli yorumla', severity: 'düşük' },
        { name: 'G-CSF', exam: 'FDG PET', effect: 'Kemik iliği aktivasyonu', action: '2 hafta bekle', severity: 'orta' },
        { name: 'İyotlu Kontrast', exam: 'I-131 Tedavi', effect: 'Tiroid blokajı', action: '6-8 hafta bekle', severity: 'yüksek' },
    ];

    const filtered = drugs.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.exam.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">💊 İlaç Etkileşimleri Veritabanı</h2>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="İlaç veya tetkik ara..." className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white" />
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead><tr className="text-left text-slate-400 border-b border-white/10">
                        <th className="p-3">İlaç</th><th className="p-3">Tetkik</th><th className="p-3">Etki</th><th className="p-3">Önlem</th><th className="p-3">Önem</th>
                    </tr></thead>
                    <tbody>
                        {filtered.map((d, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-3 font-bold text-white">{d.name}</td>
                                <td className="p-3 text-indigo-400">{d.exam}</td>
                                <td className="p-3 text-slate-300">{d.effect}</td>
                                <td className="p-3 text-emerald-400">{d.action}</td>
                                <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${d.severity === 'yüksek' ? 'bg-red-500/20 text-red-400' : d.severity === 'orta' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{d.severity}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
