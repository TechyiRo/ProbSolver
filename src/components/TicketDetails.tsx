import { useState, useRef, useEffect } from 'react';
import { Ticket, TimelineMessage, TicketStatus } from '../types';
import {
  Send, Sparkles, BadgeAlert, CheckCircle2, History, Smile, Paperclip,
  Mic, MicOff, FileText, Image as ImageIcon, X, Volume2, Play, Pause,
  Clock, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TicketDetailsProps {
  ticket: Ticket | null;
  onSendMessage: (ticketId: string, text: string) => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus) => void;
  currentUserName?: string;
}

// Deterministic color per sender name
const SENDER_COLORS: Record<string, { text: string; bg: string; border: string }> = {};
const COLOR_PALETTE = [
  { text: 'text-cyan-400',    bg: 'from-cyan-950/30 to-[#0a2a38]/50',   border: 'border-cyan-500/25'   },
  { text: 'text-violet-400',  bg: 'from-violet-950/30 to-[#1a0a38]/50', border: 'border-violet-500/25' },
  { text: 'text-emerald-400', bg: 'from-emerald-950/30 to-[#0a2520]/50',border: 'border-emerald-500/25'},
  { text: 'text-amber-400',   bg: 'from-amber-950/30 to-[#2a1a00]/50',  border: 'border-amber-500/25'  },
  { text: 'text-pink-400',    bg: 'from-pink-950/30 to-[#300a20]/50',   border: 'border-pink-500/25'   },
  { text: 'text-sky-400',     bg: 'from-sky-950/30 to-[#0a1a30]/50',    border: 'border-sky-500/25'    },
];
let colorIdx = 0;
function getSenderColor(name: string) {
  if (!SENDER_COLORS[name]) {
    SENDER_COLORS[name] = COLOR_PALETTE[colorIdx % COLOR_PALETTE.length];
    colorIdx++;
  }
  return SENDER_COLORS[name];
}

// Emoji quick picks
const QUICK_EMOJIS = ['👍','✅','🔥','⚠️','🛠️','📋','🚀','💡','❌','⏳','🔒','📞'];

