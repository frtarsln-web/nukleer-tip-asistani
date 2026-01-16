
export enum DoseUnit {
  MCI = 'mCi',
  MBQ = 'MBq'
}

export enum DoseStatus {
  PREPARED = 'Hazırlandı',
  INJECTED = 'Uygulandı'
}

export interface Isotope {
  id: string;
  name: string;
  symbol: string;
  halfLifeHours: number;
  description: string;
  color: string;
  commonProcedures: string[];
  imagingProtocols?: Record<string, string>; // Prosedür bazlı çekim protokolleri
  hasGenerator?: boolean;
  parentIsotope?: {
    symbol: string;
    halfLifeHours: number;
  };
}

export interface IsotopeGenerator {
  id: string;
  initialActivity: number;
  receivedAt: Date;
  efficiency: number; // %
  lastElutionAt?: Date; // Son sağım saati
}

export interface ColdKit {
  id: string;
  name: string;
  fullName: string;
  standardActivityMci?: number;
  standardVolumeMl?: number;
  description: string;
  preparationSteps?: string[]; // Hazırlama adımları
  prepTimerMinutes?: number; // Hazırlama süresi (dakika)
  incubationTime?: number; // İnkübasyon süresi (dakika)
  storageTemp?: string; // Saklama sıcaklığı
}

export interface Vial {
  id: string;
  initialAmount: number;
  initialVolumeMl: number; // Eklendi
  receivedAt: Date; // Sisteme girildiği an
  label: string;
  isotopeId?: string;
}


export type WasteType = 'sharp' | 'solid' | 'liquid'; // Sharp: İğne/Enjektör, Solid: Enjektör kılıfı, eldiven, Liquid: Artan sıvı

export interface WasteItem {
  id: string;
  isotopeId: string;
  activity: number; // mCi or MBq at time of disposal
  unit: DoseUnit;
  disposedAt: Date;
  source: 'vial' | 'preparation' | 'patient' | 'other';
  description?: string;
}

export interface WasteBin {
  id: string;
  name: string;
  type: WasteType;
  capacityMsievert?: number; // Optional contact dose limit
  items: WasteItem[];
  isSealed: boolean;
  sealedAt?: Date;
}

export interface AdditionalImaging {
  region: string;
  requestedAt: Date;
  status: 'pending' | 'completed';
  doseNeeded?: boolean;
  originalEntryId?: string;
  scheduledMinutes?: number;
}

export interface DoseLogEntry {
  id: string;
  queueNumber: number;
  patientName: string;
  procedure: string;
  amount: number;
  unit: DoseUnit;
  status: DoseStatus;
  timestamp: Date;
  elapsedAtWithdrawal: number;
  protocolNo?: string;
  additionalInfo?: AdditionalImaging;
  medications?: {
    oralKontrast: boolean;
    xanax: boolean;
    lasix: boolean;
  };
  bloodGlucose?: string; // Kan şekeri (mg/dL)
  preparedBy?: StaffUser;  // Hazırlayan kişi
}

export interface StaffUser {
  id: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface CalculationResult {
  currentActivity: number;
  remainingActivity: number;
  elapsedTime: number;
  unit: DoseUnit;
}

export interface PendingPatient {
  id: string;
  name: string;
  protocolNo?: string;
  procedure?: string;
  suggestedAmount?: number;
  weight?: number;
  appointmentTime?: string;
  appointmentDate?: string;
  additionalInfo?: AdditionalImaging;
}

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  description?: string;
  timestamp: Date;
  read: boolean;
  autoClose?: boolean;
}

export enum UserRole {
  TECHNICIAN = 'tekniker',
  PHYSICIST = 'fizikçi',
  NURSE = 'hemşire',
  DOCTOR = 'doktor'
}

export const ROLE_PERMISSIONS = {
  [UserRole.TECHNICIAN]: { canPrepare: true },
  [UserRole.PHYSICIST]: { canPrepare: true },
  [UserRole.NURSE]: { canPrepare: false },
  [UserRole.DOCTOR]: { canPrepare: false },
};
