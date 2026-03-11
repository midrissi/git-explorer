import Editor from '@monaco-editor/react'
import {
  Binary,
  CalendarClock,
  Download,
  FileCode2,
  FileQuestion,
  GitBranch,
  GitCommitHorizontal,
  Image,
  KeyRound,
  Link,
  ScrollText,
  Signature,
  Tag,
  UserCircle2,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
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
import { ConventionalCommitCard } from '@/features/git-object-explorer/components/ConventionalCommitCard'
import { DetailRow } from '@/features/git-object-explorer/components/DetailRow'
import {
  formatGitIdentity,
  formatNumber,
  shortHash,
} from '@/features/git-object-explorer/formatters'
import type { IndexedObjectFile } from '@/features/git-object-explorer/useGitObjectFile'
import { parseConventionalCommit } from '@/features/git-object-explorer/utils/conventionalCommit'
import type { GitBlob, GitObject } from '@/git-parser'

export function ObjectDetails({
  gitObj,
  fileName,
  objectEntries,
  onSelectObject,
  onHashClick,
}: {
  gitObj: GitObject
  fileName?: string | null
  objectEntries?: IndexedObjectFile[]
  onSelectObject?: (entry: IndexedObjectFile) => void
  onHashClick?: (hash: string) => void
}) {
  const findObjectByHash = (hash: string): IndexedObjectFile | undefined => {
    if (!objectEntries) return undefined
    return objectEntries.find(
      (entry) => entry.displayPath.replace('/', '').toLowerCase() === hash.toLowerCase()
    )
  }

  const hasObjectForHash = (hash: string): boolean => {
    return !!findObjectByHash(hash)
  }

  const handleObjectHashClick = (hash: string) => {
    if (onHashClick) {
      onHashClick(hash)
      return
    }

    const entry = findObjectByHash(hash)
    if (entry && onSelectObject) {
      onSelectObject(entry)
    }
  }

  if (gitObj.type === 'blob') {
    return <BlobContentCard blob={gitObj} fileName={fileName} />
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
              {gitObj.entries.map((entry) => {
                const isFound = hasObjectForHash(entry.hash)
                return (
                  <TableRow key={`${entry.mode}-${entry.name}-${entry.hash}`}>
                    <TableCell className="font-mono text-primary">{entry.mode}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.modeDescription}</TableCell>
                    <TableCell className="font-medium">{entry.name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {isFound ? (
                        <button
                          type="button"
                          onClick={() => handleObjectHashClick(entry.hash)}
                          className="group inline-flex cursor-pointer items-center gap-1 text-sky-500 transition-colors hover:text-sky-400"
                          title={`Open object ${entry.hash}`}
                        >
                          {shortHash(entry.hash)}
                          <Link className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      ) : (
                        shortHash(entry.hash)
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  if (gitObj.type === 'commit') {
    const parsedCommit = parseConventionalCommit(gitObj.message)

    return (
      <div className="space-y-4">
        {parsedCommit ? <ConventionalCommitCard commit={parsedCommit} /> : null}

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
              isClickable={hasObjectForHash(gitObj.tree)}
              onClick={() => handleObjectHashClick(gitObj.tree)}
            />
            {gitObj.parents.map((p, i) => (
              <DetailRow
                key={p}
                label={`Parent${gitObj.parents.length > 1 ? ` ${i + 1}` : ''}`}
                value={shortHash(p)}
                mono
                icon={<GitCommitHorizontal className="h-4 w-4 text-orange-500" />}
                isClickable={hasObjectForHash(p)}
                onClick={() => handleObjectHashClick(p)}
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
            {!parsedCommit && (
              <div className="mt-3 border-t pt-3">
                <span className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                  <FileCode2 className="h-4 w-4 text-primary" />
                  Message
                </span>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-amber-500/30 bg-muted/80 p-3 font-mono text-sm">
                  {gitObj.message}
                </pre>
              </div>
            )}
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
          isClickable={hasObjectForHash(gitObj.object)}
          onClick={() => handleObjectHashClick(gitObj.object)}
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

function BlobContentCard({ blob, fileName }: { blob: GitBlob; fileName?: string | null }) {
  const bytes = blob.bytes ?? new TextEncoder().encode(blob.content)
  const type = detectBlobType(bytes, fileName)
  const extension = type.extension || extensionFromName(fileName) || 'bin'
  const downloadName = buildDownloadName(fileName, extension)
  const blobUrl = useMemo(() => {
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer
    return URL.createObjectURL(new Blob([arrayBuffer], { type: type.mime }))
  }, [bytes, type.mime])

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {type.kind === 'image' ? (
            <Image className="h-4 w-4 text-emerald-500" />
          ) : type.kind === 'pdf' ? (
            <ScrollText className="h-4 w-4 text-rose-500" />
          ) : type.kind === 'text' ? (
            <FileCode2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <FileQuestion className="h-4 w-4 text-amber-500" />
          )}
          File Content
        </CardTitle>
        <CardDescription>
          {type.label}
          {type.extension ? ` (.${type.extension})` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 overflow-hidden">
        {type.kind === 'image' && (
          <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/30 p-2">
            <img src={blobUrl} alt="Blob preview" className="max-h-[500px] w-full object-contain" />
          </div>
        )}

        {type.kind === 'pdf' && (
          <div className="h-[500px] overflow-hidden rounded-lg border border-border/60 bg-muted/30">
            <iframe src={blobUrl} title="PDF preview" className="h-full w-full" />
          </div>
        )}

        {type.kind === 'text' && (
          <div className="overflow-hidden rounded-lg border border-border/60">
            <div className="flex items-center justify-between border-border/60 border-b bg-muted/40 px-3 py-1.5">
              <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Syntax Highlight
              </span>
              <span className="font-mono text-muted-foreground text-xs">
                {detectLanguage(fileName, blob.content)}
              </span>
            </div>
            <div className="h-[min(70vh,34rem)]">
              <Editor
                language={detectLanguage(fileName, blob.content)}
                value={blob.content}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  lineNumbers: 'off',
                  folding: true,
                  wordWrap: 'off',
                  fontSize: 13,
                  padding: { top: 12, bottom: 12 },
                  fontFamily: '"Fira Code", monospace',
                  mouseWheelZoom: false,
                  smoothScrolling: true,
                  bracketPairColorization: {
                    enabled: true,
                  },
                }}
              />
            </div>
          </div>
        )}

        {type.kind === 'unknown' && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-muted-foreground text-sm">
            Unknown/binary content. Preview is not available. Download the file and open it with a
            suitable app.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={blobUrl}
            download={downloadName}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Download {downloadName}
          </a>
          {type.kind === 'unknown' && (
            <span className="text-muted-foreground text-xs">Suggested extension: .{extension}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function detectBlobType(
  bytes: Uint8Array,
  fileName?: string | null
): { kind: 'text' | 'image' | 'pdf' | 'unknown'; mime: string; extension?: string; label: string } {
  const nameExt = extensionFromName(fileName)

  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) {
    return { kind: 'image', mime: 'image/png', extension: 'png', label: 'PNG image' }
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { kind: 'image', mime: 'image/jpeg', extension: 'jpg', label: 'JPEG image' }
  }
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) {
    return { kind: 'image', mime: 'image/gif', extension: 'gif', label: 'GIF image' }
  }
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && toAscii(bytes.slice(8, 12)) === 'WEBP') {
    return { kind: 'image', mime: 'image/webp', extension: 'webp', label: 'WebP image' }
  }
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) {
    return { kind: 'pdf', mime: 'application/pdf', extension: 'pdf', label: 'PDF document' }
  }

  const textHead = new TextDecoder().decode(bytes.slice(0, Math.min(bytes.length, 256))).trimStart()
  if (textHead.startsWith('<svg')) {
    return { kind: 'image', mime: 'image/svg+xml', extension: 'svg', label: 'SVG image' }
  }

  if (nameExt && TEXT_EXTENSIONS.has(nameExt)) {
    return {
      kind: 'text',
      mime: mimeFromExtension(nameExt),
      extension: nameExt,
      label: 'Text file',
    }
  }

  if (looksLikeText(bytes)) {
    return {
      kind: 'text',
      mime: 'text/plain;charset=utf-8',
      extension: nameExt || 'txt',
      label: 'Text file',
    }
  }

  return {
    kind: 'unknown',
    mime: 'application/octet-stream',
    extension: nameExt || guessExtensionFromMagic(bytes) || 'bin',
    label: 'Unknown binary file',
  }
}

const TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'json',
  'js',
  'jsx',
  'ts',
  'tsx',
  'css',
  'scss',
  'sass',
  'less',
  'html',
  'xml',
  'yml',
  'yaml',
  'sh',
  'bash',
  'py',
  'java',
  'go',
  'rs',
  'c',
  'cpp',
  'cc',
  'cxx',
  'h',
  'hpp',
  'cs',
  'php',
  'rb',
  'swift',
  'kt',
  'scala',
  'r',
  'lua',
  'pl',
  'groovy',
  'gradle',
  'hcl',
  'tf',
  'dockerfile',
  'makefile',
  'toml',
  'ini',
  'cfg',
  'conf',
  'graphql',
  'wasm',
  '4d',
  '4dt',
])

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) {
    return false
  }
  return sig.every((v, i) => bytes[i] === v)
}

function toAscii(bytes: Uint8Array): string {
  return String.fromCharCode(...Array.from(bytes))
}

function extensionFromName(fileName?: string | null): string | null {
  if (!fileName || !fileName.includes('.')) {
    return null
  }
  return fileName.split('.').pop()?.toLowerCase() || null
}

function looksLikeText(bytes: Uint8Array): boolean {
  const sample = bytes.slice(0, Math.min(bytes.length, 1024))
  if (sample.length === 0) {
    return true
  }

  let suspicious = 0
  for (const b of sample) {
    if (b === 9 || b === 10 || b === 13) {
      continue
    }
    if (b >= 32 && b <= 126) {
      continue
    }
    if (b >= 160) {
      continue
    }
    suspicious++
  }

  return suspicious / sample.length < 0.08
}

function mimeFromExtension(ext: string): string {
  switch (ext) {
    case 'json':
      return 'application/json'
    case 'html':
      return 'text/html'
    case 'xml':
      return 'application/xml'
    case 'css':
      return 'text/css'
    case 'js':
      return 'text/javascript'
    default:
      return 'text/plain;charset=utf-8'
  }
}

function guessExtensionFromMagic(bytes: Uint8Array): string | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return 'png'
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpg'
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return 'gif'
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return 'pdf'
  return null
}

function buildDownloadName(fileName: string | null | undefined, extension: string): string {
  if (fileName) {
    const base = fileName.replace(/[^a-zA-Z0-9._/-]/g, '_')
    if (base.includes('.')) {
      return base
    }
    return `${base}.${extension}`
  }
  return `blob-content.${extension}`
}

function detectLanguage(fileName: string | null | undefined, content: string): string {
  const ext = extensionFromName(fileName)
  if (!ext) {
    return detectLanguageFromContent(content)
  }

  switch (ext) {
    case 'ts':
      return 'typescript'
    case 'tsx':
      return 'typescript'
    case 'js':
      return 'javascript'
    case 'jsx':
      return 'javascript'
    case 'json':
      return 'json'
    case 'md':
      return 'markdown'
    case 'css':
      return 'css'
    case 'scss':
      return 'scss'
    case 'sass':
      return 'sass'
    case 'less':
      return 'less'
    case 'html':
      return 'html'
    case 'xml':
      return 'xml'
    case 'yml':
    case 'yaml':
      return 'yaml'
    case 'sh':
      return 'bash'
    case 'bash':
      return 'bash'
    case 'py':
      return 'python'
    case 'java':
      return 'java'
    case 'go':
      return 'go'
    case 'rs':
      return 'rust'
    case 'sql':
      return 'sql'
    case 'c':
      return 'c'
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp'
    case 'h':
      return 'c'
    case 'hpp':
      return 'cpp'
    case 'cs':
      return 'csharp'
    case 'php':
      return 'php'
    case 'rb':
      return 'ruby'
    case 'swift':
      return 'swift'
    case 'kt':
      return 'kotlin'
    case 'scala':
      return 'scala'
    case 'r':
      return 'r'
    case 'lua':
      return 'lua'
    case 'pl':
      return 'perl'
    case 'groovy':
      return 'groovy'
    case 'gradle':
      return 'groovy'
    case 'hcl':
      return 'hcl'
    case 'tf':
      return 'terraform'
    case 'dockerfile':
    case 'Dockerfile':
      return 'docker'
    case 'makefile':
    case 'Makefile':
      return 'makefile'
    case 'toml':
      return 'toml'
    case 'ini':
      return 'ini'
    case 'cfg':
    case 'conf':
      return 'properties'
    case 'graphql':
      return 'graphql'
    case 'wasm':
      return 'wasm'
    default:
      return detectLanguageFromContent(content)
  }
}

function detectLanguageFromContent(content: string): string {
  const head = content.slice(0, 400)

  if (head.trimStart().startsWith('{') || head.trimStart().startsWith('[')) {
    return 'json'
  }

  if (/^#!.*\b(bash|sh|zsh)\b/m.test(head)) {
    return 'bash'
  }

  if (/^#!.*\bpython\b/m.test(head)) {
    return 'python'
  }

  if (/<\/?[a-z][\s\S]*>/i.test(head)) {
    return 'html'
  }

  if (/import\s+.*\sfrom\s+['"][\w-]+['"]|import\s+{[\s\w,*]+}\s+from/m.test(head)) {
    return 'javascript'
  }

  if (/\$\(|\$\{|\.run\(|\bfunction\(|=>|\bconst\b|\blet\b|\bvar\b/m.test(head)) {
    return 'javascript'
  }

  return 'text'
}
