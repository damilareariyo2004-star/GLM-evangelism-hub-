/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { AddPersonForm } from './components/AddPersonForm';
import { RecordsList } from './components/RecordsList';
import { RecordDetailModal } from './components/RecordDetailModal';
import { AdminLockModal } from './components/AdminLockModal';
import {
  subscribeToRecords,
  createEvangelismRecord,
  updateEvangelismRecord,
  deleteEvangelismRecord,
  calculateDashboardStats
} from './services/recordService';
import { testConnection } from './firebase';
import { EvangelismRecord, DashboardStats } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [records, setRecords] = useState<EvangelismRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<EvangelismRecord | null>(null);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isWorkerUnlocked, setIsWorkerUnlocked] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('glm_worker_unlocked') === 'true' ||
        sessionStorage.getItem('glm_worker_unlocked') === 'true'
      );
    } catch {
      return false;
    }
  });

  // Test Firebase connection on mount
  useEffect(() => {
    testConnection().catch((err) => {
      console.warn('Initial Firestore ping note:', err);
    });
  }, []);

  // Subscribe to real-time records from Firestore (starting empty)
  useEffect(() => {
    const unsubscribe = subscribeToRecords((updatedRecords) => {
      setRecords(updatedRecords);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Compute live stats
  const stats: DashboardStats = calculateDashboardStats(records);

  const handleToggleWorkerAuth = () => {
    if (isWorkerUnlocked) {
      // Lock worker mode
      try {
        localStorage.removeItem('glm_worker_unlocked');
        sessionStorage.removeItem('glm_worker_unlocked');
      } catch {
        // ignore
      }
      setIsWorkerUnlocked(false);
    } else {
      // Open login modal
      setIsWorkerModalOpen(true);
    }
  };

  const handleCreateRecord = async (recordData: Omit<EvangelismRecord, 'id'>): Promise<string> => {
    const newId = await createEvangelismRecord(recordData);
    return newId;
  };

  const handleUpdateRecord = async (id: string, updates: Partial<Omit<EvangelismRecord, 'id'>>) => {
    await updateEvangelismRecord(id, updates);
    setSelectedRecord((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
  };

  const handleDeleteRecord = async (id: string) => {
    await deleteEvangelismRecord(id);
    setSelectedRecord(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-orange-100 selection:text-orange-900">
      {/* Header */}
      <Header
        isWorkerUnlocked={isWorkerUnlocked}
        onToggleWorkerAuth={handleToggleWorkerAuth}
        recordsCount={records.length}
      />

      {/* Navigation (Tabs for desktop + tab bar on mobile) */}
      <Navigation
        currentTab={currentTab}
        onChangeTab={(tab) => setCurrentTab(tab)}
        recordsCount={records.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5 sm:py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            recentRecords={records}
            onNavigateToAdd={() => setCurrentTab('add')}
            onNavigateToRecords={() => setCurrentTab('records')}
            onSelectRecord={(rec) => {
              if (isWorkerUnlocked) {
                setSelectedRecord(rec);
              } else {
                setIsWorkerModalOpen(true);
              }
            }}
            isWorkerUnlocked={isWorkerUnlocked}
            onUnlockWorker={() => setIsWorkerModalOpen(true)}
          />
        )}

        {currentTab === 'add' && (
          <AddPersonForm
            existingRecords={records}
            onSubmitRecord={handleCreateRecord}
            onNavigateToRecords={() => setCurrentTab('records')}
            onNavigateToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'records' && (
          <RecordsList
            records={records}
            isWorkerUnlocked={isWorkerUnlocked}
            onUnlockWorker={() => setIsWorkerModalOpen(true)}
            onSelectRecord={(rec) => setSelectedRecord(rec)}
            onNavigateToAdd={() => setCurrentTab('add')}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
          />
        )}
      </main>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onUpdateRecord={handleUpdateRecord}
          onDeleteRecord={handleDeleteRecord}
        />
      )}

      {/* Admin Worker Passcode Modal */}
      <AdminLockModal
        isOpen={isWorkerModalOpen}
        onClose={() => setIsWorkerModalOpen(false)}
        onSuccessUnlock={() => setIsWorkerUnlocked(true)}
      />
    </div>
  );
}
