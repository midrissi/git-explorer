import { Laptop2, MoonStar, Sun } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
  const icon =
    theme === 'dark' ? (
      <MoonStar className="h-4 w-4" />
    ) : theme === 'light' ? (
      <Sun className="h-4 w-4" />
    ) : (
      <Laptop2 className="h-4 w-4" />
    )

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      title={`Current: ${theme}. Click for ${next}`}
      className="rounded-full border border-border/60 bg-card/60"
    >
      {icon}
    </Button>
  )
}
