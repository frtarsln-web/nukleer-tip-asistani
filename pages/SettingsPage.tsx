import React, { useState } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { StaffUser, UserRole, ROLE_PERMISSIONS } from '../types';

const SettingsPage: React.FC = () => {
    const { theme, setTheme, soundEnabled, toggleSound } = useAppStore();
    const { currentUser, staffUsers, addStaffUser, updateStaffUser, removeStaffUser } = useAuthStore();

    const [showAddUser, setShowAddUser] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

    // Form states
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState<UserRole>(UserRole.TECHNICIAN);
    const [newPassword, setNewPassword] = useState('');
    const [formError, setFormError] = useState('');

    const canManageUsers = currentUser && ROLE_PERMISSIONS[currentUser.role]?.canManageUsers;

    const ROLES = [
        { value: UserRole.ADMIN, label: 'Admin', icon: '👑', color: 'from-amber-500 to-orange-500' },
        { value: UserRole.TECHNICIAN, label: 'Teknisyen', icon: '👨‍🔬', color: 'from-blue-500 to-cyan-500' },
        { value: UserRole.DOCTOR, label: 'Doktor', icon: '👨‍⚕️', color: 'from-purple-500 to-pink-500' },
        { value: UserRole.PHYSICIST, label: 'Fizikçi', icon: '⚛️', color: 'from-emerald-500 to-teal-500' },
        { value: UserRole.NURSE, label: 'Hemşire', icon: '👩‍⚕️', color: 'from-rose-500 to-orange-500' },
    ];

    const handleAddUser = () => {
        if (!newName.trim()) {
            setFormError('İsim gerekli!');
            return;
        }

        const newUser: StaffUser = {
            id: Math.random().toString(36).substr(2, 9),
            name: newName.trim(),
            role: newRole,
            password: newPassword || undefined,
            isActive: true,
            createdAt: new Date(),
        };

        addStaffUser(newUser);
        setShowAddUser(false);
        setNewName('');
        setNewRole(UserRole.TECHNICIAN);
        setNewPassword('');
        setFormError('');
    };

    const handleUpdateUser = () => {
        if (!editingUser) return;
        if (!newName.trim()) {
            setFormError('İsim gerekli!');
            return;
        }

        updateStaffUser(editingUser.id, {
            name: newName.trim(),
            role: newRole,
            password: newPassword || editingUser.password,
        });

        setEditingUser(null);
        setNewName('');
        setNewRole(UserRole.TECHNICIAN);
        setNewPassword('');
        setFormError('');
    };

    const handleDeleteUser = (userId: string) => {
        removeStaffUser(userId);
        setShowDeleteConfirm(null);
    };

    const handleToggleActive = (userId: string, isActive: boolean) => {
        updateStaffUser(userId, { isActive: !isActive });
    };

    const openEditModal = (user: StaffUser) => {
        setEditingUser(user);
        setNewName(user.name);
        setNewRole(user.role);
        setNewPassword('');
        setFormError('');
    };

    return (
        <div className="p-4 md:p-6">
            <div className="bg-gradient-to-r from-slate-800/40 to-slate-900/40 border border-white/10 rounded-2xl p-6 mb-6">
                <h1 className="text-2xl font-black text-white flex items-center gap-3">
                    <span>⚙️</span> Ayarlar
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Uygulama tercihleri ve yapılandırma
                </p>
            </div>

            <div className="space-y-4 max-w-4xl">
                {/* Theme Setting */}
                <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-white">Tema</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Arayüz görünümünü seçin</p>
                        </div>
                        <div className="flex gap-2">
                            {(['dark', 'light', 'system'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${theme === t
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                        }`}
                                >
                                    {t === 'dark' ? '🌙 Koyu' : t === 'light' ? '☀️ Açık' : '💻 Sistem'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sound Setting */}
                <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-white">Bildirim Sesleri</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Uyarı ve bildirim sesleri</p>
                        </div>
                        <button
                            onClick={toggleSound}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${soundEnabled
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800/50 text-slate-500 border border-slate-700/30'
                                }`}
                        >
                            {soundEnabled ? '🔊 Açık' : '🔇 Kapalı'}
                        </button>
                    </div>
                </div>

                {/* User Management - Only for Admin */}
                {canManageUsers && (
                    <div className="bg-slate-900/30 border border-amber-500/20 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    👑 Kullanıcı Yönetimi
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Personel hesaplarını yönetin</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAddUser(true);
                                    setNewName('');
                                    setNewRole(UserRole.TECHNICIAN);
                                    setNewPassword('');
                                    setFormError('');
                                }}
                                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 rounded-xl text-sm font-bold transition-all"
                            >
                                + Kullanıcı Ekle
                            </button>
                        </div>

                        {/* Users List */}
                        <div className="space-y-2">
                            {staffUsers.map((user) => {
                                const roleInfo = ROLES.find((r) => r.value === user.role);
                                const isSelf = user.id === currentUser?.id;

                                return (
                                    <div
                                        key={user.id}
                                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${user.isActive !== false
                                                ? 'bg-slate-800/30 border-slate-700/30'
                                                : 'bg-slate-900/50 border-slate-800/30 opacity-60'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${roleInfo?.color || 'from-slate-500 to-slate-600'} flex items-center justify-center text-xl`}>
                                            {roleInfo?.icon || '👤'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-white">{user.name}</p>
                                                {user.password && <span className="text-xs">🔒</span>}
                                                {isSelf && (
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-bold">
                                                        Siz
                                                    </span>
                                                )}
                                                {user.isActive === false && (
                                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-bold">
                                                        Pasif
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">{roleInfo?.label}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
                                                title="Düzenle"
                                            >
                                                ✏️
                                            </button>
                                            {!isSelf && (
                                                <>
                                                    <button
                                                        onClick={() => handleToggleActive(user.id, user.isActive !== false)}
                                                        className={`p-2 rounded-lg transition-colors ${user.isActive !== false
                                                                ? 'hover:bg-orange-500/20 text-orange-400'
                                                                : 'hover:bg-emerald-500/20 text-emerald-400'
                                                            }`}
                                                        title={user.isActive !== false ? 'Pasif Yap' : 'Aktif Yap'}
                                                    >
                                                        {user.isActive !== false ? '🚫' : '✅'}
                                                    </button>
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(user.id)}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                                                        title="Sil"
                                                    >
                                                        🗑️
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Version Info */}
                <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-white">Uygulama Sürümü</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Nükleer Tıp Asistanı</p>
                        </div>
                        <span className="px-4 py-2 bg-purple-500/10 text-purple-400 rounded-xl text-sm font-bold border border-purple-500/20">
                            v2.0.0
                        </span>
                    </div>
                </div>
            </div>

            {/* Add/Edit User Modal */}
            {(showAddUser || editingUser) && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-lg font-black text-white mb-4">
                            {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
                        </h2>

                        {formError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                {formError}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                İsim
                            </label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Personel adı..."
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Rol
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {ROLES.map((role) => (
                                    <button
                                        key={role.value}
                                        onClick={() => setNewRole(role.value)}
                                        className={`p-3 rounded-xl border transition-all text-left ${newRole === role.value
                                            ? 'bg-purple-500/20 border-purple-500/50'
                                            : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{role.icon}</span>
                                            <span className={`text-sm font-bold ${newRole === role.value ? 'text-purple-400' : 'text-slate-400'}`}>
                                                {role.label}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Şifre {editingUser && <span className="text-slate-600">(boş bırakırsanız değişmez)</span>}
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder={editingUser ? "Yeni şifre (isteğe bağlı)..." : "Şifre (isteğe bağlı)..."}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowAddUser(false);
                                    setEditingUser(null);
                                }}
                                className="flex-1 py-3 bg-slate-800/50 text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-700/50 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={editingUser ? handleUpdateUser : handleAddUser}
                                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {editingUser ? 'Güncelle' : 'Ekle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 w-full max-w-sm">
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center text-3xl mb-3">
                                🗑️
                            </div>
                            <h2 className="text-lg font-black text-white">Kullanıcıyı Sil?</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Bu işlem geri alınamaz. Kullanıcı kalıcı olarak silinecek.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 py-3 bg-slate-800/50 text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-700/50 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => handleDeleteUser(showDeleteConfirm)}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all"
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
