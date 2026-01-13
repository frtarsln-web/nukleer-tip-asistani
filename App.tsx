
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { IsotopeSelector } from './components/IsotopeSelector';
import { StockManager } from './components/StockManager';
import { DoseDispenser } from './components/DoseDispenser';
import { ActivityLog } from './components/ActivityLog';
import { DashboardStats } from './components/DashboardStats';
import { IsotopeGenerator, DoseUnit, Isotope, DoseLogEntry, DoseStatus, Vial, PendingPatient, AdditionalImaging, WasteBin, WasteItem, StaffUser } from './types';
import { ISOTOPES } from './constants';
import { calculateDecay, formatActivity, getVialCurrentActivity } from './utils/physics';
import { GeneratorManager } from './components/GeneratorManager';
import { KitPreparation } from './components/KitPreparation';
import { NotificationCenter } from './components/NotificationCenter';
import { RoleSelector } from './components/RoleSelector';
import { RegionHighlight } from './components/RegionHighlight';
import { WasteManager } from './components/WasteManager';
import { ReportingManager } from './components/ReportingManager';
import { PatientWaitingTracker } from './components/PatientWaitingTracker';
import { UserLogin } from './components/UserLogin';
import { Analytics } from './components/Analytics';
import { DoctorDashboard } from './components/DoctorDashboard';
import { AdvancedFilters } from './components/AdvancedFilters';
import { ThemeToggle } from './components/ThemeToggle';
import { ReportDashboard } from './components/ReportDashboard';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { NuclearMedicineInfo } from './components/NuclearMedicineInfo';
import { NuclearMedicineHandbook } from './components/NuclearMedicineHandbook';
import { SettingsPanel } from './components/SettingsPanel';
import { AppointmentScheduler } from './components/AppointmentScheduler';
import { PatientArchive } from './components/PatientArchive';
import { QualityControl } from './components/QualityControl';
import { PharmacoKinetics } from './components/PharmacoKinetics';
import { EnhancedDashboard } from './components/EnhancedDashboard';
import { AIAssistant } from './components/AIAssistant';
import { MobileNav } from './components/MobileNav';
import { ConfirmModal } from './components/ConfirmModal';
import { saveToStorage, loadFromStorage } from './utils/storage';
import { printReport } from './utils/export-enhanced';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AppNotification, NotificationType, UserRole, ROLE_PERMISSIONS } from './types';
import { useNotificationSound, useDesktopNotifications } from './hooks/useNotificationSound';
// Yeni bileşenler
import { AppointmentManager } from './components/AppointmentManager';
import { StatisticsDashboard } from './components/StatisticsDashboard';
import { ToastProvider, useToast } from './components/ToastProvider';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { NotificationHistory } from './components/NotificationHistory';
import { PediatricDoseCalculator } from './components/PediatricDoseCalculator';
import { PatientTimeline } from './components/PatientTimeline';
import { EnhancedWasteTracker } from './components/EnhancedWasteTracker';
import { QuickActions } from './components/QuickActions';
import { RadiationSafetyPanel } from './components/RadiationSafetyPanel';
import { AuditLog } from './components/AuditLog';
import { ClinicalProtocols } from './components/ClinicalProtocols';
import { PhysicistDashboard } from './components/PhysicistDashboard';
import { DailyControlForm } from './components/DailyControlForm';
import { FDGOrderPlanner } from './components/FDGOrderPlanner';
import { FDGActivityTracker } from './components/FDGActivityTracker';

const STORAGE_KEYS = {
  ISOTOPE: 'nt_selected_isotope',
  GLOBAL_UNIT: 'nt_unit',
  USER_ROLE: 'nt_user_role',
  PENDING_PATIENTS: 'nt_global_patients',
  DOCTOR_NOTIFICATIONS: 'nt_doctor_notifications',
  STAFF_USERS: 'nt_staff_users',
  CURRENT_USER: 'nt_current_user',
  // Shared state for real-time doctor-technician sync
  PATIENTS_IN_ROOMS: 'nt_patients_in_rooms',
  PATIENTS_IN_IMAGING: 'nt_patients_in_imaging',
  ADDITIONAL_IMAGING: 'nt_additional_imaging'
};

const getDynamicKeys = (isoId: string) => ({
  VIALS: `nt_vials_${isoId}`,
  HISTORY: `nt_history_${isoId}`,
  UNIT: `nt_unit_${isoId}`,
  GENERATOR: `nt_gen_${isoId}`,
  WASTE_BINS: `nt_waste_${isoId}`
});

