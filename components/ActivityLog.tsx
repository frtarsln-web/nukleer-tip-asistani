
import React, { useState } from 'react';
import { DoseLogEntry, Isotope, DoseUnit, DoseStatus } from '../types';
import { exportToCSV } from '../utils/export';
import { getVialCurrentActivity } from '../utils/physics';
import { RegionSelector } from './RegionSelector';
import { NoteModal } from './NoteModal';
import { usePatientNotes } from '../contexts/PatientNotesContext';

interface ActivityLogProps {
    history: DoseLogEntry[];
    selectedIsotope: Isotope;
    unit: DoseUnit;
    now: Date;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onReset: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onRequestAdditionalImaging: (entryId: string, region: string, doseNeeded: boolean, scheduledMinutes?: number) => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
    history,
    selectedIsotope,
    unit,
    now,
    onFileUpload,
    onReset,
    fileInputRef,
    onRequestAdditionalImaging
}) => {
    const [regionSelectorOpen, setRegionSelectorOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<{ id: string; name: string } | null>(null);

    // Patient Notes
    const { addNote, updateNote, deleteNote, getNote, hasNote } = usePatientNotes();
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [notePatient, setNotePatient] = useState<{ id: string; name: string } | null>(null);

    const handleNoteClick = (patientId: string, patientName: string) => {
        setNotePatient({ id: patientId, name: patientName });
        setNoteModalOpen(true);
    };

    const handleNoteSave = (patientId: string, patientName: string, text: string) => {
        if (getNote(patientId)) {
            updateNote(patientId, text);
        } else {
            addNote(patientId, patientName, text);
        }
    };

    const handleRequestClick = (entryId: string, patientName: string) => {
        setSelectedEntry({ id: entryId, name: patientName });
        setRegionSelectorOpen(true);
    };

    const handleRegionSelect = (region: string) => {
        if (selectedEntry) {
            onRequestAdditionalImaging(selectedEntry.id, region, false, 60);
        }
        setRegionSelectorOpen(false);
        setSelectedEntry(null);
    };

    const [isArchiveOpen, setIsArchiveOpen] = useState(false);

    if (!isArchiveOpen) {
        return (
            <button
                onClick={() => setIsArchiveOpen(true)}
                className="w-full bg-gradient-to-tr from-slate-900/60 to-slate-800/20 backdrop-blur-3xl rounded-[2.5rem] p-7 border border-white/5 shadow-2xl group transition-all duration-500 hover:border-blue-500/30 hover:shadow-blue-500/5 text-left"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-[0.2em]">Hasta Arşivi</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                    {history.length} Toplam Kayıt
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                <span className="text-[10px] font-bold text-blue-500/80 uppercase tracking-tighter">
                                    Görüntülemek için tıklayın
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                    </div>
                </div>
            </button>
        );
    }

    return (
        <>
            <NoteModal
                isOpen={noteModalOpen}
                onClose={() => setNoteModalOpen(false)}
                patientId={notePatient?.id || ''}
                patientName={notePatient?.name || ''}
                initialNote={notePatient ? getNote(notePatient.id)?.text : ''}
                onSave={handleNoteSave}
                onDelete={deleteNote}
            />
            <RegionSelector
                isOpen={regionSelectorOpen}
                patientName={selectedEntry?.name || ''}
                onSelect={handleRegionSelect}
                onClose={() => setRegionSelectorOpen(false)}
            />
            <section id="activity-log-section" className="bg-gradient-to-b from-slate-900/60 to-slate-900/20 backdrop-blur-3xl rounded-[2.5rem] p-7 border border-white/5 shadow-2xl space-y-5 text-left animate-in zoom-in-95 fade-in duration-300">
                <div className="flex items-center justify-between px-2 text-slate-500">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsArchiveOpen(false)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all border border-white/5 flex items-center gap-2 pr-3"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                            <span className="text-[10px] font-black uppercase tracking-widest">Geri</span>
                        </button>
                        <div className="flex items-center gap-2 ml-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>
                            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">HASTA ARŞİVİ</h4>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* ... functionality buttons ... */}
                        <button
                            onClick={() => exportToCSV(history, selectedIsotope.name)}
                            className="p-2 bg-slate-900/40 rounded-xl border border-white/5 text-blue-400 hover:bg-slate-800 transition-colors"
                            title="CSV Dışa Aktar"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="p-2 bg-slate-900/40 rounded-xl border border-white/5 text-slate-400 hover:bg-slate-800 transition-colors"
                            title="Rapor Yazdır"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 bg-slate-900/40 rounded-xl border border-white/5 text-emerald-400 hover:bg-slate-800 transition-colors"
                            title="Liste Yükle"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </button>
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={onFileUpload}
                            accept="image/*,.pdf"
                        />
                        {history.length > 0 && (
                            <button onClick={onReset} className="text-[8px] font-black text-red-500/50 hover:text-red-500 transition-colors uppercase ml-2 tracking-tighter">TEMİZLE</button>
                        )}
                    </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2.5 scrollbar-thin scrollbar-thumb-blue-500/20 scrollbar-track-transparent">
                    {history.length > 0 ? history.map((entry, idx) => {
                        // ... layout code ...
                        let displayAmount = entry.amount;
                        if (entry.unit !== unit) {
                            displayAmount = unit === DoseUnit.MBQ ? entry.amount * 37 : entry.amount / 37;
                        }

                        const currentAmount = getVialCurrentActivity({ initialAmount: displayAmount, receivedAt: entry.timestamp }, selectedIsotope.halfLifeHours, now);
                        const hoursPassed = (now.getTime() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60);

                        return (
                            <div
                                key={entry.id}
                                className="bg-slate-900/30 backdrop-blur-sm rounded-xl py-2 px-4 flex items-center justify-between group border border-white/5 hover:bg-slate-900/50 hover:border-white/10 transition-all duration-200"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-slate-800/50 flex items-center justify-center text-[9px] font-black text-slate-500 border border-white/5 shrink-0">
                                        {history.length - idx}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5 leading-tight">
                                            <h3 className="text-[11px] font-bold text-white truncate">{entry.patientName}</h3>
                                            {entry.protocolNo && <span className="text-[6px] font-black px-1 py-0.5 bg-blue-500/10 text-blue-400 rounded-sm shrink-0 border border-blue-500/10">P:{entry.protocolNo}</span>}
                                        </div>
                                        <p className="text-[7px] font-medium text-slate-500 uppercase tracking-tighter truncate leading-tight mt-0.5">{entry.procedure}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-1 leading-none">
                                            <span className="text-[11px] font-black text-orange-400">-{displayAmount.toFixed(2)}</span>
                                            <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">{unit}</span>
                                        </div>
                                        <div className="flex items-center justify-end gap-1 mt-0.5 opacity-60">
                                            <p className="text-[7px] font-bold text-slate-600 whitespace-nowrap">
                                                {entry.preparedBy && <span>{entry.preparedBy.name.split(' ')[0]} · </span>}
                                                {Math.round(hoursPassed * 60)}dk
                                            </p>
                                        </div>
                                    </div>
                                    {/* Note Button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleNoteClick(entry.id, entry.patientName); }}
                                        className={`p-1.5 rounded-lg transition-all ${hasNote(entry.id)
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : 'opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 border border-white/5'}`}
                                        title={hasNote(entry.id) ? 'Notu Görüntüle' : 'Not Ekle'}
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    {(selectedIsotope.id === 'f18' || selectedIsotope.id === 'ga68') && entry.status !== DoseStatus.INJECTED && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRequestClick(entry.id, entry.patientName); }}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-blue-500/5 hover:bg-blue-500/20 text-blue-400 border border-blue-500/10 transition-all group-hover:scale-105"
                                            title="Ek Çekim İste"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="py-12 flex flex-col items-center justify-center space-y-3 opacity-20">
                            <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-[8px] font-black uppercase tracking-[0.3em]">Arşiv Boş</p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};
