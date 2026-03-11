export interface ConventionalCommit {
  type: string
  scope?: string
  breaking: boolean
  description: string
  body?: string
  footers: Record<string, string[]>
}

const CONVENTIONAL_TYPES = new Set([
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
  'wip',
  'deprecate',
])

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  feat: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
  fix: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30',
  },
  docs: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
  },
  style: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
  },
  refactor: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
  },
  perf: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30',
  },
  test: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/30',
  },
  build: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  ci: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  chore: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/30',
  },
  revert: {
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/30',
  },
  wip: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/30',
  },
  deprecate: {
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/30',
  },
}

const DEFAULT_COLORS = { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' }

export function getTypeColors(type: string) {
  return TYPE_COLORS[type] || DEFAULT_COLORS
}

export function parseConventionalCommit(message: string): ConventionalCommit | null {
  const lines = message.split('\n')
  const firstLine = lines[0]

  // Conventional commit regex: type(scope)?: description or type!: description
  const match = firstLine.match(/^([a-z]+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/i)

  if (!match) {
    return null
  }

  const [, type, scope, breaking, description] = match
  const typeNormalized = type.toLowerCase()

  // Check if it's a known conventional type
  if (!CONVENTIONAL_TYPES.has(typeNormalized)) {
    return null
  }

  // Parse body and footers
  // Skip the first line and any leading blank lines
  let contentStartIdx = 1
  while (contentStartIdx < lines.length && lines[contentStartIdx].trim() === '') {
    contentStartIdx++
  }

  // Find where footers start (lines that match "key: value" pattern at the end)
  const contentLines = lines.slice(contentStartIdx)
  let footerStartIdx = contentLines.length

  // Walk backwards to find where footers start
  for (let i = contentLines.length - 1; i >= 0; i--) {
    const trimmed = contentLines[i].trim()
    if (trimmed === '') {
      continue
    }
    // Stop if we hit a line that doesn't look like a footer
    if (!trimmed.match(/^([\w-]+):\s*(.+)$/)) {
      footerStartIdx = i + 1
      break
    }
  }

  // Extract body (everything before footers, trimmed of trailing blanks)
  const bodyLines = contentLines.slice(0, footerStartIdx)
  const bodyContent = bodyLines.join('\n').trimEnd()
  const body = bodyContent ? bodyContent : undefined

  // Extract footers
  const footerLines = contentLines.slice(footerStartIdx)
  const footers: Record<string, string[]> = {}

  for (const line of footerLines) {
    const trimmed = line.trim()
    if (trimmed === '') continue

    const footerMatch = trimmed.match(/^([\w-]+):\s*(.+)$/)
    if (footerMatch) {
      const [, key, value] = footerMatch
      const keyNormalized = key.toLowerCase()
      if (!footers[keyNormalized]) {
        footers[keyNormalized] = []
      }
      footers[keyNormalized].push(value)
    }
  }

  return {
    type: typeNormalized,
    scope: scope || undefined,
    breaking: !!breaking,
    description,
    body,
    footers,
  }
}
