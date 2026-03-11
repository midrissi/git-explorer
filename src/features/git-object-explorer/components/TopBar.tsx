import { Binary } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export function TopBar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Binary className="h-4 w-4 text-primary" />
          <span className="font-semibold tracking-tight">Git Object Explorer</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
