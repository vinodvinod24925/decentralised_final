import React, { useState } from 'react';
import {
  FileText,
  Download,
  Share2,
  History,
  Copy,
  Check,
  Shield,
  Eye,
  Lock,
  Unlock,
  AlertCircle,
  FileCheck2,
  Trash2,
  X
} from 'lucide-react';
import { DeShareFile, FileDetail } from '../types.ts';
import { api } from '../api.ts';

interface FileListProps {
  files: DeShareFile[];
  onFileShared: () => void;
  onOpenUpload: () => void;
  onShareClick: (file: DeShareFile) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onFileShared,
  onOpenUpload,
  onShareClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCid, setCopiedCid] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [decryptedModal, setDecryptedModal] = useState<any | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [versionDrawerFile, setVersionDrawerFile] = useState<FileDetail | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCid(text);
    setTimeout(() => setCopiedCid(null), 2000);
  };

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

  const handleInspectVersions = async (fileId: string) => {
    try {
      const res = await api.getFile(fileId);
      setVersionDrawerFile(res.file);
    } catch (err: any) {
      setErrorModal(err.message || 'Failed to fetch file versions');
    }
  };

  const handleRevoke = async (fileId: string, recipientId?: string, groupId?: string) => {
    if (!confirm('Are you sure you want to revoke this access grant?')) return;
    try {
      await api.revokeAccess(fileId, { recipientId, groupId });
      onFileShared();
      if (versionDrawerFile) {
        handleInspectVersions(fileId);
      }
    } catch (err: any) {
      setErrorModal(err.message || 'Failed to revoke access');
    }
  };

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.currentCid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.owner.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Search and Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by file name, IPFS CID, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
          />
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Lock className="w-3.5 h-3.5" />
            Upload & Encrypt New File
          </button>
        </div>
      </div>

      {/* Error Alert Modal if Download Denied */}
      {errorModal && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-200 mb-0.5">Access Denied by Security Protocol</div>
              <div>{errorModal}</div>
            </div>
          </div>
          <button
            onClick={() => setErrorModal(null)}
            className="text-rose-400 hover:text-rose-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Files Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">IPFS CID (Content Hash)</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">File Owner</th>
                <th className="py-3 px-4">Sharing ACL</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <div>No files found matching your query.</div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      Upload your first encrypted file to IPFS to begin.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5 font-medium text-slate-200">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate max-w-[200px]" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {formatBytes(file.size)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80 max-w-[190px]">
                        <span className="truncate" title={file.currentCid}>
                          {file.currentCid}
                        </span>
                        <button
                          onClick={() => copyToClipboard(file.currentCid)}
                          className="text-slate-400 hover:text-slate-200 p-0.5 rounded shrink-0"
                          title="Copy CID"
                        >
                          {copiedCid === file.currentCid ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <span className="text-xs text-slate-300 font-semibold">
                        v{file.currentVersion}
                      </span>
                      {file.versionsCount > 1 && (
                        <span className="ml-1 text-[10px] text-amber-400">
                          ({file.versionsCount} rotated)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-300 truncate max-w-[130px]" title={file.owner.name}>
                        {file.owner.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[130px]">
                        {file.isOwner ? '(You)' : file.owner.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {file.sharedGroupIds.length > 0 ? (
                        <span className="text-[11px] text-indigo-400 font-medium">
                          {file.sharedGroupIds.length} Group(s)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Private</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownloadAndDecrypt(file)}
                          disabled={downloadingId === file.id}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                          title="Download from IPFS and Decrypt with PRE Key"
                        >
                          <Unlock className="w-3 h-3" />
                          {downloadingId === file.id ? 'Decrypting...' : 'Decrypt'}
                        </button>

                        {file.isOwner && (
                          <button
                            onClick={() => onShareClick(file)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                            title="Share with Group or User"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleInspectVersions(file.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          title="Inspect CID Version History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decrypted File Viewer Modal */}
      {decryptedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setDecryptedModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cryptographic Decryption Successful</h3>
                <p className="text-xs text-slate-400">
                  Retrieved via IPFS · Authenticated with AES-256-GCM · Authorized via {decryptedModal.authType}
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2 mb-4">
              <div className="flex justify-between items-center text-slate-400">
                <span>File Name: <strong className="text-slate-200">{decryptedModal.fileName}</strong></span>
                <span>Version: <strong className="text-emerald-400">v{decryptedModal.currentVersion}</strong></span>
              </div>
              <div className="font-mono text-[11px] text-slate-400 break-all">
                IPFS CID: <span className="text-emerald-400">{decryptedModal.currentCid}</span>
              </div>
            </div>

            {/* Plaintext Preview */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-300 mb-1.5">
                Decrypted Plaintext Preview:
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-60 overflow-y-auto font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {(() => {
                  try {
                    return atob(decryptedModal.decryptedContentBase64);
                  } catch {
                    return '[Binary Content Successfully Decrypted - Ready for Local Download]';
                  }
                })()}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-500">
                Content hash verified against IPFS CID. Zero tampering detected.
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`data:${decryptedModal.mimeType};base64,${decryptedModal.decryptedContentBase64}`}
                  download={decryptedModal.fileName}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save Plaintext File
                </a>
                <button
                  onClick={() => setDecryptedModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version History Drawer Modal */}
      {versionDrawerFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setVersionDrawerFile(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Immutable IPFS Version Ledger</h3>
                <p className="text-xs text-slate-400 truncate max-w-sm">{versionDrawerFile.name}</p>
              </div>
            </div>

            <div className="text-xs text-slate-400 mb-3">
              Because IPFS uses content addressing, every security re-encryption generates a genuine new CID. Previous CIDs remain permanently recorded:
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto mb-4">
              {versionDrawerFile.versions.map((v) => (
                <div
                  key={v.version}
                  className={`p-3 rounded-xl border text-xs ${
                    v.version === versionDrawerFile.currentVersion
                      ? 'bg-slate-950 border-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200">
                      Version {v.version} {v.version === versionDrawerFile.currentVersion && '(Active Current)'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(v.createdAt).toLocaleTimeString()} · {new Date(v.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-emerald-400 break-all select-all">
                    {v.cid}
                  </div>
                  {v.rotationReason && (
                    <div className="mt-1 text-[11px] text-amber-400/90 italic">
                      Trigger: {v.rotationReason}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Active Grants on this file */}
            {versionDrawerFile.isOwner && versionDrawerFile.grants.length > 0 && (
              <div className="border-t border-slate-800 pt-3">
                <div className="text-xs font-semibold text-slate-300 mb-2">Active Access Grants:</div>
                <div className="space-y-1.5 text-xs">
                  {versionDrawerFile.grants.map((g) => (
                    <div key={g.id} className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800/80">
                      <div>
                        <div className="text-slate-200 font-medium">{g.recipient?.name || 'Group Member'}</div>
                        <div className="text-[10px] text-slate-500">
                          Expires: {new Date(g.expiryTimestamp * 1000).toLocaleString()} · Depth: {g.delegationDepth}
                        </div>
                      </div>
                      {g.status === 'active' && (
                        <button
                          onClick={() => handleRevoke(versionDrawerFile.id, g.recipient?.id, g.groupId)}
                          className="text-[11px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-950/30 border border-rose-900/50"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setVersionDrawerFile(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
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
