import { useCallback, useState } from 'react'
import { type GitObject, parseGitObject } from '@/git-parser'

export interface IndexedObjectFile {
  id: string
  folder: string
  displayPath: string
  file: File
}

interface FileWithPath {
  file: File
  path: string
}

export function useGitObjectFile() {
  const [gitObj, setGitObj] = useState<GitObject | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [objectEntries, setObjectEntries] = useState<IndexedObjectFile[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File, visibleName?: string) => {
    setError(null)
    setGitObj(null)
    setFileName(visibleName ?? file.name)

    try {
      const buffer = await file.arrayBuffer()
      const obj = await parseGitObject(buffer)
      setGitObj(obj)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse git object')
    }
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      void (async () => {
        const dropped = await getDroppedFiles(e.dataTransfer)
        if (dropped.length === 0) {
          return
        }

        const indexed = indexGitObjectFiles(dropped)
        if (indexed.length > 0) {
          const firstFolder = indexed[0].folder
          const firstInFolder = indexed.find((entry) => entry.folder === firstFolder) ?? indexed[0]

          setError(null)
          setObjectEntries(indexed)
          setSelectedFolder(firstFolder)
          setSelectedObjectId(firstInFolder.id)
          await handleFile(firstInFolder.file, firstInFolder.displayPath)
          return
        }

        setObjectEntries([])
        setSelectedFolder('')
        setSelectedObjectId(null)
        await handleFile(dropped[0].file)
      })()
    },
    [handleFile]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setObjectEntries([])
        setSelectedFolder('')
        setSelectedObjectId(null)
        void handleFile(file)
      }
    },
    [handleFile]
  )

  const onDirectoryInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      const indexed = indexGitObjectFiles(
        files.map((file) => ({
          file,
          path: file.webkitRelativePath || file.name,
        }))
      )

      if (indexed.length === 0) {
        setError('No loose git object files found under .git/objects')
        setObjectEntries([])
        setSelectedFolder('')
        setSelectedObjectId(null)
        return
      }

      const firstFolder = indexed[0].folder
      const firstInFolder = indexed.find((entry) => entry.folder === firstFolder) ?? indexed[0]

      setError(null)
      setObjectEntries(indexed)
      setSelectedFolder(firstFolder)
      setSelectedObjectId(firstInFolder.id)
      void handleFile(firstInFolder.file, firstInFolder.displayPath)
    },
    [handleFile]
  )

  const onSelectObject = useCallback(
    (entry: IndexedObjectFile) => {
      setSelectedObjectId(entry.id)
      void handleFile(entry.file, entry.displayPath)
    },
    [handleFile]
  )

  return {
    gitObj,
    error,
    isDragging,
    fileName,
    objectEntries,
    selectedFolder,
    selectedObjectId,
    onDrop,
    onDragOver,
    onDragLeave,
    onFileInput,
    onDirectoryInput,
    onSelectObject,
    setSelectedFolder,
  }
}

function indexGitObjectFiles(files: FileWithPath[]): IndexedObjectFile[] {
  const entries: IndexedObjectFile[] = []

  for (const item of files) {
    const rel = item.path
    const marker = '/objects/'
    const markerIndex = rel.indexOf(marker)
    if (markerIndex === -1) {
      continue
    }

    const objectPart = rel.slice(markerIndex + marker.length)
    if (objectPart.startsWith('pack/') || objectPart.startsWith('info/')) {
      continue
    }

    const segments = objectPart.split('/').filter(Boolean)
    if (segments.length < 2) {
      continue
    }

    const folder = segments[0]
    if (!/^[0-9a-f]{2}$/i.test(folder)) {
      continue
    }

    const displayPath = `${folder}/${segments.slice(1).join('/')}`
    entries.push({
      id: rel,
      folder: folder.toLowerCase(),
      displayPath,
      file: item.file,
    })
  }

  return entries.sort((a, b) => a.displayPath.localeCompare(b.displayPath))
}

type WebkitDataTransferItem = DataTransferItem & {
  webkitGetAsEntry?: () => FileSystemEntryLike | null
}

interface FileSystemEntryLike {
  isFile: boolean
  isDirectory: boolean
  name: string
  fullPath: string
}

interface FileSystemFileEntryLike extends FileSystemEntryLike {
  file: (success: (file: File) => void, error?: (err: DOMException) => void) => void
}

interface FileSystemDirectoryEntryLike extends FileSystemEntryLike {
  createReader: () => FileSystemDirectoryReaderLike
}

interface FileSystemDirectoryReaderLike {
  readEntries: (
    success: (entries: FileSystemEntryLike[]) => void,
    error?: (err: DOMException) => void
  ) => void
}

async function getDroppedFiles(dataTransfer: DataTransfer): Promise<FileWithPath[]> {
  const items = Array.from(dataTransfer.items)
  const hasWebkitEntries = items.some(
    (item) => typeof (item as WebkitDataTransferItem).webkitGetAsEntry === 'function'
  )

  if (hasWebkitEntries) {
    const out: FileWithPath[] = []
    for (const item of items) {
      const entry = (item as WebkitDataTransferItem).webkitGetAsEntry?.()
      if (!entry) {
        continue
      }
      const files = await readEntry(entry)
      out.push(...files)
    }
    if (out.length > 0) {
      return out
    }
  }

  return Array.from(dataTransfer.files).map((file) => ({
    file,
    path: file.webkitRelativePath || file.name,
  }))
}

async function readEntry(entry: FileSystemEntryLike): Promise<FileWithPath[]> {
  if (entry.isFile) {
    const file = await fileFromEntry(entry as FileSystemFileEntryLike)
    return [{ file, path: entry.fullPath || file.name }]
  }

  if (!entry.isDirectory) {
    return []
  }

  const dirEntry = entry as FileSystemDirectoryEntryLike
  const reader = dirEntry.createReader()
  const out: FileWithPath[] = []

  while (true) {
    const batch = await readDirectoryBatch(reader)
    if (batch.length === 0) {
      break
    }
    for (const child of batch) {
      const children = await readEntry(child)
      out.push(...children)
    }
  }

  return out
}

function fileFromEntry(entry: FileSystemFileEntryLike): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject)
  })
}

function readDirectoryBatch(reader: FileSystemDirectoryReaderLike): Promise<FileSystemEntryLike[]> {
  return new Promise((resolve, reject) => {
    reader.readEntries(resolve, reject)
  })
}
