import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description: string;
    action: () => void;
    category: 'navigation' | 'actions' | 'data-entry' | 'system';
}

class KeyboardShortcutManager {
    private shortcuts: Map<string, KeyboardShortcut> = new Map();
    private enabled: boolean = true;

    register(shortcut: KeyboardShortcut) {
        const id = this.getShortcutId(shortcut);
        this.shortcuts.set(id, shortcut);
    }

    unregister(key: string, ctrl?: boolean, shift?: boolean, alt?: boolean) {
        const id = this.getShortcutId({ key, ctrl, shift, alt } as KeyboardShortcut);
        this.shortcuts.delete(id);
    }

    private getShortcutId(shortcut: Pick<KeyboardShortcut, 'key' | 'ctrl' | 'shift' | 'alt'>): string {
        return `${shortcut.ctrl ? 'ctrl+' : ''}${shortcut.shift ? 'shift+' : ''}${shortcut.alt ? 'alt+' : ''}${shortcut.key.toLowerCase()}`;
    }

    handleKeyPress(event: KeyboardEvent) {
        if (!this.enabled) return;

        // Don't trigger shortcuts when typing in inputs
        const target = event.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            return;
        }

        const id = this.getShortcutId({
            key: event.key,
            ctrl: event.ctrlKey || event.metaKey,
            shift: event.shiftKey,
            alt: event.altKey
        } as KeyboardShortcut);

        const shortcut = this.shortcuts.get(id);
        if (shortcut) {
            event.preventDefault();
            shortcut.action();
        }
    }

    getAll(): KeyboardShortcut[] {
        return Array.from(this.shortcuts.values());
    }

    getAllByCategory(category: KeyboardShortcut['category']): KeyboardShortcut[] {
        return this.getAll().filter(s => s.category === category);
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    isEnabled() {
        return this.enabled;
    }
}

// Singleton instance
export const keyboardManager = new KeyboardShortcutManager();

// React Hook for shortcuts
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
    useEffect(() => {
        // Register shortcuts
        shortcuts.forEach(shortcut => {
            keyboardManager.register(shortcut);
        });

        // Cleanup
        return () => {
            shortcuts.forEach(shortcut => {
                keyboardManager.unregister(shortcut.key, shortcut.ctrl, shortcut.shift, shortcut.alt);
            });
        };
    }, [shortcuts]);
};

// Global keyboard handler setup
export const setupGlobalKeyboardHandler = () => {
    const handler = (event: KeyboardEvent) => {
        keyboardManager.handleKeyPress(event);
    };

    document.addEventListener('keydown', handler);

    return () => {
        document.removeEventListener('keydown', handler);
    };
};

// Predefined shortcuts for common actions
export const createStandardShortcuts = (actions: {
    onNewPatient?: () => void;
    onQuickSearch?: () => void;
    onExport?: () => void;
    onPrint?: () => void;
    onSave?: () => void;
    onRefresh?: () => void;
    onHelp?: () => void;
    onSettings?: () => void;
}): KeyboardShortcut[] => {
    const shortcuts: KeyboardShortcut[] = [];

    if (actions.onNewPatient) {
        shortcuts.push({
            key: 'n',
            ctrl: true,
            description: 'Yeni hasta ekle',
            action: actions.onNewPatient,
            category: 'data-entry'
        });
    }

    if (actions.onQuickSearch) {
        shortcuts.push({
            key: 'k',
            ctrl: true,
            description: 'Hızlı arama',
            action: actions.onQuickSearch,
            category: 'navigation'
        });
    }

    if (actions.onExport) {
        shortcuts.push({
            key: 'e',
            ctrl: true,
            shift: true,
            description: 'Dışa aktar',
            action: actions.onExport,
            category: 'actions'
        });
    }

    if (actions.onPrint) {
        shortcuts.push({
            key: 'p',
            ctrl: true,
            description: 'Yazdır',
            action: actions.onPrint,
            category: 'actions'
        });
    }

    if (actions.onSave) {
        shortcuts.push({
            key: 's',
            ctrl: true,
            description: 'Kaydet',
            action: actions.onSave,
            category: 'actions'
        });
    }

    if (actions.onRefresh) {
        shortcuts.push({
            key: 'r',
            ctrl: true,
            description: 'Yenile',
            action: actions.onRefresh,
            category: 'navigation'
        });
    }

    if (actions.onHelp) {
        shortcuts.push({
            key: '?',
            shift: true,
            description: 'Yardım (Kısayollar)',
            action: actions.onHelp,
            category: 'system'
        });
    }

    if (actions.onSettings) {
        shortcuts.push({
            key: ',',
            ctrl: true,
            description: 'Ayarlar',
            action: actions.onSettings,
            category: 'system'
        });
    }

    return shortcuts;
};

// Format shortcut for display
export const formatShortcut = (shortcut: Pick<KeyboardShortcut, 'key' | 'ctrl' | 'shift' | 'alt'>): string => {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    parts.push(shortcut.key.toUpperCase());

    return parts.join(' + ');
};
