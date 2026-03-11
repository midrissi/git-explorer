import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppState } from '@/features/git-object-explorer/stores/indexedDB'
import { idb } from '@/features/git-object-explorer/stores/indexedDB'
import type { IndexedObjectFile } from '@/features/git-object-explorer/useGitObjectFile'
import type { GitObject } from '@/git-parser'

export function useIndexedDBState() {
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const [navigationHistory, setNavigationHistory] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [savedState, setSavedState] = useState<Pick<
    AppState,
    'selectedObjectId' | 'selectedFolder'
  > | null>(null)
  const historyIndexRef = useRef(-1)

  useEffect(() => {
    historyIndexRef.current = historyIndex
  }, [historyIndex])

  // Initialize from IndexedDB
  useEffect(() => {
    const init = async () => {
      try {
        await idb.init()
        const history = await idb.getHistory(100)
        const state = await idb.getState()

        if (history.length > 0) {
          const historyIds = history.map((h) => h.objectId)
          setNavigationHistory(historyIds)
          setHistoryIndex(historyIds.length - 1)
        }

        if (state) {
          setSavedState({
            selectedObjectId: state.selectedObjectId,
            selectedFolder: state.selectedFolder,
          })
        }

        // Cleanup old objects
        await idb.closeOldObjects(7)
      } catch (error) {
        console.error('Failed to initialize IndexedDB state:', error)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  const addToHistory = useCallback((entry: IndexedObjectFile) => {
    setNavigationHistory((prev) => {
      const currentIndex = historyIndexRef.current
      const newHistory = prev.slice(0, currentIndex + 1)

      if (newHistory[newHistory.length - 1] === entry.id) {
        if (newHistory.length !== prev.length) {
          setHistoryIndex(newHistory.length - 1)
          historyIndexRef.current = newHistory.length - 1
          return newHistory
        }
        return prev
      }

      newHistory.push(entry.id)
      const newIndex = newHistory.length - 1
      setHistoryIndex(newIndex)
      historyIndexRef.current = newIndex

      // Persist to IndexedDB
      void idb
        .addHistoryEntry(`${Date.now()}-${newIndex}`, entry.id, entry.displayPath, newIndex)
        .catch((error) => {
          console.warn('Failed to persist navigation history entry:', error)
        })

      return newHistory
    })
  }, [])

  const goBack = useCallback(() => {
    setHistoryIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const goForward = useCallback(() => {
    setHistoryIndex((prev) => Math.min(navigationHistory.length - 1, prev + 1))
  }, [navigationHistory.length])

  const saveObject = useCallback((hash: string, object: GitObject, fileName?: string) => {
    void idb.saveObject(hash, object, fileName).catch((error) => {
      console.warn('Failed to persist object cache:', error)
    })
  }, [])

  const saveState = useCallback(
    (
      selectedObjectId: string | null,
      selectedFolder: string | null,
      objectEntries: IndexedObjectFile[]
    ) => {
      void idb
        .saveState({
          selectedObjectId,
          selectedFolder,
          objectEntries: objectEntries.map((entry) => ({
            id: entry.id,
            folder: entry.folder,
            displayPath: entry.displayPath,
            objectType: entry.objectType,
          })),
        })
        .catch((error) => {
          console.warn('Failed to persist explorer state:', error)
        })
    },
    []
  )

  const clearPersistedData = useCallback(async () => {
    await idb.clearAll()
    setNavigationHistory([])
    setHistoryIndex(-1)
    setSavedState(null)
  }, [])

  return {
    historyIndex,
    navigationHistory,
    isLoading,
    savedState,
    addToHistory,
    goBack,
    goForward,
    canGoBack: historyIndex > 0,
    canGoForward: historyIndex < navigationHistory.length - 1,
    saveObject,
    saveState,
    clearPersistedData,
  }
}
