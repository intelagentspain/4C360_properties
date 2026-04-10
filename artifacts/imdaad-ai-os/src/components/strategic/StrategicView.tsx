import { useState } from 'react';
import { CommunityMap } from './CommunityMap';
import { IntegrationBanner } from './IntegrationBanner';
import { KPIPanel } from './KPIPanel';
import { PPMRiskPanel } from './PPMRiskPanel';
import { DispatchQueue } from './DispatchQueue';
import { CommandBar, AutomationMode } from './CommandBar';
import { LivePulseFeed } from './LivePulseFeed';
import { AIInsightsPanel } from './AIInsightsPanel';

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export function StrategicView({ onToast }: Props) {
  const [mode, setMode] = useState<AutomationMode>('hybrid');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CommandBar mode={mode} onModeChange={setMode} onToast={onToast} />
      <IntegrationBanner />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-[62] flex flex-col p-3 pr-1.5 overflow-hidden gap-2">
          <div className="flex-[65] overflow-hidden">
            <CommunityMap />
          </div>
          <div className="flex-[35] bg-[rgba(17,32,64,0.85)] border border-[rgba(46,127,255,0.22)] rounded-xl overflow-hidden">
            <LivePulseFeed onToast={onToast} />
          </div>
        </div>
        <div className="flex-[38] p-3 pl-1.5 overflow-y-auto custom-scrollbar">
          <KPIPanel onToast={onToast} />
          <AIInsightsPanel onToast={onToast} />
          <PPMRiskPanel onToast={onToast} />
          <DispatchQueue onToast={onToast} />
        </div>
      </div>
    </div>
  );
}
