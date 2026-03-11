export function Hero() {
  return (
    <div className="mb-10 text-center">
      <h1 className="mb-3 bg-gradient-to-r from-primary via-sky-500 to-emerald-500 bg-clip-text font-bold text-4xl text-transparent tracking-tight md:text-5xl">
        Git Object Explorer
      </h1>
      <p className="text-lg text-muted-foreground">
        Inspect loose Git objects, follow linked hashes, and understand object internals instantly.
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-muted-foreground">
          Folder Import
        </span>
        <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-muted-foreground">
          Type Tabs
        </span>
        <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-muted-foreground">
          Persistent Cache
        </span>
      </div>
      <p className="mt-2 text-muted-foreground/70 text-sm">
        Drop a single object file or import the full{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-primary text-sm">
          .git/objects/
        </code>{' '}
        directory, e.g.{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-primary text-sm">
          .git/objects/ab/cdef1234…
        </code>
      </p>
    </div>
  )
}