// File type icons
function FileAttachmentBubble({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const isImg = ['png','jpg','jpeg','gif','webp','svg'].includes(ext);
  const isDoc = ['pdf','doc','docx'].includes(ext);
  return (
    <div className="flex items-center gap-2 mt-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs max-w-[200px]">
      {isImg ? <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" /> : <FileText className="w-4 h-4 text-violet-400 shrink-0" />}
      <span className="truncate text-slate-300 font-mono text-[10px]">{name}</span>
      <span className={`ml-auto px-1 py-0.5 rounded text-[8px] font-bold uppercase ${isDoc ? 'bg-violet-500/20 text-violet-300' : 'bg-cyan-500/20 text-cyan-300'}`}>{ext}</span>
    </div>
  );
}

export default function TicketDetails({ ticket, onSendMessage, onUpdateStatus, currentUserName }: TicketDetailsProps) {
  const [replyText, setReplyText] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string } | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.timeline]);

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center rounded-2xl border border-white/10 bg-[#0f1129]/15 backdrop-blur-md shadow-xl relative overflow-hidden">
        {/* Animated background rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1,2,3].map(i => (
            <div key={i} className="absolute rounded-full border border-[#6C63FF]/10 animate-ping"
              style={{ width: `${i * 80}px`, height: `${i * 80}px`, animationDuration: `${2 + i}s`, animationDelay: `${i * 0.4}s` }} />
          ))}
        </div>
        <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold mb-4 relative z-10">Live Chat Console</span>
        <div className="relative p-5 rounded-full bg-white/[0.03] border border-white/8 mb-4 z-10">
          <History className="w-10 h-10 text-slate-600 animate-spin" style={{ animationDuration: '40s' }} />
        </div>
        <h3 className="text-sm font-semibold text-white relative z-10">No active conversation loaded</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1 relative z-10">Select any ticket from the queue to open its real-time chat thread.</p>
      </div>
    );
  }

  const handleSend = () => {
    if (!replyText.trim() && !attachedFile) return;
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
    textareaRef.current?.focus();
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      // Simulate sending a voice note
      onSendMessage(ticket.id, `🎤 Voice note (0:${String(recordSeconds).padStart(2,'0')})`);
      setRecordSeconds(0);
    } else {
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    }
  };

  const triggerAiDraft = () => {
    setIsAiDrafting(true);
    setTimeout(() => {
      const name = ticket.clientName.split(' ')[0];
      const drafts: Record<string, string> = {
        'Network': `Hi ${name},\n\nI've reviewed your network diagnostics. The intermittent packet loss is caused by MTU mismatch on your gateway. Please set MTU to 1480 on your router and let me know if connectivity stabilizes.`,
        'Access':  `Hi ${name},\n\nThe OAuth token session is being blocked by SameSite=Lax cookie policy in modern browsers. I'll deploy the popup-based auth flow to resolve the cross-origin token issue. Stand by for the update.`,
        'Hardware':  `Hi ${name},\n\nDiagnostics confirm the storage controller firmware is outdated. I've queued a remote firmware update scheduled for tonight's maintenance window. No action needed from your end.`,
        'Software': `Hi ${name},\n\nThe crash trace points to a memory leak in the rendering thread. I've pushed a patch to your environment. Please restart the application and confirm stability.`,
      };
      setReplyText(drafts[ticket.category] || `Hi ${name},\n\nThank you for reaching out. I've reviewed your case and will have an update for you within the hour. Please stand by.`);
      setIsAiDrafting(false);
    }, 1400);
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    open:        { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'Open' },
    in_progress: { color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', label: 'Active' },
    pending:     { color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', label: 'Pending' },
    resolved:    { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Resolved' },
    closed:      { color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', label: 'Closed' },
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-[#0a0d1f]/80 backdrop-blur-xl shadow-2xl overflow-hidden"
      style={{ boxShadow: '0 0 40px rgba(108,99,255,0.08)' }}
      id={`ticket-details-${ticket.id}`}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/8 bg-gradient-to-r from-[#6C63FF]/5 to-transparent flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <span className="text-[10px] font-mono font-bold text-[#A78BFA] tracking-widest uppercase">Live Chat</span>
          <span className="text-slate-600">·</span>
          <span className="text-xs font-mono font-bold text-cyan-400">{ticket.id}</span>
          <span className="text-slate-600">·</span>
          <span className="text-xs font-medium text-slate-300 truncate max-w-[150px]">{ticket.title}</span>
        </div>
        {/* Status Switcher */}
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
          {(['open', 'in_progress', 'resolved'] as TicketStatus[]).map(st => {
            const cfg = statusConfig[st];
            return (
              <button key={st} onClick={() => onUpdateStatus(ticket.id, st)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all border ${ticket.status === st ? cfg.color + ' border' : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'}`}>
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CLIENT META BAR ─────────────────────────────────────────── */}
      <div className="px-4 py-2.5 bg-white/[0.01] border-b border-white/5 flex items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img src={ticket.clientAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.clientName)}&background=6C63FF&color=fff&size=60`}
              alt={ticket.clientName} className="w-8 h-8 rounded-full border-2 border-[#6C63FF]/30 object-cover" referrerPolicy="no-referrer" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#0a0d1f]" />
          </div>
          <div>
            <div className="font-bold text-white text-[11px]">{ticket.clientName}</div>
            <div className="text-[9px] font-mono text-slate-500">{ticket.clientEmail}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-slate-600" />
          <span className="text-[9px] font-mono text-slate-500">{new Date(ticket.date).toLocaleDateString()}</span>
          {ticket.assigneeName && ticket.assigneeName !== 'Unassigned' && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-[9px] font-mono text-cyan-400 font-bold">{ticket.assigneeName}</span>
              {ticket.assigneeAvatar && <img src={ticket.assigneeAvatar} className="w-5 h-5 rounded-full border border-cyan-500/20 object-cover" referrerPolicy="no-referrer" alt={ticket.assigneeName} />}
            </>
          )}
        </div>
      </div>

      {/* ── CHAT TIMELINE ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-[#080918]/5 to-[#050814]/20" id="chat-thread">

        {/* Original issue block */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-[#6C63FF]/15 bg-gradient-to-br from-[#6C63FF]/5 to-transparent relative overflow-hidden mb-2">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#6C63FF]/40 to-transparent" />
          <span className="text-[9px] uppercase font-mono tracking-widest text-[#A78BFA] font-bold block mb-2">📋 Original Issue Report</span>
          <p className="text-xs text-slate-300 font-medium leading-relaxed whitespace-pre-line">{ticket.description}</p>
        </motion.div>

        {/* Messages */}
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

          const isAgent = msg.sender === 'agent';
          const senderName = isAgent ? (ticket.assigneeName || 'Support Agent') : ticket.clientName;
          const col = getSenderColor(senderName);

          // Detect voice note
          const isVoice = msg.text.startsWith('🎤 Voice note');
          // Detect file attachment
          const fileMatch = msg.text.match(/^\[FILE: (.+?)\]/);
          const fileName = fileMatch ? fileMatch[1] : null;
          const msgText = fileMatch ? msg.text.replace(/^\[FILE: .+?\]\s*/, '') : msg.text;

          return (
            <motion.div key={msg.id} initial={{ opacity: 0, x: isAgent ? 20 : -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.02 }}
              className={`flex ${isAgent ? 'justify-end' : 'justify-start'} group`}>

              {/* Avatar (left side only) */}
              {!isAgent && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#A78BFA] flex items-center justify-center text-white text-[10px] font-bold shrink-0 mr-2 mt-1 shadow-lg">
                  {senderName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className={`max-w-[78%] flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                {/* Name + time */}
                <div className={`flex items-center gap-1.5 mb-1 px-1 ${isAgent ? 'flex-row-reverse' : ''}`}>
                  <span className={`text-[10px] font-bold font-mono ${col.text}`}>{senderName}</span>
                  <span className="text-[9px] text-slate-600 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Bubble */}
                {isVoice ? (
                  // Voice note bubble
                  <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border bg-gradient-to-tr ${col.bg} ${col.border} ${isAgent ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                    <button onClick={() => setPlayingVoice(playingVoice === msg.id ? null : msg.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${playingVoice === msg.id ? 'bg-[#A78BFA] text-white' : `bg-white/10 ${col.text}`}`}>
                      {playingVoice === msg.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                    </button>
                    {/* Waveform bars */}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i}
                          className={`w-0.5 rounded-full transition-all ${playingVoice === msg.id ? col.text.replace('text-', 'bg-') : 'bg-slate-600'}`}
                          style={{ height: `${4 + Math.sin(i * 0.8) * 8 + Math.random() * 4}px` }} />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{msg.text.replace('🎤 Voice note ', '')}</span>
                    <Volume2 className="w-3 h-3 text-slate-500" />
                  </div>
                ) : (
                  <div className={`px-3.5 py-2.5 rounded-2xl text-xs border bg-gradient-to-tr ${col.bg} ${col.border} ${isAgent ? 'rounded-tr-sm' : 'rounded-tl-sm'} shadow-lg`}>
                    {fileName && <FileAttachmentBubble name={fileName} />}
                    {msgText && <p className="leading-relaxed whitespace-pre-line text-slate-200 mt-1">{msgText}</p>}
                  </div>
                )}
              </div>

              {/* Avatar (right side) */}
              {isAgent && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-[#6C63FF] flex items-center justify-center text-white text-[10px] font-bold shrink-0 ml-2 mt-1 shadow-lg">
                  {senderName.charAt(0).toUpperCase()}
                </div>
              )}
            </motion.div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* ── EMOJI PICKER ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="mx-4 mb-2 p-3 rounded-2xl border border-white/10 bg-[#0d1020]/90 backdrop-blur-xl flex flex-wrap gap-2 shrink-0">
            {QUICK_EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => appendEmoji(emoji)}
                className="text-xl hover:scale-125 transition-transform cursor-pointer leading-none">{emoji}</button>
            ))}
            <button onClick={() => setShowEmoji(false)} className="ml-auto text-slate-500 hover:text-white transition-colors cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILE ATTACHMENT PREVIEW ──────────────────────────────────── */}
      <AnimatePresence>
        {attachedFile && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-4 mb-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#6C63FF]/10 border border-[#6C63FF]/20 text-xs shrink-0">
            <FileText className="w-4 h-4 text-violet-400 shrink-0" />
            <span className="font-mono text-slate-300 truncate">{attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} className="ml-auto text-slate-500 hover:text-rose-400 transition-colors cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REPLY PANEL ─────────────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-3 border-t border-white/8 bg-gradient-to-t from-[#080918]/40 to-transparent flex flex-col gap-2.5 shrink-0">

        {/* Toolbar row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Emoji */}
            <button onClick={() => setShowEmoji(!showEmoji)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${showEmoji ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-amber-300 hover:bg-white/5'}`}
              title="Emoji">
              <Smile className="w-4 h-4" />
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
            {/* Voice */}
            <button onClick={toggleRecording}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${isRecording ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'text-slate-500 hover:text-rose-300 hover:bg-white/5'}`}
              title={isRecording ? 'Stop recording' : 'Record voice note'}>
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            {isRecording && (
              <span className="text-[10px] font-mono text-rose-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                0:{String(recordSeconds).padStart(2, '0')}
              </span>
            )}
          </div>

          {/* AI Draft */}
          <button onClick={triggerAiDraft} disabled={isAiDrafting || ticket.status === 'resolved'}
            className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border border-violet-400/20 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            <Sparkles className={`w-3 h-3 ${isAiDrafting ? 'animate-spin' : ''}`} />
            {isAiDrafting ? 'Thinking...' : 'AI Draft'}
          </button>
        </div>

        {/* Input + Send */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              placeholder={ticket.status === 'resolved' ? 'Ticket resolved. Update status to reply.' : 'Type a message... (Shift+Enter for new line)'}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={ticket.status === 'resolved'}
              rows={2}
              className="w-full px-4 py-2.5 text-xs rounded-2xl border border-white/10 bg-white/[0.04] text-white placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50 focus:bg-white/[0.06] transition-all resize-none disabled:opacity-40 disabled:cursor-not-allowed leading-relaxed"
              style={{ minHeight: '60px', maxHeight: '120px' }}
            />
            {/* Character count */}
            {replyText.length > 0 && (
              <span className="absolute bottom-2 right-3 text-[9px] font-mono text-slate-600">{replyText.length}</span>
            )}
          </div>
          <button onClick={handleSend} disabled={(!replyText.trim() && !attachedFile) || ticket.status === 'resolved'}
            className="p-3 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#A78BFA] hover:shadow-[0_0_20px_rgba(108,99,255,0.5)] text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed self-end shrink-0 active:scale-95"
            title="Send message">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
