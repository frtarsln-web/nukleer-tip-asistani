import React, { useState } from 'react';
import { useAuthStore } from '../stores';
import { StaffUser, UserRole } from '../types';

const LoginPage: React.FC = () => {
    const { login, staffUsers, addStaffUser, isFirstUser } = useAuthStore();
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
    const [error, setError] = useState('');

    const isSetupMode = isFirstUser();

    const ROLES = [
        { value: UserRole.ADMIN, label: 'Admin', icon: '👑', color: 'from-amber-500 to-orange-500' },
        { value: UserRole.TECHNICIAN, label: 'Teknisyen', icon: '👨‍🔬', color: 'from-blue-500 to-cyan-500' },
        { value: UserRole.DOCTOR, label: 'Doktor', icon: '👨‍⚕️', color: 'from-purple-500 to-pink-500' },
        { value: UserRole.PHYSICIST, label: 'Fizikçi', icon: '⚛️', color: 'from-emerald-500 to-teal-500' },
        { value: UserRole.NURSE, label: 'Hemşire', icon: '👩‍⚕️', color: 'from-rose-500 to-orange-500' },
    ];

    const handleQuickLogin = (user: StaffUser) => {
        if (user.password) {
            setSelectedUser(user);
            setLoginPassword('');
            setError('');
        } else {
            const success = login(user);
            if (success) {
                window.location.href = '/';
            }
        }
    };

    const handlePasswordLogin = () => {
        if (!selectedUser) return;

        const success = login(selectedUser, loginPassword);
        if (success) {
            window.location.href = '/';
        } else {
            setError('Şifre hatalı!');
        }
    };

    const handleAdminSetup = () => {
        if (!name.trim()) {
            setError('İsim gerekli!');
            return;
        }
        if (!password) {
            setError('Şifre gerekli!');
            return;
        }
        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor!');
            return;
        }
        if (password.length < 4) {
            setError('Şifre en az 4 karakter olmalı!');
            return;
        }

        const adminUser: StaffUser = {
            id: Math.random().toString(36).substr(2, 9),
            name: name.trim(),
            role: UserRole.ADMIN,
            password: password,
            isActive: true,
            createdAt: new Date(),
        };

        addStaffUser(adminUser);
        login(adminUser, password);
        window.location.href = '/';
    };

    // Password entry screen for existing user
    if (selectedUser) {
        const roleInfo = ROLES.find((r) => r.value === selectedUser.role);
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#020202] via-[#0a0a1a] to-[#020202] flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${roleInfo?.color || 'from-purple-500 to-blue-600'} flex items-center justify-center text-4xl mb-4 shadow-2xl`}>
                            {roleInfo?.icon || '👤'}
                        </div>
                        <h1 className="text-2xl font-black text-white">{selectedUser.name}</h1>
                        <p className="text-sm text-slate-400 mt-1">{roleInfo?.label}</p>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Şifrenizi Girin</h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <input
                            type="password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
                            placeholder="Şifre..."
                            autoFocus
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 mb-4"
                        />

                        <button
                            onClick={handlePasswordLogin}
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Giriş Yap
                        </button>

                        <button
                            onClick={() => {
                                setSelectedUser(null);
                                setLoginPassword('');
                                setError('');
                            }}
                            className="w-full mt-3 py-2 text-slate-500 hover:text-white text-sm font-bold transition-colors"
                        >
                            ← Geri Dön
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Admin setup screen (first time)
    if (isSetupMode) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#020202] via-[#0a0a1a] to-[#020202] flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-4xl mb-4 shadow-2xl shadow-amber-500/30">
                            👑
                        </div>
                        <h1 className="text-2xl font-black text-white">İlk Kurulum</h1>
                        <p className="text-sm text-slate-400 mt-1">Admin hesabı oluşturun</p>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                            <p className="text-amber-400 text-sm font-medium">
                                ⚠️ Bu hesap tüm yetkilere sahip olacak ve diğer kullanıcıları yönetebilecek.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Admin Adı
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="İsminizi girin..."
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Şifre
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Şifre (min. 4 karakter)..."
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Şifre Tekrar
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Şifreyi tekrar girin..."
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                            />
                        </div>

                        <button
                            onClick={handleAdminSetup}
                            disabled={!name.trim() || !password || !confirmPassword}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Admin Hesabı Oluştur
                        </button>
                    </div>

                    <p className="text-center text-xs text-slate-600 mt-6">
                        Nükleer Tıp Asistanı v2.0 • 2026
                    </p>
                </div>
            </div>
        );
    }

    // Normal login screen
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
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Kullanıcı Seçin</h2>
                    <div className="space-y-2">
                        {staffUsers.filter(u => u.isActive !== false).map((user) => {
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
                                    {user.password && (
                                        <span className="text-slate-500 text-lg">🔒</span>
                                    )}
                                    <svg className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            );
                        })}
                    </div>
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
