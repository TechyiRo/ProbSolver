import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, LayoutGrid, List, Search, Filter, Calendar, 
  Paperclip, Send, Smile, X, ArrowUpRight, CheckCircle2, 
  MessageSquare, Clock, ShieldCheck, HelpCircle, HardDrive, 
  AlertTriangle, Eye, ArrowLeft, Download, Trash, FileText, Image as ImageIcon, Building2
} from 'lucide-react';
import { Ticket, TicketPriority, TicketStatus, Attachment, TimelineMessage } from '../types';
import { CATEGORY_COLORS } from '../mockData';
import TicketDetails from './TicketDetails';

interface UserPortalViewProps {
  tickets: Ticket[];
  userName: string;
  userEmail: string;
  userAvatar?: string;
  userCompany?: {
    name: string;
    address: string;
    logo?: string;
  };
  onLogout: () => void;
  onAddNewTicket: (newTicket: Ticket) => void;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  onAddChatMessage: (ticketId: string, message: TimelineMessage) => void;
  onDeleteChatMessage?: (ticketId: string, messageId: string) => void;
  onMarkSeen?: (ticketId: string, role: string) => void;
  notificationsCount: number;
  onOpenNotifications: () => void;
}

export default function UserPortalView({
  tickets,
  userName,
  userEmail,
  userAvatar,
  userCompany,
  onLogout,
  onAddNewTicket,
  onUpdateTicketStatus,
  onAddChatMessage,
  onDeleteChatMessage,
  onMarkSeen,
  notificationsCount,
  onOpenNotifications
}: UserPortalViewProps) {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'new-ticket' | 'my-tickets' | 'chats'>('dashboard');
  const [viewLayout, setViewLayout] = useState<'list' | 'grid'>('list');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter queries
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TicketPriority>('all');

  // New ticket state
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Network');
  const [ticketPriority, setTicketPriority] = useState<TicketPriority>('medium');
  const [ticketDept, setTicketDept] = useState('IT');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketExpectedDate, setTicketExpectedDate] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Attachment[]>([]);
  const [formError, setFormError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  // Live chat state
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new chat
  const activeSelectedTicket = tickets.find(t => t.id === selectedTicketId) || null;
  useEffect(() => {
    if (activeSelectedTicket) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSelectedTicket?.timeline, selectedTicketId]);

  // Compute initials & color accent from username
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Stats calculation
  const myTickets = tickets.filter(t => t.clientEmail === userEmail || t.clientName === userName);
  const totalRaised = myTickets.length;
  const totalOpen = myTickets.filter(t => t.status === 'open').length;
  const totalResolved = myTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  // Filtered list
  const filteredMyTickets = myTickets.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      const newAttachments: Attachment[] = files.map((file: any) => {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        return {
          name: file.name,
          size: `${sizeMb} MB`,
          type: file.type || 'application/octet-stream'
        };
      });

      // Limit to 5 files
      if (attachedFiles.length + newAttachments.length > 5) {
        setFormError("Maximum index buffer exceeded. Limit to 5 file packets.");
        setTimeout(() => setFormError(""), 4000);
        return;
      }

      setAttachedFiles(prev => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (indexNum: number) => {
    setAttachedFiles(prev => prev.filter((_, idx) => idx !== indexNum));
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (ticketTitle.length < 5) {
      setFormError("Telemetry Title requires a minimum of 5 characters.");
      return;
    }
    if (ticketDesc.length < 20) {
      setFormError("Context description is critical. Please provide at least 20 characters.");
      return;
    }

    const newGeneratedId = `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const freshTicketData: Ticket = {
      id: newGeneratedId,
      title: ticketTitle,
      category: ticketCategory,
      priority: ticketPriority,
      department: ticketDept,
      description: ticketDesc,
      status: 'open',
      date: new Date().toISOString(),
      expectedResolutionDate: ticketExpectedDate || undefined,
      clientName: userName,
      clientEmail: userEmail,
      clientAvatar: userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
      assigneeName: 'Unassigned',
      assigneeAvatar: '',
      timeline: [
        {
          id: `msg-${Date.now()}`,
          sender: 'client',
          text: ticketDesc,
          timestamp: new Date().toISOString(),
          senderName: userName,
          senderAvatar: userAvatar
        },
        {
          id: `msg-sys-${Date.now()}`,
          sender: 'system',
          text: `Ticket initialized in Department queue ${ticketDept}. Specialized node assigned.`,
          timestamp: new Date().toISOString()
        }
      ],
      attachments: attachedFiles
    };

    onAddNewTicket(freshTicketData);

    // Dynamic Confetti & Success triggers
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      setActiveSubTab('my-tickets');
      // Reset form states
      setTicketTitle('');
      setTicketDesc('');
      setAttachedFiles([]);
      setTicketExpectedDate('');
    }, 2000);
  };

  // Typing state timer ref
  const typingTimerRef = useRef<any>(null);

  const handleInputChange = (val: string) => {
    setChatInput(val);
    if (!selectedTicketId) return;

    // Report that client is typing
    fetch(`/api/tickets/${selectedTicketId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'client', isTyping: true })
    }).catch(() => {});

    // Clear previous timer
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    // Set a timer to clear typing state after 2 seconds of inactivity
    typingTimerRef.current = setTimeout(() => {
      fetch(`/api/tickets/${selectedTicketId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'client', isTyping: false })
      }).catch(() => {});
    }, 2000);
  };

  // Poll agent typing status of the active ticket
  useEffect(() => {
    if (!selectedTicketId) {
      setIsTyping(false);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tickets/${selectedTicketId}/typing`);
        if (res.ok) {
          const data = await res.json();
          // Show isTyping if agent is typing
          setIsTyping(!!data.agent);
        }
      } catch (err) {
        console.error("Error fetching typing status:", err);
      }
    }, 1500);

    return () => {
      clearInterval(interval);
      setIsTyping(false);
    };
  }, [selectedTicketId]);

  // Post chat messaging helper
  const handleSendChatText = () => {
    if (!chatInput.trim() || !selectedTicketId) return;

    const userMessage: TimelineMessage = {
      id: `usr-msg-${Date.now()}`,
      sender: 'client',
      text: chatInput,
      timestamp: new Date().toISOString()
    };

    onAddChatMessage(selectedTicketId, userMessage);
    setChatInput('');

    // Clear typing timer and set typing to false
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    fetch(`/api/tickets/${selectedTicketId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'client', isTyping: false })
    }).catch(() => {});
  };

  const selectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveSubTab('chats');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-[#050814]">
      {/* Dynamic inline confetti popups */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-8 rounded-3xl bg-neutral-900 border border-[#6C63FF]/30 text-center shadow-2xl relative"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/40">
              <CheckCircle2 className="w-12 h-12 text-green-400 animate-bounce" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-sans">Telemetry Packet Submitted!</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Your IT helpdesk ticket was assigned. Connecting diagnostic specialists...
            </p>
            {/* Tiny Canvas particles simulation rendering inside */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute h-2 w-2 rounded-full bg-violet-400 top-1/4 left-1/4 animate-ping" />
              <div className="absolute h-3 w-3 rounded-full bg-cyan-400 bottom-1/4 right-1/4 animate-pulse" />
              <div className="absolute h-2 w-2 rounded-full bg-amber-400 top-1/2 right-1/12 animate-ping" style={{ animationDelay: '0.4s' }} />
            </div>
          </motion.div>
        </div>
      )}

      {/* MOBILE TOP BAR (Only visible on mobile) */}
      <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.01] backdrop-blur-xl z-30 shrink-0">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer animate-pulse"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <img
          src="/image/logo.png"
          alt="ProbSolver Logo"
          className="h-7 object-contain"
        />
        <button
          onClick={onOpenNotifications}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer relative"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notificationsCount > 0 && (
            <span className="absolute top-1 right-1 bg-rose-500 font-mono text-[8px] text-white font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center animate-pulse">
              {notificationsCount}
            </span>
          )}
        </button>
      </header>

      {/* MOBILE MENU DRAWER OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#050814]/95 border-r border-white/10 backdrop-blur-2xl p-6 flex flex-col gap-6 z-50 md:hidden overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-5">
                <div className="flex flex-col gap-1">
                  <img
                    src="/image/logo.png"
                    alt="ProbSolver Logo"
                    className="h-8 object-contain self-start"
                  />
                  <div className="flex flex-col gap-0.5 pl-1">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">User Console</p>
                    <p className="text-[7.5px] text-slate-400 tracking-wider font-bold uppercase font-sans">Smarter Support. Faster Resolution.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Identity */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-10 h-10 rounded-full border border-cyan-500/30 object-cover bg-slate-900"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-sm flex items-center justify-center border border-cyan-500/40">
                      {getInitials(userName)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">{userName}</h4>
                    <span className="text-[9px] font-mono bg-cyan-400/15 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-400/20 uppercase font-bold">
                      User
                    </span>
                  </div>
                </div>
                {userCompany && userCompany.name && (
                  <div className="mt-1 pt-2.5 border-t border-white/5 flex items-center gap-2 font-sans text-left">
                    {userCompany.logo ? (
                      <img
                        src={userCompany.logo}
                        alt={userCompany.name}
                        className="w-7 h-7 rounded-lg object-contain bg-white/5 border border-white/10 p-0.5"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-200 truncate">{userCompany.name}</p>
                      <p className="text-[8px] font-mono text-slate-500 truncate" title={userCompany.address}>
                        {userCompany.address.split(',').slice(0, 2).join(',')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <nav className="flex flex-col gap-1.5 flex-1">
                {[
                  { id: 'dashboard', label: 'Dashboard Overview', icon: Clock },
                  { id: 'new-ticket', label: 'Raise New Ticket', icon: PlusCircle, highlight: true },
                  { id: 'my-tickets', label: 'My Ingested Tickets', icon: FileText },
                  { id: 'chats', label: 'My Live Chats', icon: MessageSquare }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSubTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSubTab(item.id as any);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-r from-white/[0.08] to-white/[0.02] text-white border-l-2 border-[#6C63FF] shadow-inner' 
                          : item.highlight 
                            ? 'text-[#A78BFA] hover:bg-white/[0.02]' 
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#6C63FF]' : ''}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.id === 'new-ticket' && (
                        <span className="w-2 h-2 rounded-full bg-[#6C63FF] animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Global Notifications and Signout */}
              <div className="mt-auto space-y-3">
                <button
                  onClick={() => {
                    onOpenNotifications();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/[0.02] cursor-pointer transition-colors relative"
                >
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span>Notifications</span>
                  </div>
                  {notificationsCount > 0 && (
                    <span className="bg-rose-500 font-mono text-[9px] text-white font-bold h-5 px-1.5 rounded-full flex items-center justify-center animate-pulse">
                      {notificationsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer transition-colors font-semibold"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 11-6 0v-1m6-9v1a3 3 0 01-6 0V4" />
                  </svg>
                  <span>Exit Session</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DASHBOARD NAVIGATION SIDEBAR */}
      <aside className="hidden md:flex w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.01] backdrop-blur-xl flex-col p-6 gap-6 z-20 shrink-0">
        <div className="border-b border-white/5 pb-5 flex flex-col gap-1">
          <img
            src="/image/logo.png"
            alt="ProbSolver Logo"
            className="h-8 object-contain self-start"
          />
          <div className="flex flex-col gap-0.5 pl-1">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">User Console</p>
            <p className="text-[7.5px] text-slate-400 tracking-wider font-bold uppercase font-sans">Smarter Support. Faster Resolution.</p>
          </div>
        </div>

        {/* User Identity profile details */}
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-10 h-10 rounded-full border border-cyan-500/30 object-cover bg-slate-900"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-sm flex items-center justify-center border border-cyan-500/40">
                {getInitials(userName)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">{userName}</h4>
              <span className="text-[9px] font-mono bg-cyan-400/15 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-400/20 uppercase font-bold">
                User
              </span>
            </div>
          </div>
          {userCompany && userCompany.name && (
            <div className="mt-1 pt-2.5 border-t border-white/5 flex items-center gap-2 font-sans text-left">
              {userCompany.logo ? (
                <img
                  src={userCompany.logo}
                  alt={userCompany.name}
                  className="w-7 h-7 rounded-lg object-contain bg-white/5 border border-white/10 p-0.5"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[10px] font-bold text-slate-200 truncate">{userCompany.name}</p>
                <p className="text-[8px] font-mono text-slate-500 truncate" title={userCompany.address}>
                  {userCompany.address.split(',').slice(0, 2).join(',')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Routes Layout Navigation */}
        <nav className="flex flex-col gap-1.5 flex-1">
          {[
            { id: 'dashboard', label: 'Dashboard Overview', icon: Clock },
            { id: 'new-ticket', label: 'Raise New Ticket', icon: PlusCircle, highlight: true },
            { id: 'my-tickets', label: 'My Ingested Tickets', icon: FileText },
            { id: 'chats', label: 'My Live Chats', icon: MessageSquare }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id as any)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-white/[0.08] to-white/[0.02] text-white border-l-2 border-[#6C63FF] shadow-inner' 
                    : item.highlight 
                      ? 'text-[#A78BFA] hover:bg-white/[0.02]' 
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#6C63FF]' : ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'new-ticket' && (
                  <span className="w-2 h-2 rounded-full bg-[#6C63FF] animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Global Notifications bell launcher and signouts */}
        <div className="mt-auto space-y-3">
          <button
            onClick={onOpenNotifications}
            className="w-full flex items-center justify-between p-3 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/[0.02] cursor-pointer transition-colors relative"
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span>Notifications</span>
            </div>
            {notificationsCount > 0 && (
              <span className="bg-rose-500 font-mono text-[9px] text-white font-bold h-5 px-1.5 rounded-full flex items-center justify-center animate-pulse">
                {notificationsCount}
              </span>
            )}
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer transition-colors font-semibold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 11-6 0v-1m6-9v1a3 3 0 01-6 0V4" />
            </svg>
            <span>Exit Session</span>
          </button>
        </div>
      </aside>

      {/* WORKSPACE SUB VIEW WINDOWS */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto relative z-10 w-full flex flex-col gap-6">
        
        {/* SUBTAB 1 — USER DASHBOARD OVERVIEW */}
        {activeSubTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#F1F5F9] font-sans tracking-tight">
                Console Dashboard
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Telemetry diagnostic status check and quick-solve portals
              </p>
            </div>

            {/* Dashboard Three Glass Count KPI cards with count-ups */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { label: 'Total Tickets Raised', value: totalRaised, status: 'all', color: 'from-violet-600/30 to-indigo-600/10 border-indigo-500/20 text-[#A78BFA]' },
                { label: 'Pending Response', value: totalOpen, status: 'open', color: 'from-amber-500/20 to-orange-500/5 border-amber-500/20 text-amber-300' },
                { label: 'Resolved Tickets', value: totalResolved, status: 'resolved', color: 'from-emerald-500/20 to-teal-500/5 border-emerald-500/20 text-emerald-300' }
              ].map((stat, sIdx) => (
                <div
                  key={sIdx}
                  className={`p-5 rounded-2xl border bg-white/[0.02] bg-gradient-to-br ${stat.color} backdrop-blur-2xl`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">{stat.label}</span>
                  <div className="text-4xl font-extrabold mt-3 text-white">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Recent Tickets Block queue */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Recent Telemetry Pipelines</h3>
                  <p className="text-[11px] text-slate-500">Last 5 active tickets Raised under this workspace profile</p>
                </div>
                <button
                  onClick={() => setActiveSubTab('new-ticket')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-black bg-gradient-to-tr from-[#6C63FF] to-[#A78BFA] hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] transition-all cursor-pointer flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Raise Ticket</span>
                </button>
              </div>

              {myTickets.length === 0 ? (
                <div className="p-10 text-center border border-dashed border-white/10 rounded-xl">
                  <p className="text-xs text-slate-400 font-mono">No telemetry files ingested. Initiate first record above.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 font-sans">
                  {myTickets.slice(0, 5).map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => selectTicket(ticket.id)}
                      className="py-3.5 flex items-center justify-between hover:bg-white/[0.02] hover:px-2 rounded-lg transition-all cursor-pointer group"
                    >
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-[#A78BFA]">{ticket.id}</span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-white/5 bg-white/[0.02] text-slate-300">
                            {ticket.category}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                            ticket.priority === 'critical' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20' : 'bg-slate-500/10 text-slate-300 border border-white/5'
                          }`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-white group-hover:text-[#A78BFA] transition-colors truncate max-w-sm">
                          {ticket.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-mono border px-2 py-0.5 rounded-full font-bold ${
                          ticket.status === 'open' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' :
                          ticket.status === 'in_progress' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                          ticket.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                          'bg-slate-500/15 text-slate-400 border-white/5'
                        }`}>
                          {ticket.status}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-[#A78BFA] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2 — RAISE TICKET DESIGN PANEL (Module 2B) */}
        {activeSubTab === 'new-ticket' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#F1F5F9] font-sans tracking-tight">
                Ingest IT Telemetry Packet
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Dispatch detailed software bug patterns, access overrides, or network congestion indices
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl relative">
              <AnimatePresence>
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3.5 mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2 font-medium"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleCreateTicketSubmit} className="space-y-5 text-xs text-slate-300">
                
                {/* Title */}
                <div>
                  <label className="block mb-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                    Ticket Title / Core Incident Summary *
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    placeholder="Provide a specific descriptive title (e.g., VPN Floor 3 authentication failing)"
                    className="w-full p-3 rounded-xl border border-white/10 bg-white/[0.01] text-white focus:outline-none focus:border-[#6C63FF] focus:bg-white/[0.04] transition-all"
                  />
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category dropdown */}
                  <div>
                    <label className="block mb-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                      Diagnostic Category *
                    </label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full p-3 rounded-xl border border-white/10 bg-[#0f1129] text-white focus:outline-none focus:border-[#6C63FF] transition-all cursor-pointer"
                    >
                      <option value="Hardware">Hardware Diagnostics</option>
                      <option value="Software">Core Software Software</option>
                      <option value="Network">Network & Fiber Links</option>
                      <option value="Access">Access Permissions / SAML</option>
                      <option value="Other">Standard Inquiries</option>
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block mb-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                      Department Allocation
                    </label>
                    <select
                      value={ticketDept}
                      onChange={(e) => setTicketDept(e.target.value)}
                      className="w-full p-3 rounded-xl border border-white/10 bg-[#0f1129] text-white focus:outline-none focus:border-[#6C63FF] transition-all cursor-pointer"
                    >
                      <option value="IT">IT Infrastructure</option>
                      <option value="HR">Human Resources</option>
                      <option value="Finance">Finance Oversight</option>
                      <option value="Operations">Operations Department</option>
                      <option value="Management">Global Management</option>
                    </select>
                  </div>

                  {/* Expected resolution date */}
                  <div>
                    <label className="block mb-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                      Expected SLA Deadline
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={ticketExpectedDate}
                        onChange={(e) => setTicketExpectedDate(e.target.value)}
                        className="w-full p-3 rounded-xl border border-[#6c63ff]/20 bg-[#0f1129] text-white focus:outline-none focus:border-[#6C63FF] transition-all cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Priority Selection Pills (Module requirement: radio select) */}
                <div>
                  <label className="block mb-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                    Risk Assessment Priority *
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'low', label: '🟢 Low Severity', style: 'border-green-500/20 hover:border-green-400 text-green-300' },
                      { id: 'medium', label: '🟡 Medium Threat', style: 'border-amber-500/20 hover:border-amber-400 text-amber-300' },
                      { id: 'high', label: '🔴 High Priority', style: 'border-purple-500/20 hover:border-purple-400 text-purple-300' },
                      { id: 'critical', label: '🚨 Critical Escalation', style: 'border-rose-500/30 hover:border-rose-400 text-rose-300' }
                    ].map((pr) => (
                      <button
                        type="button"
                        key={pr.id}
                        onClick={() => setTicketPriority(pr.id as any)}
                        className={`flex-1 p-3 rounded-xl border font-sans text-xs font-semibold cursor-pointer transition-all ${
                          ticketPriority === pr.id 
                            ? 'bg-gradient-to-tr from-[#6C63FF] to-[#A78BFA] text-black border-white/20 font-bold shadow-lg shadow-[#6C63FF]/20' 
                            : `bg-white/[0.01] ${pr.style}`
                        }`}
                      >
                        {pr.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description Text area */}
                <div>
                  <label className="block mb-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                    Detailed Diagnostics Incident Log * <span className="text-[9px] text-[#A78BFA] font-mono">(Min 20 characters)</span>
                  </label>
                  <textarea
                    required
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    placeholder="Log environment variables, software layers, console outputs, stack traces, same-site headers, and accurate replication steps..."
                    rows={6}
                    className="w-full p-4 rounded-xl border border-white/10 bg-white/[0.01] text-white placeholder-slate-500 focus:outline-none focus:border-[#6C63FF] focus:bg-white/[0.04] transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Drag & Drop Attachments Zone */}
                <div>
                  <label className="block mb-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                    Optional Diagnostics Attachments <span className="text-[9px] text-slate-500 font-mono">(PDF, images, log files. Max 5 files. Max 10MB per packet)</span>
                  </label>
                  
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`relative p-8 rounded-2xl border-2 border-dashed transition-all duration-300 text-center cursor-pointer ${
                      dragActive 
                        ? 'border-[#6C63FF] bg-[#6C63FF]/10 scale-[1.01]' 
                        : 'border-white/10 hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.02]'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          const newAttachments: Attachment[] = files.map((file: any) => {
                            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
                            return {
                              name: file.name,
                              size: `${sizeMb} MB`,
                              type: file.type || 'application/octet-stream'
                            };
                          });
                          setAttachedFiles(prev => [...prev, ...newAttachments]);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />

                    <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none text-slate-400">
                      <Paperclip className="w-8 h-8 text-indigo-400 animate-pulse" />
                      <p className="text-xs font-semibold text-white">Drag & Drop diagnostics log bytes here</p>
                      <p className="text-[10px] text-slate-500 font-mono">or click to browse filesystem</p>
                    </div>
                  </div>

                  {/* Attachment Cards Grid List */}
                  {attachedFiles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                      {attachedFiles.map((file, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex items-center justify-between p-3 rounded-xl border border-[#6c63ff]/20 bg-white/[0.03] text-xs font-medium"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {file.type.includes('image') ? (
                              <ImageIcon className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <FileText className="w-4 h-4 text-[#A78BFA]" />
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate text-[11px]">{file.name}</p>
                              <span className="text-[9px] text-slate-500 font-mono">{file.size}</span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removeAttachment(file.fidx || fIdx)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-rose-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submissions Action */}
                <div className="pt-4 flex items-center justify-end gap-3.5 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('dashboard')}
                    className="p-3 text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
                  >
                    Cancel / Discard
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl text-black bg-gradient-to-r from-cyan-400 via-[#6C63FF] to-[#A78BFA] hover:shadow-[0_0_25px_rgba(108,99,255,0.45)] hover:scale-[1.01] active:scale-[0.99] font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Incept Diagnostic Ticket</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUBTAB 3 — MY TICKETS LIST/CARDS VIEW (Module 2C) */}
        {activeSubTab === 'my-tickets' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#F1F5F9] font-sans tracking-tight">
                  My Raised Pipeline Queue
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Check, query, and monitor status modifications on raised active tickets
                </p>
              </div>

              {/* Layout view toggler: list vs card grids */}
              <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/5 p-1 rounded-xl shrink-0 self-start sm:self-center">
                <button
                  onClick={() => setViewLayout('list')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${viewLayout === 'list' ? 'bg-[#6C63FF] text-black' : 'text-slate-400 hover:text-white'}`}
                  title="List View format"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewLayout('grid')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${viewLayout === 'grid' ? 'bg-[#6C63FF] text-black' : 'text-slate-400 hover:text-white'}`}
                  title="Masonry Grid layout"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col md:flex-row items-center gap-4 text-xs">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Query by ID, Title, scenario details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-white/10 bg-white/[0.02] text-white focus:outline-none focus:border-[#6C63FF] focus:bg-white/[0.04] transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto self-stretch">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="flex-1 md:flex-none p-2 rounded-lg border border-white/10 bg-[#0f1129] text-white font-mono text-[11px] cursor-pointer"
                >
                  <option value="all">Any Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="flex-1 md:flex-none p-2 rounded-lg border border-white/10 bg-[#0f1129] text-white font-mono text-[11px] cursor-pointer"
                >
                  <option value="all">Any Threat</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Ingested Tickets viewport render */}
            {filteredMyTickets.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 bg-[#0f1129]/20 backdrop-blur-md">
                <p className="text-xs text-slate-500 font-mono">No tracking pipelines matches the configured state attributes.</p>
              </div>
            ) : (
              viewLayout === 'list' ? (
                /* Tabular style compact layout */
                <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02] backdrop-blur-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400 font-mono uppercase text-[10px]">
                          <th className="p-4">Ticket ID</th>
                          <th className="p-4">Incident Title</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Risk Threat</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">SLA Deadline</th>
                          <th className="p-4 text-right">View Channel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                        {filteredMyTickets.map((t) => (
                          <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 font-mono font-bold text-[#A78BFA]">{t.id}</td>
                            <td className="p-4 max-w-sm truncate text-white font-semibold">{t.title}</td>
                            <td className="p-4">
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10">
                                {t.category}
                              </span>
                            </td>
                            <td className="p-4 capitalize">
                              <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                                t.priority === 'critical' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' :
                                t.priority === 'high' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' :
                                t.priority === 'medium' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                                'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                              }`}>
                                {t.priority}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-mono font-bold ${
                                t.status === 'open' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25' :
                                t.status === 'in_progress' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25' :
                                t.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' :
                                'bg-slate-500/15 text-slate-400'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400 font-mono text-[10px]">{t.expectedResolutionDate || 'Automated'}</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => selectTicket(t.id)}
                                className="px-3 py-1.5 rounded-lg border border-slate-500/20 hover:border-cyan-400 bg-white/[0.01] text-xs font-semibold hover:text-white text-slate-300 transition-all cursor-pointer"
                              >
                                View Chat & details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Card Layout bento blocks */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredMyTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => selectTicket(t.id)}
                      className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-xl hover:scale-[1.02] hover:border-[#6C63FF]/30 active:scale-95 transition-all cursor-pointer flex flex-col justify-between gap-5 relative group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-[#A78BFA]">{t.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-mono font-bold ${
                            t.status === 'open' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25' :
                            t.status === 'in_progress' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25' :
                            t.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' :
                            'bg-slate-500/10 text-slate-400'
                          }`}>
                            {t.status}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-[#A78BFA] transition-colors line-clamp-1">{t.title}</h4>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{t.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[9px] font-mono text-slate-500">
                        <span>Threat: <span className="text-[#A78BFA] capitalize font-bold">{t.priority}</span></span>
                        <span>{t.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* SUBTAB 4 — SPLIT TICKET DETAILS & ACTION CHATS (Module 2D) */}
        {activeSubTab === 'chats' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 items-stretch min-h-[500px]">
            {activeSelectedTicket ? (
              <>
                {/* LEFT CONSOLE — TICKET DATA DETAILED SHEET */}
                <div className="lg:w-7/12 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 flex flex-col justify-between gap-6 overflow-y-auto">
                  
                  {/* Title & Details Header */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2.5">
                      <span className="text-xs font-mono font-extrabold text-[#A78BFA] bg-white/5 border border-white/10 p-2 py-1 rounded-lg">
                        {activeSelectedTicket.id}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-[9px] uppercase font-mono font-extrabold border rounded-md ${
                          activeSelectedTicket.status === 'open' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' :
                          activeSelectedTicket.status === 'in_progress' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                          activeSelectedTicket.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                          'bg-slate-500/15 text-slate-400 border-white/5'
                        }`}>
                          {activeSelectedTicket.status}
                        </span>
                        
                        <span className="text-slate-500 text-xs">•</span>
                        
                        <span className="text-xs font-mono text-slate-400">Threat Priority: <span className="text-rose-400 font-bold capitalize">{activeSelectedTicket.priority}</span></span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-extrabold text-white tracking-tight leading-snug">
                        {activeSelectedTicket.title}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-500">
                        Category: <span className="text-[#A78BFA]">{activeSelectedTicket.category}</span> • Ingressed: {new Date(activeSelectedTicket.date).toLocaleString()}
                      </p>
                    </div>

                    {/* Timeline stepper of events */}
                    <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 relative">
                      <span className="absolute -top-2.5 left-4 text-[8px] font-mono font-bold uppercase tracking-widest text-[#A78BFA] bg-[#0c0d18] px-2 py-0.5 rounded border border-[#6c63ff]/20">
                        Incident Resolution Stepper
                      </span>
                      
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-1">
                        {[
                          { step: 'open', label: '1. Ingested' },
                          { step: 'in_progress', label: '2. Assigned' },
                          { step: 'pending', label: '3. Troubleshooting' },
                          { step: 'resolved', label: '4. Completed' }
                        ].map((nodeObj, index) => {
                          const isActive = activeSelectedTicket.status === nodeObj.step;
                          return (
                            <div key={index} className="flex flex-col items-center">
                              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border font-bold text-[8px] mb-1 ${
                                isActive ? 'bg-[#6C63FF] border-white text-black' : 'bg-transparent border-white/10 text-slate-600'
                              }`}>
                                {index + 1}
                              </span>
                              <span className={isActive ? 'text-[#A78BFA] font-bold' : 'text-slate-500'}>{nodeObj.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Main Description details */}
                    <div className="p-4 rounded-2xl bg-gradient-to-tr from-white/[0.02] to-transparent border border-white/5 space-y-2">
                      <span className="text-[8px] uppercase font-mono tracking-widest text-slate-500 font-bold">Metadata Payload Description</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line text-[11px] font-medium">
                        {activeSelectedTicket.description}
                      </p>
                    </div>

                    {/* Attached files lists gallery (light box trigger simulation) */}
                    {activeSelectedTicket.attachments.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[8px] uppercase font-mono tracking-widest text-slate-500 font-bold">Attached Diagnostic Packets</span>
                        <div className="grid grid-cols-2 gap-3">
                          {activeSelectedTicket.attachments.map((file, fIdx) => (
                            <div
                              key={fIdx}
                              className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01] text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-[#A78BFA] shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-semibold text-white truncate text-[11px]">{file.name}</p>
                                  <span className="text-[9px] text-slate-500 font-mono">{file.size}</span>
                                </div>
                              </div>
                              <button
                                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Download logs"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status self closure tools */}
                  {activeSelectedTicket.status !== 'resolved' && (
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <span className="text-slate-400">Incident resolved? close state telemetry pipeline</span>
                      <button
                        onClick={() => onUpdateTicketStatus(activeSelectedTicket.id, 'resolved')}
                        className="p-2 px-3.5 rounded-lg border border-green-500/20 bg-green-500/10 hover:bg-green-500/25 text-green-300 font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span>Self Solve Ticket</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="lg:w-5/12 max-h-[500px] h-[500px]">
                  <TicketDetails
                    ticket={activeSelectedTicket}
                    onSendMessage={(ticketId, text) => {
                      const newMsg: TimelineMessage = {
                        id: Date.now().toString(),
                        sender: 'client',
                        text,
                        timestamp: new Date().toISOString(),
                        senderName: userName,
                        senderAvatar: userAvatar
                      };
                      onAddChatMessage(ticketId, newMsg);
                    }}
                    onUpdateStatus={(ticketId, status) => {
                      onUpdateTicketStatus(ticketId, status);
                    }}
                    onDeleteMessage={onDeleteChatMessage}
                    onMarkSeen={onMarkSeen}
                    currentUserName={userName}
                    currentUserRole="user"
                    isTyping={isTyping}
                  />
                </div>
              </>
            ) : (
              <div className="w-full flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-white/10 bg-white/[0.01]">
                <HelpCircle className="w-12 h-12 text-slate-600 animate-pulse mb-3" />
                <h3 className="text-sm font-semibold text-white">No chat channel active</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">Select any ticket from My Ingested Tickets and verify resolution pipelines directly with support specialists</p>
                <button
                  onClick={() => setActiveSubTab('my-tickets')}
                  className="mt-4 px-4 py-2 rounded-lg border border-slate-500/20 hover:border-cyan-400 bg-white/[0.02] text-xs font-semibold hover:text-white text-slate-300 transition-all cursor-pointer"
                >
                  Browse Raised Queue
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
