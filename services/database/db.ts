import Dexie, { Table } from 'dexie';
import { DoseLogEntry, Vial, WasteBin, PendingPatient, StaffUser } from '../../types';

// Audit log tipi
export interface AuditLog {
    id?: number;
    timestamp: Date;
    userId: string;
    userName: string;
    action: string;
    resource: string;
    resourceId?: string;
    changes?: Record<string, any>;
    ipAddress?: string;
}

// Quality Control tipi
export interface QualityControl {
    id?: number;
    date: Date;
    testType: 'daily' | 'weekly' | 'monthly';
    isotope: string;
    radiochemicalPurity: number; // %
    pH?: number;
    particulate?: boolean;
    performedBy: string;
    result: 'pass' | 'fail';
    notes?: string;
}

// Appointment tipi
export interface Appointment {
    id?: string;
    patientName: string;
    patientId?: string;
    scheduledTime: Date;
    procedure: string;
    isotope: string;
    estimatedDuration: number;
    status: 'scheduled' | 'arrived' | 'in-progress' | 'completed' | 'cancelled';
    reminderSent: boolean;
    notes?: string;
    createdBy: string;
    createdAt: Date;
}

// Dosimetry tracking
export interface DosimetryRecord {
    id?: number;
    userId: string;
    userName: string;
    date: Date;
    exposure: number; // µSv
    source?: string;
    notes?: string;
}

// Database Class
export class NuclearMedicineDB extends Dexie {
    // Tables
    history!: Table<DoseLogEntry & { isotopeId: string }, string>;
    vials!: Table<Vial & { isotopeId: string }, string>;
    wasteBins!: Table<WasteBin & { isotopeId: string }, string>;
    pendingPatients!: Table<PendingPatient, string>;
    staffUsers!: Table<StaffUser, string>;
    auditLogs!: Table<AuditLog, number>;
    qualityControls!: Table<QualityControl, number>;
    appointments!: Table<Appointment, string>;
    dosimetry!: Table<DosimetryRecord, number>;

    constructor() {
        super('NuclearMedicineDB');

        this.version(1).stores({
            history: 'id, isotopeId, patientName, timestamp, status',
            vials: 'id, isotopeId, receivedAt',
            wasteBins: 'id, isotopeId, name, isSealed',
            pendingPatients: 'id, name, protocolNo, appointmentDate',
            staffUsers: 'id, name, role, createdAt',
            auditLogs: '++id, timestamp, userId, action, resource',
            qualityControls: '++id, date, isotope, testType, result',
            appointments: 'id, scheduledTime, patientName, status, isotope',
            dosimetry: '++id, userId, date'
        });
    }
}

// Single database instance
export const db = new NuclearMedicineDB();

// Database service functions
export const dbService = {
    // Migration from localStorage to IndexedDB
    async migrateFromLocalStorage(isotopeId: string) {
        try {
            // Migrate history
            const historyKey = `nt_history_${isotopeId}`;
            const historyData = localStorage.getItem(historyKey);
            if (historyData) {
                const history = JSON.parse(historyData);
                await db.history.bulkPut(history.map((h: any) => ({ ...h, isotopeId })));
            }

            // Migrate vials
            const vialsKey = `nt_vials_${isotopeId}`;
            const vialsData = localStorage.getItem(vialsKey);
            if (vialsData) {
                const vials = JSON.parse(vialsData);
                await db.vials.bulkPut(vials.map((v: any) => ({ ...v, isotopeId })));
            }

            // Migrate waste bins
            const wasteKey = `nt_waste_${isotopeId}`;
            const wasteData = localStorage.getItem(wasteKey);
            if (wasteData) {
                const waste = JSON.parse(wasteData);
                await db.wasteBins.bulkPut(waste.map((w: any) => ({ ...w, isotopeId })));
            }

            console.log(`✅ Migration completed for ${isotopeId}`);
            return true;
        } catch (error) {
            console.error('Migration error:', error);
            return false;
        }
    },

    // Get all data for an isotope
    async getIsotopeData(isotopeId: string) {
        const [history, vials, wasteBins] = await Promise.all([
            db.history.where('isotopeId').equals(isotopeId).toArray(),
            db.vials.where('isotopeId').equals(isotopeId).toArray(),
            db.wasteBins.where('isotopeId').equals(isotopeId).toArray()
        ]);
        return { history, vials, wasteBins };
    },

    // Clear all data for testing
    async clearAll() {
        await Promise.all([
            db.history.clear(),
            db.vials.clear(),
            db.wasteBins.clear(),
            db.pendingPatients.clear(),
            db.auditLogs.clear(),
            db.qualityControls.clear(),
            db.appointments.clear(),
            db.dosimetry.clear()
        ]);
    },

    // Export database to JSON
    async exportToJSON() {
        const data = {
            history: await db.history.toArray(),
            vials: await db.vials.toArray(),
            wasteBins: await db.wasteBins.toArray(),
            pendingPatients: await db.pendingPatients.toArray(),
            staffUsers: await db.staffUsers.toArray(),
            auditLogs: await db.auditLogs.toArray(),
            qualityControls: await db.qualityControls.toArray(),
            appointments: await db.appointments.toArray(),
            dosimetry: await db.dosimetry.toArray(),
            exportDate: new Date(),
            version: 1
        };
        return data;
    },

    // Import from JSON
    async importFromJSON(data: any) {
        try {
            await db.transaction('rw', [
                db.history,
                db.vials,
                db.wasteBins,
                db.pendingPatients,
                db.staffUsers,
                db.auditLogs,
                db.qualityControls,
                db.appointments,
                db.dosimetry
            ], async () => {
                if (data.history) await db.history.bulkPut(data.history);
                if (data.vials) await db.vials.bulkPut(data.vials);
                if (data.wasteBins) await db.wasteBins.bulkPut(data.wasteBins);
                if (data.pendingPatients) await db.pendingPatients.bulkPut(data.pendingPatients);
                if (data.staffUsers) await db.staffUsers.bulkPut(data.staffUsers);
                if (data.auditLogs) await db.auditLogs.bulkPut(data.auditLogs);
                if (data.qualityControls) await db.qualityControls.bulkPut(data.qualityControls);
                if (data.appointments) await db.appointments.bulkPut(data.appointments);
                if (data.dosimetry) await db.dosimetry.bulkPut(data.dosimetry);
            });
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }
};
