import {
  CalendarClock,
  FileText,
  GitBranch,
  KeyRound,
  MessageSquareText,
  Scale,
  ShieldCheck,
  ShieldX,
  UserRound,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  formatNumbersInText,
  formatTimestampsInText,
  shortenHashesInText,
} from '@/features/git-object-explorer/formatters'

export function ExplanationCard({
  explanations,
  onHashClick,
  canHashClick,
}: {
  explanations: string[]
  onHashClick?: (hash: string) => void
  canHashClick?: (hash: string) => boolean
}) {
  const seen = new Map<string, number>()
  const intro: React.ReactNode[] = []
  const facts: React.ReactNode[] = []
  const bullets: React.ReactNode[] = []
  const notes: React.ReactNode[] = []

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|[0-9a-f]{7}(?!\w))/gi)

    let cursor = 0
    return parts.map((part) => {
      const start = cursor
      cursor += part.length
      const keyBase = `${start}-${part}`

      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2)
        return (
          <strong key={`b-${keyBase}`} className="text-foreground">
            {boldText}
          </strong>
        )
      }

      if (part.startsWith('`') && part.endsWith('`')) {
        const codeText = part.slice(1, -1)
        return (
          <code
            key={`c-${keyBase}`}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-primary text-sm"
          >
            {codeText}
          </code>
        )
      }

      if (/^[0-9a-f]{7}$/i.test(part) && onHashClick && (canHashClick?.(part) ?? true)) {
        return (
          <button
            key={`h-${keyBase}`}
            type="button"
            onClick={() => onHashClick(part)}
            className="cursor-pointer font-mono text-sky-500 text-xs transition-colors hover:text-sky-400"
            title={`Open object ${part}`}
          >
            {part}
          </button>
        )
      }

      if (/^[0-9a-f]{7}$/i.test(part)) {
        return (
          <span key={`h-${keyBase}`} className="font-mono text-muted-foreground text-xs">
            {part}
          </span>
        )
      }

      return <span key={`t-${keyBase}`}>{part}</span>
    })
  }

  for (const line of explanations) {
    const normalized = formatNumbersInText(formatTimestampsInText(shortenHashesInText(line)))
    const count = (seen.get(normalized) ?? 0) + 1
    seen.set(normalized, count)
    const key = `${normalized}-${count}`

    const factMatch = normalized.match(/^([A-Za-z ]+):\s(.+)$/)

    if (normalized.startsWith('This is a ')) {
      intro.push(
        <div key={key} className="rounded-lg border border-primary/30 bg-primary/8 px-4 py-3">
          <p className="text-foreground leading-relaxed">{renderInlineMarkdown(normalized)}</p>
        </div>
      )
      continue
    }

    if (normalized.trim().startsWith('•')) {
      bullets.push(
        <div key={key} className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <p className="text-muted-foreground leading-relaxed">
            {renderInlineMarkdown(normalized.replace(/^\s*•\s*/, ''))}
          </p>
        </div>
      )
      continue
    }

    if (factMatch) {
      const label = factMatch[1]
      const value = factMatch[2]

      if (label.toLowerCase() === 'message') {
        facts.push(
          <div key={key} className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="mb-1 inline-flex items-center gap-2 font-medium text-amber-400 text-xs uppercase tracking-wide">
              <MessageSquareText className="h-3.5 w-3.5" />
              {label}
            </p>
            <p className="whitespace-pre-wrap font-mono text-foreground/95 text-sm leading-relaxed">
              {renderInlineMarkdown(value)}
            </p>
          </div>
        )
        continue
      }

      const icon = factIcon(label, value)
      const valueTone =
        label.toLowerCase() === 'gpg signature'
          ? value.includes('not')
            ? 'text-rose-400'
            : 'text-emerald-400'
          : 'text-foreground'

      facts.push(
        <div key={key} className="rounded-lg border border-border/60 bg-muted/25 px-3 py-2">
          <p className="mb-1 inline-flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {icon}
            {label}
          </p>
          <p className={`break-all text-sm leading-relaxed ${valueTone}`}>
            {renderInlineMarkdown(value)}
          </p>
        </div>
      )
      continue
    }

    notes.push(
      <p key={key} className="text-muted-foreground leading-relaxed">
        {renderInlineMarkdown(normalized)}
      </p>
    )
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/6 via-background to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          Explanation
        </CardTitle>
        <CardDescription>How this git object works</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {intro.length > 0 && <div className="space-y-2">{intro}</div>}
        {facts.length > 0 && <div className="grid grid-cols-1 gap-2 md:grid-cols-2">{facts}</div>}
        {bullets.length > 0 && <div className="space-y-2">{bullets}</div>}
        {notes.length > 0 && <div className="space-y-3">{notes}</div>}
      </CardContent>
    </Card>
  )
}

function factIcon(label: string, value: string): React.ReactNode {
  switch (label.toLowerCase()) {
    case 'size':
      return <Scale className="h-3.5 w-3.5 text-sky-400" />
    case 'tree':
    case 'parent':
    case 'parents':
      return <GitBranch className="h-3.5 w-3.5 text-indigo-400" />
    case 'author':
    case 'tagger':
      return <UserRound className="h-3.5 w-3.5 text-emerald-400" />
    case 'committer':
      return <CalendarClock className="h-3.5 w-3.5 text-violet-400" />
    case 'gpg signature':
      return value.includes('not') ? (
        <ShieldX className="h-3.5 w-3.5 text-rose-400" />
      ) : (
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
      )
    default:
      return <FileText className="h-3.5 w-3.5 text-primary" />
  }
}
