import { db } from '../database/db';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AppError {
    id: string;
    message: string;
    severity: ErrorSeverity;
    timestamp: Date;
    userId?: string;
    context?: Record<string, any>;
    stack?: string;
    resolved: boolean;
}

class ErrorHandler {
    private errors: AppError[] = [];
    private listeners: ((error: AppError) => void)[] = [];

    // Handle error with logging
    handle(error: Error | string, severity: ErrorSeverity = 'medium', context?: Record<string, any>) {
        const appError: AppError = {
            id: Math.random().toString(36).substr(2, 9),
            message: typeof error === 'string' ? error : error.message,
            severity,
            timestamp: new Date(),
            context,
            stack: typeof error !== 'string' ? error.stack : undefined,
            resolved: false
        };

        this.errors.push(appError);
        this.notifyListeners(appError);

        // Log to console in development
        if (import.meta.env.DEV) {
            console.error('[Error Handler]', appError);
        }

        // Log critical errors to audit
        if (severity === 'critical' || severity === 'high') {
            this.logToAudit(appError);
        }

        return appError;
    }

    // User-friendly error messages
    getUserMessage(error: AppError): string {
        const messages: Record<string, string> = {
            // Database errors
            'database_error': 'Veritabanı hatası oluştu. Lütfen tekrar deneyin.',
            'migration_error': 'Veri taşıma işlemi başarısız oldu.',
            'export_error': 'Dışa aktarma işlemi başarısız oldu.',
            'import_error': 'İçe aktarma işlemi başarısız oldu.',

            // Network errors
            'network_error': 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.',
            'timeout_error': 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.',

            // Validation errors
            'invalid_dose': 'Geçersiz doz miktarı. Lütfen kontrol edin.',
            'invalid_date': 'Geçersiz tarih bilgisi.',
            'invalid_patient': 'Hasta bilgileri eksik veya hatalı.',

            // Permission errors
            'permission_denied': 'Bu işlem için yetkiniz bulunmuyor.',
            'not_authenticated': 'Lütfen giriş yapın.',

            // Business logic errors
            'insufficient_stock': 'Yetersiz stok! Mevcut aktivite yetersiz.',
            'expired_kit': 'Kit süresi dolmuş. Kalite kontrolü yapın.',
            'dose_limit_exceeded': 'Doz limiti aşıldı!',

            // Default
            'unknown_error': 'Beklenmeyen bir hata oluştu.'
        };

        // Try to match error message to known type
        for (const [key, msg] of Object.entries(messages)) {
            if (error.message.toLowerCase().includes(key.toLowerCase())) {
                return msg;
            }
        }

        return error.severity === 'critical' || error.severity === 'high'
            ? `Kritik Hata: ${error.message}`
            : error.message;
    }

    // Log to audit system
    private async logToAudit(error: AppError) {
        try {
            await db.auditLogs.add({
                timestamp: error.timestamp,
                userId: error.userId || 'system',
                userName: 'System',
                action: 'error_occurred',
                resource: 'error_handler',
                changes: {
                    severity: error.severity,
                    message: error.message,
                    context: error.context
                }
            });
        } catch (err) {
            console.error('Failed to log error to audit:', err);
        }
    }

    // Subscribe to errors
    subscribe(listener: (error: AppError) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners(error: AppError) {
        this.listeners.forEach(listener => listener(error));
    }

    // Get all errors
    getErrors() {
        return this.errors;
    }

    // Get unresolved errors
    getUnresolvedErrors() {
        return this.errors.filter(e => !e.resolved);
    }

    // Mark error as resolved
    resolve(errorId: string) {
        const error = this.errors.find(e => e.id === errorId);
        if (error) {
            error.resolved = true;
        }
    }

    // Clear old errors
    clearOldErrors(daysOld: number = 7) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);
        this.errors = this.errors.filter(e => e.timestamp > cutoff || !e.resolved);
    }

    // Async error handler wrapper
    async handleAsync<T>(
        operation: () => Promise<T>,
        errorMessage: string,
        severity: ErrorSeverity = 'medium',
        context?: Record<string, any>
    ): Promise<T | null> {
        try {
            return await operation();
        } catch (error) {
            this.handle(error as Error, severity, { ...context, operation: errorMessage });
            return null;
        }
    }

    // Sync error handler wrapper
    handleSync<T>(
        operation: () => T,
        errorMessage: string,
        severity: ErrorSeverity = 'medium',
        context?: Record<string, any>
    ): T | null {
        try {
            return operation();
        } catch (error) {
            this.handle(error as Error, severity, { ...context, operation: errorMessage });
            return null;
        }
    }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

// Helper functions for common errors
export const errorHelpers = {
    databaseError: (context?: Record<string, any>) =>
        errorHandler.handle('database_error', 'high', context),

    validationError: (message: string, context?: Record<string, any>) =>
        errorHandler.handle(message, 'medium', context),

    permissionError: (context?: Record<string, any>) =>
        errorHandler.handle('permission_denied', 'high', context),

    networkError: (context?: Record<string, any>) =>
        errorHandler.handle('network_error', 'medium', context),

    criticalError: (message: string, context?: Record<string, any>) =>
        errorHandler.handle(message, 'critical', context)
};
