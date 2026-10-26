import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { EvangelismRecord, DashboardStats, ChurchProgram, RemovedWorker } from '../types';
import { compareDatesDesc } from '../utils/dateUtils';

const COLLECTION_NAME = 'records';
const REMOVED_WORKERS_COLLECTION = 'removedWorkers';

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
  if (!workerUid || !auth.currentUser) {
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
            isEstablished: Boolean(data.isEstablished),
            establishedAt: data.establishedAt || '',
            followUpNotes: data.followUpNotes || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          });
        });

        // Sort newest first by normalized date comparison
        list.sort((a, b) => compareDatesDesc(a.date, b.date, a.createdAt, b.createdAt));

        setCachedRecords(workerUid, list);
        onSuccess(list);
      },
      (error) => {
        // If the user signed out, auth.currentUser is null; ignore expected listener teardown
        if (!auth.currentUser) {
          return;
        }
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
    isEstablished: Boolean(record.isEstablished),
    establishedAt: record.establishedAt || '',
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
      isEstablished: Boolean(record.isEstablished),
      establishedAt: record.establishedAt || '',
      followUpNotes: record.followUpNotes ? record.followUpNotes.trim() : '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return recordId;
  } catch (err) {
    console.error('Failed to write record to Firestore:', err);
    // Rollback cache
    const current = getCachedRecords(workerUid);
    setCachedRecords(workerUid, current.filter((r) => r.id !== recordId));
    try {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${recordId}`);
    } catch {
      // Handled
    }
    throw err;
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

  const previousCache = getCachedRecords(workerUid);
  const updated = previousCache.map((item) =>
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
    // Rollback cache
    setCachedRecords(workerUid, previousCache);
    try {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    } catch {
      // Handled
    }
    throw err;
  }
}

/**
 * Deletes a record owned by the authenticated worker
 */
export async function deleteEvangelismRecord(workerUid: string, id: string): Promise<void> {
  if (!workerUid) {
    throw new Error('You must be signed in to delete records.');
  }

  const previousCache = getCachedRecords(workerUid);
  const updated = previousCache.filter((item) => item.id !== id);
  setCachedRecords(workerUid, updated);

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Failed to delete record ${id}:`, err);
    // Rollback cache
    setCachedRecords(workerUid, previousCache);
    try {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    } catch {
      // Handled
    }
    throw err;
  }
}

/**
 * Verifies admin rights by performing an admin-scoped probe read against the records collection.
 * Non-admin users are rejected by security rules and return false.
 */
export async function verifyAdminAccess(): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    const recordsCol = collection(db, COLLECTION_NAME);
    const q = query(recordsCol, limit(1));
    await getDocs(q);
    return true;
  } catch (err) {
    console.warn('Admin verification check:', err);
    return false;
  }
}

/**
 * Subscribes to all records across all workers for authenticated Admins.
 */
export function subscribeToAllRecordsForAdmin(
  onSuccess: (records: EvangelismRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!auth.currentUser) {
    onSuccess([]);
    return () => {};
  }

  try {
    const recordsCol = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      recordsCol,
      (snapshot) => {
        const list: EvangelismRecord[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            workerUid: data.workerUid || '',
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
            isEstablished: Boolean(data.isEstablished),
            establishedAt: data.establishedAt || '',
            followUpNotes: data.followUpNotes || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          });
        });

        list.sort((a, b) => compareDatesDesc(a.date, b.date, a.createdAt, b.createdAt));
        onSuccess(list);
      },
      (error) => {
        // If the user signed out, auth.currentUser is null; ignore expected listener teardown
        if (!auth.currentUser) {
          return;
        }
        console.warn('Firestore snapshot error for admin records:', error);
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
    console.warn('Failed to attach admin Firestore listener:', err);
    return () => {};
  }
}

/**
 * Admin update: allows admin to edit any record as long as workerUid remains unchanged.
 */
export async function updateRecordAsAdmin(
  id: string,
  updates: Partial<Omit<EvangelismRecord, 'id' | 'workerUid'>>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const firestoreUpdates: Record<string, unknown> = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    await updateDoc(docRef, firestoreUpdates);
  } catch (err) {
    console.error(`Admin failed to update record ${id}:`, err);
    try {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    } catch {
      // Handled
    }
    throw err;
  }
}

/**
 * Admin delete: allows admin to delete any record with confirmation.
 */
