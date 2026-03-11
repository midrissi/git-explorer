import {
  AlertCircle,
  Box,
  CheckCircle2,
  Flame,
  GitBranch,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ConventionalCommit } from '@/features/git-object-explorer/utils/conventionalCommit'
import { getTypeColors } from '@/features/git-object-explorer/utils/conventionalCommit'

const TYPE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  feat: (props) => <Zap {...props} className={`h-4 w-4 ${props.className || ''}`} />,
  fix: (props) => <CheckCircle2 {...props} className={`h-4 w-4 ${props.className || ''}`} />,
  docs: (props) => <Box {...props} className={`h-4 w-4 ${props.className || ''}`} />,
  style: (props) => <Flame {...props} className={`h-4 w-4 ${props.className || ''}`} />,
  refactor: (props) => <GitBranch {...props} className={`h-4 w-4 ${props.className || ''}`} />,
  perf: (props) => <Zap {...props} className={`h-4 w-4 ${props.className || ''}`} />,
  test: (props) => <CheckCircle2 {...props} className={`h-4 w-4 ${props.className || ''}`} />,
  build: (props) => <Box {...props} className={`h-4 w-4 ${props.className || ''}`} />,
  ci: (props) => <Box {...props} className={`h-4 w-4 ${props.className || ''}`} />,
  chore: (props) => <Box {...props} className={`h-4 w-4 ${props.className || ''}`} />,
  revert: (props) => <AlertCircle {...props} className={`h-4 w-4 ${props.className || ''}`} />,
  wip: (props) => <Flame {...props} className={`h-4 w-4 ${props.className || ''}`} />,
  deprecate: (props) => <AlertCircle {...props} className={`h-4 w-4 ${props.className || ''}`} />,
}

export function ConventionalCommitCard({ commit }: { commit: ConventionalCommit }) {
  const colors = getTypeColors(commit.type)
  const Icon = TYPE_ICONS[commit.type] || TYPE_ICONS.feat

  return (
    <Card className={`${colors.border} border bg-gradient-to-br from-transparent to-transparent`}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <Icon className={colors.text} />
          <span className={`${colors.text} font-bold font-mono text-sm uppercase`}>
            {commit.type}
          </span>
          {commit.scope && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono text-muted-foreground text-sm">{commit.scope}</span>
            </>
          )}
          {commit.breaking && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 font-bold font-mono text-red-600 text-xs dark:text-red-400">
                <Flame className="h-3 w-3" />
                BREAKING
              </span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium text-base">{commit.description}</p>
        </div>

        {commit.body && (
          <div>
            <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase">Body</p>
            <pre className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-muted-foreground text-sm">
              {commit.body}
            </pre>
          </div>
        )}

        {Object.keys(commit.footers).length > 0 && (
          <div>
            <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase">Footers</p>
            <div className="space-y-2">
              {Object.entries(commit.footers).map(([key, values]) => (
                <div key={key} className="rounded-lg border border-border/60 bg-muted/30 p-2">
                  <p className="font-mono font-semibold text-primary text-xs">{key}</p>
                  {values.map((value) => (
                    <p key={value} className="font-mono text-muted-foreground text-xs">
                      {value}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
