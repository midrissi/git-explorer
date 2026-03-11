// Git object types
export type GitObjectType = 'blob' | 'tree' | 'commit' | 'tag'

export interface GitBlob {
  type: 'blob'
  size: number
  content: string
}

export interface TreeEntry {
  mode: string
  modeDescription: string
  name: string
  hash: string
}

export interface GitTree {
  type: 'tree'
  size: number
  entries: TreeEntry[]
}

export interface GitCommit {
  type: 'commit'
  size: number
  tree: string
  parents: string[]
  author: string
  committer: string
  message: string
  gpgsig?: string
}

export interface GitTag {
  type: 'tag'
  size: number
  object: string
  tagType: string
  tagName: string
  tagger: string
  message: string
}

export type GitObject = GitBlob | GitTree | GitCommit | GitTag

/**
 * Decompress a raw git object file (zlib-deflated) and parse its contents.
 */
export async function parseGitObject(data: ArrayBuffer): Promise<GitObject> {
  const decompressed = await decompress(new Uint8Array(data))
  return parseDecompressedObject(decompressed)
}

async function decompress(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate')
  const writer = ds.writable.getWriter()
  writer.write(data as unknown as BufferSource)
  writer.close()

  const reader = ds.readable.getReader()
  const chunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

function parseDecompressedObject(data: Uint8Array): GitObject {
  // Find the null byte separating header from content
  const nullIndex = data.indexOf(0)
  if (nullIndex === -1) {
    throw new Error('Invalid git object: no null byte found in header')
  }

  const header = new TextDecoder().decode(data.slice(0, nullIndex))
  const spaceIndex = header.indexOf(' ')
  if (spaceIndex === -1) {
    throw new Error(`Invalid git object header: "${header}"`)
  }

  const type = header.slice(0, spaceIndex) as GitObjectType
  const size = parseInt(header.slice(spaceIndex + 1), 10)
  const content = data.slice(nullIndex + 1)

  switch (type) {
    case 'blob':
      return parseBlob(size, content)
    case 'tree':
      return parseTree(size, content)
    case 'commit':
      return parseCommit(size, content)
    case 'tag':
      return parseTag(size, content)
    default:
      throw new Error(`Unknown git object type: "${type}"`)
  }
}

function parseBlob(size: number, content: Uint8Array): GitBlob {
  return {
    type: 'blob',
    size,
    content: new TextDecoder().decode(content),
  }
}

function parseTree(size: number, content: Uint8Array): GitTree {
  const entries: TreeEntry[] = []
  let offset = 0

  while (offset < content.length) {
    // Find space separating mode from name
    const spaceIdx = content.indexOf(0x20, offset)
    if (spaceIdx === -1) break
    const mode = new TextDecoder().decode(content.slice(offset, spaceIdx))

    // Find null byte separating name from hash
    const nullIdx = content.indexOf(0, spaceIdx + 1)
    if (nullIdx === -1) break
    const name = new TextDecoder().decode(content.slice(spaceIdx + 1, nullIdx))

    // Next 20 bytes are the SHA-1 hash
    const hashBytes = content.slice(nullIdx + 1, nullIdx + 21)
    const hash = Array.from(hashBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    entries.push({
      mode,
      modeDescription: describeModeString(mode),
      name,
      hash,
    })

    offset = nullIdx + 21
  }

  return { type: 'tree', size, entries }
}

function describeModeString(mode: string): string {
  switch (mode) {
    case '100644':
      return 'regular file'
    case '100755':
      return 'executable file'
    case '120000':
      return 'symbolic link'
    case '40000':
      return 'directory (tree)'
    case '160000':
      return 'gitlink (submodule)'
    default:
      return `unknown mode (${mode})`
  }
}

function parseCommit(size: number, content: Uint8Array): GitCommit {
  const text = new TextDecoder().decode(content)
  const lines = text.split('\n')

  let tree = ''
  const parents: string[] = []
  let author = ''
  let committer = ''
  let gpgsig: string | undefined
  let messageStart = -1
  let inGpgsig = false
  const gpgsigLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (inGpgsig) {
      gpgsigLines.push(line)
      if (line.includes('-----END')) {
        inGpgsig = false
        gpgsig = gpgsigLines.join('\n')
      }
      continue
    }

    if (line === '') {
      messageStart = i + 1
      break
    }

    if (line.startsWith('tree ')) {
      tree = line.slice(5)
    } else if (line.startsWith('parent ')) {
      parents.push(line.slice(7))
    } else if (line.startsWith('author ')) {
      author = line.slice(7)
    } else if (line.startsWith('committer ')) {
      committer = line.slice(10)
    } else if (line.startsWith('gpgsig')) {
      inGpgsig = true
      gpgsigLines.push(line.slice(7))
    }
  }

  const message = messageStart >= 0 ? lines.slice(messageStart).join('\n').trim() : ''

  return { type: 'commit', size, tree, parents, author, committer, message, gpgsig }
}

function parseTag(size: number, content: Uint8Array): GitTag {
  const text = new TextDecoder().decode(content)
  const lines = text.split('\n')

  let object = ''
  let tagType = ''
  let tagName = ''
  let tagger = ''
  let messageStart = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === '') {
      messageStart = i + 1
      break
    }
    if (line.startsWith('object ')) object = line.slice(7)
    else if (line.startsWith('type ')) tagType = line.slice(5)
    else if (line.startsWith('tag ')) tagName = line.slice(4)
    else if (line.startsWith('tagger ')) tagger = line.slice(7)
  }

  const message = messageStart >= 0 ? lines.slice(messageStart).join('\n').trim() : ''

  return { type: 'tag', size, object, tagType, tagName, tagger, message }
}

