'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { BookOpen, Sparkles, Loader2, FileText } from 'lucide-react'

interface StoryGeneratorProps {
  uploadedFiles?: { name: string; id: string; timestamp: Date }[]
}

export default function StoryGenerator({ uploadedFiles = [] }: StoryGeneratorProps) {
  const { getToken, userId } = useAuth()
  const [theme, setTheme] = useState('')
  const [selectedLang, setSelectedLang] = useState('en')
  const [loading, setLoading] = useState(false)
  const [story, setStory] = useState('')
  const [selectedContentId, setSelectedContentId] = useState<string>(uploadedFiles.at(-1)?.id || '')

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('vl.story.theme')
      const savedLang = localStorage.getItem('vl.story.lang')
      const savedStory = localStorage.getItem('vl.story.result')
      const savedContentId = localStorage.getItem('vl.story.contentId')
      if (savedTheme) setTheme(savedTheme)
      if (savedLang) setSelectedLang(savedLang)
      if (savedStory) setStory(savedStory)
      if (savedContentId) setSelectedContentId(savedContentId)
    } catch {}
  }, [])

  // Persist inputs
  useEffect(() => { try { localStorage.setItem('vl.story.theme', theme) } catch {} }, [theme])
  useEffect(() => { try { localStorage.setItem('vl.story.lang', selectedLang) } catch {} }, [selectedLang])
  useEffect(() => { try { localStorage.setItem('vl.story.contentId', selectedContentId) } catch {} }, [selectedContentId])

  const handleGenerate = async () => {
    if (!theme.trim()) return

    setLoading(true)
    setStory('')

    try {
      const token = await getToken()
      const response = await fetch('http://localhost:8000/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'demo_token'}`
        },
        body: JSON.stringify({
          query: theme,
          lang: selectedLang,
          user_id: userId || 'demo_user',
          content_id: selectedContentId || null
        })
      })

      if (response.ok) {
        const data = await response.json()
        setStory(data.story)
        try { localStorage.setItem('vl.story.result', data.story || '') } catch {}
      } else {
        console.error('Story generation failed', response.status)
      }
    } catch (error) {
      console.error('Story generation error', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="glass-card p-6 border-l-4 border-purple-500">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold gradient-text">AI Story Generator</h3>
          </div>
          <p className="text-gray-600">
          Generate short stories grounded in your uploaded image or text. Select a recent upload (defaults to the most recent image if available), pick a language, and add an optional theme.
        </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Source Content
        </label>
        {uploadedFiles.length > 0 ? (
          <select
            value={selectedContentId}
            onChange={(e) => setSelectedContentId(e.target.value)}
            className="input-modern"
          >
            {uploadedFiles.slice(-10).reverse().map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {new Date(f.timestamp).toLocaleString()}
              </option>
            ))}
          </select>
        ) : (
          <div className="glass-card p-4 flex items-center space-x-3 text-sm text-gray-500">
            <FileText className="h-5 w-5" />
            <span>No uploads yet. Upload an image or text in the Upload tab first.</span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Story Language
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Story Theme
        </label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="e.g., a magical forest adventure, time travel mystery..."
          className="input-modern"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !theme.trim()}
        className="btn-primary flex items-center"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        {loading ? 'Generating...' : 'Generate Story'}
      </button>

      {loading && (
        <div className="glass-card p-8 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Crafting your story...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      )}

      {story && (
        <div className="glass-card p-6 border-l-4 border-purple-500">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h4 className="text-lg font-bold gradient-text">Your Generated Story</h4>
          </div>
          <div className="prose prose-purple max-w-none glass-card p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{story}</p>
          </div>
        </div>
      )}
    </div>
  )
}