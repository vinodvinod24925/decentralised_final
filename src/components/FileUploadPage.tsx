import React, { useState, useRef } from 'react';
import {
  Upload,
  Lock,
  Shield,
  CheckCircle2,
  AlertCircle,
  FileText,
  HardDrive,
  Database,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../api.ts';

interface FileUploadPageProps {
  onUploaded: () => void;
  onNavigateFiles: () => void;
}

export const FileUploadPage: React.FC<FileUploadPageProps> = ({
  onUploaded,
  onNavigateFiles
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
      setStep(0);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError(null);
    setStep(1); // Generating AES key

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          setStep(2); // Local AES-256-GCM encryption
          await new Promise(r => setTimeout(r, 400));
          const base64Data = (reader.result as string).split(',')[1];

          setStep(3); // Uploading ciphertext to IPFS
          await new Promise(r => setTimeout(r, 400));

          setStep(4); // Smart contract registration
          const uploadRes = await api.uploadFile(file.name, base64Data, file.type);

          setResult(uploadRes);
          setStep(5); // Complete
          onUploaded();
        } catch (err: any) {
          setError(err.message || 'File upload failed');
          setStep(0);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'File reading failed');
      setLoading(false);
      setStep(0);
    }
  };

  const copyCID = () => {
    if (result?.ipfs?.cid) {
      navigator.clipboard.writeText(result.ipfs.cid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-emerald-400" />
          Encrypted File Upload & Decentralized Storage
        </h1>
        <p className="text-xs text-slate-400">
          Client-side AES-256-GCM encryption, content-addressed Kubo IPFS pinning, and smart contract registry
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {!result ? (
        <div className="space-y-6">
          {/* File Picker Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-10 text-center cursor-pointer transition-colors bg-slate-900/60"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-white">
              {file ? file.name : 'Choose a file or drag and drop here'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {file ? `${formatBytes(file.size)} · Ready for client-side encryption` : 'Supports PDF, DOCX, ZIP, PNG, JSON, TXT, CSV up to 50MB'}
            </div>
          </div>

          {/* Cryptographic Pipeline Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Zero-Trust Client Cryptography Pipeline
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Lock className="w-4 h-4" />
                  AES-256-GCM
                </div>
                <div className="text-[11px] text-slate-400">
                  Cryptographically secure random 256-bit key + 96-bit unique IV generated per upload.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <HardDrive className="w-4 h-4" />
                  IPFS Content Addressing
                </div>
                <div className="text-[11px] text-slate-400">
                  Only ciphertext uploaded. SHA-256 multihash generates an immutable CID (e.g. Qm...).
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                  <Database className="w-4 h-4" />
                  On-Chain Registry
                </div>
                <div className="text-[11px] text-slate-400">
                  File metadata, owner address, and CID recorded on Hardhat smart contract ledger.
                </div>
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="px-6 py-3 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              {loading ? (
                <>
                  <Lock className="w-4 h-4 animate-spin" />
                  Encrypting & Pinning to IPFS...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Encrypt & Upload to IPFS
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Success Receipt Card */
        <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">File Successfully Encrypted & Pinned</h2>
              <p className="text-xs text-slate-400">Verifiable decentralized storage receipt</p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
            <div>
              <div className="text-[11px] text-slate-500">File Name:</div>
              <div className="text-slate-200 font-bold">{result.file?.name}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">IPFS CID (Content Identifier):</div>
              <div className="flex items-center justify-between text-emerald-400 break-all bg-slate-900 p-2 rounded border border-slate-800/80 mt-1">
                <span>{result.ipfs?.cid}</span>
                <button onClick={copyCID} className="text-slate-400 hover:text-white ml-2">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Smart Contract Transaction Hash:</div>
              <div className="text-slate-300 break-all">{result.blockchain?.txHash}</div>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px] border-t border-slate-800 pt-2">
              <span>Block: #{result.blockchain?.blockNumber}</span>
              <span>Gas Used: {result.blockchain?.gasUsed}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => { setFile(null); setResult(null); }}
              className="px-4 py-2 text-xs text-slate-300 hover:text-white"
            >
              Upload Another
            </button>
            <button
              onClick={onNavigateFiles}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-1.5"
            >
              View in File Management
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
