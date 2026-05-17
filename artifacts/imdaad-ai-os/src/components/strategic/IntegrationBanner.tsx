import { Link2 } from 'lucide-react';
import { useClients } from '@/context/ClientsContext';
import {
  COMMAND_FILTER_ALL_VALUES,
  getSelectedCommandClient,
  hasActiveCommandFilters,
  isCommandFilterActive,
  type CommandFilters,
} from '@/lib/commandFilters';

interface Props {
  filters?: CommandFilters;
}

const DEFAULT_CONNECTIONS = [
  { label: 'Maximo', context: 'Gate Avenue' },
  { label: 'Oracle', context: '12 other sites' },
  { label: 'Power BI', context: '' },
];

export function IntegrationBanner({ filters }: Props) {
  const { clients } = useClients();
  const selectedClient = getSelectedCommandClient(filters, clients);
  const hasFilter = hasActiveCommandFilters(filters);
  const scopedConnections = selectedClient && selectedClient.dataSources.length > 0
    ? selectedClient.dataSources.slice(0, 3).map(source => ({
      label: source.label,
      context: `${source.count.toLocaleString()} records`,
    }))
    : DEFAULT_CONNECTIONS;
  const scopeLabel = selectedClient
    ? selectedClient.name
    : hasFilter
      ? [
        isCommandFilterActive(filters, 'Zone') ? filters!.Zone : null,
        isCommandFilterActive(filters, 'Service') ? filters!.Service : null,
      ].filter(Boolean).join(' / ')
      : '';

  return (
    <div className="h-7 bg-[#0A1628] border-b border-[rgba(46,127,255,0.15)] flex items-center px-4 gap-2 flex-shrink-0">
      <Link2 size={12} className="text-[#2E7FFF]" />
      <span className="text-[11px] text-[#7A94B4] truncate">
        Connected to:{' '}
        {scopedConnections.map((connection, index) => (
          <span key={`${connection.label}-${index}`}>
            <span className="text-[#EEF3FA]">{connection.label}</span>
            {connection.context && <span> ({connection.context})</span>}
            {index < scopedConnections.length - 1 && <span>{' · '}</span>}
          </span>
        ))}
        {scopeLabel && (
          <span className="ml-1 text-blue-300">scoped to {scopeLabel}</span>
        )}
        <span className="ml-1 text-emerald-400">
          {selectedClient && selectedClient.status !== 'live'
            ? `- ${selectedClient.status} property sync under watch`
            : filters?.Client === COMMAND_FILTER_ALL_VALUES.Client
              ? '- data syncing every 5 min'
              : '- filtered data syncing every 5 min'}
        </span>
      </span>
    </div>
  );
}
