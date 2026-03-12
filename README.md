# Git Object Explorer

Interactive web app for exploring loose Git objects from .git/objects.

## Features

- Import a single loose object file or an entire .git/objects directory
- Parse and inspect commit, tree, blob, and tag objects
- Click hash links to navigate between related objects
- Filter the object browser by type (Explorer, Commits, Trees, Blobs, Tags)
- Navigation history with back/forward controls
- IndexedDB persistence for cached objects and explorer state
- Clear cached data from the UI

## Development

Install dependencies and start dev server:

```bash
bun install
bun run dev
```

Build for production:

```bash
bun run build
```

Run formatting and linting:

```bash
bun run format
bun run lint:fix
bun run check:fix
```
