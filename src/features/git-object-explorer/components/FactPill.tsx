export function FactPill({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone: 'primary' | 'sky' | 'emerald'
}) {
  const toneClass =
    tone === 'primary'
      ? 'border-primary/30 bg-primary/10'
      : tone === 'sky'
        ? 'border-sky-500/30 bg-sky-500/10'
        : 'border-emerald-500/30 bg-emerald-500/10'

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <p className="inline-flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        {label}
      </p>
      <p className="mt-1 break-all font-medium text-sm">{value}</p>
    </div>
  )
}
