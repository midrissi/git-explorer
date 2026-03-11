import { useCallback, useState } from 'react'
import { type GitObject, parseGitObject } from '@/git-parser'

export function useGitObjectFile() {
  const [gitObj, setGitObj] = useState<GitObject | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setGitObj(null)
    setFileName(file.name)

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
      const file = e.dataTransfer.files[0]
      if (file) {
        void handleFile(file)
      }
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
        void handleFile(file)
      }
    },
    [handleFile]
  )

  return {
    gitObj,
    error,
    isDragging,
    fileName,
    onDrop,
    onDragOver,
    onDragLeave,
    onFileInput,
  }
}
