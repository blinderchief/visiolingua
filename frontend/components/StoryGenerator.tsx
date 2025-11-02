'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { BookOpen } from 'lucide-react'

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
        <h3 className="text-lg font-medium text-gray-900 mb-4">AI Story Generator</h3>
        <p className="text-gray-600 mb-4">
          Generate short stories grounded in your uploaded image or text. Select a recent upload (defaults to the most recent image if available), pick a language, and add an optional theme.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Source Content
        </label>
        {uploadedFiles.length > 0 ? (
          <select
            value={selectedContentId}
            onChange={(e) => setSelectedContentId(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          >
            {uploadedFiles.slice(-10).reverse().map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {new Date(f.timestamp).toLocaleString()}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-gray-500">No uploads yet. Upload an image or text in the Upload tab first.</div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Story Language
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
          Story Theme
        </label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="e.g., a magical forest adventure, time travel mystery..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !theme.trim()}
        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        {loading ? 'Generating...' : 'Generate Story'}
      </button>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Crafting your story...</p>
        </div>
      )}

      {story && (
        <div className="bg-purple-50 p-6 rounded-lg">
          <h4 className="text-lg font-medium text-purple-900 mb-4">Your Generated Story</h4>
          <div className="prose prose-purple max-w-none">
            <p className="text-purple-800 whitespace-pre-wrap">{story}</p>
          </div>
        </div>
      )}
    </div>
  )
}