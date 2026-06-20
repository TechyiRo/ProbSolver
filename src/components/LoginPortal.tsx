import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, Eye, EyeOff, ShieldAlert, Key, Camera, Check, Info, AlertTriangle } from 'lucide-react';
import { UserRole } from '../types';

interface LoginPortalProps {
  onLoginSuccess: (role: UserRole, username: string, name: string, avatar?: string) => void;
  dbStatus?: {
    connected: boolean;
    connectionString: string;
    error: string | null;
    provider: string;
  } | null;
}

export default function LoginPortal({ onLoginSuccess, dbStatus }: LoginPortalProps) {
  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Setup states (First-time login)
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [setupUser, setSetupUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [setupAvatar, setSetupAvatar] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('All workspace parameters must be configured.');
      triggerShake();
      return;
    }

    setIsLoading(true);

    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password: password.trim() })
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.user.isFirstLogin) {
            setSetupUser(data.user);
            if (data.user.avatar) {
              setSetupAvatar(data.user.avatar);
            }
            setIsSetupMode(true);
            setIsLoading(false);
          } else {
            onLoginSuccess(data.user.role, data.user.id, data.user.name, data.user.avatar);
          }
        } else {
          const errData = await res.json();
          setErrorMsg(errData.error || 'Invalid credentials.');
          triggerShake();
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Login fetch error:", err);
        setErrorMsg('Network handshake failure. Verify terminal server status.');
        triggerShake();
        setIsLoading(false);
      });
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');

    if (!newPassword.trim()) {
      setSetupError('Password cannot be empty.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSetupError('Passwords do not match.');
      return;
    }

    if (!setupAvatar) {
      setSetupError('Profile picture upload is mandatory for identity verification.');
      return;
    }

    setSetupLoading(true);

    fetch(`/api/users/${setupUser.id}/first-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword, avatar: setupAvatar })
    })
      .then(async (res) => {
        if (res.ok) {
          onLoginSuccess(setupUser.role, setupUser.id, setupUser.name, setupAvatar);
        } else {
          const errData = await res.json();
          setSetupError(errData.error || 'Setup failed.');
          setSetupLoading(false);
        }
      })
      .catch((err) => {
        console.error("Setup fetch error:", err);
        setSetupError('Network handshake failure. Verify terminal server status.');
        setSetupLoading(false);
      });
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#050814]/90">
      {/* Absolute Ambient Background Highlights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!isSetupMode ? (
          <motion.div
            key="login-card"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`w-full max-w-md p-8 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-2xl relative z-10 select-none ${
              isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''
            }`}
            style={{
              boxShadow: '0 0 50px rgba(108,99,255,0.12)'
            }}
          >
            {/* SVG Pulse Ticket Logo */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="relative mb-4">
                <span className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 opacity-20 blur-sm animate-ping" />
                <img
                  src="/image/logo Authenticate.png"
                  alt="Authenticate Logo"
                  className="w-16 h-16 rounded-2xl object-contain shadow-lg relative z-10 border border-white/20 bg-black/40 p-2"
                />
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent font-sans">
                ProbSolver
              </h2>
              <p className="text-[10px] uppercase font-bold tracking-[0.22em] bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent mt-2">
                Smarter Support. Faster Resolution.
              </p>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2 font-medium"
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Username */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Telemetry Operator Sign-In
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-3 text-xs font-sans rounded-xl border border-white/10 bg-white/[0.02] text-white placeholder-slate-500 focus:outline-none focus:border-[#6C63FF] focus:bg-white/[0.04] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Secret Passcode Handshake
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 text-xs font-sans rounded-xl border border-white/10 bg-white/[0.02] text-white placeholder-slate-500 focus:outline-none focus:border-[#6C63FF] focus:bg-white/[0.04] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In Trigger */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6C63FF] to-[#A78BFA] hover:shadow-[0_0_20px_rgba(108,99,255,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg border border-white/10 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Initialize Platform Sign In</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="setup-card"
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-2xl relative z-10 text-left select-none"
            style={{
              boxShadow: '0 0 50px rgba(108,99,255,0.12)'
            }}
          >
            {/* Header */}
            <div className="flex flex-col items-center mb-6 text-center border-b border-white/5 pb-5">
              <div className="relative mb-3">
                <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#A78BFA] opacity-25 blur-sm" />
                <img
                  src="/image/logo Authenticate.png"
                  alt="Authenticate Logo"
                  className="w-12 h-12 rounded-full object-contain shadow-md relative z-10 border border-white/20 bg-black/40 p-1.5"
                />
              </div>
              <h3 className="text-xl font-extrabold text-white">First-Time Setup</h3>
              <p className="text-slate-400 text-xs mt-1">Configure your operator credentials to establish workspace access</p>
            </div>

            {/* Setup Form */}
            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <AnimatePresence>
                {setupError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2 font-medium"
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
                    <span>{setupError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Profile Image Upload (Mandatory) */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                  Upload Original Profile Picture *
                </label>
                <div className="flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-black/20 hover:border-[#6C63FF]/30 transition-all">
                  <div className="relative shrink-0">
                    {setupAvatar ? (
                      <img
                        src={setupAvatar}
                        alt="Avatar Preview"
                        className="w-14 h-14 rounded-full border border-indigo-500/25 object-cover bg-slate-950 shadow-inner"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center text-slate-500">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSetupAvatar(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-[10px] text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#6C63FF]/15 file:text-purple-300 hover:file:bg-[#6C63FF]/30 file:cursor-pointer cursor-pointer"
                    />
                    <span className="text-[8px] text-slate-500 block mt-1 font-mono leading-tight">
                      Supported formats: PNG, JPG (Max 5MB)
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Identity Note */}
              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[9.5px] leading-relaxed text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="font-bold">Identity Verification:</strong> This profile picture is strictly for authentication identity purposes and will not be shared or used for unauthorized biometric matching or profiling.
                </p>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                  New Permanent Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type={showSetupPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="w-full pl-10 pr-10 py-3 text-xs font-sans rounded-xl border border-white/10 bg-white/[0.02] text-white placeholder-slate-500 focus:outline-none focus:border-[#6C63FF] focus:bg-white/[0.04] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPassword(!showSetupPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors"
                  >
                    {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                  Confirm Permanent Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type={showSetupPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-10 py-3 text-xs font-sans rounded-xl border border-white/10 bg-white/[0.02] text-white placeholder-slate-500 focus:outline-none focus:border-[#6C63FF] focus:bg-white/[0.04] transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={setupLoading || !setupAvatar || !newPassword || newPassword !== confirmPassword}
                className="w-full py-3 mt-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6C63FF] to-[#A78BFA] hover:shadow-[0_0_20px_rgba(108,99,255,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg border border-white/10 disabled:opacity-30 disabled:scale-100 disabled:shadow-none"
              >
                {setupLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save & Initialize Platform Access</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
