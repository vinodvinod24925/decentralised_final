import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Copy,
  Check,
  Shield,
  RefreshCw,
  LogOut,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { User } from '../types.ts';
import { api } from '../api.ts';

interface HeaderProps {
  currentPage: string;
  onOpenMobileSidebar: () => void;
  currentUser: User | null;
  onUserChanged: (user: User) => void;
  unreadAlertsCount: number;
  onNavigateSecurity: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenMobileSidebar,
  currentUser,
  onUserChanged,
  unreadAlertsCount,
  onNavigateSecurity,
  onLogout
}) => {
  const [copied, setCopied] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const pageNames: Record<string, { section: string; title: string }> = {
    'owner-dashboard': { section: 'Dashboards', title: 'Owner Dashboard' },
    'user-dashboard': { section: 'Dashboards', title: 'User Dashboard' },
    'file-upload': { section: 'File Operations', title: 'Upload & Encrypt' },
    'files': { section: 'File Operations', title: 'File Management' },
    'groups': { section: 'Access & Teams', title: 'Groups & Teams' },
    'sharing-permissions': { section: 'Access & Teams', title: 'Sharing & Grants' },
    'delegation': { section: 'Access & Teams', title: 'PRE Delegation' },
    'security-center': { section: 'Security Intelligence', title: 'Security Center' },
    'attack-simulator': { section: 'Security Intelligence', title: 'Attack Simulator' },
    'blockchain': { section: 'Security Intelligence', title: 'Audit & Blockchain' },
    'profile-settings': { section: 'System & Settings', title: 'Profile & Wallet' },
    'tests': { section: 'System & Settings', title: 'Verification Suite' }
  };

  const currentMeta = pageNames[currentPage] || { section: 'Workspace', title: currentPage };

  const copyWallet = () => {
    if (currentUser?.walletAddress) {
      navigator.clipboard.writeText(currentUser.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenPersonaMenu = async () => {
    setShowPersonaMenu(!showPersonaMenu);
    if (!showPersonaMenu) {
      try {
        const res = await api.getUsers();
        setAllUsers(res.users);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await api.switchUser(userId);
      onUserChanged(res.user);
      setShowPersonaMenu(false);
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Toggle & Contextual Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Trail */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span>DeShare</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span>{currentMeta.section}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-100 font-semibold">{currentMeta.title}</span>
        </div>
        <div className="sm:hidden text-xs font-semibold text-slate-100">
          {currentMeta.title}
        </div>
      </div>

      {/* Right Controls: Wallet, Notification Bell, Persona Switcher */}
      <div className="flex items-center gap-3">
        {/* On-Chain Wallet Pill */}
        {currentUser?.walletAddress && (
          <div className="hidden md:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-slate-300 text-[11px]">
              {currentUser.walletAddress.slice(0, 6)}...{currentUser.walletAddress.slice(-4)}
            </span>
            <button
              onClick={copyWallet}
              className="text-slate-500 hover:text-slate-300 p-0.5"
              title="Copy Wallet Address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Notifications Icon with Unread Count */}
        <button
          onClick={onNavigateSecurity}
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Security Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
          )}
        </button>

        {/* Persona Switcher / Profile Dropdown */}
        <div className="relative">
          <button
            onClick={handleOpenPersonaMenu}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px]">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="font-semibold truncate max-w-[110px]">{currentUser?.name || 'User'}</div>
              <div className="text-[10px] text-slate-400 font-mono capitalize">{currentUser?.role || 'member'}</div>
            </div>
            <RefreshCw className="w-3 h-3 text-slate-400 ml-1" />
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                Switch Identity Context
              </div>
              <div className="max-h-56 overflow-y-auto">
                {allUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSwitchUser(u.id)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        isCurrent ? 'bg-slate-800/60 text-emerald-400' : 'text-slate-300 hover:bg-slate-800/40'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-200">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[190px]">
                          {u.email}
                        </div>
                      </div>
                      {isCurrent && <UserCheck className="w-4 h-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-800 mt-2 pt-2 px-3">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 py-1.5 text-xs text-rose-400 hover:text-rose-300"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
