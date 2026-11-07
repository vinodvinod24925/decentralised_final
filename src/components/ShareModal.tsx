import React, { useState, useEffect } from 'react';
import { Share2, X, Users, User, Clock, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { DeShareFile, Group } from '../types.ts';
import { api } from '../api.ts';

interface ShareModalProps {
  file: DeShareFile | null;
  isOpen: boolean;
  onClose: () => void;
  onShared: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  file,
  isOpen,
  onClose,
  onShared
}) => {
  const [shareType, setShareType] = useState<'group' | 'direct'>('group');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [expiryHours, setExpiryHours] = useState<number>(72);
  const [delegationDepth, setDelegationDepth] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getGroups().then(res => {
        setGroups(res.groups);
        if (res.groups.length > 0) {
          setSelectedGroupId(res.groups[0].id);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen || !file) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (shareType === 'group') {
        if (!selectedGroupId) {
          setError('Please select a group.');
          setLoading(false);
          return;
        }
        const res = await api.shareFile(file.id, {
          groupId: selectedGroupId,
          expiryHours,
          delegationDepth
        });
        setSuccessMsg(res.message);
      } else {
        if (!recipientEmail) {
          setError('Please enter recipient email or wallet.');
          setLoading(false);
          return;
        }
        const res = await api.shareFile(file.id, {
          recipientEmail,
          expiryHours,
          delegationDepth
        });
        setSuccessMsg(res.message);
      }
      onShared();
    } catch (err: any) {
      setError(err.message || 'Failed to share file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Share File with PRE Access Delegation</h3>
            <p className="text-xs text-slate-400 truncate max-w-sm">{file.name}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-emerald-200 mb-1">
                  Access Granted & PRE Re-Encryption Key Provisioned
                </div>
                <div>{successMsg}</div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleShare} className="space-y-4">
            {/* Share Type Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setShareType('group')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                  shareType === 'group'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Authorized Group
              </button>
              <button
                type="button"
                onClick={() => setShareType('direct')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                  shareType === 'direct'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Direct Recipient
              </button>
            </div>

            {shareType === 'group' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select Group
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.memberCount || 1} members)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Recipient Email or Wallet Address
                </label>
                <input
                  type="text"
                  placeholder="bob.davis@deshare.io or 0x..."
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>
            )}

            {/* Expiry and Delegation Depth Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                  Access Expiration
                </label>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>1 Hour</option>
                  <option value={24}>24 Hours</option>
                  <option value={72}>72 Hours (3 Days)</option>
                  <option value={168}>7 Days</option>
                  <option value={720}>30 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  <Key className="w-3 h-3 inline mr-1 text-slate-400" />
                  PRE Delegation Depth
                </label>
                <select
                  value={delegationDepth}
                  onChange={(e) => setDelegationDepth(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>Depth 1 (Single-Hop)</option>
                  <option value={2}>Depth 2 (Two-Hop)</option>
                  <option value={3}>Depth 3 (Max Limit)</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="text-slate-300 font-semibold">Proxy Re-Encryption Workflow:</div>
              <div>• Owner generates re-encryption key rk_A→B without exposing private key sk_A.</div>
              <div>• Recipient can decrypt transformed capsule using their own private key sk_B.</div>
              <div>• Smart contract enforces block.timestamp &lt;= expiry on-chain.</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors"
              >
                {loading ? 'Generating PRE Keys...' : 'Grant Access On-Chain'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
