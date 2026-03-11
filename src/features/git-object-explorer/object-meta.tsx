import { Binary, FileCode2, FolderGit2, GitCommitHorizontal, Tag } from 'lucide-react'
import type { GitObject } from '@/git-parser'

export function typeBadgeVariant(
  type: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (type) {
    case 'blob':
    case 'tree':
    case 'commit':
      return 'default'
    case 'tag':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function typeBadgeClass(type: string): string {
  switch (type) {
    case 'blob':
      return 'bg-emerald-500 text-black hover:bg-emerald-400'
    case 'tree':
      return 'bg-sky-500 text-black hover:bg-sky-400'
    case 'commit':
      return 'bg-amber-500 text-black hover:bg-amber-400'
    case 'tag':
      return 'bg-fuchsia-500 text-black hover:bg-fuchsia-400'
    default:
      return ''
  }
}

export function objectTypeIcon(type?: GitObject['type']): React.ReactNode {
  switch (type) {
    case 'blob':
      return <FileCode2 className="h-4 w-4" />
    case 'tree':
      return <FolderGit2 className="h-4 w-4" />
    case 'commit':
      return <GitCommitHorizontal className="h-4 w-4" />
    case 'tag':
      return <Tag className="h-4 w-4" />
    default:
      return <Binary className="h-4 w-4" />
  }
}
