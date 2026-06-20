import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Ticket, TicketStatus } from '../types';
import {
  Send, Sparkles, BadgeAlert, History, Smile, Paperclip,
  Mic, MicOff, FileText, Image as ImageIcon, X, Volume2, Play, Pause,
  Clock, Pin, PinOff, StickyNote, Palette, ChevronDown, ChevronUp, User, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ── Types ────────────────────────────────────────────────────────────────────
interface TicketDetailsProps {
  ticket: Ticket | null;
  onSendMessage: (ticketId: string, text: string) => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus) => void;
  currentUserName?: string;
  currentUserRole?: 'admin' | 'employee' | 'user';
  isTyping?: boolean;
  onDeleteMessage?: (ticketId: string, messageId: string) => void;
}

interface ChatNote {
  id: string;
  text: string;
  color: string;
  pinned: boolean;
  author: string;
  timestamp: string;
}

// ── 30 Tech/Funny Chat Avatars ───────────────────────────────────────────────
const CHAT_AVATARS = [
  '🤖','👾','🦾','🧑‍💻','👩‍💻','🧑‍🔬','👩‍🔬','🕵️','🦸','🧙‍♂️',
  '🐉','🦊','🐺','🦁','🐼','🐸','🦋','🦅','🦈','🐙',
  '🚀','⚡','🔥','💎','🌀','🎯','🛸','🌊','☄️','🎮',
];

// ── Quick emoji picks ────────────────────────────────────────────────────────
const QUICK_EMOJIS = [
  '👍','✅','🔥','⚠️','🛠️','📋','🚀','💡','❌','⏳','🔒','📞',
  '🎉','💪','🤔','😅','🙏','👀','⚙️','📡','🖥️','💻','🔑','🗝️',
];

// ── Note color options ───────────────────────────────────────────────────────
const NOTE_COLORS = [
  { id: 'amber',   bg: 'from-amber-500/15 to-amber-600/5',   border: 'border-amber-400/30',   text: 'text-amber-300',   label: 'Amber'   },
  { id: 'cyan',    bg: 'from-cyan-500/15 to-cyan-600/5',     border: 'border-cyan-400/30',     text: 'text-cyan-300',    label: 'Cyan'    },
  { id: 'violet',  bg: 'from-violet-500/15 to-violet-600/5', border: 'border-violet-400/30',   text: 'text-violet-300',  label: 'Violet'  },
  { id: 'emerald', bg: 'from-emerald-500/15 to-emerald-600/5',border:'border-emerald-400/30',  text: 'text-emerald-300', label: 'Green'   },
  { id: 'rose',    bg: 'from-rose-500/15 to-rose-600/5',     border: 'border-rose-400/30',     text: 'text-rose-300',    label: 'Red'     },
  { id: 'sky',     bg: 'from-sky-500/15 to-sky-600/5',       border: 'border-sky-400/30',      text: 'text-sky-300',     label: 'Sky'     },
];

// ── File color per extension ─────────────────────────────────────────────────
function getFileStyle(ext: string) {
  if (['pdf'].includes(ext))                           return { bg: 'bg-rose-500/15', border: 'border-rose-400/30', text: 'text-rose-300', icon: '📄' };
  if (['doc','docx'].includes(ext))                   return { bg: 'bg-blue-500/15',  border: 'border-blue-400/30',  text: 'text-blue-300',  icon: '📝' };
  if (['xls','xlsx','csv'].includes(ext))             return { bg: 'bg-emerald-500/15',border:'border-emerald-400/30',text:'text-emerald-300',icon: '📊' };
  if (['png','jpg','jpeg','gif','webp','svg'].includes(ext)) return { bg: 'bg-cyan-500/15', border: 'border-cyan-400/30',   text: 'text-cyan-300',   icon: '🖼️' };
  if (['zip','rar','7z'].includes(ext))               return { bg: 'bg-amber-500/15', border: 'border-amber-400/30', text: 'text-amber-300', icon: '📦' };
  if (['mp4','mov','avi'].includes(ext))              return { bg: 'bg-violet-500/15',border: 'border-violet-400/30',text: 'text-violet-300',icon: '🎬' };
  if (['mp3','wav','ogg'].includes(ext))              return { bg: 'bg-pink-500/15',  border: 'border-pink-400/30',  text: 'text-pink-300',  icon: '🎵' };
  return { bg: 'bg-slate-500/15', border: 'border-slate-400/30', text: 'text-slate-300', icon: '📎' };
}

