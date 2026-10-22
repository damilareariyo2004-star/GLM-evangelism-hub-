import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { EvangelismRecord, DashboardStats, ChurchProgram, CHURCH_PROGRAMS } from '../types';

const COLLECTION_NAME = 'records';
const LOCAL_STORAGE_KEY = 'glm_evangelism_records_cache_v2';

// Clean out any old mock seed data from previous versions
export function purgeLegacyDemoCache(): void {
  try {
    localStorage.removeItem('glm_evangelism_records_cache');
    const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (existing) {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) {
        // Filter out any legacy seed records
        const cleaned = parsed.filter((r) => !String(r.id || '').startsWith('seed-glm-'));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
      }
    }
  } catch (e) {
    console.warn('Could not purge legacy cache', e);
  }
}

function getCachedRecords(): EvangelismRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((r) => !String(r.id || '').startsWith('seed-glm-'));
      }
    }
  } catch (e) {
    console.warn('Could not read records cache', e);
  }
  return [];
}

function setCachedRecords(records: EvangelismRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('Could not save records to cache', e);
  }
}

/**
 * Subscribes to records collection in Firestore, starting completely empty by default.
 */
export function subscribeToRecords(
  onSuccess: (records: EvangelismRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  purgeLegacyDemoCache();
  const cached = getCachedRecords();
  onSuccess(cached);

  try {
    const recordsCol = collection(db, COLLECTION_NAME);
    const q = query(recordsCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: EvangelismRecord[] = [];
          snapshot.docs.forEach((docSnap) => {
            // Exclude any legacy sample records
            if (docSnap.id.startsWith('seed-glm-')) return;
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              fullName: data.fullName || '',
              phone: data.phone || '',
              programs: Array.isArray(data.programs) ? data.programs : [],
              isNewConvert: Boolean(data.isNewConvert),
              respondedWell: Boolean(data.respondedWell),
              notes: data.notes || '',
              evangelistName: data.evangelistName || '',
              date: data.date || '',
              followedUp: Boolean(data.followedUp),
              followUpNotes: data.followUpNotes || '',
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
            });
          });

          setCachedRecords(list);
          onSuccess(list);
        } else {
          // Empty database: start with zero records
          setCachedRecords([]);
          onSuccess([]);
        }
      },
      (error) => {
        console.warn('Firestore snapshot error (using offline cache):', error);
        if (onError) onError(error);
        try {
          handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
        } catch {
          // Error logged to firestore error handler
        }
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach Firestore listener, using offline mode', err);
    return () => {};
  }
}

/**
 * Creates a new evangelism record
 */
export async function createEvangelismRecord(record: Omit<EvangelismRecord, 'id'>): Promise<string> {
  const recordId = 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newRecord: EvangelismRecord = {
    ...record,
    id: recordId,
    createdAt: new Date().toISOString()
  };

  // Optimistically update local cache
  const cached = getCachedRecords();
  const updated = [newRecord, ...cached.filter((r) => r.id !== recordId)];
  setCachedRecords(updated);

  try {
    const docRef = doc(db, COLLECTION_NAME, recordId);
    await setDoc(docRef, {
      fullName: record.fullName.trim(),
      phone: record.phone.trim(),
      programs: record.programs,
      isNewConvert: Boolean(record.isNewConvert),
      respondedWell: Boolean(record.respondedWell),
      notes: record.notes ? record.notes.trim() : '',
      evangelistName: record.evangelistName.trim(),
      date: record.date,
      followedUp: Boolean(record.followedUp),
      followUpNotes: record.followUpNotes ? record.followUpNotes.trim() : '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return recordId;
  } catch (err) {
    console.error('Failed to write record to Firestore:', err);
    try {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${recordId}`);
    } catch {
      // Re-throw
    }
    return recordId;
  }
}

/**
 * Updates an existing record
 */
export async function updateEvangelismRecord(
  id: string,
  updates: Partial<Omit<EvangelismRecord, 'id'>>
): Promise<void> {
  const cached = getCachedRecords();
  const updated = cached.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item));
  setCachedRecords(updated);

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const firestoreUpdates: Record<string, unknown> = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    await updateDoc(docRef, firestoreUpdates);
  } catch (err) {
    console.error(`Failed to update record ${id}:`, err);
    try {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    } catch {
      // Re-throw
    }
  }
}

/**
 * Deletes a record
 */
export async function deleteEvangelismRecord(id: string): Promise<void> {
  const cached = getCachedRecords();
  const updated = cached.filter((item) => item.id !== id);
  setCachedRecords(updated);

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Failed to delete record ${id}:`, err);
    try {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    } catch {
      // Re-throw
    }
  }
}

/**
 * Computes dashboard statistics from records
 */
export function calculateDashboardStats(records: EvangelismRecord[]): DashboardStats {
  const programCounts: Record<ChurchProgram, number> = {
    'Wednesday Program': 0,
    'Friday Program': 0,
    'Auxano': 0,
    'Sunday Service': 0
  };

  let totalNewConverts = 0;
  let totalRespondedWell = 0;
  let totalFollowedUp = 0;

  for (const record of records) {
    if (record.isNewConvert) totalNewConverts++;
    if (record.respondedWell) totalRespondedWell++;
    if (record.followedUp) totalFollowedUp++;

    if (Array.isArray(record.programs)) {
      for (const p of record.programs) {
        if (programCounts[p] !== undefined) {
          programCounts[p]++;
        }
      }
    }
  }

  return {
    totalRecords: records.length,
    totalNewConverts,
    totalRespondedWell,
    totalFollowedUp,
    programCounts
  };
}
