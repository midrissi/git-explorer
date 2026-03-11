import { FolderGit2 } from 'lucide-react'
import { useRef } from 'react'
import { Card } from '@/components/ui/card'

export function DropZoneCard({
  isDragging,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileInput,
  onDirectoryInput,
}: {
  isDragging: boolean
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDirectoryInput: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dirInputRef = useRef<HTMLInputElement>(null)

  return (
    <Card
      className={`relative cursor-pointer border-2 border-dashed transition-colors ${
        isDragging
          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      }`}
    >
      <button
        type="button"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className="w-full p-12 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          onChange={onFileInput}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <input
          ref={dirInputRef}
          type="file"
          multiple
          onChange={onDirectoryInput}
          className="hidden"
          {...({ webkitdirectory: '' } as Record<string, string>)}
        />
        <div className="space-y-3">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/25 bg-primary/15">
            <FolderGit2 className="h-7 w-7 text-primary" />
          </div>
          <p className="font-medium text-foreground text-lg">
            Drag &amp; drop a git object file or .git folder here
          </p>
          <p className="text-muted-foreground text-sm">or click to browse a file or folder</p>
        </div>
      </button>
    </Card>
  )
}
