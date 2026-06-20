import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Lock, Eye, EyeOff, ShieldAlert, Key, Camera, Check,
  AlertTriangle, UserPlus, Building2, MapPin, Mail, Briefcase, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { UserRole } from '../types';

interface LoginPortalProps {
  onLoginSuccess: (role: UserRole, username: string, name: string, avatar?: string, company?: any, realEmail?: string) => void;
  dbStatus?: {
    connected: boolean;
    connectionString: string;
    error: string | null;
    provider: string;
  } | null;
}

type ViewMode = 'login' | 'register' | 'setup';

const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Operations', 'Marketing', 'Legal', 'Support', 'Other'];

export default function LoginPortal({ onLoginSuccess, dbStatus }: LoginPortalProps) {
  const [view, setView] = useState<ViewMode>('login');

  // ── Login state ──────────────────────────────────────────────────────────
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');
  const [isShaking, setIsShaking]   = useState(false);
  const [isLoading, setIsLoading]   = useState(false);

  // ── Register state ───────────────────────────────────────────────────────
  const [regName, setRegName]               = useState('');
  const [regUsername, setRegUsername]       = useState('');
  const [regEmail, setRegEmail]             = useState('');
  const [regDept, setRegDept]               = useState('IT');
  const [regPassword, setRegPassword]       = useState('');
  const [regConfirm, setRegConfirm]         = useState('');
  const [regShowPw, setRegShowPw]           = useState(false);
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regCompanyAddr, setRegCompanyAddr] = useState('');
  const [regCompanyLogo, setRegCompanyLogo] = useState('');
  const [regAvatar, setRegAvatar]           = useState('');
  const [regError, setRegError]             = useState('');
  const [regLoading, setRegLoading]         = useState(false);
  const [regSuccess, setRegSuccess]         = useState(false);

  // ── First-setup state ────────────────────────────────────────────────────
  const [setupUser, setSetupUser]           = useState<any>(null);
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [setupAvatar, setSetupAvatar]       = useState('');
  const [setupError, setSetupError]         = useState('');
  const [setupLoading, setSetupLoading]     = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const resetRegisterForm = () => {
    setRegName(''); setRegUsername(''); setRegEmail(''); setRegDept('IT');
    setRegPassword(''); setRegConfirm(''); setRegCompanyName('');
    setRegCompanyAddr(''); setRegCompanyLogo(''); setRegAvatar('');
    setRegError(''); setRegSuccess(false);
  };

  // ── Login handler ────────────────────────────────────────────────────────
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim() || !password.trim()) {
      setErrorMsg('All fields are required.');
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
            if (data.user.avatar) setSetupAvatar(data.user.avatar);
            setView('setup');
            setIsLoading(false);
          } else {
            onLoginSuccess(data.user.role, data.user.id, data.user.name, data.user.avatar, data.user.company, data.user.email);
          }
        } else {
          const errData = await res.json();
          setErrorMsg(errData.error || 'Invalid credentials.');
          triggerShake();
          setIsLoading(false);
        }
      })
      .catch(() => {
        setErrorMsg('Network error. Check server status.');
        triggerShake();
        setIsLoading(false);
      });
  };

  // ── Register handler ─────────────────────────────────────────────────────
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError('Name, username, email and password are required.');
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError('Passwords do not match.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    if (!regCompanyName.trim() || !regCompanyAddr.trim()) {
      setRegError('Company name and address are mandatory.');
      return;
    }

    setRegLoading(true);

    fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: regName.trim(),
        username: regUsername.trim().toLowerCase(),
        email: regEmail.trim().toLowerCase(),
        department: regDept,
        password: regPassword,
        avatar: regAvatar || '',
        company: {
          name: regCompanyName.trim(),
          address: regCompanyAddr.trim(),
          logo: regCompanyLogo.trim()
        }
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          setRegSuccess(true);
          setRegLoading(false);
        } else {
          setRegError(data.error || 'Registration failed. Please try again.');
          setRegLoading(false);
        }
      })
      .catch(() => {
        setRegError('Network error. Check server status.');
        setRegLoading(false);
      });
  };

  // ── First-time setup handler ─────────────────────────────────────────────
  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    if (!newPassword.trim()) { setSetupError('Password cannot be empty.'); return; }
    if (newPassword !== confirmPassword) { setSetupError('Passwords do not match.'); return; }
    if (!setupAvatar) { setSetupError('Profile picture is mandatory for identity verification.'); return; }
    setSetupLoading(true);
    fetch(`/api/users/${setupUser.id}/first-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword, avatar: setupAvatar })
    })
      .then(async (res) => {
        if (res.ok) {
          onLoginSuccess(setupUser.role, setupUser.id, setupUser.name, setupAvatar, setupUser.company, setupUser.email);
        } else {
          const errData = await res.json();
          setSetupError(errData.error || 'Setup failed.');
          setSetupLoading(false);
        }
      })
      .catch(() => {
        setSetupError('Network error. Check server status.');
        setSetupLoading(false);
      });
  };

  // ── Shared field styles ───────────────────────────────────────────────────
  const inputClass = 'w-full pl-10 pr-4 py-3 text-xs font-sans rounded-xl border border-white/10 bg-white/[0.02] text-white placeholder-slate-500 focus:outline-none focus:border-[#6C63FF] focus:bg-white/[0.04] transition-all';
  const labelClass = 'block text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold';

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#050814]/90">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">

        {/* ═══ LOGIN PANEL ═══════════════════════════════════════════════════ */}
        {view === 'login' && (
          <motion.div
            key="login-card"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={`w-full max-w-md p-8 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-2xl relative z-10 select-none ${isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
            style={{ boxShadow: '0 0 50px rgba(108,99,255,0.12)' }}
          >
            {/* Logo */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="relative mb-4">
                <span className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 opacity-20 blur-sm animate-ping" />
                <img src="/image/logo Authenticate.png" alt="ProbSolver" className="w-16 h-16 rounded-2xl object-contain shadow-lg relative z-10 border border-white/20 bg-black/40 p-2" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent font-sans">ProbSolver</h2>
              <p className="text-[10px] uppercase font-bold tracking-[0.22em] bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent mt-2">Smarter Support. Faster Resolution.</p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2 font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0" /><span>{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1">
                <label className={labelClass}>Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" className={inputClass} />
                </div>
              </div>
              {/* Password */}
              <div className="space-y-1">
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 text-xs font-sans rounded-xl border border-white/10 bg-white/[0.02] text-white placeholder-slate-500 focus:outline-none focus:border-[#6C63FF] focus:bg-white/[0.04] transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* Sign In */}
              <button type="submit" disabled={isLoading}
                className="w-full py-3 mt-1 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6C63FF] to-[#A78BFA] hover:shadow-[0_0_20px_rgba(108,99,255,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg border border-white/10 disabled:opacity-50">
                {isLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Key className="w-4 h-4" /><span>Sign In to Platform</span></>}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-5 pt-4 border-t border-white/5 text-center">
              <p className="text-[11px] text-slate-500">New to ProbSolver?</p>
              <button
                onClick={() => { resetRegisterForm(); setView('register'); }}
                className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#A78BFA] hover:text-white transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> Create a new account
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══ REGISTER PANEL ════════════════════════════════════════════════ */}
        {view === 'register' && (
          <motion.div
            key="register-card"
            initial={{ opacity: 0, x: 30, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.97 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full max-w-lg p-7 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-2xl relative z-10 select-none"
            style={{ boxShadow: '0 0 60px rgba(108,99,255,0.14)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
              <button onClick={() => setView('login')} className="p-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:border-white/20 transition-all cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-lg font-extrabold text-white leading-tight">Create Account</h3>
                <p className="text-[10px] text-slate-500 font-mono">Register as a new ProbSolver user</p>
              </div>
              <div className="ml-auto">
                <img src="/image/logo Authenticate.png" alt="ProbSolver" className="w-10 h-10 rounded-xl object-contain bg-black/40 border border-white/10 p-1.5" />
              </div>
            </div>

            {/* Success State */}
            <AnimatePresence>
              {regSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 flex flex-col items-center text-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h4 className="text-base font-extrabold text-white">Account Created!</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs">Your account has been registered successfully. You can now sign in with your credentials.</p>
                  <button
                    onClick={() => { resetRegisterForm(); setView('login'); }}
                    className="mt-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6C63FF] to-[#A78BFA] hover:scale-[1.02] transition-all shadow-lg border border-white/10 cursor-pointer"
                  >
                    Sign In Now →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {!regSuccess && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Error */}
                <AnimatePresence>
                  {regError && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2 font-medium">
                      <ShieldAlert className="w-4 h-4 shrink-0" /><span>{regError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Personal Info ─────────────────────── */}
                <div className="p-3.5 rounded-2xl border border-white/5 bg-white/[0.01] space-y-3">
                  <p className="text-[9px] font-mono text-[#A78BFA] uppercase tracking-widest font-bold">Personal Information</p>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className={labelClass}>Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Your full name" className={inputClass} />
                    </div>
                  </div>

                  {/* Username + Email row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className={labelClass}>Username *</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-slate-500 text-xs font-mono">@</span>
                        <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="username"
                          className="w-full pl-8 pr-3 py-3 text-xs font-sans rounded-xl border border-white/10 bg-white/[0.02] text-white placeholder-slate-500 focus:outline-none focus:border-[#6C63FF] focus:bg-white/[0.04] transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Department *</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                        <select value={regDept} onChange={e => setRegDept(e.target.value)}
                          className="w-full pl-10 pr-3 py-3 text-xs font-sans rounded-xl border border-white/10 bg-[#0a0f1d] text-white focus:outline-none focus:border-[#6C63FF] transition-all appearance-none cursor-pointer">
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className={labelClass}>Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="your@email.com" className={inputClass} />
                    </div>
                  </div>
                </div>

                {/* ── Password ──────────────────────────── */}
                <div className="p-3.5 rounded-2xl border border-white/5 bg-white/[0.01] space-y-3">
                  <p className="text-[9px] font-mono text-[#A78BFA] uppercase tracking-widest font-bold">Security Credentials</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className={labelClass}>Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <input type={regShowPw ? 'text' : 'password'} value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Min 6 chars"
                          className="w-full pl-10 pr-8 py-3 text-xs font-sans rounded-xl border border-white/10 bg-white/[0.02] text-white placeholder-slate-500 focus:outline-none focus:border-[#6C63FF] focus:bg-white/[0.04] transition-all" />
                        <button type="button" onClick={() => setRegShowPw(!regShowPw)} className="absolute right-2.5 top-3 text-slate-500 hover:text-white transition-colors">
                          {regShowPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Confirm *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <input type={regShowPw ? 'text' : 'password'} value={regConfirm} onChange={e => setRegConfirm(e.target.value)} placeholder="Repeat password"
                          className={`w-full pl-10 pr-4 py-3 text-xs font-sans rounded-xl border transition-all focus:outline-none ${regConfirm && regConfirm !== regPassword ? 'border-rose-500/40 bg-rose-500/5 text-rose-300' : regConfirm && regConfirm === regPassword ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300' : 'border-white/10 bg-white/[0.02] text-white'} placeholder-slate-500`} />
                        {regConfirm && regConfirm === regPassword && <Check className="absolute right-2.5 top-3.5 w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Company Info ──────────────────────── */}
                <div className="p-3.5 rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.02] space-y-3">
                  <p className="text-[9px] font-mono text-[#A78BFA] uppercase tracking-widest font-bold">Company Information</p>

                  <div className="space-y-1">
                    <label className={labelClass}>Company Name *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input type="text" value={regCompanyName} onChange={e => setRegCompanyName(e.target.value)} placeholder="Your company name" className={inputClass} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={labelClass}>Company Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input type="text" value={regCompanyAddr} onChange={e => setRegCompanyAddr(e.target.value)} placeholder="Street, City, Country" className={inputClass} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={labelClass}>Company Logo URL <span className="text-slate-600 normal-case font-normal">(optional)</span></label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-500 text-[10px] font-mono">URL</span>
                      <input type="url" value={regCompanyLogo} onChange={e => setRegCompanyLogo(e.target.value)} placeholder="https://... (optional)"
                        className="w-full pl-10 pr-4 py-3 text-xs font-sans rounded-xl border border-white/10 bg-white/[0.02] text-white placeholder-slate-500 focus:outline-none focus:border-[#6C63FF] focus:bg-white/[0.04] transition-all" />
                    </div>
                  </div>
                </div>

                {/* ── Optional Profile Photo ────────────── */}
                <div className="p-3.5 rounded-2xl border border-white/5 bg-white/[0.01] space-y-2">
                  <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">Profile Photo <span className="text-slate-600 normal-case font-normal">(optional)</span></p>
                  <div className="flex items-center gap-3">
                    {regAvatar ? (
                      <img src={regAvatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-indigo-500/25 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center text-slate-500 shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { const r = new FileReader(); r.onloadend = () => setRegAvatar(r.result as string); r.readAsDataURL(f); }
                    }} className="text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#6C63FF]/15 file:text-purple-300 hover:file:bg-[#6C63FF]/30 file:cursor-pointer cursor-pointer" />
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={regLoading}
                  className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6C63FF] to-[#A78BFA] hover:shadow-[0_0_20px_rgba(108,99,255,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg border border-white/10 disabled:opacity-50">
                  {regLoading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><UserPlus className="w-4 h-4" /><span>Create My Account</span></>}
                </button>

                <p className="text-center text-[11px] text-slate-600">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setView('login')} className="text-[#A78BFA] hover:text-white font-bold transition-colors cursor-pointer">Sign In</button>
                </p>
              </form>
            )}
          </motion.div>
        )}

        {/* ═══ FIRST-TIME SETUP PANEL ════════════════════════════════════════ */}
        {view === 'setup' && (
          <motion.div
            key="setup-card"
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-2xl relative z-10 text-left select-none"
            style={{ boxShadow: '0 0 50px rgba(108,99,255,0.12)' }}
          >
            <div className="flex flex-col items-center mb-6 text-center border-b border-white/5 pb-5">
              <div className="relative mb-3">
                <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#A78BFA] opacity-25 blur-sm" />
                <img src="/image/logo Authenticate.png" alt="ProbSolver" className="w-12 h-12 rounded-full object-contain shadow-md relative z-10 border border-white/20 bg-black/40 p-1.5" />
              </div>
              <h3 className="text-xl font-extrabold text-white">First-Time Setup</h3>
              <p className="text-slate-400 text-xs mt-1">Configure your operator credentials to establish workspace access</p>
            </div>

            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <AnimatePresence>
                {setupError && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2 font-medium">
                    <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" /><span>{setupError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Avatar */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Upload Profile Picture *</label>
                <div className="flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-black/20 hover:border-[#6C63FF]/30 transition-all">
                  <div className="relative shrink-0">
                    {setupAvatar
                      ? <img src={setupAvatar} alt="Avatar Preview" className="w-14 h-14 rounded-full border border-indigo-500/25 object-cover bg-slate-950 shadow-inner" />
                      : <div className="w-14 h-14 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center text-slate-500"><Camera className="w-5 h-5" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setSetupAvatar(r.result as string); r.readAsDataURL(f); } }}
                      className="w-full text-[10px] text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#6C63FF]/15 file:text-purple-300 hover:file:bg-[#6C63FF]/30 file:cursor-pointer cursor-pointer" />
                    <span className="text-[8px] text-slate-500 block mt-1 font-mono">PNG, JPG (Max 5MB)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[9.5px] leading-relaxed text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p><strong className="font-bold">Identity Verification:</strong> This picture is for authentication purposes only and will not be shared.</p>
              </div>

              {/* New password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">New Permanent Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input type={showSetupPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter your new password"
                    className="w-full pl-10 pr-10 py-3 text-xs font-sans rounded-xl border border-white/10 bg-white/[0.02] text-white placeholder-slate-500 focus:outline-none focus:border-[#6C63FF] focus:bg-white/[0.04] transition-all" />
                  <button type="button" onClick={() => setShowSetupPassword(!showSetupPassword)} className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors">
                    {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Confirm Permanent Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input type={showSetupPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm your password"
                    className="w-full pl-10 pr-10 py-3 text-xs font-sans rounded-xl border border-white/10 bg-white/[0.02] text-white placeholder-slate-500 focus:outline-none focus:border-[#6C63FF] focus:bg-white/[0.04] transition-all" />
                </div>
              </div>

              <button type="submit" disabled={setupLoading || !setupAvatar || !newPassword || newPassword !== confirmPassword}
                className="w-full py-3 mt-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6C63FF] to-[#A78BFA] hover:shadow-[0_0_20px_rgba(108,99,255,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg border border-white/10 disabled:opacity-30 disabled:scale-100 disabled:shadow-none">
                {setupLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check className="w-4 h-4" /><span>Save & Initialize Platform Access</span></>}
              </button>
            </form>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
