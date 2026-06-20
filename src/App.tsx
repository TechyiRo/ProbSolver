import { useState, useEffect, useRef } from 'react';
import InteractiveBackground from './components/InteractiveBackground';
import LoginPortal from './components/LoginPortal';
import UserPortalView from './components/UserPortalView';
import AdminPortalView from './components/AdminPortalView';
import EmployeePortalView from './components/EmployeePortalView';
import NotificationDrawer from './components/NotificationDrawer';
import { INITIAL_TICKETS, INITIAL_NOTIFICATIONS } from './mockData';
import { Ticket, TicketPriority, TicketStatus, UserRole, SystemNotification, TimelineMessage } from './types';
import { motion, AnimatePresence } from 'motion/react';

const playBellSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Create oscillator and gain nodes for a nice chime
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // High A note
    osc1.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.8);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.8);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.8);
    osc2.stop(ctx.currentTime + 0.8);
  } catch (err) {
    console.error("Failed to play synthesized chime sound:", err);
  }
};

const sendBrowserNotification = (title: string, body: string) => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/image/logo.png' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { body, icon: '/image/logo.png' });
      }
    });
  }
};

interface LoggedInUser {
  role: UserRole;
  username: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(() => {
    const saved = localStorage.getItem('probsolver_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const prevTicketsRef = useRef<Ticket[]>([]);
  const prevNotifsRef = useRef<SystemNotification[]>([]);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    connectionString: string;
    error: string | null;
    provider: string;
  } | null>(null);

  // Synchronized server-side mount database loaders
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        
        // 1. Fetch live MongoDB connection status
        const statusRes = await fetch('/api/db-status');
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setDbStatus(statusData);
        }

        // 2. Fetch live tickets
        const ticketsRes = await fetch('/api/tickets');
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setTickets(ticketsData);
          prevTicketsRef.current = ticketsData;
        }

