import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FolderTree,
  GitBranch,
  GitCommitHorizontal,
  Navigation,
  Tag,
  Trash2,
} from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { IndexedObjectFile } from '@/features/git-object-explorer/useGitObjectFile'

type BrowserTab = 'explorer' | 'commits' | 'trees' | 'blobs' | 'tags'

const BROWSER_TABS: Array<{
  id: BrowserTab
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: 'explorer', label: 'Explorer', icon: Navigation },
  { id: 'commits', label: 'Commits', icon: GitCommitHorizontal },
  { id: 'trees', label: 'Trees', icon: GitBranch },
  { id: 'blobs', label: 'Blobs', icon: FileCode2 },
  { id: 'tags', label: 'Tags', icon: Tag },
]

const TAB_TYPE_FILTER: Partial<Record<BrowserTab, IndexedObjectFile['objectType']>> = {
  commits: 'commit',
  trees: 'tree',
  blobs: 'blob',
  tags: 'tag',
}

export const ObjectBrowserCard = forwardRef<
  { scrollToObject: (id: string) => void },
  {
    entries: IndexedObjectFile[]
    selectedFolder: string
    selectedObjectId: string | null
    onSelectFolder: (folder: string) => void
    onSelectObject: (entry: IndexedObjectFile) => void
    onClearData?: () => void
    isClearingData?: boolean
  }
>(function ObjectBrowserCard(
  {
    entries,
    selectedFolder,
    selectedObjectId,
    onSelectFolder,
    onSelectObject,
    onClearData,
    isClearingData,
  },
  ref
) {
  const [activeTab, setActiveTab] = useState<BrowserTab>('explorer')
  const filteredEntries = useMemo(() => {
    if (activeTab === 'explorer') {
      return entries
    }

    const typeFilter = TAB_TYPE_FILTER[activeTab]
    if (!typeFilter) {
      return entries
    }

    return entries.filter((entry) => entry.objectType === typeFilter)
  }, [activeTab, entries])

  const tabCounts = useMemo(() => {
    return {
      explorer: entries.length,
      commits: entries.filter((entry) => entry.objectType === 'commit').length,
      trees: entries.filter((entry) => entry.objectType === 'tree').length,
      blobs: entries.filter((entry) => entry.objectType === 'blob').length,
      tags: entries.filter((entry) => entry.objectType === 'tag').length,
    }
  }, [entries])

  const grouped = useMemo(() => groupEntries(filteredEntries), [filteredEntries])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    scrollToObject: (id: string) => {
      const button = scrollContainerRef.current?.querySelector(
        `[data-object-id="${id}"]`
      ) as HTMLElement
      if (button) {
        button.scrollIntoView({ behavior: 'smooth', block: 'center' })
        button.classList.add('ring-2', 'ring-sky-500')
        setTimeout(() => {
          button.classList.remove('ring-2', 'ring-sky-500')
        }, 1500)
      }
    },
  }))

  useEffect(() => {
    if (grouped.length === 0) {
      setExpandedFolders(new Set())
      setActiveNodeId(null)
      return
    }

    const initialFolder = selectedFolder || grouped[0].folder

    setExpandedFolders((prev) => {
      if (prev.size === 0) {
        return new Set([initialFolder])
      }
      if (!prev.has(initialFolder)) {
        const next = new Set(prev)
        next.add(initialFolder)
        return next
      }
      return prev
    })

    if (!selectedObjectId) {
      const firstFile =
        grouped.find((g) => g.folder === initialFolder)?.files[0] ?? grouped[0].files[0]
      if (firstFile) {
        setActiveNodeId(`file:${firstFile.id}`)
      } else {
        setActiveNodeId(`folder:${initialFolder}`)
      }
    }
  }, [grouped, selectedFolder, selectedObjectId])

  useEffect(() => {
    if (!selectedObjectId) {
      return
    }

    const parentGroup = grouped.find((group) =>
      group.files.some((file) => file.id === selectedObjectId)
    )

    if (!parentGroup) {
      return
    }

    setExpandedFolders((prev) => {
      if (prev.has(parentGroup.folder)) {
        return prev
      }

      const next = new Set(prev)
      next.add(parentGroup.folder)
      return next
    })

    setActiveNodeId(`file:${selectedObjectId}`)
  }, [grouped, selectedObjectId])

  const visibleNodes = useMemo(() => {
    const nodes: Array<{
      id: string
      type: 'folder' | 'file'
      folder: string
      file?: IndexedObjectFile
    }> = []

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
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-sky-400" />
              Object Browser
            </CardTitle>
            <CardDescription>
              Tree view of .git/objects. Use arrow keys to navigate and Enter to select.
            </CardDescription>
          </div>

          {onClearData && (
            <button
              type="button"
              onClick={onClearData}
              disabled={isClearingData}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border/70 bg-background/60 px-2.5 font-medium text-muted-foreground text-xs transition-colors hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
              title="Clear cached objects, history, and saved selection"
              aria-label="Clear cached data"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isClearingData ? 'Clearing...' : 'Clear cache'}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/70 bg-muted/20 p-1.5 shadow-inner">
          <div
            className="flex flex-wrap gap-1.5"
            role="tablist"
            aria-label="Object browser filters"
          >
            {BROWSER_TABS.map((tab) => {
              const isActive = activeTab === tab.id
              const TabIcon = tab.icon

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 font-medium text-xs transition-all ${
                    isActive
                      ? 'border-sky-400/50 bg-sky-500/15 text-foreground shadow-sm'
                      : 'border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  <TabIcon
                    className={`h-3.5 w-3.5 ${isActive ? 'text-sky-300' : 'text-muted-foreground'}`}
                  />
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                      isActive
                        ? 'bg-sky-500/25 text-sky-100'
                        : 'bg-background/70 text-muted-foreground'
                    }`}
                  >
                    {tabCounts[tab.id]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div
          role="tree"
          tabIndex={0}
          ref={scrollContainerRef}
          onKeyDown={onTreeKeyDown}
          className="max-h-[34rem] overflow-y-auto overflow-x-hidden rounded-lg border border-border/60 bg-muted/20 p-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Git object tree"
        >
          {grouped.length === 0 && (
            <div className="rounded-md px-2 py-3 text-muted-foreground text-sm">
              No {activeTab} objects found in cache yet.
            </div>
          )}

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
                  } cursor-pointer`}
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
                          data-object-id={entry.id}
                          onClick={() => {
                            setActiveNodeId(fileNodeId)
                            onSelectObject(entry)
                          }}
                          className={`flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                            isSelected
                              ? 'bg-primary/25 text-foreground'
                              : isActive
                                ? 'bg-muted text-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                          title={entry.displayPath}
                        >
                          <GitCommitHorizontal className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                          <span className="min-w-0 flex-1 truncate font-mono">
                            {entry.displayPath}
                          </span>
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
})

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
    .map(([folder, files]) => ({
      folder,
      files: files.sort((a, b) => a.displayPath.localeCompare(b.displayPath)),
    }))
    .sort((a, b) => a.folder.localeCompare(b.folder))
}
