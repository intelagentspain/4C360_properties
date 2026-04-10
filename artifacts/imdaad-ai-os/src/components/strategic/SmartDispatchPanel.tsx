import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MapPin, Clock, ChevronDown, UserCheck, RotateCcw, CheckCircle, QrCode, MessageSquare } from 'lucide-react';
import { mockSmartDispatch } from '@/data/mockData';
import { SEVERITY_BADGE, AVAIL_COLOR, scoreColor, type ToastFn } from '@/lib/ui';
import { AnimatedBar } from '@/components/shared/AnimatedBar';
import { TechAvatar } from '@/components/shared/TechAvatar';
import { useIncidents } from '@/context/IncidentContext';
import { WhatsAppModal } from '@/components/shared/WhatsAppModal';

const TECH_POOL = [
  { tech: 'Karim R.', techId: 'KR', skill: 'HVAC', distance: '0.4 km', eta: '8 min', skillMatch: 92, availability: 'available' as const, reason: 'HVAC specialist · Available now · QR scan priority' },
  { tech: 'Sara M.', techId: 'SM', skill: 'Electrical', distance: '0.7 km', eta: '12 min', skillMatch: 88, availability: 'available' as const, reason: 'Electrical certified · High rating · GPS tracked' },
  { tech: 'Ahmed K.', techId: 'AK', skill: 'Plumbing', distance: '0.5 km', eta: '8 min', skillMatch: 90, availability: 'available' as const, reason: 'Plumbing specialist · Tools on hand' },
  { tech: 'Faisal N.', techId: 'FN', skill: 'General', distance: '0.6 km', eta: '10 min', skillMatch: 80, availability: 'available' as const, reason: 'General maintenance · Fully available' },
];

function matchTech(category: string) {
  const cat = category.toLowerCase();
  return TECH_POOL.find(t => cat.includes(t.skill.toLowerCase()) || t.skill === 'General') ?? TECH_POOL[3];
}

const TECH_WHATSAPP: Record<string, string> = {
  'Karim R.':  '+971501112233',
  'Sara M.':   '+971502223344',
  'Ahmed K.':  '+971503334455',
  'Faisal N.': '+971504445566',
  'Omar T.':   '+971505556677',
};

interface Props {
  onToast: ToastFn;
}

