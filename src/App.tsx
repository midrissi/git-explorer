import { useState, useCallback } from "react";
import {
  parseGitObject,
  explainGitObject,
  type GitObject,
} from "./git-parser";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Binary,
  CalendarClock,
  FileCode2,
  FolderGit2,
  GitBranch,
  GitCommitHorizontal,
  KeyRound,
  Signature,
  Tag,
  UserCircle2,
} from "lucide-react";

function App() {
  const [gitObj, setGitObj] = useState<GitObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setGitObj(null);
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const obj = await parseGitObject(buffer);
      setGitObj(obj);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse git object");
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const explanations = gitObj ? explainGitObject(gitObj) : [];
  const objectIcon = objectTypeIcon(gitObj?.type);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute right-0 top-16 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Binary className="h-4 w-4 text-primary" />
            <span className="font-semibold tracking-tight">Git Object Explorer</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-primary via-sky-500 to-emerald-500 bg-clip-text text-transparent">
            Git Object Explorer
          </h1>
          <p className="text-muted-foreground text-lg">
            Drop a raw git object file to parse and understand its contents
          </p>
          <p className="text-muted-foreground/70 text-sm mt-2">
            Find them in{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-primary">
              .git/objects/
            </code>{" "}
            — e.g.{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-primary">
              .git/objects/ab/cdef1234…
            </code>
          </p>
        </div>

        {/* Drop zone */}
        <Card
          className={`relative cursor-pointer transition-colors border-dashed border-2 ${
            isDragging
              ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <div
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className="p-12 text-center"
          >
            <input
              type="file"
              onChange={onFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/15 border border-primary/25 grid place-items-center">
                <FolderGit2 className="h-7 w-7 text-primary" />
              </div>
              <p className="text-foreground text-lg font-medium">
                Drag &amp; drop a git object file here
              </p>
              <p className="text-muted-foreground text-sm">or click to browse</p>
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Parse Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {gitObj && (
          <div className="mt-8 space-y-6">
            {/* Object type badge + filename */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={typeBadgeVariant(gitObj.type)} className={`uppercase text-xs tracking-wider ${typeBadgeClass(gitObj.type)}`}>
                {gitObj.type}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                size: {formatNumber(gitObj.size)} bytes
              </Badge>
              {fileName && (
                <span className="text-muted-foreground text-sm font-mono rounded-md bg-muted px-2 py-1">
                  {fileName}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FactPill
                icon={objectIcon}
                label="Object Type"
                value={gitObj.type.toUpperCase()}
                tone="primary"
              />
              <FactPill
                icon={<Binary className="h-4 w-4" />}
                label="Payload Size"
                value={`${formatNumber(gitObj.size)} bytes`}
                tone="sky"
              />
              <FactPill
                icon={<FileCode2 className="h-4 w-4" />}
                label="Input"
                value={fileName ?? "uploaded file"}
                tone="emerald"
              />
            </div>

            {/* Explanation card */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Explanation
                </CardTitle>
                <CardDescription>How this git object works</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {explanations.map((line, i) => (
                  <p
                    key={i}
                    className="text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: markdownInline(formatNumbersInText(shortenHashesInText(line))) }}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Blob content */}
            {gitObj.type === "blob" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode2 className="h-4 w-4 text-emerald-500" />
                    File Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm overflow-x-auto whitespace-pre-wrap font-mono bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                    {gitObj.content}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Tree entries */}
            {gitObj.type === "tree" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-sky-500" />
                    Tree Entries
                  </CardTitle>
                  <CardDescription>
                    {formatNumber(gitObj.entries.length)} entr{gitObj.entries.length === 1 ? "y" : "ies"} in this directory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mode</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="font-mono">SHA-1</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gitObj.entries.map((entry, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-primary">
                            {entry.mode}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {entry.modeDescription}
                          </TableCell>
                          <TableCell className="font-medium">
                            {entry.name}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {shortHash(entry.hash)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Commit details */}
            {gitObj.type === "commit" && (
              <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitCommitHorizontal className="h-4 w-4 text-amber-500" />
                    Commit Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <DetailRow label="Tree" value={shortHash(gitObj.tree)} mono icon={<GitBranch className="h-4 w-4 text-sky-500" />} />
                  {gitObj.parents.map((p, i) => (
                    <DetailRow
                      key={i}
                      label={`Parent${gitObj.parents.length > 1 ? ` ${i + 1}` : ""}`}
                      value={shortHash(p)}
                      mono
                      icon={<GitCommitHorizontal className="h-4 w-4 text-orange-500" />}
                    />
                  ))}
                  <DetailRow label="Author" value={gitObj.author} icon={<UserCircle2 className="h-4 w-4 text-emerald-500" />} />
                  <DetailRow label="Committer" value={gitObj.committer} icon={<CalendarClock className="h-4 w-4 text-indigo-500" />} />
                  {gitObj.gpgsig && (
                    <DetailRow
                      label="GPG Sig"
                      value={<span className="font-semibold text-emerald-600 dark:text-emerald-400">Verified signature present</span>}
                      icon={<Signature className="h-4 w-4 text-violet-500" />}
                    />
                  )}
                  <div className="pt-3 mt-3 border-t">
                    <span className="text-muted-foreground text-sm inline-flex items-center gap-2">
                      <FileCode2 className="h-4 w-4 text-primary" />
                      Message
                    </span>
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-sm bg-muted/80 border border-amber-500/30 rounded-lg p-3">
                      {gitObj.message}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tag details */}
            {gitObj.type === "tag" && (
              <Card className="border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-fuchsia-500" />
                    Tag Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <DetailRow label="Object" value={shortHash(gitObj.object)} mono icon={<Binary className="h-4 w-4 text-primary" />} />
                  <DetailRow label="Type" value={gitObj.tagType} icon={<Tag className="h-4 w-4 text-fuchsia-500" />} />
                  <DetailRow label="Tag Name" value={gitObj.tagName} icon={<KeyRound className="h-4 w-4 text-emerald-500" />} />
                  <DetailRow label="Tagger" value={gitObj.tagger} icon={<UserCircle2 className="h-4 w-4 text-sky-500" />} />
                  <div className="pt-3 mt-3 border-t">
                    <span className="text-muted-foreground text-sm inline-flex items-center gap-2">
                      <FileCode2 className="h-4 w-4 text-primary" />
                      Message
                    </span>
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-sm bg-muted/80 border border-fuchsia-500/30 rounded-lg p-3">
                      {gitObj.message}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 text-sm items-start">
      <span className="text-muted-foreground min-w-[110px] shrink-0 inline-flex items-center gap-2">
        {icon}
        {label}:
      </span>
      <span className={`break-all ${mono ? "font-mono text-xs mt-0.5" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function FactPill({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "primary" | "sky" | "emerald";
}) {
  const toneClass =
    tone === "primary"
      ? "border-primary/30 bg-primary/10"
      : tone === "sky"
        ? "border-sky-500/30 bg-sky-500/10"
        : "border-emerald-500/30 bg-emerald-500/10";

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <p className="text-xs text-muted-foreground inline-flex items-center gap-2">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium mt-1 break-all">{value}</p>
    </div>
  );
}

function typeBadgeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "blob":
    case "tree":
    case "commit":
      return "default";
    case "tag":
      return "secondary";
    default:
      return "outline";
  }
}

function typeBadgeClass(type: string): string {
  switch (type) {
    case "blob":
      return "bg-emerald-500 text-black hover:bg-emerald-400";
    case "tree":
      return "bg-sky-500 text-black hover:bg-sky-400";
    case "commit":
      return "bg-amber-500 text-black hover:bg-amber-400";
    case "tag":
      return "bg-fuchsia-500 text-black hover:bg-fuchsia-400";
    default:
      return "";
  }
}

function objectTypeIcon(type?: GitObject["type"]): React.ReactNode {
  switch (type) {
    case "blob":
      return <FileCode2 className="h-4 w-4" />;
    case "tree":
      return <FolderGit2 className="h-4 w-4" />;
    case "commit":
      return <GitCommitHorizontal className="h-4 w-4" />;
    case "tag":
      return <Tag className="h-4 w-4" />;
    default:
      return <Binary className="h-4 w-4" />;
  }
}

function shortHash(value: string): string {
  if (/^[0-9a-f]{40}$/i.test(value)) {
    return value.slice(0, 7);
  }
  return value;
}

function shortenHashesInText(text: string): string {
  return text.replace(/\b[0-9a-f]{40}\b/gi, (hash) => hash.slice(0, 7));
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatNumbersInText(text: string): string {
  return text.replace(/\b\d{4,}\b/g, (num) => {
    if (/^[0-9a-f]{7,}$/i.test(num)) {
      return num;
    }
    return formatNumber(Number(num));
  });
}

/** Minimal inline markdown: bold and inline code */
function markdownInline(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(
      /`(.+?)`/g,
      '<code class="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-primary">$1</code>'
    );
}

export default App;
