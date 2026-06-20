import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckSquare, MessageSquare, AlertCircle, Info, ChevronRight, Check } from 'lucide-react';
import { SystemNotification } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onSelectTicket: (ticketId: string) => void;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkRead,
  onClearAll,
  onSelectTicket
}: NotificationDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans select-none text-xs">
      {/* Absolute Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-screen max-w-sm"
        >
          <div className="h-full flex flex-col bg-[#0b0c16]/95 border-l border-white/10 shadow-2xl relative">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#A78BFA]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Alerts</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Actions Header tools bar */}
            {notifications.length > 0 && (
              <div className="p-3 bg-white/[0.01] border-b border-white/5 flex justify-between text-[11px] font-mono text-slate-400">
                <button
                  onClick={onMarkAllRead}
                  className="hover:text-emerald-400 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Read All</span>
                </button>
                <button
                  onClick={onClearAll}
                  className="hover:text-rose-400 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Purge Logs</span>
                </button>
              </div>
            )}

            {/* Alerts List stream container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 font-mono">
                  <Bell className="w-10 h-10 mb-2 relative opacity-20 animate-pulse" />
                  <p className="text-[11px] leading-relaxed">System queue cleared. Standard operation secured.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {notifications.map((not) => {
                    return (
                      <div
                        key={not.id}
                        onClick={() => {
                          if (not.ticketId) {
                            onSelectTicket(not.ticketId);
                            onMarkRead(not.id);
                            onClose();
                          }
                        }}
                        className={`p-3.5 rounded-xl border relative flex gap-3 cursor-pointer transition-all ${
                          not.read 
                            ? 'bg-white/[0.01] hover:bg-white/[0.02] border-white/5' 
                            : 'bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-500/20 shadow-md shadow-indigo-500/5'
                        }`}
                      >
                        {/* Bullet category icons */}
                        <div className="shrink-0 mt-0.5">
                          {not.type === 'alert' ? (
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                          ) : not.type === 'message' ? (
                            <MessageSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Info className="w-4 h-4 text-[#A78BFA]" />
                          )}
                        </div>

                        {/* Text fields description */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className={`text-[11px] leading-relaxed text-slate-200 ${not.read ? '' : 'font-semibold'}`}>
                            {not.text}
                          </p>
                          <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                            <span>{new Date(not.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {not.ticketId && (
                              <span className="text-[#A78BFA] hover:underline font-bold flex items-center gap-0.5">
                                View Ticket
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Micro self mark read button */}
                        {!not.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkRead(not.id);
                            }}
                            className="p-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-white transition-colors cursor-pointer self-start"
                            title="Mark notification as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer diagnostic status */}
            <div className="p-4 bg-white/[0.01] border-t border-white/5 text-[9px] font-mono text-slate-500 flex justify-between items-center">
              <span>Security Token Active</span>
              <span>100% SLA secured</span>
            </div>

          </div>
        </motion.div>
      </div>

    </div>
  );
}
