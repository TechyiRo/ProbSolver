import { useState, useRef, useEffect } from 'react';
import { Ticket, TimelineMessage, TicketStatus } from '../types';
import { Send, Sparkles, User, BadgeAlert, ArrowUpRight, CheckCircle2, History } from 'lucide-react';
import { CATEGORY_COLORS } from '../mockData';
import { motion } from 'motion/react';

interface TicketDetailsProps {
  ticket: Ticket | null;
  onSendMessage: (ticketId: string, text: string) => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus) => void;
}

export default function TicketDetails({ ticket, onSendMessage, onUpdateStatus }: TicketDetailsProps) {
  const [replyText, setReplyText] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat details to bottom when ticket changes or messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.timeline]);

  if (!ticket) {
    return (
      <div 
        className="flex flex-col items-center justify-center h-full p-8 text-center rounded-2xl border border-white/10 bg-[#0f1129]/15 backdrop-blur-md shadow-xl"
        id="ticket-details-empty"
      >
        <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold mb-3">Triage Details Inspector</span>
        <div className="relative p-6 rounded-full bg-white/[0.02] border border-white/5 mb-4 shadow-inner">
          <History className="w-10 h-10 text-slate-600 animate-spin" style={{ animationDuration: '40s' }} />
        </div>
        <h3 className="text-sm font-semibold text-white">No active context loaded</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1">Select any packet from the active buffer queue to inspect metrics, check diagnostic history, and submit handoffs.</p>
      </div>
    );
  }

  const handleSend = () => {
    if (!replyText.trim()) return;
    onSendMessage(ticket.id, replyText);
    setReplyText('');
  };

  // Custom AI draft generation template contextually crafted for each ticket scenario!
  const triggerAiDraft = () => {
    setIsAiDrafting(true);
    
    setTimeout(() => {
      let draftText = '';
      const clientFirstName = ticket.clientName.split(' ')[0];

      // Formulate custom high-fidelity smart drafts depending on the technical categories
      if (ticket.category === 'Cloud Infrastructure') {
        draftText = `Hi ${clientFirstName},\n\nI reviewed your Cloud Run concurrency logs during the bulk Stripe webhook bursts. You are hitting the max-concurrency instances threshold. I recommend adjusting your service constraints:\n\n1. Increase container concurrency limit to 100 instead of the current 80.\n2. Set minimum scale instances count to CPU-allocated = 1 (always on) to bypass cold-start handshakes.\n3. Increase container CPU limits to 2vCPU.\n\nLet me know if you would like me to deploy these parameters directly to your cluster config.`;
      } else if (ticket.category === 'Access Management') {
        draftText = `Hi ${clientFirstName},\n\nThis looks like a cookie boundary issue caused by iframe isolation. Modern browsers reject third-party cookies by default (SameSite=Lax). When Microsoft Graph redirects back, the state token session is blocked since it runs inside the sandboxed container. \n\nWe need to deploy our modern OAuth Proxy handler which initiates the login flow in a clean pop-up callback, then passes the verified token context back to the main app layout. I have generated a candidate layout for you to review.`;
      } else if (ticket.category === 'AI Workspace API') {
        draftText = `Hi ${clientFirstName},\n\nI analyzed your token payload bounds. Truncation inside the @google/genai SDK often triggers when raw buffer response sizes exceed the default chunk configurations. To support token counts >1.5M properly, we need to implement generative-stream iterations instead of simple single-turn await calls. This splits response strings into safe asynchronous buffers. Let me know and I will provide the updated block!`;
      } else {
        draftText = `Hi ${clientFirstName},\n\nI have finished investigating your recent report. I have located the billing discrepancies on your idle computing servers. The state syncer had a minor race condition preventing proper idle flags to flow on Tuesday. I have credited your account balance with the excess amount ($142.40 SGT) and applied a hotfix to the state synchronizer thread context.`;
      }

      setReplyText(draftText);
      setIsAiDrafting(false);
    }, 1200);
  };

  return (
    <div 
      className="flex flex-col h-full rounded-2xl border border-white/10 bg-[#0f1129]/20 backdrop-blur-md shadow-xl overflow-hidden"
      id={`ticket-details-${ticket.id}`}
    >
      {/* Detail Header status */}
      <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold text-cyan-400">{ticket.id}</span>
          <span className="text-xs text-slate-300">•</span>
          <span className="text-xs font-medium text-slate-200 truncate max-w-[200px]">{ticket.title}</span>
        </div>

        {/* Change status controls */}
        <div className="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-lg border border-white/5 text-[10px]">
          {(['open', 'in_progress', 'resolved'] as TicketStatus[]).map((st) => (
            <button
              key={st}
              onClick={() => onUpdateStatus(ticket.id, st)}
              className={`px-2 py-1 rounded transition-all capitalize font-mono font-bold cursor-pointer ${
                ticket.status === st
                  ? st === 'resolved'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : st === 'in_progress'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {st === 'in_progress' ? 'Active' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Meta side bar with client cards */}
      <div className="p-4 bg-white/[0.01] border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <img 
            src={ticket.clientAvatar} 
            alt={ticket.clientName} 
            className="w-8 h-8 rounded-full border border-white/10 object-cover"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="font-semibold text-white">{ticket.clientName}</div>
            <div className="text-[10px] font-mono text-slate-400">{ticket.clientEmail}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:text-right">
          <div className="sm:hidden text-slate-500 font-mono">•</div>
          <div>
            <div className="font-semibold text-slate-300 text-[11px]">Owner Assignee</div>
            <div className="text-[10px] font-mono text-cyan-400 font-medium">
              {ticket.assigneeName !== 'Unassigned' ? ticket.assigneeName : 'Aether System (Auto)'}
            </div>
          </div>
          {ticket.assigneeAvatar && (
            <img 
              src={ticket.assigneeAvatar} 
              alt={ticket.assigneeName} 
              className="w-6 h-6 rounded-full border border-cyan-500/20 object-cover"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>

      {/* Interactive Messaging Timeline of chat logs */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[340px] h-[340px] bg-gradient-to-b from-transparent to-[#080918]/15" id="chat-thread">
        {/* Original Issue Description Block */}
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] shadow-inner mb-6">
          <span className="text-[9px] uppercase font-mono tracking-widest text-[#a855f7] font-bold">Metadata Packet Payload</span>
          <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed whitespace-pre-line">{ticket.description}</p>
        </div>

        {/* Timeline updates */}
        {ticket.timeline.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-3">
                <span className="px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] text-[9px] font-mono text-slate-400 shadow-sm flex items-center gap-1.5">
                  <BadgeAlert className="w-3 h-3 text-purple-400" />
                  {msg.text}
                </span>
              </div>
            );
          }

          const isAgent = msg.sender === 'agent';
          return (
            <div 
              key={msg.id} 
              className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] p-3 rounded-2xl text-xs shadow-md border ${
                  isAgent 
                    ? 'bg-gradient-to-tr from-cyan-950/20 to-[#0e485a]/40 text-slate-200 border-cyan-400/20 rounded-tr-none' 
                    : 'bg-white/[0.03] text-slate-200 border-white/10 rounded-tl-none'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-slate-400">
                  <span className={isAgent ? 'text-cyan-400 font-semibold' : 'text-purple-400 font-semibold'}>
                    {isAgent ? 'Aether Desk Operator' : ticket.clientName}
                  </span>
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="leading-relaxed font-normal whitespace-pre-line text-[11.5px]">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Replying panel controls */}
      <div className="p-4 border-t border-white/10 bg-white/[0.02] flex flex-col gap-3">
        {/* Quick Suggestion helper & AI Auto-draft */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500 font-medium">Drafting Assistant ready</span>
          <button
            onClick={triggerAiDraft}
            disabled={isAiDrafting || ticket.status === 'resolved'}
            className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border border-purple-400/20 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3 h-3" />
            {isAiDrafting ? 'Contextualizing...' : 'Draft Suggestion via AI'}
          </button>
        </div>

        {/* Form controls */}
        <div className="flex gap-2">
          <textarea
            placeholder={ticket.status === 'resolved' ? 'This packet session is resolved. Update status above to reply.' : 'Formulate support response template...'}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            disabled={ticket.status === 'resolved'}
            className="flex-1 p-2.5 h-14 min-h-[56px] text-xs rounded-xl border border-white/5 bg-white/[0.03] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/40 focus:bg-white/[0.05] transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim() || ticket.status === 'resolved'}
            className="p-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-end shadow-lg shadow-cyan-400/10"
            title="Dispatch Reply"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
