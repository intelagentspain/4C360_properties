import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { type ToastFn } from '@/lib/ui';

interface KPI {
  label: string;
  value: string;
  color: string;
  trend: 'up' | 'down' | 'flat';
  trendValue: string;
  trendGood: boolean;
  tooltip: string;
  detail: string;
}

const kpis: KPI[] = [
  {
    label: 'Critical Incidents',
    value: '3',
    color: 'text-red-400',
    trend: 'down',
    trendValue: '−2 vs yesterday',
    trendGood: true,
    tooltip: 'Open critical severity incidents requiring immediate action',
    detail: 'INC-SI-001, INC-SI-002, INC-SI-003',
  },
  {
    label: 'SLA Alerts',
    value: '5',
    color: 'text-amber-400',
    trend: 'up',
    trendValue: '+3 vs yesterday',
    trendGood: false,
    tooltip: 'Jobs approaching or past their SLA window',
    detail: '2 breached · 3 at risk',
  },
  {
    label: 'Compliance',
    value: '94%',
    color: 'text-emerald-400',
    trend: 'up',
    trendValue: '+1.2% this week',
    trendGood: true,
    tooltip: 'SLA compliance rate across all active work orders',
    detail: 'Target: 95% · 47/50 on track',
  },
  {
    label: 'Active Engineers',
    value: '5',
    color: 'text-[#EEF3FA]',
    trend: 'flat',
    trendValue: 'same as yesterday',
    trendGood: true,
    tooltip: 'Engineers currently on duty across the community',
    detail: '2 available · 2 on job · 1 en route',
  },
];

interface Props {
  onToast?: ToastFn;
}

export function KPIPanel({ onToast }: Props) {
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [hoveredKpi, setHoveredKpi] = useState<string | null>(null);

  const handleClick = (kpi: KPI) => {
    setActiveKpi(activeKpi === kpi.label ? null : kpi.label);
    onToast?.(`${kpi.label}: ${kpi.detail}`, 'info');
  };

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {kpis.map(kpi => {
        const isActive  = activeKpi  === kpi.label;
        const isHovered = hoveredKpi === kpi.label;

        return (
          <div key={kpi.label} className="relative">
            <motion.button
              onClick={() => handleClick(kpi)}
              onMouseEnter={() => setHoveredKpi(kpi.label)}
              onMouseLeave={() => setHoveredKpi(null)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={`w-full text-left bg-[rgba(17,32,64,0.85)] border rounded-lg p-3 backdrop-blur-xl cursor-pointer transition-all duration-150 ${
                isActive
                  ? 'border-[rgba(46,127,255,0.6)] shadow-lg shadow-blue-500/10'
                  : 'border-[rgba(46,127,255,0.22)] hover:border-[rgba(46,127,255,0.45)]'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className={`text-2xl font-bold leading-none ${kpi.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {kpi.value}
                </div>
                <Info size={11} className="text-[#7A94B4] mt-0.5 flex-shrink-0" />
              </div>
              <div className="text-[11px] text-[#7A94B4] mb-1.5">{kpi.label}</div>
              <div className={`flex items-center gap-1 text-[10px] font-medium ${kpi.trendGood ? 'text-emerald-400' : 'text-red-400'}`}>
                {kpi.trend === 'up'   ? <TrendingUp size={10} />   :
                 kpi.trend === 'down' ? <TrendingDown size={10} /> :
                 <Minus size={10} />}
                <span className={kpi.trend === 'flat' ? 'text-[#7A94B4]' : ''}>{kpi.trendValue}</span>
              </div>
            </motion.button>

            <AnimatePresence>
              {isHovered && !isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute bottom-[calc(100%+4px)] left-0 right-0 z-50 bg-[#1A3260] border border-[rgba(46,127,255,0.3)] rounded-lg px-3 py-2 shadow-xl pointer-events-none"
                >
                  <p className="text-[11px] text-[#EEF3FA] leading-snug">{kpi.tooltip}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden mt-1"
                >
                  <div className="bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg px-3 py-2">
                    <p className="text-[10px] text-[#7A94B4]">{kpi.tooltip}</p>
                    <p className="text-[11px] text-[#EEF3FA] font-medium mt-1">{kpi.detail}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
