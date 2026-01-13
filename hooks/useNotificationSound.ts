import { useCallback, useRef, useState, useEffect } from 'react';

type NotificationSoundType = 'info' | 'success' | 'warning' | 'error' | 'critical';

interface UseNotificationSoundOptions {
    enabled?: boolean;
}

// Generate beep sounds using Web Audio API
const createBeepSound = (
    audioContext: AudioContext,
    frequency: number,
    duration: number,
    volume: number = 0.3
): OscillatorNode => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    return oscillator;
};

export function useNotificationSound(options: UseNotificationSoundOptions = {}) {
    const { enabled = true } = options;
    const [soundEnabled, setSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('nt_sound_enabled');
        return saved !== null ? saved === 'true' : enabled;
    });
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        localStorage.setItem('nt_sound_enabled', String(soundEnabled));
    }, [soundEnabled]);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    const playSound = useCallback((type: NotificationSoundType) => {
        if (!soundEnabled) return;

        try {
            const ctx = getAudioContext();

            switch (type) {
                case 'info':
                    // Single soft beep
                    const infoOsc = createBeepSound(ctx, 440, 0.15, 0.2);
                    infoOsc.start(ctx.currentTime);
                    infoOsc.stop(ctx.currentTime + 0.15);
                    break;

                case 'success':
                    // Two ascending beeps
                    const successOsc1 = createBeepSound(ctx, 523, 0.1, 0.25);
                    const successOsc2 = createBeepSound(ctx, 659, 0.15, 0.25);
                    successOsc1.start(ctx.currentTime);
                    successOsc1.stop(ctx.currentTime + 0.1);
                    successOsc2.start(ctx.currentTime + 0.12);
                    successOsc2.stop(ctx.currentTime + 0.27);
                    break;

                case 'warning':
                    // Two quick beeps
                    const warnOsc1 = createBeepSound(ctx, 880, 0.1, 0.3);
                    const warnOsc2 = createBeepSound(ctx, 880, 0.1, 0.3);
                    warnOsc1.start(ctx.currentTime);
                    warnOsc1.stop(ctx.currentTime + 0.1);
                    warnOsc2.start(ctx.currentTime + 0.15);
                    warnOsc2.stop(ctx.currentTime + 0.25);
                    break;

                case 'error':
                    // Descending tone
                    const errOsc = createBeepSound(ctx, 330, 0.3, 0.35);
                    errOsc.start(ctx.currentTime);
                    errOsc.stop(ctx.currentTime + 0.3);
                    break;

                case 'critical':
                    // Urgent triple beep
                    for (let i = 0; i < 3; i++) {
                        const critOsc = createBeepSound(ctx, 1000, 0.08, 0.4);
                        critOsc.start(ctx.currentTime + i * 0.12);
                        critOsc.stop(ctx.currentTime + i * 0.12 + 0.08);
                    }
                    break;
            }
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    }, [soundEnabled, getAudioContext]);

    const toggleSound = useCallback(() => {
        setSoundEnabled(prev => !prev);
    }, []);

    return {
        soundEnabled,
        setSoundEnabled,
        toggleSound,
        playSound
    };
}

// Desktop Notification API wrapper
export function useDesktopNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            console.warn('This browser does not support desktop notifications');
            return 'denied' as NotificationPermission;
        }

        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
    }, []);

    const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
        if (!('Notification' in window)) return null;
        if (Notification.permission !== 'granted') return null;

        try {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                ...options
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            // Auto close after 5 seconds
            setTimeout(() => notification.close(), 5000);

            return notification;
        } catch (error) {
            console.warn('Could not send notification:', error);
            return null;
        }
    }, []);

    return {
        permission,
        requestPermission,
        sendNotification,
        isSupported: 'Notification' in window
    };
}
