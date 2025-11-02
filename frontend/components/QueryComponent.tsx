'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Search, Image, FileText, History, Camera } from 'lucide-react'

interface QueryResult {
  content?: string
  original_name?: string
  type: string
  score: number
  lang: string
  image_b64?: string
}

interface QueryResponse {
  results: QueryResult[]
  generation: string
  metrics: {
    cosine_avg: number
    bleu_score: number
    latency: number
  }
}

interface QueryComponentProps {
  onQuerySuccess: (query: string, results: QueryResponse) => void
  queryHistory: {query: string, results: QueryResponse, timestamp: Date}[]
}

export default function QueryComponent({ onQuerySuccess, queryHistory }: QueryComponentProps) {
  const [query, setQuery] = useState('')
  const [selectedLang, setSelectedLang] = useState('en')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<QueryResponse | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const { getToken, userId } = useAuth()

  const handleQuery = async () => {
    if (!query.trim()) return

    setLoading(true)
    setResults(null)

    try {
      const token = await getToken()
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'demo_token'}`
        },
        body: JSON.stringify({
          query,
          lang: selectedLang,
          user_id: userId || 'demo_user'
        })
      })

      if (response.ok) {
        const data: QueryResponse = await response.json()
        setResults(data)
        onQuerySuccess(query, data)
        try {
          localStorage.setItem('vl.query.results', JSON.stringify(data))
        } catch {}
      } else {
        console.error('Query failed')
      }
    } catch (error) {
      console.error('Query error', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageQuery = async () => {
    if (!imageFile) return
    setLoading(true)
    try {
      const token = await getToken()
      const form = new FormData()
      form.append('file', imageFile)
      form.append('user_id', userId || 'demo_user')
      form.append('lang', selectedLang)
      const resp = await fetch('http://localhost:8000/query-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token || 'demo_token'}` },
        body: form
      })
      if (resp.ok) {
        const data: QueryResponse = await resp.json()
        setResults(data)
        onQuerySuccess('[image query]', data)
        try { localStorage.setItem('vl.query.results', JSON.stringify(data)) } catch {}
      } else {
        console.error('Image query failed')
      }
    } catch (e) {
      console.error('Image query error', e)
    } finally {
      setLoading(false)
    }
  }

  // Persist inputs
  useEffect(() => {
    try {
      const savedQ = localStorage.getItem('vl.query.text')
      const savedL = localStorage.getItem('vl.query.lang')
      const savedR = localStorage.getItem('vl.query.results')
      if (savedQ) setQuery(savedQ)
      if (savedL) setSelectedLang(savedL)
      if (savedR) setResults(JSON.parse(savedR))
    } catch {}
  }, [])
  useEffect(() => { try { localStorage.setItem('vl.query.text', query) } catch {} }, [query])
  useEffect(() => { try { localStorage.setItem('vl.query.lang', selectedLang) } catch {} }, [selectedLang])

  return (
    <div className="space-y-6">
      {queryHistory.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
            <History className="h-4 w-4 mr-2" />
            Recent Queries ({queryHistory.length})
          </h3>
          <div className="space-y-1">
            {queryHistory.slice(-3).reverse().map((item, idx) => (
              <div key={idx} className="text-xs text-blue-700">
                • "{item.query}" - {item.results.results.length} results ({new Date(item.timestamp).toLocaleTimeString()})
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Query Language
        </label>
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="zh">Chinese</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Query
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your search query..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
          />
          <button
            onClick={handleQuery}
            disabled={loading || !query.trim()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Query by Image</label>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-700"
          />
          <button
            onClick={handleImageQuery}
            disabled={loading || !imageFile}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="h-4 w-4 mr-2" />
            Search Image
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Searching...</p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-2">AI Generation</h3>
            <p className="text-blue-800 whitespace-pre-wrap">{results.generation}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Retrieved Results</h3>
            <div className="space-y-4">
              {results.results.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    {result.type === 'image' ? (
                      <Image className="h-5 w-5 text-green-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-blue-600" />
                    )}
                    <span className="font-medium">
                      {result.original_name || `Text Content ${index + 1}`}
                    </span>
                    <span className="text-sm text-gray-500">
                      Score: {result.score.toFixed(3)}
                    </span>
                  </div>
                  {result.image_b64 && (
                    <img 
                      src={`data:image/png;base64,${result.image_b64}`} 
                      alt={result.original_name || 'uploaded'}
                      className="mt-2 max-w-xs rounded border"
                    />
                  )}
                  {result.content && (
                    <p className="text-gray-700 text-sm mt-2">{result.content}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Metrics</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Cosine Similarity:</span>
                <span className="ml-2">{results.metrics.cosine_avg.toFixed(3)}</span>
              </div>
              <div>
                <span className="font-medium">BLEU Score:</span>
                <span className="ml-2">{results.metrics.bleu_score.toFixed(3)}</span>
              </div>
              <div>
                <span className="font-medium">Latency:</span>
                <span className="ml-2">{results.metrics.latency}ms</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}