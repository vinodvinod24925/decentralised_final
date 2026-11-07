import React, { useState } from 'react';
import {
  FileText,
  Users,
  Unlock,
  KeyRound,
  Shield,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { DeShareFile, User, Group } from '../types.ts';
import { api } from '../api.ts';

interface UserDashboardProps {
  currentUser: User | null;
  files: DeShareFile[];
  groups: Group[];
  onRefresh: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  files,
  groups,
  onRefresh
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [decryptedModal, setDecryptedModal] = useState<any | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Filter files that are shared with user or accessible to user
  const userFiles = files.filter(f => !f.isOwner || f.sharedGroupIds.length > 0);
  const myGroups = groups.filter(g => g.memberIds?.includes(currentUser?.id || '') || g.ownerId === currentUser?.id);

  const handleDownloadAndDecrypt = async (file: DeShareFile) => {
    setDownloadingId(file.id);
    setErrorModal(null);
    try {
      const res = await api.downloadAndDecryptFile(file.id);
      setDecryptedModal(res);
    } catch (err: any) {
      setErrorModal(err.message || 'Decryption failed or access was denied');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Strip */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{currentUser?.name || 'Member Workspace'}</h1>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              {currentUser?.email} · {currentUser?.role === 'owner' ? 'Security Lead' : 'Authorized Auditor'}
            </div>
          </div>
        </div>

        <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
          <div className="text-slate-500 text-[10px]">Your Dedicated On-Chain Wallet:</div>
          <div className="text-emerald-400 truncate max-w-xs">{currentUser?.walletAddress}</div>
        </div>
      </div>

      {errorModal && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-200">Access Denied</div>
              <div>{errorModal}</div>
            </div>
          </div>
          <button onClick={() => setErrorModal(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid: Accessible Files & Group Memberships */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Accessible Files */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Shared Files Accessible to You ({userFiles.length})
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Proxy Re-Encryption Enabled
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">IPFS CID</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {userFiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No files shared with your account yet.
                    </td>
                  </tr>
                ) : (
                  userFiles.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-200 truncate max-w-[160px]">{f.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">v{f.currentVersion}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-[120px]">
                        {f.owner.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-400 truncate max-w-[130px]">
                        {f.currentCid}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {formatBytes(f.size)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDownloadAndDecrypt(f)}
                          disabled={downloadingId === f.id}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Unlock className="w-3 h-3" />
                          {downloadingId === f.id ? 'Decrypting...' : 'Decrypt & View'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Group Memberships */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            Your Group Memberships ({myGroups.length})
          </h2>

          <div className="space-y-2.5">
            {myGroups.map((g) => (
              <div key={g.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                <div className="font-semibold text-slate-200">{g.name}</div>
                <div className="text-[11px] text-slate-400 line-clamp-2">{g.description}</div>
                <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800 flex justify-between">
                  <span>Members: {g.memberCount || g.members?.length || 1}</span>
                  <span className="text-emerald-400">Authorized ACL</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decrypted File Viewer Modal */}
      {decryptedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setDecryptedModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cryptographic Decryption Successful</h3>
                <p className="text-xs text-slate-400">
                  Decrypted using your private key via Proxy Re-Encryption ({decryptedModal.authType})
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1 mb-4 font-mono">
              <div>File: <strong className="text-slate-200">{decryptedModal.fileName}</strong></div>
              <div className="text-[11px] text-emerald-400 break-all">CID: {decryptedModal.currentCid}</div>
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-300 mb-1.5">Plaintext Content:</div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-56 overflow-y-auto font-mono text-xs text-slate-200 whitespace-pre-wrap">
                {(() => {
                  try {
                    return atob(decryptedModal.decryptedContentBase64);
                  } catch {
                    return '[Binary content decrypted successfully]';
                  }
                })()}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <a
                href={`data:${decryptedModal.mimeType};base64,${decryptedModal.decryptedContentBase64}`}
                download={decryptedModal.fileName}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Plaintext
              </a>
              <button
                onClick={() => setDecryptedModal(null)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
