import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import compression from 'compression';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// ── Performance: gzip all responses ─────────────────────────────────────────
app.use(compression({ level: 6, threshold: 1024 }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// State & Fallbacks for Offline/Sandbox state
let isDbConnected = false;
let dbConnectionStringUsed = "";
let dbErrorMessage = "";

// Default raw user connection with fallback parameter
let MONGODB_URI = process.env.MONGODB_URI || "mongodb://vrticket:Admin%40123!@ac-95y1fw9-shard-00-00.akel4ug.mongodb.net:27017,ac-95y1fw9-shard-00-01.akel4ug.mongodb.net:27017,ac-95y1fw9-shard-00-02.akel4ug.mongodb.net:27017/?ssl=true&replicaSet=atlas-113v5z-shard-0&authSource=admin&appName=VR-Ticket";

// Sanitize any leading/trailing quotes or spaces from environment managers (e.g. Render/Railway)
MONGODB_URI = MONGODB_URI.trim().replace(/^['"]|['"]$/g, '');

dbConnectionStringUsed = MONGODB_URI.replace(/:([^@]+)@/, ":******@"); // Obfuscate password in UI/logs

// For Vercel Serverless: cache the connection across warm boots
let cachedConnection = (global as any).mongooseConnection;

if (!cachedConnection) {
  cachedConnection = mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,   // fail fast if Atlas is unreachable
    socketTimeoutMS: 30000,           // don't hold sockets open too long
    maxPoolSize: 10,                  // max concurrent connections in pool
    minPoolSize: 2,                   // keep 2 connections warm to avoid cold connects
    heartbeatFrequencyMS: 10000,      // check connection health every 10s
  } as any)
    .then(() => {
      console.log("Successfully established secure connection tunnel with MongoDB cluster");
      isDbConnected = true;
    })
    .catch((err: any) => {
      console.error("MongoDB Cluster Connection warning:", err);
      dbErrorMessage = err.message || String(err);
    });
  
  (global as any).mongooseConnection = cachedConnection;
} else {
  isDbConnected = true; // Connection was warm
}

// --- MONGODB SCHEMAS & MODELS ---
const AttachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  size: { type: String, required: true },
  type: { type: String, required: true }
});

const TimelineMessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  sender: { type: String, required: true, enum: ['client', 'agent', 'system'] },
  text: { type: String, required: true },
  timestamp: { type: String, required: true },
  seen: { type: Boolean, default: false },
  senderName: { type: String },
  senderAvatar: { type: String }
});

const TicketSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'] },
  status: { type: String, required: true, enum: ['open', 'in_progress', 'pending', 'resolved', 'closed'] },
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  assigneeName: { type: String, default: 'Unassigned' },
  assigneeAvatar: { type: String, default: '' },
  date: { type: String, required: true },
  internalNotes: { type: [String], default: [] },
  attachments: { type: [AttachmentSchema], default: [] },
  timeline: { type: [TimelineMessageSchema], default: [] }
});

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  text: { type: String, required: true },
  type: { type: String, required: true },
  timestamp: { type: String, required: true },
  read: { type: Boolean, default: false },
  ticketId: { type: String }
});

const TicketModel = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

const UserAccountSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  status: { type: String, required: true, enum: ['active', 'inactive'] },
  role: { type: String, required: true, enum: ['user', 'employee'] },
  specialization: { type: String },
  currentWorkload: { type: Number },
  avatar: { type: String },
  password: { type: String },
  isFirstLogin: { type: Boolean, default: true },
  company: {
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    logo: { type: String, default: '' }
  }
});

const UserAccountModel = mongoose.models.UserAccount || mongoose.model('UserAccount', UserAccountSchema);

// In-Memory Backups if DB fails
let localMemoryTickets: any[] = [];
let localMemoryNotifications: any[] = [];
let localMemoryUsers: any[] = [];

// Fallback loader if DB is completely unavailable during testing/sandboxing
async function seedDatabaseIfNeeded() {
  try {
    const ticketCount = await TicketModel.countDocuments();
    const notifCount = await NotificationModel.countDocuments();
    const userAccCount = await UserAccountModel.countDocuments();

    // Import base records
    const { INITIAL_TICKETS, INITIAL_NOTIFICATIONS, INITIAL_USERS, INITIAL_EMPLOYEES } = await import('./src/mockData');

    if (ticketCount === 0) {
      console.log("Seeding MongoDB with default tickets...");
      await TicketModel.insertMany(INITIAL_TICKETS as any[]);
    }
    if (notifCount === 0) {
      console.log("Seeding MongoDB with default system notifications...");
      await NotificationModel.insertMany(INITIAL_NOTIFICATIONS as any[]);
    }
    if (userAccCount === 0) {
      console.log("Seeding MongoDB with default user and employee accounts...");
      await UserAccountModel.insertMany([...INITIAL_USERS, ...INITIAL_EMPLOYEES] as any[]);
    }
  } catch (err) {
    console.error("Error seeding MongoDB:", err);
  }
}

