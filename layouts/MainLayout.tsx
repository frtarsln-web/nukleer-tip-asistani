import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../stores';
import { UserRole, ROLE_PERMISSIONS } from '../types';

// Navigation items for sidebar
const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: '🏠', roles: ['all'] },
    { path: '/patients', label: 'Hasta Yönetimi', icon: '👥', roles: [UserRole.TECHNICIAN, UserRole.NURSE] },
    { path: '/stock', label: 'Stok Yönetimi', icon: '💉', roles: [UserRole.TECHNICIAN, UserRole.PHYSICIST] },
    { path: '/doctor', label: 'Doktor Paneli', icon: '👨‍⚕️', roles: [UserRole.DOCTOR] },
    { path: '/physicist', label: 'Fizikçi Paneli', icon: '⚛️', roles: [UserRole.PHYSICIST] },
    { path: '/reports', label: 'Raporlar', icon: '📊', roles: [UserRole.TECHNICIAN, UserRole.PHYSICIST, UserRole.DOCTOR] },
    { path: '/waste', label: 'Atık Yönetimi', icon: '♻️', roles: [UserRole.TECHNICIAN, UserRole.PHYSICIST] },
    { path: '/handbook', label: 'El Kitabı', icon: '📚', roles: ['all'] },
    { path: '/settings', label: 'Ayarlar', icon: '⚙️', roles: ['all'] },
];

export const MainLayout: React.FC = () => {
    const { currentUser, logout } = useAuthStore();
    const { mobileMenuOpen, setMobileMenuOpen, theme, setTheme } = useAppStore();
    const location = useLocation();
    const [now, setNow] = useState(new Date());

    // Update time every second
    React.useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Filter nav items based on user role
    const filteredNavItems = NAV_ITEMS.filter((item) => {
        if (item.roles.includes('all')) return true;
        if (!currentUser) return false;
        return item.roles.includes(currentUser.role);
    });

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#020202] via-[#0a0a1a] to-[#020202] text-white flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10">
                {/* Logo */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xl">
                            ⚛️
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-white">Nükleer Tıp</h1>
                            <p className="text-[10px] text-slate-400">Asistan v2.0</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {filteredNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User Info */}
                {currentUser && (
                    <div className="p-4 border-t border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-lg font-bold">
                                {currentUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                    {currentUser.role}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-all border border-red-500/20"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Çıkış Yap
                        </button>
                    </div>
                )}
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center justify-between p-3">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-lg">⚛️</span>
                        <span className="text-sm font-black">Nükleer Tıp</span>
                    </div>

                    <div className="text-right">
                        <div className="text-sm font-black tabular-nums">
                            {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-white/10 pt-16 overflow-y-auto">
                        <nav className="p-3 space-y-1">
                            {filteredNavItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`
                                    }
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>

                        {currentUser && (
                            <div className="p-4 border-t border-white/10 mt-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-lg font-bold">
                                        {currentUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                            {currentUser.role}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-all border border-red-500/20"
                                >
                                    Çıkış Yap
                                </button>
                            </div>
                        )}
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 lg:pt-0 pt-14 overflow-auto">
                <div className="min-h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
