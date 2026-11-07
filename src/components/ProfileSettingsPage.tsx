import React, { useState } from 'react';
import {
  User as UserIcon,
  Key,
  Shield,
  Copy,
  Check,
  Database,
  HardDrive,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { User } from '../types.ts';

interface ProfileSettingsPageProps {
  currentUser: User | null;
  onLogout: () => void;
}

export const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({
  currentUser,
  onLogout
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-emerald-400" />
          Profile & Cryptographic Wallet Settings
        </h1>
        <p className="text-xs text-slate-400">
          Manage your decentralized identity, Ethereum wallet address, and Proxy Re-Encryption public keys
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-white">Identity & Role</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 font-sans">Full Name:</span>
            <div className="text-slate-200 font-bold font-sans text-sm">{currentUser?.name}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 font-sans">Email Address:</span>
            <div className="text-slate-200">{currentUser?.email}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 font-sans">Access Tier:</span>
            <div className="text-emerald-400 font-bold uppercase font-sans">
              {currentUser?.role === 'owner' ? 'Security Lead / Owner' : 'Auditor / Member'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 font-sans">User ID:</span>
            <div className="text-slate-400 text-[11px]">{currentUser?.id}</div>
          </div>
        </div>
      </div>

      {/* On-Chain Wallet Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            Provisioned On-Chain Ethereum Wallet
          </h2>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            Chain #31337 (Local EVM)
          </span>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div>
            <span className="text-slate-500 text-[11px] block mb-1 font-sans">Public Wallet Address (EVM):</span>
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-400 select-all break-all">
              <span>{currentUser?.walletAddress}</span>
              <button
                onClick={() => copyToClipboard(currentUser?.walletAddress || '', 'wallet')}
                className="text-slate-400 hover:text-white ml-2 p-1 rounded"
              >
                {copiedKey === 'wallet' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-slate-400 font-sans text-xs pt-1">
            <span>Testnet Balance:</span>
            <span className="text-slate-200 font-mono font-bold">100.00 ETH (Hardhat Local)</span>
          </div>
        </div>
      </div>

      {/* Proxy Re-Encryption Public Key */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            BBS98 Proxy Re-Encryption Public Key
          </h2>
          <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
            prime256v1 Curve
          </span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <span className="text-slate-500 text-[11px] block font-sans">Public Ephemeral Key Material:</span>
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 select-all break-all text-[11px]">
            <span>{currentUser?.prePublicKey}</span>
            <button
              onClick={() => copyToClipboard(currentUser?.prePublicKey || '', 'preKey')}
              className="text-slate-400 hover:text-white ml-2 p-1 rounded"
            >
              {copiedKey === 'preKey' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 font-sans mt-1">
            Used by file owners to generate transformed capsules for your account without exposing private keys.
          </p>
        </div>
      </div>

      {/* Danger / Logout Zone */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Sign Out of Session</h2>
          <p className="text-xs text-slate-400">Clear stored session token and return to authentication screen</p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-xl transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};
