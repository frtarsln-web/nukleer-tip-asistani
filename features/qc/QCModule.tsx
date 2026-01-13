import React, { useState } from 'react';
import { db, QualityControl } from '../../services/database/db';
import { notificationService } from '../../services/notification/smartNotificationService';
import { auditLogger } from '../../services/audit/auditLogger';

interface QCModuleProps {
    selectedIsotope: string;
    onClose?: () => void;
}

const QC_STANDARDS = {
    radiochemicalPurity: { min: 95, unit: '%' },
    pH: { min: 4.5, max: 7.5 },
    particulate: false
};

export const QCModule: React.FC<QCModuleProps> = ({ selectedIsotope, onClose }) => {
    const [testType, setTestType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [radiochemicalPurity, setRadiochemicalPurity] = useState('');
    const [pH, setPH] = useState('');
    const [particulate, setParticulate] = useState(false);
    const [notes, setNotes] = useState('');
    const [performedBy, setPerformedBy] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const purity = parseFloat(radiochemicalPurity);
            const phValue = pH ? parseFloat(pH) : undefined;

            // Determine pass/fail
            let result: 'pass' | 'fail' = 'pass';
            const failures: string[] = [];

            if (purity < QC_STANDARDS.radiochemicalPurity.min) {
                result = 'fail';
                failures.push(`Radyokimyasal saflık düşük: ${purity}%`);
            }

            if (phValue && (phValue < QC_STANDARDS.pH.min || phValue > QC_STANDARDS.pH.max)) {
                result = 'fail';
                failures.push(`pH aralık dışı: ${phValue}`);
            }

            if (particulate) {
                result = 'fail';
                failures.push('Partikül tespit edildi');
            }

            // Save to database
            const testId = await db.qualityControls.add({
                date: new Date(),
                testType,
                isotope: selectedIsotope,
                radiochemicalPurity: purity,
                pH: phValue,
                particulate,
                performedBy,
                result,
                notes: failures.length > 0 ? `${notes}\n\nHatalar: ${failures.join(', ')}` : notes
            });

            // Audit log
            await auditLogger.logQCTest(testId!, {
                testType,
                isotope: selectedIsotope,
                result,
                radiochemicalPurity: purity
            });

            // Notification
            if (result === 'fail') {
                notificationService.templates.qcFailed(`${testType.toUpperCase()} Test`, selectedIsotope);
            } else {
                notificationService.success(
                    'Kalite Kontrol Başarılı',
                    `${selectedIsotope} ${testType} testi geçildi`,
                    { groupId: `qc-${selectedIsotope}` }
                );
            }

            // Reset form
            setRadiochemicalPurity('');
            setPH('');
            setParticulate(false);
            setNotes('');

            if (onClose) onClose();
        } catch (error) {
            notificationService.error('QC Kaydı Hatası', 'Test kaydedilemedi');
            console.error('QC save error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/60 border border-white/10 rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-black text-white">Kalite Kontrol</h2>
                    <p className="text-sm text-slate-400 mt-1">{selectedIsotope} - QC Test Girişi</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Test Type */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Test Tipi
                    </label>
                    <div className="flex gap-2">
                        {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setTestType(type)}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${testType === type
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                                    }`}
                            >
                                {type === 'daily' && '📅 Günlük'}
                                {type === 'weekly' && '📊 Haftalık'}
                                {type === 'monthly' && '📈 Aylık'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Radiochemical Purity */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Radyokimyasal Saflık (%) *
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={radiochemicalPurity}
                        onChange={(e) => setRadiochemicalPurity(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                        placeholder="≥ 95%"
                    />
                    <p className="text-xs text-slate-500 mt-1">Standart: ≥ {QC_STANDARDS.radiochemicalPurity.min}%</p>
                </div>

                {/* pH */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        pH (opsiyonel)
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="14"
                        value={pH}
                        onChange={(e) => setPH(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                        placeholder="4.5 - 7.5"
                    />
                    <p className="text-xs text-slate-500 mt-1">Standart: {QC_STANDARDS.pH.min} - {QC_STANDARDS.pH.max}</p>
                </div>

                {/* Particulate */}
                <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                    <div>
                        <label className="block text-sm font-bold text-white">Partikül Testi</label>
                        <p className="text-xs text-slate-400 mt-1">Gözle muayenede partikül var mı?</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setParticulate(!particulate)}
                        className={`relative w-14 h-7 rounded-full transition-colors ${particulate ? 'bg-red-500' : 'bg-emerald-500'
                            }`}
                    >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${particulate ? 'translate-x-8' : 'translate-x-1'
                            }`} />
                    </button>
                </div>

                {/* Performed By */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Test Yapan *
                    </label>
                    <input
                        type="text"
                        value={performedBy}
                        onChange={(e) => setPerformedBy(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                        placeholder="İsim Soyisim"
                    />
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Notlar
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all resize-none"
                        placeholder="Ek notlar..."
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-purple-500 hover:bg-purple-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all active:scale-[0.98]"
                >
                    {isSubmitting ? '⏳ Kaydediliyor...' : '✅ Testi Kaydet'}
                </button>
            </form>
        </div>
    );
};
