import { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import type { ToastFn } from '@/lib/ui';

interface Props {
  onToast: ToastFn;
}

interface Asset {
  id: string;
  name: string;
  category: string;
  client: string;
  status: 'active' | 'inactive' | 'maintenance';
}

const CATEGORIES = ['HVAC', 'Elevator', 'Generator', 'Plumbing', 'Electrical', 'Fire Safety', 'Cleaning', 'Security'];
const CLIENTS = ['Al Futtaim Group', 'ENOC', 'DEWA', 'Dubai Mall', 'Emaar Properties', 'ADNOC', 'Emirates NBD'];
const STATUSES: Asset['status'][] = ['active', 'inactive', 'maintenance'];

const STATUS_COLORS: Record<Asset['status'], string> = {
  active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  inactive: 'text-[#7A94B4] bg-white/5 border-white/10',
  maintenance: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
};

const MOCK_ASSETS: Asset[] = [
  { id: 'AST-001', name: 'Carrier Chiller Unit A', category: 'HVAC', client: 'Dubai Mall', status: 'active' },
  { id: 'AST-002', name: 'OTIS Elevator — Tower B', category: 'Elevator', client: 'Emaar Properties', status: 'active' },
  { id: 'AST-003', name: 'Caterpillar Generator 500kVA', category: 'Generator', client: 'DEWA', status: 'maintenance' },
  { id: 'AST-004', name: 'Trane AHU — Floor 12', category: 'HVAC', client: 'Al Futtaim Group', status: 'active' },
  { id: 'AST-005', name: 'Grundfos Pump Station', category: 'Plumbing', client: 'ADNOC', status: 'inactive' },
  { id: 'AST-006', name: 'Siemens Fire Panel', category: 'Fire Safety', client: 'ENOC', status: 'active' },
];

const EMPTY_FORM = { name: '', category: CATEGORIES[0], client: CLIENTS[0], status: 'active' as Asset['status'] };

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0D1E38] border border-[rgba(46,127,255,0.25)] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        {children}
      </div>
    </div>
  );
}

export function AssetsSettings({ onToast }: Props) {
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = assets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase()) ||
    a.client.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.name.trim()) {
      onToast('Asset name is required', 'error');
      return;
    }
    const newAsset: Asset = {
      id: `AST-${String(assets.length + 1).padStart(3, '0')}`,
      name: form.name.trim(),
      category: form.category,
      client: form.client,
      status: form.status,
    };
    setAssets(prev => [newAsset, ...prev]);
    onToast('Asset added successfully', 'success');
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-6 py-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[#EEF3FA] font-bold text-sm mb-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Assets</h3>
            <p className="text-[11px] text-[#7A94B4]">Manage the asset catalogue across all client sites.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-[11px] bg-[#2E7FFF] text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-colors flex-shrink-0"
          >
            <Plus size={12} /> Add Asset
          </button>
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assets…"
            className="w-full pl-8 pr-4 py-2 text-[12px] bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl text-[#EEF3FA] placeholder-[#7A94B4] outline-none focus:border-[rgba(46,127,255,0.5)] transition-colors"
          />
        </div>

        <div className="bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.2)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] min-w-[600px]">
              <thead>
                <tr className="border-b border-[rgba(46,127,255,0.12)]">
                  {['Asset Name', 'Category', 'Client', 'Status'].map(h => (
                    <th key={h} className="text-[9px] text-[#7A94B4] uppercase tracking-wide px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#7A94B4] text-[11px]">No assets found.</td>
                  </tr>
                )}
                {filtered.map(asset => (
                  <tr key={asset.id} className="border-b border-[rgba(46,127,255,0.06)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-[#EEF3FA] font-medium">{asset.name}</div>
                      <div className="text-[9px] text-[#7A94B4] font-mono mt-0.5">{asset.id}</div>
                    </td>
                    <td className="px-4 py-3 text-[#7A94B4]">{asset.category}</td>
                    <td className="px-4 py-3 text-[#7A94B4]">{asset.client}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${STATUS_COLORS[asset.status]}`}>
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <ModalOverlay onClose={() => { setShowModal(false); setForm(EMPTY_FORM); }}>
          <button
            onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
            className="absolute top-4 right-4 text-[#7A94B4] hover:text-[#EEF3FA] transition-colors"
          >
            <X size={16} />
          </button>
          <h4 className="text-[#EEF3FA] font-bold text-sm mb-5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Add Asset</h4>
          <div className="space-y-4">
            <div>
              <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">Asset Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Carrier Chiller Unit C"
                className="w-full px-3 py-2 text-[12px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg text-[#EEF3FA] placeholder-[#7A94B4]/50 outline-none focus:border-[rgba(46,127,255,0.5)] transition-colors"
              />
            </div>
            <div>
              <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 text-[12px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg text-[#EEF3FA] outline-none cursor-pointer focus:border-[rgba(46,127,255,0.5)] transition-colors"
              >
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0A1628]">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">Client</label>
              <select
                value={form.client}
                onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                className="w-full px-3 py-2 text-[12px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg text-[#EEF3FA] outline-none cursor-pointer focus:border-[rgba(46,127,255,0.5)] transition-colors"
              >
                {CLIENTS.map(c => <option key={c} value={c} className="bg-[#0A1628]">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] text-[#7A94B4] uppercase tracking-wide block mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as Asset['status'] }))}
                className="w-full px-3 py-2 text-[12px] bg-[#0A1628] border border-[rgba(46,127,255,0.2)] rounded-lg text-[#EEF3FA] outline-none cursor-pointer focus:border-[rgba(46,127,255,0.5)] transition-colors"
              >
                {STATUSES.map(s => <option key={s} value={s} className="bg-[#0A1628]">{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
              className="flex-1 text-[12px] font-medium text-[#7A94B4] border border-[rgba(46,127,255,0.2)] hover:border-[rgba(46,127,255,0.4)] bg-white/[0.03] hover:bg-white/[0.06] px-4 py-2.5 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 text-[12px] font-bold text-white bg-[#2E7FFF] hover:bg-blue-500 px-4 py-2.5 rounded-xl transition-all"
            >
              Add Asset
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
