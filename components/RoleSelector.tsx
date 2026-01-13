
import React from 'react';
import { UserRole } from '../types';

interface RoleSelectorProps {
    onSelectRole: (role: UserRole) => void;
}

const roles = [
    {
        id: UserRole.TECHNICIAN,
        title: 'Tekniker',
        desc: 'İlaç hazırlama ve doz dağıtım yetkisi.',
        icon: '🧪',
        color: 'from-blue-500 to-indigo-600'
    },
    {
        id: UserRole.PHYSICIST,
        title: 'Fizikçi',
        desc: 'Kalite kontrol ve ilaç hazırlama yetkisi.',
        icon: '⚛️',
        color: 'from-emerald-500 to-teal-600'
    },
    {
        id: UserRole.NURSE,
        title: 'Hemşire',
        desc: 'Hasta doz takip ve izleme yetkisi.',
        icon: '👩‍⚕️',
        color: 'from-rose-500 to-pink-600'
    },
    {
        id: UserRole.DOCTOR,
        title: 'Doktor',
        desc: 'Prosedür izleme ve raporlama ekranı.',
        icon: '👨‍⚕️',
        color: 'from-amber-500 to-orange-600'
    }
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            <div className="relative z-10 w-full max-w-4xl px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-2">
                        Nükleer Tıp Asistanı
                    </h1>
                    <p className="text-slate-500 text-sm font-black uppercase tracking-[0.2em]">Lütfen Görevinizi Seçin</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => onSelectRole(role.id)}
                            className="group relative p-6 bg-slate-900/50 border border-white/5 rounded-[2.5rem] text-left transition-all hover:scale-[1.02] hover:bg-slate-900/80 hover:border-white/10 active:scale-[0.98]"
                        >
                            <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${role.color} rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                            <div className="flex items-start gap-6">
                                <span className="text-5xl">{role.icon}</span>
                                <div>
                                    <h3 className="text-xl font-black text-white mb-1">{role.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{role.desc}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <p className="text-center mt-12 text-[10px] text-slate-700 font-black uppercase tracking-widest">
                    Nükleer Tıp Asistanı v2.0 • Güvenli Erişim
                </p>
            </div>
        </div>
    );
};
