import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DropZoneCard } from '@/features/git-object-explorer/components/DropZoneCard'
import { ExplanationCard } from '@/features/git-object-explorer/components/ExplanationCard'
import { Hero } from '@/features/git-object-explorer/components/Hero'
import { ObjectBrowserCard } from '@/features/git-object-explorer/components/ObjectBrowserCard'
import { ObjectDetails } from '@/features/git-object-explorer/components/ObjectDetails'
import { SummaryBar } from '@/features/git-object-explorer/components/SummaryBar'
import { TopBar } from '@/features/git-object-explorer/components/TopBar'
import { useIndexedDBState } from '@/features/git-object-explorer/hooks/useIndexedDBState'
import {
  type IndexedObjectFile,
  useGitObjectFile,
} from '@/features/git-object-explorer/useGitObjectFile'
import { explainGitObject } from '@/git-parser'

function App() {
  const {
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
    resetData,
  } = useGitObjectFile()

  const {
    historyIndex,
    navigationHistory,
    isLoading,
    savedState,
    addToHistory,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    saveObject,
    saveState,
    clearPersistedData,
  } = useIndexedDBState()

  const objectBrowserRef = useRef<{ scrollToObject: (id: string) => void } | null>(null)
  const hasRestoredStateRef = useRef(false)
  const [isClearingData, setIsClearingData] = useState(false)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  const explanations = gitObj ? explainGitObject(gitObj) : []
  const hasExplorer = objectEntries.length > 0

  useEffect(() => {
    if (gitObj && fileName) {
      saveObject(fileName, gitObj, fileName)
    }
  }, [gitObj, fileName, saveObject])

  useEffect(() => {
    saveState(selectedObjectId, selectedFolder, objectEntries)
  }, [selectedObjectId, selectedFolder, objectEntries, saveState])

  useEffect(() => {
    if (hasRestoredStateRef.current) {
      return
    }
    if (!savedState || objectEntries.length === 0) {
      return
    }

    if (savedState.selectedFolder) {
      setSelectedFolder(savedState.selectedFolder)
    }

    if (savedState.selectedObjectId) {
      const entry = objectEntries.find((item) => item.id === savedState.selectedObjectId)
      if (entry) {
        onSelectObject(entry)
      }
    }

    hasRestoredStateRef.current = true
  }, [savedState, objectEntries, onSelectObject, setSelectedFolder])

  const selectObject = useCallback(
    (entry: IndexedObjectFile, shouldTrackHistory = true, shouldScroll = false) => {
      if (shouldTrackHistory) {
        addToHistory(entry)
      }
      onSelectObject(entry)
      if (shouldScroll) {
        objectBrowserRef.current?.scrollToObject(entry.id)
      }
    },
    [addToHistory, onSelectObject]
  )

  const findObjectByHash = useCallback(
    (hash: string): IndexedObjectFile | undefined => {
      const normalizedHash = hash.toLowerCase()
      return objectEntries.find((entry) =>
        entry.displayPath.replace('/', '').toLowerCase().startsWith(normalizedHash)
      )
    },
    [objectEntries]
  )

  const canHashClick = useCallback(
    (hash: string): boolean => {
      return !!findObjectByHash(hash)
    },
    [findObjectByHash]
  )

  const handleHashClick = useCallback(
    (hash: string) => {
      const entry = findObjectByHash(hash)
      if (entry) {
        selectObject(entry, true, true)
      }
    },
    [findObjectByHash, selectObject]
  )

  const handleObjectBrowserSelect = useCallback(
    (entry: IndexedObjectFile) => {
      selectObject(entry)
    },
    [selectObject]
  )

  const handleNavigateHistoryBack = useCallback(() => {
    if (!canGoBack) {
      return
    }

    const nextId = navigationHistory[historyIndex - 1]
    goBack()

    const entry = objectEntries.find((item) => item.id === nextId)
    if (entry) {
      onSelectObject(entry)
      objectBrowserRef.current?.scrollToObject(entry.id)
    }
  }, [canGoBack, goBack, historyIndex, navigationHistory, objectEntries, onSelectObject])

  const handleNavigateHistoryForward = useCallback(() => {
    if (!canGoForward) {
      return
    }

    const nextId = navigationHistory[historyIndex + 1]
    goForward()

    const entry = objectEntries.find((item) => item.id === nextId)
    if (entry) {
      onSelectObject(entry)
      objectBrowserRef.current?.scrollToObject(entry.id)
    }
  }, [canGoForward, goForward, historyIndex, navigationHistory, objectEntries, onSelectObject])

  const closeClearModal = useCallback(() => {
    if (!isClearingData) {
      setIsClearModalOpen(false)
    }
  }, [isClearingData])

  useEffect(() => {
    if (!isClearModalOpen) {
      return
    }

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeClearModal()
      }
    }

    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [closeClearModal, isClearModalOpen])

  const handleClearData = useCallback(async () => {
    setIsClearingData(true)
    try {
      await clearPersistedData()
      resetData()
      hasRestoredStateRef.current = false
      setIsClearModalOpen(false)
    } catch (error) {
      console.error('Failed to clear persisted data:', error)
    } finally {
      setIsClearingData(false)
    }
  }, [clearPersistedData, resetData])

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="-z-10 pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute top-16 right-0 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <TopBar />

      <main className="mx-auto max-w-7xl px-4 py-10">
        <Hero />

        <DropZoneCard
          isDragging={isDragging}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onFileInput={onFileInput}
          onDirectoryInput={onDirectoryInput}
        />

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Parse Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasExplorer ? (
          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
            <div className="xl:sticky xl:top-20 xl:h-[calc(100vh-6rem)] xl:overflow-hidden">
              <ObjectBrowserCard
                ref={objectBrowserRef}
                entries={objectEntries}
                selectedFolder={selectedFolder}
                selectedObjectId={selectedObjectId}
                onSelectFolder={setSelectedFolder}
                onSelectObject={handleObjectBrowserSelect}
                onClearData={() => setIsClearModalOpen(true)}
                isClearingData={isClearingData}
              />
            </div>

            <div className="space-y-6 overflow-hidden px-1">
              {gitObj ? (
                <>
                  <SummaryBar
                    gitObj={gitObj}
                    fileName={fileName}
                    onGoBack={handleNavigateHistoryBack}
                    onGoForward={handleNavigateHistoryForward}
                    canGoBack={canGoBack}
                    canGoForward={canGoForward}
                  />
                  <ExplanationCard
                    explanations={explanations}
                    onHashClick={handleHashClick}
                    canHashClick={canHashClick}
                  />
                  <ObjectDetails
                    gitObj={gitObj}
                    fileName={fileName}
                    objectEntries={objectEntries}
                    onSelectObject={handleObjectBrowserSelect}
                    onHashClick={handleHashClick}
                  />
                </>
              ) : (
                <Alert>
                  <AlertTitle>Select an object</AlertTitle>
                  <AlertDescription>
                    Choose a node in the left tree to parse and view details.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        ) : (
          gitObj && (
            <div className="mt-8 space-y-6">
              <SummaryBar
                gitObj={gitObj}
                fileName={fileName}
                onGoBack={handleNavigateHistoryBack}
                onGoForward={handleNavigateHistoryForward}
                canGoBack={canGoBack}
                canGoForward={canGoForward}
              />
              <ExplanationCard
                explanations={explanations}
                onHashClick={handleHashClick}
                canHashClick={canHashClick}
              />
              <ObjectDetails
                gitObj={gitObj}
                fileName={fileName}
                objectEntries={objectEntries}
                onSelectObject={handleObjectBrowserSelect}
                onHashClick={handleHashClick}
              />
            </div>
          )
        )}
      </main>

      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-background/75 backdrop-blur-sm"
            onClick={closeClearModal}
            aria-label="Close clear data dialog"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-data-title"
            className="relative w-full max-w-md rounded-xl border border-rose-400/30 bg-card p-5 shadow-2xl"
          >
            <h2 id="clear-data-title" className="font-semibold text-base text-foreground">
              Clear all cached data?
            </h2>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              This will remove cached objects, navigation history, and saved explorer state. This
              action cannot be undone.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={closeClearModal} disabled={isClearingData}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  void handleClearData()
                }}
                disabled={isClearingData}
              >
                {isClearingData ? 'Clearing...' : 'Clear Data'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
