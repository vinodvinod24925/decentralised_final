import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Shield,
  ArrowRight,
  Database,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { api } from '../api.ts';

export const DelegationPage: React.FC = () => {
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGrants = async () => {
    setLoading(true);
    try {
      const res = await api.getGrants();
      setGrants(res.grants);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrants();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            Proxy Re-Encryption (PRE) Delegation Architecture
          </h1>
          <p className="text-xs text-slate-400">
            Elliptic curve BBS98 delegation protocol enabling untrusted proxies to transform capsules without learning plaintext
          </p>
        </div>

        <button
          onClick={fetchGrants}
          disabled={loading}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Material
        </button>
      </div>

      {/* Visual Pipeline Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl">
        <h2 className="text-sm font-bold text-white">How BBS98 Proxy Re-Encryption Works in DeShare</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Step 1: Encapsulation */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              1
            </div>
            <div className="font-semibold text-emerald-300">1. Key Encapsulation</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Alice (Owner) encrypts the file with AES-256 key <code className="text-slate-200">K</code>, then encapsulates <code className="text-slate-200">K</code> under her public key <code className="text-slate-200">pk_A</code> into capsule <code className="text-slate-200">C = (R, C_K)</code>.
            </p>
          </div>

          {/* Step 2: Delegation Token */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              2
            </div>
            <div className="font-semibold text-indigo-300">2. Re-Encryption Key</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              When granting access to Bob, Alice derives point-to-point re-encryption key <code className="text-slate-200">rk_A→B</code> using her private key <code className="text-slate-200">sk_A</code> and Bob's public key <code className="text-slate-200">pk_B</code>.
            </p>
          </div>

          {/* Step 3: Untrusted Proxy Transform */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              3
            </div>
            <div className="font-semibold text-amber-300">3. Proxy Transformation</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              The storage proxy transforms capsule <code className="text-slate-200">C → C'</code> using <code className="text-slate-200">rk_A→B</code>. The proxy NEVER learns <code className="text-slate-200">K</code>, <code className="text-slate-200">sk_A</code>, or <code className="text-slate-200">sk_B</code>.
            </p>
          </div>

          {/* Step 4: Decapsulation */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              4
            </div>
            <div className="font-semibold text-emerald-300">4. Recipient Decryption</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Bob decapsulates <code className="text-slate-200">C'</code> using his private key <code className="text-slate-200">sk_B</code> to recover AES key <code className="text-slate-200">K</code>, and decrypts the IPFS payload.
            </p>
          </div>
        </div>

        {/* Multi-Hop Rule Box */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
          <div>
            <span className="font-semibold text-slate-200">Multi-Hop Delegation Cap: </span>
            <span className="text-slate-400">Strictly enforced maximum depth of 3 hops (Alice → Bob → Charlie → David). Hops beyond depth 3 revert on-chain.</span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            Depth Limit: 3
          </span>
        </div>
      </div>

      {/* Live Re-Encryption Material Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white">Active Re-Encryption Key Tokens ({grants.length})</h2>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Target File</th>
                <th className="py-2.5 px-3">Recipient Identity</th>
                <th className="py-2.5 px-3">Delegation Depth</th>
                <th className="py-2.5 px-3">Re-Encryption Key Hash</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
              {grants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                    No active PRE delegations provisioned yet.
                  </td>
                </tr>
              ) : (
                grants.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                      {g.fileName}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      {g.recipient?.name || g.groupName || 'Group Grant'}
                    </td>
                    <td className="py-2.5 px-3">Depth {g.delegationDepth} / 3</td>
                    <td className="py-2.5 px-3 text-emerald-400 truncate max-w-[180px]">
                      {g.reKeyHex ? `${g.reKeyHex.slice(0, 16)}...${g.reKeyHex.slice(-8)}` : 'Derived via Group ACL'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-sans ${
                        g.status === 'active' ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-500 bg-slate-950'
                      }`}>
                        {g.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
