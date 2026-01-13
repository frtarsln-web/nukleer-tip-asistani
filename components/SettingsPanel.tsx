import React, { useState, useEffect, useMemo } from 'react';
import { DoseUnit, StaffUser } from '../types';

interface SettingsPanelProps {
    onClose: () => void;
    currentUser: StaffUser | null;
    unit: DoseUnit;
    onUnitChange: (unit: DoseUnit) => void;
    soundEnabled: boolean;
    onToggleSound: () => void;
}

interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    language: 'tr' | 'en';
    defaultUnit: DoseUnit;
    notifications: {
        sound: boolean;
        desktop: boolean;
        lowStock: boolean;
        patientReady: boolean;
        qcReminder: boolean;
    };
    display: {
        compactMode: boolean;
        showAnimations: boolean;
        highContrast: boolean;
    };
}

const defaultSettings: AppSettings = {
    theme: 'dark',
    language: 'tr',
    defaultUnit: DoseUnit.MCI,
    notifications: {
        sound: true,
        desktop: true,
        lowStock: true,
        patientReady: true,
        qcReminder: true,
    },
    display: {
        compactMode: false,
        showAnimations: true,
        highContrast: false,
    },
};

// Translations
const translations = {
    tr: {
        settings: 'Ayarlar',
        general: 'Genel',
        notifications: 'Bildirimler',
        display: 'Görünüm',
        about: 'Hakkında',
        theme: 'Tema',
        themeLight: 'Açık',
        themeDark: 'Koyu',
        themeSystem: 'Sistem',
        language: 'Dil',
        defaultUnit: 'Varsayılan Birim',
        notificationSound: 'Bildirim Sesleri',
        notificationSoundDesc: 'Uyarılar için ses çal',
        desktopNotif: 'Masaüstü Bildirimleri',
        desktopNotifDesc: 'Tarayıcı bildirimleri göster',
        lowStock: 'Düşük Stok Uyarısı',
        lowStockDesc: 'Stok kritik seviyeye düştüğünde',
        patientReady: 'Hasta Hazır Bildirimi',
        patientReadyDesc: 'Hasta çekim için hazır olduğunda',
        qcReminder: 'QC Hatırlatıcısı',
        qcReminderDesc: 'Günlük kalite kontrol zamanında',
        compactMode: 'Kompakt Mod',
        compactModeDesc: 'Daha az boşlukla sıkıştırılmış görünüm',
        animations: 'Animasyonlar',
        animationsDesc: 'UI geçiş animasyonları',
        highContrast: 'Yüksek Kontrast',
        highContrastDesc: 'Erişilebilirlik için artırılmış kontrast',
        fontSize: 'Yazı Boyutu',
        small: 'Küçük',
        normal: 'Normal',
        large: 'Büyük',
        version: 'Sürüm',
        developer: 'Geliştirici',
        license: 'Lisans',
        lastUpdate: 'Son Güncelleme',
        keyboardTip: 'Klavye kısayolları için',
        pressKey: 'tuşuna basın',
        allRightsReserved: 'Tüm hakları saklıdır',
        langSaved: 'Dil tercihi kaydedildi.',
    },
    en: {
        settings: 'Settings',
        general: 'General',
        notifications: 'Notifications',
        display: 'Display',
        about: 'About',
        theme: 'Theme',
        themeLight: 'Light',
        themeDark: 'Dark',
        themeSystem: 'System',
        language: 'Language',
        defaultUnit: 'Default Unit',
        notificationSound: 'Notification Sounds',
        notificationSoundDesc: 'Play sound for alerts',
        desktopNotif: 'Desktop Notifications',
        desktopNotifDesc: 'Show browser notifications',
        lowStock: 'Low Stock Alert',
        lowStockDesc: 'When stock reaches critical level',
        patientReady: 'Patient Ready Notification',
        patientReadyDesc: 'When patient is ready for imaging',
        qcReminder: 'QC Reminder',
        qcReminderDesc: 'Daily quality control reminder',
        compactMode: 'Compact Mode',
        compactModeDesc: 'Compressed view with less spacing',
        animations: 'Animations',
        animationsDesc: 'UI transition animations',
        highContrast: 'High Contrast',
        highContrastDesc: 'Increased contrast for accessibility',
        fontSize: 'Font Size',
        small: 'Small',
        normal: 'Normal',
        large: 'Large',
        version: 'Version',
        developer: 'Developer',
        license: 'License',
        lastUpdate: 'Last Update',
        keyboardTip: 'For keyboard shortcuts press',
        pressKey: 'key',
        allRightsReserved: 'All rights reserved',
        langSaved: 'Language preference saved.',
    },
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    onClose,
    currentUser,
    unit,
    onUnitChange,
    soundEnabled,
    onToggleSound,
}) => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        const saved = localStorage.getItem('nt_app_settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    });
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'display' | 'about'>('general');

    // Get translation
    const t = useMemo(() => translations[settings.language], [settings.language]);

    useEffect(() => {
        localStorage.setItem('nt_app_settings', JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        // Apply theme
        const applyTheme = (isDark: boolean) => {
            if (isDark) {
                document.documentElement.classList.remove('light');
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
            } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
                document.documentElement.style.colorScheme = 'light';
            }
        };

        if (settings.theme === 'dark') {
            applyTheme(true);
        } else if (settings.theme === 'light') {
            applyTheme(false);
        } else {
            // System preference
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(mediaQuery.matches);

            // Listen for system theme changes
            const handleChange = (e: MediaQueryListEvent) => applyTheme(e.matches);
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [settings.theme]);

    const updateSettings = (path: string, value: any) => {
        setSettings(prev => {
            const keys = path.split('.');
            const newSettings = { ...prev };
            let current: any = newSettings;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newSettings;
        });
    };

    const tabs = [
        { id: 'general', label: t.general, icon: '⚙️' },
        { id: 'notifications', label: t.notifications, icon: '🔔' },
        { id: 'display', label: t.display, icon: '🎨' },
        { id: 'about', label: t.about, icon: 'ℹ️' },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-slate-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚙️</span>
                        <div>
                            <h2 className="text-xl font-bold text-white">{t.settings}</h2>
                            {currentUser && (
                                <p className="text-violet-200 text-sm">
                                    {currentUser.name} • {currentUser.role}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex h-[calc(90vh-80px)]">
                    {/* Sidebar */}
                    <div className="w-48 bg-slate-800/50 border-r border-slate-700 p-3">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${activeTab === tab.id
                                    ? 'bg-violet-600 text-white shadow-lg'
                                    : 'text-slate-300 hover:bg-slate-700/50'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-white mb-4">{t.general}</h3>

                                {/* Theme */}
                                <div className="bg-slate-700/30 rounded-xl p-4">
                                    <label className="block text-sm font-medium text-slate-300 mb-3">
                                        🌓 {t.theme}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'light', label: t.themeLight, icon: '☀️' },
                                            { value: 'dark', label: t.themeDark, icon: '🌙' },
                                            { value: 'system', label: t.themeSystem, icon: '💻' },
                                        ].map(theme => (
                                            <button
                                                key={theme.value}
                                                onClick={() => updateSettings('theme', theme.value)}
                                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${settings.theme === theme.value
                                                    ? 'bg-violet-600 text-white'
                                                    : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600'
                                                    }`}
                                            >
                                                <span>{theme.icon}</span>
                                                <span>{theme.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Unit */}
                                <div className="bg-slate-700/30 rounded-xl p-4">
                                    <label className="block text-sm font-medium text-slate-300 mb-3">
                                        📏 {t.defaultUnit}
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => onUnitChange(DoseUnit.MCI)}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${unit === DoseUnit.MCI
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600'
                                                }`}
                                        >
                                            <span className="font-mono font-bold">mCi</span>
                                            <span className="text-xs opacity-70">Millicurie</span>
                                        </button>
                                        <button
                                            onClick={() => onUnitChange(DoseUnit.MBQ)}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${unit === DoseUnit.MBQ
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600'
                                                }`}
                                        >
                                            <span className="font-mono font-bold">MBq</span>
                                            <span className="text-xs opacity-70">Megabecquerel</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Language */}
                                <div className="bg-slate-700/30 rounded-xl p-4">
                                    <label className="block text-sm font-medium text-slate-300 mb-3">
                                        🌐 {t.language}
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => updateSettings('language', 'tr')}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${settings.language === 'tr'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600'
                                                }`}
                                        >
                                            <span>🇹🇷</span>
                                            <span>Türkçe</span>
                                        </button>
                                        <button
                                            onClick={() => updateSettings('language', 'en')}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${settings.language === 'en'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600'
                                                }`}
                                        >
                                            <span>🇬🇧</span>
                                            <span>English</span>
                                        </button>
                                    </div>
                                    <p className="text-blue-400 text-xs mt-2">
                                        ✓ {t.langSaved}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-white mb-4">{t.notifications}</h3>

                                {/* Sound Toggle */}
                                <div className="bg-slate-700/30 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">🔊 {t.notificationSound}</p>
                                            <p className="text-slate-400 text-sm">{t.notificationSoundDesc}</p>
                                        </div>
                                        <button
                                            onClick={onToggleSound}
                                            className={`relative w-14 h-8 rounded-full transition-colors ${soundEnabled ? 'bg-emerald-500' : 'bg-slate-600'
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${soundEnabled ? 'left-7' : 'left-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Notification Categories */}
                                {[
                                    { key: 'desktop', label: t.desktopNotif, desc: t.desktopNotifDesc, icon: '💻' },
                                    { key: 'lowStock', label: t.lowStock, desc: t.lowStockDesc, icon: '📦' },
                                    { key: 'patientReady', label: t.patientReady, desc: t.patientReadyDesc, icon: '👤' },
                                    { key: 'qcReminder', label: t.qcReminder, desc: t.qcReminderDesc, icon: '🔬' },
                                ].map(item => (
                                    <div key={item.key} className="bg-slate-700/30 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">{item.icon} {item.label}</p>
                                                <p className="text-slate-400 text-sm">{item.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => updateSettings(`notifications.${item.key}`, !settings.notifications[item.key as keyof typeof settings.notifications])}
                                                className={`relative w-14 h-8 rounded-full transition-colors ${settings.notifications[item.key as keyof typeof settings.notifications] ? 'bg-emerald-500' : 'bg-slate-600'
                                                    }`}
                                            >
                                                <span
                                                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.notifications[item.key as keyof typeof settings.notifications] ? 'left-7' : 'left-1'
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'display' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-white mb-4">{t.display}</h3>

                                {[
                                    { key: 'compactMode', label: t.compactMode, desc: t.compactModeDesc, icon: '📐' },
                                    { key: 'showAnimations', label: t.animations, desc: t.animationsDesc, icon: '✨' },
                                    { key: 'highContrast', label: t.highContrast, desc: t.highContrastDesc, icon: '🔲' },
                                ].map(item => (
                                    <div key={item.key} className="bg-slate-700/30 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">{item.icon} {item.label}</p>
                                                <p className="text-slate-400 text-sm">{item.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => updateSettings(`display.${item.key}`, !settings.display[item.key as keyof typeof settings.display])}
                                                className={`relative w-14 h-8 rounded-full transition-colors ${settings.display[item.key as keyof typeof settings.display] ? 'bg-emerald-500' : 'bg-slate-600'
                                                    }`}
                                            >
                                                <span
                                                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.display[item.key as keyof typeof settings.display] ? 'left-7' : 'left-1'
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Font Size */}
                                <div className="bg-slate-700/30 rounded-xl p-4">
                                    <label className="block text-sm font-medium text-slate-300 mb-3">
                                        🔤 {t.fontSize}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[t.small, t.normal, t.large].map((size, i) => (
                                            <button
                                                key={size}
                                                className={`px-4 py-3 rounded-lg transition-all ${i === 1
                                                    ? 'bg-violet-600 text-white'
                                                    : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600'
                                                    }`}
                                            >
                                                <span className={`font-medium ${i === 0 ? 'text-sm' : i === 2 ? 'text-lg' : ''}`}>
                                                    {size}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="space-y-6">
                                <div className="text-center py-8">
                                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                                        <span className="text-5xl">☢️</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">
                                        {settings.language === 'en' ? 'Nuclear Medicine Assistant' : 'Nükleer Tıp Asistanı'}
                                    </h3>
                                    <p className="text-slate-400">{t.version} 2.0.0</p>
                                </div>

                                <div className="bg-slate-700/30 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">{t.developer}</span>
                                        <span className="text-white">
                                            {settings.language === 'en' ? 'Nuclear Medicine Team' : 'Nükleer Tıp Ekibi'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">{t.license}</span>
                                        <span className="text-white">MIT License</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">{t.lastUpdate}</span>
                                        <span className="text-white">
                                            {settings.language === 'en' ? 'January 2026' : 'Ocak 2026'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
                                    <p className="text-blue-300 text-sm">
                                        <span className="font-semibold">💡 {settings.language === 'en' ? 'Tip:' : 'İpucu:'}</span> {t.keyboardTip}
                                        <kbd className="mx-1 px-2 py-1 bg-slate-700 rounded text-xs">?</kbd>
                                        {t.pressKey}
                                    </p>
                                </div>

                                <div className="text-center pt-4">
                                    <p className="text-slate-500 text-xs">
                                        © 2026 {settings.language === 'en' ? 'Nuclear Medicine Assistant' : 'Nükleer Tıp Asistanı'}. {t.allRightsReserved}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
