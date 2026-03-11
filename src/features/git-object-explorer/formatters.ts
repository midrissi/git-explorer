export function shortHash(value: string): string {
  if (/^[0-9a-f]{40}$/i.test(value)) {
    return value.slice(0, 7)
  }
  return value
}

export function shortenHashesInText(text: string): string {
  return text.replace(/\b[0-9a-f]{40}\b/gi, (hash) => hash.slice(0, 7))
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value)
}

export function formatNumbersInText(text: string): string {
  return text.replace(/\b\d{4,}\b/g, (num) => {
    if (/^[0-9a-f]{7,}$/i.test(num)) {
      return num
    }
    return formatNumber(Number(num))
  })
}

export function markdownInline(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(
      /`(.+?)`/g,
      '<code class="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-primary">$1</code>'
    )
}
