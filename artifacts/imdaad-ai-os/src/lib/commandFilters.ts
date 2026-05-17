import type { Incident } from '@/context/IncidentContext';
import type { PortfolioClient } from '@/data/mockData';

export type CommandFilterKey = 'Client' | 'Zone' | 'Service';
export type CommandFilters = Record<CommandFilterKey, string>;

export const COMMAND_FILTER_ALL_VALUES: CommandFilters = {
  Client: 'All Properties',
  Zone: 'All Zones',
  Service: 'All Services',
};

export const COMMAND_ZONE_OPTIONS = [
  'All Zones',
  'Cluster A',
  'Cluster B',
  'Block C',
  'Recreation Area',
  'Main Gate',
];

export const COMMAND_SERVICE_OPTIONS = [
  'All Services',
  'HVAC',
  'Plumbing',
  'Electrical',
  'General',
];

const SERVICE_ALIASES: Record<string, string[]> = {
  HVAC: ['hvac', 'ac failure', 'air conditioning', 'a/c', 'ahu', 'chiller', 'cooling', 'refrigerant', 'compressor'],
  Plumbing: ['plumbing', 'water', 'pipe', 'pump', 'leak', 'irrigation', 'drain'],
  Electrical: ['electrical', 'power', 'mcb', 'generator', 'light', 'lighting', 'intercom', 'gate', 'fire panel'],
  General: ['general', 'lift', 'elevator', 'safety', 'civil', 'inspection', 'amenities', 'asset'],
};

export function normalizeCommandText(value: string | number | null | undefined): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function uniqueCommandOptions(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    const key = normalizeCommandText(trimmed);
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export function isCommandFilterActive(filters: CommandFilters | undefined, key: CommandFilterKey): boolean {
  return Boolean(filters && filters[key] !== COMMAND_FILTER_ALL_VALUES[key]);
}

export function hasActiveCommandFilters(filters: CommandFilters | undefined): boolean {
  return Boolean(filters && (Object.keys(COMMAND_FILTER_ALL_VALUES) as CommandFilterKey[]).some(key => isCommandFilterActive(filters, key)));
}

export function getSelectedCommandClient(filters: CommandFilters | undefined, clients: PortfolioClient[]): PortfolioClient | null {
  if (!isCommandFilterActive(filters, 'Client')) return null;
  const selected = normalizeCommandText(filters!.Client);
  return clients.find(client => normalizeCommandText(client.name) === selected || normalizeCommandText(client.marketLabel) === selected) ?? null;
}

function matchesNeedle(fields: Array<string | number | null | undefined>, needle: string): boolean {
  const normalizedNeedle = normalizeCommandText(needle);
  if (!normalizedNeedle) return true;
  return fields.some(field => {
    const text = normalizeCommandText(field);
    if (!text) return false;
    return text.includes(normalizedNeedle) || normalizedNeedle.includes(text);
  });
}

function clientFields(client: PortfolioClient | null): Array<string | number | null | undefined> {
  if (!client) return [];
  return [
    client.id,
    client.name,
    client.marketLabel,
    client.region,
    client.sector,
    ...client.topSites.map(site => site.name),
    ...client.dataSources.map(source => source.label),
  ];
}

function serviceNeedles(service: string): string[] {
  return uniqueCommandOptions([service, ...(SERVICE_ALIASES[service] ?? [])]);
}

export function matchesCommandFilterText(
  filters: CommandFilters | undefined,
  fields: Array<string | number | null | undefined>,
  clients: PortfolioClient[] = [],
): boolean {
  if (!filters) return true;

  const selectedClient = getSelectedCommandClient(filters, clients);
  if (isCommandFilterActive(filters, 'Client')) {
    const clientMatch = selectedClient
      ? matchesNeedle(fields, selectedClient.name) || matchesNeedle(fields, selectedClient.id) || (selectedClient.marketLabel ? matchesNeedle(fields, selectedClient.marketLabel) : false)
      : matchesNeedle(fields, filters.Client);
    if (!clientMatch) return false;
  }

  if (isCommandFilterActive(filters, 'Zone')) {
    const zoneMatch = matchesNeedle(fields, filters.Zone);
    if (!zoneMatch) return false;
  }

  if (isCommandFilterActive(filters, 'Service')) {
    const serviceMatch = serviceNeedles(filters.Service).some(needle => matchesNeedle(fields, needle));
    if (!serviceMatch) return false;
  }

  return true;
}

export function commandFilterMatchesIncident(
  incident: Incident,
  filters: CommandFilters | undefined,
  clients: PortfolioClient[],
): boolean {
  if (!filters) return true;

  const selectedClient = getSelectedCommandClient(filters, clients);
  if (selectedClient && incident.clientId !== selectedClient.id) return false;

  const incidentClient = clients.find(client => client.id === incident.clientId) ?? null;
  const fields = [
    incident.id,
    incident.title,
    incident.location,
    incident.severity,
    incident.status,
    incident.source,
    incident.siteId,
    incident.description,
    incident.aiMetadata?.category,
    incident.aiMetadata?.issueType,
    incident.aiMetadata?.identifiedAsset,
    incident.aiMetadata?.recommendedAction,
    ...incident.activityLog.map(log => log.event),
    ...clientFields(incidentClient),
  ];

  if (isCommandFilterActive(filters, 'Client') && !selectedClient && !matchesNeedle(fields, filters.Client)) return false;
  if (isCommandFilterActive(filters, 'Zone') && !matchesNeedle(fields, filters.Zone)) return false;
  if (isCommandFilterActive(filters, 'Service')) {
    const serviceMatch = serviceNeedles(filters.Service).some(needle => matchesNeedle(fields, needle));
    if (!serviceMatch) return false;
  }

  return true;
}
