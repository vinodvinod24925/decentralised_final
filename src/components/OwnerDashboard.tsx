import React from 'react';
import {
  FileText,
  Share2,
  Users,
  ShieldAlert,
  ArrowRight,
  HardDrive,
  Database,
  Lock,
  Play,
  KeyRound,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { StatsCards } from './StatsCards.tsx';
import { FileList } from './FileList.tsx';
import { DeShareFile, DashboardStats, OwnerAlert } from '../types.ts';

interface OwnerDashboardProps {
  stats: DashboardStats | null;
  files: DeShareFile[];
  alerts: OwnerAlert[];
  onNavigate: (page: string) => void;
  onFileShared: () => void;
  onOpenUpload: () => void;
  onShareClick: (file: DeShareFile) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  stats,
  files,
  alerts,
  onNavigate,
  onFileShared,
  onOpenUpload,
  onShareClick
}) => {
  const unreadAlerts = alerts.filter(a => !a.isRead);

  return (
    <div className="space-y-8">
      {/* Welcome & Primary Actions Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Security Lead & Repository Owner Console
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            System Security & Access Governance Overview
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Centralized monitoring for AES-256-GCM encrypted IPFS repositories, smart contract access registries, and proxy re-encryption delegation pipelines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenUpload}
            className="px-4 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-emerald-950/40"
          >
            <Lock className="w-3.5 h-3.5" />
            Upload New File
          </button>
          <button
            onClick={() => onNavigate('attack-simulator')}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-rose-950/40"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Launch Attack Simulator
          </button>
        </div>
      </div>

      {/* High-Density Statistical Cards */}
      <StatsCards
        stats={stats}
        onNavigateFiles={() => onNavigate('files')}
        onNavigateGroups={() => onNavigate('groups')}
        onNavigateSecurity={() => onNavigate('security-center')}
      />

      {/* Unread Security Alerts Alert Box if any */}
      {unreadAlerts.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-xs text-rose-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-semibold text-rose-200">
                {unreadAlerts.length} Unread Intrusion Alert(s) Detected
              </span>
              <span className="block text-[11px] text-rose-400/90 mt-0.5">
                Unauthorized access attempts intercepted. Automatic key rotation and new IPFS CID generated.
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('security-center')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap"
          >
            Inspect Alerts
          </button>
        </div>
      )}

      {/* Network & Infrastructure Health Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Decentralized Storage Node</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white">Kubo IPFS Engine</div>
          <div className="text-[11px] text-slate-500 font-mono">
            {stats?.ipfsStats?.totalBlocks || 0} Blocks · Content Addressed · Pinned
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Smart Contract Registry</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-white">DeShareAccessRegistry</div>
          <div className="text-[11px] text-slate-500 font-mono">
            Chain #31337 · Contract: 0x5FbD...aa3
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Delegation Cryptography</span>
            <KeyRound className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-white">BBS98 Proxy Re-Encryption</div>
          <div className="text-[11px] text-slate-500 font-mono">
            prime256v1 · Max Depth: 3 Hops
          </div>
        </div>
      </div>

      {/* Managed Files Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Managed Repository Files</h2>
            <p className="text-xs text-slate-400">
              AES-256-GCM encrypted payloads stored on IPFS with verifiable CIDs
            </p>
          </div>
          <button
            onClick={() => onNavigate('files')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            All Files Table
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <FileList
          files={files}
          onFileShared={onFileShared}
          onOpenUpload={onOpenUpload}
          onShareClick={onShareClick}
        />
      </div>
    </div>
  );
};