        // 3. Fetch live notifications
        const notifsRes = await fetch('/api/notifications');
        if (notifsRes.ok) {
          const notifsData = await notifsRes.json();
          setNotifications(notifsData);
          prevNotifsRef.current = notifsData;
        }
      } catch (err) {
        console.error("Error establishing REST handshake with Express backend:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Real-time synchronization, Web Notifications, and synthesized chime sound
  useEffect(() => {
    if (!currentUser) return;

    // Ask for browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(async () => {
      try {
        const [ticketsRes, notifsRes] = await Promise.all([
          fetch('/api/tickets'),
          fetch('/api/notifications')
        ]);

        if (ticketsRes.ok) {
          const ticketsData: Ticket[] = await ticketsRes.json();
          
          // Check for new chat messages
          if (prevTicketsRef.current.length > 0) {
            ticketsData.forEach((newTicket: Ticket) => {
              const prevTicket = prevTicketsRef.current.find(t => t.id === newTicket.id);
              if (prevTicket) {
                // If message count increased
                if (newTicket.timeline.length > prevTicket.timeline.length) {
                  const newMsgs = newTicket.timeline.slice(prevTicket.timeline.length);
                  newMsgs.forEach(msg => {
                    // Check if sender is the counterpart
                    const isOther = (currentUser.role === 'user' && msg.sender !== 'client') ||
                                    (currentUser.role !== 'user' && msg.sender === 'client');
                    if (isOther) {
                      playBellSound();
                      sendBrowserNotification(
                        `New message on Ticket #${newTicket.id}`,
                        `${msg.sender === 'client' ? 'Client' : 'Agent'}: ${msg.text}`
                      );
                    }
                  });
                }
              }
            });
          }
          prevTicketsRef.current = ticketsData;
          setTickets(ticketsData);
        }

        if (notifsRes.ok) {
          const notifsData: SystemNotification[] = await notifsRes.json();
          // Check for new notifications
          if (prevNotifsRef.current.length > 0 && notifsData.length > prevNotifsRef.current.length) {
            const newNotifs = notifsData.filter(n => !prevNotifsRef.current.some(pn => pn.id === n.id));
            newNotifs.forEach((n: SystemNotification) => {
              playBellSound();
              sendBrowserNotification(n.title, n.text);
            });
          }
          prevNotifsRef.current = notifsData;
          setNotifications(notifsData);
        }
      } catch (err) {
        console.error("Polling sync error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Auth logins handler
  const handleLoginSuccess = (role: UserRole, username: string, name: string, avatar?: string) => {
    // Generate logical corporate email mappings
    let email = `${username}@sandbox-sec.dev`;
    if (username.includes('alex')) email = 'a.wright@hyperplane.io';
    else if (username.includes('elena')) email = 'e.rostova@vrtickets.secure';
    else if (username.includes('admin')) email = 'admin.chief@vrtickets.secure';

    const userObj = {
      role,
      username,
      name,
      email,
      avatar
    };
    localStorage.setItem('probsolver_auth_user', JSON.stringify(userObj));
    setCurrentUser(userObj);
  };

  const handleLogout = () => {
    localStorage.removeItem('probsolver_auth_user');
    setCurrentUser(null);
    setIsNotificationsOpen(false);
  };

  // Add Ticket Callback
  const handleAddNewTicket = async (newTicket: Ticket) => {
    setTickets(prev => [newTicket, ...prev]);

    // Push system notification
    const ingestNotification: SystemNotification = {
      id: `NOT-${Date.now()}`,
      title: 'Telemetry Ingested',
      text: `New incident telemetry file ${newTicket.id} was successfully loaded into queue.`,
      type: 'status',
      timestamp: new Date().toISOString(),
      read: false,
      ticketId: newTicket.id
    };
    setNotifications(prev => [ingestNotification, ...prev]);

    try {
      await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      });
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingestNotification)
      });
    } catch (err) {
      console.error("MongoDB sync error:", err);
    }
  };

  // Update Status Callback
  const handleUpdateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    const sysMsg: TimelineMessage = {
      id: `sys-${Date.now()}`,
      sender: 'system',
      text: `Telemetry flow restructured: State updated to ${status.toUpperCase().replace('_', ' ')}`,
      timestamp: new Date().toISOString()
    };

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status,
          timeline: [...t.timeline, sysMsg]
        };
      }
      return t;
    }));

    // Trigger notification
    const statusNot: SystemNotification = {
      id: `NOT-ST-${Date.now()}`,
      title: 'Pipeline Altered',
      text: `Ticket ${ticketId} status has been updated to ${status.replace('_', ' ')}.`,
      type: 'status',
      timestamp: new Date().toISOString(),
      read: false,
      ticketId
    };
    setNotifications(prev => [statusNot, ...prev]);

    try {
      const original = tickets.find(t => t.id === ticketId);
      const updatedTimeline = original ? [...original.timeline, sysMsg] : [sysMsg];
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, timeline: updatedTimeline })
      });
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusNot)
      });
    } catch (err) {
      console.error("MongoDB sync error:", err);
    }
  };

  // Update Priority Callback
  const handleUpdateTicketPriority = async (ticketId: string, priority: TicketPriority) => {
    const sysMsg: TimelineMessage = {
      id: `sys-pr-${Date.now()}`,
      sender: 'system',
      text: `Risk evaluation adjusted: Priority changed to ${priority.toUpperCase()}`,
      timestamp: new Date().toISOString()
    };

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          priority,
          timeline: [...t.timeline, sysMsg]
        };
      }
      return t;
    }));

    const priorityNot: SystemNotification = {
      id: `NOT-PR-${Date.now()}`,
      title: 'Risk Exceeded',
      text: `Ticket ${ticketId} threat index re-evaluated to ${priority}.`,
      type: 'alert',
      timestamp: new Date().toISOString(),
      read: false,
      ticketId
    };
    setNotifications(prev => [priorityNot, ...prev]);

    try {
      const original = tickets.find(t => t.id === ticketId);
      const updatedTimeline = original ? [...original.timeline, sysMsg] : [sysMsg];
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority, timeline: updatedTimeline })
      });
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(priorityNot)
      });
    } catch (err) {
      console.error("MongoDB sync error:", err);
    }
  };

  // Assign Employee staffing
  const handleAssignTicketEmployee = async (ticketId: string, employeeName: string, employeeAvatar?: string) => {
    const avatarMap: { [key: string]: string } = {
      'Elena Rostova': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
      'Marcus Vance': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120',
      'Sean Miller': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
    };

    const sysMsg: TimelineMessage = {
      id: `sys-as-${Date.now()}`,
      sender: 'system',
      text: `Operations coordinator delegated specialized node: ${employeeName} assumed triage control.`,
      timestamp: new Date().toISOString()
    };

    const finalAvatar = employeeAvatar || avatarMap[employeeName] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120';

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          assigneeName: employeeName,
          assigneeAvatar: finalAvatar,
          status: 'in_progress' as const,
          timeline: [...t.timeline, sysMsg]
        };
      }
      return t;
    }));

    const assignNot: SystemNotification = {
      id: `NOT-AS-${Date.now()}`,
      title: 'Specialist Delegated',
      text: `Support specialist ${employeeName} has been assigned to ticket ${ticketId}.`,
      type: 'assign',
      timestamp: new Date().toISOString(),
      read: false,
      ticketId
    };
    setNotifications(prev => [assignNot, ...prev]);

    try {
      const original = tickets.find(t => t.id === ticketId);
      const updatedTimeline = original ? [...original.timeline, sysMsg] : [sysMsg];
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigneeName: employeeName,
          assigneeAvatar: finalAvatar,
          status: 'in_progress',
          timeline: updatedTimeline
        })
      });
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignNot)
      });
    } catch (err) {
      console.error("MongoDB sync error:", err);
    }
  };

  // Log private workspace notes
  const handleAddTicketInternalNote = async (ticketId: string, noteText: string) => {
    const formattedNote = `${new Date().toLocaleTimeString()} - Admin: ${noteText}`;
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const currentNotes = t.internalNotes || [];
        return {
          ...t,
          internalNotes: [...currentNotes, formattedNote]
        };
      }
      return t;
    }));

    try {
      const original = tickets.find(t => t.id === ticketId);
      const updatedNotes = original ? [...(original.internalNotes || []), formattedNote] : [formattedNote];
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes: updatedNotes })
      });
    } catch (err) {
      console.error("MongoDB sync error:", err);
    }
  };

  // Solve Chat messages append
  const handleAddChatMessage = async (ticketId: string, message: TimelineMessage) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          timeline: [...t.timeline, message]
        };
      }
      return t;
    }));

    try {
      await fetch(`/api/tickets/${ticketId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      // If client spoke, alert employee
      if (message.sender === 'client') {
        const clientChatNot: SystemNotification = {
          id: `NOT-MSG-${Date.now()}`,
          title: 'New Client Message',
          text: `Alexander Wright posted troubleshooting parameters to ${ticketId}.`,
          type: 'message',
          timestamp: new Date().toISOString(),
          read: false,
          ticketId
        };
        setNotifications(prev => [clientChatNot, ...prev]);

        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientChatNot)
        });
      }
    } catch (err) {
      console.error("MongoDB sync error:", err);
    }
  };

  // Delete/Archive Ticket
  const handleDeleteTicket = async (ticketId: string) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));

    const deleteNot: SystemNotification = {
      id: `NOT-DEL-${Date.now()}`,
      title: 'Queue Purged',
      text: `Diagnostic pipeline ${ticketId} successfully cleared from cluster catalog.`,
      type: 'alert',
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [deleteNot, ...prev]);

    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE'
      });
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deleteNot)
      });
    } catch (err) {
      console.error("MongoDB sync error:", err);
    }
  };

  // Notifications drawer controls
  const handleMarkAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' });
    } catch (error) {}
  };

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === id) return { ...n, read: true };
      return n;
    }));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    } catch (error) {}
  };

  const handleClearAllNotifications = async () => {
    setNotifications([]);
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
    } catch (error) {}
  };

  const handleSelectTicketFromNotification = (ticketId: string) => {
    // Simply focuses or logs
    console.log("Observatory focusing on ticket ID:", ticketId);
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <div className="relative min-h-screen text-slate-100 font-sans flex flex-col bg-[#050814] justify-center items-center">
        <InteractiveBackground />
        <div className="text-center p-8 rounded-2xl bg-[#0a0b18]/80 border border-white/10 backdrop-blur-xl max-w-sm flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest font-mono text-slate-400">Syncing telemetry data</h2>
            <p className="text-[10px] text-slate-500 mt-1 font-sans">Connecting to MongoDB database cluster...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-slate-100 font-sans flex flex-col bg-[#050814] overflow-x-hidden">
      
      {/* 3D Animated background renderer (rotating wireframe icosahedron + 3D particles scatter) */}
      <InteractiveBackground />

      <AnimatePresence mode="wait">
        {!currentUser ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <LoginPortal onLoginSuccess={handleLoginSuccess} dbStatus={dbStatus} />
          </motion.div>
        ) : (
          <motion.div
            key="portal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="w-full flex-1 flex flex-col"
          >
            {currentUser.role === 'user' && (
              <UserPortalView
                tickets={tickets}
                userName={currentUser.name}
                userEmail={currentUser.email}
                userAvatar={currentUser.avatar}
                onLogout={handleLogout}
                onAddNewTicket={handleAddNewTicket}
                onUpdateTicketStatus={handleUpdateTicketStatus}
                onAddChatMessage={handleAddChatMessage}
                notificationsCount={unreadNotificationsCount}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
              />
            )}

            {currentUser.role === 'admin' && (
              <AdminPortalView
                tickets={tickets}
                onUpdateTicketStatus={handleUpdateTicketStatus}
                onUpdateTicketPriority={handleUpdateTicketPriority}
                onAssignTicketEmployee={handleAssignTicketEmployee}
                onAddTicketInternalNote={handleAddTicketInternalNote}
                onAddTicket={handleAddNewTicket}
                onDeleteTicket={handleDeleteTicket}
                onLogout={handleLogout}
                userName={currentUser.name}
              />
            )}

            {currentUser.role === 'employee' && (
              <EmployeePortalView
                tickets={tickets}
                employeeName={currentUser.name}
                employeeAvatar={currentUser.avatar}
                onLogout={handleLogout}
                onUpdateTicketStatus={handleUpdateTicketStatus}
                onAddChatMessage={handleAddChatMessage}
                notificationsCount={unreadNotificationsCount}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SYSTEM NOTIFICATIONS ALERTS DRAWER LAYOUT */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <NotificationDrawer
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            notifications={notifications}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onMarkRead={handleMarkNotificationRead}
            onClearAll={handleClearAllNotifications}
            onSelectTicket={handleSelectTicketFromNotification}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
