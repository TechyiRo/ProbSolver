import { Ticket } from '../types';
import { ShieldAlert, Clock, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardMetricsProps {
  tickets: Ticket[];
}

export default function DashboardMetrics({ tickets }: DashboardMetricsProps) {
  // Compute analytics from the active list
  const activeTickets = tickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed');
  const solvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;
  
  const criticalCount = activeTickets.filter((t) => t.priority === 'critical').length;
  const highCount = activeTickets.filter((t) => t.priority === 'high').length;

  const totalCount = tickets.length;
  const healthRate = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 100;

  // Let's create beautiful metric units
  const metricCards = [
    {
      id: 'active',
      title: 'Active Backlog',
      value: activeTickets.length,
      subtext: 'Pending triage',
      icon: Clock,
      color: 'cyan',
      glowClass: 'shadow-cyan-400/10 border-cyan-500/20 text-cyan-400',
      badge: 'Live',
      badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    },
    {
      id: 'escalations',
      title: 'Action Required',
      value: criticalCount + highCount,
      subtext: `${criticalCount} critical / ${highCount} high`,
      icon: ShieldAlert,
      color: 'rose',
      glowClass: 'shadow-rose-400/10 border-rose-500/20 text-rose-400',
      badge: `${criticalCount} Critical`,
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
    },
    {
      id: 'resolution-rate',
      title: 'SLA Compliance',
      value: `${healthRate}%`,
      subtext: 'Target constraint >95%',
      icon: CheckCircle2,
      color: 'purple',
      glowClass: 'shadow-purple-400/10 border-purple-500/20 text-purple-400',
      badge: '+2.4%',
      badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="dashboard-metrics-grid">
      {metricCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={`relative overflow-hidden p-5 rounded-2xl border bg-[#0f1129]/30 backdrop-blur-md shadow-lg transition-all duration-300 hover:border-white/20 hover:shadow-2xl ${card.glowClass}`}
          >
            {/* Soft internal background circular lights */}
            <div className={`absolute -right-10 -bottom-10 h-28 w-28 rounded-full blur-2xl opacity-10 ${
              card.color === 'cyan' ? 'bg-cyan-400' : card.color === 'rose' ? 'bg-rose-400' : 'bg-purple-400'
            }`} />

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full border ${card.badgeClass}`}>
                {card.badge}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-3xl font-extrabold tracking-tight text-white mb-1">
                  {card.value}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {card.subtext}
                </span>
              </div>

              {/* Glowing Icon plate */}
              <div className={`p-2.5 rounded-xl border bg-white/[0.02] backdrop-blur-sm shadow-inner`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            {/* Micro aesthetic bar indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden bg-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, delay: 0.5 }}
                className={`h-full bg-gradient-to-r ${
                  card.color === 'cyan' ? 'from-cyan-500 to-blue-500' :
                  card.color === 'rose' ? 'from-rose-500 to-purple-500' :
                  'from-purple-500 to-cyan-500'
                }`}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
