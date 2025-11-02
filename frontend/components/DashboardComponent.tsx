'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Activity, TrendingUp, Zap, FileText, Loader2 } from 'lucide-react'

interface HistoryItem {
  id: string
  type: string
  lang: string
  timestamp: string
  score?: number
}

interface MetricsData {
  language: string
  cosineAvg: number
  bleuScore: number
  latency: number
}

export default function DashboardComponent() {
  const { getToken, userId } = useAuth()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [metrics, setMetrics] = useState<MetricsData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
    // Mock metrics data - in real app, fetch from backend
    setMetrics([
      { language: 'English', cosineAvg: 0.92, bleuScore: 0.75, latency: 450 },
      { language: 'Spanish', cosineAvg: 0.88, bleuScore: 0.72, latency: 520 },
      { language: 'French', cosineAvg: 0.86, bleuScore: 0.70, latency: 480 },
    ])
    setLoading(false)
  }, [])

  const fetchHistory = async () => {
    setError(null)
    try {
      // Resolve API base URL from env on client or fallback to localhost
      const base = (process.env.NEXT_PUBLIC_API_URL as string) || `${window.location.protocol}//${window.location.hostname}:8000`
      const url = `${base.replace(/\/$/, '')}/history/${userId || 'demo_user'}`

      let token: string | null = null
      try {
        token = await getToken()
      } catch (tErr) {
        // Token may not be available in dev; proceed with demo token
        console.warn('getToken failed, using demo token', tErr)
        token = 'demo_token'
      }

      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${token || 'demo_token'}`,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        const msg = `History fetch failed: ${response.status} ${response.statusText} ${text}`
        console.error(msg)
        setError(msg)
        return
      }

      const data = await response.json()
      setHistory(data.history || [])
    } catch (err: any) {
      console.error('Failed to fetch history', err)
      setError(err?.message || String(err))
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-12 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-gray-700 font-medium">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="glass-card p-6 border-l-4 border-indigo-500">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold gradient-text">System Overview</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Items</span>
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{history.length}</p>
          </div>
          <div className="glass-card p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Avg Cosine</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.length > 0 ? (metrics.reduce((sum, m) => sum + m.cosineAvg, 0) / metrics.length).toFixed(3) : 'N/A'}
            </p>
          </div>
          <div className="glass-card p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Avg BLEU</span>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.length > 0 ? (metrics.reduce((sum, m) => sum + m.bleuScore, 0) / metrics.length).toFixed(3) : 'N/A'}
            </p>
          </div>
          <div className="glass-card p-4 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Avg Latency</span>
              <Zap className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.length > 0 ? `${Math.round(metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length)}ms` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
          Performance Metrics by Language
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Cosine Similarity</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="language" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cosineAvg" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">BLEU Score</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="language" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bleuScore" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 glass-card p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Latency Over Time</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="language" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-indigo-600" />
          Recent Activity
        </h3>
        {error && (
          <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-100 text-red-700">
            <strong className="block font-medium">Failed to load history</strong>
            <small className="block text-xs mt-1">{error}</small>
          </div>
        )}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
            <div className="grid grid-cols-4 gap-4 text-sm font-semibold text-gray-900">
              <div>Type</div>
              <div>Language</div>
              <div>Timestamp</div>
              <div>Score</div>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {history.slice(0, 10).map((item) => (
              <div key={item.id} className="px-5 py-3 grid grid-cols-4 gap-4 text-sm text-gray-900 hover:bg-indigo-50/30 transition-colors">
                <div className="capitalize font-medium">{item.type}</div>
                <div className="text-indigo-600 font-medium">{item.lang.toUpperCase()}</div>
                <div>{new Date(item.timestamp).toLocaleString()}</div>
                <div>
                  {item.score ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {item.score.toFixed(3)}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">N/A</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {history.length === 0 && (
            <div className="px-5 py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No activity yet</p>
              <p className="text-sm text-gray-400 mt-1">Upload some content to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}