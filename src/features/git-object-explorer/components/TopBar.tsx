import { Binary, Github } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export function TopBar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Binary className="h-4 w-4 text-primary" />
          <span className="font-semibold tracking-tight">Git Object Explorer</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/midrissi/git-explorer"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/30 px-2 py-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
            aria-label="Open project on GitHub"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
