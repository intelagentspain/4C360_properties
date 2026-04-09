import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Star } from 'lucide-react';
import { TrackingMap } from './TrackingMap';

export function ServiceTimeline() {
  const [rating, setRating] = useState(4);
  const [ratingDone, setRatingDone] = useState(false);

  const handleRate = (r: number) => {
    setRating(r);
    setRatingDone(true);
    setTimeout(() => setRatingDone(false), 2500);
  };

  const steps = [
    {
      done: true,
      label: 'Request received',
      sub: 'Today, 10:14 AM · AI classified as: HVAC · High Priority',
    },
    {
      done: true,
      label: 'Technician assigned',
      sub: 'Today, 10:14 AM · Karim R. · HVAC Specialist · 4.8★',
    },
    {
      done: false,
      active: true,
      label: 'Technician en route',
      detail: {
        eta: '18 minutes',
        name: 'Karim R.',
        distance: '0.6km away',
        cert: 'HVAC Certified',
        tools: 'Carrying all required tools',
      },
    },
    { done: false, label: 'Repair in progress', pending: true },
    { done: false, label: 'Completed & confirmed', pending: true },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
      <TrackingMap />

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.done
                  ? 'bg-emerald-500'
                  : (step as any).active
                  ? 'bg-[#2E7FFF] shadow-lg shadow-blue-500/40'
                  : 'bg-[#1A3260]'
              } ${(step as any).active ? 'animate-pulse' : ''}`}>
                {step.done ? (
                  <CheckCircle size={12} className="text-white" />
                ) : (step as any).active ? (
                  <div className="w-2 h-2 rounded-full bg-white" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7A94B4]" />
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-0.5 h-6 mt-1 ${step.done ? 'bg-emerald-500/40' : 'bg-[#1A3260]'}`} />
              )}
            </div>
            <div className="flex-1 pb-1">
              <div className={`text-xs font-semibold ${
                step.done ? 'text-emerald-400' : (step as any).active ? 'text-[#EEF3FA]' : 'text-[#7A94B4]'
              }`}>
                {step.label}
                {(step as any).pending && <span className="ml-2 text-[10px] text-[#7A94B4]">[Pending]</span>}
              </div>
              {step.sub && <div className="text-[10px] text-[#7A94B4] mt-0.5">{step.sub}</div>}
              {(step as any).active && (step as any).detail && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-2.5 bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.3)] rounded-lg"
                >
                  <div className="text-[11px] text-[#EEF3FA] font-semibold">ETA: {(step as any).detail.eta}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] flex items-center justify-center text-white text-[9px] font-bold">KR</div>
                    <div className="text-[11px] text-[#7A94B4]">
                      <span className="text-[#EEF3FA]">{(step as any).detail.name}</span> · {(step as any).detail.distance}
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1">{(step as any).detail.cert} ✓</div>
                  <div className="text-[10px] text-[#7A94B4]">{(step as any).detail.tools}</div>
                </motion.div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[rgba(46,127,255,0.22)] bg-[rgba(17,32,64,0.85)] p-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] flex items-center justify-center text-white text-xs font-bold">KR</div>
          <div>
            <div className="text-[#EEF3FA] text-sm font-semibold">Karim R.</div>
            <div className="text-[11px] text-[#7A94B4]">HVAC Specialist</div>
            <div className="text-[11px] text-amber-400">⭐ 4.8 (142 completed jobs)</div>
          </div>
        </div>
        <div className="text-[10px] text-[#7A94B4]">Currently: En route to Villa 23</div>
      </div>

      <div className="rounded-xl border border-[rgba(46,127,255,0.22)] bg-[rgba(17,32,64,0.85)] p-3">
        <div className="text-[11px] text-[#EEF3FA] font-semibold mb-2">Rate your last completed service · REQ-SI-2237</div>
        <div className="flex items-center gap-1 mb-1">
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => handleRate(s)} className="transition-transform hover:scale-125 active:scale-95">
              <Star size={22} className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-[#7A94B4]'} />
            </button>
          ))}
        </div>
        {ratingDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11px] text-emerald-400 mt-1">
            Thanks! Rating saved for REQ-SI-2237
          </motion.div>
        )}
      </div>
    </div>
  );
}
