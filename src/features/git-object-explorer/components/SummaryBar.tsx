import { Binary, FileCode2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FactPill } from '@/features/git-object-explorer/components/FactPill'
import { formatNumber } from '@/features/git-object-explorer/formatters'
import {
  objectTypeIcon,
  typeBadgeClass,
  typeBadgeVariant,
} from '@/features/git-object-explorer/object-meta'
import type { GitObject } from '@/git-parser'

export function SummaryBar({ gitObj, fileName }: { gitObj: GitObject; fileName: string | null }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          variant={typeBadgeVariant(gitObj.type)}
          className={`text-xs uppercase tracking-wider ${typeBadgeClass(gitObj.type)}`}
        >
          {gitObj.type}
        </Badge>
        <Badge variant="outline" className="font-mono text-xs">
          size: {formatNumber(gitObj.size)} bytes
        </Badge>
        {fileName && (
          <span className="rounded-md bg-muted px-2 py-1 font-mono text-muted-foreground text-sm">
            {fileName}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <FactPill
          icon={objectTypeIcon(gitObj.type)}
          label="Object Type"
          value={gitObj.type.toUpperCase()}
          tone="primary"
        />
        <FactPill
          icon={<Binary className="h-4 w-4" />}
          label="Payload Size"
          value={`${formatNumber(gitObj.size)} bytes`}
          tone="sky"
        />
        <FactPill
          icon={<FileCode2 className="h-4 w-4" />}
          label="Input"
          value={fileName ?? 'uploaded file'}
          tone="emerald"
        />
      </div>
    </>
  )
}
