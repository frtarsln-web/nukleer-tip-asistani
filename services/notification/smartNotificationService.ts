export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface SmartNotification {
    id: string;
    title: string;
    message: string;
    priority: NotificationPriority;
    type: NotificationType;
    timestamp: Date;
    persistent?: boolean;
    sound?: boolean;
    action?: {
        label: string;
        callback: () => void;
    };
    groupId?: string;
    dismissed: boolean;
    autoCloseMs?: number;
}

class SmartNotificationService {
    private notifications: SmartNotification[] = [];
    private listeners: Set<(notifications: SmartNotification[]) => void> = new Set();
    private soundEnabled: boolean = true;

    // Add notification with smart prioritization
    add(notification: Omit<SmartNotification, 'id' | 'timestamp' | 'dismissed'>): string {
        const id = Math.random().toString(36).substr(2, 9);

        const newNotification: SmartNotification = {
            id,
            timestamp: new Date(),
            dismissed: false,
            ...notification
        };

        // Auto-close timer based on priority
        if (!notification.persistent && !notification.autoCloseMs) {
            const autoCloseTimes = {
                low: 3000,
                medium: 5000,
                high: 8000,
                critical: 0 // Never auto-close
            };
            newNotification.autoCloseMs = autoCloseTimes[notification.priority];
        }

        // Play sound if enabled and priority is high/critical
        if (this.soundEnabled && notification.sound !== false) {
            if (notification.priority === 'high' || notification.priority === 'critical') {
                this.playNotificationSound(notification.priority);
            }
        }

        // Group similar notifications
        if (notification.groupId) {
            // Remove old notifications in same group
            this.notifications = this.notifications.filter(n => n.groupId !== notification.groupId);
        }

        this.notifications.unshift(newNotification);
        this.notifyListeners();

        // Auto-close if configured
        if (newNotification.autoCloseMs && newNotification.autoCloseMs > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, newNotification.autoCloseMs);
        }

        // Browser notification for critical items
        if (notification.priority === 'critical' && 'Notification' in window) {
            this.requestBrowserNotification(notification);
        }

        return id;
    }

    // Quick add methods
    info(title: string, message: string, options?: Partial<SmartNotification>) {
        return this.add({ title, message, type: 'info', priority: 'medium', ...options });
    }

    success(title: string, message: string, options?: Partial<SmartNotification>) {
        return this.add({ title, message, type: 'success', priority: 'low', ...options });
    }

    warning(title: string, message: string, options?: Partial<SmartNotification>) {
        return this.add({ title, message, type: 'warning', priority: 'high', ...options });
    }

    error(title: string, message: string, options?: Partial<SmartNotification>) {
        return this.add({ title, message, type: 'error', priority: 'critical', persistent: true, ...options });
    }

    // Dismiss notification
    dismiss(id: string) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.dismissed = true;
            // Remove after animation
            setTimeout(() => {
                this.notifications = this.notifications.filter(n => n.id !== id);
                this.notifyListeners();
            }, 300);
            this.notifyListeners();
        }
    }

    dismissAll() {
        this.notifications.forEach(n => n.dismissed = true);
        setTimeout(() => {
            this.notifications = [];
            this.notifyListeners();
        }, 300);
        this.notifyListeners();
    }

    // Get notifications
    getAll(): SmartNotification[] {
        return this.notifications;
    }

    getActive(): SmartNotification[] {
        return this.notifications.filter(n => !n.dismissed);
    }

    getByPriority(priority: NotificationPriority): SmartNotification[] {
        return this.notifications.filter(n => n.priority === priority && !n.dismissed);
    }

    getCritical(): SmartNotification[] {
        return this.getByPriority('critical');
    }

    // Subscribe to changes
    subscribe(listener: (notifications: SmartNotification[]) => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.getActive()));
    }

    // Sound management
    setSoundEnabled(enabled: boolean) {
        this.soundEnabled = enabled;
    }

    private playNotificationSound(priority: NotificationPriority) {
        try {
            const frequencies = {
                high: [523.25, 659.25],      // C5, E5
                critical: [830.61, 987.77]   // G#5, B5
            };

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const freq = frequencies[priority as 'high' | 'critical'] || frequencies.high;

            freq.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

                oscillator.start(audioContext.currentTime + index * 0.15);
                oscillator.stop(audioContext.currentTime + index * 0.15 + 0.1);
            });
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    }

    // Browser notification
    private async requestBrowserNotification(notification: Omit<SmartNotification, 'id' | 'timestamp' | 'dismissed'>) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                badge: '/favicon.ico'
            });
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message
                });
            }
        }
    }

    // Predefined notification templates
    templates = {
        stockLow: (isotope: string, amount: number, unit: string) => this.warning(
            'Düşük Stok Uyarısı',
            `${isotope} stoğu ${amount} ${unit} seviyesine düştü!`,
            { groupId: 'stock-low', sound: true }
        ),

        patientReady: (patientName: string, roomId?: number) => this.info(
            'Hasta Hazır',
            roomId ? `${patientName} (Oda ${roomId}) çekime hazır` : `${patientName} çekime hazır`,
            { priority: 'high', sound: true, groupId: `patient-ready-${patientName}` }
        ),

        criticalTime: (patientName: string, minutes: number) => this.error(
            'KRİTİK UYARI!',
            `${patientName} - ${minutes} dakika geçti! ACİL çekime alın!`,
            { sound: true, persistent: true }
        ),

        qcFailed: (testName: string, isotope: string) => this.error(
            'Kalite Kontrol Başarısız',
            `${isotope} - ${testName} testi başarısız oldu!`,
            { persistent: true, sound: true }
        ),

        kitExpiring: (kitName: string, hoursRemaining: number) => this.warning(
            'Kit Süresi Doluyor',
            `${kitName} - ${hoursRemaining} saat kaldı`,
            { groupId: 'kit-expiry' }
        ),

        generatorElutionDue: () => this.warning(
            'Jeneratör Sağımı Gerekli',
            'Jeneratör 24 saattir sağılmadı',
            { groupId: 'generator-elution', sound: true }
        ),

        appointmentReminder: (patientName: string, minutesUntil: number) => this.info(
            'Randevu Hatırlatıcı',
            `${patientName} - ${minutesUntil} dakika sonra`,
            { groupId: `appointment-${patientName}` }
        ),

        backupCompleted: (recordCount: number) => this.success(
            'Yedekleme Tamamlandı',
            `${recordCount} kayıt başarıyla yedeklendi`
        ),

        dataImported: (recordCount: number) => this.success(
            'Veri İçe Aktarıldı',
            `${recordCount} kayıt başarıyla içe aktarıldı`
        )
    };
}

// Singleton instance
export const notificationService = new SmartNotificationService();
