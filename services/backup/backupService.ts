import { dbService, db } from '../database/db';
import { auditLogger } from '../audit/auditLogger';
import { errorHandler } from '../error/errorHandler';

export interface BackupMetadata {
    version: string;
    timestamp: Date;
    records: {
        history: number;
        vials: number;
        wasteBins: number;
        pendingPatients: number;
        staffUsers: number;
        auditLogs: number;
        qualityControls: number;
        appointments: number;
        dosimetry: number;
    };
    checksum?: string;
}

export interface BackupData {
    metadata: BackupMetadata;
    data: any;
}

class BackupService {
    private readonly CURRENT_VERSION = '1.0.0';

    // Create a backup
    async createBackup(): Promise<BackupData | null> {
        try {
            console.log('Creating backup...');

            const data = await dbService.exportToJSON();

            const metadata: BackupMetadata = {
                version: this.CURRENT_VERSION,
                timestamp: new Date(),
                records: {
                    history: data.history.length,
                    vials: data.vials.length,
                    wasteBins: data.wasteBins.length,
                    pendingPatients: data.pendingPatients.length,
                    staffUsers: data.staffUsers.length,
                    auditLogs: data.auditLogs.length,
                    qualityControls: data.qualityControls.length,
                    appointments: data.appointments.length,
                    dosimetry: data.dosimetry.length
                },
                checksum: await this.generateChecksum(data)
            };

            const backup: BackupData = {
                metadata,
                data
            };

            await auditLogger.log('data_exported', 'system', undefined, {
                type: 'backup',
                totalRecords: Object.values(metadata.records).reduce((a, b) => a + b, 0)
            });

            console.log('✅ Backup created successfully');
            return backup;
        } catch (error) {
            errorHandler.handle(error as Error, 'high', { operation: 'createBackup' });
            return null;
        }
    }

    // Restore from backup
    async restoreBackup(backup: BackupData): Promise<boolean> {
        try {
            console.log('Restoring backup...');

            // Validate backup integrity
            const isValid = await this.validateBackup(backup);
            if (!isValid) {
                throw new Error('Invalid backup data or checksum mismatch');
            }

            // Create a backup of current data before restore (safety)
            const currentBackup = await this.createBackup();
            if (currentBackup) {
                await this.saveBackupToStorage(currentBackup, 'pre-restore-backup');
            }

            // Restore data
            const success = await dbService.importFromJSON(backup.data);

            if (success) {
                await auditLogger.log('data_imported', 'system', undefined, {
                    type: 'restore',
                    totalRecords: Object.values(backup.metadata.records).reduce((a, b) => a + b, 0),
                    backupDate: backup.metadata.timestamp
                });

                console.log('✅ Backup restored successfully');
                return true;
            }

            throw new Error('Failed to import backup data');
        } catch (error) {
            errorHandler.handle(error as Error, 'critical', { operation: 'restoreBackup' });
            return false;
        }
    }

    // Download backup as JSON file
    async downloadBackup(filename?: string): Promise<boolean> {
        try {
            const backup = await this.createBackup();
            if (!backup) throw new Error('Failed to create backup');

            const jsonString = JSON.stringify(backup, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `nukleer-tip-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('✅ Backup downloaded');
            return true;
        } catch (error) {
            errorHandler.handle(error as Error, 'high', { operation: 'downloadBackup' });
            return false;
        }
    }

    // Load backup from file
    async loadBackupFromFile(file: File): Promise<BackupData | null> {
        try {
            const text = await file.text();
            const backup = JSON.parse(text) as BackupData;

            // Validate structure
            if (!backup.metadata || !backup.data) {
                throw new Error('Invalid backup file structure');
            }

            return backup;
        } catch (error) {
            errorHandler.handle(error as Error, 'high', { operation: 'loadBackupFromFile' });
            return null;
        }
    }

    // Validate backup
    private async validateBackup(backup: BackupData): Promise<boolean> {
        try {
            // Check version compatibility
            if (!this.isVersionCompatible(backup.metadata.version)) {
                console.warn('Backup version may not be compatible');
                // Don't fail, just warn
            }

            // Validate checksum if present
            if (backup.metadata.checksum) {
                const actualChecksum = await this.generateChecksum(backup.data);
                if (actualChecksum !== backup.metadata.checksum) {
                    console.error('Checksum mismatch - backup may be corrupted');
                    return false;
                }
            }

            // Basic structure validation
            if (!backup.data.history || !backup.data.staffUsers) {
                console.error('Missing required data in backup');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Backup validation failed:', error);
            return false;
        }
    }

    // Check version compatibility
    private isVersionCompatible(version: string): boolean {
        // Simple version check - can be made more sophisticated
        const [major] = version.split('.');
        const [currentMajor] = this.CURRENT_VERSION.split('.');
        return major === currentMajor;
    }

    // Generate checksum for data integrity
    private async generateChecksum(data: any): Promise<string> {
        const jsonString = JSON.stringify(data);
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(jsonString);

        try {
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            // Fallback to simple hash if crypto not available
            return this.simpleHash(jsonString);
        }
    }

    // Simple hash fallback
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    // Auto-backup feature
    startAutoBackup(intervalHours: number = 24) {
        const intervalMs = intervalHours * 60 * 60 * 1000;

        const performAutoBackup = async () => {
            console.log('🔄 Performing auto-backup...');
            const backup = await this.createBackup();
            if (backup) {
                await this.saveBackupToStorage(backup, 'auto-backup');
                console.log('✅ Auto-backup completed');
            }
        };

        // Initial immediate backup
        performAutoBackup();

        // Schedule periodic backups
        const intervalId = setInterval(performAutoBackup, intervalMs);

        // Return cleanup function
        return () => clearInterval(intervalId);
    }

    // Save backup to localStorage (limited size)
    private async saveBackupToStorage(backup: BackupData, key: string) {
        try {
            const compressed = JSON.stringify(backup);
            localStorage.setItem(`backup_${key}`, compressed);
            localStorage.setItem(`backup_${key}_timestamp`, new Date().toISOString());
        } catch (error) {
            console.warn('Failed to save backup to localStorage (quota exceeded?)', error);
        }
    }

    // Get last auto-backup info
    getLastBackupInfo(): { timestamp: Date | null; key: string } | null {
        try {
            const timestamp = localStorage.getItem('backup_auto-backup_timestamp');
            if (timestamp) {
                return {
                    timestamp: new Date(timestamp),
                    key: 'auto-backup'
                };
            }
        } catch (error) {
            console.error('Failed to get last backup info:', error);
        }
        return null;
    }

    // Quick data snapshot for recovery
    async createQuickSnapshot(): Promise<boolean> {
        try {
            const backup = await this.createBackup();
            if (!backup) return false;

            const compressed = JSON.stringify(backup);
            sessionStorage.setItem('quick_snapshot', compressed);
            sessionStorage.setItem('quick_snapshot_time', new Date().toISOString());

            return true;
        } catch (error) {
            console.error('Failed to create quick snapshot:', error);
            return false;
        }
    }

    // Restore from quick snapshot
    async restoreQuickSnapshot(): Promise<boolean> {
        try {
            const snapshot = sessionStorage.getItem('quick_snapshot');
            if (!snapshot) {
                console.warn('No quick snapshot available');
                return false;
            }

            const backup = JSON.parse(snapshot) as BackupData;
            return await this.restoreBackup(backup);
        } catch (error) {
            errorHandler.handle(error as Error, 'high', { operation: 'restoreQuickSnapshot' });
            return false;
        }
    }
}

// Singleton instance
export const backupService = new BackupService();
