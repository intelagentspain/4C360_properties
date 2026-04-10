import { motion } from 'framer-motion';
import { Star, TrendingUp, Clock, CheckCircle, Zap, BarChart2 } from 'lucide-react';
import { mockTechPerformance, mockLoggedInTech } from '@/data/mockData';

const p = mockTechPerformance;

function Ring({ value, color, size = 64 }: { value: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(46,127,255,0.12)" strokeWidth="5" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 0.9, delay: 0.2 }}
      />
    </svg>
  );
}

function StatRing({ label, value, color, suffix = '%' }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <Ring value={value} color={color} size={60} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold text-[#EEF3FA]">{value}{suffix}</span>
        </div>
      </div>
      <span className="text-[9px] text-[#7A94B4] text-center leading-tight">{label}</span>
    </div>
  );
}

function Bar({ value, color, max = 100 }: { value: number; color: string; max?: number }) {
  return (
    <div className="h-1.5 bg-[#0A1628] rounded-full overflow-hidden flex-1">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

export function TechPerformance() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-3 space-y-3">
      <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.22)] rounded-xl p-3 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] flex items-center justify-center text-white text-base font-bold flex-shrink-0">
          {mockLoggedInTech.avatar}
        </div>
        <div className="flex-1">
          <div className="text-[#EEF3FA] font-bold text-sm">{p.name}</div>
          <div className="text-[10px] text-[#7A94B4]">{p.role}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-[11px] text-amber-400 font-bold">{p.rating}</span>
            <span className="text-[10px] text-[#7A94B4] ml-1">· {p.jobsCompleted} total jobs</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[20px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{p.jobsThisMonth}</div>
          <div className="text-[9px] text-[#7A94B4]">jobs this month</div>
        </div>
      </div>

      <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.22)] rounded-xl p-3">
        <div className="text-[10px] font-semibold text-[#7A94B4] uppercase tracking-wide mb-3">Performance Rings</div>
        <div className="flex items-center justify-around">
          <StatRing label="SLA Success" value={p.slaSuccessRate} color="#38D98A" />
          <StatRing label="Efficiency" value={p.efficiency} color="#2E7FFF" />
          <StatRing label="Rating" value={Math.round(p.rating * 20)} color="#FF9B38" />
        </div>
      </div>

      <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.22)] rounded-xl p-3 space-y-2.5">
        <div className="text-[10px] font-semibold text-[#7A94B4] uppercase tracking-wide mb-1">Key Metrics</div>
        {[
          { icon: <Clock size={11} />, label: 'Avg Response Time', value: p.avgResponseTime, unit: 'min', max: 30, color: '#2E7FFF' },
          { icon: <Zap size={11} />, label: 'Avg Resolution Time', value: p.avgResolutionTime, unit: 'min', max: 120, color: '#00C6FF' },
          { icon: <CheckCircle size={11} />, label: 'SLA Success Rate', value: p.slaSuccessRate, unit: '%', max: 100, color: '#38D98A' },
          { icon: <TrendingUp size={11} />, label: 'Efficiency Score', value: p.efficiency, unit: '%', max: 100, color: '#FF9B38' },
        ].map(m => (
          <div key={m.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#7A94B4]">
                {m.icon}
                <span className="text-[10px]">{m.label}</span>
              </div>
              <span className="text-[11px] font-bold text-[#EEF3FA]">{m.value}{m.unit}</span>
            </div>
            <Bar value={m.value} color={m.color} max={m.max} />
          </div>
        ))}
      </div>

      <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.22)] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-[10px] font-semibold text-[#7A94B4] uppercase tracking-wide">Jobs by Category</div>
          <div className="flex items-center gap-1 text-[10px] text-[#7A94B4]">
            <BarChart2 size={10} /> This Month
          </div>
        </div>
        <div className="space-y-2">
          {p.categories.map(cat => (
            <div key={cat.label} className="flex items-center gap-2">
              <span className="text-[10px] text-[#7A94B4] w-14 flex-shrink-0">{cat.label}</span>
              <div className="flex-1 h-4 bg-[#0A1628] rounded-md overflow-hidden flex items-center">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(cat.count / 15) * 100}%` }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="h-full rounded-md flex items-center justify-end pr-1.5"
                  style={{ background: cat.color + '60', borderRight: `2px solid ${cat.color}` }}
                />
              </div>
              <span className="text-[11px] font-bold text-[#EEF3FA] w-4 text-right">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.22)] rounded-xl p-3">
        <div className="text-[10px] font-semibold text-[#7A94B4] uppercase tracking-wide mb-2.5">Recent Jobs</div>
        <div className="space-y-2">
          {p.recentJobs.map(job => (
            <div key={job.id} className="flex items-center gap-2.5 py-1.5 border-b border-[rgba(46,127,255,0.08)] last:border-0">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${job.status === 'closed' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-[#EEF3FA] font-medium truncate">{job.title}</div>
                <div className="text-[9px] text-[#7A94B4]">{job.id} · {job.date}</div>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${job.sla === 'Met' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {job.sla}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
