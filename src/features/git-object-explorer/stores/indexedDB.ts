import type { GitObject } from '@/git-parser'

const DB_NAME = 'git-explorer'
const DB_VERSION = 1
const OBJECTS_STORE = 'git-objects'
const STATE_STORE = 'app-state'
const HISTORY_STORE = 'navigation-history'

export interface StoredObject {
  hash: string
  object: GitObject
  fileName?: string
  timestamp: number
}

export interface AppState {
  key: string
  selectedObjectId: string | null
  selectedFolder: string | null
  objectEntries: Array<{
    id: string
    folder: string
    displayPath: string
    objectType?: GitObject['type']
  }>
  lastVisited: number
}

export interface HistoryEntry {
  id: string
  objectId: string
  hash: string
  timestamp: number
  sequence: number
}

class IndexedDBStore {
  private db: IDBDatabase | null = null

  private isClosingError(error: unknown): boolean {
    if (!(error instanceof DOMException)) {
      return false
    }

    return error.name === 'InvalidStateError' || error.message.includes('closing')
  }

  private async resetConnection(): Promise<void> {
    if (this.db) {
      try {
        this.db.close()
      } catch {
        // best effort close
      }
      this.db = null
    }
  }

  private async withDbRetry<T>(operation: (db: IDBDatabase) => Promise<T>): Promise<T> {
    try {
      const db = await this.getDb()
      return await operation(db)
    } catch (error) {
      if (!this.isClosingError(error)) {
        throw error
      }

      await this.resetConnection()
      await this.init()

      const db = await this.getDb()
      return operation(db)
    }
  }

