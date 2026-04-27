import { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useClients } from '@/context/ClientsContext';
import type { ToastFn } from '@/lib/ui';

interface Props {
  onToast: ToastFn;
}

const STATUS_COLORS: Record<string, string> = {
  live: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  onboarding: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  suspended: 'text-red-400 bg-red-400/10 border-red-400/30',
  offboarded: 'text-[#7A94B4] bg-white/5 border-white/10',
};

export function ManageClients({ onToast }: Props) {
  const { clients, removeClient } = useClients();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const clientToDelete = clients.find(c => c.id === confirmId);

  const handleDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await removeClient(confirmId);
      onToast('Property deleted successfully', 'success');
      setConfirmId(null);
    } catch {
      onToast('Failed to delete property - please try again', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-6 py-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="mb-5">
          <h3 className="text-[#EEF3FA] font-bold text-sm mb-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Manage Properties</h3>
          <p className="text-[11px] text-[#7A94B4]">View all properties and permanently remove them from the system.</p>
        </div>

        <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] min-w-[640px]">
              <thead>
                <tr className="border-b border-[rgba(46,127,255,0.12)]">
                  {['Name', 'Sector', 'Region', 'Status', ''].map(h => (
                    <th key={h} className="text-[9px] text-[#7A94B4] uppercase tracking-wide px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#7A94B4] text-[11px]">No properties found.</td>
                  </tr>
                )}
                {clients.map(client => (
                  <tr key={client.id} className="border-b border-[rgba(46,127,255,0.06)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-[#EEF3FA] font-medium">{client.name}</div>
                      <div className="text-[9px] text-[#7A94B4] font-mono mt-0.5">{client.id}</div>
                    </td>
                    <td className="px-4 py-3 text-[#7A94B4]">{client.sector || '—'}</td>
                    <td className="px-4 py-3 text-[#7A94B4]">{client.region || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${STATUS_COLORS[client.status] ?? STATUS_COLORS.offboarded}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setConfirmId(client.id)}
                        className="flex items-center gap-1.5 text-[10px] text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 bg-red-400/5 hover:bg-red-400/10 px-2.5 py-1.5 rounded-lg transition-all ml-auto"
                      >
                        <Trash2 size={11} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {confirmId && clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setConfirmId(null)} />
          <div className="relative bg-[#0D1E38] border border-[rgba(46,127,255,0.25)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <button
              onClick={() => !deleting && setConfirmId(null)}
              disabled={deleting}
              className="absolute top-4 right-4 text-[#7A94B4] hover:text-[#EEF3FA] transition-colors disabled:opacity-40"
            >
              <X size={16} />
            </button>

            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
              <AlertTriangle size={18} className="text-red-400" />
            </div>

            <h4 className="text-[#EEF3FA] font-bold text-sm mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Delete Property
            </h4>
            <p className="text-[#7A94B4] text-[12px] leading-relaxed mb-1">
              Are you sure you want to permanently delete{' '}
              <span className="text-[#EEF3FA] font-semibold">{clientToDelete.name}</span>?
            </p>
            <p className="text-[#7A94B4] text-[11px] leading-relaxed mb-6">
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                disabled={deleting}
                className="flex-1 text-[12px] font-medium text-[#7A94B4] border border-[rgba(46,127,255,0.2)] hover:border-[rgba(46,127,255,0.4)] bg-white/[0.03] hover:bg-white/[0.06] px-4 py-2.5 rounded-xl transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 text-[12px] font-bold text-white bg-red-500 hover:bg-red-400 px-4 py-2.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Property'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
