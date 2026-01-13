
export const saveToStorage = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Error saving to storage: ${key}`, e);
    }
};

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
        console.error(`Error loading from storage: ${key}`, e);
        return defaultValue;
    }
};
