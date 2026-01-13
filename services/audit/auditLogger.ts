import { db, AuditLog } from '../database/db';
import { StaffUser } from '../../types';

export type AuditAction =
    | 'user_login'
    | 'user_logout'
    | 'patient_created'
    | 'patient_updated'
    | 'patient_deleted'
    | 'dose_prepared'
    | 'dose_injected'
    | 'vial_added'
    | 'vial_removed'
    | 'waste_disposed'
    | 'waste_bin_sealed'
    | 'qc_test_performed'
    | 'appointment_created'
    | 'appointment_updated'
    | 'appointment_cancelled'
    | 'report_generated'
    | 'data_exported'
    | 'data_imported'
    | 'settings_changed'
    | 'error_occurred';

class AuditLogger {
    private currentUser: StaffUser | null = null;

    // Set current user context
    setUser(user: StaffUser | null) {
        this.currentUser = user;
    }

    // Log an action
    async log(
        action: AuditAction,
        resource: string,
        resourceId?: string,
        changes?: Record<string, any>
    ): Promise<void> {
        try {
            const auditEntry: Omit<AuditLog, 'id'> = {
                timestamp: new Date(),
                userId: this.currentUser?.id || 'system',
                userName: this.currentUser?.name || 'System',
                action,
                resource,
                resourceId,
                changes,
                ipAddress: await this.getClientIP()
            };

            await db.auditLogs.add(auditEntry);

            // Console log in development
            if (import.meta.env.DEV) {
                console.log('[Audit]', auditEntry);
            }
        } catch (error) {
            console.error('Failed to log audit entry:', error);
        }
    }

    // Get client IP (placeholder - in real app would need backend)
    private async getClientIP(): Promise<string | undefined> {
        // In browser, we can't directly get IP
        // This would need backend support
        return undefined;
    }

    // Helper methods for common actions
    async logUserLogin(userId: string, userName: string) {
        await this.log('user_login', 'user', userId);
    }

    async logUserLogout(userId: string) {
        await this.log('user_logout', 'user', userId);
    }

    async logPatientCreated(patientId: string, patientData: any) {
        await this.log('patient_created', 'patient', patientId, {
            patientName: patientData.patientName,
            procedure: patientData.procedure
        });
    }

    async logDosePrepared(entryId: string, doseData: any) {
        await this.log('dose_prepared', 'dose_log_entry', entryId, {
            amount: doseData.amount,
            unit: doseData.unit,
            patientName: doseData.patientName,
            procedure: doseData.procedure
        });
    }

    async logDoseInjected(entryId: string, patientName: string) {
        await this.log('dose_injected', 'dose_log_entry', entryId, {
            patientName
        });
    }

    async logVialAdded(vialId: string, vialData: any) {
        await this.log('vial_added', 'vial', vialId, {
            amount: vialData.initialAmount,
            volume: vialData.initialVolumeMl,
            label: vialData.label
        });
    }

    async logWasteDisposed(binId: string, itemData: any) {
        await this.log('waste_disposed', 'waste_bin', binId, {
            activity: itemData.activity,
            unit: itemData.unit,
            source: itemData.source
        });
    }

    async logQCTest(testId: number, testData: any) {
        await this.log('qc_test_performed', 'quality_control', testId.toString(), {
            testType: testData.testType,
            isotope: testData.isotope,
            result: testData.result,
            radiochemicalPurity: testData.radiochemicalPurity
        });
    }

    async logAppointmentCreated(appointmentId: string, appointmentData: any) {
        await this.log('appointment_created', 'appointment', appointmentId, {
            patientName: appointmentData.patientName,
            scheduledTime: appointmentData.scheduledTime,
            procedure: appointmentData.procedure
        });
    }

    async logDataExported(format: string, recordCount: number) {
        await this.log('data_exported', 'system', undefined, {
            format,
            recordCount,
            timestamp: new Date()
        });
    }

    async logDataImported(recordCount: number) {
        await this.log('data_imported', 'system', undefined, {
            recordCount,
            timestamp: new Date()
        });
    }

    async logSettingsChanged(settings: Record<string, any>) {
        await this.log('settings_changed', 'system', undefined, {
            changes: settings
        });
    }

    // Query audit logs
    async getRecentLogs(limit: number = 100): Promise<AuditLog[]> {
        return db.auditLogs
            .orderBy('timestamp')
            .reverse()
            .limit(limit)
            .toArray();
    }

    async getLogsByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
        return db.auditLogs
            .where('userId')
            .equals(userId)
            .reverse()
            .limit(limit)
            .toArray();
    }

    async getLogsByAction(action: AuditAction, limit: number = 100): Promise<AuditLog[]> {
        return db.auditLogs
            .where('action')
            .equals(action)
            .reverse()
            .limit(limit)
            .toArray();
    }

    async getLogsByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
        return db.auditLogs
            .where('timestamp')
            .between(startDate, endDate, true, true)
            .toArray();
    }

    async getLogsByResource(resource: string, resourceId?: string): Promise<AuditLog[]> {
        let logs = await db.auditLogs
            .where('resource')
            .equals(resource)
            .toArray();

        if (resourceId) {
            logs = logs.filter(log => log.resourceId === resourceId);
        }

        return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    // Generate audit report
    async generateReport(startDate: Date, endDate: Date) {
        const logs = await this.getLogsByDateRange(startDate, endDate);

        // Group by action type
        const actionCounts: Record<string, number> = {};
        const userActivity: Record<string, number> = {};

        logs.forEach(log => {
            actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
            userActivity[log.userName] = (userActivity[log.userName] || 0) + 1;
        });

        return {
            totalLogs: logs.length,
            dateRange: { start: startDate, end: endDate },
            actionCounts,
            userActivity,
            recentLogs: logs.slice(0, 50)
        };
    }

    // Cleanup old audit logs
    async cleanup(daysToKeep: number = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const deletedCount = await db.auditLogs
            .where('timestamp')
            .below(cutoffDate)
            .delete();

        console.log(`Cleaned up ${deletedCount} old audit logs`);
        return deletedCount;
    }
}

// Singleton instance
export const auditLogger = new AuditLogger();