// ── Per-sender chat bubble color ─────────────────────────────────────────────
const BUBBLE_PALETTE = [
  { name: 'text-cyan-400',    bg: 'bg-cyan-950/40 border-cyan-500/20'     },
  { name: 'text-violet-400',  bg: 'bg-violet-950/40 border-violet-500/20' },
  { name: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/20'},
  { name: 'text-amber-400',   bg: 'bg-amber-950/40 border-amber-500/20'   },
  { name: 'text-pink-400',    bg: 'bg-pink-950/40 border-pink-500/20'     },
  { name: 'text-sky-400',     bg: 'bg-sky-950/40 border-sky-500/20'       },
];
const senderColorMap: Record<string,number> = {};
let senderColorIdx = 0;
function getSenderStyle(name: string) {
  if (!(name in senderColorMap)) { senderColorMap[name] = senderColorIdx++ % BUBBLE_PALETTE.length; }
  return BUBBLE_PALETTE[senderColorMap[name]];
}

// ── Animated Waveform (voice recording & playback) ───────────────────────────
function Waveform({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex items-center gap-[2px] h-6">
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div key={i}
          className={`w-[2px] rounded-full ${active ? color : 'bg-slate-600'}`}
          animate={active ? { height: ['4px', `${8 + Math.sin(i * 0.7) * 10}px`, '4px'] } : { height: '4px' }}
          transition={{ duration: 0.5 + i * 0.04, repeat: active ? Infinity : 0, ease: 'easeInOut', delay: i * 0.03 }}
        />
      ))}
    </div>
  );
}

