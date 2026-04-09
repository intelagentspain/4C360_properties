import { useState } from 'react';
import { RequestForm } from './RequestForm';
import { ServiceTimeline } from './ServiceTimeline';

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export function ClientView({ onToast }: Props) {
  const [showTimeline, setShowTimeline] = useState(false);

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <div className="flex-1 border-r border-[rgba(46,127,255,0.15)] overflow-hidden">
        <RequestForm
          onSubmit={() => setShowTimeline(true)}
          onToast={onToast}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="h-10 border-b border-[rgba(46,127,255,0.15)] flex items-center px-4">
          <span className="text-[11px] text-[#7A94B4] uppercase tracking-wide font-medium">
            {showTimeline ? 'Live Service Tracking' : 'Service Timeline'}
          </span>
        </div>
        <div className="h-[calc(100%-40px)]">
          <ServiceTimeline />
        </div>
      </div>
    </div>
  );
}
