"use client";
import { useState } from "react";
import { Shield, Download, Trash2, Loader2 } from "lucide-react";

export default function SettingsComponent() {
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(null);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");

  const handleExport = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/data-export?user_id=${userId}`);
      const data = await res.json();
      setExported(data.data);
      setMessage("Data export successful.");
    } catch {
      setMessage("Export failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete all your data? This cannot be undone.")) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/data-delete?user_id=${userId}`, { method: "DELETE" });
      const data = await res.json();
      setMessage(`Deleted ${data.deleted} items.`);
    } catch {
      setMessage("Delete failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-8 max-w-xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-4">
        <Shield className="h-6 w-6 text-indigo-600" />
        <h2 className="text-xl font-bold gradient-text">Privacy Controls</h2>
      </div>
      <p className="text-gray-600 mb-4">
        Your data is encrypted at rest. You may export or delete your data at any time in accordance with GDPR.
      </p>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">User ID</label>
        <input
          type="text"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          className="input-modern"
          placeholder="Enter your User ID"
        />
      </div>
      <div className="flex space-x-4 mt-4">
        <button onClick={handleExport} disabled={loading || !userId} className="btn-primary flex items-center">
          <Download className="h-4 w-4 mr-2" />
          {loading ? "Exporting..." : "Export Data"}
        </button>
        <button onClick={handleDelete} disabled={loading || !userId} className="btn-secondary flex items-center">
          <Trash2 className="h-4 w-4 mr-2" />
          {loading ? "Deleting..." : "Delete Data"}
        </button>
      </div>
      {message && (
        <div className="glass-card p-4 mt-4 border-l-4 border-indigo-500 text-indigo-800 font-medium">{message}</div>
      )}
      {exported && (
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-2">Exported Data</h4>
          <pre className="bg-gray-50 p-4 rounded text-xs max-h-64 overflow-auto">{JSON.stringify(exported, null, 2)}</pre>
        </div>
      )}
      <div className="mt-8 text-sm text-gray-500">
        <a href="/api/privacy-policy" target="_blank" rel="noopener" className="underline">View Privacy Policy</a>
      </div>
    </div>
  );
}
