import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, Search, Filter, MessageSquare, Send, CheckCircle2, 
  Clock, AlertTriangle, Paperclip, Smile, FileText, Image as ImageIcon, 
  Download, FileCheck, HelpCircle, ArrowLeft, RefreshCw, X, ChevronRight, PlayCircle
} from 'lucide-react';
import { Ticket, TicketPriority, TicketStatus, TimelineMessage, Attachment } from '../types';

interface EmployeePortalViewProps {
  tickets: Ticket[];
  employeeName: string;
  employeeAvatar?: string;
  onLogout: () => void;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  onAddChatMessage: (ticketId: string, message: TimelineMessage) => void;
  notificationsCount: number;
  onOpenNotifications: () => void;
}

export default function EmployeePortalView({
  tickets,
  employeeName,
  employeeAvatar,
  onLogout,
  onUpdateTicketStatus,
  onAddChatMessage,
  notificationsCount,
  onOpenNotifications
}: EmployeePortalViewProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Filters & Queries
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TicketPriority>('all');

  // Input states
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [isClientTyping, setIsClientTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);

  // Poll client typing status of the active ticket
  useEffect(() => {
    if (!selectedTicketId) {
      setIsClientTyping(false);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tickets/${selectedTicketId}/typing`);
        if (res.ok) {
          const data = await res.json();
          // Show isClientTyping if client is typing
          setIsClientTyping(!!data.client);
        }
      } catch (err) {
        console.error("Error fetching typing status:", err);
      }
    }, 1500);

    return () => {
      clearInterval(interval);
      setIsClientTyping(false);
    };
  }, [selectedTicketId]);

  const handleInputChange = (val: string) => {
    setChatInput(val);
    if (!selectedTicketId) return;

    // Report that agent is typing
    fetch(`/api/tickets/${selectedTicketId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'agent', isTyping: true })
    }).catch(() => {});

    // Clear previous timer
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    // Set a timer to clear typing state after 2 seconds of inactivity
    typingTimerRef.current = setTimeout(() => {
      fetch(`/api/tickets/${selectedTicketId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'agent', isTyping: false })
      }).catch(() => {});
    }, 2000);
  };

  // Quick Snippet canned replies (Requirement spec)
  const quickTemplateSnippets = [
    { label: 'Staging Diagnostic', text: 'Telemetry bytes successfully tested inside sandbox environment and isolated safely.' },
    { label: 'Network Resolved', text: 'Floor multicast routing limits verified. Flow indices successfully restored.' },
    { label: 'Credential Reset', text: 'Primary credentials and key tokens regenerated. Access state restored.' },
    { label: 'Escalate System', text: 'We have logged your diagnostic incident with backend cloud ops. Standby.' }
  ];

  const handleAppendSnippet = (text: string) => {
    setChatInput(prev => (prev ? `${prev} ${text}` : text));
  };

  const employeeAssignedTickets = tickets.filter(t => 
    t.assigneeName === employeeName || t.assigneeName.toLowerCase().includes('elena')
  );

  const filteredTickets = employeeAssignedTickets.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const activeSelectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeSelectedTicket) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSelectedTicket?.timeline, selectedTicketId]);

  const handleSendResponse = () => {
    if (!chatInput.trim() || !selectedTicketId) return;

    const newReplyMsg: TimelineMessage = {
      id: `emp-msg-${Date.now()}`,
      sender: 'agent',
      text: chatInput,
      timestamp: new Date().toISOString()
    };

    onAddChatMessage(selectedTicketId, newReplyMsg);
    setChatInput('');

    // Clear typing state on send
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    fetch(`/api/tickets/${selectedTicketId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'agent', isTyping: false })
    }).catch(() => {});
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-[#050814]">
      
      {/* EMPLOYEE PORTAL NAVIGATION SIDE PANEL */}
      <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.01] backdrop-blur-xl flex flex-col p-6 gap-6 shrink-0 z-20">
        <div className="border-b border-white/5 pb-5 flex flex-col gap-1">
          <img
            src="/image/Logo.png"
            alt="ProbSolver Logo"
            className="h-8 object-contain self-start"
          />
          <div className="flex flex-col gap-0.5 pl-1">
            <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest font-mono">Support Operator</p>
            <p className="text-[7.5px] text-slate-400 tracking-wider font-bold uppercase font-sans">Smarter Support. Faster Resolution.</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <img
            src={employeeAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'}
            alt={employeeName}
            className="w-10 h-10 rounded-full border border-amber-500/30 object-cover bg-slate-900"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">{employeeName}</h4>
            <span className="text-[9px] font-mono bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/25 uppercase font-bold">
              Specialist Node
            </span>
          </div>
        </div>

        {/* Diagnostic filter checklists inside Left Margin */}
        <div className="space-y-4 flex-1">
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">Assigned Queues</span>
          
          <div className="space-y-1 text-slate-400 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 font-medium">
              <span>My Load:</span>
              <span className="font-mono font-bold text-amber-300">{employeeAssignedTickets.length} incidents</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 font-medium">
              <span>Open Queue:</span>
              <span className="font-mono font-bold text-rose-300">
                {employeeAssignedTickets.filter(t=>t.status==='open' || t.status==='in_progress').length} pending
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-3 pt-4 border-t border-white/5 text-xs">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer transition-colors font-bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 11-6 0v-1m6-9v1a3 3 0 01-6 0V4" />
            </svg>
            <span>Exit Session</span>
          </button>
        </div>
      </aside>

      {/* SPECIALIST MAIN LAYOUT VIEWPORT */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto relative z-10 w-full flex flex-col xl:flex-row gap-6">
        
        {/* LEFT COLUMN: FILTERABLE QUEUES (xl:col-span-4) */}
        <div className="xl:w-4/12 flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#F1F5F9] font-sans tracking-tight">Incident Assignment Queue</h2>
            <p className="text-slate-400 text-xs mt-0.5">SLA-bound diagnostics assigned under Elena Rostova</p>
          </div>

          {/* Compact filters */}
          <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5 gap-2.5 flex flex-col text-xs">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="ID, keyword, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-white/10 bg-[#0c0e1a] text-white focus:outline-none"
              />
            </div>

            <div className="flex gap-2 font-mono text-[10px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="flex-1 p-1 rounded bg-[#0c0e1a] border border-white/15 text-slate-300 text-[10px]"
              >
                <option value="all">Any Status</option>
                <option value="open">Open</option>
                <option value="in_progress">Investigation</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="flex-1 p-1 rounded bg-[#0c0e1a] border border-white/15 text-slate-300 text-[10px]"
              >
                <option value="all">Any Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Cards Stack list */}
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
              <p className="text-xs text-slate-500 font-mono">No incident diagnostic maps verified.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                    selectedTicketId === t.id 
                      ? 'bg-amber-950/10 border-amber-500/40 shadow-lg' 
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-amber-400">{t.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[8.5px] uppercase font-mono font-extrabold ${
                      t.status === 'open' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' :
                      t.status === 'in_progress' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                      t.status === 'resolved' ? 'bg-[#10B981]/10 text-emerald-300 border border-[#10B981]/20' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1 truncate">{t.title}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">{t.description}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-[9px] font-mono text-slate-500">
                    <span className="truncate">Client: <span className="font-bold text-slate-300">{t.clientName}</span></span>
                    <span className="capitalize text-rose-300 font-bold">{t.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAILED DIAGNOSTIC SHEET + CHAT CHANNEL (xl:col-span-8) */}
        <div className="flex-1 xl:w-8/12 flex flex-col lg:flex-row gap-6 h-[500px] min-h-[500px]">
          {activeSelectedTicket ? (
            <>
              {/* SPLIT 1 — DETAILED CONSOLE FILE */}
              <div className="lg:w-6/12 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-xs font-mono font-bold text-[#A78BFA]">{activeSelectedTicket.id} Diagnostics</span>
                    <span className="text-[9px] text-slate-400 font-medium">Ingress date: {new Date(activeSelectedTicket.date).toLocaleDateString()}</span>
                  </div>

                  <div>
                    <span className="text-[8px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1">Telemetry Summary</span>
                    <h3 className="text-xs font-bold text-white leading-relaxed">{activeSelectedTicket.title}</h3>
                  </div>

                  {/* Manual State status update tool (Support spec requirement) */}
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/25 space-y-2">
                    <span className="text-[9px] font-mono text-amber-300 uppercase font-bold tracking-wider block">Set Active Telemetry State</span>
                    
                    <div className="flex gap-2">
                      <select
                        value={activeSelectedTicket.status}
                        onChange={(e) => onUpdateTicketStatus(activeSelectedTicket.id, e.target.value as any)}
                        className="flex-1 p-2 text-xs font-semibold rounded bg-[#0c0e1a] border border-white/10 text-white cursor-pointer"
                      >
                        <option value="open">Open State (New)</option>
                        <option value="in_progress">Investigation (Active)</option>
                        <option value="pending">Pending Client reply</option>
                        <option value="resolved">Resolved Solution</option>
                        <option value="closed">Closed Archive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <span className="text-[8px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Environment Description Log</span>
                    <p className="text-[11px] leading-relaxed text-slate-300 whitespace-pre-line bg-white/[0.01] p-3 rounded-lg border border-white/5 font-medium leading-relaxed">
                      {activeSelectedTicket.description}
                    </p>
                  </div>

                  {/* Attached packets downloads */}
                  {activeSelectedTicket.attachments.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-mono text-slate-500 font-bold uppercase tracking-wider block">Diagnostics Attachments ({activeSelectedTicket.attachments.length})</span>
                      <div className="grid grid-cols-1 gap-2">
                        {activeSelectedTicket.attachments.map((file, fs) => (
                          <div key={fs} className="flex justify-between items-center p-2 rounded bg-black/30 border border-white/5 text-[10px]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="text-white font-bold truncate">{file.name}</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500 shrink-0">{file.size}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SPLIT 2 — CHAT CLIENT MESSAGE THREAD */}
              <div className="lg:w-6/12 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col justify-between overflow-hidden relative">
                
                {/* Chat header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.01]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold text-xs flex items-center justify-center border border-cyan-500/40">
                      {activeSelectedTicket.clientName.split(' ')[0][0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{activeSelectedTicket.clientName}</h4>
                      <span className="text-[8.5px] font-mono text-slate-400">{activeSelectedTicket.clientEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Messages scroller */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4" id="specialist-scroller">
                  {activeSelectedTicket.timeline.map((msg, ix) => {
                    if (msg.sender === 'system') {
                      return (
                        <div key={msg.id || ix} className="flex justify-center my-1.5">
                          <span className="px-2.5 py-0.5 rounded border border-white/5 bg-white/[0.01] text-[9px] font-mono text-slate-500">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    const isEmpSender = msg.sender === 'agent';
                    return (
                      <div
                        key={msg.id || ix}
                        className={`flex ${isEmpSender ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-2xl text-[11px] space-y-1 ${
                            isEmpSender 
                              ? 'bg-amber-500 text-black font-semibold rounded-tr-none' 
                              : 'bg-white/[0.04] border border-white/10 text-slate-100 rounded-tl-none'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {isClientTyping && (
                    <div className="flex justify-start">
                      <div className="p-3 rounded-xl scale-95 origin-left bg-white/[0.04] border border-white/10 text-slate-100 rounded-tl-none flex items-center gap-1.2">
                        <span className="text-[9px] font-mono text-slate-500 mr-1.5">Client is typing</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-405 bg-amber-400 animate-bounce" style={{ animationDelay: '0s' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-405 bg-amber-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-405 bg-amber-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Canned replies snippets selector panel (Requirement specific) */}
                <div className="p-2 bg-black/40 border-t border-white/10 space-y-1.5">
                  <span className="text-[8px] font-mono font-bold text-[#A78BFA] uppercase tracking-wider block pl-1">Canned Resolution Snippets</span>
                  
                  <div className="flex gap-1.5 overflow-x-auto pr-1 pb-1 scrollbar-thin">
                    {quickTemplateSnippets.map((sn, snIdx) => (
                      <button
                        key={snIdx}
                        onClick={() => handleAppendSnippet(sn.text)}
                        className="p-1 px-2 mb-0.5 rounded border border-amber-500/15 bg-amber-500/5 hover:bg-amber-500/10 text-[9.5px] font-mono text-amber-300 font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0"
                      >
                        + {sn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typing Dispatchers block */}
                <div className="p-3 border-t border-white/10 flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter support troubleshooting reply..."
                    value={chatInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendResponse()}
                    className="flex-1 p-2 bg-white/[0.02] border border-white/10 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 rounded-lg text-xs"
                  />
                  <button
                    onClick={handleSendResponse}
                    disabled={!chatInput.trim()}
                    className="p-2.5 rounded-lg bg-amber-505 bg-amber-400 hover:bg-amber-300 text-black font-extrabold flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-black" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full flex flex-col items-center justify-center text-center p-8 border border-white/10 rounded-2xl bg-white/[0.01]">
              <FileCheck className="w-12 h-12 text-slate-600 animate-pulse mb-3" />
              <h3 className="text-sm font-semibold text-white">No active incident selected</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Select any incident ticket assigned to your profile card from the left panel column to verify data logs and resolve
              </p>
            </div>
          )}
        </div>

      </main>

    </div>
  );
}
