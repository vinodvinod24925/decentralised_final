import React, { useState, useEffect } from 'react';
import { Database, HardDrive, Shield, CheckCircle2, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { BlockchainTransaction } from '../types.ts';
import { api } from '../api.ts';

export const BlockchainAudit: React.FC = () => {
  const [chainStatus, setChainStatus] = useState<any | null>(null);
  const [ipfsStatus, setIpfsStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const [chainRes, ipfsRes] = await Promise.all([
        api.getBlockchainStatus(),
        api.getIpfsStatus()
      ]);
      setChainStatus(chainRes);
      setIpfsStatus(ipfsRes);
    } catch (err) {
      console.error('Failed to load ledger status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(text);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Blockchain & Decentralized Storage Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Real-time on-chain transaction verification and Kubo IPFS content-addressed blockstore
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Ledger
        </button>
      </div>

      {/* Network Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Smart Contract Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Shield className="w-4 h-4 text-emerald-400" />
              Smart Contract Access Registry
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              Chain #{chainStatus?.chainId || 31337}
            </span>
          </div>

          <div className="text-xs space-y-2 font-mono">
            <div>
              <span className="text-slate-500 block text-[11px]">Contract Address:</span>
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800/80 text-emerald-300 break-all select-all text-[11px]">
                <span>{chainStatus?.contractAddress}</span>
                <button
                  onClick={() => copyToClipboard(chainStatus?.contractAddress || '')}
                  className="text-slate-400 hover:text-slate-200 ml-2"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex justify-between text-slate-400 text-xs">
              <span>Current Block Height:</span>
              <span className="text-slate-200 font-bold">#{chainStatus?.currentBlock}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-xs">
              <span>Solidity Spec:</span>
              <span className="text-slate-300">DeShareAccessRegistry.sol (v0.8.20)</span>
            </div>
          </div>
        </div>

        {/* IPFS Node Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <HardDrive className="w-4 h-4 text-amber-400" />
              Local Kubo IPFS Node
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
              {ipfsStatus?.node || 'Kubo Node'}
            </span>
          </div>

          <div className="text-xs space-y-2 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Total Content-Addressed Blocks:</span>
              <span className="text-slate-200 font-bold">{ipfsStatus?.metrics?.totalBlocks || 0}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Pinned Objects:</span>
              <span className="text-emerald-400 font-bold">{ipfsStatus?.metrics?.totalPinned || 0}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Repository Volume:</span>
              <span className="text-slate-200 font-bold">
                {formatBytes(ipfsStatus?.metrics?.totalBytes || 0)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-sans border-t border-slate-800/80 pt-1.5 mt-1.5">
              Strict cryptographic verification: Content hash checked on every retrieval.
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          Recent Smart Contract Transactions ({chainStatus?.transactions?.length || 0})
        </h3>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Tx Hash</th>
                <th className="py-2.5 px-3">Block</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Gas Used</th>
                <th className="py-2.5 px-3">Emitted Events</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
              {(!chainStatus?.transactions || chainStatus.transactions.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                chainStatus.transactions.map((tx: BlockchainTransaction) => (
                  <tr key={tx.txHash} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-mono truncate max-w-[120px]">
                          {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tx.txHash)}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          {copiedTx === tx.txHash ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">#{tx.blockNumber}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-slate-200 font-semibold">{tx.method}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{tx.gasUsed}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {tx.events?.map(e => e.name).join(', ') || 'None'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-emerald-400 font-semibold text-[10px]">
                        {tx.status}
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
