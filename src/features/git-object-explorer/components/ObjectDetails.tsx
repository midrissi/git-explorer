import {
  Binary,
  CalendarClock,
  FileCode2,
  GitBranch,
  GitCommitHorizontal,
  KeyRound,
  Signature,
  Tag,
  UserCircle2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CommitEditorCard } from '@/features/git-object-explorer/components/CommitEditorCard'
import { DetailRow } from '@/features/git-object-explorer/components/DetailRow'
import {
  formatGitIdentity,
  formatNumber,
  shortHash,
} from '@/features/git-object-explorer/formatters'
import type { GitObject } from '@/git-parser'

export function ObjectDetails({
  gitObj,
  fileName,
}: {
  gitObj: GitObject
  fileName?: string | null
}) {
  if (gitObj.type === 'blob') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-emerald-500" />
            File Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-x-auto overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-sm">
            {gitObj.content}
          </pre>
        </CardContent>
      </Card>
    )
  }

  if (gitObj.type === 'tree') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-sky-500" />
            Tree Entries
          </CardTitle>
          <CardDescription>
            {formatNumber(gitObj.entries.length)} entr{gitObj.entries.length === 1 ? 'y' : 'ies'} in
            this directory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mode</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="font-mono">SHA-1</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gitObj.entries.map((entry) => (
                <TableRow key={`${entry.mode}-${entry.name}-${entry.hash}`}>
                  <TableCell className="font-mono text-primary">{entry.mode}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.modeDescription}</TableCell>
                  <TableCell className="font-medium">{entry.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {shortHash(entry.hash)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  if (gitObj.type === 'commit') {
    return (
      <div className="space-y-4">
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCommitHorizontal className="h-4 w-4 text-amber-500" />
              Commit Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow
              label="Tree"
              value={shortHash(gitObj.tree)}
              mono
              icon={<GitBranch className="h-4 w-4 text-sky-500" />}
            />
            {gitObj.parents.map((p, i) => (
              <DetailRow
                key={p}
                label={`Parent${gitObj.parents.length > 1 ? ` ${i + 1}` : ''}`}
                value={shortHash(p)}
                mono
                icon={<GitCommitHorizontal className="h-4 w-4 text-orange-500" />}
              />
            ))}
            <DetailRow
              label="Author"
              value={formatGitIdentity(gitObj.author)}
              icon={<UserCircle2 className="h-4 w-4 text-emerald-500" />}
            />
            <DetailRow
              label="Committer"
              value={formatGitIdentity(gitObj.committer)}
              icon={<CalendarClock className="h-4 w-4 text-indigo-500" />}
            />
            <DetailRow
              label="GPG Sig"
              value={
                gitObj.gpgsig ? (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Signed
                  </span>
                ) : (
                  <span className="font-semibold text-rose-600 dark:text-rose-400">Not signed</span>
                )
              }
              icon={<Signature className="h-4 w-4 text-violet-500" />}
            />
            <div className="mt-3 border-t pt-3">
              <span className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                <FileCode2 className="h-4 w-4 text-primary" />
                Message
              </span>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-amber-500/30 bg-muted/80 p-3 font-mono text-sm">
                {gitObj.message}
              </pre>
            </div>
          </CardContent>
        </Card>

        <CommitEditorCard commit={gitObj} fileName={fileName} />
      </div>
    )
  }

  return (
    <Card className="border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-fuchsia-500" />
          Tag Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <DetailRow
          label="Object"
          value={shortHash(gitObj.object)}
          mono
          icon={<Binary className="h-4 w-4 text-primary" />}
        />
        <DetailRow
          label="Type"
          value={gitObj.tagType}
          icon={<Tag className="h-4 w-4 text-fuchsia-500" />}
        />
        <DetailRow
          label="Tag Name"
          value={gitObj.tagName}
          icon={<KeyRound className="h-4 w-4 text-emerald-500" />}
        />
        <DetailRow
          label="Tagger"
          value={gitObj.tagger}
          icon={<UserCircle2 className="h-4 w-4 text-sky-500" />}
        />
        <div className="mt-3 border-t pt-3">
          <span className="inline-flex items-center gap-2 text-muted-foreground text-sm">
            <FileCode2 className="h-4 w-4 text-primary" />
            Message
          </span>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-fuchsia-500/30 bg-muted/80 p-3 font-mono text-sm">
            {gitObj.message}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
