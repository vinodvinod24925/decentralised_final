import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { AuthScreen } from './components/AuthScreen.tsx';
import { OwnerDashboard } from './components/OwnerDashboard.tsx';
import { UserDashboard } from './components/UserDashboard.tsx';
import { FileUploadPage } from './components/FileUploadPage.tsx';
import { FileList } from './components/FileList.tsx';
import { GroupManager } from './components/GroupManager.tsx';
import { SharingPermissionsPage } from './components/SharingPermissionsPage.tsx';
import { DelegationPage } from './components/DelegationPage.tsx';
import { SecurityCenter } from './components/SecurityCenter.tsx';
import { BlockchainAudit } from './components/BlockchainAudit.tsx';
import { TestRunner } from './components/TestRunner.tsx';
import { ProfileSettingsPage } from './components/ProfileSettingsPage.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { FileUploadModal } from './components/FileUploadModal.tsx';
import { User, DeShareFile, Group, DashboardStats, OwnerAlert } from './types.ts';
import { api, setActiveUserId } from './api.ts';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('owner-dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [files, setFiles] = useState<DeShareFile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [alerts, setAlerts] = useState<OwnerAlert[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sharingFile, setSharingFile] = useState<DeShareFile | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [meRes, filesRes, groupsRes, alertsRes, statsRes] = await Promise.all([
        api.getMe(),
        api.getFiles(),
        api.getGroups(),
        api.getOwnerAlerts(),
        api.getDashboardStats()
      ]);
      setCurrentUser(meRes);
      setFiles(filesRes.files);
      setGroups(groupsRes.groups);
      setAlerts(alertsRes.alerts);
      setStats(statsRes);
      setIsAuthenticated(true);
    } catch (err) {
      console.warn('Initial session fetch: unauthenticated or reset');
      // If no valid session, prompt auth
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAuthenticated = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    loadData();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const handleUserChanged = (user: User) => {
    setCurrentUser(user);
    loadData();
  };

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        unreadAlertsCount={stats?.unreadAlerts || alerts.filter(a => !a.isRead).length}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        userRole={currentUser?.role || 'member'}
        onLogout={handleLogout}
      />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          currentPage={currentPage}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          currentUser={currentUser}
          onUserChanged={handleUserChanged}
          unreadAlertsCount={stats?.unreadAlerts || alerts.filter(a => !a.isRead).length}
          onNavigateSecurity={() => setCurrentPage('security-center')}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'owner-dashboard' && (
            <OwnerDashboard
              stats={stats}
              files={files}
              alerts={alerts}
              onNavigate={setCurrentPage}
              onFileShared={loadData}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onShareClick={(f) => setSharingFile(f)}
            />
          )}

          {currentPage === 'user-dashboard' && (
            <UserDashboard
              currentUser={currentUser}
              files={files}
              groups={groups}
              onRefresh={loadData}
            />
          )}

          {currentPage === 'file-upload' && (
            <FileUploadPage
              onUploaded={loadData}
              onNavigateFiles={() => setCurrentPage('files')}
            />
          )}

          {currentPage === 'files' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-white">File Management</h1>
                <p className="text-xs text-slate-400">
                  Search, inspect IPFS CIDs, unwrap PRE capsules, and manage granular file access permissions
                </p>
              </div>
              <FileList
                files={files}
                onFileShared={loadData}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                onShareClick={(f) => setSharingFile(f)}
              />
            </div>
          )}

          {currentPage === 'groups' && <GroupManager />}

          {currentPage === 'sharing-permissions' && <SharingPermissionsPage />}

          {currentPage === 'delegation' && <DelegationPage />}

          {(currentPage === 'security-center' || currentPage === 'attack-simulator') && (
            <SecurityCenter
              files={files}
              onAttackCompleted={loadData}
            />
          )}

          {currentPage === 'blockchain' && <BlockchainAudit />}

          {currentPage === 'profile-settings' && (
            <ProfileSettingsPage
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          )}

          {currentPage === 'tests' && <TestRunner />}
        </main>
      </div>

      {/* Reusable Modals */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploaded={() => {
          setIsUploadModalOpen(false);
          loadData();
        }}
      />

      <ShareModal
        file={sharingFile}
        isOpen={Boolean(sharingFile)}
        onClose={() => setSharingFile(null)}
        onShared={() => {
          setSharingFile(null);
          loadData();
        }}
      />
    </div>
  );
}
