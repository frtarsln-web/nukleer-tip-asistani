import React, { useState } from 'react';
import { useAuthStore } from '../stores';
import { StaffUser, UserRole } from '../types';

const LoginPage: React.FC = () => {
    const { login, staffUsers, addStaffUser } = useAuthStore();
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.TECHNICIAN);
    const [name, setName] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);

    const ROLES = [
        { value: UserRole.TECHNICIAN, label: 'Teknisyen', icon: '👨‍🔬', color: 'from-blue-500 to-cyan-500' },
        { value: UserRole.DOCTOR, label: 'Doktor', icon: '👨‍⚕️', color: 'from-purple-500 to-pink-500' },
        { value: UserRole.PHYSICIST, label: 'Fizikçi', icon: '⚛️', color: 'from-emerald-500 to-teal-500' },
        { value: UserRole.NURSE, label: 'Hemşire', icon: '👩‍⚕️', color: 'from-rose-500 to-orange-500' },
    ];

    const handleQuickLogin = (user: StaffUser) => {
        login(user);
        window.location.href = '/';
    };

    const handleNewUserLogin = () => {
        if (!name.trim()) return;

        const newUser: StaffUser = {
            id: Math.random().toString(36).substr(2, 9),
            name: name.trim(),
            role: selectedRole,
            createdAt: new Date(),
        };

        addStaffUser(newUser);
        login(newUser);
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#020202] via-[#0a0a1a] to-[#020202] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-4xl mb-4 shadow-2xl shadow-purple-500/30">
                        ⚛️
                    </div>
                    <h1 className="text-2xl font-black text-white">Nükleer Tıp Asistanı</h1>
                    <p className="text-sm text-slate-400 mt-1">Hoş Geldiniz</p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                    {!isNewUser && staffUsers.length > 0 ? (
                        <>
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Kayıtlı Kullanıcılar</h2>
                            <div className="space-y-2 mb-6">
                                {staffUsers.map((user) => {
                                    const roleInfo = ROLES.find((r) => r.value === user.role);
                                    return (
                                        <button
                                            key={user.id}
                                            onClick={() => handleQuickLogin(user)}
                                            className="w-full flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-purple-500/50 rounded-2xl transition-all group"
                                        >
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${roleInfo?.color || 'from-slate-500 to-slate-600'} flex items-center justify-center text-2xl`}>
                                                {roleInfo?.icon || '👤'}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider">
                                                    {roleInfo?.label || user.role}
                                                </p>
                                            </div>
                                            <svg className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-700/50" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-slate-900/50 px-4 text-slate-500 font-bold">veya</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsNewUser(true)}
                                className="w-full mt-6 py-3 px-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-xl text-sm font-bold transition-all"
                            >
                                + Yeni Kullanıcı Ekle
                            </button>
                        </>
                    ) : (
                        <>
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">
                                {isNewUser ? 'Yeni Kullanıcı' : 'Giriş Yap'}
                            </h2>

                            {/* Name Input */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Adınız
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="İsminizi girin..."
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                                />
                            </div>

                            {/* Role Selection */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Rol Seçin
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ROLES.map((role) => (
                                        <button
                                            key={role.value}
                                            onClick={() => setSelectedRole(role.value)}
                                            className={`p-3 rounded-xl border transition-all text-left ${selectedRole === role.value
                                                    ? 'bg-purple-500/20 border-purple-500/50'
                                                    : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{role.icon}</span>
                                                <span className={`text-sm font-bold ${selectedRole === role.value ? 'text-purple-400' : 'text-slate-400'}`}>
                                                    {role.label}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleNewUserLogin}
                                disabled={!name.trim()}
                                className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Giriş Yap
                            </button>

                            {isNewUser && staffUsers.length > 0 && (
                                <button
                                    onClick={() => setIsNewUser(false)}
                                    className="w-full mt-3 py-2 text-slate-500 hover:text-white text-sm font-bold transition-colors"
                                >
                                    ← Kayıtlı Kullanıcılara Dön
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-600 mt-6">
                    Nükleer Tıp Asistanı v2.0 • 2026
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
