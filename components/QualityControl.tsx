import React, { useState, useMemo } from 'react';
import { StaffUser } from '../types';

export interface QCTest {
    id: string;
    name: string;
    value: number | null;
    unit: string;
    minLimit: number;
    maxLimit: number;
    passed: boolean | null;
}

export interface QCRecord {
    id: string;
    date: string;
    type: 'daily' | 'weekly' | 'kit';
    equipmentName?: string;
    kitName?: string;
    tests: QCTest[];
    performedBy: string;
    passed: boolean;
    notes?: string;
    timestamp: Date;
}

interface QualityControlProps {
    onClose: () => void;
    currentUser: StaffUser | null;
    addNotification: (message: string, type: 'success' | 'warning' | 'error' | 'info', description?: string) => void;
}

// Translations
const translations = {
    tr: {
        title: 'Kalite Kontrol',
        subtitle: 'Günlük ve periyodik QC testleri',
        dailyQc: 'Günlük QC',
        weeklyQc: 'Haftalık QC',
        kitQc: 'Kit QC',
        history: 'Geçmiş',
        dailyQcFull: 'Günlük Kalite Kontrol',
        weeklyQcFull: 'Haftalık Kalite Kontrol',
        kitQcFull: 'Kit Kalite Kontrol',
        equipment: 'Cihaz',
        kitName: 'Kit Adı',
        limit: 'Limit',
        notes: 'Notlar (Opsiyonel)',
        notesPlaceholder: 'Ek notlar...',
        performedBy: 'Yapan',
        notLoggedIn: 'Giriş yapılmamış',
        saveQc: 'QC Kaydet',
        qcHistory: 'QC Geçmişi',
        noRecords: 'Henüz QC kaydı yok',
        passed: 'Geçti',
        failed: 'Başarısız',
        waiting: 'Bekliyor',
        daily: 'Günlük',
        incompleteTest: 'Eksik Test',
        fillAllValues: 'Lütfen tüm test değerlerini girin.',
        qcSuccess: 'QC Başarılı',
        qcFailed: 'QC Başarısız',
        allTestsPassed: 'Tüm testler geçti.',
        someTestsFailed: 'Bazı testler limit dışında. Lütfen kontrol edin.',
        general: 'Genel',
    },
    en: {
        title: 'Quality Control',
        subtitle: 'Daily and periodic QC tests',
        dailyQc: 'Daily QC',
        weeklyQc: 'Weekly QC',
        kitQc: 'Kit QC',
        history: 'History',
        dailyQcFull: 'Daily Quality Control',
        weeklyQcFull: 'Weekly Quality Control',
        kitQcFull: 'Kit Quality Control',
        equipment: 'Equipment',
        kitName: 'Kit Name',
        limit: 'Limit',
        notes: 'Notes (Optional)',
        notesPlaceholder: 'Additional notes...',
        performedBy: 'Performed By',
        notLoggedIn: 'Not logged in',
        saveQc: 'Save QC',
        qcHistory: 'QC History',
        noRecords: 'No QC records yet',
        passed: 'Passed',
        failed: 'Failed',
        waiting: 'Waiting',
        daily: 'Daily',
        incompleteTest: 'Incomplete Test',
        fillAllValues: 'Please fill in all test values.',
        qcSuccess: 'QC Successful',
        qcFailed: 'QC Failed',
        allTestsPassed: 'All tests passed.',
        someTestsFailed: 'Some tests are out of limits. Please check.',
        general: 'General',
    },
};

const DAILY_QC_TESTS_TR: Omit<QCTest, 'id' | 'value' | 'passed'>[] = [
    { name: 'Doz Kalibratör - Constancy', unit: '%', minLimit: -5, maxLimit: 5 },
    { name: 'Gamma Kamera - Uniformite', unit: '%', minLimit: 0, maxLimit: 5 },
    { name: 'Gamma Kamera - COR', unit: 'mm', minLimit: -3, maxLimit: 3 },
    { name: 'Aktivimetre - Background', unit: 'μCi', minLimit: 0, maxLimit: 0.5 },
    { name: 'Kontaminasyon Ölçümü', unit: 'cpm', minLimit: 0, maxLimit: 100 },
];

