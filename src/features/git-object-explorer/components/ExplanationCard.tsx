import { KeyRound } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumbersInText, shortenHashesInText } from '@/features/git-object-explorer/formatters'

export function ExplanationCard({ explanations }: { explanations: string[] }) {
  const seen = new Map<string, number>()

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          Explanation
        </CardTitle>
        <CardDescription>How this git object works</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {explanations.map((line) => {
          const count = (seen.get(line) ?? 0) + 1
          seen.set(line, count)

          return (
            <p key={`${line}-${count}`} className="text-muted-foreground leading-relaxed">
              {renderInlineMarkdown(formatNumbersInText(shortenHashesInText(line)))}
            </p>
          )
        })}
      </CardContent>
    </Card>
  )
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)

  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2)
      return (
        <strong key={`b-${part}`} className="text-foreground">
          {boldText}
        </strong>
      )
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      const codeText = part.slice(1, -1)
      return (
        <code
          key={`c-${part}`}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-primary text-sm"
        >
          {codeText}
        </code>
      )
    }

    return <span key={`t-${part}`}>{part}</span>
  })
}
