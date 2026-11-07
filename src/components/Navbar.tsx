import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Key, UserCheck, RefreshCw, Copy, Check } from 'lucide-react';
import { User } from '../types.ts';
import { api, setActiveUserId, getActiveUserId } from '../api.ts';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onUserChanged: (user: User) => void;
  unreadAlertsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onUserChanged,
  unreadAlertsCount
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [copied, setCopied] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  useEffect(() => {
    api.getUsers().then(res => setUsers(res.users)).catch(console.error);
  }, []);

  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await api.switchUser(userId);
      onUserChanged(res.user);
      setShowPersonaMenu(false);
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  const copyWallet = () => {
    if (currentUser?.walletAddress) {
      navigator.clipboard.writeText(currentUser.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'files', label: 'File Management' },
    { id: 'groups', label: 'Groups & Teams' },
    {
      id: 'security',
      label: 'Security Center',
      alertBadge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined
    },
    { id: 'blockchain', label: 'Audit & Blockchain' },
    { id: 'tests', label: 'Automated Test Suite' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element, no pill badge attachments) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Shield className="w-4 h-4" />
          </div>
          <a
            href="#dashboard"
            onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap"
          >
            DeShare
          </a>
          <span className="hidden sm:inline text-xs text-slate-500 font-medium">
            Decentralized Secure File Sharing
          </span>
        </div>

        {/* Zone 2: Navigation Links (Single line, whitespace-nowrap, anti-pill clean text) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative py-1 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
                {item.alertBadge && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {item.alertBadge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-emerald-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Active User & Role Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div className="text-left">
                <div className="font-semibold text-slate-200 truncate max-w-[140px]">
                  {currentUser?.name || 'Loading...'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {currentUser?.role === 'owner' ? 'File Owner & Security Lead' : 'Authorized Recipient'}
                </div>
              </div>
              <RefreshCw className="w-3 h-3 text-slate-400 ml-1" />
            </button>

            {/* Persona Switcher Dropdown */}
            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-2 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Switch Active Persona
                </div>
                {users.map((u) => {
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

                <div className="border-t border-slate-800 mt-2 pt-2 px-3">
                  <div className="text-[11px] text-slate-400 mb-1">Your On-Chain Wallet:</div>
                  <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="font-mono text-[10px] text-slate-300 truncate max-w-[180px]">
                      {currentUser?.walletAddress}
                    </span>
                    <button
                      onClick={copyWallet}
                      className="text-slate-400 hover:text-slate-200 p-1 rounded"
                      title="Copy Address"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-800 gap-4 text-xs font-medium text-slate-300">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap py-1 ${
              activeTab === item.id ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400' : 'text-slate-400'
            }`}
          >
            {item.label}
            {item.alertBadge && ` (${item.alertBadge})`}
          </button>
        ))}
      </div>
    </header>
  );
};
