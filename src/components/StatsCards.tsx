import React from 'react';
import { FileText, Share2, Users, KeyRound, ShieldAlert, Database, HardDrive, AlertTriangle } from 'lucide-react';
import { DashboardStats } from '../types.ts';

interface StatsCardsProps {
  stats: DashboardStats | null;
  onNavigateSecurity: () => void;
  onNavigateFiles: () => void;
  onNavigateGroups: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  onNavigateSecurity,
  onNavigateFiles,
  onNavigateGroups
}) => {
  if (!stats) return null;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const cards = [
    {
      title: 'Uploaded Files',
      value: stats.totalUploadedFiles,
      subtitle: `${stats.totalSharedFiles} files shared`,
      icon: FileText,
      color: 'text-emerald-400',
      action: onNavigateFiles
    },
    {
      title: 'Active Groups',
      value: stats.totalGroups,
      subtitle: 'Owner-managed ACLs',
      icon: Users,
      color: 'text-sky-400',
      action: onNavigateGroups
    },
    {
      title: 'Access Grants',
      value: stats.activeGrants,
      subtitle: `${stats.revokedOrExpiredGrants} revoked or expired`,
      icon: KeyRound,
      color: 'text-indigo-400',
      action: onNavigateFiles
    },
    {
      title: 'Security Alerts',
      value: stats.unreadAlerts,
      subtitle: `${stats.totalSecurityEvents} total security events`,
      icon: ShieldAlert,
      color: stats.unreadAlerts > 0 ? 'text-rose-400' : 'text-slate-400',
      action: onNavigateSecurity,
      highlight: stats.unreadAlerts > 0
    },
    {
      title: 'IPFS Content Stored',
      value: formatBytes(stats.ipfsStats?.totalBytes || 0),
      subtitle: `${stats.ipfsStats?.totalPinned || 0} pinned CID blocks`,
      icon: HardDrive,
      color: 'text-amber-400',
      action: onNavigateFiles
    },
    {
      title: 'On-Chain Ledger',
      value: stats.blockchainTransactions,
      subtitle: 'Hardhat chain #31337',
      icon: Database,
      color: 'text-emerald-400',
      action: onNavigateSecurity
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <button
            key={i}
            onClick={c.action}
            className={`text-left p-4 rounded-xl border transition-all ${
              c.highlight
                ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700/60'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">{c.title}</span>
              <Icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight text-white mb-1">
              {c.value}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {c.subtitle}
            </div>
          </button>
        );
      })}
    </div>
  );
};
