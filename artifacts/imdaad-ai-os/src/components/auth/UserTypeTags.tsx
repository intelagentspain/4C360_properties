const userTypes = [
  { label: 'In-house', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  { label: 'Contractor', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { label: 'Partner', className: 'border-violet-200 bg-violet-50 text-violet-700' },
  { label: 'Management', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  { label: 'Superadmin', className: 'border-red-200 bg-red-50 text-red-700' },
];

export function UserTypeTags() {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Supported user types">
      {userTypes.map(type => (
        <span
          key={type.label}
          className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${type.className}`}
        >
          {type.label}
        </span>
      ))}
    </div>
  );
}
