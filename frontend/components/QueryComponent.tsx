'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Search, Image, FileText, History, Camera, Mic, MicOff, Loader2, Sparkles } from 'lucide-react'

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
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

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

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      
      // Map language codes for speech recognition
      const langMap: Record<string, string> = {
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        zh: 'zh-CN',
        hi: 'hi-IN'
      }
      
      recognitionInstance.onstart = () => setIsListening(true)
      recognitionInstance.onend = () => setIsListening(false)
      recognitionInstance.onerror = () => setIsListening(false)
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setQuery(transcript)
      }
      
      setRecognition(recognitionInstance)
    }
  }, [])

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert('Voice input not supported in this browser. Please use Chrome or Edge.')
      return
    }
    
    if (isListening) {
      recognition.stop()
    } else {
      const langMap: Record<string, string> = {
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        zh: 'zh-CN',
        hi: 'hi-IN'
      }
      recognition.lang = langMap[selectedLang] || 'en-US'
      recognition.start()
    }
  }

  return (
    <div className="space-y-6">
      {queryHistory.length > 0 && (
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h3 className="text-sm font-medium text-indigo-900 mb-2 flex items-center">
            <History className="h-4 w-4 mr-2" />
            Recent Queries ({queryHistory.length})
          </h3>
          <div className="space-y-1">
            {queryHistory.slice(-3).reverse().map((item, idx) => (
              <div key={idx} className="text-xs text-indigo-700">
                • "{item.query}" - {item.results.results.length} results ({new Date(item.timestamp).toLocaleTimeString()})
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Query Language
        </label>
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="input-modern"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="zh">Chinese</option>
          <option value="hi">Hindi (हिन्दी)</option>
        </select>
      </div>

      <div>
        <label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
          Search Query
          <span className="text-xs text-gray-500 font-normal">Text or voice input</span>
        </label>
        <div className="flex space-x-2 items-start">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your search query..."
            className="flex-1 input-modern"
            onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
          />
          <button
            onClick={toggleVoiceInput}
            disabled={loading}
            className={`p-3 rounded-xl transition-all duration-300 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
                : 'glass-card hover:scale-105 text-indigo-600'
            }`}
            title={isListening ? 'Stop recording' : 'Start voice input'}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button
            onClick={handleQuery}
            disabled={loading || !query.trim()}
            className="btn-primary flex items-center"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {isListening && (
          <div className="mt-2 glass-card p-3 flex items-center space-x-2 animate-pulse">
            <div className="flex space-x-1">
              <div className="h-2 w-1 bg-red-500 rounded-full animate-bounce"></div>
              <div className="h-2 w-1 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="h-2 w-1 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span className="text-sm text-red-600 font-medium">Listening...</span>
          </div>
        )}
      </div>

      <div>
        <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
          <Camera className="h-4 w-4 mr-2" />
          Query by Image
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="input-modern text-sm"
          />
          <button
            onClick={handleImageQuery}
            disabled={loading || !imageFile}
            className="btn-secondary flex items-center whitespace-nowrap"
          >
            <Camera className="h-4 w-4 mr-2" />
            Search
          </button>
        </div>
      </div>

      {loading && (
        <div className="glass-card p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Searching across your knowledge base...</p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="glass-card-hover p-6 border-l-4 border-indigo-500">
            <h3 className="text-lg font-semibold gradient-text mb-3 flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              AI Generation
            </h3>
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{results.generation}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Retrieved Results</h3>
            <div className="space-y-4">
              {results.results.map((result, index) => (
                <div key={index} className="glass-card-hover p-5">
                  <div className="flex items-center space-x-2 mb-2">
                    {result.type === 'image' ? (
                      <Image className="h-5 w-5 text-green-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-indigo-600" />
                    )}
                    <span className="font-semibold text-gray-900">
                      {result.original_name || `Text Content ${index + 1}`}
                    </span>
                    <span className="ml-auto px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                      {(result.score * 100).toFixed(1)}% match
                    </span>
                  </div>
                  {result.image_b64 && (
                    <img 
                      src={`data:image/png;base64,${result.image_b64}`} 
                      alt={result.original_name || 'uploaded'}
                      className="mt-3 max-w-md rounded-xl border-2 border-gray-200 shadow-md"
                    />
                  )}
                  {result.content && (
                    <p className="text-gray-700 text-sm mt-3 leading-relaxed">{result.content}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center glass-card p-4">
                <div className="text-2xl font-bold text-indigo-600">{results.metrics.cosine_avg.toFixed(3)}</div>
                <div className="text-xs text-gray-600 mt-1">Cosine Similarity</div>
              </div>
              <div className="text-center glass-card p-4">
                <div className="text-2xl font-bold text-purple-600">{results.metrics.bleu_score.toFixed(3)}</div>
                <div className="text-xs text-gray-600 mt-1">BLEU Score</div>
              </div>
              <div className="text-center glass-card p-4">
                <div className="text-2xl font-bold text-pink-600">{results.metrics.latency}ms</div>
                <div className="text-xs text-gray-600 mt-1">Latency</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}