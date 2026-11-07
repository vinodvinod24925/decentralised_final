import React, { useState, useEffect } from 'react';
import {
  Share2,
  KeyRound,
  Clock,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Lock
} from 'lucide-react';
import { api } from '../api.ts';

export const SharingPermissionsPage: React.FC = () => {
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'revoked' | 'expired'>('all');
  const [search, setSearch] = useState('');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchGrants = async () => {
    setLoading(true);
    try {
      const res = await api.getGrants();
      setGrants(res.grants);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch grants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrants();
  }, []);

  const handleRevoke = async (grant: any) => {
    if (!confirm(`Are you sure you want to revoke access to '${grant.fileName}' for ${grant.recipient?.name || grant.groupName}?`)) {
      return;
    }

    setRevokingId(grant.id);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.revokeAccess(grant.fileId, {
        recipientId: grant.recipient?.id,
        groupId: grant.groupId
      });
      setSuccess(res.message || 'Access revoked on-chain');
      fetchGrants();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke access');
    } finally {
      setRevokingId(null);
    }
  };

  const filteredGrants = grants.filter(g => {
    const matchesFilter = filter === 'all' || g.status === filter;
    const matchesSearch =
      g.fileName?.toLowerCase().includes(search.toLowerCase()) ||
      g.recipient?.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.recipient?.email?.toLowerCase().includes(search.toLowerCase()) ||
      g.groupName?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-400" />
            Sharing & Permissions Management
          </h1>
          <p className="text-xs text-slate-400">
            Audit and enforce cryptographic access grants, temporal expirations, and smart-contract revocations
          </p>
        </div>

        <button
          onClick={fetchGrants}
          disabled={loading}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Grants
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300">
          {success}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by file name, recipient, or group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {(['all', 'active', 'revoked', 'expired'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                filter === st
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grants Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Target File</th>
              <th className="py-2.5 px-3">Grantee (Recipient / Group)</th>
              <th className="py-2.5 px-3">PRE Delegation Depth</th>
              <th className="py-2.5 px-3">Expiration Date</th>
              <th className="py-2.5 px-3">Grant Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredGrants.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  No access grants matching your query.
                </td>
              </tr>
            ) : (
              filteredGrants.map((g) => (
                <tr key={g.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-200">{g.fileName}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                      {g.fileCid}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    {g.recipient ? (
                      <div>
                        <div className="text-slate-200 font-medium">{g.recipient.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{g.recipient.email}</div>
                      </div>
                    ) : g.groupName ? (
                      <div className="text-indigo-400 font-medium">{g.groupName}</div>
                    ) : (
                      <span className="text-slate-500 font-mono">Public Access</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    Depth {g.delegationDepth} / 3
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {new Date(g.expiryTimestamp * 1000).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        g.status === 'active'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : g.status === 'revoked'
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {g.status === 'active' ? (
                      <button
                        onClick={() => handleRevoke(g)}
                        disabled={revokingId === g.id}
                        className="px-2.5 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-[11px] font-semibold transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                        {revokingId === g.id ? 'Revoking...' : 'Revoke'}
                      </button>
                    ) : (
                      <span className="text-slate-600 text-[11px] italic">Inaccessible</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
