import React from 'react';
import {
  Shield,
  LayoutDashboard,
  UserCheck,
  Upload,
  FileText,
  Users,
  Share2,
  KeyRound,
  ShieldAlert,
  Terminal,
  Database,
  User,
  Award,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  unreadAlertsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  userRole: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  unreadAlertsCount,
  isOpenMobile,
  onCloseMobile,
  userRole,
  onLogout
}) => {
  const navSections = [
    {
      title: 'DASHBOARDS',
      items: [
        { id: 'owner-dashboard', label: 'Owner Dashboard', icon: LayoutDashboard },
        { id: 'user-dashboard', label: 'User Dashboard', icon: UserCheck }
      ]
    },
    {
      title: 'FILE OPERATIONS',
      items: [
        { id: 'file-upload', label: 'Upload & Encrypt', icon: Upload },
        { id: 'files', label: 'File Management', icon: FileText }
      ]
    },
    {
      title: 'ACCESS & TEAMS',
      items: [
        { id: 'groups', label: 'Groups & Teams', icon: Users },
        { id: 'sharing-permissions', label: 'Sharing & Grants', icon: Share2 },
        { id: 'delegation', label: 'PRE Delegation', icon: KeyRound }
      ]
    },
    {
      title: 'SECURITY INTELLIGENCE',
      items: [
        {
          id: 'security-center',
          label: 'Security Center',
          icon: ShieldAlert,
          badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined
        },
        { id: 'attack-simulator', label: 'Attack Simulator', icon: Terminal },
        { id: 'blockchain', label: 'Audit & Blockchain', icon: Database }
      ]
    },
    {
      title: 'SYSTEM & SETTINGS',
      items: [
        { id: 'profile-settings', label: 'Profile & Wallet', icon: User },
        { id: 'tests', label: 'Verification Suite', icon: Award }
      ]
    }
  ];

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Lockup */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">DeShare</span>
              <span className="block text-[10px] text-slate-500 font-mono">Decentralized Secure File Sharing</span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-slate-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {section.title}
              </div>
              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Profile / Logout Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2 truncate">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <div className="text-left truncate">
                <span className="block text-xs font-semibold text-slate-300 truncate">
                  {userRole === 'owner' ? 'Alice Chen' : 'Active User'}
                </span>
                <span className="block text-[10px] text-slate-500 font-mono truncate">
                  {userRole === 'owner' ? 'Security Lead' : 'Auditor / Member'}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
