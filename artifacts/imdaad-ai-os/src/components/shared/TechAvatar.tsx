const SIZE: Record<number, string> = {
  6: 'w-6 h-6 text-[9px]',
  7: 'w-7 h-7 text-[10px]',
  8: 'w-8 h-8 text-[11px]',
  9: 'w-9 h-9 text-xs',
  10: 'w-10 h-10 text-sm',
  12: 'w-12 h-12 text-base',
};

interface Props {
  initials: string;
  size?: 6 | 7 | 8 | 9 | 10 | 12;
  className?: string;
}

export function TechAvatar({ initials, size = 9, className = '' }: Props) {
  return (
    <div
      className={`${SIZE[size]} rounded-full bg-gradient-to-br from-[#2E7FFF] to-[#00C6FF] flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}