// ── File Attachment Bubble ────────────────────────────────────────────────────
function FileAttachmentBubble({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const style = getFileStyle(ext);
  return (
    <div className={`flex items-center gap-2 mt-1.5 px-3 py-2 rounded-xl border ${style.bg} ${style.border} max-w-[220px]`}>
      <span className="text-base leading-none">{style.icon}</span>
      <span className={`truncate font-mono text-[10px] ${style.text} flex-1`}>{name}</span>
      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${style.bg} ${style.text} border ${style.border} shrink-0`}>{ext || 'file'}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TicketDetails({ ticket, onSendMessage, onUpdateStatus, currentUserName, currentUserRole, isTyping, onDeleteMessage }: TicketDetailsProps) {
  // ── Chat state ──────────────────────────────────────────────────────────────
  const [replyText, setReplyText]             = useState('');
  const [isAiDrafting, setIsAiDrafting]       = useState(false);
  const [showEmoji, setShowEmoji]             = useState(false);
  const [isRecording, setIsRecording]         = useState(false);
  const [recordSeconds, setRecordSeconds]     = useState(0);
  const [attachedFile, setAttachedFile]       = useState<{name:string;type:string}|null>(null);
  const [playingVoice, setPlayingVoice]       = useState<string|null>(null);

  // ── Avatar picker ───────────────────────────────────────────────────────────
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [myAvatar, setMyAvatar]               = useState('🧑‍💻');

  // ── Note mode ───────────────────────────────────────────────────────────────
  const [isNoteMode, setIsNoteMode]           = useState(false);
  const [noteColor, setNoteColor]             = useState(NOTE_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [notes, setNotes]                     = useState<ChatNote[]>([]);
  const [showPinnedPanel, setShowPinnedPanel] = useState(true);

  const chatBottomRef   = useRef<HTMLDivElement>(null);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const recordTimerRef  = useRef<ReturnType<typeof setInterval>|null>(null);
  const textareaRef     = useRef<HTMLTextAreaElement>(null);

  const prevTicketIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ticket) return;
    if (prevTicketIdRef.current !== ticket.id) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'auto' });
      prevTicketIdRef.current = ticket.id;
    } else {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.timeline, notes]);

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center rounded-2xl border border-white/10 bg-[#0f1129]/15 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[80,160,240].map((size,i) => (
            <div key={i} className="absolute rounded-full border border-[#6C63FF]/10 animate-ping"
              style={{ width: size, height: size, animationDuration: `${2.5+i*0.8}s`, animationDelay: `${i*0.5}s` }} />
          ))}
        </div>
        <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold mb-4 relative z-10">Live Chat Console</span>
        <div className="relative p-5 rounded-full bg-white/[0.03] border border-white/8 mb-4 z-10">
          <History className="w-10 h-10 text-slate-600 animate-spin" style={{ animationDuration: '40s' }} />
        </div>
        <h3 className="text-sm font-semibold text-white relative z-10">No active conversation</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1 relative z-10">Select a ticket from the queue to open its chat thread.</p>
      </div>
    );
  }

  // ── Sender display names ────────────────────────────────────────────────────
  const agentDisplayName = ticket.assigneeName && ticket.assigneeName !== 'Unassigned'
    ? ticket.assigneeName
    : (currentUserName || 'Support Agent');
  const clientDisplayName = ticket.clientName;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!replyText.trim() && !attachedFile) return;
    if (isNoteMode) {
      const newNote: ChatNote = {
        id: `note-${Date.now()}`,
        text: replyText.trim(),
        color: noteColor.id,
        pinned: false,
        author: currentUserName || agentDisplayName,
        timestamp: new Date().toISOString(),
      };
      setNotes(prev => [...prev, newNote]);
      setReplyText('');
      return;
    }
    let msg = replyText;
    if (attachedFile) msg = `[FILE: ${attachedFile.name}] ${msg}`.trim();
    onSendMessage(ticket.id, msg);
    setReplyText('');
    setAttachedFile(null);
    setShowEmoji(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const appendEmoji = (emoji: string) => {
    setReplyText(prev => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      onSendMessage(ticket.id, `🎤 Voice note (0:${String(recordSeconds).padStart(2,'0')})`);
      setRecordSeconds(0);
    } else {
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    }
  };

  const togglePinNote = (id: string) => {
    setNotes(prev => {
      const pinned = prev.filter(n => n.pinned).length;
      return prev.map(n => {
        if (n.id !== id) return n;
        if (!n.pinned && pinned >= 10) return n; // max 10 pins
        return { ...n, pinned: !n.pinned };
      });
    });
  };

  const deleteNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));

  const triggerAiDraft = () => {
    setIsAiDrafting(true);
    setTimeout(() => {
      const name = ticket.clientName.split(' ')[0];
      const drafts: Record<string,string> = {
        'Network':  `Hi ${name},\n\nI've reviewed your network diagnostics. The intermittent packet loss is likely caused by an MTU mismatch on your gateway (set MTU to 1480). I'll push the configuration update and confirm once stabilized.`,
        'Access':   `Hi ${name},\n\nThe OAuth flow is being blocked by SameSite=Lax cookie policy. I'll deploy the popup-based auth handler to bypass the cross-origin restriction. Standby for the update notification.`,
        'Hardware': `Hi ${name},\n\nDiagnostics confirm the storage controller firmware is outdated. A remote firmware patch has been queued for tonight's maintenance window — no action needed from your side.`,
        'Software': `Hi ${name},\n\nThe crash trace shows a memory leak in the rendering thread. A hotfix has been deployed to your environment. Please restart the app and let me know if the issue persists.`,
        'Cloud Infrastructure': `Hi ${name},\n\nYour Cloud Run instance is hitting the max-concurrency limit during burst traffic. I recommend increasing container concurrency to 100 and setting min-instances to 1 (always-warm). Want me to apply these settings directly?`,
      };
      setReplyText(drafts[ticket.category] || `Hi ${name},\n\nThank you for reaching out. I've reviewed your case and will have a detailed update for you within the next hour. Please stand by.`);
      setIsAiDrafting(false);
    }, 1400);
  };

  const statusConfig: Record<string,{color:string;label:string}> = {
    open:        { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',   label: 'Open'     },
    in_progress: { color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', label: 'Active'  },
    pending:     { color: 'bg-slate-500/20 text-slate-300 border-slate-500/30',   label: 'Pending'  },
    resolved:    { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Resolved'},
    closed:      { color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',      label: 'Closed'   },
  };

  const pinnedNotes = notes.filter(n => n.pinned);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-[#0a0d1f]/80 backdrop-blur-xl shadow-2xl overflow-hidden"
      style={{ boxShadow: '0 0 40px rgba(108,99,255,0.08)' }}
      id={`ticket-details-${ticket.id}`}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/8 bg-gradient-to-r from-[#6C63FF]/6 to-transparent flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          <span className="text-[10px] font-mono font-bold text-[#A78BFA] tracking-widest uppercase">Live Chat</span>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-[11px] font-mono font-bold text-cyan-400">{ticket.id}</span>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-xs font-medium text-slate-300 truncate max-w-[130px]">{ticket.title}</span>
        </div>
        <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-xl border border-white/5">
          {(['open','in_progress','resolved'] as TicketStatus[]).map(st => {
            const cfg = statusConfig[st];
            return (
              <button key={st} onClick={() => onUpdateStatus(ticket.id, st)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all border ${ticket.status === st ? cfg.color : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'}`}>
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CLIENT META BAR ────────────────────────────────────────────────── */}
      <div className="px-4 py-2 bg-white/[0.01] border-b border-white/5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img src={ticket.clientAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientDisplayName)}&background=6C63FF&color=fff&size=60`}
              alt={clientDisplayName} className="w-7 h-7 rounded-full border-2 border-[#6C63FF]/30 object-cover" referrerPolicy="no-referrer" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0a0d1f]" />
          </div>
          <div>
            <div className="font-bold text-white text-[11px]">{clientDisplayName}</div>
            <div className="text-[9px] font-mono text-slate-500">{ticket.clientEmail}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-slate-600" />
          <span className="text-[9px] font-mono text-slate-500">{new Date(ticket.date).toLocaleDateString()}</span>
          {ticket.assigneeName && ticket.assigneeName !== 'Unassigned' && (
            <>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-[9px] font-mono text-cyan-400 font-bold">{ticket.assigneeName}</span>
              {ticket.assigneeAvatar && <img src={ticket.assigneeAvatar} className="w-5 h-5 rounded-full border border-cyan-500/20 object-cover" referrerPolicy="no-referrer" alt={ticket.assigneeName} />}
            </>
          )}
        </div>
      </div>

      {/* ── PINNED NOTES PANEL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {pinnedNotes.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/5 bg-black/20 overflow-hidden shrink-0">
            <button onClick={() => setShowPinnedPanel(!showPinnedPanel)}
              className="w-full flex items-center justify-between px-4 py-1.5 text-[9px] font-mono text-[#A78BFA] font-bold uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors">
              <span className="flex items-center gap-1.5"><Pin className="w-2.5 h-2.5" /> {pinnedNotes.length} Pinned Note{pinnedNotes.length > 1 ? 's' : ''}</span>
              {showPinnedPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <AnimatePresence>
              {showPinnedPanel && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-3 pb-2 flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
                  {pinnedNotes.map(note => {
                    const col = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];
                    return (
                      <motion.div key={note.id} layout
                        className={`flex items-start gap-2 p-2.5 rounded-xl border bg-gradient-to-r ${col.bg} ${col.border} relative`}>
                        <Pin className={`w-3 h-3 shrink-0 mt-0.5 ${col.text}`} />
                        <p className="text-[11px] text-slate-200 leading-relaxed flex-1">{note.text}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[8px] font-mono text-slate-500">{note.author}</span>
                          <button onClick={() => togglePinNote(note.id)}
                            className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer" title="Unpin">
                            <PinOff className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CHAT TIMELINE ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scroll-smooth p-4 space-y-3 bg-gradient-to-b from-[#080918]/5 to-[#050814]/20" id="chat-thread">

        {/* Original issue */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-[#6C63FF]/15 bg-gradient-to-br from-[#6C63FF]/5 to-transparent relative overflow-hidden mb-2">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#6C63FF]/50 to-transparent" />
          <span className="text-[9px] uppercase font-mono tracking-widest text-[#A78BFA] font-bold block mb-2">📋 Original Issue Report</span>
          <p className="text-xs text-slate-300 font-medium leading-relaxed whitespace-pre-line">{ticket.description}</p>
        </motion.div>

        {/* Timeline messages */}
        {ticket.timeline.map((msg, idx) => {
          if (msg.sender === 'system') {
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center my-2">
                <span className="px-3 py-1 rounded-full border border-white/5 bg-white/[0.03] text-[9px] font-mono text-slate-400 flex items-center gap-1.5">
                  <BadgeAlert className="w-3 h-3 text-violet-400" />{msg.text}
                </span>
              </motion.div>
            );
          }

          const isAgent   = msg.sender === 'agent';
          const isCurrentUser = currentUserRole !== 'user' ? isAgent : !isAgent;
          const senderName = isAgent ? agentDisplayName : clientDisplayName;
          const style = getSenderStyle(senderName);

          const isVoice   = msg.text.startsWith('🎤 Voice note');
          const fileMatch = msg.text.match(/^\[FILE: (.+?)\]/);
          const fileName  = fileMatch ? fileMatch[1] : null;
          const msgText   = fileMatch ? msg.text.replace(/^\[FILE: .+?\]\s*/, '') : msg.text;

          // "You" suffix for current user
          const displayName = isCurrentUser
            ? `${senderName} (You)`
            : senderName;

          const msgAgeMs = Date.now() - new Date(msg.timestamp).getTime();
          const isDeletable = isCurrentUser && msg.id && (msgAgeMs < 5 * 60 * 1000);

          return (
            <motion.div key={msg.id}
              initial={{ opacity: 0, x: isCurrentUser ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.3) }}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} items-end gap-2`}>

              {/* Left avatar */}
              {!isCurrentUser && (
                <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-base leading-none bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 shadow-md">
                  {myAvatar && !isAgent ? myAvatar : senderName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Delete message button (only active within 5 mins of sending) */}
              {isDeletable && onDeleteMessage && (
                <button
                  onClick={() => onDeleteMessage(ticket.id, msg.id)}
                  className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all cursor-pointer self-end mb-1 text-[9px] font-mono flex items-center gap-0.5 opacity-70 hover:opacity-100"
                  title="Delete permanently (both sides)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}

              <div className={`max-w-[76%] flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                {/* Name + time row */}
                <div className={`flex items-center gap-1.5 mb-1 px-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                  <span className={`text-[10px] font-bold font-mono ${style.name}`}>{displayName}</span>
                  <span className="text-[9px] text-slate-600 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                  </span>
                </div>

                {/* Bubble */}
                {isVoice ? (
                  <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border ${style.bg} ${isCurrentUser ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                    <button onClick={() => setPlayingVoice(playingVoice === msg.id ? null : msg.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${playingVoice === msg.id ? 'bg-[#A78BFA] text-white' : 'bg-white/10 text-slate-300'}`}>
                      {playingVoice === msg.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                    </button>
                    <Waveform active={playingVoice === msg.id} color={style.name.replace('text-','bg-')} />
                    <span className="text-[10px] font-mono text-slate-400">{msg.text.replace('🎤 Voice note ','')}</span>
                    <Volume2 className="w-3 h-3 text-slate-500 shrink-0" />
                  </div>
                ) : (
                  <div className={`px-3.5 py-2.5 rounded-2xl text-xs border ${style.bg} ${isCurrentUser ? 'rounded-br-sm' : 'rounded-bl-sm'} shadow-lg`}>
                    {fileName && <FileAttachmentBubble name={fileName} />}
                    {msgText && <p className="leading-relaxed whitespace-pre-line text-slate-100 mt-1">{msgText}</p>}
                  </div>
                )}
              </div>

              {/* Right avatar (current user) */}
              {isCurrentUser && (
                <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-base leading-none bg-gradient-to-br from-[#6C63FF] to-[#A78BFA] shadow-lg shadow-violet-500/20 border border-[#A78BFA]/30 text-white">
                  {myAvatar}
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Inline notes (unpinned) */}
        {notes.filter(n => !n.pinned).map(note => {
          const col = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];
          return (
            <motion.div key={note.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex justify-end items-end gap-2`}>
              <div className="max-w-[76%] flex flex-col items-end">
                <div className={`flex items-center gap-1.5 mb-1 px-1 flex-row-reverse`}>
                  <span className={`text-[10px] font-bold font-mono ${col.text}`}>{note.author} (Note)</span>
                  <span className="text-[9px] text-slate-600 font-mono">
                    {new Date(note.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                  </span>
                </div>
                <div className={`px-3.5 py-2.5 rounded-2xl rounded-br-sm border bg-gradient-to-r ${col.bg} ${col.border} shadow-lg relative`}>
                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    <button onClick={() => togglePinNote(note.id)}
                      className={`${col.text} opacity-60 hover:opacity-100 transition-opacity cursor-pointer`} title="Pin note">
                      <Pin className="w-2.5 h-2.5" />
                    </button>
                    <button onClick={() => deleteNote(note.id)}
                      className="text-rose-400 opacity-60 hover:opacity-100 transition-opacity cursor-pointer" title="Delete">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className={`flex items-center gap-1 mb-1`}>
                    <StickyNote className={`w-2.5 h-2.5 ${col.text}`} />
                    <span className={`text-[8px] font-mono font-bold ${col.text} uppercase tracking-wider`}>Note</span>
                  </div>
                  <p className="text-[11px] text-slate-200 leading-relaxed whitespace-pre-line pr-8">{note.text}</p>
                </div>
              </div>
              <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-base leading-none bg-gradient-to-br from-[#6C63FF] to-[#A78BFA] shadow-lg border border-[#A78BFA]/30 text-white">
                {myAvatar}
              </div>
            </motion.div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="p-3 rounded-xl scale-95 origin-left bg-white/[0.04] border border-white/10 text-slate-100 rounded-tl-none flex items-center gap-1.2">
              <span className="text-[9px] font-mono text-slate-500 mr-1.5">
                {currentUserRole === 'user' ? 'Elena is typing' : 'Client is typing'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* ── AVATAR PICKER ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAvatarPicker && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="mx-4 mb-2 p-3 rounded-2xl border border-white/10 bg-[#0d1020]/95 backdrop-blur-xl shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-mono text-[#A78BFA] font-bold uppercase tracking-wider">Choose Your Chat Avatar</span>
              <button onClick={() => setShowAvatarPicker(false)} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
            <div className="grid grid-cols-10 gap-1">
              {CHAT_AVATARS.map(av => (
                <button key={av} onClick={() => { setMyAvatar(av); setShowAvatarPicker(false); }}
                  className={`text-xl p-1 rounded-lg transition-all cursor-pointer hover:scale-125 hover:bg-white/10 ${myAvatar === av ? 'bg-[#6C63FF]/30 ring-1 ring-[#A78BFA]/50 scale-110' : ''}`}>
                  {av}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EMOJI PICKER ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="mx-4 mb-2 p-3 rounded-2xl border border-white/10 bg-[#0d1020]/95 backdrop-blur-xl shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider">Quick Reactions</span>
              <button onClick={() => setShowEmoji(false)} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EMOJIS.map(em => (
                <button key={em} onClick={() => appendEmoji(em)}
                  className="text-xl hover:scale-125 transition-transform cursor-pointer leading-none p-0.5 rounded hover:bg-white/10">{em}</button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NOTE COLOR PICKER ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showColorPicker && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-4 mb-2 p-2.5 rounded-xl border border-white/10 bg-[#0d1020]/95 backdrop-blur-xl flex items-center gap-2 flex-wrap shrink-0">
            <span className="text-[9px] font-mono text-slate-400 font-bold mr-1">Note Color:</span>
            {NOTE_COLORS.map(col => (
              <button key={col.id} onClick={() => { setNoteColor(col); setShowColorPicker(false); }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-bold font-mono cursor-pointer transition-all bg-gradient-to-r ${col.bg} ${col.border} ${col.text} ${noteColor.id === col.id ? 'ring-1 ring-white/30 scale-105' : 'opacity-70 hover:opacity-100'}`}>
                <span className="w-2 h-2 rounded-full border" style={{ background: col.id === 'amber' ? '#f59e0b' : col.id === 'cyan' ? '#22d3ee' : col.id === 'violet' ? '#a78bfa' : col.id === 'emerald' ? '#34d399' : col.id === 'rose' ? '#fb7185' : '#38bdf8' }} />
                {col.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILE ATTACHMENT PREVIEW ──────────────────────────────────────── */}
      <AnimatePresence>
        {attachedFile && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-4 mb-1 shrink-0">
            <FileAttachmentBubble name={attachedFile.name} />
            <button onClick={() => setAttachedFile(null)} className="text-rose-400 text-[9px] font-mono hover:underline cursor-pointer mt-0.5 pl-1">Remove</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REPLY PANEL ─────────────────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-2.5 border-t border-white/8 bg-gradient-to-t from-[#080918]/40 to-transparent flex flex-col gap-2 shrink-0">

        {/* Note mode indicator */}
        <AnimatePresence>
          {isNoteMode && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-gradient-to-r ${noteColor.bg} ${noteColor.border} text-[10px]`}>
              <StickyNote className={`w-3 h-3 ${noteColor.text}`} />
              <span className={`font-mono font-bold ${noteColor.text}`}>Note Mode</span>
              <span className="text-slate-500">— message will be saved as a pinnable note</span>
              <button onClick={() => { setShowColorPicker(!showColorPicker); }}
                className={`ml-auto ${noteColor.text} opacity-70 hover:opacity-100 cursor-pointer`} title="Change color">
                <Palette className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* My Avatar */}
            <button onClick={() => { setShowAvatarPicker(!showAvatarPicker); setShowEmoji(false); }}
              className={`w-7 h-7 rounded-full text-lg leading-none flex items-center justify-center transition-all cursor-pointer hover:scale-110 hover:ring-2 hover:ring-[#A78BFA]/40 ${showAvatarPicker ? 'ring-2 ring-[#A78BFA]/60 scale-110' : ''}`}
              title="Change avatar">
              {myAvatar}
            </button>
            {/* Emoji */}
            <button onClick={() => { setShowEmoji(!showEmoji); setShowAvatarPicker(false); }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${showEmoji ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-amber-300 hover:bg-white/5'}`} title="Emoji">
              <Smile className="w-4 h-4" />
            </button>
            {/* Note mode toggle */}
            <button onClick={() => { setIsNoteMode(!isNoteMode); setShowEmoji(false); setShowAvatarPicker(false); }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${isNoteMode ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-amber-300 hover:bg-white/5'}`} title="Note mode">
              <StickyNote className="w-4 h-4" />
            </button>
            {/* File attach */}
            <button onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-slate-500 hover:text-violet-300 hover:bg-white/5 transition-all cursor-pointer" title="Attach file">
              <Paperclip className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={e => {
              const f = e.target.files?.[0];
              if (f) setAttachedFile({ name: f.name, type: f.type });
              e.target.value = '';
            }} />
            {/* Voice recording */}
            <button onClick={toggleRecording}
              className={`p-1.5 rounded-lg transition-all cursor-pointer relative ${isRecording ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:text-rose-300 hover:bg-white/5'}`}
              title={isRecording ? 'Stop' : 'Record voice'}>
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                </>
              ) : <Mic className="w-4 h-4" />}
            </button>
            {isRecording && (
              <div className="flex items-center gap-1.5 ml-1">
                <Waveform active color="bg-rose-400" />
                <span className="text-[10px] font-mono text-rose-400 font-bold">0:{String(recordSeconds).padStart(2,'0')}</span>
              </div>
            )}
          </div>
          {/* AI Draft */}
          <button onClick={triggerAiDraft} disabled={isAiDrafting || ticket.status === 'resolved' || isNoteMode}
            className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border border-violet-400/20 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
            <Sparkles className={`w-3 h-3 ${isAiDrafting ? 'animate-spin' : ''}`} />
            {isAiDrafting ? 'Thinking...' : 'AI Draft'}
          </button>
        </div>

        {/* Input + Send */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea ref={textareaRef}
              placeholder={
                ticket.status === 'resolved' ? 'Ticket resolved. Update status to reply.' :
                isNoteMode ? `Write a ${noteColor.label} note... (will be pinnable)` :
                'Type a message... (Shift+Enter for new line)'
              }
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={ticket.status === 'resolved'}
              rows={2}
              className={`w-full px-4 py-2.5 text-xs rounded-2xl border text-white placeholder-slate-600 focus:outline-none transition-all resize-none disabled:opacity-40 disabled:cursor-not-allowed leading-relaxed ${
                isNoteMode
                  ? `bg-gradient-to-r ${noteColor.bg} ${noteColor.border} focus:ring-1 focus:ring-white/10`
                  : 'border-white/10 bg-white/[0.04] focus:border-[#6C63FF]/50 focus:bg-white/[0.06]'
              }`}
              style={{ minHeight: '56px', maxHeight: '100px' }}
            />
            {replyText.length > 0 && (
              <span className="absolute bottom-2 right-3 text-[9px] font-mono text-slate-600">{replyText.length}</span>
            )}
          </div>
          <button onClick={handleSend}
            disabled={(!replyText.trim() && !attachedFile) || ticket.status === 'resolved'}
            className={`p-3 rounded-2xl text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed self-end shrink-0 active:scale-95 ${
              isNoteMode
                ? `bg-gradient-to-br ${noteColor.bg} border ${noteColor.border} hover:shadow-lg`
                : 'bg-gradient-to-br from-[#6C63FF] to-[#A78BFA] hover:shadow-[0_0_20px_rgba(108,99,255,0.5)] shadow-lg'
            }`}>
            {isNoteMode ? <StickyNote className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
