interface Props {
  name: string;
  role: string;
  status: string;
  site: string;
  shiftStart: string;
}

export function UserContextCard({ name, role, status, site, shiftStart }: Props) {
  return (
    <div className="w-full max-w-[280px] bg-[#112040] border border-[rgba(46,127,255,0.22)] rounded-2xl px-4 py-3 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[#EEF3FA] text-sm font-semibold truncate">{name}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30 flex-shrink-0">
              {status}
            </span>
          </div>
          <div className="text-[#7A94B4] text-[10px] truncate mt-0.5">{role}</div>
        </div>
      </div>
      <div className="mt-2.5 pt-2.5 border-t border-[rgba(46,127,255,0.15)] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2E7FFF]" />
          <span className="text-[#7A94B4] text-[10px]">{site}</span>
        </div>
        <span className="text-[#7A94B4] text-[10px]">{shiftStart}</span>
      </div>
    </div>
  );
}
