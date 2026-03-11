import { useState, useCallback } from "react";
import {
  parseGitObject,
  explainGitObject,
  type GitObject,
} from "./git-parser";

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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Git Object Explorer
          </h1>
          <p className="text-gray-400 text-lg">
            Drop a raw git object file to parse and understand its contents
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Find them in <code className="text-amber-400">.git/objects/</code>{" "}
            — e.g.{" "}
            <code className="text-amber-400">
              .git/objects/ab/cdef1234...
            </code>
          </p>
        </header>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-blue-400 bg-blue-400/10"
              : "border-gray-700 hover:border-gray-500"
          }`}
        >
          <input
            type="file"
            onChange={onFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="space-y-2">
            <div className="text-5xl">📦</div>
            <p className="text-gray-300 text-lg font-medium">
              Drag &amp; drop a git object file here
            </p>
            <p className="text-gray-500 text-sm">or click to browse</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/40 border border-red-700 rounded-lg text-red-300">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* Results */}
        {gitObj && (
          <div className="mt-8 space-y-6">
            {/* Object type badge */}
            <div className="flex items-center gap-3">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wider ${typeBadgeColor(gitObj.type)}`}
              >
                {gitObj.type}
              </span>
              {fileName && (
                <span className="text-gray-500 text-sm font-mono">
                  {fileName}
                </span>
              )}
            </div>

            {/* Explanation */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">
                Explanation
              </h2>
              {explanations.map((line, i) => (
                <p
                  key={i}
                  className="text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: markdownInline(line) }}
                />
              ))}
            </div>

            {/* Raw content for blobs */}
            {gitObj.type === "blob" && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">
                  File Content
                </h2>
                <pre className="text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono bg-gray-950 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {gitObj.content}
                </pre>
              </div>
            )}

            {/* Tree entries table */}
            {gitObj.type === "tree" && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 overflow-x-auto">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">
                  Tree Entries
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-800">
                      <th className="text-left py-2 pr-4">Mode</th>
                      <th className="text-left py-2 pr-4">Type</th>
                      <th className="text-left py-2 pr-4">Name</th>
                      <th className="text-left py-2 font-mono">SHA-1</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gitObj.entries.map((entry, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-800/50 hover:bg-gray-800/30"
                      >
                        <td className="py-2 pr-4 font-mono text-amber-400">
                          {entry.mode}
                        </td>
                        <td className="py-2 pr-4 text-gray-400">
                          {entry.modeDescription}
                        </td>
                        <td className="py-2 pr-4 text-gray-200 font-medium">
                          {entry.name}
                        </td>
                        <td className="py-2 font-mono text-xs text-gray-500">
                          {entry.hash}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Commit details */}
            {gitObj.type === "commit" && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-2">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">
                  Commit Details
                </h2>
                <DetailRow label="Tree" value={gitObj.tree} mono />
                {gitObj.parents.map((p, i) => (
                  <DetailRow
                    key={i}
                    label={`Parent ${gitObj.parents.length > 1 ? i + 1 : ""}`}
                    value={p}
                    mono
                  />
                ))}
                <DetailRow label="Author" value={gitObj.author} />
                <DetailRow label="Committer" value={gitObj.committer} />
                {gitObj.gpgsig && (
                  <DetailRow label="GPG Sig" value="✓ Present" />
                )}
                <div className="pt-3 mt-3 border-t border-gray-800">
                  <span className="text-gray-400 text-sm">Message:</span>
                  <pre className="mt-1 text-gray-200 whitespace-pre-wrap font-mono text-sm bg-gray-950 rounded-lg p-3">
                    {gitObj.message}
                  </pre>
                </div>
              </div>
            )}

            {/* Tag details */}
            {gitObj.type === "tag" && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-2">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">
                  Tag Details
                </h2>
                <DetailRow label="Object" value={gitObj.object} mono />
                <DetailRow label="Type" value={gitObj.tagType} />
                <DetailRow label="Tag Name" value={gitObj.tagName} />
                <DetailRow label="Tagger" value={gitObj.tagger} />
                <div className="pt-3 mt-3 border-t border-gray-800">
                  <span className="text-gray-400 text-sm">Message:</span>
                  <pre className="mt-1 text-gray-200 whitespace-pre-wrap font-mono text-sm bg-gray-950 rounded-lg p-3">
                    {gitObj.message}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-gray-400 min-w-[90px] shrink-0">{label}:</span>
      <span
        className={`text-gray-200 break-all ${mono ? "font-mono text-xs mt-0.5" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function typeBadgeColor(type: string): string {
  switch (type) {
    case "blob":
      return "bg-green-900/60 text-green-300 border border-green-700";
    case "tree":
      return "bg-blue-900/60 text-blue-300 border border-blue-700";
    case "commit":
      return "bg-purple-900/60 text-purple-300 border border-purple-700";
    case "tag":
      return "bg-amber-900/60 text-amber-300 border border-amber-700";
    default:
      return "bg-gray-800 text-gray-300 border border-gray-700";
  }
}

/** Minimal inline markdown: bold and inline code */
function markdownInline(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(
      /`(.+?)`/g,
      '<code class="text-amber-400 bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>'
    );
}

export default App;
