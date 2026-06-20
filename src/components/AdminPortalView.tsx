import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Users, Activity, CheckCircle, BarChart3, TrendingUp, 
  Settings, AlertCircle, FileText, Search, Filter, ArrowUpRight, 
  Trash2, Edit3, UserCheck, PlusCircle, Check, X, Clipboard, 
  Clock, Server, Bell, Key, Briefcase, FileSpreadsheet, Lock, HelpCircle, Eye, RefreshCw
} from 'lucide-react';
import { Ticket, TicketPriority, TicketStatus, UserAccount, SystemNotification } from '../types';
import { INITIAL_USERS, INITIAL_EMPLOYEES, CATEGORY_COLORS } from '../mockData';
import AnalyticsDashboard from './AnalyticsDashboard';

interface AdminPortalViewProps {
  tickets: Ticket[];
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  onUpdateTicketPriority: (ticketId: string, priority: TicketPriority) => void;
  onAssignTicketEmployee: (ticketId: string, employeeName: string, employeeAvatar?: string) => void;
  onAddTicketInternalNote: (ticketId: string, noteText: string) => void;
  onAddTicket: (ticket: Ticket) => void;
  onDeleteTicket: (ticketId: string) => void;
  onLogout: () => void;
  userName: string;
}

export default function AdminPortalView({
  tickets,
  onUpdateTicketStatus,
  onUpdateTicketPriority,
  onAssignTicketEmployee,
  onAddTicketInternalNote,
  onAddTicket,
  onDeleteTicket,
  onLogout,
  userName
}: AdminPortalViewProps) {
  // Navigation
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'dashboard' | 'tickets' | 'users' | 'employees'>('dashboard');

  // Multi-select bulk lists
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TicketPriority>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // CRM Users Store State (Database Driven)
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  
  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setAllUsers(data);
        } else {
          // Fallback
          setAllUsers([...INITIAL_USERS, ...INITIAL_EMPLOYEES]);
        }
      } catch (err) {
        console.error("Error loading users from service channel:", err);
        setAllUsers([...INITIAL_USERS, ...INITIAL_EMPLOYEES]);
      }
    }
    loadUsers();
  }, []);

  const userAccounts = allUsers.filter(u => u.role === 'user');
  const employeeRoster = allUsers.filter(u => u.role === 'employee');

  // Edit/Management state
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserDept, setEditUserDept] = useState('IT');
  const [editUserSpec, setEditUserSpec] = useState('Cloud Infrastructure');
  const [editUserWorkload, setEditUserWorkload] = useState(0);
  const [editUserAvatar, setEditUserAvatar] = useState('');

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetTicketId, setAssignTargetTicketId] = useState<string | null>(null);
  
  // Inspector slideover target
  const [inspectedTicketId, setInspectedTicketId] = useState<string | null>(null);

  // New User Forms
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDept, setNewUserDept] = useState('IT');
  const [newUserRole, setNewUserRole] = useState<'user' | 'employee'>('user');
  const [newUserSpec, setNewUserSpec] = useState('Cloud Infrastructure');
  const [newUserAvatar, setNewUserAvatar] = useState('');
  const [generatedPass, setGeneratedPass] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [isResetPassOpen, setIsResetPassOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<UserAccount | null>(null);

  // Internal workspace note state
  const [internalNoteText, setInternalNoteText] = useState('');

  // Live real-time Activity scroll feed
  const [activities, setActivities] = useState<Array<{ id: string; text: string; time: string; type: string }>>([
    { id: '1', text: 'System diagnostic daemon verified floor links successfully.', time: 'Just now', type: 'system' },
    { id: '2', text: 'Ticket TKT-2026-0142 assigned to specialist Elena Rostova.', time: '4 mins ago', type: 'assign' },
    { id: '3', text: 'Marcus Vance edited priority guidelines on TKT-2026-0094.', time: '12 mins ago', type: 'modify' },
    { id: '4', text: 'Alexander Wright attached latency report logs.', time: '20 mins ago', type: 'file' }
  ]);

  // Simulated activity generator loop
  useEffect(() => {
    const actInterval = setInterval(() => {
      const liveActions = [
        'Telemetry clock synchronized with main cloud registry.',
        'Watchdog checked SLA compliance. Threshold >95% secured.',
        'Employee workstation floor AP state reported healthy.',
        'Audit agent processed active system performance tags.',
        'Alexander Wright updated chat thread status.'
      ];
      const randomText = liveActions[Math.floor(Math.random() * liveActions.length)];
      setActivities(prev => [{ id: Date.now().toString(), text: randomText, time: 'Just now', type: 'system' }, ...prev.slice(0, 10)]);
    }, 15000);
    return () => clearInterval(actInterval);
  }, []);

  const inspectedTicket = tickets.find(t => t.id === inspectedTicketId) || null;

  // Toggle checklist select
  const toggleSelectTicket = (id: string) => {
    setSelectedTicketIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const listToMatch = filteredTickets.map(t => t.id);
    const allSelected = listToMatch.every(id => selectedTicketIds.includes(id));
    if (allSelected) {
      setSelectedTicketIds(prev => prev.filter(id => !listToMatch.includes(id)));
    } else {
      setSelectedTicketIds(prev => Array.from(new Set([...prev, ...listToMatch])));
    }
  };

  // Bulk actions triggers
  const handleBulkUpdateStatus = (status: TicketStatus) => {
    selectedTicketIds.forEach(id => onUpdateTicketStatus(id, status));
    setSelectedTicketIds([]);
  };

  const handleBulkUpdatePriority = (priority: TicketPriority) => {
    selectedTicketIds.forEach(id => onUpdateTicketPriority(id, priority));
    setSelectedTicketIds([]);
  };

  const handleBulkExportCSV = () => {
    const header = "TicketID,Title,Category,Priority,Department,Status,Created\n";
    const selectedRows = tickets
      .filter(t => selectedTicketIds.includes(t.id))
      .map(t => `"${t.id}","${t.title}","${t.category}","${t.priority}","${t.department}","${t.status}","${t.date}"`)
      .join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + header + selectedRows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `probsolver_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSelectedTicketIds([]);
  };

  // CRM Users CRUD Handlers
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPass(pass);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const usernameSuggest = newUserName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newAccount: UserAccount = {
      id: `${newUserRole === 'employee' ? 'EMP' : 'USR'}-${Math.floor(100 + Math.random() * 900)}`,
      name: newUserName,
      username: usernameSuggest,
      email: newUserEmail,
      department: newUserDept,
      status: 'active',
      role: newUserRole,
      specialization: newUserRole === 'employee' ? newUserSpec : undefined,
      currentWorkload: newUserRole === 'employee' ? 0 : undefined,
      avatar: newUserAvatar || (newUserRole === 'employee' 
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
        : 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120'),
      password: generatedPass,
      isFirstLogin: true
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      });
      if (res.ok) {
        const saved = await res.json();
        setAllUsers(prev => [...prev, saved]);
      } else {
        setAllUsers(prev => [...prev, newAccount]);
      }
    } catch (err) {
      console.error("User creation failed:", err);
      setAllUsers(prev => [...prev, newAccount]);
    }

    // Reset Form
    setNewUserName('');
    setNewUserEmail('');
    setNewUserAvatar('');
    setGeneratedPass('');
    setCopiedSuccess(false);
    setIsAddUserOpen(false);
  };

  const handleToggleUserStatus = async (id: string, role: 'user' | 'employee') => {
    const targetUser = allUsers.find(u => u.id === id);
    if (!targetUser) return;
    const nextStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    
    setAllUsers(prev => prev.map(u => u.id === id ? { ...u, status: nextStatus } : u));

    try {
      await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (err) {
      console.error("User status toggle failed:", err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== id));

    try {
      await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error("User delete failed:", err);
    }
  };

  const startEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserDept(user.department);
    setEditUserSpec(user.specialization || 'Cloud Infrastructure');
    setEditUserWorkload(user.currentWorkload || 0);
    setEditUserAvatar(user.avatar || '');
    setIsEditUserOpen(true);
  };

  const handleUpdateUserDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updates: Partial<UserAccount> = {
      name: editUserName,
      email: editUserEmail,
      department: editUserDept,
      specialization: editingUser.role === 'employee' ? editUserSpec : undefined,
      currentWorkload: editingUser.role === 'employee' ? editUserWorkload : undefined,
      avatar: editUserAvatar || undefined
    };

    setAllUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updates } : u));
    setIsEditUserOpen(false);
    setEditingUser(null);

    try {
      await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.error("User update failed:", err);
    }
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(generatedPass);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleResetUserPassword = async (user: UserAccount) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPass(pass);
    setResetTargetUser(user);
    setIsResetPassOpen(true);

    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass, isFirstLogin: true })
      });
      setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, password: pass, isFirstLogin: true } : u));
    } catch (err) {
      console.error("Password reset update failed:", err);
    }
  };

  // Open assigns modal
  const openAssignModal = (ticketId: string) => {
    setAssignTargetTicketId(ticketId);
    setIsAssignModalOpen(true);
  };

  const handleAssignSelect = (employeeName: string, avatarUrl: string) => {
    if (assignTargetTicketId) {
      onAssignTicketEmployee(assignTargetTicketId, employeeName, avatarUrl);
      setIsAssignModalOpen(false);
      setAssignTargetTicketId(null);
    }
  };

  const handleAddPrivateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNoteText.trim() || !inspectedTicketId) return;
    onAddTicketInternalNote(inspectedTicketId, internalNoteText);
    setInternalNoteText('');
  };

  // KPI math
  const kpiTotal = tickets.length;
  const kpiOpen = tickets.filter(t => t.status === 'open').length;
  const kpiInProgress = tickets.filter(t => t.status === 'in_progress' || t.status === 'pending').length;
  const kpiResolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const totalRoster = userAccounts.length + employeeRoster.length;

  // Filter list logic
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-[#050814]">
      
      {/* SIDEBAR NAVIGATION CONTROL (Aether admin look) */}
      <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.01] backdrop-blur-xl flex flex-col p-6 gap-6 shrink-0 z-20">
        <div className="border-b border-white/5 pb-5 flex flex-col gap-1">
          <img
            src="/image/Logo.png"
            alt="ProbSolver Logo"
            className="h-8 object-contain self-start"
          />
          <div className="flex flex-col gap-0.5 pl-1">
            <p className="text-[9px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Platform Admin</p>
            <p className="text-[7.5px] text-slate-400 tracking-wider font-bold uppercase font-sans">Smarter Support. Faster Resolution.</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1 text-xs">
          {[
            { id: 'dashboard', label: 'Command Desk', icon: BarChart3 },
            { id: 'tickets', label: 'All Ingress Tickets', icon: Server, badge: tickets.filter(t=>t.status==='open').length },
            { id: 'users', label: 'User CRM Accounts', icon: Users },
            { id: 'employees', label: 'Workforce Roster', icon: Briefcase }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeAdminSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveAdminSubTab(item.id as any);
                  setInspectedTicketId(null);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-purple-500/10 to-transparent text-white border-l-2 border-[#A78BFA] shadow-inner' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#A78BFA]' : ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="bg-rose-500 text-[10px] text-white font-bold h-4 px-1.5 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 pt-4 border-t border-white/5 text-xs">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer transition-colors font-bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 11-6 0v-1m6-9v1a3 3 0 01-6 0V4" />
            </svg>
            <span>Exit Platform</span>
          </button>
        </div>
      </aside>

      {/* CORE ADMIN CONTENT */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto relative z-10 w-full flex flex-col gap-6">
        
        {/* TAB 1 — ADMIN DESK OVERVIEW */}
        {activeAdminSubTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#F1F5F9] font-sans tracking-tight">Platform Intelligence Dashboard</h2>
              <p className="text-slate-400 text-xs mt-1">Live IT support throughput, workforce workloads, and operational feeds</p>
            </div>

            {/* Glowing stat counters row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Ingress Packets', value: kpiTotal, glow: 'shadow-purple-500/10 border-purple-500/20 text-purple-400' },
                { label: 'Open Incidents', value: kpiOpen, glow: 'shadow-rose-500/10 border-rose-500/20 text-rose-400 font-bold' },
                { label: 'Workforce Assigned', value: kpiInProgress, glow: 'shadow-amber-500/10 border-amber-500/20 text-amber-400' },
                { label: 'Average SLA Speed', value: '1.4 hrs', glow: 'shadow-cyan-500/10 border-cyan-500/20 text-cyan-400' }
              ].map((card, cIndex) => (
                <div key={cIndex} className={`p-4 rounded-2xl border bg-white/[0.02] backdrop-blur-md shadow-md ${card.glow}`}>
                  <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500 font-bold">{card.label}</span>
                  <div className="text-3xl font-extrabold text-white mt-1.5">{card.value}</div>
                </div>
              ))}
            </div>

            {/* Middle row: SVG Charts & Real time Activity Logging */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Category charts (Inline custom SVGs to guarantee zero-crashing reliability) */}
              <div className="lg:col-span-8 p-6 rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-xl space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white">Tickets Allocation Matrix</h3>
                  <p className="text-[11px] text-slate-500">Live proportional loads across technology divisions</p>
                </div>

                <div className="space-y-3.5">
                  {[
                    { label: 'Hardware Support Services', count: tickets.filter(t=>t.category==='Hardware').length, max: tickets.length, color: 'bg-cyan-500 shadow-cyan-450/40' },
                    { label: 'Software Licensing Protocols', count: tickets.filter(t=>t.category==='Software').length, max: tickets.length, color: 'bg-purple-500 shadow-purple-450/40' },
                    { label: 'Core Fiber Switch Networks', count: tickets.filter(t=>t.category==='Network').length, max: tickets.length, color: 'bg-indigo-500 shadow-indigo-400/40' },
                    { label: 'SAML Multi-factor Authentication', count: tickets.filter(t=>t.category==='Access').length, max: tickets.length, color: 'bg-amber-500 shadow-amber-450/40' }
                  ].map((cat, barIdx) => {
                    const percentage = cat.max > 0 ? (cat.count / cat.max) * 100 : 0;
                    return (
                      <div key={barIdx} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center text-slate-300 font-medium font-sans">
                          <span>{cat.label}</span>
                          <span className="font-mono font-bold text-white">{cat.count} files ({Math.round(percentage)}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 w-full overflow-hidden">
                          <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Real time logging events flow */}
              <div className="lg:col-span-4 p-6 rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-xl h-[280px] flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 justify-between">
                    <span>Active Telemetry Logs Noiseless</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  </h3>
                  <p className="text-[11px] text-slate-500">Self-refreshing supervisor security updates</p>
                </div>

                <div className="flex-1 mt-4 overflow-y-auto space-y-3 pr-1 text-[10px] font-mono whitespace-nowrap" id="admin-log-scroller">
                  {activities.map((act) => (
                    <div key={act.id} className="flex gap-2 items-center text-slate-400 border-l border-[#A78BFA]/20 pl-2.5">
                      <span className="text-[8px] text-slate-500 shrink-0">{act.time}</span>
                      <span className="text-white font-medium truncate font-mono text-[10.5px]">{act.text}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Recharts Analytics Dashboard */}
            <div className="pt-4 border-t border-white/5">
              <AnalyticsDashboard tickets={tickets} />
            </div>

          </div>
        )}

        {/* TAB 2 — ALL INGRESS TICKETS ADVANCED PIPELINE */}
        {activeAdminSubTab === 'tickets' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#F1F5F9] font-sans tracking-tight">IT Helpdesk Support Ingress</h2>
                <p className="text-slate-400 text-xs mt-1">Multi-attribute filter indexes, workforce deployment tools, and bulk status updates</p>
              </div>
            </div>

            {/* Bulk Action tools if selected items are active */}
            {selectedTicketIds.length > 0 && (
              <motion.div 
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/10 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 text-[#A78BFA]" />
                  <span className="text-white font-bold">{selectedTicketIds.length} diagnostics selected</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleBulkUpdateStatus('resolved')}
                    className="p-2 py-1.5 rounded bg-emerald-500 text-black font-extrabold hover:bg-emerald-400 cursor-pointer text-[10.5px] transition-colors"
                  >
                    Solve Selected
                  </button>
                  <button
                    onClick={() => handleBulkUpdatePriority('critical')}
                    className="p-2 py-1.5 rounded bg-rose-500 text-white font-bold hover:bg-rose-400 cursor-pointer text-[10.5px] transition-colors"
                  >
                    Escalate Priority
                  </button>
                  <button
                    onClick={handleBulkExportCSV}
                    className="p-2 py-1.5 rounded bg-[#0f1129] border border-white/10 text-white font-mono hover:bg-white/5 cursor-pointer text-[10.5px] flex items-center gap-1.5 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#A78BFA]" />
                    <span>Download Raw CSV</span>
                  </button>
                  <button
                    onClick={() => setSelectedTicketIds([])}
                    className="p-2 py-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer text-[10.5px]"
                  >
                    Reset Checkboxes
                  </button>
                </div>
              </motion.div>
            )}

            {/* Dynamic filter panel */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="ID, Title, Submitter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-white/10 bg-white/[0.02] text-white focus:outline-none focus:border-purple-600 focus:bg-white/[0.04] transition-all"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-white/10 bg-[#0f1129] text-white font-mono text-[11px] cursor-pointer"
                >
                  <option value="all">Any Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-white/10 bg-[#0f1129] text-white font-mono text-[11px] cursor-pointer"
                >
                  <option value="all">Any Threat</option>
                  <option value="low">Low Severity</option>
                  <option value="medium">Medium Threat</option>
                  <option value="high">High priority</option>
                  <option value="critical">Critical Exceeds</option>
                </select>
              </div>

              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-2 rounded-lg border border-white/10 bg-[#0f1129] text-white font-mono text-[11px] cursor-pointer"
                >
                  <option value="all">Any Category</option>
                  <option value="Hardware">Hardware Diagnostics</option>
                  <option value="Software">Software Softwares</option>
                  <option value="Network">Network Links</option>
                  <option value="Access">Access Permissions</option>
                  <option value="Other">Standard</option>
                </select>
              </div>
            </div>

            {/* Primary Grid Workspace */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Tables column (col-span-8) */}
              <div className="xl:col-span-7 rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02] backdrop-blur-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400 font-mono uppercase text-[9px]">
                        <th className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={filteredTickets.length > 0 && filteredTickets.every(t => selectedTicketIds.includes(t.id))}
                            onChange={toggleSelectAll}
                            className="cursor-pointer"
                          />
                        </th>
                        <th className="p-3">Ticket ID</th>
                        <th className="p-3">Incident Summary</th>
                        <th className="p-3">Client</th>
                        <th className="p-3">Threat</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                      {filteredTickets.map((t) => {
                        const isChecked = selectedTicketIds.includes(t.id);
                        return (
                          <tr 
                            key={t.id} 
                            onClick={() => setInspectedTicketId(t.id)}
                            className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${
                              inspectedTicketId === t.id ? 'bg-purple-950/15' : ''
                            }`}
                          >
                            <td className="p-3 text-center" onClick={(e)=>e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectTicket(t.id)}
                                className="cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-mono font-bold text-[#A78BFA]">{t.id}</td>
                            <td className="p-3 max-w-[200px] truncate font-semibold text-white">
                              {t.title}
                            </td>
                            <td className="p-3 font-medium text-slate-300">{t.clientName.split(' ')[0]}</td>
                            <td className="p-3 capitalize font-mono text-[9px] font-extrabold text-[#A78BFA]">
                              {t.priority}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] uppercase font-mono font-bold ${
                                t.status === 'open' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' :
                                t.status === 'in_progress' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                                t.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                                'bg-slate-500/10 text-slate-400'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-1" onClick={(e)=>e.stopPropagation()}>
                              <button
                                onClick={() => openAssignModal(t.id)}
                                className="p-1 px-2 rounded bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 text-[9px] font-mono font-bold cursor-pointer transition-colors"
                              >
                                Delegate Staff
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INSPECTOR VIEW CONTAINER (col-span-5) */}
              <div className="xl:col-span-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-5 space-y-5 h-full">
                {inspectedTicket ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-[#A78BFA] font-bold">Diagnostics Analyzer</span>
                        <h4 className="text-sm font-bold text-white mt-1">{inspectedTicket.id} Detail Sheet</h4>
                      </div>
                      <button 
                        onClick={() => onDeleteTicket(inspectedTicket.id)}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 cursor-pointer transition-all"
                        title="Delete ticket context permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold font-mono text-slate-500 uppercase">Title</span>
                      <p className="text-xs font-semibold text-white leading-relaxed">{inspectedTicket.title}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="block text-[8px] font-mono text-slate-500 uppercase font-bold">Severity Risk</span>
                        <select
                          value={inspectedTicket.priority}
                          onChange={(e) => onUpdateTicketPriority(inspectedTicket.id, e.target.value as any)}
                          className="w-full mt-1 p-2 rounded-lg border border-white/10 bg-[#0f1129] text-white font-mono text-[10.5px]"
                        >
                          <option value="low">Low Severity</option>
                          <option value="medium">Medium Threat</option>
                          <option value="high">High Priority</option>
                          <option value="critical">Critical Exceeds</option>
                        </select>
                      </div>
                      <div>
                        <span className="block text-[8px] font-mono text-slate-500 uppercase font-bold">Platform State</span>
                        <select
                          value={inspectedTicket.status}
                          onChange={(e) => onUpdateTicketStatus(inspectedTicket.id, e.target.value as any)}
                          className="w-full mt-1 p-2 rounded-lg border border-white/10 bg-[#0f1129] text-white font-mono text-[10.5px]"
                        >
                          <option value="open">Open State</option>
                          <option value="in_progress">Investigating</option>
                          <option value="pending">Pending</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed Archive</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold font-mono text-slate-500 uppercase">User Identity details</span>
                      <p className="text-xs text-slate-300 font-semibold">{inspectedTicket.clientName} ({inspectedTicket.clientEmail})</p>
                    </div>

                    {/* Private admin workspace notes (Module requirement) */}
                    <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-3">
                      <span className="text-[9px] font-mono text-[#A78BFA] uppercase font-bold tracking-wider">Private Command Center Notes</span>
                      
                      {inspectedTicket.internalNotes && inspectedTicket.internalNotes.length > 0 ? (
                        <div className="space-y-2 max-h-[80px] overflow-y-auto">
                          {inspectedTicket.internalNotes.map((note, nIdx) => (
                            <p key={nIdx} className="text-[10px] font-mono text-slate-300 border-l border-purple-500 pl-2">
                              {note}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[9.5px] font-mono text-slate-500">No internal oversight notes logged.</p>
                      )}

                      <form onSubmit={handleAddPrivateNote} className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Log diagnostic note..."
                          value={internalNoteText}
                          onChange={(e) => setInternalNoteText(e.target.value)}
                          className="flex-1 p-2 border border-white/10 bg-white/[0.02] text-[10px] placeholder-slate-500 rounded focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="p-1 px-2 bg-[#A78BFA] text-black font-extrabold hover:bg-white text-[9px] font-mono rounded cursor-pointer"
                        >
                          Add Note
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-2.5 animate-pulse" />
                    <p className="text-xs font-mono text-slate-400">Select any telemetry row to inspect fields and allocate support workforce.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 3 — CRMS USER ACCOUNT MANAGEMENT */}
        {activeAdminSubTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-[#F1F5F9] font-sans tracking-tight">User CRM Accounts Database</h2>
                <p className="text-slate-400 text-xs mt-1">Full CRUD access: modify user roles, de-provision accounts, reset access, reset credentials</p>
              </div>
              
              <button
                onClick={() => {
                  setNewUserRole('user');
                  handleGeneratePassword();
                  setIsAddUserOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-black bg-gradient-to-tr from-[#6C63FF] to-[#A78BFA] rounded-xl cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-black" />
                <span>Add Workspace account</span>
              </button>
            </div>

            {/* Users list database table */}
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02] backdrop-blur-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400 font-mono uppercase text-[9px]">
                    <th className="p-4">Staff ID</th>
                    <th className="p-4">Operator Name</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Oversight Department</th>
                    <th className="p-4">Telemetry Access State</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                  {userAccounts.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="p-4 font-mono text-slate-500">{user.id}</td>
                      <td className="p-4 text-white font-bold flex items-center gap-2.5">
                        <img
                          src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'}
                          alt={user.name}
                          className="w-7 h-7 rounded-full border border-[#6C63FF]/30 object-cover bg-slate-900"
                        />
                        <span>{user.name}</span>
                      </td>
                      <td className="p-4 font-mono text-cyan-400">@{user.username}</td>
                      <td className="p-4 text-slate-300">{user.email}</td>
                      <td className="p-4 text-slate-400 font-medium">{user.department}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                          user.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => startEditUser(user)}
                          className="p-1 px-2.5 rounded text-[10px] font-sans font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 cursor-pointer transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleResetUserPassword(user)}
                          className="p-1 px-2.5 rounded text-[10px] font-sans font-bold bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 cursor-pointer transition-colors"
                        >
                          Reset Pass
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user.id, 'user')}
                          className={`p-1 px-2.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                            user.status === 'active' 
                              ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20' 
                              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                          }`}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Reactivate'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 px-2 rounded text-[10px] font-sans font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer transition-colors inline-block align-middle"
                          title="Delete User Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4 — SUPPORT WORKFORCE OVERVIEW */}
        {activeAdminSubTab === 'employees' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-[#F1F5F9] font-sans tracking-tight">Workforce Diagnostic Support specialized</h2>
                <p className="text-slate-400 text-xs mt-1">Check active ticket workloads, specialized categories load, and workforce availability</p>
              </div>

              <button
                onClick={() => {
                  setNewUserRole('employee');
                  handleGeneratePassword();
                  setIsAddUserOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-black bg-gradient-to-tr from-[#6C63FF] to-[#A78BFA] rounded-xl cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-black" />
                <span>Add Specialized Staff</span>
              </button>
            </div>

            {/* Grid layout of personnel workload meters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {employeeRoster.map((emp) => (
                <div
                  key={emp.id}
                  className="p-5 rounded-2xl border border-white/10 bg-[#0f1129]/30 backdrop-blur-xl relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="w-10 h-10 rounded-full border border-[#A78BFA]/20 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white font-sans">{emp.name}</h4>
                      <span className="text-[9px] font-mono bg-purple-500/15 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/25 font-bold uppercase tracking-wider">
                        {emp.specialization || 'Support Expert'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Current Workload quota</span>
                      <span className="font-mono font-bold text-[#A78BFA]">{emp.currentWorkload || 0} Open Tickets</span>
                    </div>

                    <div className="h-2 rounded-full bg-white/5 w-full">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500" 
                        style={{ width: `${Math.min(100, ((emp.currentWorkload || 0) / 5) * 100)}%` }} 
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[9px] font-mono text-slate-500">
                      <span>Status: <span className={`${emp.status === 'active' ? 'text-green-400' : 'text-rose-400'} font-bold uppercase`}>{emp.status}</span></span>
                      <span>{emp.email}</span>
                    </div>

                    <div className="flex gap-2 justify-end pt-3 mt-1 border-t border-white/5">
                      <button
                        onClick={() => startEditUser(emp)}
                        className="py-1 px-2.5 rounded text-[10px] font-sans font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 cursor-pointer transition-colors"
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={() => handleResetUserPassword(emp)}
                        className="py-1 px-2.5 rounded text-[10px] font-sans font-bold bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 cursor-pointer transition-colors"
                      >
                        Reset Pass
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(emp.id, 'employee')}
                        className={`py-1 px-2.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                          emp.status === 'active' 
                            ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20' 
                            : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                        }`}
                      >
                        {emp.status === 'active' ? 'Deactivate' : 'Reactivate'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(emp.id)}
                        className="p-1 px-2 rounded text-[10px] font-sans font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer transition-all inline-flex items-center justify-center"
                        title="Delete Employee Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MODAL 1 — USER CREATION DIALOG WITH COPY CODES (Module 3C) */}
      <AnimatePresence>
        {isAddUserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e1e] p-6 shadow-2xl text-xs"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#A78BFA]" />
                    Provision Platform Account
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Configure role, credentials and generate secure temporary passwords</p>
                </div>
                <button
                  onClick={() => setIsAddUserOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUserSubmit} className="space-y-4 font-medium text-slate-300">
                <div className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                  <div className="relative shrink-0">
                    <img
                      src={newUserAvatar || (newUserRole === 'employee' 
                        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
                        : 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120')}
                      alt="Avatar Preview"
                      className="w-12 h-12 rounded-full border border-indigo-500/20 object-cover bg-slate-950"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase font-bold">Profile Picture</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewUserAvatar(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-[10px] text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#6C63FF]/15 file:text-purple-300 hover:file:bg-[#6C63FF]/30 file:cursor-pointer cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase font-bold">Operator Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-white/[0.02] text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase font-bold">Workspace Email *</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g. e.rostova@vrtickets.secure"
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-white/[0.02] text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase font-bold">Role Assignment</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full p-2.5 rounded-lg border border-white/10 bg-[#0f1129] text-white cursor-pointer"
                    >
                      <option value="user">User Client</option>
                      <option value="employee">Specialized Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase font-bold">Dept Oversight</label>
                    <select
                      value={newUserDept}
                      onChange={(e) => setNewUserDept(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-white/10 bg-[#0f1129] text-white cursor-pointer"
                    >
                      <option value="IT">IT Support</option>
                      <option value="Finance">Finance Division</option>
                      <option value="Operations">Operations</option>
                      <option value="HR">HR Dept</option>
                    </select>
                  </div>
                </div>

                {newUserRole === 'employee' && (
                  <div>
                    <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase font-bold">Workforce Specialization</label>
                    <select
                      value={newUserSpec}
                      onChange={(e) => setNewUserSpec(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-white/10 bg-[#0f1129] text-white cursor-pointer"
                    >
                      <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                      <option value="Access Control">Access Control</option>
                      <option value="Hardware Support">Hardware Support</option>
                      <option value="Network link diagnostics">Network diagnostics</option>
                    </select>
                  </div>
                )}

                {/* Simulated Temp Password Copy zone */}
                <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-[#A78BFA] uppercase font-bold">Tempo Passcode</span>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[9px] font-mono text-[#A78BFA] hover:text-white font-bold cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded border border-white/5 font-mono">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="flex-1 text-white font-bold text-xs">{generatedPass}</span>
                    <button
                      type="button"
                      onClick={handleCopyClipboard}
                      className="p-1 hover:bg-white/5 text-[#A78BFA] hover:text-white rounded cursor-pointer"
                    >
                      {copiedSuccess ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="p-2 text-slate-400 hover:text-white cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-gradient-to-tr from-[#6C63FF] to-[#A78BFA] text-black font-extrabold rounded-xl cursor-pointer hover:shadow-lg transition-all"
                  >
                    Confirm Provision
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 1B — EDIT/MANAGE USER AND SUPPORT STAFF (CRUD OVERWATCH) */}
      <AnimatePresence>
        {isEditUserOpen && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e1e] p-6 shadow-2xl text-xs text-left"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4 font-sans">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 capitalize">
                    <Edit3 className="w-4 h-4 text-[#A78BFA]" />
                    Manage {editingUser.role} Account Details
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Modify database attributes and allocation limits for ID: {editingUser.id}</p>
                </div>
                <button
                  onClick={() => setIsEditUserOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateUserDetails} className="space-y-4 font-medium text-slate-300 text-left">
                <div className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                  <div className="relative shrink-0">
                    <img
                      src={editUserAvatar || (editingUser.role === 'employee' 
                        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
                        : 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120')}
                      alt="Avatar Preview"
                      className="w-12 h-12 rounded-full border border-indigo-500/20 object-cover bg-slate-950"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase font-bold">Profile Picture</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditUserAvatar(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-[10px] text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#6C63FF]/15 file:text-purple-300 hover:file:bg-[#6C63FF]/30 file:cursor-pointer cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase font-bold">Operator Display Name *</label>
                  <input
                    type="text"
                    required
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    placeholder="Display Name"
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-white/[0.02] text-white focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase font-bold">Workspace Email *</label>
                  <input
                    type="email"
                    required
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-white/[0.02] text-white focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase font-bold">Oversight Department</label>
                  <select
                    value={editUserDept}
                    onChange={(e) => setEditUserDept(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-[#0f1129] text-white cursor-pointer"
                  >
                    <option value="IT Support">IT Support</option>
                    <option value="IT">IT Department</option>
                    <option value="Finance">Finance Division</option>
                    <option value="Operations">Operations</option>
                    <option value="HR">HR Dept</option>
                    <option value="Access & Compliance">Access & Compliance</option>
                    <option value="Hardware Dev">Hardware Dev</option>
                  </select>
                </div>

                {editingUser.role === 'employee' && (
                  <>
                    <div>
                      <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase font-bold">Diagnostics Specialization</label>
                      <select
                        value={editUserSpec}
                        onChange={(e) => setEditUserSpec(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-white/10 bg-[#0f1129] text-white cursor-pointer"
                      >
                        <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                        <option value="Access Control">Access Control</option>
                        <option value="Hardware Support">Hardware Support</option>
                        <option value="Network link diagnostics">Network diagnostics</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-[10px] font-mono text-[#A78BFA] uppercase font-bold">Override Workload Quota ({editUserWorkload} active)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={editUserWorkload}
                          onChange={(e) => setEditUserWorkload(Number(e.target.value))}
                          className="flex-1 accent-[#A78BFA] bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="font-mono text-xs text-[#A78BFA] font-bold w-12 text-right">{editUserWorkload} Active</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-3 border-t border-white/5 flex justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={() => setIsEditUserOpen(false)}
                    className="p-2 text-slate-400 hover:text-white cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-gradient-to-tr from-[#6C63FF] to-[#A78BFA] text-black font-extrabold rounded-xl cursor-pointer hover:shadow-lg transition-all"
                  >
                    Update Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2 — MANUALLY DELEGATE OPERATORS STAFF TO INCIDENTS */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0c0e1e] p-5 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Delegate Telecom Specialist</h3>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {employeeRoster.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => handleAssignSelect(emp.name, emp.avatar)}
                    className="p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-8 h-8 rounded-full border border-indigo-500/25 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-white text-xs truncate leading-snug">{emp.name}</p>
                        <span className="text-[9px] text-[#A78BFA] font-mono">{emp.specialization}</span>
                      </div>
                    </div>

                    <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono text-[9px] px-1.5 py-0.5 rounded">
                      {emp.currentWorkload || 0} Open
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 1C — PASSWORD RESET DIALOG */}
      <AnimatePresence>
        {isResetPassOpen && resetTargetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e1e] p-6 shadow-2xl text-xs space-y-4 text-left"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Reset Account Passcode</h3>
                <button
                  onClick={() => setIsResetPassOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-slate-300 space-y-2">
                <p>A new temporary passcode has been generated for operator <strong className="text-white">{resetTargetUser.name}</strong> (@{resetTargetUser.username}).</p>
                <p className="text-[10px] text-slate-500 font-sans leading-relaxed">Provide this passcode to the user. When they log in with it, they will be intercepted to set their permanent password and upload/verify their profile picture.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1.5">
                <span className="text-[10px] font-mono text-[#A78BFA] uppercase font-bold">Temporary Passcode</span>
                <div className="flex items-center gap-2 bg-black/40 p-2 rounded border border-white/5 font-mono">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="flex-1 text-white font-bold text-xs">{generatedPass}</span>
                  <button
                    type="button"
                    onClick={handleCopyClipboard}
                    className="p-1 hover:bg-white/5 text-[#A78BFA] hover:text-white rounded cursor-pointer"
                  >
                    {copiedSuccess ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsResetPassOpen(false)}
                  className="px-4 py-2 bg-gradient-to-tr from-[#6C63FF] to-[#A78BFA] text-black font-extrabold rounded-xl cursor-pointer hover:shadow-lg transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
