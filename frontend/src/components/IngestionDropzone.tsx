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
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
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
      setLatestFileName(response.document.displayName ?? response.document.fileName ?? response.document.originalFilename ?? file.name)
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
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <UploadCloud className="size-5 text-primary" />
              Ingest knowledge
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload PDF, TXT, Markdown, or DOCX files and queue them for indexing.
            </p>
          </div>

          {file && uploadState === "idle" ? (
            <button
              onClick={handleUpload}
              className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Process document
            </button>
          ) : null}
        </div>

        <div
          {...getRootProps()}
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed px-6 py-10 text-center transition-all duration-300 ${
            isDragActive
              ? "border-primary bg-secondary"
              : "border-border bg-background hover:border-primary/40 hover:bg-secondary/60"
          } ${uploadState === "uploading" ? "pointer-events-none opacity-80" : ""}`}
        >
          <input {...getInputProps()} />

          {uploadState === "uploading" ? (
            <div className="flex w-full max-w-sm flex-col items-center gap-4">
              <Loader2 className="size-8 animate-spin text-primary" />
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs text-zinc-400">
                    <span>Uploading and queuing</span>
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
              <div className="mx-auto flex size-14 items-center justify-center rounded-md border border-border bg-card">
                <FileText className="size-6 text-primary" />
              </div>
              <p className="text-sm font-semibold">{file.name}</p>
              <p className="text-xs text-zinc-500">Ready to queue for indexing</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto flex size-14 items-center justify-center rounded-md border border-border bg-card transition group-hover:scale-105">
                <UploadCloud className="size-6 text-muted-foreground transition group-hover:text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">
                  Drag and drop or <span className="text-primary">browse</span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Supports PDF, plain text, Markdown, and DOCX files
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold">Document status</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Current ingestion queue and version state for this agent.
          </p>
        </div>

        <div className="space-y-3">
          {documents.length ? (
            documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-3 rounded-md border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{document.displayName ?? document.fileName ?? document.originalFilename}</p>
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
                    document.status === "ready"
                      ? "bg-emerald-400/10 text-emerald-300"
                      : document.status === "failed"
                        ? "bg-rose-400/10 text-rose-300"
                        : "bg-amber-400/10 text-amber-200"
                  }`}
                >
                  {document.status.toLowerCase()}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
              No documents uploaded yet. Start with your FAQ, warranty, or operations guide.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
