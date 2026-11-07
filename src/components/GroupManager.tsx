import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Trash2, Plus, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Group } from '../types.ts';
import { api } from '../api.ts';

export const GroupManager: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.getGroups();
      setGroups(res.groups);
      if (res.groups.length > 0 && !selectedGroup) {
        loadGroupDetail(res.groups[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDetail = async (groupId: string) => {
    try {
      const res = await api.getGroup(groupId);
      setSelectedGroup(res.group);
    } catch (err: any) {
      setError(err.message || 'Failed to load group details');
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;
    try {
      const res = await api.createGroup(newGroupName, newGroupDesc);
      setCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setSuccess(`Group '${res.group.name}' created successfully`);
      fetchGroups();
      loadGroupDetail(res.group.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !addMemberEmail) return;
    try {
      const res = await api.addGroupMember(selectedGroup.id, { email: addMemberEmail });
      setSuccess(res.message);
      setAddMemberEmail('');
      loadGroupDetail(selectedGroup.id);
      fetchGroups();
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;
    if (!confirm('Are you sure you want to remove this member from the group?')) return;
    try {
      await api.removeGroupMember(selectedGroup.id, userId);
      setSuccess('Member removed successfully');
      loadGroupDetail(selectedGroup.id);
      fetchGroups();
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Groups & Role-Based Access Control</h2>
          <p className="text-xs text-slate-400">
            Manage authorized teams, cryptographic member lists, and multi-tenant file sharing ACLs
          </p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" />
          Create New Group
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Main Grid: Groups List (Left) and Group Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Groups Navigation */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Your Access Groups ({groups.length})
          </div>
          <div className="space-y-2">
            {groups.map((g) => {
              const isSelected = selectedGroup?.id === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => loadGroupDetail(g.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500/50 shadow-md'
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200 text-xs truncate max-w-[180px]">
                      {g.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {g.memberCount} members
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {g.description || 'No description provided.'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Group Deep View */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{selectedGroup.name}</h3>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    ID: {selectedGroup.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedGroup.description}</p>
              </div>

              {/* Add Member Bar */}
              <form onSubmit={handleAddMember} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Invite user by email (e.g. member@deshare.io)..."
                  value={addMemberEmail}
                  onChange={(e) => setAddMemberEmail(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                />
                <button
                  type="submit"
                  disabled={!addMemberEmail}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Member
                </button>
              </form>

              {/* Members Table */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Authorized Cryptographic Members ({selectedGroup.members?.length || 0})</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Proxy Re-Encryption material distributed automatically
                  </span>
                </div>

                <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Member Name & Email</th>
                        <th className="py-2.5 px-3">On-Chain Wallet</th>
                        <th className="py-2.5 px-3">Group Role</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {selectedGroup.members?.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-200">{m.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{m.email}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                            {m.walletAddress.slice(0, 8)}...{m.walletAddress.slice(-6)}
                          </td>
                          <td className="py-2.5 px-3">
                            {m.isOwner ? (
                              <span className="text-emerald-400 font-semibold text-[11px]">Owner</span>
                            ) : m.isAdmin ? (
                              <span className="text-sky-400 font-medium text-[11px]">Admin</span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Member</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {!m.isOwner && (
                              <button
                                onClick={() => handleRemoveMember(m.id)}
                                className="text-rose-400 hover:text-rose-300 p-1 rounded"
                                title="Remove Member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Files Shared with this Group */}
              <div className="border-t border-slate-800 pt-4">
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Files Shared with this Group ({selectedGroup.sharedFiles?.length || 0})
                </div>
                {selectedGroup.sharedFiles && selectedGroup.sharedFiles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedGroup.sharedFiles.map((sf) => (
                      <div key={sf.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-slate-200 font-medium truncate">{sf.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">{sf.currentCid}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                          v{sf.version}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">
                    No files shared with this group yet. Use the Share button on any file to grant group access.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
              Select a group from the left to view details and manage members.
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create Access Group</h3>
                <p className="text-xs text-slate-400">Owner-managed multi-tenant delegation</p>
              </div>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Legal & Compliance Review"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  placeholder="Brief description of group purpose..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 h-20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