/**
 * Get a human-readable explanation of a parsed git object.
 */
export function explainGitObject(obj: GitObject): string[] {
  const explanations: string[] = []

  switch (obj.type) {
    case 'blob':
      explanations.push(`This is a **blob** object — it stores the content of a single file.`)
      explanations.push(`Size: ${obj.size} bytes`)
      explanations.push(
        `Blobs are the leaf nodes in Git's object model. They contain raw file data without any filename or metadata — those are stored in tree objects that reference this blob.`
      )
      break

    case 'tree':
      explanations.push(`This is a **tree** object — it represents a directory listing.`)
      explanations.push(`Size: ${obj.size} bytes`)
      explanations.push(
        `Contains ${obj.entries.length} entr${obj.entries.length === 1 ? 'y' : 'ies'}:`
      )
      for (const entry of obj.entries) {
        explanations.push(
          `  • \`${entry.mode}\` (${entry.modeDescription}) — **${entry.name}** → ${entry.hash}`
        )
      }
      explanations.push(
        `Tree objects map filenames and directory names to their corresponding blob (file content) or tree (subdirectory) objects. The mode indicates the file type and permissions.`
      )
      break

    case 'commit':
      explanations.push(
        `This is a **commit** object — it records a snapshot of the project at a point in time.`
      )
      explanations.push(`Size: ${obj.size} bytes`)
      explanations.push(`Tree: ${obj.tree}`)
      if (obj.parents.length === 0) {
        explanations.push(`Parents: none (this is a root commit)`)
      } else {
        explanations.push(
          `Parent${obj.parents.length > 1 ? 's' : ''}: ${obj.parents.join(', ')}${obj.parents.length > 1 ? ' (this is a merge commit)' : ''}`
        )
      }
      explanations.push(`Author: ${obj.author}`)
      explanations.push(`Committer: ${obj.committer}`)
      if (obj.gpgsig) {
        explanations.push(`GPG Signature: present (commit is signed)`)
      }
      explanations.push(`Message: ${obj.message}`)
      explanations.push(
        `The commit points to a tree object (the project snapshot), lists parent commits (history), and records who authored and committed the change.`
      )
      break

    case 'tag':
      explanations.push(
        `This is a **tag** (annotated tag) object — it provides a named reference to another Git object.`
      )
      explanations.push(`Size: ${obj.size} bytes`)
      explanations.push(`Points to: ${obj.object} (${obj.tagType})`)
      explanations.push(`Tag name: ${obj.tagName}`)
      explanations.push(`Tagger: ${obj.tagger}`)
      explanations.push(`Message: ${obj.message}`)
      explanations.push(
        `Annotated tags are full objects in the Git database. Unlike lightweight tags (which are just refs), annotated tags store the tagger, date, message, and optionally a GPG signature.`
      )
      break
  }

  return explanations
}
