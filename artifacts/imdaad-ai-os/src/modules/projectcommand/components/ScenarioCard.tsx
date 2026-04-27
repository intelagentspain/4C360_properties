import { motion } from 'framer-motion';
import type { ScenarioKey } from '../data/ai-responses';

export type Scenario = {
  label: string;
  probability: number;
  completionDate: string;
  finalCost: number;
  assumptions: string[];
  programmeSlip: number;
};

const scenarioColors: Record<ScenarioKey, string> = {
  optimistic: '#00B894',
  base: '#C8A020',
  pessimistic: '#D92B1C',
};

function formatMoney(value: number) {
  return `AED ${Math.round(value / 1_000_000)}M`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function ScenarioCard({
  scenarioKey,
  scenario,
  isActive,
  onClick,
  size = 'small',
}: {
  scenarioKey: ScenarioKey;
  scenario: Scenario;
  isActive?: boolean;
  onClick?: () => void;
  size?: 'small' | 'large';
}) {
  const color = scenarioColors[scenarioKey];
  const large = size === 'large';
  const radius = 28;
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      className={`w-full rounded-xl border text-left transition-colors ${large ? 'p-5' : 'p-3'} ${isActive ? 'bg-white/[0.045]' : 'bg-[#0E1E35] hover:bg-[#122240]'}`}
      style={{ borderColor: isActive ? color : '#1C3050', boxShadow: isActive ? `0 0 28px ${color}24` : undefined }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color }}>{scenario.label}</div>
          <div className={`${large ? 'mt-4 text-[30px]' : 'mt-2 text-[18px]'} font-black text-[#F0F4FF]`} style={{ fontFamily: 'Syne, sans-serif' }}>
            {formatDate(scenario.completionDate)}
          </div>
          <div className={`${large ? 'text-lg' : 'text-sm'} mt-1 font-bold text-[#BCC8DC]`}>{formatMoney(scenario.finalCost)}</div>
        </div>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="#243448" strokeWidth="6" />
          <circle cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(scenario.probability / 100) * circumference} ${circumference}`} transform="rotate(-90 36 36)" />
          <text x="36" y="40" fill="#F0F4FF" textAnchor="middle" fontSize="14" fontWeight="800">{scenario.probability}%</text>
        </svg>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#243448]">
        <motion.div initial={{ width: 0 }} animate={{ width: `${scenario.probability}%` }} className="h-full rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div className="mt-2 text-[11px] font-bold text-[#5A6E88]">Programme slip: <span style={{ color }}>{scenario.programmeSlip === 0 ? '0 days' : `+${scenario.programmeSlip} days`}</span></div>
      {large && (
        <ul className="mt-4 space-y-2">
          {scenario.assumptions.map(item => (
            <li key={item} className="flex gap-2 text-[12px] leading-5 text-[#BCC8DC]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </motion.button>
  );
}
