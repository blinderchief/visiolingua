'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

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
    try {
      const token = await getToken()
      const response = await fetch(`http://localhost:8000/history/${userId || 'demo_user'}`, {
        headers: {
          'Authorization': `Bearer ${token || 'demo_token'}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Failed to fetch history', error)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics by Language</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Cosine Similarity</h4>
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

          <div className="bg-white p-4 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-900 mb-2">BLEU Score</h4>
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

        <div className="mt-6 bg-white p-4 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Latency Over Time</h4>
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

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-900">
              <div>Type</div>
              <div>Language</div>
              <div>Timestamp</div>
              <div>Score</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {history.slice(0, 10).map((item) => (
              <div key={item.id} className="px-4 py-3 grid grid-cols-4 gap-4 text-sm text-gray-900">
                <div className="capitalize">{item.type}</div>
                <div>{item.lang.toUpperCase()}</div>
                <div>{new Date(item.timestamp).toLocaleString()}</div>
                <div>{item.score ? item.score.toFixed(3) : 'N/A'}</div>
              </div>
            ))}
          </div>
          {history.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No activity yet. Upload some content to get started!
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-2">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Items:</span>
            <span className="ml-2">{history.length}</span>
          </div>
          <div>
            <span className="font-medium">Avg Cosine:</span>
            <span className="ml-2">
              {metrics.length > 0 ? (metrics.reduce((sum, m) => sum + m.cosineAvg, 0) / metrics.length).toFixed(3) : 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Avg BLEU:</span>
            <span className="ml-2">
              {metrics.length > 0 ? (metrics.reduce((sum, m) => sum + m.bleuScore, 0) / metrics.length).toFixed(3) : 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Avg Latency:</span>
            <span className="ml-2">
              {metrics.length > 0 ? `${Math.round(metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length)}ms` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}