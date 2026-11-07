import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCw,
  Copy,
  Check,
  ArrowRight,
  Database,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { DeShareFile, OwnerAlert, SecurityEvent } from '../types.ts';
import { api } from '../api.ts';

interface SecurityCenterProps {
  files: DeShareFile[];
  onAttackCompleted: () => void;
}

export const SecurityCenter: React.FC<SecurityCenterProps> = ({
  files,
  onAttackCompleted
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [attackerIdentity, setAttackerIdentity] = useState<string>('simulated_hacker');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simulationReport, setSimulationReport] = useState<any | null>(null);
  const [alerts, setAlerts] = useState<OwnerAlert[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSecurityData = async () => {
    try {
      const [alertsRes, eventsRes] = await Promise.all([
        api.getOwnerAlerts(),
        api.getSecurityEvents()
      ]);
      setAlerts(alertsRes.alerts);
      setEvents(eventsRes.events);
    } catch (err) {
      console.error('Failed to load security data:', err);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    if (files.length > 0 && !selectedFileId) {
      // Prefer a group-shared file
      const groupFile = files.find(f => f.sharedGroupIds.length > 0) || files[0];
      setSelectedFileId(groupFile.id);
    }
  }, [files]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSimulateAttack = async () => {
    if (!selectedFileId) {
      setError('Please select a file to target.');
      return;
    }

    setIsSimulating(true);
    setError(null);
    setSimulationReport(null);
    setSimulationStep(1);

    // Staged visualization of the 16 faculty steps
    try {
      setSimulationStep(5); // Simulated attacker attempts access
      await new Promise(r => setTimeout(r, 600));

      setSimulationStep(6); // Real backend authorization rejects
      await new Promise(r => setTimeout(r, 600));

      setSimulationStep(9); // Key rotation and re-encryption
      const response = await api.simulateAttack({
        fileId: selectedFileId,
        attackerIdentity
      });

      setSimulationStep(12); // New IPFS CID generated
      await new Promise(r => setTimeout(r, 600));

      setSimulationStep(16); // Completed
      setSimulationReport(response.simulationReport);
      fetchSecurityData();
      onAttackCompleted();
    } catch (err: any) {
      setError(err.message || 'Simulation execution failed');
      setSimulationStep(0);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleMarkAlertRead = async (alertId: string) => {
    try {
      await api.markAlertRead(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const pipelineSteps = [
    { num: 5, label: "Unauthorized Access Request", desc: `Actor '${attackerIdentity}' transmits download request` },
    { num: 6, label: "Authorization Intercept", desc: "Backend ACL rejects actor with HTTP 403 Forbidden" },
    { num: 7, label: "On-Chain Incident Audit", desc: "Unauthorized attempt recorded on blockchain registry" },
    { num: 8, label: "Owner Security Alert", desc: "Real-time high-priority security alert dispatched" },
    { num: 9, label: "Cryptographic Key Rotation", desc: "Fresh random 256-bit AES key and nonce generated" },
    { num: 11, label: "IPFS Re-Encryption & Pin", desc: "New encrypted payload uploaded to decentralized node" },
    { num: 12, label: "Genuine New CID Obtained", desc: "New content-addressed CID computed and verified" },
    { num: 14, label: "PRE Access Material Updated", desc: "Re-encryption keys regenerated for authorized members" },
    { num: 15, label: "Attacker Blocked Permanently", desc: "Attacker cannot decrypt neither new nor old CID" }
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          Security Center & Automated Attack Response
        </h2>
        <p className="text-xs text-slate-400">
          Faculty demonstration workbench: Controlled unauthorized access simulation, real-time intrusion detection, and automatic IPFS CID rotation
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
          <strong>Simulation Error:</strong> {error}
        </div>
      )}

      {/* Simulator Control Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Faculty Demonstration Feature
            </div>
            <h3 className="text-lg font-bold text-white mt-1">Security Attack Simulator</h3>
            <p className="text-xs text-slate-400">
              Demonstrates unauthorized access rejection and zero-trust key rotation on a group-shared file
            </p>
          </div>

          <button
            onClick={handleSimulateAttack}
            disabled={isSimulating || files.length === 0}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-rose-950/40 whitespace-nowrap"
          >
            {isSimulating ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Executing Attack & Key Rotation...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Simulate Hacker Attack
              </>
            )}
          </button>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Target Protected File (Group-Shared)
            </label>
            <select
              value={selectedFileId}
              onChange={(e) => setSelectedFileId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
            >
              {files.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (v{f.currentVersion} · {f.currentCid.slice(0, 12)}...{f.currentCid.slice(-6)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Simulated Attacker Identity
            </label>
            <input
              type="text"
              value={attackerIdentity}
              onChange={(e) => setAttackerIdentity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500"
              placeholder="e.g. simulated_hacker"
            />
          </div>
        </div>

        {/* Live Simulation Progress Pipeline */}
        {isSimulating && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-rose-300 flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              Automated Defense Pipeline in Progress...
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className={`p-2 rounded border ${simulationStep >= 5 ? 'bg-rose-950/30 border-rose-800/60 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                1. Access Request Intercepted
              </div>
              <div className={`p-2 rounded border ${simulationStep >= 9 ? 'bg-amber-950/30 border-amber-800/60 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                2. AES Key & CID Rotation
              </div>
              <div className={`p-2 rounded border ${simulationStep >= 14 ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                3. PRE Updated for Group
              </div>
            </div>
          </div>
        )}

        {/* Simulation Output Comparison Card */}
        {simulationReport && (
          <div className="rounded-xl border border-emerald-500/40 bg-slate-950 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Attack Defended & Content Re-Encrypted with New IPFS CID
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold">
                Status: {simulationReport.securityResponse.responseStatus}
              </span>
            </div>

            {/* Old CID vs New CID Side-by-Side Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Previous Version Box */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-slate-300">Previous File State</span>
                  <span className="font-mono text-slate-500">Version {simulationReport.securityResponse.previousVersion}</span>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Historical IPFS CID:</div>
                  <div className="font-mono text-[11px] text-slate-300 break-all select-all bg-slate-950 p-1.5 rounded border border-slate-800/80 mt-1">
                    {simulationReport.securityResponse.originalCid}
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  Targeted by: <span className="font-mono text-rose-400">{simulationReport.attackDetails.actor}</span>
                </div>
              </div>

              {/* Rotated Version Box */}
              <div className="p-3.5 rounded-xl bg-emerald-950/10 border border-emerald-500/40 text-xs space-y-2">
                <div className="flex items-center justify-between text-emerald-300">
                  <span className="font-semibold text-emerald-200">Rotated Secure State</span>
                  <span className="font-mono text-emerald-400 font-bold">Version {simulationReport.securityResponse.newVersion}</span>
                </div>
                <div>
                  <div className="text-[11px] text-emerald-400/80">Genuine New IPFS CID:</div>
                  <div className="font-mono text-[11px] text-emerald-300 break-all select-all bg-slate-950 p-1.5 rounded border border-emerald-800/60 mt-1">
                    {simulationReport.securityResponse.newCid}
                  </div>
                </div>
                <div className="text-[11px] text-emerald-400/90 flex items-center justify-between">
                  <span>PRE Material Distributed:</span>
                  <span className="font-mono font-bold">{simulationReport.securityResponse.authorizedMembersUpdated} member(s)</span>
                </div>
              </div>
            </div>

            {/* Transaction Receipt & Verification Summary */}
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Blockchain Audit Tx:</span>
                <span className="font-mono text-slate-200 truncate max-w-xs">{simulationReport.attackDetails.onChainTxHash}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CID Rotation Tx:</span>
                <span className="font-mono text-emerald-400 truncate max-w-xs">{simulationReport.securityResponse.blockchainTxHash}</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1 mt-1 text-[11px]">
                <span>Rejection Reason:</span>
                <span className="text-rose-300 italic">{simulationReport.attackDetails.reason}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Alerts Section (Formatted exactly as requested in Section 12) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Owner Security Alerts ({alerts.length})
          </h3>
          <span className="text-xs text-slate-400">
            {alerts.filter(a => !a.isRead).length} unread incident reports
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
            No security alerts recorded. Run the Security Attack Simulator above to test real-time intrusion alerts.
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border text-xs transition-colors ${
                  !alert.isRead
                    ? 'bg-rose-950/20 border-rose-800/60'
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-2 font-bold text-rose-300 text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    SECURITY ALERT: Unauthorized File Access Attempt
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString()} · {new Date(alert.timestamp).toLocaleDateString()}
                    </span>
                    {!alert.isRead && (
                      <button
                        onClick={() => handleMarkAlertRead(alert.id)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Target File:</span>
                    <span className="text-slate-200 font-semibold">{alert.fileName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Group:</span>
                    <span className="text-slate-200">{alert.groupName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Actor:</span>
                    <span className="text-rose-400 font-semibold">{alert.actor}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Access Status:</span>
                    <span className="text-rose-400 font-bold">{alert.accessStatus}</span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block">Original CID:</span>
                    <span className="text-slate-300 truncate block">{alert.originalCid}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block">New CID (Post-Rotation):</span>
                    <span className="text-emerald-400 truncate block">{alert.newCid || 'Pending'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Event ID:</span>
                    <span className="text-slate-400">{alert.eventId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Response Status:</span>
                    <span className="text-emerald-400 font-semibold">{alert.responseStatus}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Audit Trail */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          On-Chain Security Audit Trail ({events.length} Events)
        </h3>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor / Address</th>
                <th className="py-2.5 px-3">Target File</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">On-Chain Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No security events logged yet.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 font-mono text-[11px]">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-slate-200 font-sans font-medium">{e.actor}</div>
                      {e.actorAddress && (
                        <div className="text-[10px] text-slate-500">
                          {e.actorAddress.slice(0, 8)}...{e.actorAddress.slice(-6)}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans truncate max-w-[150px]">
                      {e.fileName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{e.action}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.status === 'DENIED'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-[120px]">
                      {e.txHash ? `${e.txHash.slice(0, 10)}...` : 'N/A'}
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
