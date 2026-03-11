export function DetailRow({
  label,
  value,
  mono,
  icon,
  onClick,
  isClickable,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  icon?: React.ReactNode
  onClick?: () => void
  isClickable?: boolean
}) {
  const className =
    isClickable && onClick
      ? 'break-all hover:text-sky-400 transition-colors text-sky-500 cursor-pointer inline-flex items-center gap-1'
      : `break-all ${mono ? 'mt-0.5 font-mono text-xs' : ''}`

  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="inline-flex min-w-[110px] shrink-0 items-center gap-2 text-muted-foreground">
        {icon}
        {label}:
      </span>
      {isClickable && onClick ? (
        <button type="button" onClick={onClick} className={className} title={`Open this object`}>
          {value}
          <span className="ml-1 text-xs opacity-60">↗</span>
        </button>
      ) : (
        <span className={className}>{value}</span>
      )}
    </div>
  )
}
