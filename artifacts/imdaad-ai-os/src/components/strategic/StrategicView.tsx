import { CommunityMap } from './CommunityMap';
import { IntegrationBanner } from './IntegrationBanner';
import { KPIPanel } from './KPIPanel';
import { PPMRiskPanel } from './PPMRiskPanel';
import { DispatchQueue } from './DispatchQueue';

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export function StrategicView({ onToast }: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <IntegrationBanner />
      <div className="flex flex-1 overflow-hidden gap-0">
        <div className="flex-[62] p-3 pr-1.5 overflow-hidden">
          <CommunityMap />
        </div>
        <div className="flex-[38] p-3 pl-1.5 overflow-y-auto custom-scrollbar">
          <KPIPanel />
          <PPMRiskPanel onToast={onToast} />
          <DispatchQueue onToast={onToast} />
        </div>
      </div>
    </div>
  );
}
