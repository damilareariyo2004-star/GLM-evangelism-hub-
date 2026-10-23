/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { AddPersonForm } from './components/AddPersonForm';
import { RecordsList } from './components/RecordsList';
import { RecordDetailModal } from './components/RecordDetailModal';
import { WorkerAuthModal } from './components/WorkerAuthModal';
import { ExportReportModal } from './components/ExportReportModal';
import { SermonSharing } from './components/SermonSharing';
import {
  subscribeToWorkerRecords,
  createEvangelismRecord,
  updateEvangelismRecord,
  deleteEvangelismRecord,
  calculateDashboardStats
} from './services/recordService';
import { auth, testConnection } from './firebase';
import { EvangelismRecord, DashboardStats } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [records, setRecords] = useState<EvangelismRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<EvangelismRecord | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Test Firebase connection on mount
  useEffect(() => {
    testConnection().catch((err) => {
      console.warn('Initial Firestore ping note:', err);
    });
  }, []);

  // Listen to Firebase Authentication state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Real-time Firestore subscription strictly scoped to the signed-in worker UID
  useEffect(() => {
    if (!currentUser) {
      setRecords([]);
      return;
    }

    const unsubscribeRecords = subscribeToWorkerRecords(
      currentUser.uid,
      (updatedRecords) => {
        setRecords(updatedRecords);
      },
      (err) => {
        console.warn('Worker records listener notice:', err);
      }
    );

    return () => {
      unsubscribeRecords();
    };
  }, [currentUser]);

  // Compute live stats for current worker
  const stats: DashboardStats = calculateDashboardStats(records);

  const handleCreateRecord = async (
    recordData: Omit<EvangelismRecord, 'id' | 'workerUid' | 'workerEmail'>
  ): Promise<string> => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      throw new Error('Please sign in to your church worker account to save outreach records.');
    }
    const newId = await createEvangelismRecord(
      currentUser.uid,
      currentUser.email || undefined,
      recordData
    );
    return newId;
  };

  const handleUpdateRecord = async (
    id: string,
    updates: Partial<Omit<EvangelismRecord, 'id' | 'workerUid'>>
  ) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      throw new Error('Please sign in with your worker account.');
    }
    await updateEvangelismRecord(currentUser.uid, id, updates);
    setSelectedRecord((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
  };

  const handleDeleteRecord = async (id: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      throw new Error('Please sign in with your worker account.');
    }
    await deleteEvangelismRecord(currentUser.uid, id);
    setSelectedRecord(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-orange-100 selection:text-orange-900">
      {/* Header with Church Logo & Worker Sign In / Profile */}
      <Header
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
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
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onNavigateToAdd={() => setCurrentTab('add')}
            onNavigateToRecords={() => setCurrentTab('records')}
            onNavigateToSermons={() => setCurrentTab('sermons')}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onSelectRecord={(rec) => {
              if (currentUser) {
                setSelectedRecord(rec);
              } else {
                setIsAuthModalOpen(true);
              }
            }}
          />
        )}

        {currentTab === 'add' && (
          <AddPersonForm
            existingRecords={records}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSubmitRecord={handleCreateRecord}
            onNavigateToRecords={() => setCurrentTab('records')}
            onNavigateToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'records' && (
          <RecordsList
            records={records}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSelectRecord={(rec) => setSelectedRecord(rec)}
            onNavigateToAdd={() => setCurrentTab('add')}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {currentTab === 'sermons' && (
          <SermonSharing
            records={records}
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        )}
      </main>

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        records={records}
      />

      {/* Record Detail Modal */}
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onUpdateRecord={handleUpdateRecord}
          onDeleteRecord={handleDeleteRecord}
        />
      )}

      {/* Worker Firebase Auth Modal (Google & Email/Password) */}
      <WorkerAuthModal
        isOpen={isAuthModalOpen}
        currentUser={currentUser}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
