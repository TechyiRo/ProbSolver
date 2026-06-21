import { useState } from 'react';
import { Ticket, TicketPriority, TicketStatus } from '../types';
import { Search, Filter, AlertCircle, Sparkles, CheckCircle, ChevronRight } from 'lucide-react';
import { CATEGORY_COLORS } from '../mockData';
import { motion, AnimatePresence } from 'motion/react';

interface TicketQueueProps {
  tickets: Ticket[];
  selectedTicketId: string | null;
  onSelectTicket: (ticket: Ticket) => void;
  onQuickSolve: (ticketId: string) => void;
  onCreateTicketClick: () => void;
}

export default function TicketQueue({
  tickets,
  selectedTicketId,
  onSelectTicket,
  onQuickSolve,
  onCreateTicketClick,
}: TicketQueueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');

  // Filter logic
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Priority layout styling dictionary
  const PRIORITY_STYLES: {
    [key in TicketPriority]: { text: string; bg: string; border: string; glow: string; dot: string };
  } = {
    critical: {
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      glow: 'shadow-[0_0_12px_rgba(244,63,94,0.35)]',
      dot: 'bg-rose-500 animate-pulse',
    },
    high: {
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      glow: 'shadow-[0_0_10px_rgba(168,85,247,0.25)]',
      dot: 'bg-purple-500',
    },
    medium: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      glow: 'shadow-[0_0_8px_rgba(245,158,11,0.15)]',
      dot: 'bg-amber-500',
    },
    low: {
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      glow: 'shadow-none',
      dot: 'bg-cyan-500',
    },
  };

  const STATUS_LABELS: { [key in TicketStatus]: string } = {
    open: 'Open Response',
    in_progress: 'Investigating',
    pending: 'Pending Response',
    resolved: 'Resolved',
    closed: 'Archived Trace',
  };

  return (
    <div 
      className="flex flex-col h-full rounded-2xl border border-white/10 bg-[#0f1129]/20 backdrop-blur-md shadow-xl"
      id="ticket-queue-panel"
    >
      {/* Header and Action blocks */}
      <div className="p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            Ticket Triage Buffer
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400">
              {filteredTickets.length} targets
            </span>
          </h2>
          <p className="text-xs text-slate-400">Filter and audit active client issues</p>
        </div>

        <button
          onClick={onCreateTicketClick}
          className="relative inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-black bg-gradient-to-r from-cyan-400 via-teal-400 to-purple-400 hover:opacity-95 shadow-lg shadow-cyan-400/20 hover:shadow-cyan-400/30 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Ingest New Ticket
        </button>
      </div>

      {/* Control filters & search */}
      <div className="p-4 bg-white/[0.01] border-b border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="relative lg:col-span-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search index hashes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-white/5 bg-white/[0.03] text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/40 focus:bg-white/[0.05] transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="relative lg:col-span-4 flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">Status:</span>
          <div className="flex-1 flex gap-1 bg-white/[0.02] p-0.5 rounded-lg border border-white/5">
            {(['all', 'open', 'in_progress', 'solved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`flex-1 text-[10px] py-1 rounded-md font-medium capitalize tracking-wide transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {st === 'all' ? 'All' : st === 'in_progress' ? 'Prog' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div className="relative lg:col-span-4 flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">Priority:</span>
          <div className="flex-1 flex gap-1 bg-white/[0.02] p-0.5 rounded-lg border border-white/5">
            {(['all', 'critical', 'high', 'low'] as const).map((pr) => (
              <button
                key={pr}
                onClick={() => setPriorityFilter(pr)}
                className={`flex-1 text-[10px] py-1 rounded-md font-medium capitalize tracking-wide transition-all cursor-pointer ${
                  priorityFilter === pr
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {pr === 'all' ? 'All' : pr === 'critical' ? 'Crit' : pr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Queue List */}
      <div className="flex-1 overflow-y-auto max-h-[500px] h-[500px]" id="tickets-scroller">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <AlertCircle className="w-8 h-8 text-slate-600 mb-2.5" />
            <p className="text-xs font-mono text-slate-500">Zero active packets match these queries.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <AnimatePresence initial={false}>
              {filteredTickets.map((ticket) => {
                const isSelected = selectedTicketId === ticket.id;
                const prStyle = PRIORITY_STYLES[ticket.priority];
                const cleanDate = new Date(ticket.date).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative p-4 transition-all duration-300 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-2 ${
                      isSelected 
                        ? 'bg-white/[0.06] border-l-cyan-400 shadow-lg' 
                        : 'border-l-transparent hover:bg-white/[0.02] hover:border-l-white/10'
                    }`}
                    onClick={() => onSelectTicket(ticket)}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      {/* Top metadata */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-400">
                          {ticket.id}
                        </span>
                        
                        {/* Category badge */}
                        <span 
                          className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-white/5 bg-white/[0.02] text-slate-300"
                          style={{ borderLeft: `2.5px solid ${CATEGORY_COLORS[ticket.category] || '#64748b'}` }}
                        >
                          {ticket.category}
                        </span>

                        {/* Priority Capsule with blinking/glow properties */}
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${prStyle.bg} ${prStyle.text} ${prStyle.border} ${prStyle.glow}`}>
                          <span className={`w-1 h-1 rounded-full ${prStyle.dot}`} />
                          {ticket.priority}
                        </span>

                        {/* Status Label */}
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          ticket.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          ticket.status === 'in_progress' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {STATUS_LABELS[ticket.status]}
                        </span>
                      </div>

                      {/* Ticket title and description snippet */}
                      <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {ticket.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-medium">
                        {ticket.description}
                      </p>

                      {/* Submitter & Assignee metadata */}
                      <div className="flex items-center gap-4 mt-2.5 text-[10px] font-mono text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <img 
                            src={ticket.clientAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.clientName)}&background=1e1b4b&color=a78bfa&bold=true&size=48`}
                            alt={ticket.clientName} 
                            className="w-3.5 h-3.5 rounded-full object-cover bg-slate-800"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.clientName)}&background=1e1b4b&color=a78bfa&bold=true&size=48`;
                            }}
                          />
                          <span className="text-slate-300 font-medium truncate max-w-[100px]">{ticket.clientName}</span>
                        </div>
                        
                        <span>•</span>
                        
                        <span>Logs checked at {cleanDate}</span>
                      </div>
                    </div>

                    {/* Quick action blocks */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                      {ticket.status !== 'resolved' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickSolve(ticket.id);
                          }}
                          className="p-1 px-2.5 rounded-lg border border-emerald-500/10 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                          title="Quick Solve Thread"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Resolve
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-all transform group-hover:translate-x-0.5" />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
