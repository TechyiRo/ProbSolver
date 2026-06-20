import { Ticket, ResolutionDataPoint, UserAccount, SystemNotification } from './types';

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TKT-2026-0142',
    title: 'Cloud Run ingress routing bottleneck during bulk webhooks',
    category: 'Network',
    priority: 'critical',
    department: 'IT',
    description: 'We are experiencing severe 504 Gateway Timeouts under sudden bursts of stripe webhooks. Ingress CPU allocation is currently pinned at 1vCPU with throttle state active. Need recommendation on autoscaling configuration adjustments and instance concurrency settings.',
    status: 'open',
    date: '2026-06-18T22:45:00Z',
    expectedResolutionDate: '2026-06-20',
    clientName: 'Alexander Wright',
    clientEmail: 'a.wright@hyperplane.io',
    clientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    assigneeName: 'Elena Rostova',
    assigneeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    attachments: [
      { name: 'ingress_latency_chart.png', size: '1.2 MB', type: 'image/png' },
      { name: 'server_stack_trace.log', size: '4.8 KB', type: 'text/plain' }
    ],
    timeline: [
      {
        id: 'msg-1',
        sender: 'client',
        text: "Hi, we just launched our subscription beta and our Cloud Run instances are instantly hitting the hard 80 concurrent request limit under bulk stripe triggers, dropping about 14% of payloads with 504 timeouts. We need a rapid bump of our max instances or advice on queue throttling.",
        timestamp: '2026-06-18T22:45:00Z'
      },
      {
        id: 'msg-2',
        sender: 'system',
        text: 'Issue automatically escalated to Critical Priority based on 14% payload drop rate metric detection.',
        timestamp: '2026-06-18T22:46:12Z'
      }
    ],
    internalNotes: [
      'Checked Cloud Run limits. We can increase maximum instances to 100 to handle webhook peaks.'
    ]
  },
  {
    id: 'TKT-2026-0094',
    title: 'OAuth scope handshake failure with Microsoft Graph API',
    category: 'Access',
    priority: 'high',
    department: 'IT',
    description: 'The redirect handshake fails specifically for corporate tenants with multi-factor authentication enforced. Our callback handler times out awaiting the OAuth state token validation response. Seems like an issue with the state query parameter encoding or Cookie SameSite configuration inside the iframe environment.',
    status: 'in_progress',
    date: '2026-06-18T18:12:00Z',
    expectedResolutionDate: '2026-06-21',
    clientName: 'Sarah Jenkins',
    clientEmail: 's.jenkins@clarity-analytics.com',
    clientAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120',
    assigneeName: 'Marcus Vance',
    assigneeAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120',
    attachments: [
      { name: 'oauth_correlation_id.txt', size: '3.4 KB', type: 'text/plain' }
    ],
    timeline: [
      {
        id: 'msg-3',
        sender: 'client',
        text: "Every time we trigger the MS Graph alignment, users from federated azure folders get locked out indicating state token mismatches. Here is an attachment showing the correlation token. It fails on Chrome 114+ and Safari 16+. Any suggestions on SameSite adjustments?",
        timestamp: '2026-06-18T18:12:00Z'
      },
      {
        id: 'msg-4',
        sender: 'agent',
        text: "Hi Sarah, I am reviewing our handoff logic of oauth state strings. This is highly likely an iframe security boundary issue. In compliance with modern cookie restrictions (SameSite=Lax/None), we might need to proxy the initial authentication outside of the iframe modal. I am running a quick simulator to test this.",
        timestamp: '2026-06-18T19:30:15Z'
      }
    ],
    internalNotes: [
      'Customer uses Azure AD with standard SAML integrations. Double check browser cookie restrictions in iframe context.'
    ]
  },
  {
    id: 'TKT-2026-0044',
    title: 'ERP accounting software license activation keys locked',
    category: 'Software',
    priority: 'medium',
    department: 'Finance',
    description: 'Our audit department can not launch the core SAP Ledger sync software since morning. The cloud key manager claims "Seat limit of 25 matched, additional license lease aborted". We should have 35 concurrent node seats registered.',
    status: 'pending',
    date: '2026-06-18T14:24:00Z',
    expectedResolutionDate: '2026-06-22',
    clientName: 'Daniel Oh',
    clientEmail: 'd.oh@quant-labs.sg',
    clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    assigneeName: 'Marcus Vance',
    assigneeAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120',
    attachments: [],
    timeline: [
      {
        id: 'msg-5',
        sender: 'client',
        text: "Hello, our team suspends compute instances during non-market hours (6 PM - 8 AM SGT) to cut redundant running costs. How is it possible we were charged for 24/7 compute allocations in the recent billing period?",
        timestamp: '2026-06-18T14:24:00Z'
      },
      {
        id: 'msg-6',
        sender: 'agent',
        text: "Hi Daniel, let me investigate the suspension logs. Sometime suspended instances retain reservation status depending on external network attachments. I am parsing the hypervisor logs for those dates.",
        timestamp: '2026-06-18T15:10:00Z'
      }
    ]
  },
  {
    id: 'TKT-2026-0012',
    title: 'Office fiber backbone switch core packet drops',
    category: 'Network',
    priority: 'high',
    department: 'IT',
    description: 'Ethernet ports on Floor 3 are sporadically dropping packets when video calls are initiated. Wireless LAN mesh APs are also flagging high jitter. Router CPU temp is nominal but link light triggers amber.',
    status: 'open',
    date: '2026-06-18T11:05:00Z',
    expectedResolutionDate: '2026-06-19',
    clientName: 'Isabella Vance',
    clientEmail: 'vance.i@cognitivesystems.tech',
    clientAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    assigneeName: 'Unassigned',
    assigneeAvatar: '',
    attachments: [],
    timeline: [
      {
        id: 'msg-7',
        sender: 'client',
        text: "We are uploading absolute codebase indexes for automated translation. However, on large targets we get unparsed JSON blocks in our output text stream. Are we hitting some hidden payload buffers on token handoff?",
        timestamp: '2026-06-18T11:05:00Z'
      }
    ]
  },
  {
    id: 'TKT-2026-0008',
    title: 'Visual headset calibration tools fail on firmware v4',
    category: 'Hardware',
    priority: 'low',
    department: 'Operations',
    description: 'Connecting our hardware testing units over USB-C defaults to a legacy driver state. The firmware auto-updater loops on verification steps. This is halting our quality assurance checks on incoming batches.',
    status: 'resolved',
    date: '2026-06-17T09:15:00Z',
    expectedResolutionDate: '2026-06-18',
    clientName: 'Evelyn Brooks',
    clientEmail: 'brooks@devbox-hq.org',
    clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    assigneeName: 'Elena Rostova',
    assigneeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    attachments: [],
    timeline: [
      {
        id: 'msg-8',
        sender: 'client',
        text: "We keep getting calibration renewal failures after weekends of offline activity. Headsets have to log in from scratch, violating our token lifetime policies.",
        timestamp: '2026-06-17T09:15:00Z'
      },
      {
        id: 'msg-9',
        sender: 'agent',
        text: "I reviewed your calibration bounds. It turns out the USB descriptor was expecting a secondary interface. I bypass verification loops and it is working now.",
        timestamp: '2026-06-17T14:40:00Z'
      },
      {
        id: 'msg-10',
        sender: 'system',
        text: 'Ticket resolved by Elena Rostova. Operator validated update success.',
        timestamp: '2026-06-18T14:40:00Z'
      }
    ]
  }
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'USR-001',
    name: 'Alexander Wright',
    username: 'alex_w',
    email: 'a.wright@hyperplane.io',
    department: 'IT',
    status: 'active',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'USR-002',
    name: 'Sarah Jenkins',
    username: 'sarah_j',
    email: 's.jenkins@clarity-analytics.com',
    department: 'Operations',
    status: 'active',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'USR-003',
    name: 'Daniel Oh',
    username: 'daniel_o',
    email: 'd.oh@quant-labs.sg',
    department: 'Finance',
    status: 'active',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120'
  }
];

