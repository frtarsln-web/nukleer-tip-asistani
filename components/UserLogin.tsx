import React, { useState } from 'react';
import { StaffUser, UserRole, ROLE_PERMISSIONS } from '../types';

interface UserLoginProps {
    users: StaffUser[];
    currentUser: StaffUser | null;
    onLogin: (user: StaffUser, password?: string) => boolean;
    onAddUser: (name: string, role: UserRole, password?: string) => void;
}

export const UserLogin: React.FC<UserLoginProps> = ({
    users,
    currentUser,
    onLogin,
    onAddUser
}) => {
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.ADMIN);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
    const [loginPassword, setLoginPassword] = useState('');
    const [error, setError] = useState('');
    const [selectedAdmin, setSelectedAdmin] = useState<StaffUser | null>(null);
    const [adminPassword, setAdminPassword] = useState('');

    const isSetupMode = users.length === 0;
    // Admin users are hidden from the user grid (they login via the admin link at bottom)
    const activeUsers = users.filter((u: StaffUser) => u.isActive !== false && u.role !== UserRole.ADMIN);

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMIN: return 'from-amber-500 to-orange-600';
            case UserRole.TECHNICIAN: return 'from-blue-500 to-blue-600';
            case UserRole.PHYSICIST: return 'from-purple-500 to-purple-600';
            case UserRole.NURSE: return 'from-pink-500 to-pink-600';
            case UserRole.DOCTOR: return 'from-emerald-500 to-emerald-600';
            default: return 'from-slate-500 to-slate-600';
        }
    };

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMIN:
                return <span className="text-2xl">👑</span>;
            case UserRole.TECHNICIAN:
                return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
            case UserRole.PHYSICIST:
                return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
            case UserRole.NURSE:
                return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
            case UserRole.DOCTOR:
                return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
            default:
                return <span className="text-2xl">👤</span>;
        }
    };

    const getRoleName = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMIN: return 'Admin';
            case UserRole.TECHNICIAN: return 'Tekniker';
            case UserRole.PHYSICIST: return 'Fizikçi';
            case UserRole.NURSE: return 'Hemşire';
            case UserRole.DOCTOR: return 'Doktor';
            default: return role;
        }
    };

    const handleUserClick = (user: StaffUser) => {
        if (user.password) {
            setSelectedUser(user);
            setLoginPassword('');
            setError('');
        } else {
            const success = onLogin(user);
            if (!success) {
                setError('Giriş yapılamadı!');
            }
        }
    };

    const handlePasswordLogin = () => {
        if (!selectedUser) return;
        const success = onLogin(selectedUser, loginPassword);
        if (!success) {
            setError('Şifre hatalı!');
        }
    };

    const handleAdminSetup = () => {
        if (!newUserName.trim()) {
            setError('İsim gerekli!');
            return;
        }
        if (!newPassword) {
            setError('Şifre gerekli!');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Şifreler eşleşmiyor!');
            return;
        }
        if (newPassword.length < 4) {
            setError('Şifre en az 4 karakter olmalı!');
            return;
        }

        onAddUser(newUserName.trim(), UserRole.ADMIN, newPassword);
        setNewUserName('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
    };

    // Password entry for existing user
    if (selectedUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#020202] via-[#0a0a1a] to-[#020202] flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${getRoleColor(selectedUser.role)} flex items-center justify-center text-4xl mb-4 shadow-2xl`}>
                            {getRoleIcon(selectedUser.role)}
                        </div>
                        <h1 className="text-2xl font-black text-white">{selectedUser.name}</h1>
                        <p className="text-sm text-slate-400 mt-1">{getRoleName(selectedUser.role)}</p>
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

    // Get admin users for the admin login section
    const adminUsers = users.filter((u: StaffUser) => u.role === UserRole.ADMIN && u.isActive !== false);

    const handleAdminLogin = () => {
        if (!selectedAdmin) return;
        const success = onLogin(selectedAdmin, adminPassword);
        if (!success) {
            setError('Şifre hatalı!');
        } else {
            setShowSetupModal(false);
            setSelectedAdmin(null);
            setAdminPassword('');
            setError('');
        }
    };

    // Admin Setup/Login Modal - Rendered inline to prevent re-mount on state changes
    const adminSetupModalContent = showSetupModal ? (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xl">
                                👑
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white">Yönetici Girişi</h2>
                                <p className="text-xs text-slate-400">Admin hesabıyla giriş yapın</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setShowSetupModal(false);
                                setSelectedAdmin(null);
                                setAdminPassword('');
                                setNewUserName('');
                                setNewPassword('');
                                setConfirmPassword('');
                                setError('');
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Show admin login if there are admin users */}
                    {adminUsers.length > 0 && !selectedAdmin && (
                        <div className="space-y-3 mb-4">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Admin Seçin</p>
                            {adminUsers.map((admin: StaffUser) => (
                                <button
                                    key={admin.id}
                                    onClick={() => {
                                        setSelectedAdmin(admin);
                                        setError('');
                                    }}
                                    className="w-full flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-amber-500/50 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                                        👑
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-bold text-sm">{admin.name}</p>
                                        <p className="text-[10px] text-amber-400/70 uppercase">Yönetici</p>
                                    </div>
                                    {admin.password && <span className="ml-auto text-xs">🔒</span>}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Password input for selected admin */}
                    {selectedAdmin && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-lg">
                                    👑
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">{selectedAdmin.name}</p>
                                    <p className="text-[10px] text-amber-400/70 uppercase">Yönetici</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedAdmin(null);
                                        setAdminPassword('');
                                        setError('');
                                    }}
                                    className="ml-auto p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                            {selectedAdmin.password && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Şifre
                                    </label>
                                    <input
                                        type="password"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                                        placeholder="Şifrenizi girin..."
                                        autoFocus
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                            )}
                            <button
                                onClick={handleAdminLogin}
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Giriş Yap
                            </button>
                        </div>
                    )}

                    {/* Divider if there are existing admins */}
                    {adminUsers.length > 0 && !selectedAdmin && (
                        <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-slate-700"></div>
                            <span className="text-xs text-slate-500">veya</span>
                            <div className="flex-1 h-px bg-slate-700"></div>
                        </div>
                    )}

                    {/* Create new admin form - show if no admin selected */}
                    {!selectedAdmin && (
                        <div className="space-y-4">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Yeni Admin Oluştur</p>
                            <div className="mb-4 p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                <p className="text-amber-400 text-[10px]">
                                    ⚠️ Bu hesap tüm yetkilere sahip olacak
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Admin Adı
                                </label>
                                <input
                                    type="text"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    placeholder="İsminizi girin..."
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Şifre
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Şifre (min. 4 karakter)..."
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Şifre Tekrar
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Şifreyi tekrar girin..."
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    handleAdminSetup();
                                    setShowSetupModal(false);
                                }}
                                disabled={!newUserName.trim() || !newPassword || !confirmPassword}
                                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                + Yeni Admin Oluştur
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    ) : null;

    // Normal login - select existing user
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#020202] via-[#0a0a1a] to-[#020202] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
            {/* Animated Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute -bottom-20 left-1/3 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl relative z-10">
                {/* Header */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 mb-6 shadow-2xl shadow-purple-500/30">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">
                        <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">Nükleer Tıp</span>
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Asistanı</span>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></span>
                        Devam etmek için kullanıcı seçin
                    </p>
                </div>

                {/* User Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                    {activeUsers.map((user, index) => (
                        <button
                            key={user.id}
                            onClick={() => handleUserClick(user)}
                            className="group relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] animate-in fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Glowing background on hover */}
                            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${getRoleColor(user.role)} opacity-0 blur-3xl group-hover:opacity-30 transition-all duration-700`}></div>
                            <div className={`absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br ${getRoleColor(user.role)} opacity-0 blur-3xl group-hover:opacity-20 transition-all duration-700`}></div>

                            {/* Content */}
                            <div className="relative z-10">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center mx-auto mb-4 text-white shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 group-hover:shadow-2xl`}>
                                    {getRoleIcon(user.role)}
                                </div>
                                <p className="text-white font-black text-sm text-center mb-1 group-hover:text-white transition-colors">{user.name}</p>
                                <p className={`text-[10px] font-bold uppercase tracking-wider text-center ${getRoleColor(user.role).replace('from-', 'text-').split(' ')[0]} opacity-70 group-hover:opacity-100 transition-opacity`}>
                                    {getRoleName(user.role)}
                                </p>
                                {user.password && (
                                    <div className="flex justify-center mt-2">
                                        <span className="text-xs">🔒</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="text-center mt-10 animate-in fade-in duration-700" style={{ animationDelay: '500ms' }}>
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="w-8 h-px bg-gradient-to-r from-transparent to-slate-700"></div>
                        <div className="w-1 h-1 rounded-full bg-emerald-500/50"></div>
                        <div className="w-8 h-px bg-gradient-to-l from-transparent to-slate-700"></div>
                    </div>
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-3">
                        Radyofarmasötik Takip Sistemi v2.0
                    </p>
                    {/* Admin Setup Link - small and subtle */}
                    <button
                        onClick={() => setShowSetupModal(true)}
                        className="text-[10px] text-slate-600 hover:text-amber-400 transition-colors"
                    >
                        👑 Admin Kurulumu
                    </button>
                </div>
            </div>

            {/* Admin Setup Modal */}
            {adminSetupModalContent}
        </div>
    );
};
