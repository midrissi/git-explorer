export function DetailRow({
  label,
  value,
  mono,
  icon,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="inline-flex min-w-[110px] shrink-0 items-center gap-2 text-muted-foreground">
        {icon}
        {label}:
      </span>
      <span className={`break-all ${mono ? 'mt-0.5 font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}