export async function deleteRecordAsAdmin(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Admin failed to delete record ${id}:`, err);
    try {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    } catch {
      // Handled
    }
    throw err;
  }
}

/**
 * Checks if a worker's account has been removed by an admin.
 * Evaluates removedWorkers/{workerUid}.
 */
export async function checkIfWorkerRemoved(workerUid: string): Promise<boolean> {
  if (!workerUid || !auth.currentUser) return false;
  try {
    const docRef = doc(db, REMOVED_WORKERS_COLLECTION, workerUid);
    const snap = await getDoc(docRef);
    return snap.exists();
  } catch (err) {
    console.warn('Check worker removed status check:', err);
    return false;
  }
}

/**
 * Subscribes to removedWorkers collection for Admin Console.
 */
export function subscribeToRemovedWorkers(
  onSuccess: (removed: RemovedWorker[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!auth.currentUser) {
    onSuccess([]);
    return () => {};
  }

  try {
    const colRef = collection(db, REMOVED_WORKERS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: RemovedWorker[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            workerUid: docSnap.id,
            workerEmail: data.workerEmail || '',
            workerName: data.workerName || '',
            removedAt: data.removedAt || '',
            removedBy: data.removedBy || ''
          });
        });
        onSuccess(list);
      },
      (error) => {
        if (!auth.currentUser) {
          return;
        }
        console.warn('Firestore removedWorkers subscription error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach removedWorkers listener:', err);
    return () => {};
  }
}

/**
 * Deletes records in chunks of up to 500 operations per Firestore writeBatch.
 */
export async function batchDeleteRecords(recordIds: string[]): Promise<void> {
  const BATCH_SIZE = 500;
  for (let i = 0; i < recordIds.length; i += BATCH_SIZE) {
    const chunk = recordIds.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.delete(doc(db, COLLECTION_NAME, id));
    }
    await batch.commit();
  }
}

/**
 * Removes one or more church workers:
 * - Writes removedWorkers/{workerUid} documents to block access
 * - Optionally deletes worker records in batches of up to 500
 */
export async function removeWorkers(
  adminEmailOrUid: string,
  workers: { workerUid: string; workerEmail?: string; workerName?: string }[],
  deleteRecords: boolean,
  recordsToDelete?: EvangelismRecord[]
): Promise<void> {
  if (!workers || workers.length === 0) return;

  const nowIso = new Date().toISOString();

  // 1. Create document in removedWorkers/{workerUid} for each worker
  for (const worker of workers) {
    const docRef = doc(db, REMOVED_WORKERS_COLLECTION, worker.workerUid);
    await setDoc(docRef, {
      workerUid: worker.workerUid,
      workerEmail: worker.workerEmail || '',
      workerName: worker.workerName || '',
      removedAt: nowIso,
      removedBy: adminEmailOrUid
    });
  }

  // 2. If deleteRecords is checked, delete their records in batches of up to 500
  if (deleteRecords && recordsToDelete && recordsToDelete.length > 0) {
    const targetUids = new Set(workers.map((w) => w.workerUid));
    const idsToDelete = recordsToDelete
      .filter((r) => r.id && targetUids.has(r.workerUid))
      .map((r) => r.id as string);

    if (idsToDelete.length > 0) {
      await batchDeleteRecords(idsToDelete);
    }
  }
}

/**
 * Restores worker access by deleting the removedWorkers/{workerUid} document.
 */
export async function restoreWorkerAccess(workerUid: string): Promise<void> {
  if (!workerUid) return;
  const docRef = doc(db, REMOVED_WORKERS_COLLECTION, workerUid);
  await deleteDoc(docRef);
}

/**
 * Computes dashboard statistics from records
 * Note: Established people leave the pending filter and pending counts, but stay in total counts.
 */
export function calculateDashboardStats(records: EvangelismRecord[]): DashboardStats {
  const programCounts: Record<ChurchProgram, number> = {
    'Sunday Service': 0,
    'Wednesday Program/Joint Auxano': 0,
    'Friday Program/Something New': 0,
    'School Auxano': 0
  };

  let totalNewConverts = 0;
  let totalRespondedWell = 0;
  let totalFollowedUp = 0;
  let totalEstablished = 0;
  let pendingFollowUp = 0;

  for (const record of records) {
    if (record.isEstablished) {
      totalEstablished++;
    } else if (!record.followedUp) {
      pendingFollowUp++;
    }

    if (record.isNewConvert) totalNewConverts++;
    if (record.respondedWell) totalRespondedWell++;
    if (record.followedUp) totalFollowedUp++;

    if (Array.isArray(record.programs)) {
      for (const rawP of record.programs) {
        let p: ChurchProgram | undefined;
        if (rawP === 'Sunday Service') p = 'Sunday Service';
        else if (rawP === 'Wednesday Program/Joint Auxano' || rawP === 'Wednesday Program / Joint Auxano') p = 'Wednesday Program/Joint Auxano';
        else if (rawP === 'Friday Program/Something New' || rawP === 'Friday Program / Something New') p = 'Friday Program/Something New';
        else if (rawP === 'School Auxano') p = 'School Auxano';

        if (p && programCounts[p] !== undefined) {
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
    totalEstablished,
    pendingFollowUp,
    programCounts
  };
}
