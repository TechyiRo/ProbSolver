export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type UserRole = 'admin' | 'employee' | 'user';

export interface TimelineMessage {
  id: string;
  sender: 'client' | 'agent' | 'system';
  text: string;
  timestamp: string;
  attachmentName?: string;
  seen?: boolean;
  senderName?: string;
  senderAvatar?: string;
}

export interface Attachment {
  name: string;
  size: string;
  type: string;
}

export interface Ticket {
  id: string;
  title: string;
  category: string;
  priority: TicketPriority;
  department: string;
  description: string;
  status: TicketStatus;
  date: string;
  expectedResolutionDate?: string;
  clientName: string;
  clientEmail: string;
  clientAvatar: string;
  assigneeName: string;
  assigneeAvatar: string;
  timeline: TimelineMessage[];
  attachments: Attachment[];
  internalNotes?: string[];
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  department: string;
  status: 'active' | 'inactive';
  role: UserRole;
  specialization?: string;
  currentWorkload?: number;
  avatar: string;
  password?: string;
  isFirstLogin?: boolean;
  company?: {
    name: string;
    address: string;
    logo?: string;
  };
}

export interface SystemNotification {
  id: string;
  title: string;
  text: string;
  type: 'info' | 'message' | 'status' | 'alert' | 'assign';
  timestamp: string;
  read: boolean;
  ticketId?: string;
}

export interface ResolutionDataPoint {
  day: string;
  resolved: number;
  received: number;
}
