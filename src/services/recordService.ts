import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { EvangelismRecord, DashboardStats, ChurchProgram } from '../types';

const COLLECTION_NAME = 'records';

function getStorageKey(workerUid: string): string {
  return `glm_evangelism_records_cache_v3_${workerUid}`;
}

function getCachedRecords(workerUid: string): EvangelismRecord[] {
  if (!workerUid) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(workerUid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((r) => r.workerUid === workerUid);
      }
    }
  } catch (e) {
    console.warn('Could not read records cache', e);
  }
  return [];
}

function setCachedRecords(workerUid: string, records: EvangelismRecord[]): void {
  if (!workerUid) return;
  try {
    localStorage.setItem(getStorageKey(workerUid), JSON.stringify(records));
  } catch (e) {
    console.warn('Could not save records to cache', e);
  }
}

/**
 * Subscribes to records collection in Firestore, strictly scoped to the signed-in worker UID.
 * Enforces database-level isolation.
 */
export function subscribeToWorkerRecords(
  workerUid: string | null,
  onSuccess: (records: EvangelismRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!workerUid) {
    onSuccess([]);
    return () => {};
  }

  // Emit worker's cached records immediately
  const cached = getCachedRecords(workerUid);
  onSuccess(cached);

  try {
    const recordsCol = collection(db, COLLECTION_NAME);
    // Strict query matching the security rule: where('workerUid', '==', workerUid)
    const q = query(recordsCol, where('workerUid', '==', workerUid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: EvangelismRecord[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            workerUid: data.workerUid || workerUid,
            workerEmail: data.workerEmail || '',
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

        // Sort newest first by date or creation time
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        setCachedRecords(workerUid, list);
        onSuccess(list);
      },
      (error) => {
        console.warn('Firestore snapshot error for worker records:', error);
        if (onError) onError(error);
        try {
          handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
        } catch {
          // Handled
        }
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach worker Firestore listener:', err);
    return () => {};
  }
}

/**
 * Creates a new evangelism record owned by the authenticated worker
 */
export async function createEvangelismRecord(
  workerUid: string,
  workerEmail: string | undefined,
  record: Omit<EvangelismRecord, 'id' | 'workerUid' | 'workerEmail'>
): Promise<string> {
  if (!workerUid) {
    throw new Error('You must be signed in to save evangelism records.');
  }

  const recordId = 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newRecord: EvangelismRecord = {
    ...record,
    id: recordId,
    workerUid,
    workerEmail: workerEmail || '',
    createdAt: new Date().toISOString()
  };

  // Optimistically update worker local cache
  const cached = getCachedRecords(workerUid);
  const updated = [newRecord, ...cached.filter((r) => r.id !== recordId)];
  setCachedRecords(workerUid, updated);

  try {
    const docRef = doc(db, COLLECTION_NAME, recordId);
    await setDoc(docRef, {
      workerUid,
      workerEmail: workerEmail || '',
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
 * Updates an existing record owned by the authenticated worker
 */
export async function updateEvangelismRecord(
  workerUid: string,
  id: string,
  updates: Partial<Omit<EvangelismRecord, 'id' | 'workerUid'>>
): Promise<void> {
  if (!workerUid) {
    throw new Error('You must be signed in to update records.');
  }

  const cached = getCachedRecords(workerUid);
  const updated = cached.map((item) =>
    item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
  );
  setCachedRecords(workerUid, updated);

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
 * Deletes a record owned by the authenticated worker
 */
export async function deleteEvangelismRecord(workerUid: string, id: string): Promise<void> {
  if (!workerUid) {
    throw new Error('You must be signed in to delete records.');
  }

  const cached = getCachedRecords(workerUid);
  const updated = cached.filter((item) => item.id !== id);
  setCachedRecords(workerUid, updated);

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
