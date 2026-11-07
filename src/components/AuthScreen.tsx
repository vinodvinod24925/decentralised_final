import React, { useState } from 'react';
import { Shield, Lock, Mail, Key, UserCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, setActiveUserId } from '../api.ts';
import { User } from '../types.ts';

interface AuthScreenProps {
  onAuthenticated: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'google' | 'guest'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'owner' | 'member'>('owner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (mode === 'register') {
        const res = await api.register(email, name, role);
        setActiveUserId(res.user.id);
        onAuthenticated(res.user);
      } else {
        const res = await api.loginEmail(email, password);
        setActiveUserId(res.user.id);
        onAuthenticated(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const defaultEmail = email || 'vini24925@gmail.com';
      const res = await api.loginGoogle(defaultEmail, name || 'Authorized Account');
      setActiveUserId(res.user.id);
      onAuthenticated(res.user);
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.loginGuest();
      setActiveUserId(res.user.id);
      onAuthenticated(res.user);
    } catch (err: any) {
      setError(err.message || 'Guest session initialization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-emerald-500/30">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">DeShare</h1>
          <p className="text-xs text-slate-400">
            Decentralized Secure File Sharing & Proxy Re-Encryption Platform
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'login' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); }}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'register' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => { setMode('guest'); setError(null); }}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'guest' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Guest
            </button>
          </div>

          {mode === 'guest' ? (
            <div className="space-y-4 text-center py-2">
              <div className="text-xs text-slate-300 leading-relaxed">
                Start an immediate guest session with an isolated Ethereum wallet and generated Proxy Re-Encryption keypair.
              </div>
              <button
                onClick={handleGuestSignIn}
                disabled={loading}
                className="w-full py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Initializing Guest Wallet...' : 'Continue as Guest'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Alice Chen"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Role Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('owner')}
                        className={`p-2 rounded-lg border text-xs text-left ${
                          role === 'owner' ? 'bg-slate-800 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="font-semibold">Security Lead / Owner</div>
                        <div className="text-[10px] text-slate-500">File & group owner</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('member')}
                        className={`p-2 rounded-lg border text-xs text-left ${
                          role === 'member' ? 'bg-slate-800 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="font-semibold">Auditor / Member</div>
                        <div className="text-[10px] text-slate-500">Receive & decrypt files</div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="alice.chen@deshare.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Authenticating...' : mode === 'register' ? 'Create Account & Wallet' : 'Sign In to Workspace'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Quick Preset Logins */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[11px] text-slate-500 mb-2 text-center">Or click a pre-provisioned workspace identity:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('alice.chen@deshare.io');
                      setPassword('password');
                    }}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 truncate text-left"
                  >
                    Alice (Owner)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('bob.davis@deshare.io');
                      setPassword('password');
                    }}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 truncate text-left"
                  >
                    Bob (Auditor)
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Google Sign In option */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-slate-500"><span className="bg-slate-900 px-2">Or continue with</span></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2 text-xs font-semibold text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Sign In with Google
          </button>
        </div>

        {/* Security Pillars Footer */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 font-mono">
          <div>AES-256-GCM</div>
          <div>Kubo IPFS Pinning</div>
          <div>BBS98 PRE Delegation</div>
        </div>
      </div>
    </div>
  );
};
