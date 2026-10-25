/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { ShieldAlert } from 'lucide-react';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { AddPersonForm } from './components/AddPersonForm';
import { RecordsList } from './components/RecordsList';
import { RecordDetailModal } from './components/RecordDetailModal';
import { WorkerAuthModal } from './components/WorkerAuthModal';
import { ExportReportModal } from './components/ExportReportModal';
import { SermonSharing } from './components/SermonSharing';
import { WelcomeSplashScreen } from './components/WelcomeSplashScreen';
import { AdminPortal } from './components/AdminPortal';
import {
  subscribeToWorkerRecords,
  subscribeToAllRecordsForAdmin,
  createEvangelismRecord,
  updateEvangelismRecord,
  deleteEvangelismRecord,
  updateRecordAsAdmin,
  deleteRecordAsAdmin,
  calculateDashboardStats,
  checkIfWorkerRemoved
} from './services/recordService';
import { auth, testConnection } from './firebase';
import { EvangelismRecord, DashboardStats } from './types';

export default function App() {
  const [showWelcomeSplash, setShowWelcomeSplash] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' ? !sessionStorage.getItem('glm_welcome_screen_seen') : false;
    } catch {
      return false;
    }
  });

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [records, setRecords] = useState<EvangelismRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<EvangelismRecord | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [removedWorkerNotice, setRemovedWorkerNotice] = useState<string | null>(null);

  // Test Firebase connection on mount
  useEffect(() => {
    testConnection().catch((err) => {
      console.warn('Initial Firestore ping note:', err);
    });
  }, []);

  // Listen to Firebase Authentication state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Enforce removed worker restriction
        const isRemoved = await checkIfWorkerRemoved(user.uid);
        if (isRemoved) {
          await signOut(auth);
          setCurrentUser(null);
          setIsAdminMode(false);
          setRemovedWorkerNotice('Your access has been removed. Please contact your admin.');
          return;
        }
      }
      setCurrentUser(user);
      if (!user) {
        setIsAdminMode(false);
      }
    });
    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Real-time Firestore subscription (scoped to worker UID, or all records in Admin mode)
  useEffect(() => {
    if (!currentUser) {
      setRecords([]);
      return;
    }

    if (isAdminMode) {
      const unsubscribeAdmin = subscribeToAllRecordsForAdmin(
        (updatedRecords) => {
          setRecords(updatedRecords);
        },
        (err) => {
          console.warn('Admin records listener note:', err);
        }
      );
      return () => {
        unsubscribeAdmin();
      };
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
  }, [currentUser, isAdminMode]);

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
      throw new Error('Please sign in to update records.');
    }
    if (isAdminMode) {
      await updateRecordAsAdmin(id, updates);
    } else {
      await updateEvangelismRecord(currentUser.uid, id, updates);
    }
    setSelectedRecord((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
  };

  const handleDeleteRecord = async (id: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      throw new Error('Please sign in to delete records.');
    }
    if (isAdminMode) {
      await deleteRecordAsAdmin(id);
    } else {
      await deleteEvangelismRecord(currentUser.uid, id);
    }
    setSelectedRecord(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-orange-100 selection:text-orange-900">
      {/* First-time Animated Welcome Screen */}
      {showWelcomeSplash && (
        <WelcomeSplashScreen onDismiss={() => setShowWelcomeSplash(false)} />
      )}

      {/* Header with Church Logo & Worker / Admin Profile */}
      <Header
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        recordsCount={records.length}
        isAdminMode={isAdminMode}
        onExitAdmin={() => setIsAdminMode(false)}
      />

      {/* Navigation (Tabs for workers; hidden in Admin mode) */}
      {!isAdminMode && (
        <Navigation
          currentTab={currentTab}
          onChangeTab={(tab) => setCurrentTab(tab)}
          recordsCount={records.length}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5 sm:py-6">
        {isAdminMode ? (
          <AdminPortal
            currentUser={currentUser}
            records={records}
            onSelectRecord={(rec) => setSelectedRecord(rec)}
            onExitAdmin={() => setIsAdminMode(false)}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
          />
        ) : (
          <>
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
          </>
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
          currentUser={currentUser}
          isAdmin={isAdminMode}
          onClose={() => setSelectedRecord(null)}
          onUpdateRecord={handleUpdateRecord}
          onDeleteRecord={handleDeleteRecord}
        />
      )}

      {/* Worker Firebase Auth Modal (Google, Email/Password & Admin Sign In) */}
      <WorkerAuthModal
        isOpen={isAuthModalOpen}
        currentUser={currentUser}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAdminMode(false);
          setIsAuthModalOpen(false);
        }}
        onAdminSuccess={(adminUser) => {
          setCurrentUser(adminUser);
          setIsAdminMode(true);
          setIsAuthModalOpen(false);
        }}
      />

      {/* Removed Worker Access Notice Modal */}
      {removedWorkerNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                {removedWorkerNotice}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRemovedWorkerNotice(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
