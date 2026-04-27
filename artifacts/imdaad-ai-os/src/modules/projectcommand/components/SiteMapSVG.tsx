import { useState } from 'react';
import { motion } from 'framer-motion';
import { setProjectCommandState } from '../state/projectCommandStore';

const layers = ['Progress', 'Tasks', 'Defects'] as const;

export function SiteMapSVG() {
  const [layer, setLayer] = useState<(typeof layers)[number]>('Progress');

  const setZone = (zone: string) => {
    setProjectCommandState({ selectedZone: zone });
  };

  return (
    <div>
      <div className="mb-3 flex rounded-lg border border-[#1C3050] bg-[#07101C] p-1">
        {layers.map(item => (
          <button
            key={item}
            onClick={() => setLayer(item)}
            className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-bold transition-colors ${layer === item ? 'bg-[#7C3AED]/20 text-[#C4B5FD]' : 'text-[#5A6E88] hover:text-[#F0F4FF]'}`}
          >
            {item}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 320 230" className="h-[230px] w-full rounded-xl border border-[#1C3050] bg-[#07101C]">
        <defs>
          <filter id="pcGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect x="18" y="28" width="120" height="166" rx="10" fill="#00B894" opacity="0.18" stroke="#00B894" onClick={() => setZone('tower-a')} />
        <motion.rect x="18" y="28" width="120" height="166" rx="10" fill="#00B894" opacity="0.18" animate={{ opacity: [0.18, 0.34, 0.18] }} transition={{ duration: 2.8, repeat: Infinity }} />
        <rect x="154" y="42" width="92" height="144" rx="10" fill="#C8A020" opacity="0.16" stroke="#C8A020" onClick={() => setZone('tower-b')} />
        <polygon points="42,190 260,190 292,218 20,218" fill="#7C3AED" opacity="0.18" stroke="#7C3AED" onClick={() => setZone('podium')} />
        <rect x="78" y="150" width="188" height="38" rx="8" fill="#D92B1C" opacity="0.08" stroke="#D92B1C" strokeDasharray="5 4" filter="url(#pcGlow)" onClick={() => setZone('basement')} />
        {(layer === 'Tasks' || layer === 'Defects') && (
          <>
            <circle cx="94" cy="88" r="5" fill={layer === 'Defects' ? '#D92B1C' : '#C8A020'} />
            <circle cx="206" cy="116" r="5" fill={layer === 'Defects' ? '#D92B1C' : '#C8A020'} />
            <circle cx="174" cy="172" r="5" fill={layer === 'Defects' ? '#D92B1C' : '#C8A020'} />
          </>
        )}
        <text x="42" y="56" fill="#F0F4FF" fontSize="12" fontWeight="700">Tower A</text>
        <text x="174" y="70" fill="#F0F4FF" fontSize="12" fontWeight="700">Tower B</text>
        <text x="132" y="210" fill="#F0F4FF" fontSize="11" fontWeight="700">Podium</text>
        <text x="104" y="174" fill="#FCA5A5" fontSize="11" fontWeight="700">Basement at risk</text>
      </svg>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[
          ['A', '43%', '#00B894'],
          ['B', '18%', '#C8A020'],
          ['Podium', '12%', '#7C3AED'],
          ['B1-B3', 'Risk', '#D92B1C'],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-lg border border-[#1C3050] bg-[#0E1E35] p-2">
            <div className="text-[9px] font-bold uppercase text-[#5A6E88]">{label}</div>
            <div className="mt-1 text-[13px] font-black" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