export const INITIAL_EMPLOYEES: UserAccount[] = [
  {
    id: 'EMP-001',
    name: 'Elena Rostova',
    username: 'elena_r',
    email: 'e.rostova@vrtickets.secure',
    department: 'IT Support',
    status: 'active',
    role: 'employee',
    specialization: 'Cloud Infrastructure',
    currentWorkload: 2,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'EMP-002',
    name: 'Marcus Vance',
    username: 'marcus_v',
    email: 'm.vance@vrtickets.secure',
    department: 'Access & Compliance',
    status: 'active',
    role: 'employee',
    specialization: 'Access Control',
    currentWorkload: 4,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 'EMP-003',
    name: 'Sean Miller',
    username: 'sean_m',
    email: 's.miller@vrtickets.secure',
    department: 'Hardware Dev',
    status: 'active',
    role: 'employee',
    specialization: 'Hardware Support',
    currentWorkload: 1,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'NOT-001',
    title: 'Ticket Assigned',
    text: 'Your ticket TKT-2026-0142 has been assigned to specialist Elena Rostova.',
    type: 'assign',
    timestamp: '2026-06-18T22:50:00Z',
    read: false,
    ticketId: 'TKT-2026-0142'
  },
  {
    id: 'NOT-002',
    title: 'New Chat Received',
    text: 'Marcus Vance posted a solution inquiry for TKT-2026-0094.',
    type: 'message',
    timestamp: '2026-06-18T19:30:15Z',
    read: false,
    ticketId: 'TKT-2026-0094'
  }
];

export const RESOLUTION_TRENDS: ResolutionDataPoint[] = [
  { day: 'Mon', received: 18, resolved: 14 },
  { day: 'Tue', received: 25, resolved: 22 },
  { day: 'Wed', received: 35, resolved: 28 },
  { day: 'Thu', received: 28, resolved: 31 },
  { day: 'Fri', received: 42, resolved: 36 },
  { day: 'Sat', received: 14, resolved: 16 },
  { day: 'Sun', received: 10, resolved: 12 },
];

export const CATEGORY_COLORS: { [key: string]: string } = {
  'Hardware': '#3b82f6', // Blue
  'Software': '#ec4899', // Pink
  'Network': '#06b6d4',  // Cyan
  'Access': '#a855f7',   // Purple
  'Other': '#64748b'     // Slate
};