const DAILY_QC_TESTS_EN: Omit<QCTest, 'id' | 'value' | 'passed'>[] = [
    { name: 'Dose Calibrator - Constancy', unit: '%', minLimit: -5, maxLimit: 5 },
    { name: 'Gamma Camera - Uniformity', unit: '%', minLimit: 0, maxLimit: 5 },
    { name: 'Gamma Camera - COR', unit: 'mm', minLimit: -3, maxLimit: 3 },
    { name: 'Activity Meter - Background', unit: 'μCi', minLimit: 0, maxLimit: 0.5 },
    { name: 'Contamination Measurement', unit: 'cpm', minLimit: 0, maxLimit: 100 },
];

const WEEKLY_QC_TESTS_TR: Omit<QCTest, 'id' | 'value' | 'passed'>[] = [
    { name: 'Gamma Kamera - Spatial Resolution', unit: 'mm', minLimit: 0, maxLimit: 4.5 },
    { name: 'Gamma Kamera - Energy Resolution', unit: '%', minLimit: 0, maxLimit: 12 },
    { name: 'Doz Kalibratör - Linearity', unit: '%', minLimit: -5, maxLimit: 5 },
    { name: 'SPECT/CT - Registration', unit: 'mm', minLimit: 0, maxLimit: 5 },
];

const WEEKLY_QC_TESTS_EN: Omit<QCTest, 'id' | 'value' | 'passed'>[] = [
    { name: 'Gamma Camera - Spatial Resolution', unit: 'mm', minLimit: 0, maxLimit: 4.5 },
    { name: 'Gamma Camera - Energy Resolution', unit: '%', minLimit: 0, maxLimit: 12 },
    { name: 'Dose Calibrator - Linearity', unit: '%', minLimit: -5, maxLimit: 5 },
    { name: 'SPECT/CT - Registration', unit: 'mm', minLimit: 0, maxLimit: 5 },
];

const KIT_QC_TESTS_TR: Omit<QCTest, 'id' | 'value' | 'passed'>[] = [
    { name: 'Radyokimyasal Saflık (TLC)', unit: '%', minLimit: 95, maxLimit: 100 },
    { name: 'pH Değeri', unit: '', minLimit: 4.5, maxLimit: 7.5 },
    { name: 'Partikül Sayısı', unit: '/mL', minLimit: 0, maxLimit: 1000000 },
];

const KIT_QC_TESTS_EN: Omit<QCTest, 'id' | 'value' | 'passed'>[] = [
    { name: 'Radiochemical Purity (TLC)', unit: '%', minLimit: 95, maxLimit: 100 },
    { name: 'pH Value', unit: '', minLimit: 4.5, maxLimit: 7.5 },
    { name: 'Particle Count', unit: '/mL', minLimit: 0, maxLimit: 1000000 },
];

const STORAGE_KEY = 'nt_qc_records';

