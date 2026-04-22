import { useState, useEffect } from "react";

// Inline so this file has zero external dependencies
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const STORAGE_KEY = "papermind_documents";

export default function Sidebar() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [arxivUrl, setArxivUrl] = useState("");
  const [error, setError] = useState(null);

  // Persist document list in localStorage so it survives page refresh
  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  }, [documents]);

  // On mount, check ChromaDB is in sync with localStorage
  useEffect(() => {
    fetch(`${API_BASE_URL}/document_count`)
      .then((r) => r.json())
      .then((data) => {
        if (data.count === 0 && documents.length > 0) {
          setDocuments([]);
        }
      })
      .catch(() => {
        // Backend not reachable — leave list as-is
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/ingest`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Server error ${response.status}`);
      }

      const result = await response.json();

      setDocuments((prev) => [
        ...prev,
        {
          title: result.filename.replace(".pdf", ""),
          filename: result.filename,
          pages: result.pages,
          chunks: result.chunks,
          status: "ready",
          uploadedAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleArxivSubmit = async () => {
    if (!arxivUrl.trim()) return;

    setUploading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/ingest-arxiv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url_or_id: arxivUrl }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || "arXiv import failed");
      }

      const result = await response.json();

      setDocuments((prev) => [
        ...prev,
        {
          title: result.title,
          filename: result.filename,
          pages: result.pages,
          chunks: result.chunks,
          authors: result.authors,
          status: "ready",
          uploadedAt: new Date().toISOString(),
          arxivId: result.arxiv_id,
        },
      ]);

      setArxivUrl("");
    } catch (err) {
      setError(`arXiv import failed: ${err.message}`);
      console.error("arXiv import error:", err);
    } finally {
      setUploading(false);
    }
  };

  const clearAll = async () => {
    try {
      await fetch(`${API_BASE_URL}/clear`, { method: "POST" });
    } catch {
      // still clear the UI even if backend call fails
    }
    setDocuments([]);
  };

  const removeDocument = (idx) => {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="h-full border-r border-border/50 bg-panel/30 backdrop-blur-sm flex flex-col">

      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <h2 className="text-sm font-semibold text-text mb-1">Research Library</h2>
        <p className="text-xs text-muted">Upload papers to get started</p>
      </div>

      {/* Upload Zone */}
      <div className="p-6">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-2xl p-8 text-center
            transition-all duration-300 ease-out
            ${dragActive
              ? "border-primary bg-primary/10 scale-[1.02]"
              : "border-border hover:border-primary/50 hover:bg-panel/50"
            }
            ${uploading ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center
              transition-all duration-300
              ${dragActive ? "bg-primary/20" : "bg-panel"}
            `}>
              {uploading ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className={`w-6 h-6 ${dragActive ? "text-primary" : "text-muted"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
            </div>

            <div>
              <p className="text-sm text-text font-medium mb-1">
                {uploading ? "Uploading..." : "Drop PDF here or click to browse"}
              </p>
              <p className="text-xs text-muted">Supports PDF up to 50MB</p>
            </div>

            <input
              type="file"
              accept=".pdf"
              className="hidden"
              id="file-upload"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className={`px-4 py-2 bg-panel hover:bg-border/50 rounded-lg text-sm text-text cursor-pointer transition-colors ${uploading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
            >
              Choose File
            </label>
          </div>
        </div>

        {/* arXiv URL Input */}
        <div className="mt-4">
          <label className="text-xs text-muted mb-2 block">Or paste arXiv URL</label>
          <div className="flex gap-2">
            <input
              value={arxivUrl}
              onChange={(e) => setArxivUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleArxivSubmit()}
              placeholder="https://arxiv.org/abs/..."
              className="flex-1 bg-panel border border-border/50 focus:border-primary/50 focus:outline-none p-3 rounded-xl text-sm transition-colors"
              disabled={uploading}
            />
            <button
              onClick={handleArxivSubmit}
              disabled={uploading || !arxivUrl.trim()}
              className="px-4 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Add
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
            Papers ({documents.length})
          </h3>
          {documents.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-muted hover:text-red-400 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted">
            No papers uploaded yet
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc, idx) => (
              <DocumentItem
                key={idx}
                title={doc.title}
                pages={doc.pages}
                status={doc.status}
                authors={doc.authors || "Unknown"}
                onRemove={() => removeDocument(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentItem({ title, pages, status, authors, onRemove }) {
  const statusConfig = {
    ready: { color: "text-emerald-400", bg: "bg-emerald-400/10", label: "Ready" },
    processing: { color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Processing" },
    error: { color: "text-red-400", bg: "bg-red-400/10", label: "Error" },
  };

  const config = statusConfig[status] || statusConfig.ready;

  return (
    <div className="group p-4 bg-panel/50 hover:bg-panel border border-border/50 hover:border-border rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.01]">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-text mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h4>
          <p className="text-xs text-muted">{authors}</p>
        </div>
        <div className={`px-2 py-1 ${config.bg} rounded-lg flex items-center gap-1 flex-shrink-0`}>
          <div className={`w-1.5 h-1.5 rounded-full ${config.color} ${status === "processing" ? "animate-pulse" : ""}`} />
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{pages} pages</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all text-xs"
        >
          Remove
        </button>
      </div>
    </div>
  );
}