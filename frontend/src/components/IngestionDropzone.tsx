"use client"

import React, { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { AlertCircle, CheckCircle, FileText, Loader2, UploadCloud } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import { uploadDocument } from "@/lib/api/echo"
import type { DocumentRecord } from "@/lib/api/schemas"

export function IngestionDropzone({
  agentId,
  documents,
}: {
  agentId: string
  documents: DocumentRecord[]
}) {
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">(
    "idle"
  )
  const [progress, setProgress] = useState(0)
  const [latestFileName, setLatestFileName] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0 && uploadState !== "uploading") {
        setFile(acceptedFiles[0])
        setUploadState("idle")
        setProgress(0)
      }
    },
    [uploadState]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
    },
    maxFiles: 1,
    disabled: uploadState === "uploading",
  })

  async function handleUpload() {
    if (!file) return

    setUploadState("uploading")
    setProgress(10)

    const interval = window.setInterval(() => {
      setProgress((value) => Math.min(value + 12, 88))
    }, 320)

    try {
      const response = await uploadDocument(agentId, file)
      setLatestFileName(response.document.fileName)
      setProgress(100)
      setUploadState("success")
      window.setTimeout(() => {
        setUploadState("idle")
        setFile(null)
        setProgress(0)
      }, 2200)
    } catch {
      setUploadState("error")
    } finally {
      window.clearInterval(interval)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
      <div className="rounded-[30px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-6 shadow-[0_30px_100px_-65px_rgba(17,181,164,0.4)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <UploadCloud className="size-5 text-[var(--echo-accent)]" />
              Ingest knowledge
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload PDF, TXT, or Markdown files and queue them for indexing.
            </p>
          </div>

          {file && uploadState === "idle" ? (
            <button
              onClick={handleUpload}
              className="rounded-full bg-[var(--echo-accent)] px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-[var(--echo-accent-strong)]"
            >
              Process document
            </button>
          ) : null}
        </div>

        <div
          {...getRootProps()}
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed px-6 py-10 text-center transition-all duration-300 ${
            isDragActive
              ? "border-[var(--echo-accent)] bg-[rgba(17,181,164,0.08)]"
              : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/6"
          } ${uploadState === "uploading" ? "pointer-events-none opacity-80" : ""}`}
        >
          <input {...getInputProps()} />

          {uploadState === "uploading" ? (
            <div className="flex w-full max-w-sm flex-col items-center gap-4">
              <Loader2 className="size-8 animate-spin text-[var(--echo-accent)]" />
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Chunking, embedding, and indexing</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-white/10" />
              </div>
            </div>
          ) : uploadState === "success" ? (
            <div className="space-y-3 text-emerald-300">
              <CheckCircle className="mx-auto size-10" />
              <p className="text-sm font-semibold">Upload queued successfully</p>
              <p className="text-xs text-zinc-400">{latestFileName}</p>
            </div>
          ) : uploadState === "error" ? (
            <div className="space-y-3 text-rose-300">
              <AlertCircle className="mx-auto size-10" />
              <p className="text-sm font-semibold">Upload failed</p>
              <p className="text-xs text-zinc-400">Check the API adapter or retry the file.</p>
            </div>
          ) : file ? (
            <div className="space-y-3">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
                <FileText className="size-6 text-[var(--echo-accent)]" />
              </div>
              <p className="text-sm font-semibold text-zinc-200">{file.name}</p>
              <p className="text-xs text-zinc-500">Ready to queue for indexing</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/6 transition group-hover:scale-105">
                <UploadCloud className="size-6 text-zinc-400 transition group-hover:text-[var(--echo-accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">
                  Drag and drop or <span className="text-[var(--echo-accent)]">browse</span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Supports PDF, plain text, and Markdown files
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">Document status</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Current ingestion queue and version state for this agent.
          </p>
        </div>

        <div className="space-y-3">
          {documents.length ? (
            documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-white">{document.fileName}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {(document.sizeBytes / 1024).toFixed(0)} KB
                    {" · "}
                    {new Date(document.createdAt).toLocaleDateString()}
                  </p>
                  {document.errorMessage ? (
                    <p className="mt-2 text-xs text-rose-300">{document.errorMessage}</p>
                  ) : null}
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    document.status === "READY"
                      ? "bg-emerald-400/10 text-emerald-300"
                      : document.status === "FAILED"
                        ? "bg-rose-400/10 text-rose-300"
                        : "bg-amber-400/10 text-amber-200"
                  }`}
                >
                  {document.status.toLowerCase()}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 p-6 text-sm text-muted-foreground">
              No documents uploaded yet. Start with your FAQ, warranty, or operations guide.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
