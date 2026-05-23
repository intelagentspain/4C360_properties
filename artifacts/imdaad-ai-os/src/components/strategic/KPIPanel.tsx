import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { type ToastFn } from '@/lib/ui';
import { useClients } from '@/context/ClientsContext';
import { useIncidents } from '@/context/IncidentContext';
import {
  commandFilterMatchesIncident,
  getSelectedCommandClient,
  type CommandFilters,
} from '@/lib/commandFilters';

interface KPI {
  label: string;
  demoAnchor: string;
  value: string;
  color: string;
  trend: 'up' | 'down' | 'flat';
  trendValue: string;
  trendGood: boolean;
  tooltip: string;
  detail: string;
}

interface Props {
  onToast?: ToastFn;
  onNavigateToIncident?: (incidentId: string) => void;
  filters?: CommandFilters;
}

export function KPIPanel({ onToast, onNavigateToIncident, filters }: Props) {
  const { incidents } = useIncidents();
  const { clients } = useClients();
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [hoveredKpi, setHoveredKpi] = useState<string | null>(null);

  const filteredIncidents = useMemo(
    () => incidents.filter(incident => commandFilterMatchesIncident(incident, filters, clients)),
    [clients, filters, incidents],
  );
  const selectedClient = getSelectedCommandClient(filters, clients);
  const criticalIncidents = filteredIncidents.filter(i => i.severity === 'critical' && i.status !== 'closed');
  const criticalCount = criticalIncidents.length;
  const openCount = filteredIncidents.filter(i => i.status === 'open' || i.status === 'dispatched').length;
  const qrCount = filteredIncidents.filter(i => i.source === 'QR Scan').length;
  const engineerCount = selectedClient ? selectedClient.people.technicians.length : 5;
  const engineerDetail = selectedClient
    ? `${selectedClient.people.technicians.filter(t => t.status === 'available').length} available · ${selectedClient.people.technicians.filter(t => t.status === 'on-site').length} on site · ${selectedClient.people.technicians.filter(t => t.status === 'transit').length} en route`
    : '2 available · 2 on job · 1 en route';

  const kpis: KPI[] = [
    {
      label: 'Critical Incidents',
      demoAnchor: 'gis-critical-incidents-card',
      value: String(criticalCount),
      color: 'text-red-400',
      trend: 'down',
      trendValue: selectedClient ? `${selectedClient.incidents} total on property` : '-2 vs yesterday',
      trendGood: true,
      tooltip: 'Open critical severity incidents requiring immediate action',
      detail: criticalIncidents.map(i => i.id).join(', ') || 'None',
    },
    {
      label: 'SLA Alerts',
      demoAnchor: 'gis-sla-alerts-card',
      value: String(openCount),
      color: 'text-amber-400',
      trend: openCount > 4 ? 'up' : 'flat',
      trendValue: qrCount > 0 ? `+${qrCount} via QR scan` : selectedClient ? `${selectedClient.overdueTasks} overdue tasks` : '+3 vs yesterday',
      trendGood: false,
      tooltip: 'Jobs approaching or past their SLA window',
      detail: `${filteredIncidents.filter(i => i.status === 'overdue').length} breached · ${openCount} open`,
    },
    {
      label: 'Compliance',
      demoAnchor: 'gis-compliance-card',
      value: selectedClient ? `${selectedClient.sla}%` : '94%',
      color: 'text-emerald-400',
      trend: selectedClient && selectedClient.sla < 90 ? 'down' : 'up',
      trendValue: selectedClient ? `${selectedClient.compliance}% evidence` : '+1.2% this week',
      trendGood: !selectedClient || selectedClient.sla >= 90,
      tooltip: 'SLA compliance rate across all active work orders',
      detail: selectedClient ? `Target: 95% · ${selectedClient.workOrders} active WOs · ${selectedClient.overdueTasks} overdue` : 'Target: 95% · 47/50 on track',
    },
    {
      label: 'Active Engineers',
      demoAnchor: 'gis-active-engineers-card',
      value: String(engineerCount),
      color: 'text-[#EEF3FA]',
      trend: 'flat',
      trendValue: selectedClient ? selectedClient.region : 'same as yesterday',
      trendGood: true,
      tooltip: 'Engineers currently on duty across the community',
      detail: engineerDetail,
    },
  ];

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
              data-demo-anchor={kpi.demoAnchor}
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
                    {kpi.label === 'Critical Incidents' && onNavigateToIncident ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {kpi.detail === 'None' ? (
                          <span className="text-[11px] text-[#EEF3FA] font-medium">None</span>
                        ) : (
                          kpi.detail.split(', ').map(id => id.trim()).filter(Boolean).map(id => (
                            <button
                              key={id}
                              onClick={e => { e.stopPropagation(); onNavigateToIncident(id); }}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 hover:text-blue-100 hover:border-blue-400/60 transition-all duration-100 underline-offset-2 hover:underline cursor-pointer"
                            >
                              {id}
                            </button>
                          ))
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#EEF3FA] font-medium mt-1">{kpi.detail}</p>
                    )}
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
