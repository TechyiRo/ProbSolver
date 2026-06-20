import { useState, FormEvent } from 'react';
import { Ticket, TicketPriority, TicketStatus } from '../types';
import { Sparkles, X, PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticketData: {
    title: string;
    description: string;
    priority: TicketPriority;
    category: string;
    clientName: string;
    clientEmail: string;
  }) => void;
}

export default function CreateTicketModal({ isOpen, onClose, onSubmit }: CreateTicketModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [category, setCategory] = useState('Cloud Infrastructure');
  const [clientName, setClientName] = useState('John Doe');
  const [clientEmail, setClientEmail] = useState('j.doe@sandbox-node.dev');

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    
    onSubmit({
      title,
      description,
      priority,
      category,
      clientName,
      clientEmail,
    });

    // Reset fields
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCategory('Cloud Infrastructure');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0f1129]/80 backdrop-blur-xl p-6 shadow-2xl shadow-cyan-500/10"
      >
        {/* Glowing backdrop gradient orb */}
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-cyan-400/10 blur-xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Ingest Support Packet
            </h3>
            <p className="text-xs text-slate-400">Stream incoming client telemetry issue into the queue.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ingestion form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          {/* Client Identity details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider">Client Identifier</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className="w-full p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white focus:outline-none focus:border-cyan-400/40 focus:bg-white/[0.05] transition-all"
              />
            </div>
            <div>
              <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider">Client Email</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                required
                className="w-full p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white focus:outline-none focus:border-cyan-400/40 focus:bg-white/[0.05] transition-all"
              />
            </div>
          </div>

          {/* Ticket Title */}
          <div>
            <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider">Telemetry Title / Scenario</label>
            <input
              type="text"
              placeholder="e.g. Serverless cluster allocation failed"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white focus:outline-none focus:border-cyan-400/40 focus:bg-white/[0.05] transition-all placeholder-slate-500"
            />
          </div>

          {/* Subcategory & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider">Subcategory Division</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-white/5 bg-[#0f1129] text-white focus:outline-none focus:border-cyan-400/40 focus:bg-white/[0.05] transition-all cursor-pointer"
              >
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                <option value="Access Management">Access Management</option>
                <option value="Billing & Subscriptions">Billing & Subscriptions</option>
                <option value="AI Workspace API">AI Workspace API</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider">Risk Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full p-2.5 rounded-lg border border-white/5 bg-[#0f1129] text-white focus:outline-none focus:border-cyan-400/40 focus:bg-white/[0.05] transition-all cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Escalation</option>
              </select>
            </div>
          </div>

          {/* Detail Description */}
          <div>
            <label className="block mb-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider">Diagnostic Details & Context</label>
            <textarea
              placeholder="Provide logging outputs, headers or steps to reproduce..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full p-2.5 rounded-lg border border-white/5 bg-white/[0.03] text-white focus:outline-none focus:border-cyan-400/40 focus:bg-white/[0.05] transition-all resize-none placeholder-slate-500"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-3.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Abuse / Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl text-black bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-400/10 hover:shadow-cyan-400/25 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Stream into Buffer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
