// Simple i18n translations for the application

export type Language = 'tr' | 'en';

export const translations: Record<Language, Record<string, string>> = {
    tr: {
        // Header
        'app.title': 'Nükleer Tıp Asistanı',
        'app.subtitle': 'Akıllı Doz Yönetimi',

        // Navigation
        'nav.home': 'Ana Sayfa',
        'nav.scheduler': 'Randevular',
        'nav.patients': 'Hastalar',
        'nav.stock': 'Stok',
        'nav.kits': 'Kit Hazırlama',
        'nav.qc': 'Kalite Kontrol',
        'nav.calculations': 'Hesaplamalar',
        'nav.reports': 'Raporlar',
        'nav.archive': 'Arşiv',
        'nav.ai': 'AI Asistan',
        'nav.handbook': 'El Kitabı',
        'nav.settings': 'Ayarlar',
        'nav.tools': 'Araçlar',

        // Settings
        'settings.title': 'Ayarlar',
        'settings.general': 'Genel',
        'settings.notifications': 'Bildirimler',
        'settings.display': 'Görünüm',
        'settings.about': 'Hakkında',
        'settings.theme': 'Tema',
        'settings.theme.light': 'Açık',
        'settings.theme.dark': 'Koyu',
        'settings.theme.system': 'Sistem',
        'settings.language': 'Dil',
        'settings.unit': 'Varsayılan Birim',

        // Common
        'common.close': 'Kapat',
        'common.save': 'Kaydet',
        'common.cancel': 'İptal',
        'common.add': 'Ekle',
        'common.delete': 'Sil',
        'common.edit': 'Düzenle',
        'common.search': 'Ara',
        'common.filter': 'Filtrele',
        'common.export': 'Dışa Aktar',
        'common.loading': 'Yükleniyor...',

        // QC
        'qc.title': 'Kalite Kontrol',
        'qc.daily': 'Günlük QC',
        'qc.weekly': 'Haftalık QC',
        'qc.kit': 'Kit QC',
        'qc.history': 'Geçmiş',
        'qc.passed': 'Geçti',
        'qc.failed': 'Başarısız',

        // Dashboard
        'dashboard.totalPatients': 'Toplam Hasta',
        'dashboard.todayPatients': 'Bugün',
        'dashboard.weeklyTrend': 'Haftalık Trend',
        'dashboard.procedures': 'Prosedür Dağılımı',

        // Patient
        'patient.name': 'Hasta Adı',
        'patient.procedure': 'Prosedür',
        'patient.dose': 'Doz',
        'patient.weight': 'Ağırlık',
        'patient.waiting': 'Bekleyen',

        // Notifications
        'notification.sound': 'Bildirim Sesleri',
        'notification.desktop': 'Masaüstü Bildirimleri',
        'notification.lowStock': 'Düşük Stok Uyarısı',
        'notification.patientReady': 'Hasta Hazır Bildirimi',
        'notification.qcReminder': 'QC Hatırlatıcısı',
    },

    en: {
        // Header
        'app.title': 'Nuclear Medicine Assistant',
        'app.subtitle': 'Smart Dose Management',

        // Navigation
        'nav.home': 'Home',
        'nav.scheduler': 'Appointments',
        'nav.patients': 'Patients',
        'nav.stock': 'Stock',
        'nav.kits': 'Kit Preparation',
        'nav.qc': 'Quality Control',
        'nav.calculations': 'Calculations',
        'nav.reports': 'Reports',
        'nav.archive': 'Archive',
        'nav.ai': 'AI Assistant',
        'nav.handbook': 'Handbook',
        'nav.settings': 'Settings',
        'nav.tools': 'Tools',

        // Settings
        'settings.title': 'Settings',
        'settings.general': 'General',
        'settings.notifications': 'Notifications',
        'settings.display': 'Display',
        'settings.about': 'About',
        'settings.theme': 'Theme',
        'settings.theme.light': 'Light',
        'settings.theme.dark': 'Dark',
        'settings.theme.system': 'System',
        'settings.language': 'Language',
        'settings.unit': 'Default Unit',

        // Common
        'common.close': 'Close',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.add': 'Add',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.export': 'Export',
        'common.loading': 'Loading...',

        // QC
        'qc.title': 'Quality Control',
        'qc.daily': 'Daily QC',
        'qc.weekly': 'Weekly QC',
        'qc.kit': 'Kit QC',
        'qc.history': 'History',
        'qc.passed': 'Passed',
        'qc.failed': 'Failed',

        // Dashboard
        'dashboard.totalPatients': 'Total Patients',
        'dashboard.todayPatients': 'Today',
        'dashboard.weeklyTrend': 'Weekly Trend',
        'dashboard.procedures': 'Procedure Distribution',

        // Patient
        'patient.name': 'Patient Name',
        'patient.procedure': 'Procedure',
        'patient.dose': 'Dose',
        'patient.weight': 'Weight',
        'patient.waiting': 'Waiting',

        // Notifications
        'notification.sound': 'Notification Sounds',
        'notification.desktop': 'Desktop Notifications',
        'notification.lowStock': 'Low Stock Alert',
        'notification.patientReady': 'Patient Ready Notification',
        'notification.qcReminder': 'QC Reminder',
    },
};

// Get current language from localStorage
export const getCurrentLanguage = (): Language => {
    try {
        const settings = localStorage.getItem('nt_app_settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            return parsed.language || 'tr';
        }
    } catch {
        // ignore
    }
    return 'tr';
};

// Translation function
export const t = (key: string, lang?: Language): string => {
    const language = lang || getCurrentLanguage();
    return translations[language]?.[key] || translations['tr'][key] || key;
};

// Hook-like function to get translator
export const useTranslation = () => {
    const lang = getCurrentLanguage();
    return {
        t: (key: string) => t(key, lang),
        lang,
    };
};
