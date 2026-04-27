import { FieldOpsDashboard } from '@/modules/fieldops/FieldOpsDashboard';

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export function OperationalView({ onToast }: Props) {
  return <FieldOpsDashboard onToast={onToast} />;
}
