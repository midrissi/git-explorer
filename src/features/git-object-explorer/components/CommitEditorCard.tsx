import { Download, PenLine } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buildGitObjectFile, type GitCommit } from '@/git-parser'

export function CommitEditorCard({
  commit,
  fileName,
}: {
  commit: GitCommit
  fileName?: string | null
}) {
  const initial = useMemo(() => buildInitialState(commit), [commit])

  const [authorName, setAuthorName] = useState(initial.author.name)
  const [authorEmail, setAuthorEmail] = useState(initial.author.email)
  const [authorWhen, setAuthorWhen] = useState(initial.author.when)
  const [authorTimezone, setAuthorTimezone] = useState(initial.author.timezone)

  const [committerName, setCommitterName] = useState(initial.committer.name)
  const [committerEmail, setCommitterEmail] = useState(initial.committer.email)
  const [committerWhen, setCommitterWhen] = useState(initial.committer.when)
  const [committerTimezone, setCommitterTimezone] = useState(initial.committer.timezone)

  const [message, setMessage] = useState(commit.message)
  const [keepSignature, setKeepSignature] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState<string>('modified-commit-object')
  const previousUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current)
      }
    }
  }, [])

  async function downloadEditedObject() {
    setStatus(null)

    try {
      const edited: GitCommit = {
        ...commit,
        author: formatIdentity(authorName, authorEmail, authorWhen, authorTimezone),
        committer: formatIdentity(committerName, committerEmail, committerWhen, committerTimezone),
        message,
        gpgsig: keepSignature ? commit.gpgsig : undefined,
      }

      const bytes = await buildGitObjectFile(edited, {
        includeCommitSignature: keepSignature,
      })
      const arrayBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer
      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const safeName = (fileName || 'commit-object').replace(/[^a-zA-Z0-9._-]/g, '_')
      const fileDownloadName = `modified-${safeName}`

      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current)
      }
      previousUrlRef.current = url
      setDownloadUrl(url)
      setDownloadName(fileDownloadName)

      const a = document.createElement('a')
      a.href = url
      a.download = fileDownloadName
      document.body.appendChild(a)
      a.click()
      a.remove()

      setStatus('Modified object prepared. If download did not start, use the direct link.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to build modified object')
    }
  }

  return (
    <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenLine className="h-4 w-4 text-emerald-500" />
          Edit Commit Object
        </CardTitle>
        <CardDescription>
          Change author, committer, date, message and download a new object file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Author name</span>
            <input
              className="h-9 w-full rounded-md border bg-background px-3"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Author email</span>
            <input
              className="h-9 w-full rounded-md border bg-background px-3"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Author date</span>
            <input
              type="datetime-local"
              className="h-9 w-full rounded-md border bg-background px-3"
              value={authorWhen}
              onChange={(e) => setAuthorWhen(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Author timezone</span>
            <input
              className="h-9 w-full rounded-md border bg-background px-3 font-mono"
              value={authorTimezone}
              onChange={(e) => setAuthorTimezone(e.target.value)}
              placeholder="+0000"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Committer name</span>
            <input
              className="h-9 w-full rounded-md border bg-background px-3"
              value={committerName}
              onChange={(e) => setCommitterName(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Committer email</span>
            <input
              className="h-9 w-full rounded-md border bg-background px-3"
              value={committerEmail}
              onChange={(e) => setCommitterEmail(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Committer date</span>
            <input
              type="datetime-local"
              className="h-9 w-full rounded-md border bg-background px-3"
              value={committerWhen}
              onChange={(e) => setCommitterWhen(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Committer timezone</span>
            <input
              className="h-9 w-full rounded-md border bg-background px-3 font-mono"
              value={committerTimezone}
              onChange={(e) => setCommitterTimezone(e.target.value)}
              placeholder="+0000"
            />
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Commit message</span>
          <textarea
            className="min-h-32 w-full rounded-md border bg-background p-3 font-mono text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>

        {commit.gpgsig && (
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={keepSignature}
              onChange={(e) => setKeepSignature(e.target.checked)}
            />
            Keep existing GPG signature (usually invalid after edits)
          </label>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void downloadEditedObject()}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 font-medium text-primary-foreground text-sm hover:bg-primary/80"
          >
            <Download className="h-4 w-4" />
            Download Modified Object
          </button>
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={downloadName}
              className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 font-medium text-sm hover:bg-muted"
            >
              Direct Download Link
            </a>
          )}
          {status && <span className="text-muted-foreground text-sm">{status}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

function buildInitialState(commit: GitCommit) {
  const author = parseIdentity(commit.author)
  const committer = parseIdentity(commit.committer)

  return {
    author,
    committer,
  }
}

function parseIdentity(identity: string) {
  const match = identity.match(/^(.*) <([^>]+)> (\d+) ([+-]\d{4})$/)

  if (!match) {
    return {
      name: identity,
      email: '',
      when: toDateTimeLocal(Math.floor(Date.now() / 1000)),
      timezone: '+0000',
    }
  }

  const [, name, email, seconds, timezone] = match
  return {
    name,
    email,
    when: toDateTimeLocal(Number(seconds)),
    timezone,
  }
}

function formatIdentity(name: string, email: string, when: string, timezone: string): string {
  const seconds = fromDateTimeLocal(when)
  const safeTimezone = /^[+-]\d{4}$/.test(timezone) ? timezone : '+0000'
  return `${name} <${email}> ${seconds} ${safeTimezone}`
}

function toDateTimeLocal(seconds: number): string {
  const date = new Date(seconds * 1000)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function fromDateTimeLocal(value: string): number {
  const ms = new Date(value).getTime()
  if (Number.isNaN(ms)) {
    return Math.floor(Date.now() / 1000)
  }
  return Math.floor(ms / 1000)
}