export function SmartDispatchPanel({ onToast }: Props) {
  const { incidents } = useIncidents();

  const allDispatch = useMemo(() => {
    const qrUnassigned = incidents
      .filter(inc => inc.source === 'QR Scan' && !inc.assignedTech && inc.status !== 'closed')
      .map(inc => {
        const tech = matchTech(inc.aiMetadata?.category ?? 'General');
        return {
          incidentId: inc.id,
          incidentTitle: `${inc.title} — ${inc.location}`,
          severity: inc.severity as 'critical' | 'high' | 'medium' | 'low',
          slaRemaining: inc.slaMinutes,
          isQrScan: true,
          recommendations: [{ ...tech, reason: tech.reason }],
        };
      });
    return [...mockSmartDispatch, ...qrUnassigned];
  }, [incidents]);

  const [activeIncident, setActiveIncident] = useState(mockSmartDispatch[0].incidentId);
  const [assigned, setAssigned] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});
  const [whatsappTarget, setWhatsappTarget] = useState<{ name: string; phone: string; message: string } | null>(null);

  const current = allDispatch.find(d => d.incidentId === activeIncident) ?? allDispatch[0];

  const handleAssign = (incId: string, techName: string) => {
    setAssigned(prev => ({ ...prev, [incId]: techName }));
    onToast(`${techName} assigned to ${incId}`, 'success');
  };

  const handleOverride = (incId: string) => {
    setAssigned(prev => { const n = { ...prev }; delete n[incId]; return n; });
    onToast('Assignment cleared — manual override mode', 'warning');
  };

  return (
    <div className="mb-4">
      {whatsappTarget && (
        <WhatsAppModal
          recipientName={whatsappTarget.name}
          recipientPhone={whatsappTarget.phone}
          defaultMessage={whatsappTarget.message}
          onClose={() => setWhatsappTarget(null)}
          onSent={name => onToast(`WhatsApp sent to ${name}`, 'success')}
          onError={name => onToast(`Failed to send — check number for ${name}`, 'error')}
        />
      )}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[#EEF3FA] text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            AI Smart Dispatch
          </h3>
          <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold border border-cyan-500/30">
            {allDispatch.length}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#7A94B4]">
          <Bot size={10} className="text-cyan-400" /> 4C360 AI
        </div>
      </div>

      <div className="flex gap-1 mb-3 overflow-x-auto pb-0.5 no-scrollbar">
        {allDispatch.map(d => (
          <button
            key={d.incidentId}
            onClick={() => setActiveIncident(d.incidentId)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all duration-150 ${
              activeIncident === d.incidentId
                ? 'bg-[rgba(46,127,255,0.15)] border-[#2E7FFF] text-[#EEF3FA]'
                : 'bg-[rgba(17,32,64,0.6)] border-[rgba(46,127,255,0.2)] text-[#7A94B4] hover:text-[#EEF3FA]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              d.severity === 'critical' ? 'bg-red-400' : d.severity === 'high' ? 'bg-orange-400' : 'bg-amber-400'
            }`} />
            {(d as any).isQrScan && <QrCode size={9} className="text-cyan-400 flex-shrink-0" />}
            {d.incidentId}
            {assigned[d.incidentId] && <CheckCircle size={9} className="text-emerald-400" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeIncident}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.22)] rounded-xl overflow-hidden backdrop-blur-xl"
        >
          <div className="px-3 pt-3 pb-2 border-b border-[rgba(46,127,255,0.12)]">
            <div className="flex items-start gap-2">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize flex-shrink-0 mt-0.5 ${SEVERITY_BADGE[current.severity]}`}>
                {current.severity}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-[#EEF3FA] font-semibold leading-snug">{current.incidentTitle}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock size={9} className="text-amber-400" />
                  <span className="text-[10px] text-amber-400 font-medium">{current.slaRemaining} min SLA remaining</span>
                </div>
              </div>
            </div>
          </div>

          {assigned[activeIncident] ? (
            <div className="p-3">
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-3">
                <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="text-[11px] text-emerald-400 font-semibold">Assigned to {assigned[activeIncident]}</div>
                  <div className="text-[10px] text-[#7A94B4]">Technician notified · GPS tracking started</div>
                </div>
              </div>
              {TECH_WHATSAPP[assigned[activeIncident]] && (
                <button
                  onClick={() => {
                    const techName = assigned[activeIncident];
                    const phone = TECH_WHATSAPP[techName];
                    const dispatchItem = allDispatch.find(d => d.incidentId === activeIncident);
                    setWhatsappTarget({
                      name: techName,
                      phone,
                      message: `Hi ${techName}, you have been assigned to incident ${activeIncident}.\n\n${dispatchItem?.incidentTitle ?? ''}\n\nPlease confirm dispatch and provide your ETA. GPS tracking is now active.`,
                    });
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 mb-2 bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold rounded-lg hover:bg-emerald-600/20 transition-colors"
                >
                  <MessageSquare size={11} /> Send WhatsApp to {assigned[activeIncident]}
                </button>
              )}
              <button
                onClick={() => handleOverride(activeIncident)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-[rgba(46,127,255,0.3)] text-[#7A94B4] text-[11px] rounded-lg hover:bg-white/5 transition-colors"
              >
                <RotateCcw size={11} /> Override Assignment
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[rgba(46,127,255,0.08)]">
              {current.recommendations
                .slice(0, showAll[activeIncident] ? undefined : 1)
                .map((rec, idx) => (
                  <div key={rec.techId} className={`p-3 ${idx > 0 ? 'opacity-70' : ''}`}>
                    {idx === 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <Bot size={9} className="text-cyan-400" />
                        <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">AI Top Match</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5 mb-2.5">
                      <TechAvatar initials={rec.techId} size={8} />
                      <div className="flex-1">
                        <div className="text-[12px] text-[#EEF3FA] font-semibold">{rec.tech}</div>
                        <div className={`text-[10px] font-medium capitalize ${AVAIL_COLOR[rec.availability]}`}>
                          {rec.availability.replace('-', ' ')}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[11px] font-bold" style={{ color: scoreColor(rec.skillMatch) }}>{rec.skillMatch}%</div>
                        <div className="text-[9px] text-[#7A94B4]">match</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                      <div className="flex items-center gap-1.5 bg-[#0A1628] rounded-lg px-2 py-1.5">
                        <MapPin size={10} className="text-[#2E7FFF]" />
                        <span className="text-[10px] text-[#EEF3FA]">{rec.distance}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#0A1628] rounded-lg px-2 py-1.5">
                        <Clock size={10} className="text-[#2E7FFF]" />
                        <span className="text-[10px] text-[#EEF3FA]">ETA {rec.eta}</span>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-[#7A94B4]">Skill Match</span>
                        <span className="text-[9px] font-bold" style={{ color: scoreColor(rec.skillMatch) }}>{rec.skillMatch}%</span>
                      </div>
                      <AnimatedBar value={rec.skillMatch} color={scoreColor(rec.skillMatch)} />
                    </div>

                    <div className="text-[10px] text-[#7A94B4] mb-2.5 leading-snug">{rec.reason}</div>

                    {idx === 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAssign(activeIncident, rec.tech)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#2E7FFF] text-white text-[11px] font-semibold rounded-lg hover:bg-blue-500 transition-colors"
                        >
                          <UserCheck size={11} /> Assign
                        </button>
                        <button
                          onClick={() => onToast('Manual override — select technician from map', 'info')}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-[rgba(46,127,255,0.3)] text-[#7A94B4] text-[11px] rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <RotateCcw size={11} /> Override
                        </button>
                      </div>
                    )}
                  </div>
                ))}

              {current.recommendations.length > 1 && (
                <button
                  onClick={() => setShowAll(prev => ({ ...prev, [activeIncident]: !prev[activeIncident] }))}
                  className="w-full flex items-center justify-center gap-1 py-2 text-[10px] text-[#7A94B4] hover:text-[#EEF3FA] transition-colors"
                >
                  <ChevronDown size={11} className={`transition-transform ${showAll[activeIncident] ? 'rotate-180' : ''}`} />
                  {showAll[activeIncident]
                    ? 'Show less'
                    : `${current.recommendations.length - 1} more option${current.recommendations.length > 2 ? 's' : ''}`}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
