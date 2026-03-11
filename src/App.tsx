import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DropZoneCard } from '@/features/git-object-explorer/components/DropZoneCard'
import { ExplanationCard } from '@/features/git-object-explorer/components/ExplanationCard'
import { Hero } from '@/features/git-object-explorer/components/Hero'
import { ObjectDetails } from '@/features/git-object-explorer/components/ObjectDetails'
import { SummaryBar } from '@/features/git-object-explorer/components/SummaryBar'
import { TopBar } from '@/features/git-object-explorer/components/TopBar'
import { useGitObjectFile } from '@/features/git-object-explorer/useGitObjectFile'
import { explainGitObject } from '@/git-parser'

function App() {
  const { gitObj, error, isDragging, fileName, onDrop, onDragOver, onDragLeave, onFileInput } =
    useGitObjectFile()

  const explanations = gitObj ? explainGitObject(gitObj) : []

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="-z-10 pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute top-16 right-0 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <TopBar />

      <main className="mx-auto max-w-4xl px-4 py-10">
        <Hero />

        <DropZoneCard
          isDragging={isDragging}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onFileInput={onFileInput}
        />

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Parse Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {gitObj && (
          <div className="mt-8 space-y-6">
            <SummaryBar gitObj={gitObj} fileName={fileName} />
            <ExplanationCard explanations={explanations} />
            <ObjectDetails gitObj={gitObj} fileName={fileName} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
