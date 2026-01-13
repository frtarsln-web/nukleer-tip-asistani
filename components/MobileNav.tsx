import React, { useState } from 'react';
import { UserRole, StaffUser } from '../types';

interface MobileNavProps {
    currentUser: StaffUser | null;
    userRole: UserRole | null;
    onNavigate: (view: string) => void;
    currentView: string;
    notifications: number;
}

interface NavItem {
    id: string;
    label: string;
    icon: string;
    roles?: UserRole[];
}

const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: '🏠' },
    { id: 'scheduler', label: 'Randevular', icon: '📅' },
    { id: 'patients', label: 'Hastalar', icon: '👥' },
    { id: 'stock', label: 'Stok', icon: '📦', roles: [UserRole.TECHNICIAN, UserRole.PHYSICIST] },
    { id: 'kits', label: 'Kit Hazırlama', icon: '🧪', roles: [UserRole.TECHNICIAN, UserRole.PHYSICIST] },
    { id: 'qc', label: 'Kalite Kontrol', icon: '🔬' },
    { id: 'pharma', label: 'Hesaplamalar', icon: '💊' },
    { id: 'reports', label: 'Raporlar', icon: '📊' },
    { id: 'archive', label: 'Arşiv', icon: '🗄️' },
    { id: 'ai', label: 'AI Asistan', icon: '🤖' },
    { id: 'handbook', label: 'El Kitabı', icon: '📖' },
    { id: 'settings', label: 'Ayarlar', icon: '⚙️' },
];

export const MobileNav: React.FC<MobileNavProps> = ({
    currentUser,
    userRole,
    onNavigate,
    currentView,
    notifications,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const filteredItems = navItems.filter(item => {
        if (!item.roles) return true;
        return userRole && item.roles.includes(userRole);
    });

    const handleNavigate = (id: string) => {
        onNavigate(id);
        setIsOpen(false);
    };

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Menu Button */}
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <span className="text-xl">☢️</span>
                        <span className="text-white font-semibold">Nükleer Tıp</span>
                    </div>

                    {/* Notifications */}
                    <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors relative">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {notifications > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {notifications > 9 ? '9+' : notifications}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 z-50"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Slide-out Menu */}
            <div
                className={`lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-gradient-to-b from-slate-800 to-slate-900 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Menu Header */}
                <div className="p-4 border-b border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">☢️</span>
                            <span className="text-white font-bold text-lg">Nükleer Tıp</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* User Info */}
                    {currentUser && (
                        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {currentUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-white font-medium">{currentUser.name}</p>
                                <p className="text-slate-400 text-sm capitalize">{currentUser.role}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Nav Items */}
                <div className="p-3 overflow-y-auto max-h-[calc(100vh-180px)]">
                    {filteredItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${currentView === item.id
                                    ? 'bg-violet-600 text-white shadow-lg'
                                    : 'text-slate-300 hover:bg-slate-700/50'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-slate-800">
                    <p className="text-slate-500 text-xs text-center">
                        Nükleer Tıp Asistanı v2.0
                    </p>
                </div>
            </div>

            {/* Bottom Navigation (for quick access on mobile) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-800 border-t border-slate-700 px-2 py-1 safe-area-bottom">
                <div className="flex justify-around">
                    {[
                        { id: 'dashboard', icon: '🏠', label: 'Ana' },
                        { id: 'patients', icon: '👥', label: 'Hasta' },
                        { id: 'stock', icon: '📦', label: 'Stok' },
                        { id: 'qc', icon: '🔬', label: 'QC' },
                        { id: 'ai', icon: '🤖', label: 'AI' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${currentView === item.id
                                    ? 'text-violet-400'
                                    : 'text-slate-400 hover:text-slate-300'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-xs mt-0.5">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};
