import { ChevronDown, ChevronRight, FolderTree, GitCommitHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { IndexedObjectFile } from '@/features/git-object-explorer/useGitObjectFile'

export function ObjectBrowserCard({
  entries,
  selectedFolder,
  selectedObjectId,
  onSelectFolder,
  onSelectObject,
}: {
  entries: IndexedObjectFile[]
  selectedFolder: string
  selectedObjectId: string | null
  onSelectFolder: (folder: string) => void
  onSelectObject: (entry: IndexedObjectFile) => void
}) {
  const grouped = useMemo(() => groupEntries(entries), [entries])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)

  useEffect(() => {
    if (grouped.length === 0) {
      setExpandedFolders(new Set())
      setActiveNodeId(null)
      return
    }

    const initialFolder = selectedFolder || grouped[0].folder
    const nextExpanded = new Set<string>([initialFolder])
    setExpandedFolders(nextExpanded)

    const firstFile = grouped.find((g) => g.folder === initialFolder)?.files[0] ?? grouped[0].files[0]
    if (selectedObjectId) {
      setActiveNodeId(`file:${selectedObjectId}`)
    } else if (firstFile) {
      setActiveNodeId(`file:${firstFile.id}`)
    } else {
      setActiveNodeId(`folder:${initialFolder}`)
    }
  }, [grouped, selectedFolder, selectedObjectId])

  const visibleNodes = useMemo(() => {
    const nodes: Array<{ id: string; type: 'folder' | 'file'; folder: string; file?: IndexedObjectFile }> =
      []

    for (const group of grouped) {
      nodes.push({ id: `folder:${group.folder}`, type: 'folder', folder: group.folder })
      if (expandedFolders.has(group.folder)) {
        for (const file of group.files) {
          nodes.push({ id: `file:${file.id}`, type: 'file', folder: group.folder, file })
        }
      }
    }

    return nodes
  }, [expandedFolders, grouped])

  function toggleFolder(folder: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folder)) {
        next.delete(folder)
      } else {
        next.add(folder)
      }
      return next
    })
    onSelectFolder(folder)
  }

  function onTreeKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (visibleNodes.length === 0) {
      return
    }

    const currentIndex = Math.max(
      0,
      visibleNodes.findIndex((node) => node.id === activeNodeId)
    )
    const current = visibleNodes[currentIndex]

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = visibleNodes[Math.min(currentIndex + 1, visibleNodes.length - 1)]
      setActiveNodeId(next.id)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = visibleNodes[Math.max(currentIndex - 1, 0)]
      setActiveNodeId(prev.id)
      return
    }

    if (e.key === 'ArrowRight' && current.type === 'folder') {
      e.preventDefault()
      if (!expandedFolders.has(current.folder)) {
        toggleFolder(current.folder)
      } else {
        const next = visibleNodes[currentIndex + 1]
        if (next && next.type === 'file' && next.folder === current.folder) {
          setActiveNodeId(next.id)
        }
      }
      return
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (current.type === 'folder') {
        if (expandedFolders.has(current.folder)) {
          toggleFolder(current.folder)
        }
      } else {
        setActiveNodeId(`folder:${current.folder}`)
      }
      return
    }

    if ((e.key === 'Enter' || e.key === ' ') && current) {
      e.preventDefault()
      if (current.type === 'folder') {
        toggleFolder(current.folder)
      } else if (current.file) {
        onSelectObject(current.file)
      }
    }
  }

  return (
    <Card className="border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-sky-400" />
          Object Browser
        </CardTitle>
        <CardDescription>
          Tree view of .git/objects. Use arrow keys to navigate and Enter to select.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          role="tree"
          tabIndex={0}
          onKeyDown={onTreeKeyDown}
          className="max-h-[34rem] overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Git object tree"
        >
          {grouped.map((group) => {
            const folderNodeId = `folder:${group.folder}`
            const isExpanded = expandedFolders.has(group.folder)
            const folderActive = activeNodeId === folderNodeId

            return (
              <div key={group.folder} className="mb-1">
                <button
                  type="button"
                  role="treeitem"
                  aria-expanded={isExpanded}
                  onClick={() => {
                    setActiveNodeId(folderNodeId)
                    toggleFolder(group.folder)
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-mono text-sm transition-colors ${
                    folderActive
                      ? 'bg-primary/20 text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                  )}
                  <span>{group.folder}</span>
                  <span className="ml-auto text-xs opacity-70">{group.files.length}</span>
                </button>

                {isExpanded && (
                  <div className="mt-1 ml-5 space-y-1 border-border/40 border-l pl-2">
                    {group.files.map((entry) => {
                      const fileNodeId = `file:${entry.id}`
                      const isSelected = selectedObjectId === entry.id
                      const isActive = activeNodeId === fileNodeId

                      return (
                        <button
                          type="button"
                          role="treeitem"
                          key={entry.id}
                          onClick={() => {
                            setActiveNodeId(fileNodeId)
                            onSelectObject(entry)
                          }}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                            isSelected
                              ? 'bg-primary/25 text-foreground'
                              : isActive
                                ? 'bg-muted text-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <GitCommitHorizontal className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                          <span className="font-mono">{entry.displayPath}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function groupEntries(entries: IndexedObjectFile[]) {
  const map = new Map<string, IndexedObjectFile[]>()

  for (const entry of entries) {
    const bucket = map.get(entry.folder)
    if (bucket) {
      bucket.push(entry)
    } else {
      map.set(entry.folder, [entry])
    }
  }

  return Array.from(map.entries())
    .map(([folder, files]) => ({ folder, files: files.sort((a, b) => a.displayPath.localeCompare(b.displayPath)) }))
    .sort((a, b) => a.folder.localeCompare(b.folder))
}
