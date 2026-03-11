export function Hero() {
  return (
    <div className="mb-10 text-center">
      <h1 className="mb-3 bg-gradient-to-r from-primary via-sky-500 to-emerald-500 bg-clip-text font-bold text-4xl text-transparent tracking-tight md:text-5xl">
        Git Object Explorer
      </h1>
      <p className="text-lg text-muted-foreground">
        Drop a raw git object file to parse and understand its contents
      </p>
      <p className="mt-2 text-muted-foreground/70 text-sm">
        Find them in{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-primary text-sm">
          .git/objects/
        </code>{' '}
        — e.g.{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-primary text-sm">
          .git/objects/ab/cdef1234…
        </code>
      </p>
    </div>
  )
}