  private async getDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }

    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB')
    }

    return this.db
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result

        this.db.onclose = () => {
          if (this.db === request.result) {
            this.db = null
          }
        }

        this.db.onversionchange = () => {
          if (this.db === request.result) {
            this.db.close()
            this.db = null
          }
        }

        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(OBJECTS_STORE)) {
          const store = db.createObjectStore(OBJECTS_STORE, { keyPath: 'hash' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains(STATE_STORE)) {
          db.createObjectStore(STATE_STORE, { keyPath: 'key' })
        }

        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          const historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' })
          historyStore.createIndex('sequence', 'sequence', { unique: false })
        }
      }
    })
  }

  async saveObject(hash: string, object: GitObject, fileName?: string): Promise<void> {
    return this.withDbRetry(
      async (db) =>
        new Promise((resolve, reject) => {
          let tx: IDBTransaction
          try {
            tx = db.transaction([OBJECTS_STORE], 'readwrite')
          } catch (error) {
            reject(error)
            return
          }

          const store = tx.objectStore(OBJECTS_STORE)
          const request = store.put({
            hash,
            object,
            fileName,
            timestamp: Date.now(),
          } as StoredObject)

          request.onerror = () => reject(request.error)
          request.onsuccess = () => resolve()
        })
    )
  }

  async getObject(hash: string): Promise<StoredObject | undefined> {
    return this.withDbRetry(
      async (db) =>
        new Promise((resolve, reject) => {
          let tx: IDBTransaction
          try {
            tx = db.transaction([OBJECTS_STORE], 'readonly')
          } catch (error) {
            reject(error)
            return
          }

          const store = tx.objectStore(OBJECTS_STORE)
          const request = store.get(hash)

          request.onerror = () => reject(request.error)
          request.onsuccess = () => resolve(request.result)
        })
    )
  }

  async saveState(state: Partial<AppState>): Promise<void> {
    return this.withDbRetry(
      async (db) =>
        new Promise((resolve, reject) => {
          let tx: IDBTransaction
          try {
            tx = db.transaction([STATE_STORE], 'readwrite')
          } catch (error) {
            reject(error)
            return
          }

          const store = tx.objectStore(STATE_STORE)

          const current: AppState = {
            key: 'current',
            selectedObjectId: state.selectedObjectId ?? null,
            selectedFolder: state.selectedFolder ?? null,
            objectEntries: state.objectEntries ?? [],
            lastVisited: Date.now(),
          }

          const request = store.put(current)
          request.onerror = () => reject(request.error)
          request.onsuccess = () => resolve()
        })
    )
  }

  async getState(): Promise<AppState | undefined> {
    return this.withDbRetry(
      async (db) =>
        new Promise((resolve, reject) => {
          let tx: IDBTransaction
          try {
            tx = db.transaction([STATE_STORE], 'readonly')
          } catch (error) {
            reject(error)
            return
          }

          const store = tx.objectStore(STATE_STORE)
          const request = store.get('current')

          request.onerror = () => reject(request.error)
          request.onsuccess = () => resolve(request.result)
        })
    )
  }

  async addHistoryEntry(
    id: string,
    objectId: string,
    hash: string,
    sequence: number
  ): Promise<void> {
    return this.withDbRetry(
      async (db) =>
        new Promise((resolve, reject) => {
          let tx: IDBTransaction
          try {
            tx = db.transaction([HISTORY_STORE], 'readwrite')
          } catch (error) {
            reject(error)
            return
          }

          const store = tx.objectStore(HISTORY_STORE)

          const request = store.put({
            id,
            objectId,
            hash,
            sequence,
            timestamp: Date.now(),
          } as HistoryEntry)

          request.onerror = () => reject(request.error)
          request.onsuccess = () => resolve()
        })
    )
  }

  async getHistory(limit: number = 100): Promise<HistoryEntry[]> {
    return this.withDbRetry(
      async (db) =>
        new Promise((resolve) => {
          let tx: IDBTransaction
          try {
            tx = db.transaction([HISTORY_STORE], 'readonly')
          } catch {
            resolve([])
            return
          }

          const store = tx.objectStore(HISTORY_STORE)
          const request = store.getAll()

          request.onsuccess = () => {
            const results = (request.result as HistoryEntry[]).sort(
              (a, b) => a.sequence - b.sequence
            )
            resolve(results.slice(-limit))
          }

          request.onerror = () => resolve([])
        })
    )
  }

  async clearHistory(): Promise<void> {
    return this.withDbRetry(
      async (db) =>
        new Promise((resolve, reject) => {
          let tx: IDBTransaction
          try {
            tx = db.transaction([HISTORY_STORE], 'readwrite')
          } catch (error) {
            reject(error)
            return
          }

          const store = tx.objectStore(HISTORY_STORE)
          const request = store.clear()

          request.onerror = () => reject(request.error)
          request.onsuccess = () => resolve()
        })
    )
  }

  async clearAll(): Promise<void> {
    return this.withDbRetry(
      async (db) =>
        new Promise((resolve, reject) => {
          let tx: IDBTransaction
          try {
            tx = db.transaction([OBJECTS_STORE, STATE_STORE, HISTORY_STORE], 'readwrite')
          } catch (error) {
            reject(error)
            return
          }

          tx.objectStore(OBJECTS_STORE).clear()
          tx.objectStore(STATE_STORE).clear()
          tx.objectStore(HISTORY_STORE).clear()

          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
          tx.onabort = () => reject(tx.error)
        })
    )
  }

  async closeOldObjects(daysOld: number = 7): Promise<void> {
    const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000

    return this.withDbRetry(
      async (db) =>
        new Promise((resolve, reject) => {
          let tx: IDBTransaction
          try {
            tx = db.transaction([OBJECTS_STORE], 'readwrite')
          } catch (error) {
            reject(error)
            return
          }

          const store = tx.objectStore(OBJECTS_STORE)
          const index = store.index('timestamp')
          const range = IDBKeyRange.upperBound(cutoff)
          const request = index.openCursor(range)

          request.onerror = () => reject(request.error)
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
            if (cursor) {
              cursor.delete()
              cursor.continue()
            } else {
              resolve()
            }
          }
        })
    )
  }
}

export const idb = new IndexedDBStore()
