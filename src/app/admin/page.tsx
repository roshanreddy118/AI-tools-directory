"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Loader2,
  Check,
  X,
  Sparkles,
  Trash2,
  ExternalLink,
  Lock,
} from "lucide-react";
import Link from "next/link";

interface AdminTool {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  pricingType: string | null;
  isActive: boolean;
  isVerified: boolean;
  lastEnrichedAt: string | null;
  createdAt: string;
}

const ADMIN_KEY_STORAGE = "aitools_admin_key";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tools, setTools] = useState<AdminTool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  // Add tool form
  const [toolName, setToolName] = useState("");
  const [toolUrl, setToolUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addResult, setAddResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Bulk add
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkProgress, setBulkProgress] = useState<string[]>([]);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminKey}`,
  };

  // Restore session on mount (survives navigation to tool pages and back)
  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (!stored) {
      setIsRestoring(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/admin/tools", {
          headers: { Authorization: `Bearer ${stored}` },
          cache: "no-store",
        });
        if (res.ok) {
          setAdminKey(stored);
          setIsAuthenticated(true);
          const data = await res.json();
          setTools(data.tools || []);
        } else {
          sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        }
      } catch {
        // ignore — user can log in manually
      } finally {
        setIsRestoring(false);
      }
    })();
  }, []);

  const login = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/tools", { headers: authHeaders, cache: "no-store" });
      if (res.ok) {
        sessionStorage.setItem(ADMIN_KEY_STORAGE, adminKey);
        setIsAuthenticated(true);
        const data = await res.json();
        setTools(data.tools || []);
      } else {
        alert("Invalid admin key");
      }
    } catch {
      alert("Connection failed");
    }
    setIsLoading(false);
  };

  const fetchTools = async () => {
    const res = await fetch("/api/admin/tools", { headers: authHeaders });
    if (res.ok) {
      const data = await res.json();
      setTools(data.tools || []);
    }
  };

  const addTool = async (name: string, website?: string) => {
    const res = await fetch("/api/admin/tools", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name, website: website || undefined }),
    });

    const data = await res.json();
    return { ok: res.ok, data };
  };

  const deleteTool = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/admin/tools/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    if (res.ok) {
      setTools((prev) => prev.filter((t) => t.id !== id));
    } else {
      alert("Failed to delete tool");
    }
  };

  const handleAddTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolName.trim()) return;

    setIsAdding(true);
    setAddResult(null);

    const { ok, data } = await addTool(toolName.trim(), toolUrl.trim());

    if (ok) {
      setAddResult({
        type: "success",
        message: data.message || `"${toolName}" added!`,
      });
      setToolName("");
      setToolUrl("");
      fetchTools();
    } else {
      setAddResult({
        type: "error",
        message: data.error || "Failed to add tool",
      });
    }

    setIsAdding(false);
  };

  const handleBulkAdd = async () => {
    const lines = bulkInput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    setIsAdding(true);
    setBulkProgress([]);

    for (const line of lines) {
      // Format: "Tool Name" or "Tool Name, https://url.com"
      const [name, url] = line.split(",").map((s) => s.trim());

      setBulkProgress((prev) => [...prev, `Adding: ${name}...`]);

      const { ok, data } = await addTool(name, url);

      setBulkProgress((prev) => [
        ...prev.slice(0, -1),
        ok
          ? `✓ ${name} — added`
          : `✗ ${name} — ${data.error || "failed"}`,
      ]);

      // Rate limit between additions
      await new Promise((r) => setTimeout(r, 2000));
    }

    setIsAdding(false);
    fetchTools();
  };

  // While restoring the session from storage, show a neutral loading state
  // so we don't flash the login screen after navigating back from a tool page.
  if (isRestoring) {
    return (
      <main className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </main>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-gray-400" />
            <h1 className="text-lg font-semibold text-gray-900">Admin</h1>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              login();
            }}
          >
            <input
              type="password"
              placeholder="Admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="input-field mb-4"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-2.5"
            >
              {isLoading ? "Checking..." : "Continue"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Admin</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {tools.length} tools in directory
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              &larr; Back to site
            </Link>
            <button
              onClick={() => {
                sessionStorage.removeItem(ADMIN_KEY_STORAGE);
                setIsAuthenticated(false);
                setAdminKey("");
              }}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Add Tool Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h2 className="font-semibold text-gray-900">Add Tool</h2>
            </div>
            <button
              onClick={() => setBulkMode(!bulkMode)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {bulkMode ? "Single mode" : "Bulk mode"}
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Enter a tool name and optional URL. AI searches the web and generates the full profile automatically.
          </p>

          {!bulkMode ? (
            // Single add
            <form onSubmit={handleAddTool} className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Tool name (e.g. Cursor, Midjourney)"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  className="flex-1 input-field"
                  disabled={isAdding}
                />
                <input
                  type="url"
                  placeholder="Website URL (optional)"
                  value={toolUrl}
                  onChange={(e) => setToolUrl(e.target.value)}
                  className="w-64 input-field"
                  disabled={isAdding}
                />
                <button
                  type="submit"
                  disabled={isAdding || !toolName.trim()}
                  className="btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {isAdding ? "Generating..." : "Add"}
                </button>
              </div>

              {addResult && (
                <div
                  className={`flex items-center gap-2 text-sm p-3 rounded-xl ${
                    addResult.type === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {addResult.type === "success" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  {addResult.message}
                </div>
              )}
            </form>
          ) : (
            // Bulk add
            <div className="space-y-4">
              <textarea
                placeholder={`One tool per line:\nCursor\nMidjourney, https://midjourney.com\nRunway`}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="input-field h-36 resize-y font-mono text-xs"
                disabled={isAdding}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {bulkInput.split("\n").filter((l) => l.trim()).length} tools
                </span>
                <button
                  onClick={handleBulkAdd}
                  disabled={isAdding || !bulkInput.trim()}
                  className="btn-primary flex items-center gap-2"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isAdding ? "Processing..." : "Add All"}
                </button>
              </div>

              {bulkProgress.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 text-xs font-mono text-emerald-400 max-h-48 overflow-y-auto">
                  {bulkProgress.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tools List */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            All Tools ({tools.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Name</th>
                  <th className="pb-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Category</th>
                  <th className="pb-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Pricing</th>
                  <th className="pb-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Status</th>
                  <th className="pb-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Added</th>
                  <th className="pb-3 font-medium text-gray-400 text-xs uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tools.map((tool) => (
                  <tr key={tool.id} className="group hover:bg-gray-50/50">
                    <td className="py-3 font-medium text-gray-900">{tool.name}</td>
                    <td className="py-3">
                      {tool.category && (
                        <span className="badge-blue">{tool.category}</span>
                      )}
                    </td>
                    <td className="py-3">
                      {tool.pricingType && (
                        <span className="badge-gray capitalize">
                          {tool.pricingType}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {tool.isActive ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                      )}
                    </td>
                    <td className="py-3 text-gray-400 text-xs">
                      {new Date(tool.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/tool/${tool.slug}`}
                          className="text-gray-400 hover:text-indigo-600 transition-colors"
                          title="View"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => deleteTool(tool.id, tool.name)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
