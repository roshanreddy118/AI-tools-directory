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

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tools, setTools] = useState<AdminTool[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const login = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/tools", { headers: authHeaders });
      if (res.ok) {
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

  // Login screen
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-sm w-full">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-gray-400" />
            <h1 className="text-xl font-bold">Admin Access</h1>
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
              className="w-full px-4 py-3 border rounded-lg mb-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? "Checking..." : "Login"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {tools.length} tools in directory
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 space-y-8">
        {/* Add Tool Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold">Add AI Tool</h2>
            </div>
            <button
              onClick={() => setBulkMode(!bulkMode)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {bulkMode ? "Single mode" : "Bulk mode"}
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Just enter the tool name (and optionally URL). AI will automatically
            generate the full profile: description, pricing, features,
            categories, alternatives, and more.
          </p>

          {!bulkMode ? (
            // Single add
            <form onSubmit={handleAddTool} className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Tool name (e.g. Cursor, Midjourney, Runway)"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isAdding}
                />
                <input
                  type="url"
                  placeholder="Website URL (optional)"
                  value={toolUrl}
                  onChange={(e) => setToolUrl(e.target.value)}
                  className="w-72 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isAdding}
                />
                <button
                  type="submit"
                  disabled={isAdding || !toolName.trim()}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {isAdding ? "AI generating..." : "Add Tool"}
                </button>
              </div>

              {addResult && (
                <div
                  className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                    addResult.type === "success"
                      ? "bg-green-50 text-green-700"
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
                placeholder={`Enter one tool per line:\nCursor\nMidjourney, https://midjourney.com\nRunway\nPerplexity, https://perplexity.ai`}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="w-full h-40 px-4 py-3 border rounded-lg resize-y focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                disabled={isAdding}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {bulkInput.split("\n").filter((l) => l.trim()).length} tools to
                  add
                </span>
                <button
                  onClick={handleBulkAdd}
                  disabled={isAdding || !bulkInput.trim()}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
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
                <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-green-400 max-h-60 overflow-y-auto">
                  {bulkProgress.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tools List */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">
            All Tools ({tools.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Pricing</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Added</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium">{tool.name}</td>
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
                      <div className="flex items-center gap-2">
                        {tool.isActive ? (
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-gray-300" />
                        )}
                        {tool.isVerified && (
                          <Check className="w-3.5 h-3.5 text-blue-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(tool.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/tool/${tool.slug}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
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
