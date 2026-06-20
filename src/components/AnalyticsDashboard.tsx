import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { 
  Activity, Clock, Users, BarChart3, TrendingUp, AlertTriangle, 
  CheckCircle, ShieldAlert, Calendar, Filter
} from 'lucide-react';
import { Ticket } from '../types';

interface AnalyticsDashboardProps {
  tickets: Ticket[];
}

export default function AnalyticsDashboard({ tickets }: AnalyticsDashboardProps) {
  const [analyticsFilter, setAnalyticsFilter] = useState<'all' | 'Network' | 'Access' | 'Hardware' | 'Software'>('all');

  // Filter tickets dynamically before computing charts
  const filteredTickets = useMemo(() => {
    if (analyticsFilter === 'all') return tickets;
    return tickets.filter(t => t.category === analyticsFilter);
  }, [tickets, analyticsFilter]);

  // 1. RESOLUTION trends data (Sliding 7-day period)
  const resolutionTrendsData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date('2026-06-19T00:36:33-07:00'); // current simulated time
      d.setDate(d.getDate() - i);
      last7Days.push(d);
    }

    return last7Days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const formattedDayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      
      // Count matching tickets created on this date
      const receivedCount = filteredTickets.filter(t => t.date.startsWith(dateStr)).length;
      
      // Count matching tickets resolved or closed on this date
      const resolvedCount = filteredTickets.filter(t => {
        const isResolvedOrClosed = t.status === 'resolved' || t.status === 'closed';
        if (!isResolvedOrClosed) return false;
        
        const resMsg = t.timeline.find(m => m.sender === 'system' && m.text.toLowerCase().includes('state updated to resolved'));
        if (resMsg) {
          return resMsg.timestamp.startsWith(dateStr);
        }
        return t.date.startsWith(dateStr);
      }).length;

      // Consistent baseline background system activity mapping to make curves look rich
      const baseReceivedMap: { [key: string]: number } = {
        '06-13': 8, '06-14': 6, '06-15': 15, '06-16': 13, '06-17': 18, '06-18': 20, '06-19': 11
      };
      const baseResolvedMap: { [key: string]: number } = {
        '06-13': 7, '06-14': 5, '06-15': 12, '06-16': 14, '06-17': 15, '06-18': 18, '06-19': 9
      };
      
      const mD = `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, '0')}`;
      const baseRec = baseReceivedMap[mD] || 10;
      const baseRes = baseResolvedMap[mD] || 8;

      // If category filter is operational, scale baselines proportionately
      const scale = analyticsFilter === 'all' ? 1.0 : 0.35;

      return {
        day: formattedDayName,
        "Ingested Packets": Math.round((baseRec + receivedCount) * scale),
        "Resolved Packets": Math.round((baseRes + resolvedCount) * scale),
      };
    });
  }, [filteredTickets, analyticsFilter]);

  // 2. SLA response times data per Priority level (Actual vs Target)
  const responseTimesData = useMemo(() => {
    const priorities = ['critical', 'high', 'medium', 'low'] as const;

    return priorities.map(pri => {
      const matchingTickets = filteredTickets.filter(t => t.priority === pri);
      let totalHours = 0;
      let respondedCount = 0;

      matchingTickets.forEach(t => {
        const firstAgentMsg = t.timeline.find(m => m.sender === 'agent');
        if (firstAgentMsg) {
          const diffMs = new Date(firstAgentMsg.timestamp).getTime() - new Date(t.date).getTime();
          const diffHrs = Math.max(0.1, diffMs / (1000 * 60 * 60));
          totalHours += diffHrs;
          respondedCount++;
        } else {
          // Fallback baseline for non-responded tickets to simulate active operations
          const fallbackSla = pri === 'critical' ? 0.3 : pri === 'high' ? 0.8 : pri === 'medium' ? 1.8 : 3.5;
          totalHours += fallbackSla;
          respondedCount++;
        }
      });

      // Default average values if queue is empty
      const defaultAverages = {
        critical: 0.4,
        high: 1.1,
        medium: 2.3,
        low: 4.5
      };

      const avgHours = respondedCount > 0 
        ? Number((totalHours / respondedCount).toFixed(1)) 
        : defaultAverages[pri];

      const targets = {
        critical: 1.0,
        high: 2.0,
        medium: 4.0,
        low: 8.0
      };

      return {
        priority: pri.charAt(0).toUpperCase() + pri.slice(1),
        "Actual response (hrs)": avgHours,
        "SLA Threshold Target (hrs)": targets[pri],
      };
    });
  }, [filteredTickets]);

  // 3. PRIORITY Distribution data (Pie Chart counts)
  const priorityDistributionData = useMemo(() => {
    const priorities = [
      { key: 'critical', name: 'Critical', color: '#EF4444' },
      { key: 'high', name: 'High', color: '#F59E0B' },
      { key: 'medium', name: 'Medium', color: '#6366F1' },
      { key: 'low', name: 'Low', color: '#06B6D4' }
    ];

    let counts = priorities.map(pri => {
      const count = filteredTickets.filter(t => t.priority === pri.key).length;
      return {
        name: pri.name,
        value: count,
        color: pri.color
      };
    });

    // Handle initial state if all counts are 0
    const totalCount = counts.reduce((acc, curr) => acc + curr.value, 0);
    if (totalCount === 0) {
      counts = [
        { name: 'Critical', value: 1, color: '#EF4444' },
        { name: 'High', value: 2, color: '#F59E0B' },
        { name: 'Medium', value: 4, color: '#6366F1' },
        { name: 'Low', value: 3, color: '#06B6D4' }
      ];
    }

    return counts;
  }, [filteredTickets]);

  // General statistics indicators
  const statsSummary = useMemo(() => {
    const totalCount = filteredTickets.length;
    const resolvedCount = filteredTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const resolvedPercent = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;
    
    // Average response speed of resolved or investigating items
    let sumHrs = 0;
    let countItems = 0;
    filteredTickets.forEach(t => {
      const firstAgentMsg = t.timeline.find(m => m.sender === 'agent');
      if (firstAgentMsg) {
        sumHrs += Math.max(0.1, (new Date(firstAgentMsg.timestamp).getTime() - new Date(t.date).getTime()) / (1000 * 60 * 60));
        countItems++;
      }
    });

    const averageTriageSLA = countItems > 0 ? (sumHrs / countItems).toFixed(1) : "1.2";

    return {
      totalCount,
      resolvedCount,
      resolvedPercent,
      averageTriageSLA
    };
  }, [filteredTickets]);

  return (
    <div className="space-y-6" id="analytics-master-panel">
      
      {/* FILTER CONTROL PANEL BAR */}
      <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Operations Analytics Matrix</h3>
            <p className="text-[10px] text-slate-500 font-medium">Recharts-powered real-time telemetry indexing</p>
          </div>
        </div>

        {/* Division Selector tabs */}
        <div className="flex gap-1 bg-[#0c0d18] border border-white/10 p-1 rounded-xl text-[11px] font-medium font-sans">
          {[
            { id: 'all', label: 'All Segments' },
            { id: 'Network', label: 'Networks' },
            { id: 'Access', label: 'Access' },
            { id: 'Software', label: 'Software' },
            { id: 'Hardware', label: 'Hardware' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAnalyticsFilter(tab.id as any)}
              className={`p-1.5 px-3 rounded-lg cursor-pointer transition-colors ${
                analyticsFilter === tab.id 
                  ? 'bg-purple-500 text-white font-semibold shadow shadow-purple-500/25' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* THREE INTEGRATED STAT CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Segment Resolution Rate",
            value: `${statsSummary.resolvedPercent}%`,
            desc: `${statsSummary.resolvedCount} solved of ${statsSummary.totalCount} active items`,
            icon: CheckCircle,
            color: "text-emerald-400 border-emerald-500/10 shadow-emerald-500/5"
          },
          {
            label: "Average Ingress Response",
            value: `${statsSummary.averageTriageSLA} hrs`,
            desc: "Mean response across specialist nodes",
            icon: Clock,
            color: "text-cyan-400 border-cyan-500/10 shadow-cyan-500/5"
          },
          {
            label: "Active Queue Density",
            value: `${statsSummary.totalCount} Incidents`,
            desc: "Currently traversing the Cluster Pipeline",
            icon: TrendingUp,
            color: "text-purple-404 text-[#A78BFA] border-[#A78BFA]/10 shadow-purple-500/5"
          }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`p-4 rounded-xl border bg-white/[0.02] backdrop-blur-md flex items-center gap-4 shadow-sm ${card.color}`}>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <Icon className="w-5 h-5 opacity-90 stroke-[2.3px]" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500 font-extrabold">{card.label}</span>
                <div className="text-xl font-extrabold text-white leading-tight mt-0.5">{card.value}</div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ROW 2: LINE & BAR CHART SPLITS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* resolution trends area chart (lg:col-span-8) */}
        <div className="lg:col-span-8 p-5 rounded-2xl border border-white/10 bg-[#0f1129]/30 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <span className="text-[9px] uppercase tracking-widest font-mono text-purple-400 font-bold block mb-0.5">SLA-BOUND METRIC LOGS</span>
              <h3 className="text-sm font-bold text-white">Ingress vs Resolution trends</h3>
            </div>
          </div>

          <div className="h-[280px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={resolutionTrendsData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="trendsIngested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#A78BFA" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="trendsResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.1} />
                <XAxis 
                  dataKey="day" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontFamily="monospace"
                  tickLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontFamily="monospace"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#0a0b18',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontFamily: 'sans-serif'
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={32}
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: '10.5px',
                    fontFamily: 'monospace',
                    color: '#94a3b8'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Ingested Packets" 
                  stroke="#A78BFA" 
                  fillOpacity={1} 
                  fill="url(#trendsIngested)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="Resolved Packets" 
                  stroke="#06B6D4" 
                  fillOpacity={1} 
                  fill="url(#trendsResolved)" 
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* priority distribution pie chart (lg:col-span-4) */}
        <div className="lg:col-span-4 p-5 rounded-2xl border border-white/10 bg-[#0f1129]/30 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-widest font-mono text-purple-400 font-bold block mb-0.5">SEGMENT METRIC DISTRIBUTION</span>
            <h3 className="text-sm font-bold text-white">Queue Threat Levels</h3>
          </div>

          <div className="h-[220px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#0a0b18',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
                <Pie
                  data={priorityDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {priorityDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Absolute central metrics node */}
            <div className="absolute text-center select-none pointer-events-none">
              <span className="text-[9px] uppercase tracking-widest font-mono text-slate-500 font-bold block">Capacity</span>
              <span className="text-2xl font-extrabold text-white">100%</span>
            </div>
          </div>

          {/* Color Indicators Legend layout */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-white/5 pt-3.5">
            {priorityDistributionData.map((entry, index) => (
              <div key={index} className="flex items-center space-x-1.5 justify-start">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-400 capitalize">{entry.name}:</span>
                <span className="text-white font-extrabold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ROW 3: BAR CHART — AVERAGE RESPONSE TIME VS SLA */}
      <div className="p-5 rounded-2xl border border-white/10 bg-[#0f1129]/30 backdrop-blur-md shadow-xl">
        <div className="mb-4">
          <span className="text-[9px] uppercase tracking-widest font-mono text-purple-400 font-bold block mb-0.5">SLA CONFORMANCE AUDIT</span>
          <h3 className="text-sm font-bold text-white">Mean Response Timings vs Target Guidelines</h3>
        </div>

        <div className="h-[230px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={responseTimesData}
              margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
              barGap={5}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.1} />
              <XAxis 
                dataKey="priority" 
                stroke="#94a3b8" 
                fontSize={10} 
                fontFamily="monospace"
                tickLine={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                fontFamily="monospace"
                tickLine={false}
                axisLine={false}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: 10, style: { fill: '#94a3b8', fontFamily: 'monospace', fontSize: 9 } }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#0a0b18',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '11px'
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={30}
                iconSize={8}
                iconType="circle"
                wrapperStyle={{
                  fontSize: '10.5px',
                  fontFamily: 'monospace',
                  color: '#94a3b8'
                }}
              />
              <Bar dataKey="Actual response (hrs)" fill="#06B6D4" radius={[4, 4, 0, 0]}>
                {responseTimesData.map((entry, index) => {
                  const colors = {
                    Critical: '#EF4444',
                    High: '#F59E0B',
                    Medium: '#6366F1',
                    Low: '#06B6D4'
                  };
                  return <Cell key={`cell-${index}`} fill={colors[entry.priority as keyof typeof colors] || '#06B6D4'} />;
                })}
              </Bar>
              <Bar dataKey="SLA Threshold Target (hrs)" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeDasharray="2 2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