export const QualityControl: React.FC<QualityControlProps> = ({
    onClose,
    currentUser,
    addNotification,
}) => {
    // Get language from settings
    const lang = useMemo(() => {
        try {
            const settings = localStorage.getItem('nt_app_settings');
            if (settings) return JSON.parse(settings).language || 'tr';
        } catch { }
        return 'tr';
    }, []);

    const t = translations[lang as 'tr' | 'en'];

    const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'kit' | 'history'>('daily');
    const [qcRecords, setQcRecords] = useState<QCRecord[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const [currentTests, setCurrentTests] = useState<QCTest[]>([]);
    const [equipmentName, setEquipmentName] = useState('');
    const [kitName, setKitName] = useState('');
    const [notes, setNotes] = useState('');

    const getTestTemplates = (type: 'daily' | 'weekly' | 'kit') => {
        if (type === 'daily') return lang === 'en' ? DAILY_QC_TESTS_EN : DAILY_QC_TESTS_TR;
        if (type === 'weekly') return lang === 'en' ? WEEKLY_QC_TESTS_EN : WEEKLY_QC_TESTS_TR;
        return lang === 'en' ? KIT_QC_TESTS_EN : KIT_QC_TESTS_TR;
    };

    const initializeTests = (type: 'daily' | 'weekly' | 'kit') => {
        const testTemplates = getTestTemplates(type);
        setCurrentTests(testTemplates.map(t => ({
            ...t,
            id: Math.random().toString(36).substr(2, 9),
            value: null,
            passed: null,
        })));
    };

    const updateTestValue = (testId: string, value: string) => {
        const numValue = value === '' ? null : parseFloat(value);
        setCurrentTests(prev => prev.map(test => {
            if (test.id !== testId) return test;
            const passed = numValue !== null ? (numValue >= test.minLimit && numValue <= test.maxLimit) : null;
            return { ...test, value: numValue, passed };
        }));
    };

    const saveQCRecord = () => {
        const allFilled = currentTests.every(test => test.value !== null);
        if (!allFilled) {
            addNotification(t.incompleteTest, 'warning', t.fillAllValues);
            return;
        }

        const allPassed = currentTests.every(test => test.passed);
        const record: QCRecord = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString().split('T')[0],
            type: activeTab as 'daily' | 'weekly' | 'kit',
            equipmentName: equipmentName || undefined,
            kitName: kitName || undefined,
            tests: currentTests,
            performedBy: currentUser?.name || (lang === 'en' ? 'Unknown' : 'Bilinmeyen'),
            passed: allPassed,
            notes: notes || undefined,
            timestamp: new Date(),
        };

        const updatedRecords = [record, ...qcRecords];
        setQcRecords(updatedRecords);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));

        addNotification(
            allPassed ? t.qcSuccess : t.qcFailed,
            allPassed ? 'success' : 'error',
            allPassed ? t.allTestsPassed : t.someTestsFailed
        );

        setCurrentTests([]);
        setEquipmentName('');
        setKitName('');
        setNotes('');
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todayDailyQC = qcRecords.find(r => r.date === todayStr && r.type === 'daily');

    const getStatusBadge = (passed: boolean | null) => {
        if (passed === null) return null;
        return passed
            ? <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">✓ {t.passed}</span>
            : <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">✗ {t.failed}</span>;
    };

    const tabs = [
        { id: 'daily', label: t.dailyQc, icon: '📅', done: !!todayDailyQC },
        { id: 'weekly', label: t.weeklyQc, icon: '📆', done: false },
        { id: 'kit', label: t.kitQc, icon: '🧪', done: false },
        { id: 'history', label: t.history, icon: '📋', done: false },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden border border-slate-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🔬</span>
                        <div>
                            <h2 className="text-xl font-bold text-white">{t.title}</h2>
                            <p className="text-emerald-200 text-sm">{t.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <span className={`w-3 h-3 rounded-full ${todayDailyQC ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                            <span className="text-white/80">
                                {t.daily}: {todayDailyQC ? (todayDailyQC.passed ? t.passed : t.failed) : t.waiting}
                            </span>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex h-[calc(95vh-100px)]">
                    {/* Tabs */}
                    <div className="w-48 bg-slate-800/50 border-r border-slate-700 p-3">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as any);
                                    if (tab.id !== 'history') {
                                        initializeTests(tab.id as 'daily' | 'weekly' | 'kit');
                                    }
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-700/50'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span className="flex-1 text-left font-medium">{tab.label}</span>
                                {tab.done && tab.id !== 'history' && <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab !== 'history' ? (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-white">
                                        {activeTab === 'daily' ? t.dailyQcFull : activeTab === 'weekly' ? t.weeklyQcFull : t.kitQcFull}
                                    </h3>
                                    <span className="text-slate-400 text-sm">
                                        {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>

                                {activeTab === 'kit' ? (
                                    <div className="mb-4">
                                        <label className="block text-sm text-slate-300 mb-1">{t.kitName}</label>
                                        <input
                                            type="text"
                                            value={kitName}
                                            onChange={e => setKitName(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-emerald-500 outline-none"
                                            placeholder={lang === 'en' ? 'e.g. MDP Lot#12345' : 'Örn: MDP Lot#12345'}
                                        />
                                    </div>
                                ) : (
                                    <div className="mb-4">
                                        <label className="block text-sm text-slate-300 mb-1">{t.equipment}</label>
                                        <input
                                            type="text"
                                            value={equipmentName}
                                            onChange={e => setEquipmentName(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-emerald-500 outline-none"
                                            placeholder={lang === 'en' ? 'e.g. Gamma Camera #1' : 'Örn: Gamma Kamera #1'}
                                        />
                                    </div>
                                )}

                                <div className="space-y-3 mb-6">
                                    {currentTests.map(test => (
                                        <div
                                            key={test.id}
                                            className={`p-4 rounded-xl border ${test.passed === null ? 'bg-slate-700/30 border-slate-600' :
                                                    test.passed ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-red-500/10 border-red-500/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="text-white font-medium">{test.name}</p>
                                                    <p className="text-slate-400 text-xs">{t.limit}: {test.minLimit} - {test.maxLimit} {test.unit}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={test.value ?? ''}
                                                        onChange={e => updateTestValue(test.id, e.target.value)}
                                                        className="w-24 px-3 py-2 bg-slate-600 rounded-lg text-white text-right font-mono border border-slate-500 focus:border-emerald-400 outline-none"
                                                        placeholder="0.00"
                                                    />
                                                    <span className="text-slate-400 w-12">{test.unit}</span>
                                                    {getStatusBadge(test.passed)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm text-slate-300 mb-1">{t.notes}</label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 focus:border-emerald-500 outline-none resize-none"
                                        rows={2}
                                        placeholder={t.notesPlaceholder}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-slate-400 text-sm">
                                        {t.performedBy}: <span className="text-white">{currentUser?.name || t.notLoggedIn}</span>
                                    </p>
                                    <button
                                        onClick={saveQCRecord}
                                        disabled={currentTests.length === 0}
                                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                                    >
                                        {t.saveQc}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">{t.qcHistory}</h3>
                                {qcRecords.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <span className="text-4xl mb-4 block">📋</span>
                                        <p>{t.noRecords}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {qcRecords.map(record => (
                                            <div
                                                key={record.id}
                                                className={`p-4 rounded-xl border ${record.passed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{record.type === 'daily' ? '📅' : record.type === 'weekly' ? '📆' : '🧪'}</span>
                                                            <h4 className="font-semibold text-white">
                                                                {record.type === 'daily' ? t.dailyQc : record.type === 'weekly' ? t.weeklyQc : t.kitQc}
                                                            </h4>
                                                            {getStatusBadge(record.passed)}
                                                        </div>
                                                        <p className="text-slate-400 text-sm mt-1">{record.equipmentName || record.kitName || t.general}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-white text-sm">{new Date(record.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')}</p>
                                                        <p className="text-slate-400 text-xs">{record.performedBy}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {record.tests.map(test => (
                                                        <span
                                                            key={test.id}
                                                            className={`text-xs px-2 py-1 rounded ${test.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}
                                                        >
                                                            {test.name}: {test.value} {test.unit}
                                                        </span>
                                                    ))}
                                                </div>

                                                {record.notes && <p className="mt-2 text-slate-400 text-sm italic">"{record.notes}"</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
