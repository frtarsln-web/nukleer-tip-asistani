// Firebase Configuration
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, updateDoc, deleteDoc, getDocs } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAHRJLLWP0qozlGsmYBCkboXWwun2wBdlY",
    authDomain: "nukleer-tip-asistani.firebaseapp.com",
    projectId: "nukleer-tip-asistani",
    storageBucket: "nukleer-tip-asistani.firebasestorage.app",
    messagingSenderId: "229714248812",
    appId: "1:229714248812:web:35d5413ef9256157100449",
    measurementId: "G-D6SV90DNDR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection names
export const COLLECTIONS = {
    PATIENTS_IN_ROOMS: 'patientsInRooms',
    PATIENTS_IN_IMAGING: 'patientsInImaging',
    ADDITIONAL_IMAGING: 'additionalImaging',
    HISTORY: 'history',
    VIALS: 'vials',
    STAFF_USERS: 'staffUsers',
    PENDING_PATIENTS: 'pendingPatients',
    WASTE_BINS: 'wasteBins',
    SETTINGS: 'settings'
};

// Helper functions for Firestore operations

// Generic document save
export const saveDocument = async (collectionName: string, docId: string, data: any) => {
    try {
        await setDoc(doc(db, collectionName, docId), {
            ...data,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error(`Error saving to ${collectionName}:`, error);
    }
};

// Generic document get
export const getDocument = async (collectionName: string, docId: string) => {
    try {
        const docSnap = await getDoc(doc(db, collectionName, docId));
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error(`Error getting from ${collectionName}:`, error);
        return null;
    }
};

// Generic collection get all
export const getAllDocuments = async (collectionName: string) => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const docs: any[] = [];
        querySnapshot.forEach((doc) => {
            docs.push({ id: doc.id, ...doc.data() });
        });
        return docs;
    } catch (error) {
        console.error(`Error getting all from ${collectionName}:`, error);
        return [];
    }
};

// Delete document
export const deleteDocument = async (collectionName: string, docId: string) => {
    try {
        await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
        console.error(`Error deleting from ${collectionName}:`, error);
    }
};

// Subscribe to collection changes (real-time)
export const subscribeToCollection = (
    collectionName: string,
    callback: (data: any[]) => void
) => {
    const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
        const data: any[] = [];
        snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        callback(data);
    });
    return unsubscribe;
};

// Subscribe to single document changes (real-time)
export const subscribeToDocument = (
    collectionName: string,
    docId: string,
    callback: (data: any) => void
) => {
    const unsubscribe = onSnapshot(doc(db, collectionName, docId), (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    });
    return unsubscribe;
};

// ========== SPECIFIC FUNCTIONS FOR APPLICATION DATA ==========

// Patients in Rooms
export const savePatientsInRooms = async (data: Record<string, any>) => {
    await saveDocument(COLLECTIONS.PATIENTS_IN_ROOMS, 'current', data);
};

export const subscribeToPatientsInRooms = (callback: (data: Record<string, any> | null) => void) => {
    return subscribeToDocument(COLLECTIONS.PATIENTS_IN_ROOMS, 'current', (doc) => {
        if (doc) {
            const { id, updatedAt, ...rest } = doc;
            callback(rest);
        } else {
            callback({});
        }
    });
};

// Patients in Imaging
export const savePatientsInImaging = async (data: Record<string, any>) => {
    await saveDocument(COLLECTIONS.PATIENTS_IN_IMAGING, 'current', data);
};

export const subscribeToPatientsInImaging = (callback: (data: Record<string, any> | null) => void) => {
    return subscribeToDocument(COLLECTIONS.PATIENTS_IN_IMAGING, 'current', (doc) => {
        if (doc) {
            const { id, updatedAt, ...rest } = doc;
            callback(rest);
        } else {
            callback({});
        }
    });
};

// Additional Imaging Patients
export const saveAdditionalImagingPatients = async (data: Record<string, any>) => {
    await saveDocument(COLLECTIONS.ADDITIONAL_IMAGING, 'current', data);
};

export const subscribeToAdditionalImaging = (callback: (data: Record<string, any> | null) => void) => {
    return subscribeToDocument(COLLECTIONS.ADDITIONAL_IMAGING, 'current', (doc) => {
        if (doc) {
            const { id, updatedAt, ...rest } = doc;
            callback(rest);
        } else {
            callback({});
        }
    });
};

// History (by isotope)
export const saveHistory = async (isotopeId: string, data: any[]) => {
    await saveDocument(COLLECTIONS.HISTORY, isotopeId, { entries: data });
};

export const subscribeToHistory = (isotopeId: string, callback: (data: any[]) => void) => {
    return subscribeToDocument(COLLECTIONS.HISTORY, isotopeId, (doc) => {
        if (doc && doc.entries) {
            callback(doc.entries);
        } else {
            callback([]);
        }
    });
};

// Vials (by isotope)
export const saveVials = async (isotopeId: string, data: any[]) => {
    await saveDocument(COLLECTIONS.VIALS, isotopeId, { vials: data });
};

export const subscribeToVials = (isotopeId: string, callback: (data: any[]) => void) => {
    return subscribeToDocument(COLLECTIONS.VIALS, isotopeId, (doc) => {
        if (doc && doc.vials) {
            callback(doc.vials);
        } else {
            callback([]);
        }
    });
};

// Staff Users
export const saveStaffUsers = async (data: any[]) => {
    await saveDocument(COLLECTIONS.STAFF_USERS, 'all', { users: data });
};

export const subscribeToStaffUsers = (callback: (data: any[]) => void) => {
    return subscribeToDocument(COLLECTIONS.STAFF_USERS, 'all', (doc) => {
        if (doc && doc.users) {
            callback(doc.users);
        } else {
            callback([]);
        }
    });
};

// Pending Patients
export const savePendingPatients = async (data: any[]) => {
    await saveDocument(COLLECTIONS.PENDING_PATIENTS, 'all', { patients: data });
};

export const subscribeToPendingPatients = (callback: (data: any[]) => void) => {
    return subscribeToDocument(COLLECTIONS.PENDING_PATIENTS, 'all', (doc) => {
        if (doc && doc.patients) {
            callback(doc.patients);
        } else {
            callback([]);
        }
    });
};

// Waste Bins (by isotope)
export const saveWasteBins = async (isotopeId: string, data: any[]) => {
    await saveDocument(COLLECTIONS.WASTE_BINS, isotopeId, { bins: data });
};

export const subscribeToWasteBins = (isotopeId: string, callback: (data: any[]) => void) => {
    return subscribeToDocument(COLLECTIONS.WASTE_BINS, isotopeId, (doc) => {
        if (doc && doc.bins) {
            callback(doc.bins);
        } else {
            callback([]);
        }
    });
};

export { db };
