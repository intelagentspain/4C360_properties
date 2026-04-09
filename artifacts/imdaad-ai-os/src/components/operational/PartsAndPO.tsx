import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShoppingCart, CheckCircle, Package } from 'lucide-react';
import { mockParts } from '@/data/mockData';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const statusConfig: Record<string, { color: string; icon: string }> = {
  out: { color: 'text-red-400', icon: '🔴' },
  low: { color: 'text-amber-400', icon: '🟡' },
  ok: { color: 'text-emerald-400', icon: '🟢' },
};

type POStatus = 'idle' | 'submitted';
const poSteps = ['Submitted', 'Pending Approval', 'Approved', 'Dispatched', 'Delivered'];

export function PartsAndPO({ onToast }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [poStatus, setPOStatus] = useState<POStatus>('idle');
  const [activeStep, setActiveStep] = useState(0);

  const handlePO = () => {
    setPOStatus('submitted');
    setActiveStep(0);
    setShowConfirm(false);
    onToast('PO-2024-1891 raised · Firas K. notified for approval · Delivery ETA 2 hrs', 'success');
    setTimeout(() => setActiveStep(1), 4000);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-3 space-y-3">
      <div className="text-[12px] text-[#7A94B4] font-mono">Parts & Purchase Orders</div>

      {poStatus === 'idle' && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">Parts Shortage Detected by AI</span>
          </div>
          <div className="border-t border-amber-500/20 pt-2 space-y-1.5">
            <Row label="Part" value="R-410A Refrigerant 10kg" />
            <Row label="Vendor" value="Emirates HVAC Supply LLC" />
            <Row label="Estimated cost" value="AED 380" />
            <Row label="Delivery ETA" value="2 hours (same day to site)" />
            <Row label="Triggered by" value="AI diagnostic from Smart Scan" />
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="mt-3 w-full py-2.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            <ShoppingCart size={14} /> Raise Purchase Order
          </button>
        </div>
      )}

      {poStatus === 'submitted' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">PO-2024-1891 Submitted</span>
          </div>
          <button disabled className="w-full py-2 bg-[#1A3260] text-[#7A94B4] text-xs rounded-lg mb-3">
            ✅ PO Submitted — Awaiting Approval
          </button>
          <div className="space-y-2">
            {poSteps.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  i <= activeStep ? 'bg-emerald-500' : 'bg-[#1A3260]'
                }`}>
                  {i <= activeStep ? (
                    <CheckCircle size={12} className="text-white" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7A94B4]" />
                  )}
                </div>
                <span className={`text-[11px] ${i <= activeStep ? 'text-emerald-400' : 'text-[#7A94B4]'}`}>{step}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="rounded-xl border border-[rgba(46,127,255,0.22)] bg-[rgba(17,32,64,0.85)] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[rgba(46,127,255,0.15)]">
          <Package size={13} className="text-[#7A94B4]" />
          <span className="text-[11px] font-semibold text-[#EEF3FA]">Parts Inventory</span>
        </div>
        <div className="divide-y divide-[rgba(46,127,255,0.08)]">
          {mockParts.map(part => {
            const s = statusConfig[part.status];
            return (
              <div key={part.name} className="flex items-center px-3 py-2.5 gap-2">
                <span className="text-[10px]">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-[#EEF3FA] truncate">{part.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#7A94B4]">{part.inStock} units</span>
                  <span className={`text-[10px] font-bold ${s.color}`}>
                    {part.status === 'out' ? 'Out of stock' : part.status === 'low' ? 'Low stock' : 'Available'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Confirm Purchase Order?"
        onConfirm={handlePO}
        onCancel={() => setShowConfirm(false)}
        confirmLabel="Confirm & Send"
      >
        <div className="space-y-1.5">
          <Row label="Part" value="R-410A Refrigerant 10kg" />
          <Row label="Vendor" value="Emirates HVAC Supply LLC" />
          <Row label="Amount" value="AED 380" />
          <Row label="Approver" value="Firas K. (Supervisor)" />
        </div>
      </ConfirmModal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[#7A94B4]">{label}</span>
      <span className="text-[11px] text-[#EEF3FA] text-right max-w-[55%]">{value}</span>
    </div>
  );
}
