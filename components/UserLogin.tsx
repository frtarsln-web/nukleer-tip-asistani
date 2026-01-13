import React, { useState } from 'react';
import { StaffUser, UserRole } from '../types';

interface UserLoginProps {
    users: StaffUser[];
    onLogin: (user: StaffUser) => void;
    onAddUser: (name: string, role: UserRole) => void;
}

export const UserLogin: React.FC<UserLoginProps> = ({
    users,
    onLogin,
    onAddUser
}) => {
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.TECHNICIAN);

    const handleAddUser = () => {
        if (!newUserName.trim()) return;
        onAddUser(newUserName.trim(), newUserRole);
        setNewUserName('');
        setIsAddingUser(false);
    };

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case UserRole.TECHNICIAN: return 'from-blue-500 to-blue-600';
            case UserRole.PHYSICIST: return 'from-purple-500 to-purple-600';
            case UserRole.NURSE: return 'from-pink-500 to-pink-600';
            case UserRole.DOCTOR: return 'from-emerald-500 to-emerald-600';
        }
    };

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case UserRole.TECHNICIAN:
                return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
            case UserRole.PHYSICIST:
                return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
            case UserRole.NURSE:
                return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
            case UserRole.DOCTOR:
                return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
        }
    };

    const getRoleName = (role: UserRole) => {
        switch (role) {
            case UserRole.TECHNICIAN: return 'Tekniker';
            case UserRole.PHYSICIST: return 'Fizikçi';
            case UserRole.NURSE: return 'Hemşire';
            case UserRole.DOCTOR: return 'Doktor';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#020202] via-[#0a0a1a] to-[#020202] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute -bottom-20 left-1/3 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-pink-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
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
                    <h1 className="text-3xl font-black tracking-tight mb-3">
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
                {users.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                        {users.map((user, index) => (
                            <button
                                key={user.id}
                                onClick={() => onLogin(user)}
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
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Add User Section */}
                {isAddingUser ? (
                    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-white/10 rounded-3xl p-6 animate-in zoom-in-95 fade-in duration-300 backdrop-blur-xl">
                        <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 uppercase tracking-wider mb-4">Yeni Kullanıcı Ekle</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-1 block">İsim</label>
                                <input
                                    type="text"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    placeholder="Örn: Ahmet Yılmaz"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-1 block">Rol</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {Object.values(UserRole).map(role => (
                                        <button
                                            key={role}
                                            onClick={() => setNewUserRole(role)}
                                            className={`p-3 rounded-xl border transition-all duration-300 ${newUserRole === role
                                                ? `bg-gradient-to-br ${getRoleColor(role)} border-transparent text-white shadow-lg`
                                                : 'bg-slate-800/50 border-white/5 text-slate-400 hover:border-white/20 hover:bg-slate-700/50'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                {getRoleIcon(role)}
                                                <span className="text-[8px] font-black uppercase">{getRoleName(role)}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsAddingUser(false)}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-bold text-xs uppercase transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleAddUser}
                                    disabled={!newUserName.trim()}
                                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all duration-300 ${newUserName.trim()
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white shadow-lg hover:shadow-purple-500/30'
                                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                        }`}
                                >
                                    Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAddingUser(true)}
                        className="group w-full py-4 bg-slate-900/50 hover:bg-slate-800/50 border border-dashed border-white/10 hover:border-purple-500/50 rounded-2xl text-slate-500 hover:text-purple-400 font-bold text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 animate-in fade-in duration-700"
                        style={{ animationDelay: '400ms' }}
                    >
                        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Yeni Kullanıcı Ekle
                    </button>
                )}

                {/* Footer */}
                <div className="text-center mt-10 animate-in fade-in duration-700" style={{ animationDelay: '500ms' }}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-8 h-px bg-gradient-to-r from-transparent to-slate-700"></div>
                        <div className="w-1 h-1 rounded-full bg-emerald-500/50"></div>
                        <div className="w-8 h-px bg-gradient-to-l from-transparent to-slate-700"></div>
                    </div>
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                        Radyofarmasötik Takip Sistemi v2.0
                    </p>
                </div>
            </div>
        </div>
    );
};
