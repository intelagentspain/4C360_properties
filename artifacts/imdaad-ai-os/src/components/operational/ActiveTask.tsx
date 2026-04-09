import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertTriangle, Camera, CheckCircle, X } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';

interface Props {
  onScan: () => void;
}

export function ActiveTask({ onScan }: Props) {
  const { minutes, secs, expired, critical, warning } = useCountdown(39);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [jobStarted, setJobStarted] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 1500);
  };

  const slaColor = expired ? 'text-red-400' : critical ? 'text-red-400' : warning ? 'text-amber-400' : 'text-amber-400';
  const slaLabel = expired
    ? 'OVERDUE'
    : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')} remaining`;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-3 space-y-3">
      <motion.div
        animate={critical && !expired ? { x: [0, -2, 2, -2, 2, 0] } : {}}
        transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.3 }}
        className={`rounded-xl border p-3 backdrop-blur-xl ${expired ? 'border-red-500/60 bg-red-500/10' : 'bg-[rgba(17,32,64,0.85)] border-[rgba(46,127,255,0.22)]'}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[10px] text-[#7A94B4] font-mono mb-0.5">Task #SI-2241</div>
            <div className="text-[#EEF3FA] font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              HVAC — Corrective Maintenance
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold">
            HIGH PRIORITY
          </span>
        </div>

        <div className="border-t border-[rgba(46,127,255,0.12)] pt-3 space-y-1.5">
          <Row label="Asset" value="Chiller Unit C-04" />
          <Row label="Location" value="Villa 23, Cluster A, Silicon Oasis" icon={<MapPin size={10} />} />
          <Row label="Type" value="HVAC — Corrective Maintenance" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#7A94B4]">SLA</span>
            <div className="flex items-center gap-1">
              {(critical || expired) && <AlertTriangle size={10} className="text-red-400" />}
              <span className={`text-[11px] font-bold font-mono ${slaColor} ${expired ? 'animate-pulse' : ''}`}>
                {expired ? '⚠ OVERDUE' : `⏱ ${slaLabel}`}
              </span>
            </div>
          </div>
          <Row label="Reported by" value="AI Capture (photo → auto-classified)" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#7A94B4]">Parts status</span>
            <span className="text-[11px] text-amber-400 flex items-center gap-1">
              <AlertTriangle size={10} /> R-410A — Low Stock
            </span>
          </div>
        </div>
      </motion.div>

      <div className="rounded-xl border border-[rgba(46,127,255,0.22)] bg-[rgba(17,32,64,0.85)] p-4">
        <div className="text-[11px] text-[#7A94B4] text-center mb-3 font-mono uppercase tracking-widest">
          ─── Scan Asset to Begin ───
        </div>

        {!scanned ? (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleScan}
              disabled={scanning}
              className="relative w-20 h-20 rounded-full bg-[#2E7FFF] flex items-center justify-center shadow-xl shadow-blue-500/40 transition-all duration-150 active:scale-95 hover:bg-blue-500"
              style={{ animation: scanning ? 'none' : 'scanPulse 2s ease-in-out infinite' }}
            >
              {scanning ? (
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera size={32} className="text-white" />
              )}
              {!scanning && (
                <>
                  <span className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping" style={{ animationDuration: '2s' }} />
                  <span className="absolute inset-0 rounded-full bg-blue-400/15 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                </>
              )}
            </button>
            <div className="text-center">
              <div className="text-[#EEF3FA] text-xs font-semibold">{scanning ? 'Scanning asset...' : 'SMART SCAN'}</div>
              <div className="text-[10px] text-[#7A94B4] mt-0.5 text-center">
                {scanning ? 'Please wait...' : 'Tap to scan the asset QR tag and load AI diagnostics'}
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle size={16} /> Asset Identified
            </div>
            <div className="border-t border-[rgba(46,127,255,0.12)] pt-2 space-y-1 text-[11px]">
              <Row label="Asset" value="Chiller Unit C-04" />
              <Row label="Serial" value="IMD-2201-CH04" />
              <Row label="Zone" value="Villa 23, Cluster A" />
            </div>
            <div className="bg-[#0A1628] rounded-lg p-2.5 mt-2">
              <div className="text-[11px] font-semibold text-[#EEF3FA] mb-2">AI Diagnostics:</div>
              <div className="space-y-1">
                <div className="flex items-start gap-1.5 text-[11px] text-amber-400">
                  <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
                  Refrigerant pressure: 180 PSI (low — should be 250+)
                </div>
                <div className="flex items-start gap-1.5 text-[11px] text-amber-400">
                  <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
                  Condenser coil: 34% blocked (clean required)
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[rgba(46,127,255,0.12)]">
                <div className="text-[11px] font-semibold text-[#EEF3FA] mb-1">Recommended Action:</div>
                <div className="text-[11px] text-[#7A94B4] space-y-0.5">
                  <div>→ Top up R-410A refrigerant</div>
                  <div>→ Clean condenser coils before restart</div>
                </div>
              </div>
            </div>
            {!jobStarted ? (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setJobStarted(true)}
                  className="flex-1 py-2 bg-[#2E7FFF] text-white text-xs font-semibold rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-1"
                >
                  <CheckCircle size={13} /> Begin Job
                </button>
                <button className="flex-1 py-2 border border-[rgba(46,127,255,0.3)] text-[#7A94B4] text-xs rounded-lg hover:bg-white/5 transition-colors">
                  Report Different Issue
                </button>
              </div>
            ) : (
              <div className="py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-center text-emerald-400 text-xs font-semibold">
                Job in Progress
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[#7A94B4]">{label}</span>
      <span className="text-[11px] text-[#EEF3FA] flex items-center gap-1 text-right max-w-[55%]">{icon}{value}</span>
    </div>
  );
}