const App: React.FC = () => {
  const [selectedIsotope, setSelectedIsotope] = useState<Isotope>(() => loadFromStorage(STORAGE_KEYS.ISOTOPE, ISOTOPES[0]));
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => loadFromStorage(STORAGE_KEYS.CURRENT_USER, null));
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => loadFromStorage(STORAGE_KEYS.STAFF_USERS, []));
  const [isWorkspaceActive, setIsWorkspaceActive] = useState(false);

  // User role from current user
  const userRole = currentUser?.role || null;

  // Use a ref to store current isotope for lazy loading helper
  const isotopeId = selectedIsotope.id;
  const currentKeys = useMemo(() => getDynamicKeys(isotopeId), [isotopeId]);

  const [unit, setUnit] = useState<DoseUnit>(() => loadFromStorage(currentKeys.UNIT, DoseUnit.MCI));
  const [vials, setVials] = useState<Vial[]>(() => loadFromStorage(currentKeys.VIALS, []));
  const [history, setHistory] = useState<DoseLogEntry[]>(() => loadFromStorage(currentKeys.HISTORY, []));
  const [wasteBins, setWasteBins] = useState<WasteBin[]>(() => loadFromStorage(currentKeys.WASTE_BINS, []));
  const [generator, setGenerator] = useState<IsotopeGenerator | null>(() => loadFromStorage(currentKeys.GENERATOR, null));

  // Update state when isotope changes
  useEffect(() => {
    setUnit(loadFromStorage(currentKeys.UNIT, DoseUnit.MCI));
    setVials(loadFromStorage(currentKeys.VIALS, []));
    setHistory(loadFromStorage(currentKeys.HISTORY, []));
    setWasteBins(loadFromStorage(currentKeys.WASTE_BINS, []));
    setGenerator(loadFromStorage(currentKeys.GENERATOR, null));
  }, [isotopeId, currentKeys]);

  const [isExploding, setIsExploding] = useState(false);
  const [newVialInput, setNewVialInput] = useState<string>("");
  const [newVialVolume, setNewVialVolume] = useState<string>("");
  const [pendingPatients, setPendingPatients] = useState<PendingPatient[]>(() => loadFromStorage(STORAGE_KEYS.PENDING_PATIENTS, []));
  const [patientName, setPatientName] = useState("");
  const [selectedProcedure, setSelectedProcedure] = useState(selectedIsotope.commonProcedures[0]);
  const [drawAmount, setDrawAmount] = useState<number>(5);
  const [patientWeight, setPatientWeight] = useState<string>("");
  const [doseRatio, setDoseRatio] = useState<number>(0.131);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [now, setNow] = useState(new Date());

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<DoseLogEntry[]>([]);
  const [filteredPending, setFilteredPending] = useState<PendingPatient[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showNuclearInfo, setShowNuclearInfo] = useState(false);
  const [showHandbook, setShowHandbook] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showQC, setShowQC] = useState(false);
  const [showPharma, setShowPharma] = useState(false);
  const [showEnhancedDashboard, setShowEnhancedDashboard] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
  // Yeni modal state'leri
  const [showNotificationHistory, setShowNotificationHistory] = useState(false);
  const [showPatientTimeline, setShowPatientTimeline] = useState(false);
  const [showPediatricCalc, setShowPediatricCalc] = useState(false);
  const [showEnhancedWaste, setShowEnhancedWaste] = useState(false);
  const [showRadiationSafety, setShowRadiationSafety] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showClinicalProtocols, setShowClinicalProtocols] = useState(false);
  const [showDailyControl, setShowDailyControl] = useState(false);
  const [showFDGOrderPlanner, setShowFDGOrderPlanner] = useState(false);
  const [showFDGActivityTracker, setShowFDGActivityTracker] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared state for patient imaging tracking - Enjeksiyon Odaları (persisted for cross-tab sync)
  const [patientsInRooms, setPatientsInRooms] = useState<Record<string, { roomId: string; startTime: Date; patientId: string; patientName: string; procedure?: string; isotopeId?: string }>>(
    () => loadFromStorage(STORAGE_KEYS.PATIENTS_IN_ROOMS, {})
  );
  const [patientsInImaging, setPatientsInImaging] = useState<Record<string, { startTime: Date }>>(
    () => loadFromStorage(STORAGE_KEYS.PATIENTS_IN_IMAGING, {})
  );
  const [additionalImagingPatients, setAdditionalImagingPatients] = useState<Record<string, { region: string; addedAt: Date; scheduledMinutes: number }>>(
    () => loadFromStorage(STORAGE_KEYS.ADDITIONAL_IMAGING, {})
  );

  // Notification system hooks
  const { soundEnabled, toggleSound, playSound } = useNotificationSound();
  const { permission: notifPermission, requestPermission, sendNotification } = useDesktopNotifications();
  const [lowStockAlerted, setLowStockAlerted] = useState(false);
  const LOW_STOCK_THRESHOLD = 5; // mCi threshold for low stock alert

  // Apply saved theme on app load
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('nt_app_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const theme = settings.theme || 'dark';

        const applyTheme = (isDark: boolean) => {
          if (isDark) {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            document.documentElement.style.colorScheme = 'light';
          }
        };

        if (theme === 'dark') {
          applyTheme(true);
        } else if (theme === 'light') {
          applyTheme(false);
        } else {
          // System preference
          applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
      }
    } catch {
      // ignore errors
    }
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize and filter data based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHistory(history);
    } else {
      const query = searchQuery.toLowerCase().replace(/[ıİ]/g, c => c === 'ı' ? 'i' : 'i');
      setFilteredHistory(history.filter(h =>
        h.patientName.toLowerCase().replace(/[ıİ]/g, c => c === 'ı' ? 'i' : 'i').includes(query) ||
        (h.protocolNo && h.protocolNo.toLowerCase().includes(query))
      ));
    }
  }, [history, searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPending(pendingPatients);
    } else {
      const query = searchQuery.toLowerCase().replace(/[ıİ]/g, c => c === 'ı' ? 'i' : 'i');
      setFilteredPending(pendingPatients.filter(p =>
        p.name.toLowerCase().replace(/[ıİ]/g, c => c === 'ı' ? 'i' : 'i').includes(query) ||
        (p.protocolNo && p.protocolNo.toLowerCase().includes(query))
      ));
    }
  }, [pendingPatients, searchQuery]);

  // Doktor/Hemşire için bildirimleri localStorage'dan yükle
  useEffect(() => {
    if (userRole === UserRole.DOCTOR || userRole === UserRole.NURSE) {
      const loadDoctorNotifications = () => {
        const doctorNotifs = loadFromStorage<AppNotification[]>(STORAGE_KEYS.DOCTOR_NOTIFICATIONS, []);
        setNotifications(doctorNotifs);
      };
      loadDoctorNotifications();
      // Her 5 saniyede bir kontrol et (yeni bildirimler için)
      const interval = setInterval(loadDoctorNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const addNotification = useCallback((message: string, type: NotificationType = 'info', description?: string, autoClose = true) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{
      id,
      type,
      message,
      description,
      timestamp: new Date(),
      read: false,
      autoClose
    }, ...prev]);
  }, []);

  const closeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    // Doktor/Hemşire için localStorage'dan da sil
    if (userRole === UserRole.DOCTOR || userRole === UserRole.NURSE) {
      const doctorNotifs = loadFromStorage<AppNotification[]>(STORAGE_KEYS.DOCTOR_NOTIFICATIONS, []);
      saveToStorage(STORAGE_KEYS.DOCTOR_NOTIFICATIONS, doctorNotifs.filter(n => n.id !== id));
    }
  }, [userRole]);

  // Persistence
  useEffect(() => { saveToStorage(currentKeys.VIALS, vials); }, [vials, currentKeys]);
  useEffect(() => { saveToStorage(currentKeys.HISTORY, history); }, [history, currentKeys]);
  useEffect(() => { saveToStorage(currentKeys.WASTE_BINS, wasteBins); }, [wasteBins, currentKeys]);
  useEffect(() => { saveToStorage(currentKeys.GENERATOR, generator); }, [generator, currentKeys]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.USER_ROLE, userRole); }, [userRole]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PENDING_PATIENTS, pendingPatients); }, [pendingPatients]);

  // Shared state persistence for cross-tab doctor-technician sync
  useEffect(() => { saveToStorage(STORAGE_KEYS.PATIENTS_IN_ROOMS, patientsInRooms); }, [patientsInRooms]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PATIENTS_IN_IMAGING, patientsInImaging); }, [patientsInImaging]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.ADDITIONAL_IMAGING, additionalImagingPatients); }, [additionalImagingPatients]);

  // Cross-tab sync listener - Doctor sees changes from Technician in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;

      try {
        if (e.key === STORAGE_KEYS.PATIENTS_IN_ROOMS) {
          const data = JSON.parse(e.newValue);
          setPatientsInRooms(data);
        } else if (e.key === STORAGE_KEYS.PATIENTS_IN_IMAGING) {
          const data = JSON.parse(e.newValue);
          setPatientsInImaging(data);
        } else if (e.key === STORAGE_KEYS.ADDITIONAL_IMAGING) {
          const data = JSON.parse(e.newValue);
          setAdditionalImagingPatients(data);
        } else if (e.key === STORAGE_KEYS.DOCTOR_NOTIFICATIONS) {
          // Doctor receives new notifications from technician
          if (userRole === UserRole.DOCTOR || userRole === UserRole.NURSE) {
            const data = JSON.parse(e.newValue) as AppNotification[];
            setNotifications(data);
            // Play notification sound for new notifications
            if (data.length > notifications.length) {
              playSound('info');
            }
          }
        } else if (e.key === currentKeys.HISTORY) {
          const data = JSON.parse(e.newValue);
          setHistory(data);
        }
      } catch (error) {
        console.error('Error parsing storage event:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userRole, notifications.length, playSound, currentKeys.HISTORY]);

  const canPrepare = userRole ? ROLE_PERMISSIONS[userRole].canPrepare : false;

  const handleAddGenerator = (activity: number, efficiency: number) => {
    if (activity <= 0) {
      setGenerator(null);
      return;
    }
    const newGen: IsotopeGenerator = {
      id: Math.random().toString(36).substr(2, 9),
      initialActivity: activity,
      receivedAt: new Date(),
      efficiency
    };
    setGenerator(newGen);
    triggerExplosion();
  };

  const handleElution = (amount: number, volume: number) => {
    if (!amount || !volume) return;
    const newVial: Vial = {
      id: Math.random().toString(36).substr(2, 9),
      initialAmount: amount,
      initialVolumeMl: volume,
      receivedAt: new Date(),
      label: `Sağım #${vials.length + 1}`
    };
    setVials(prev => [newVial, ...prev]);
    if (generator) {
      setGenerator({ ...generator, lastElutionAt: new Date() });
    }
    addNotification('Sağım Başarılı', 'success', `${amount} ${unit} Tc-99m elde edildi.`);
    triggerExplosion();
  };

  const handleRemoveGenerator = useCallback(() => {
    // Tüm sağım flokonlarını atığa taşı
    const sagimVials = vials.filter(v => v.label.startsWith('Sağım'));

    if (sagimVials.length > 0) {
      const currentTime = new Date();
      const wasteItems: WasteItem[] = sagimVials.map(vial => {
        const hoursSinceReceived = (currentTime.getTime() - new Date(vial.receivedAt).getTime()) / (1000 * 60 * 60);
        const currentActivity = vial.initialAmount * Math.pow(0.5, hoursSinceReceived / selectedIsotope.halfLifeHours);

        return {
          id: Math.random().toString(36).substr(2, 9),
          isotopeId: selectedIsotope.id,
          activity: Math.max(0.01, currentActivity),
          unit: unit,
          disposedAt: currentTime,
          source: 'vial' as const,
          description: `${vial.label} - Jeneratör değişimi`
        };
      });

      // Atık kutusuna ekle
      setWasteBins(prev => {
        const sicakOdaBin = prev.find(b => b.name === 'Sıcak Oda');
        if (sicakOdaBin) {
          return prev.map(b =>
            b.name === 'Sıcak Oda'
              ? { ...b, items: [...b.items, ...wasteItems] }
              : b
          );
        } else {
          const newBin: WasteBin = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'Sıcak Oda',
            type: 'solid' as const,
            items: wasteItems,
            isSealed: false
          };
          return [...prev, newBin];
        }
      });

      // Sağım flokonlarını stoktan kaldır
      setVials(prev => prev.filter(v => !v.label.startsWith('Sağım')));

      addNotification('Sağım Flokonları Atığa Taşındı', 'info', `${sagimVials.length} adet sağım flokonu atık yönetimine taşındı.`);
    }

    setGenerator(null);
    saveToStorage(currentKeys.GENERATOR, null);
    addNotification('Jeneratör Kaldırıldı', 'info', 'Yeni jeneratör için ilk sağım bilgilerini girebilirsiniz.');
  }, [currentKeys, addNotification, vials, selectedIsotope.halfLifeHours, selectedIsotope.id, unit]);

  const handlePrepareKit = (newVial: Vial) => {
    setVials(prev => [newVial, ...prev]);
    addNotification('Kit Hazırlandı', 'success', `${newVial.label} envantere eklendi.`);
    triggerExplosion();
  };

  // Kit hazırlamada kullanılan aktiviteyi sağım vialinden düş
  const handleConsumeFromVials = (amount: number) => {
    const currentNow = new Date();
    setVials(prevVials => {
      let remaining = amount;
      const updatedVials = prevVials.map(vial => {
        if (remaining <= 0) return vial;

        // Sağım vialleri için (label Sağım ile başlıyorsa)
        if (vial.label.startsWith('Sağım')) {
          const hoursPassed = (currentNow.getTime() - new Date(vial.receivedAt).getTime()) / (1000 * 60 * 60);
          const currentActivity = vial.initialAmount * Math.pow(0.5, hoursPassed / selectedIsotope.halfLifeHours);

          if (currentActivity > 0) {
            const toConsume = Math.min(remaining, currentActivity);
            remaining -= toConsume;

            // Vial'ın initialAmount'unu orantılı olarak azalt
            const ratio = (currentActivity - toConsume) / currentActivity;
            return {
              ...vial,
              initialAmount: vial.initialAmount * ratio
            };
          }
        }
        return vial;
      });
      return updatedVials;
    });
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSelectedProcedure(selectedIsotope.commonProcedures[0]);
    if (selectedIsotope.id === 'f18') setDoseRatio(0.131);
    else if (selectedIsotope.id === 'tc99m') setDoseRatio(0.25);
    else if (selectedIsotope.id === 'ga68') setDoseRatio(0.05);
    else if (selectedIsotope.id === 'i131') setDoseRatio(0.1);
    else if (selectedIsotope.id === 'lu177') setDoseRatio(2.5);
  }, [selectedIsotope]);

  const triggerExplosion = useCallback(() => {
    setIsExploding(true);
    setTimeout(() => setIsExploding(false), 1200);
  }, []);

  const currentTotalActivity = useMemo(() => {
    // Vial'ların initialAmount'u doz çekildiğinde güncelleniyor,
    // bu yüzden sadece mevcut vial aktivitelerini toplamak yeterli
    // StockManager'da 0.1'den küçük vial'lar gizleniyor, toplam hesaplamada da aynı eşik kullanılmalı
    return vials.reduce((sum, vial) => {
      const activity = getVialCurrentActivity(vial, selectedIsotope.halfLifeHours, now);
      return activity >= 0.1 ? sum + activity : sum;
    }, 0);
  }, [vials, selectedIsotope.halfLifeHours, now]);

  // Low stock alert detection - Must be after currentTotalActivity is defined
  useEffect(() => {
    if (!isWorkspaceActive) return;

    // Convert to mCi if in MBq
    const stockInMci = unit === DoseUnit.MBQ ? currentTotalActivity / 37 : currentTotalActivity;

    if (stockInMci > 0 && stockInMci <= LOW_STOCK_THRESHOLD && !lowStockAlerted) {
      playSound('warning');
      addNotification(
        '⚠️ Düşük Stok Uyarısı',
        'warning',
        `${selectedIsotope.name} stoğu kritik seviyede: ${stockInMci.toFixed(1)} mCi`,
        false
      );
      sendNotification('⚠️ Düşük Stok Uyarısı', {
        body: `${selectedIsotope.name} stoğu kritik seviyede!`,
        tag: 'low-stock'
      });
      setLowStockAlerted(true);
    } else if (stockInMci > LOW_STOCK_THRESHOLD) {
      setLowStockAlerted(false);
    }
  }, [currentTotalActivity, unit, isWorkspaceActive, selectedIsotope, lowStockAlerted, playSound, sendNotification, addNotification]);

  const currentTotalVolume = useMemo(() => {
    return vials.reduce((sum, v) => sum + v.initialVolumeMl, 0);
  }, [vials]);

  const currentConcentration = useMemo(() => {
    if (currentTotalVolume <= 0) return 0;
    return currentTotalActivity / currentTotalVolume;
  }, [currentTotalActivity, currentTotalVolume]);

  const requiredVolume = useMemo(() => {
    if (currentConcentration < 0.001 || drawAmount <= 0) return 0;
    const vol = drawAmount / currentConcentration;
    return vol > 1000 ? 0 : vol; // Cap at 1L to avoid UI glitches with near-zero concentration
  }, [drawAmount, currentConcentration]);

  const recommendedDose = useMemo(() => {
    const weight = parseFloat(patientWeight);
    if (isNaN(weight) || weight <= 0) return 0;
    return weight * doseRatio;
  }, [patientWeight, doseRatio]);

  const stats = useMemo(() => {
    const injected = history.filter(h => h.status === DoseStatus.INJECTED);
    const prepared = history.filter(h => h.status === DoseStatus.PREPARED);
    return {
      injectedCount: injected.length,
      preparedCount: prepared.length,
      totalInjected: injected.reduce((sum, h) => {
        // Handle unit conversion if history was recorded in a different unit than current
        let amount = h.amount;
        if (h.unit !== unit) {
          if (unit === DoseUnit.MBQ) amount = h.amount * 37;
          else amount = h.amount / 37;
        }
        return sum + amount;
      }, 0)
    };
  }, [history, unit]);

  // Tüm PET izotoplarının flokonlarını yükle - DoctorDashboard için
  const allPETVials = useMemo(() => {
    const PET_ISOTOPE_IDS = ['f18', 'ga68'];
    const allVials: (Vial & { currentActivity: number; calibrationTime: Date; isotopeId: string })[] = [];

    PET_ISOTOPE_IDS.forEach(isoId => {
      let sourceVials: Vial[] = [];
      const isotope = ISOTOPES.find(i => i.id === isoId);

      // Eğer şu an seçili izotop ise state'den al (en güncel veri)
      // Değilse storage'dan al
      if (isoId === selectedIsotope.id) {
        sourceVials = vials;
      } else {
        const keys = getDynamicKeys(isoId);
        sourceVials = loadFromStorage(keys.VIALS, []);
      }

      sourceVials.forEach(vial => {
        let activity = getVialCurrentActivity(vial, isotope?.halfLifeHours || 1.83, now);

        // Güvenlik kontrolleri
        if (isNaN(activity) || !isFinite(activity)) activity = 0;
        if (activity < 0) activity = 0;

        // Filtreyi kaldırdık - her flakonu göster (debug için)
        allVials.push({
          ...vial,
          isotopeId: isoId,
          currentActivity: activity,
          calibrationTime: new Date(vial.receivedAt)
        });
      });
    });

    return allVials;
  }, [now, vials, selectedIsotope.id]);

  const handleAddVial = () => {
    const amount = parseFloat(newVialInput);
    const volume = parseFloat(newVialVolume);
    if (isNaN(amount) || amount <= 0 || isNaN(volume) || volume <= 0) {
      alert("Lütfen geçerli doz ve hacim bilgisi girin.");
      return;
    }
    const newVial: Vial = {
      id: Math.random().toString(36).substr(2, 9),
      initialAmount: amount,
      initialVolumeMl: volume,
      receivedAt: new Date(),
      label: `Flakon #${vials.length + 1}`
    };
    setVials(prev => [...prev, newVial]);
    addNotification('Envanter Güncellendi', 'success', `${amount} ${unit} yeni flakon eklendi.`);
    setNewVialInput("");
    setNewVialVolume("");
    triggerExplosion();
  };

  // Automated Alerts
  useEffect(() => {
    const checkAlerts = () => {
      // 1. Low Stock Alert
      const threshold = unit === DoseUnit.MCI ? 5 : 185;
      if (isWorkspaceActive && currentTotalActivity > 0 && currentTotalActivity < threshold) {
        if (!notifications.some(n => n.message.includes('Düşük Stok') && (now.getTime() - n.timestamp.getTime()) < 3600000)) {
          addNotification('Düşük Stok Uyarısı', 'warning', `${selectedIsotope.name} stoğu ${currentTotalActivity.toFixed(2)} ${unit} seviyesine düştü.`, false);
        }
      }

      // 2. Kit Expiry Alert (Check for vials older than 6 hours)
      vials.forEach(vial => {
        const hoursDelta = (now.getTime() - new Date(vial.receivedAt).getTime()) / (1000 * 60 * 60);
        if (hoursDelta > 6 && !notifications.some(n => n.message.includes(vial.label) && n.message.includes('Süresi Doldu'))) {
          addNotification('Kit Süresi Doldu', 'error', `${vial.label} hazırlanalı 6 saati geçti. Lütfen kalite kontrolünü tazeleyin.`, false);
        }
      });

      // 3. Generator Elution Reminder (If it's a generator isotope and not eluted today)
      if (selectedIsotope.hasGenerator && generator) {
        const lastElution = generator.lastElutionAt ? new Date(generator.lastElutionAt) : new Date(generator.receivedAt);
        const hoursSinceElution = (now.getTime() - lastElution.getTime()) / (1000 * 60 * 60);
        if (hoursSinceElution > 24 && !notifications.some(n => n.message.includes('Jeneratör Sağımı') && (now.getTime() - n.timestamp.getTime()) < 3600000)) {
          addNotification('Jeneratör Sağımı Gecikti', 'warning', 'Jeneratör son 24 saattir sağılmadı.', false);
        }
      }
    };

    const alertTimer = setInterval(checkAlerts, 60000); // Check every minute
    return () => clearInterval(alertTimer);
  }, [currentTotalActivity, vials, generator, selectedIsotope, isWorkspaceActive, notifications, addNotification, now, unit]);

  // Ek Çekim Countdown Notification
  useEffect(() => {
    const checkEkCekimReady = () => {
      pendingPatients.forEach(p => {
        if (p.additionalInfo && p.additionalInfo.status === 'pending') {
          const diffMs = (new Date(p.additionalInfo.requestedAt).getTime() + 3600000) - now.getTime();
          // If just turned ready (within the last minute of checking)
          if (diffMs <= 0 && diffMs > -60000) {
            const notifKey = `ready-${p.id}`;
            if (!notifications.some(n => n.id === notifKey)) {
              addNotification('Ek Çekim Hazır', 'info', `${p.name} için 1 saatlik bekleme süresi doldu.`, false);
            }
          }
        }
      });
    };
    checkEkCekimReady();
  }, [now, pendingPatients, addNotification]);

  // Randevu Hatırlatıcı Sistemi
  useEffect(() => {
    const REMINDER_MINUTES = 15; // 15 dk önceden hatırlat
    const STORAGE_KEY = 'nt_appointments';
    const REMINDED_KEY = 'nt_reminded_appointments';

    const checkAppointments = () => {
      try {
        const storedAppointments = localStorage.getItem(STORAGE_KEY);
        const remindedIds = JSON.parse(localStorage.getItem(REMINDED_KEY) || '[]') as string[];

        if (!storedAppointments) return;

        const appointments = JSON.parse(storedAppointments) as Array<{
          id: string;
          patientName: string;
          procedure: string;
          appointmentDate: string;
          appointmentTime: string;
          status: string;
        }>;

        const nowTime = new Date();

        appointments.forEach(apt => {
          if (apt.status !== 'scheduled') return;
          if (remindedIds.includes(apt.id)) return;

          // Parse appointment time
          const [hours, minutes] = apt.appointmentTime.split(':').map(Number);
          const aptDate = new Date(apt.appointmentDate);
          aptDate.setHours(hours, minutes, 0, 0);

          const diffMs = aptDate.getTime() - nowTime.getTime();
          const diffMinutes = diffMs / (1000 * 60);

          // 15 dakika veya daha az kaldıysa uyar
          if (diffMinutes > 0 && diffMinutes <= REMINDER_MINUTES) {
            playSound('warning');
            addNotification(
              '📅 Randevu Hatırlatması',
              'info',
              `${apt.patientName} - ${apt.procedure} randevusu ${Math.round(diffMinutes)} dakika sonra!`,
              false
            );
            sendNotification('📅 Randevu Yaklaşıyor', {
              body: `${apt.patientName} - ${apt.procedure} (${apt.appointmentTime})`,
              tag: `apt-${apt.id}`
            });

            // Mark as reminded
            localStorage.setItem(REMINDED_KEY, JSON.stringify([...remindedIds, apt.id]));
          }
        });

        // Clean old reminded IDs (older than today)
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(REMINDED_KEY, JSON.stringify(
          remindedIds.filter(id => appointments.find(a => a.id === id && a.appointmentDate === today))
        ));
      } catch {
        // Ignore errors
      }
    };

    checkAppointments();
    const intervalId = setInterval(checkAppointments, 60000); // Her dakika kontrol et
    return () => clearInterval(intervalId);
  }, [now, playSound, addNotification, sendNotification]);

  const handleWithdrawDose = (patientId?: string) => {
    const patient = pendingPatients.find(p => p.id === patientId) || pendingPatients.find(p => p.name === patientName);

    // Ek çekim ama doz gerekmiyor - stok kontrolü yapma
    const isNoDoseAdditionalImaging = patient?.additionalInfo && patient.additionalInfo.doseNeeded === false;

    if (!isNoDoseAdditionalImaging) {
      // Normal doz çekimi için kontroller
      if (drawAmount <= 0) {
        alert("Lütfen geçerli bir doz girin.");
        return;
      }
      if (drawAmount > currentTotalActivity) {
        alert("Hata: Toplam stok yetersiz!");
        return;
      }
      // Basic volume check (sum of all vials vs requiredVolume)
      if (requiredVolume > currentTotalVolume) {
        alert("Hata: Stoktaki toplam hacim bu doz için yetersiz!");
        return;
      }

      // === KİT KULLANIM UYARISI ===
      // Hangi vial'ların kullanılacağını kontrol et
      const vialsToCheck = [...vials].sort((a, b) => {
        const aCurrent = getVialCurrentActivity(a, selectedIsotope.halfLifeHours, now);
        const bCurrent = getVialCurrentActivity(b, selectedIsotope.halfLifeHours, now);
        return bCurrent - aCurrent; // En yüksek aktiviteden başla
      });

      let remainingCheck = drawAmount;
      const kitsToUse: string[] = [];

      for (const vial of vialsToCheck) {
        if (remainingCheck <= 0) break;
        const current = getVialCurrentActivity(vial, selectedIsotope.halfLifeHours, now);

        if (current > 0.01) {
          // Kit kontrolü - label'da "Lot:" veya kit isimleri varsa
          const isKit = vial.label && (
            vial.label.includes('Lot:') ||
            vial.label.includes('MDP') ||
            vial.label.includes('MIBI') ||
            vial.label.includes('MAA') ||
            vial.label.includes('DTPA') ||
            vial.label.includes('DMSA') ||
            vial.label.includes('MAG3') ||
            vial.label.includes('HDP')
          );

          if (isKit && !kitsToUse.includes(vial.label)) {
            kitsToUse.push(vial.label);
          }

          if (current >= remainingCheck) {
            remainingCheck = 0;
          } else {
            remainingCheck -= current;
          }
        }
      }

      // Kit kullanılacaksa uyarı göster
      if (kitsToUse.length > 0) {
        const kitNames = kitsToUse.join('\n• ');
        const confirmMessage =
          `⚠️ SOĞUK KİT KULLANIMI\n\n` +
          `Aşağıdaki hazırlanmış kit(ler) kullanılacak:\n\n` +
          `• ${kitNames}\n\n` +
          `Hasta: ${patientName || patient?.name || 'Hasta'}\n` +
          `Doz: ${drawAmount} ${unit}\n` +
          `Prosedür: ${selectedProcedure}\n\n` +
          `Bu kiti kullanmak istediğinizden emin misiniz?`;

        if (!confirm(confirmMessage)) {
          return; // Kullanıcı iptal etti
        }
      }
    }

    const newEntry: DoseLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      queueNumber: history.length + 1,
      patientName: patientName || `Hasta ${history.length + 1}`,
      protocolNo: patient?.protocolNo,
      procedure: selectedProcedure,
      amount: isNoDoseAdditionalImaging ? 0 : drawAmount,
      unit: unit,
      status: DoseStatus.PREPARED,
      timestamp: new Date(),
      elapsedAtWithdrawal: 0,
      additionalInfo: patient?.additionalInfo,
      preparedBy: currentUser || undefined  // Hazırlayan kişi
    };

    setHistory(prev => [newEntry, ...prev]);

    // If it was an ek çekim, just remove from pendingPatients (done below via filter), but DO NOT mark as completed yet.
    // It will be marked completed only when imaging is finished.
    // We KEEP it in additionalImagingPatients so it shows in the dashboard.

    const notifMessage = isNoDoseAdditionalImaging
      ? `${patient?.additionalInfo?.region} ek çekimi tamamlandı (ek doz yok).`
      : `${drawAmount} ${unit} ${selectedProcedure} için çekildi.`;
    addNotification(isNoDoseAdditionalImaging ? 'Ek Çekim Tamamlandı' : 'Doz Hazırlandı', 'success', notifMessage);

    // Doktor ekranına bildirim gönder
    const doctorNotification: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      type: isNoDoseAdditionalImaging ? 'info' : 'success',
      message: isNoDoseAdditionalImaging
        ? `${patientName || patient?.name} - Ek Çekim Tamamlandı`
        : `${patientName || patient?.name} - Çekim Hazır`,
      description: isNoDoseAdditionalImaging
        ? `${patient?.additionalInfo?.region} bölgesi ek çekimi tamamlandı.`
        : `${selectedProcedure} - ${drawAmount} ${unit}`,
      timestamp: new Date(),
      read: false,
      autoClose: false
    };
    const existingDoctorNotifs = loadFromStorage<AppNotification[]>(STORAGE_KEYS.DOCTOR_NOTIFICATIONS, []);
    saveToStorage(STORAGE_KEYS.DOCTOR_NOTIFICATIONS, [doctorNotification, ...existingDoctorNotifs]);

    // Enjektör ve kanül atığını otomatik olarak "Sıcak Oda" kutusuna gönder
    if (!isNoDoseAdditionalImaging && drawAmount > 0) {
      // Enjektörde ve kanülde kalan aktivite (genellikle dozun %5-10'u)
      const residualActivity = drawAmount * 0.05; // %5 varsayılan

      // "Sıcak Oda" kutusunu bul veya oluştur
      let sicakOdaBin = wasteBins.find(b => b.name === 'Sıcak Oda');
      if (!sicakOdaBin) {
        // Kutu yoksa oluştur
        const newBinId = Math.random().toString(36).substr(2, 9);
        sicakOdaBin = {
          id: newBinId,
          name: 'Sıcak Oda',
          type: 'sharp' as const,
          items: [],
          isSealed: false
        };
        setWasteBins(prev => [...prev, sicakOdaBin!]);
      }

      // Atık öğesini ekle
      const wasteItem: WasteItem = {
        id: Math.random().toString(36).substr(2, 9),
        isotopeId: selectedIsotope.id,
        activity: residualActivity,
        unit: unit,
        disposedAt: new Date(),
        source: 'preparation',
        description: `${patientName || 'Hasta'} - Enjektör/Kanül atığı`
      };

      setWasteBins(prev => prev.map(b =>
        b.name === 'Sıcak Oda'
          ? { ...b, items: [...b.items, wasteItem] }
          : b
      ));
    }// === Vial'lardan doz çek ve boş olanları waste'e taşı ===
    if (!isNoDoseAdditionalImaging && drawAmount > 0) {
      let remainingToDraw = drawAmount;
      const updatedVials: typeof vials = [];
      const vialsToWaste: typeof vials = [];

      for (const vial of vials) {
        if (remainingToDraw <= 0) {
          updatedVials.push(vial);
          continue;
        }

        const hoursSinceReceived = (now.getTime() - new Date(vial.receivedAt).getTime()) / (1000 * 60 * 60);
        const currentActivity = calculateDecay(vial.initialAmount, selectedIsotope.halfLifeHours, hoursSinceReceived);

        if (currentActivity > 0.01) {
          if (currentActivity >= remainingToDraw) {
            // Bu vial'dan gerekeni çek
            const consumed = remainingToDraw;
            const decayFactor = Math.exp(-0.693 * hoursSinceReceived / selectedIsotope.halfLifeHours);
            const newInitialAmount = vial.initialAmount - (consumed / decayFactor);

            if (newInitialAmount > 0.01) {
              updatedVials.push({ ...vial, initialAmount: newInitialAmount });
            } else {
              vialsToWaste.push(vial);
            }
            remainingToDraw = 0;
          } else {
            // Vial'ı tamamen tüket
            remainingToDraw -= currentActivity;
            vialsToWaste.push(vial);
          }
        } else {
          // Zaten boş vial
          vialsToWaste.push(vial);
        }
      }

      // Vial'ları güncelle
      setVials(updatedVials);

      // Boş vial'ları waste'e gönder
      if (vialsToWaste.length > 0) {
        let sicakOdaBin = wasteBins.find(b => b.name === 'Sıcak Oda');
        if (!sicakOdaBin) {
          const newBinId = Math.random().toString(36).substr(2, 9);
          sicakOdaBin = {
            id: newBinId,
            name: 'Sıcak Oda',
            type: 'solid' as const,
            items: [],
            isSealed: false
          };
          setWasteBins(prev => [...prev, sicakOdaBin!]);
        }

        const wasteItems: WasteItem[] = vialsToWaste.map(vial => ({
          id: Math.random().toString(36).substr(2, 9),
          isotopeId: selectedIsotope.id,
          activity: 0.05,
          unit: unit,
          disposedAt: new Date(),
          source: 'vial',
          description: `${vial.label} - Boş flacon`
        }));

        setWasteBins(prev => prev.map(b =>
          b.name === 'Sıcak Oda'
            ? { ...b, items: [...b.items, ...wasteItems] }
            : b
        ));

        addNotification('Boş Flakonlar Atığa Gönderildi', 'info', `${vialsToWaste.length} adet boş flacon otomatik olarak atığa taşındı.`);
      }
    }


    setPatientName("");
    setPatientWeight("");
    setPendingPatients(prev => prev.filter(p => p.id !== patientId && p.name !== patientName));
    triggerExplosion();
  };

  // Flokon silme modal state'i
  const [vialToDelete, setVialToDelete] = useState<{ id: string, label: string, activity: number } | null>(null);

  const removeVial = (id: string) => {
    const vialToDispose = vials.find(v => v.id === id);
    if (!vialToDispose) return;

    // Calculate current activity at this moment
    const currentActivity = getVialCurrentActivity(vialToDispose, selectedIsotope.halfLifeHours, now);

    // Modal'ı aç
    setVialToDelete({
      id: vialToDispose.id,
      label: vialToDispose.label,
      activity: currentActivity
    });
  };

  const confirmRemoveVial = () => {
    if (!vialToDelete) return;

    // Create waste item
    const wasteItem: WasteItem = {
      id: Math.random().toString(36).substr(2, 9),
      isotopeId: selectedIsotope.id,
      activity: vialToDelete.activity,
      unit: unit,
      disposedAt: new Date(),
      source: 'vial',
      description: `${vialToDelete.label} - Manuel Atık`
    };

    // Add to waste management - single setWasteBins call
    setWasteBins(prev => {
      const sicakOdaBin = prev.find(b => b.name === 'Sıcak Oda');

      if (sicakOdaBin) {
        // Bin exists, add item to it
        return prev.map(b =>
          b.name === 'Sıcak Oda'
            ? { ...b, items: [...b.items, wasteItem] }
            : b
        );
      } else {
        // Bin doesn't exist, create it with the item
        const newBin = {
          id: Math.random().toString(36).substr(2, 9),
          name: 'Sıcak Oda',
          type: 'solid' as const,
          items: [wasteItem],
          isSealed: false
        };
        return [...prev, newBin];
      }
    });

    // Remove vial from stock
    setVials(prev => prev.filter(v => v.id !== vialToDelete.id));

    // Notify user
    addNotification('Flakon Atığa Taşındı', 'success', `${vialToDelete.label} manuel olarak atık yönetimine taşındı.`, false);

    // Close modal
    setVialToDelete(null);
  };

  // Handle starting patient imaging - for Doctor Dashboard
  // Handle starting patient imaging - for Doctor Dashboard
  const handleStartImaging = (patientId: string, patientName: string) => {
    // Check if patient is in a room and remove them
    const roomValues = Object.values(patientsInRooms) as { roomId: string; startTime: Date; patientId: string; patientName: string }[];
    const roomInfo = roomValues.find(r => r.patientId === patientId);
    if (roomInfo) {
      handleRemoveFromRoom(roomInfo.roomId);
    }

    // Also check for additional imaging queue and remove if present
    if (additionalImagingPatients[patientId]) {
      setAdditionalImagingPatients(prev => {
        const newState = { ...prev };
        delete newState[patientId];
        return newState;
      });
    }

    setPatientsInImaging(prev => ({ ...prev, [patientId]: { startTime: new Date() } }));
    addNotification('Çekime Alındı', 'success', `${patientName} PET/BT çekimine alındı.`);
  };

  // Hastayı enjeksiyon odasına ata
  const handleAssignToRoom = (patientId: string, patientName: string, roomId: string | number) => {
    // Hastayı history'den bul ve prosedur bilgisini al
    const patientEntry = history.find(h => h.id === patientId);
    setPatientsInRooms(prev => ({
      ...prev,
      [patientId]: {
        roomId: roomId.toString(),
        startTime: new Date(),
        patientId,
        patientName,
        procedure: patientEntry?.procedure || '',
        isotopeId: selectedIsotope.id
      }
    }));
    addNotification('Odaya Alındı', 'success', `${patientName} Oda ${roomId}'e alındı.`);
  };

  // Hastayı odadan çıkar
  // Hastayı odadan çıkar
  const handleRemoveFromRoom = (roomId: string | number) => {
    const roomIdStr = roomId.toString();
    setPatientsInRooms(prev => {
      const newState = { ...prev };
      // roomId'ye sahip olan hastayı bul ve sil
      Object.keys(newState).forEach(key => {
        if (newState[key].roomId.toString() === roomIdStr) {
          delete newState[key];
        }
      });
      return newState;
    });
    addNotification('Odadan Çıkarıldı', 'info', `Oda ${roomId} boşaltıldı.`);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      // CSV dosyası için doğrudan parse et
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const text = await file.text();
        const { parsePatientCSV } = await import('./utils/csvParser');
        const patients = parsePatientCSV(text);

        if (patients.length === 0) {
          alert('CSV dosyası boş veya hatalı format. Lütfen şablon dosyayı indirin ve kontrol edin.');
          return;
        }

        setPendingPatients(prev => [...prev, ...patients]);
        addNotification('Hasta Listesi Yüklendi', 'success', `${patients.length} hasta başarıyla eklendi.`);
        return;
      }

      // PDF/Resim için yerel OCR kullan (Tesseract.js + PDF.js)
      try {
        const { processPatientFile } = await import('./utils/localOcrParser');

        const patients = await processPatientFile(file, (status, progress) => {
          // Progress bilgisi için console log (ileride UI'da gösterilebilir)
          console.log(status, progress !== undefined ? `${progress}%` : '');
        });

        const newPending = patients.map(p => ({
          id: p.id,
          name: p.name,
          protocolNo: p.protocolNo,
          procedure: p.procedure,
          suggestedAmount: p.suggestedAmount,
          weight: p.weight,
          appointmentDate: p.appointmentDate,
          appointmentTime: p.appointmentTime
        }));

        setPendingPatients(prev => [...prev, ...newPending]);
        addNotification('Hasta Listesi Analiz Edildi', 'success', `${newPending.length} hasta yerel OCR ile analiz edildi.`);
      } catch (ocrError: any) {
        const errorMessage = ocrError?.message || 'Bilinmeyen hata';
        alert(`❌ OCR Analiz Hatası:\n\n${errorMessage}\n\nAlternatif: CSV formatında yükleyin.`);
        console.error("OCR analiz hatası:", ocrError);
      }
    } catch (e: any) {
      console.error("Dosya yükleme hatası:", e);
      alert(`Dosya yükleme hatası: ${e?.message || e}\n\nDesteklenen formatlar: CSV, PDF, JPG, PNG`);
    } finally {
      setIsProcessingFile(false);
      // Clear file input to allow re-uploading same file
      event.target.value = '';
    }
  };


  const selectPendingPatient = (patient: PendingPatient) => {
    setPatientName(patient.name);
    if (patient.procedure) setSelectedProcedure(patient.procedure);
    if (patient.weight) setPatientWeight(patient.weight.toString());
    if (patient.suggestedAmount) setDrawAmount(patient.suggestedAmount);
  };

  const getIsotopeForProcedure = (procedure?: string) => {
    if (!procedure) return ISOTOPES[0];
    const proc = procedure.toLowerCase();

    // Simple mapping based on procedure keywords
    if (proc.includes('pet') || proc.includes('fdg')) return ISOTOPES.find(i => i.id === 'f18') || ISOTOPES[0];
    if (proc.includes('kemik') || proc.includes('böbrek') || proc.includes('mibi') || proc.includes('kalp') || proc.includes('tiroid')) return ISOTOPES.find(i => i.id === 'tc99m') || ISOTOPES[0];
    if (proc.includes('psma') || proc.includes('dotatate')) return ISOTOPES.find(i => i.id === 'ga68') || ISOTOPES[0];
    if (proc.includes('atom') || proc.includes('hipertiroidi')) return ISOTOPES.find(i => i.id === 'i131') || ISOTOPES[0];
    if (proc.includes('tedavi') || proc.includes('lutesyum')) return ISOTOPES.find(i => i.id === 'lu177') || ISOTOPES[0];

    return ISOTOPES[0];
  };

  const handlePatientRouting = (patient: PendingPatient) => {
    const targetIso = getIsotopeForProcedure(patient.procedure);
    setSelectedIsotope(targetIso);
    setIsWorkspaceActive(true);
    // We need to wait for state update or use a timeout to select the patient in the new workspace
    setTimeout(() => {
      selectPendingPatient(patient);
    }, 100);
    triggerExplosion();
  };

  const handleRequestAdditionalImaging = (entryId: string, region: string, doseNeeded: boolean, scheduledMinutes: number = 60) => {
    const entry = history.find(e => e.id === entryId);
    if (!entry) return;

    const additionalInfo: AdditionalImaging = {
      region,
      requestedAt: new Date(),
      status: 'pending',
      doseNeeded,
      originalEntryId: entryId,
      scheduledMinutes
    };

    // 1. Update history
    setHistory(prev => prev.map(e => e.id === entryId ? { ...e, additionalInfo } : e));

    // 2. Add back to global pending queue ONLY IF DOSE IS NEEDED
    if (doseNeeded) {
      const newPending: PendingPatient = {
        id: `ek-${entry.id}-${Math.random().toString(36).substr(2, 5)}`,
        name: `${entry.patientName}`,
        protocolNo: entry.protocolNo,
        procedure: entry.procedure,
        additionalInfo
      };

      setPendingPatients(prev => [newPending, ...prev]);
    }

    // 3. Add to doctor dashboard additional imaging list with scheduled time
    setAdditionalImagingPatients(prev => ({
      ...prev,
      [entryId]: { region, addedAt: new Date(), scheduledMinutes }
    }));

    const timeLabel = scheduledMinutes === 60 ? '1 saat' : scheduledMinutes === 90 ? '1.5 saat' : '2 saat';
    addNotification('Ek Çekim Talebi Oluşturuldu', 'success', `${entry.patientName} için ${region} bölgesi ${timeLabel} sonra çekime alınacak.`, false);
  };

  const handleAddWasteBin = (name: string, type: 'sharp' | 'solid' | 'liquid') => {
    const newBin: WasteBin = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      items: [],
      isSealed: false
    };
    setWasteBins(prev => [...prev, newBin]);
    addNotification('Atık Kutusu Eklendi', 'success', `${name} oluşturuldu.`);
  };

  const handleEmptyBin = (binId: string) => {
    setWasteBins(prev => prev.map(b => b.id === binId ? { ...b, items: [] } : b));
    addNotification('Kutu Boşaltıldı', 'info', 'Atıklar bertaraf edildi.');
  };

  const handleDisposeItem = (binId: string, item: Omit<WasteItem, 'id' | 'disposedAt'>) => {
    const newItem: WasteItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      disposedAt: new Date(),
    };
    setWasteBins(prev => prev.map(b => b.id === binId ? { ...b, items: [...b.items, newItem] } : b));
    addNotification('Atık Atıldı', 'success', `Atık kutuya gönderildi.`);
  };

  const enterWorkspace = (iso: Isotope) => {
    setSelectedIsotope(iso);
    setIsWorkspaceActive(true);
    setPatientName("");
    setPatientWeight("");
    setDrawAmount(5);
    triggerExplosion();
  };

  const handleImagingCompleted = (patientId: string) => {
    // Check if this patient has pending additional imaging info (by checking history, not just the map)
    // Find the history entry first
    const historyEntry = history.find(h => h.id === patientId);

    // If they have additionalInfo AND it's not completed yet, treat as additional imaging completion
    if (historyEntry?.additionalInfo && historyEntry.additionalInfo.status !== 'completed') {
      // Ek çekim tamamlandı - hem additionalInfo.status hem de ana status'u güncelle
      setHistory(prev => prev.map(e => e.id === patientId ? {
        ...e,
        status: DoseStatus.INJECTED, // Hastayı "Tamamlandılar"a gönder
        additionalInfo: { ...e.additionalInfo!, status: 'completed' as const }
      } : e));

      // Clean up from additionalImagingPatients (tracker removes it on start, but good to ensure cleanup)
      setAdditionalImagingPatients(prev => {
        const newState = { ...prev };
        delete newState[patientId];
        return newState;
      });

      addNotification('Ek Çekim Tamamlandı', 'success', 'Ek çekim süreci başarıyla tamamlandı.');
    } else {
      // Normal completion logic (primary imaging)
      setHistory(prev => prev.map(e =>
        e.id === patientId ? { ...e, status: DoseStatus.INJECTED } : e
      ));
      addNotification('Çekim Tamamlandı', 'success', 'Çekim başarıyla tamamlandı.');
    }
  };

  // Kullanıcı giriş/çıkış fonksiyonları
  const handleLogin = (user: StaffUser) => {
    setCurrentUser(user);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, null);
    setIsWorkspaceActive(false);
  };

  const handleAddStaffUser = (name: string, role: UserRole) => {
    const newUser: StaffUser = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      role,
      createdAt: new Date()
    };
    const updatedUsers = [...staffUsers, newUser];
    setStaffUsers(updatedUsers);
    saveToStorage(STORAGE_KEYS.STAFF_USERS, updatedUsers);
  };

  if (!currentUser) {
    return (
      <UserLogin
        users={staffUsers}
        onLogin={handleLogin}
        onAddUser={handleAddStaffUser}
      />
    );
  }

  // Doktor rolü için doğrudan Doktor Dashboard'u göster
  if (currentUser.role === UserRole.DOCTOR) {
    return (
      <DoctorDashboard
        history={history}
        selectedIsotope={selectedIsotope}
        patientsInRooms={patientsInRooms}
        patientsInImaging={patientsInImaging}
        additionalImagingPatients={additionalImagingPatients}
        onStartImaging={(patientId, patientName) => {
          setPatientsInImaging(prev => ({
            ...prev,
            [patientId]: { startTime: new Date() }
          }));
        }}
        onReturnToRoom={(patientId, roomId) => {
          // Çekimden çıkar
          setPatientsInImaging(prev => {
            const newState = { ...prev };
            delete newState[patientId];
            return newState;
          });
          // Odaya geri al
          const patient = history.find(h => h.id === patientId);
          if (patient) {
            setPatientsInRooms(prev => ({
              ...prev,
              [patientId]: {
                roomId,
                startTime: new Date(),
                patientId,
                patientName: patient.patientName
              }
            }));
          }
        }}
        onCancelAdditionalImaging={(patientId) => {
          setAdditionalImagingPatients(prev => {
            const newState = { ...prev };
            delete newState[patientId];
            return newState;
          });
        }}
        allVials={allPETVials}
        unit={unit}
        now={now}
        onLogout={handleLogout}
      />
    );
  }

  // Fizikçi rolü için doğrudan Fizikçi Dashboard'u göster
  if (currentUser.role === UserRole.PHYSICIST) {
    return (
      <PhysicistDashboard
        history={history}
        selectedIsotope={selectedIsotope}
        now={now}
        unit={unit}
        wasteBins={wasteBins}
        staffUsers={staffUsers}
        allVials={allPETVials}
        onLogout={handleLogout}
      />
    );
  }

  if (!isWorkspaceActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#020202] via-[#0a0a1a] to-[#020202] text-white flex flex-col w-full max-w-none sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto relative overflow-hidden font-sans">
        {/* Animated Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -right-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/2 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {isProcessingFile && (
          <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 uppercase tracking-widest animate-pulse">Analiz Ediliyor</p>
              <p className="text-xs text-slate-500 mt-2">Hasta listesi işleniyor...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="relative pt-6 pb-6 px-6">
          {/* Üst Satır: Kullanıcı Bilgisi ve Çıkış */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg">☢️</div>
              <div>
                <p className="text-xs font-bold text-white">{currentUser.name}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">{currentUser.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500 border border-red-500/30 hover:border-red-400 text-red-400 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Çıkış
            </button>
          </div>

          {/* Ana Başlık */}
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Aktif</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">İzotop</span>
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent ml-2">Kütüphanesi</span>
              </h1>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">
                Nükleer Tıp · Akıllı Doz Yönetimi
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowNuclearInfo(true)}
                className="group w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-900/20 border border-purple-500/30 flex items-center justify-center text-purple-400 hover:from-purple-600 hover:to-pink-600 hover:text-white hover:border-purple-400 transition-all duration-300 hover:scale-105"
                title="Nükleer Tıp Bilgi Merkezi"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </button>
              <button
                onClick={() => setShowHandbook(true)}
                className="group w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/20 to-blue-900/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:from-indigo-600 hover:to-blue-600 hover:text-white hover:border-indigo-400 transition-all duration-300 hover:scale-105"
                title="Prosedür El Kitabı"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button
                onClick={async () => {
                  const { downloadCSVTemplate } = await import('./utils/csvParser');
                  downloadCSVTemplate();
                }}
                className="group w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:from-emerald-600 hover:to-emerald-700 hover:text-white hover:border-emerald-400 transition-all duration-300 hover:scale-105"
                title="CSV Şablon İndir"
              >
                <svg className="w-4 h-4 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-900/20 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:from-blue-600 hover:to-purple-600 hover:text-white hover:border-blue-400 transition-all duration-300 hover:scale-105"
                title="Günlük Liste Yükle"
              >
                <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
              <button
                onClick={() => setShowDailyControl(true)}
                className="group w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600/20 to-cyan-900/20 border border-teal-500/30 flex items-center justify-center text-teal-400 hover:from-teal-600 hover:to-cyan-600 hover:text-white hover:border-teal-400 transition-all duration-300 hover:scale-105"
                title="Günlük Ortam Kontrolleri"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </button>
              <button
                onClick={() => setShowFDGOrderPlanner(true)}
                className="group w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600/20 to-amber-900/20 border border-orange-500/30 flex items-center justify-center text-orange-400 hover:from-orange-600 hover:to-amber-600 hover:text-white hover:border-orange-400 transition-all duration-300 hover:scale-105"
                title="FDG Sipariş Planla"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </button>
            </div>

          </div>
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.csv,image/*,text/*"
          />
        </header>

        <main className="flex-1 px-6 pb-8 space-y-6 relative z-10">
          {/* Çalışma Alanları */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-purple-500 to-pink-500"></div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Çalışma Alanları</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ISOTOPES.map((iso, index) => (
                <button
                  key={iso.id}
                  onClick={() => enterWorkspace(iso)}
                  className="group relative w-full bg-gradient-to-br from-slate-900/80 via-slate-800/50 to-slate-900/80 border border-white/10 rounded-3xl p-5 text-left transition-all duration-500 hover:border-white/20 hover:shadow-2xl active:scale-[0.98] overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Glowing background effect */}
                  <div className={`absolute -top-10 -right-10 w-40 h-40 ${iso.color} opacity-0 blur-3xl group-hover:opacity-20 transition-all duration-700`}></div>
                  <div className={`absolute -bottom-10 -left-10 w-32 h-32 ${iso.color} opacity-0 blur-3xl group-hover:opacity-10 transition-all duration-700`}></div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${iso.color.replace('bg-', 'text-')} opacity-80`}>
                          {iso.symbol}
                        </span>
                        <h2 className="text-xl font-black tracking-tight group-hover:text-white transition-colors">
                          {iso.name}
                        </h2>
                      </div>

                      <div className={`w-12 h-12 rounded-2xl ${iso.color} bg-opacity-10 border border-current/20 flex items-center justify-center ${iso.color.replace('bg-', 'text-')} group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                        <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-3 leading-relaxed font-medium line-clamp-2 group-hover:text-slate-300 transition-colors">
                      {iso.description.split('.')[0]}
                    </p>

                    <div className="flex gap-2 mt-4 flex-wrap">
                      {iso.commonProcedures.slice(0, 3).map(p => (
                        <span
                          key={p}
                          className={`text-[8px] font-bold px-2.5 py-1 rounded-lg border ${iso.color.replace('bg-', 'border-')}/20 ${iso.color.replace('bg-', 'text-')} bg-current/5 uppercase tracking-wide`}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* Nuclear Medicine Info Modal */}
        {showNuclearInfo && (
          <NuclearMedicineInfo onClose={() => setShowNuclearInfo(false)} />
        )}

        {/* Nuclear Medicine Handbook Modal */}
        {showHandbook && (
          <NuclearMedicineHandbook onClose={() => setShowHandbook(false)} />
        )}

        {/* Footer */}
        <footer className="relative p-6 border-t border-white/5 text-center">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="relative flex items-center justify-center gap-2">
            <div className="w-1 h-1 rounded-full bg-emerald-500/50"></div>
            <p className="text-[9px] font-bold text-slate-600 tracking-[0.2em] uppercase">
              Nükleer Tıp Asistanı © 2025
            </p>
            <div className="w-1 h-1 rounded-full bg-emerald-500/50"></div>
          </div>
        </footer>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col w-full max-w-none sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto relative overflow-hidden font-sans pb-24">
      {isExploding && (
        <div className="absolute inset-0 z-[100] pointer-events-none flex items-center justify-center">
          <div className="absolute w-1 h-1 rounded-full animate-ping duration-700 bg-white shadow-[0_0_150px_70px_rgba(255,255,255,0.9)]" style={{ transform: 'scale(1000)' }}></div>
          <div className={`absolute inset-0 ${selectedIsotope.color} mix-blend-screen opacity-30 animate-pulse`}></div>
        </div>
      )}

      {isProcessingFile && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm font-black text-blue-400 uppercase tracking-widest animate-pulse">Liste Analiz Ediliyor...</p>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/5 py-3 px-4">
        {/* Tek Satır Header - Kompakt */}
        <div className="flex items-center justify-between gap-4">
          {/* Sol: Geri Butonu + İzotop Bilgisi */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsWorkspaceActive(false);
                setPatientName("");
                setPatientWeight("");
              }}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all"
              title="İzotop Kütüphanesine Dön"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div className={`w-10 h-10 rounded-xl ${selectedIsotope.color} bg-opacity-20 flex items-center justify-center`}>
              <span className="text-sm font-black ${selectedIsotope.color.replace('bg-', 'text-')}">{selectedIsotope.symbol}</span>
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white">{selectedIsotope.name}</h1>
              <p className="text-[9px] font-bold text-slate-500 uppercase">{selectedIsotope.symbol} • T½ {selectedIsotope.halfLifeHours < 1 ? `${(selectedIsotope.halfLifeHours * 60).toFixed(0)} dk` : `${selectedIsotope.halfLifeHours.toFixed(1)} sa`}</p>
            </div>
          </div>

          {/* Orta: Stok Göstergesi */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-slate-900/90 to-slate-800/80 px-4 py-2 rounded-xl border border-white/10">
            <div className={`w-2.5 h-2.5 rounded-full ${selectedIsotope.color} animate-pulse`}></div>
            <span className="text-xl font-black tabular-nums text-white">{formatActivity(currentTotalActivity)}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{unit}</span>
          </div>

          {/* Sağ: Araçlar */}
          <div className="flex items-center gap-1.5">
            {/* Hasta Arama */}
            <div className="relative">
              {searchOpen ? (
                <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Hasta ara..."
                    autoFocus
                    className="w-28 px-2.5 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                    onBlur={() => {
                      if (!searchQuery) setSearchOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSearchQuery('');
                        setSearchOpen(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchOpen(false);
                    }}
                    className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSearchOpen(true);
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                  title="Hasta Ara"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Raporlar */}
            <button
              onClick={() => setShowReports(true)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              title="Raporlar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>

            {/* Ses */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg transition-all ${soundEnabled
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-white/5 text-slate-500 hover:bg-white/10'
                }`}
              title={soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
            >
              {soundEnabled ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>

            <ThemeToggle />

            {/* Araçlar Dropdown */}
            <div className="relative group">
              <button
                className="p-2 rounded-lg bg-gradient-to-r from-violet-600/20 to-purple-600/20 hover:from-violet-600 hover:to-purple-600 border border-violet-500/30 hover:border-violet-400 text-violet-400 hover:text-white transition-all"
                title="Araçlar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-52 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <div className="p-1.5">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Yönetim</p>
                  <button onClick={() => setShowDailyControl(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-teal-500/20 hover:text-teal-300 transition-colors">
                    <span>📋</span> Günlük Kontrol
                  </button>
                  <button onClick={() => setShowScheduler(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-teal-500/20 hover:text-teal-300 transition-colors">
                    <span>📅</span> Randevu Takvimi
                  </button>
                  <button onClick={() => setShowEnhancedDashboard(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-blue-500/20 hover:text-blue-300 transition-colors">
                    <span>📊</span> Gelişmiş Dashboard
                  </button>
                  <button onClick={() => setShowArchive(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors">
                    <span>🗄️</span> Hasta Arşivi
                  </button>
                </div>

                <div className="border-t border-slate-700 p-1.5">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Hesaplama</p>
                  <button onClick={() => setShowQC(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors">
                    <span>🔬</span> Kalite Kontrol
                  </button>
                  <button onClick={() => setShowPharma(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-rose-500/20 hover:text-rose-300 transition-colors">
                    <span>💊</span> Farmakokinetik
                  </button>
                  <button onClick={() => setShowPediatricCalc(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-pink-500/20 hover:text-pink-300 transition-colors">
                    <span>👶</span> Pediatrik Doz
                  </button>
                  <button onClick={() => setShowStatistics(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-violet-500/20 hover:text-violet-300 transition-colors">
                    <span>📈</span> İstatistikler
                  </button>
                  <button onClick={() => setShowAnalyticsPanel(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors">
                    <span>📊</span> Gelişmiş Analitik
                  </button>
                </div>
                <div className="border-t border-slate-700 p-1.5">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Planlama</p>
                  <button onClick={() => setShowAppointments(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-teal-500/20 hover:text-teal-300 transition-colors">
                    <span>📆</span> Randevu Yönetimi
                  </button>
                  <button onClick={() => setShowPatientTimeline(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-blue-500/20 hover:text-blue-300 transition-colors">
                    <span>⏱️</span> Hasta Zaman Çizelgesi
                  </button>
                  <button onClick={() => setShowEnhancedWaste(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-orange-500/20 hover:text-orange-300 transition-colors">
                    <span>♻️</span> Gelişmiş Atık Takibi
                  </button>
                </div>
                <div className="border-t border-slate-700 p-1.5">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Yardım</p>
                  <button onClick={() => setShowAI(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors">
                    <span>🤖</span> AI Asistan
                  </button>
                  <button onClick={() => setShowNotificationHistory(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-amber-500/20 hover:text-amber-300 transition-colors">
                    <span>🔔</span> Bildirim Geçmişi
                  </button>
                  <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-violet-500/20 hover:text-violet-300 transition-colors">
                    <span>⚙️</span> Ayarlar
                  </button>
                </div>
              </div>
            </div>

            {/* Kullanıcı ve Çıkış */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-red-500/20 rounded-lg border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all ml-1"
              title="Çıkış Yap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold max-w-[60px] truncate">{currentUser.name}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div >
      </header >





      <main className="flex-1 px-8 pt-6 space-y-6 overflow-y-auto scrollbar-hide">
        {canPrepare && selectedIsotope.hasGenerator && (
          <GeneratorManager
            generator={generator}
            onAddGenerator={handleAddGenerator}
            onElute={handleElution}
            onRemoveGenerator={handleRemoveGenerator}
            unit={unit}
            now={now}
            selectedIsotope={selectedIsotope}
          />
        )}

        {canPrepare && selectedIsotope.id === 'tc99m' && (
          <KitPreparation
            onPrepareKit={handlePrepareKit}
            onConsumeActivity={handleConsumeFromVials}
            unit={unit}
            addNotification={addNotification}
            currentActivity={currentTotalActivity}
          />
        )}

        <StockManager
          vials={vials}
          selectedIsotope={selectedIsotope}
          unit={unit}
          newVialInput={newVialInput}
          newVialVolume={newVialVolume}
          setNewVialInput={setNewVialInput}
          setNewVialVolume={setNewVialVolume}
          onAddVial={handleAddVial}
          onRemoveVial={removeVial}
          getVialCurrentActivity={(v) => getVialCurrentActivity(v, selectedIsotope.halfLifeHours, now)}
          hideEntry={selectedIsotope.hasGenerator || !canPrepare}
        />

        {/* Sıcak Oda / Atık Yönetimi - Doktorlar için gizli */}
        {userRole !== UserRole.DOCTOR && (
          <WasteManager
            bins={wasteBins}
            selectedIsotope={selectedIsotope}
            unit={unit}
            now={now}
            onAddBin={handleAddWasteBin}
            onDispose={handleDisposeItem}
            onEmptyBin={handleEmptyBin}
          />
        )}

        {/* Enjektör Hazırlama - Doktorlar için gizli */}
        {userRole !== UserRole.DOCTOR && (
          <DoseDispenser
            historyCount={history.length}
            pendingPatients={pendingPatients}
            patientName={patientName}
            setPatientName={setPatientName}
            patientWeight={patientWeight}
            setPatientWeight={setPatientWeight}
            doseRatio={doseRatio}
            setDoseRatio={setDoseRatio}
            selectedProcedure={selectedProcedure}
            setSelectedProcedure={setSelectedProcedure}
            drawAmount={drawAmount}
            setDrawAmount={setDrawAmount}
            selectedIsotope={selectedIsotope}
            unit={unit}
            recommendedDose={recommendedDose}
            requiredVolume={requiredVolume}
            currentConcentration={currentConcentration}
            currentTotalActivity={currentTotalActivity}
            onSelectPendingPatient={selectPendingPatient}
            onWithdrawDose={(pId) => handleWithdrawDose(pId)}
            now={now}
            readOnly={!canPrepare}
          />
        )}




        {/* Hasta Takip - Doktorlar için Dashboard (Sadece Görüntüleme), Teknisyenler için Tracker */}
        {userRole === UserRole.DOCTOR ? (
          <DoctorDashboard
            history={history}
            selectedIsotope={selectedIsotope}
            now={now}
            unit={unit}
            patientsInRooms={patientsInRooms}
            patientsInImaging={patientsInImaging}
            additionalImagingPatients={additionalImagingPatients}
            onStartImaging={handleStartImaging}
            allVials={allPETVials}
          />
        ) : (
          <PatientWaitingTracker
            history={history}
            selectedIsotope={selectedIsotope}
            now={now}
            onNotify={addNotification}
            patientsInImaging={patientsInImaging}
            setPatientsInImaging={setPatientsInImaging}
            additionalImagingPatients={additionalImagingPatients}
            setAdditionalImagingPatients={setAdditionalImagingPatients}
            patientsInRooms={patientsInRooms}
            onAssignToRoom={handleAssignToRoom}
            onRemoveFromRoom={handleRemoveFromRoom}
            onRequestAdditionalImaging={(entryId, region, doseNeeded, scheduledMinutes) => handleRequestAdditionalImaging(entryId, region, doseNeeded, scheduledMinutes)}
            onMarkAsInjected={handleImagingCompleted}
          />
        )}

        {/* 
        <ActivityLog
          history={history}
          selectedIsotope={selectedIsotope}
          unit={unit}
          now={now}
          onFileUpload={handleFileUpload}
          onReset={() => {
            if (confirm("Sıfırlansın mı?")) {
              setHistory([]);
              setVials([]);
              setWasteBins([]);
              setGenerator(null);
              addNotification('Veriler Sıfırlandı', 'info', 'Tüm geçmiş ve envanter verileri temizlendi.');
            }
          }}
          fileInputRef={fileInputRef}
          onRequestAdditionalImaging={handleRequestAdditionalImaging}
        /> 
        */}

        <DashboardStats
          stats={stats}
          unit={unit}
          setUnit={setUnit}
        />


        <AdvancedFilters
          history={history}
          pendingPatients={pendingPatients}
          onFilterChange={setFilteredHistory}
          onPendingFilterChange={setFilteredPending}
        />

        {showAnalytics && (
          <Analytics
            history={filteredHistory}
            selectedIsotope={selectedIsotope}
            unit={unit}
          />
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${showAnalytics
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900/40 border border-white/5 text-blue-400 hover:bg-slate-800'
              }`}
          >
            {showAnalytics ? '📊 Analytics\'i Gizle' : '📊 Analytics\'i Göster'}
          </button>
          <button
            onClick={() => printReport(history, wasteBins, selectedIsotope, unit, stats)}
            className="flex-1 bg-slate-900/40 border border-white/5 text-purple-400 hover:bg-slate-800 py-3 rounded-2xl text-[10px] font-black uppercase transition-all"
          >
            🖨️ Detaylı Rapor Yazdır
          </button>
        </div>

        <ReportingManager
          history={history}
          wasteBins={wasteBins}
          selectedIsotope={selectedIsotope}
          unit={unit}
          now={now}
        />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 w-full max-w-none sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto h-12 bg-black/40 backdrop-blur-xl flex items-center justify-center pointer-events-none z-[60]">
        <div className="w-32 h-1.5 bg-white/20 rounded-full mb-4"></div>
      </footer>
      <NotificationCenter
        notifications={notifications}
        onClose={closeNotification}
        onClearAll={() => setNotifications([])}
      />
      {
        showReports && (
          <ReportDashboard
            history={history}
            unit={unit}
            now={now}
            onClose={() => setShowReports(false)}
          />
        )
      }
      <KeyboardShortcuts
        onNewPatient={() => setPatientName('')}
        onPrepareKit={() => { }}
        onExport={() => printReport(history, wasteBins, selectedIsotope, unit, stats)}
      />

      {/* New Feature Modals */}
      {
        showSettings && (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            currentUser={currentUser}
            unit={unit}
            onUnitChange={setUnit}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
          />
        )
      }

      {
        showScheduler && (
          <AppointmentScheduler
            onClose={() => setShowScheduler(false)}
            pendingPatients={pendingPatients}
            onAddPatient={(patient) => setPendingPatients(prev => [...prev, patient])}
            selectedIsotope={selectedIsotope}
          />
        )
      }

      {
        showArchive && (
          <PatientArchive
            onClose={() => setShowArchive(false)}
            history={history}
            unit={unit}
          />
        )
      }

      {
        showQC && (
          <QualityControl
            onClose={() => setShowQC(false)}
            currentUser={currentUser}
            addNotification={addNotification}
          />
        )
      }

      {
        showPharma && (
          <PharmacoKinetics
            onClose={() => setShowPharma(false)}
            selectedIsotope={selectedIsotope}
            unit={unit}
          />
        )
      }

      {
        showEnhancedDashboard && (
          <EnhancedDashboard
            onClose={() => setShowEnhancedDashboard(false)}
            history={history}
            vials={vials}
            selectedIsotope={selectedIsotope}
            unit={unit}
            pendingPatients={pendingPatients}
            currentTotalActivity={currentTotalActivity}
          />
        )
      }

      {
        showAI && (
          <AIAssistant
            onClose={() => setShowAI(false)}
            selectedIsotope={selectedIsotope}
            unit={unit}
            pendingPatients={pendingPatients}
            currentStock={currentTotalActivity}
          />
        )
      }

      {/* Randevu Yönetimi */}
      {
        showAppointments && (
          <AppointmentManager
            onClose={() => setShowAppointments(false)}
            onAddToPending={(patient) => setPendingPatients(prev => [...prev, patient])}
          />
        )
      }

      {/* İstatistikler */}
      {
        showStatistics && (
          <StatisticsDashboard
            history={history}
            unit={unit}
            now={now}
            onClose={() => setShowStatistics(false)}
          />
        )
      }

      {/* Gelişmiş Analitik */}
      {
        showAnalyticsPanel && (
          <AnalyticsPanel
            history={history}
            unit={unit}
            now={now}
            onClose={() => setShowAnalyticsPanel(false)}
          />
        )
      }

      {/* Bildirim Geçmişi */}
      {
        showNotificationHistory && (
          <NotificationHistory
            notifications={notifications}
            onClear={() => setNotifications([])}
            onClose={() => setShowNotificationHistory(false)}
            onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
          />
        )
      }

      {/* Hasta Zaman Çizelgesi */}
      {
        showPatientTimeline && (
          <PatientTimeline
            history={history}
            pendingPatients={pendingPatients}
            patientsInRooms={Object.entries(patientsInRooms).map(([patientId, data]: [string, { roomId: string; startTime: Date; patientId: string; patientName: string }]) => {
              const historyEntry = history.find(h => h.id === patientId || h.id === data.patientId);
              const pendingPatient = pendingPatients.find(p => p.id === patientId || p.id === data.patientId);
              return {
                room: data.roomId,
                patient: pendingPatient || {
                  id: data.patientId || patientId,
                  name: data.patientName || historyEntry?.patientName || 'Bilinmeyen Hasta',
                  procedure: historyEntry?.procedure || 'Prosedür belirtilmemiş'
                },
                doseGiven: historyEntry?.amount || 0,
                injectionTime: data.startTime instanceof Date ? data.startTime : new Date(data.startTime)
              };
            })}
            patientsInImaging={Object.entries(patientsInImaging).map(([patientId, data]: [string, { startTime: Date; patientName?: string }]) => {
              const historyEntry = history.find(h => h.id === patientId);
              const pendingPatient = pendingPatients.find(p => p.id === patientId);
              return {
                patient: pendingPatient || {
                  id: patientId,
                  name: data.patientName || historyEntry?.patientName || 'Bilinmeyen Hasta',
                  procedure: historyEntry?.procedure || 'Prosedür belirtilmemiş'
                },
                startTime: data.startTime instanceof Date ? data.startTime : new Date(data.startTime)
              };
            })}
            now={now}
            onClose={() => setShowPatientTimeline(false)}
          />
        )
      }

      {/* Pediatrik Doz Hesaplayıcı */}
      {
        showPediatricCalc && (
          <PediatricDoseCalculator
            unit={unit}
            onClose={() => setShowPediatricCalc(false)}
            onApplyDose={(dose) => {
              setDrawAmount(dose);
              setShowPediatricCalc(false);
            }}
          />
        )
      }

      {/* Gelişmiş Atık Takibi */}
      {
        showEnhancedWaste && (
          <EnhancedWasteTracker
            wasteBins={wasteBins}
            unit={unit}
            now={now}
            onClose={() => setShowEnhancedWaste(false)}
          />
        )
      }

      {/* Radyasyon Güvenliği Paneli */}
      {
        showRadiationSafety && (
          <RadiationSafetyPanel
            history={history}
            unit={unit}
            now={now}
            staffUsers={staffUsers}
            onClose={() => setShowRadiationSafety(false)}
          />
        )
      }

      {/* Audit Log */}
      {
        showAuditLog && (
          <AuditLog
            entries={[
              // Örnek audit log verileri - gerçek uygulamada state'den gelmeli
              ...history.map(h => ({
                id: h.id,
                timestamp: h.timestamp,
                userId: h.preparedBy?.id || 'system',
                userName: h.preparedBy?.name || 'Sistem',
                userRole: h.preparedBy?.role || 'sistem',
                action: `Doz Hazırlandı`,
                category: 'dose' as const,
                details: `${h.patientName} için ${h.amount.toFixed(2)} ${unit} ${h.procedure}`
              }))
            ]}
            onClose={() => setShowAuditLog(false)}
          />
        )
      }

      {/* Klinik Protokoller */}
      {
        showClinicalProtocols && (
          <ClinicalProtocols
            onClose={() => setShowClinicalProtocols(false)}
            onApplyProtocol={(protocol, dose) => {
              if (dose) {
                setDrawAmount(dose);
                addNotification({
                  id: `protocol-${Date.now()}`,
                  type: 'info',
                  title: 'Protokol Uygulandı',
                  message: `${protocol.name} protokolü seçildi. Önerilen doz: ${dose} MBq`,
                  timestamp: new Date(),
                  read: false
                });
              }
              setShowClinicalProtocols(false);
            }}
            unit={unit}
          />
        )
      }

      {/* Günlük Kontrol Formu */}
      {
        showDailyControl && currentUser && (
          <DailyControlForm
            currentUser={currentUser}
            onClose={() => setShowDailyControl(false)}
          />
        )
      }

      {/* FDG Sipariş Planlayıcı */}
      {
        showFDGOrderPlanner && (
          <FDGOrderPlanner
            onClose={() => setShowFDGOrderPlanner(false)}
          />
        )
      }

      {/* FDG Aktivite Takibi */}
      {
        showFDGActivityTracker && (
          <FDGActivityTracker
            onClose={() => setShowFDGActivityTracker(false)}
          />
        )
      }

      {/* Hızlı Erişim Butonları (QuickActions) */}


      {
        isWorkspaceActive && !isMobile && (
          <QuickActions
            onNewPatient={() => setPatientName('')}
            onOpenReports={() => setShowReports(true)}
            onOpenAnalytics={() => setShowAnalyticsPanel(true)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenHandbook={() => setShowHandbook(true)}
            onOpenWaste={() => setShowEnhancedWaste(true)}
            onOpenProtocols={() => setShowClinicalProtocols(true)}
            onOpenFDGPlanner={() => setShowFDGOrderPlanner(true)}
            onOpenFDGTracker={() => setShowFDGActivityTracker(true)}
          />
        )
      }

      {/* Mobil Navigasyon */}
      {
        isMobile && (
          <MobileNav
            currentUser={currentUser}
            userRole={userRole}
            onNavigate={(view) => {
              switch (view) {
                case 'scheduler': setShowAppointments(true); break;
                case 'reports': setShowReports(true); break;
                case 'statistics': setShowStatistics(true); break;
                case 'archive': setShowArchive(true); break;
                case 'handbook': setShowHandbook(true); break;
                case 'settings': setShowSettings(true); break;
                case 'ai': setShowAI(true); break;
              }
            }}
            currentView="dashboard"
            notifications={notifications.filter(n => !n.read).length}
          />
        )
      }

      {/* El Kitabı Modal */}
      {
        showHandbook && (
          <NuclearMedicineHandbook
            onClose={() => setShowHandbook(false)}
          />
        )
      }

      {/* Flokon Silme Onay Modal'ı */}
      <ConfirmModal
        isOpen={vialToDelete !== null}
        title="Flakon Silinecek"
        message={vialToDelete ? `${vialToDelete.label}\nMevcut Aktivite: ${vialToDelete.activity.toFixed(2)} ${unit}\n\nBu flakon kaldırılacak ve atık yönetimine taşınacak.` : ''}
        confirmText="Atığa Gönder"
        cancelText="İptal"
        confirmColor="red"
        onConfirm={confirmRemoveVial}
        onCancel={() => setVialToDelete(null)}
      />
    </div >
  );
};

export default App;