// Initial offline synchronization for failover safety
(async () => {
  try {
    // Initialized as empty for a completely clean slate
    localMemoryTickets = [];
    localMemoryNotifications = [];
    localMemoryUsers = [];
  } catch (_) {}
})();

// --- API ENDPOINTS ---

// ── Keep-alive ping — prevents Render free-tier spin-down ───────────────────
app.get('/api/ping', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, ts: Date.now() });
});

// Server health check & active connection tunnel monitoring telemetry
app.get('/api/db-status', (req, res) => {
  res.json({
    connected: isDbConnected,
    connectionString: dbConnectionStringUsed,
    error: dbErrorMessage || null,
    provider: isDbConnected ? "MongoDB Atlas Real-Time Segment" : "In-Memory Sandbox Failover"
  });
});

// GET /api/users
app.get('/api/users', async (req, res) => {
  try {
    if (isDbConnected) {
      const users = await UserAccountModel.find({} as any);
      res.json(users);
    } else {
      res.json(localMemoryUsers);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const u = username.toLowerCase().trim();
    const p = password.trim();

    // 1. Check if user is in database/memory
    let userRecord = null;
    if (isDbConnected) {
      userRecord = await UserAccountModel.findOne({ username: u } as any);
    } else {
      userRecord = localMemoryUsers.find(user => user.username === u);
    }

    if (userRecord) {
      // Validate password
      if (userRecord.password === p) {
        return res.json({
          success: true,
          user: {
            id: userRecord.id,
            name: userRecord.name,
            username: userRecord.username,
            email: userRecord.email,
            role: userRecord.role,
            isFirstLogin: userRecord.isFirstLogin ?? false,
            avatar: userRecord.avatar || "",
            company: userRecord.company || undefined
          }
        });
      } else {
        return res.status(401).json({ error: "Invalid credentials." });
      }
    }

    // 2. Fallbacks
    if (u === 'admin' && p === 'admin') {
      return res.json({
        success: true,
        user: { id: "admin_node", name: "Platform Chief", username: "admin", email: "admin.chief@vrtickets.secure", role: "admin", isFirstLogin: false, avatar: "" }
      });
    } else if (u === 'user' && p === 'user') {
      return res.json({
        success: true,
        user: { 
          id: "client_alex", 
          name: "Alexander Wright", 
          username: "user", 
          email: "a.wright@hyperplane.io", 
          role: "user", 
          isFirstLogin: false, 
          avatar: "",
          company: {
            name: "SP IT",
            address: "12 Corporate Heights, Sector 4, Silicon Valley",
            logo: ""
          }
        }
      });
    } else if (u === 'employee' && p === 'employee') {
      return res.json({
        success: true,
        user: { id: "tech_elena", name: "Elena Rostova", username: "employee", email: "e.rostova@vrtickets.secure", role: "employee", isFirstLogin: false, avatar: "" }
      });
    }

    return res.status(401).json({ error: "User profile not found." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/register — Self-service user registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, username, email, department, password, avatar, company } = req.body;

    // Validate required fields
    if (!name || !username || !email || !department || !password) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }
    if (!company || !company.name || !company.address) {
      return res.status(400).json({ error: 'Company name and address are mandatory.' });
    }

    const u = username.toLowerCase().trim();

    // Check for username uniqueness
    let existing = null;
    if (isDbConnected) {
      existing = await UserAccountModel.findOne({ username: u } as any);
    } else {
      existing = localMemoryUsers.find((usr: any) => usr.username === u);
    }
    if (existing) {
      return res.status(409).json({ error: 'Username already taken. Please choose a different one.' });
    }

    const newId = `USR-${Date.now()}`;
    const userData = {
      id: newId,
      name: name.trim(),
      username: u,
      email: email.trim().toLowerCase(),
      department: department.trim(),
      status: 'active',
      role: 'user',
      password: password.trim(),
      isFirstLogin: false,
      avatar: avatar || '',
      company: {
        name: company.name.trim(),
        address: company.address.trim(),
        logo: company.logo ? company.logo.trim() : ''
      }
    };

    if (isDbConnected) {
      const newUser = new UserAccountModel(userData);
      await newUser.save();
    } else {
      localMemoryUsers.push(userData);
    }

    return res.status(201).json({
      success: true,
      user: {
        id: userData.id,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        isFirstLogin: false,
        avatar: userData.avatar,
        company: userData.company
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/first-setup
app.post('/api/users/:id/first-setup', async (req, res) => {
  try {
    const { id } = req.params;
    const { password, avatar } = req.body;

    if (isDbConnected) {
      const updatedUser = await UserAccountModel.findOneAndUpdate(
        { id } as any,
        { password, avatar, isFirstLogin: false } as any,
        { new: true } as any
      );
      if (!updatedUser) return res.status(404).json({ error: "User not found." });
      res.json({ success: true });
    } else {
      const idx = localMemoryUsers.findIndex(u => u.id === id);
      if (idx === -1) return res.status(404).json({ error: "User not found." });
      localMemoryUsers[idx].password = password;
      localMemoryUsers[idx].avatar = avatar;
      localMemoryUsers[idx].isFirstLogin = false;
      res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users
app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    if (isDbConnected) {
      const newUser = new UserAccountModel(userData);
      await newUser.save();
      res.status(201).json(newUser);
    } else {
      localMemoryUsers.push(userData);
      res.status(201).json(userData);
    }
  } catch (err: any) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (isDbConnected) {
      const updatedUser = await UserAccountModel.findOneAndUpdate({ id } as any, updates, { new: true } as any);
      if (!updatedUser) return res.status(404).json({ error: "User profile not found" });
      res.json(updatedUser);
    } else {
      const idx = localMemoryUsers.findIndex(u => u.id === id);
      if (idx === -1) return res.status(404).json({ error: "User profile not found" });
      localMemoryUsers[idx] = { ...localMemoryUsers[idx], ...updates };
      res.json(localMemoryUsers[idx]);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbConnected) {
      const deletedUser = await UserAccountModel.findOneAndDelete({ id } as any);
      if (!deletedUser) return res.status(404).json({ error: "User profile not found" });
      res.json({ success: true });
    } else {
      localMemoryUsers = localMemoryUsers.filter(u => u.id !== id);
      res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tickets
app.get('/api/tickets', async (req, res) => {
  try {
    if (isDbConnected) {
      const tickets = await TicketModel.find().sort({ date: -1 });
      res.json(tickets);
    } else {
      res.json(localMemoryTickets);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tickets
app.post('/api/tickets', async (req, res) => {
  try {
    const ticketData = req.body;
    if (isDbConnected) {
      const newTicket = new TicketModel(ticketData);
      await newTicket.save();
      res.status(201).json(newTicket);
    } else {
      localMemoryTickets.unshift(ticketData);
      res.status(201).json(ticketData);
    }
  } catch (err: any) {
    console.error("Error creating ticket:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tickets/:id
app.put('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (isDbConnected) {
      const updatedTicket = await TicketModel.findOneAndUpdate({ id } as any, updates, { new: true } as any);
      if (!updatedTicket) return res.status(404).json({ error: "Ticket not recovered" });
      res.json(updatedTicket);
    } else {
      const idx = localMemoryTickets.findIndex(t => t.id === id);
      if (idx === -1) return res.status(404).json({ error: "Ticket not recovered" });
      localMemoryTickets[idx] = { ...localMemoryTickets[idx], ...updates };
      res.json(localMemoryTickets[idx]);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tickets/:id/timeline
app.post('/api/tickets/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params;
    const message = req.body;
    if (isDbConnected) {
      const ticket = await TicketModel.findOne({ id } as any);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      ticket.timeline.push(message);
      if (message.sender === 'agent' && (!ticket.assigneeName || ticket.assigneeName === 'Unassigned') && message.senderName) {
        ticket.assigneeName = message.senderName;
        if (message.senderAvatar) {
          ticket.assigneeAvatar = message.senderAvatar;
        }
      }
      await ticket.save();
      res.json(ticket);
    } else {
      const idx = localMemoryTickets.findIndex(t => t.id === id);
      if (idx === -1) return res.status(404).json({ error: "Ticket not found" });
      localMemoryTickets[idx].timeline.push(message);
      if (message.sender === 'agent' && (!localMemoryTickets[idx].assigneeName || localMemoryTickets[idx].assigneeName === 'Unassigned') && message.senderName) {
        localMemoryTickets[idx].assigneeName = message.senderName;
        if (message.senderAvatar) {
          localMemoryTickets[idx].assigneeAvatar = message.senderAvatar;
        }
      }
      res.json(localMemoryTickets[idx]);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tickets/:id/timeline/:messageId
app.delete('/api/tickets/:id/timeline/:messageId', async (req, res) => {
  try {
    const { id, messageId } = req.params;
    if (isDbConnected) {
      const updatedTicket = await TicketModel.findOneAndUpdate(
        { id } as any,
        { $pull: { timeline: { id: messageId } } } as any,
        { new: true } as any
      );
      if (!updatedTicket) return res.status(404).json({ error: "Ticket not found" });
      res.json(updatedTicket);
    } else {
      const idx = localMemoryTickets.findIndex(t => t.id === id);
      if (idx === -1) return res.status(404).json({ error: "Ticket not found" });
      localMemoryTickets[idx].timeline = localMemoryTickets[idx].timeline.filter(m => m.id !== messageId);
      res.json(localMemoryTickets[idx]);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tickets/:id/seen
app.put('/api/tickets/:id/seen', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const counterpartSender = role === 'user' ? 'agent' : 'client';

    if (isDbConnected) {
      const ticket = await TicketModel.findOne({ id } as any);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      
      ticket.timeline.forEach((msg: any) => {
        if (msg.sender === counterpartSender) {
          msg.seen = true;
        }
      });
      await ticket.save();
      res.json(ticket);
    } else {
      const idx = localMemoryTickets.findIndex(t => t.id === id);
      if (idx === -1) return res.status(404).json({ error: "Ticket not found" });
      localMemoryTickets[idx].timeline.forEach(msg => {
        if (msg.sender === counterpartSender) {
          msg.seen = true;
        }
      });
      res.json(localMemoryTickets[idx]);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// In-memory presence store
const chatPresence: Record<string, { agent: boolean; client: boolean }> = {};

// POST /api/tickets/:id/presence
app.post('/api/tickets/:id/presence', (req, res) => {
  const { id } = req.params;
  const { role, active } = req.body;
  if (!chatPresence[id]) {
    chatPresence[id] = { agent: false, client: false };
  }
  if (role === 'user') {
    chatPresence[id].client = !!active;
  } else {
    chatPresence[id].agent = !!active;
  }
  res.json({ success: true, presence: chatPresence[id] });
});

// GET /api/tickets/:id/presence
app.get('/api/tickets/:id/presence', (req, res) => {
  const { id } = req.params;
  res.json(chatPresence[id] || { agent: false, client: false });
});

// In-memory typing status store
const typingStatus: Record<string, { agent: boolean; client: boolean }> = {};

// POST /api/tickets/:id/typing
app.post('/api/tickets/:id/typing', (req, res) => {
  const { id } = req.params;
  const { sender, isTyping } = req.body;
  if (!typingStatus[id]) {
    typingStatus[id] = { agent: false, client: false };
  }
  if (sender === 'client') {
    typingStatus[id].client = !!isTyping;
  } else {
    typingStatus[id].agent = !!isTyping;
  }
  res.json({ success: true, typing: typingStatus[id] });
});

// GET /api/tickets/:id/typing
app.get('/api/tickets/:id/typing', (req, res) => {
  const { id } = req.params;
  res.json(typingStatus[id] || { agent: false, client: false });
});

// DELETE /api/tickets/:id
app.delete('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbConnected) {
      await TicketModel.findOneAndDelete({ id } as any);
      res.json({ success: true });
    } else {
      localMemoryTickets = localMemoryTickets.filter(t => t.id !== id);
      res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications
app.get('/api/notifications', async (req, res) => {
  try {
    if (isDbConnected) {
      const notifications = await NotificationModel.find().sort({ timestamp: -1 });
      res.json(notifications);
    } else {
      res.json(localMemoryNotifications);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications
app.post('/api/notifications', async (req, res) => {
  try {
    const notificationData = req.body;
    if (isDbConnected) {
      const newNotification = new NotificationModel(notificationData);
      await newNotification.save();
      res.status(201).json(newNotification);
    } else {
      localMemoryNotifications.unshift(notificationData);
      res.status(201).json(notificationData);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/read-all
app.put('/api/notifications/read-all', async (req, res) => {
  try {
    if (isDbConnected) {
      await NotificationModel.updateMany({ read: false }, { $set: { read: true } });
      res.json({ success: true });
    } else {
      localMemoryNotifications = localMemoryNotifications.map(n => ({ ...n, read: true }));
      res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbConnected) {
      await NotificationModel.findOneAndUpdate({ id } as any, { $set: { read: true } } as any, {} as any);
      res.json({ success: true });
    } else {
      const idx = localMemoryNotifications.findIndex(n => n.id === id);
      if (idx !== -1) localMemoryNotifications[idx].read = true;
      res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications
app.delete('/api/notifications', async (req, res) => {
  try {
    if (isDbConnected) {
      await NotificationModel.deleteMany({});
      res.json({ success: true });
    } else {
      localMemoryNotifications = [];
      res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- VITE MIDDLEWARE ENROLLMENT ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log("Vite interactive dev middleware bound to router cascade");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // ── Production static assets with aggressive caching ──────────────────
    app.use(express.static(distPath, {
      maxAge: '1y',          // JS/CSS fingerprinted by Vite — cache 1 year
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        // HTML must NOT be cached — always fresh
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Production static server route index active");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express application container listening securely on host 0.0.0.0:${PORT}`);
  });
}

// Export app for Vercel Serverless or run normally
if (process.env.VERCEL) {
  module.exports = app;
} else {
  startServer();
}
