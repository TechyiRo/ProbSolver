import { useState, useRef, MouseEvent as ReactMouseEvent } from 'react';
import { motion } from 'motion/react';
import { ResolutionDataPoint } from '../types';

interface ResolutionGraphProps {
  data: ResolutionDataPoint[];
}

export default function ResolutionGraph({ data }: ResolutionGraphProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // SVG ViewBox constants
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Find max ticket value to scale appropriately (default max 100)
  const maxVal = Math.max(...data.flatMap(d => [d.received, d.resolved]), 100);

  // Generate X and Y coordinates
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
    // Map Y: higher value maps to lower SVG Y coordinate
    const yReceived = svgHeight - paddingBottom - (d.received / maxVal) * chartHeight;
    const yResolved = svgHeight - paddingBottom - (d.resolved / maxVal) * chartHeight;
    return { x, yReceived, yResolved, name: d.day, raw: d };
  });

  // Create Bezier Curve paths
  const getBezierPath = (type: 'received' | 'resolved') => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${type === 'received' ? points[0].yReceived : points[0].yResolved}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const currY = type === 'received' ? curr.yReceived : curr.yResolved;
      const nextY = type === 'received' ? next.yReceived : next.yResolved;
      
      // Control points for smooth bezier wave
      const cp1x = curr.x + chartWidth / (data.length - 1) / 3;
      const cp1y = currY;
      const cp2x = next.x - chartWidth / (data.length - 1) / 3;
      const cp2y = nextY;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${nextY}`;
    }
    return path;
  };

  const receivedPath = getBezierPath('received');
  const resolvedPath = getBezierPath('resolved');

  // Create Area Fill paths (close the polygon below coordinate)
  const receivedAreaPath = `
    ${receivedPath} 
    L ${points[points.length - 1].x} ${svgHeight - paddingBottom} 
    L ${points[0].x} ${svgHeight - paddingBottom} Z
  `;

  const resolvedAreaPath = `
    ${resolvedPath} 
    L ${points[points.length - 1].x} ${svgHeight - paddingBottom} 
    L ${points[0].x} ${svgHeight - paddingBottom} Z
  `;

  // Handle graph mouse interaction
  const handleMouseMove = (e: ReactMouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Convert to relative coordinate on SVG
    const svgRelativeX = (mouseX / rect.width) * svgWidth;

    // Find closest data point index
    let closestIdx = 0;
    let minDiff = Infinity;
    
    points.forEach((pt, idx) => {
      const diff = Math.abs(pt.x - svgRelativeX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  return (
    <div 
      ref={containerRef}
      className="relative flex flex-col p-5 h-full rounded-2xl border border-white/10 bg-[#0f1129]/30 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-white/20"
      id="resolution-chart-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-mono text-cyan-400 font-semibold">Weekly Capacity</span>
          <h3 className="text-sm font-semibold text-white">Resolution Handshake Trend</h3>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <span className="text-slate-400">Received</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="text-slate-400">Resolved</span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 min-h-[160px] cursor-crosshair">
        <svg 
          className="w-full h-full"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          id="resolution-svg-canvas"
        >
          <defs>
            {/* Area gradients */}
            <linearGradient id="areaReceived" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="areaResolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>

            {/* Neon line glow filter */}
            <filter id="neonGlowResolved" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="neonGlowReceived" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const h = paddingBottom + ratio * chartHeight;
            const y = svgHeight - h;
            const val = Math.round(ratio * maxVal);
            return (
              <g key={index} opacity="0.15">
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={svgWidth - paddingRight} 
                  y2={y} 
                  stroke="#94a3b8" 
                  strokeDasharray="4 4" 
                  strokeWidth="0.8"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 3} 
                  fill="#94a3b8" 
                  fontSize="9" 
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Render Area under curve first (z-index lower) */}
          <path d={receivedAreaPath} fill="url(#areaReceived)" />
          <path d={resolvedAreaPath} fill="url(#areaResolved)" />

          {/* Glow backdrop paths */}
          <path 
            d={receivedPath} 
            fill="none" 
            stroke="#a855f7" 
            strokeWidth="3" 
            filter="url(#neonGlowReceived)"
            className="opacity-40"
          />
          <path 
            d={resolvedPath} 
            fill="none" 
            stroke="#22d3ee" 
            strokeWidth="3.5" 
            filter="url(#neonGlowResolved)"
            className="opacity-40"
          />

          {/* Sharp Foreground curve lines */}
          <path 
            d={receivedPath} 
            fill="none" 
            stroke="#a55df6" 
            strokeWidth="2" 
          />
          <path 
            d={resolvedPath} 
            fill="none" 
            stroke="#22d3ee" 
            strokeWidth="2.5" 
          />

          {/* Interactive vertical scrubber line */}
          {hoverIndex !== null && (
            <line 
              x1={points[hoverIndex].x} 
              y1={paddingTop} 
              x2={points[hoverIndex].x} 
              y2={svgHeight - paddingBottom} 
              stroke="#06b6d4" 
              strokeWidth="1.5" 
              strokeDasharray="2 2"
              className="opacity-60"
            />
          )}

          {/* Nodes along the paths */}
          {points.map((pt, idx) => {
            const isHovered = hoverIndex === idx;
            return (
              <g key={idx}>
                {/* Received dot */}
                <circle 
                  cx={pt.x} 
                  cy={pt.yReceived} 
                  r={isHovered ? 5 : 3} 
                  fill="#a855f7" 
                  stroke="#ffffff" 
                  strokeWidth={isHovered ? 1.5 : 0.8}
                  className="transition-all duration-250 cursor-pointer"
                  style={{ transformOrigin: `${pt.x}px ${pt.yReceived}px` }}
                />
                
                {/* Resolved dot */}
                <circle 
                  cx={pt.x} 
                  cy={pt.yResolved} 
                  r={isHovered ? 6 : 3.5} 
                  fill="#22d3ee" 
                  stroke="#ffffff" 
                  strokeWidth={isHovered ? 1.8 : 0.8}
                  className="transition-all duration-250 cursor-pointer"
                  style={{ transformOrigin: `${pt.x}px ${pt.yResolved}px` }}
                />

                {/* X Axis Labels */}
                <text 
                  x={pt.x} 
                  y={svgHeight - paddingBottom + 18} 
                  fill={isHovered ? '#22d3ee' : '#94a3b8'} 
                  fontSize="11" 
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="transition-colors duration-200"
                >
                  {pt.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating details box (hover card info) */}
        {hoverIndex !== null && (
          <div 
            className="absolute z-20 p-3 rounded-lg border border-white/10 bg-[#07091e]/80 backdrop-blur-md shadow-xl pointer-events-none text-xs"
            style={{
              left: `${Math.min(
                Math.max(15, (points[hoverIndex].x / svgWidth) * 100 - 15),
                80
              )}%`,
              top: '10%'
            }}
          >
            <div className="font-semibold text-white border-b border-white/10 pb-1 mb-1.5 flex items-center justify-between">
              <span>{points[hoverIndex].raw.day} stats</span>
              <span className="text-[10px] text-slate-400 font-mono">100% capacity</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-300 font-mono">
              <span className="text-purple-400">Incoming:</span>
              <span className="text-white text-right font-semibold">{points[hoverIndex].raw.received} tickets</span>
              <span className="text-cyan-400">Resolved:</span>
              <span className="text-white text-right font-semibold">{points[hoverIndex].raw.resolved} tickets</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
