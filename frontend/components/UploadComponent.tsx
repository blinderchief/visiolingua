'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, Loader2, Image as ImageIcon } from 'lucide-react'

interface UploadComponentProps {
  onUploadSuccess: (fileName: string, id: string) => void
  uploadedFiles: {name: string, id: string, timestamp: Date}[]
}

export default function UploadComponent({ onUploadSuccess, uploadedFiles }: UploadComponentProps) {
  const { getToken, userId } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [textInput, setTextInput] = useState('')
  const [selectedLang, setSelectedLang] = useState('en')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setMessage('')

    const token = await getToken()
    const formData = new FormData()
    formData.append('file', acceptedFiles[0])
    formData.append('user_id', userId || 'demo_user')
    formData.append('lang', selectedLang)

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || 'demo_token'}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setMessage(`Upload successful: ${result.message}`)
        onUploadSuccess(acceptedFiles[0].name, result.id)
        try {
          const files = JSON.parse(localStorage.getItem('vl.uploadedFiles') || '[]')
          files.push({ name: acceptedFiles[0].name, id: result.id, timestamp: new Date().toISOString() })
          localStorage.setItem('vl.uploadedFiles', JSON.stringify(files))
        } catch {}
      } else {
        setMessage('Upload failed')
      }
    } catch (error) {
      setMessage('Upload error')
    } finally {
      setUploading(false)
    }
  }, [selectedLang, getToken, userId, onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'text/*': ['.txt']
    },
    multiple: false
  })

  const handleTextUpload = async () => {
    if (!textInput.trim()) return

    setUploading(true)
    setMessage('')

    const token = await getToken()
    const formData = new FormData()
    formData.append('text', textInput)
    formData.append('user_id', userId || 'demo_user')
    formData.append('lang', selectedLang)

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || 'demo_token'}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setMessage(`Upload successful: ${result.message}`)
        onUploadSuccess('Text content', result.id)
        setTextInput('')
        try {
          const files = JSON.parse(localStorage.getItem('vl.uploadedFiles') || '[]')
          files.push({ name: 'Text content', id: result.id, timestamp: new Date().toISOString() })
          localStorage.setItem('vl.uploadedFiles', JSON.stringify(files))
        } catch {}
      } else {
        setMessage('Upload failed')
      }
    } catch (error) {
      setMessage('Upload error')
    } finally {
      setUploading(false)
    }
  }

  // Note: Do NOT call onUploadSuccess in an effect; it triggers parent state updates on each render.
  // If you want hard-refresh persistence, lift restoration to the parent and memoize the callback.

  return (
    <div className="space-y-6">
      {uploadedFiles.length > 0 && (
        <div className="glass-card p-5 border-l-4 border-green-500">
          <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Recently Uploaded ({uploadedFiles.length})
          </h3>
          <div className="space-y-2">
            {uploadedFiles.slice(-5).reverse().map((file, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-xs text-green-700 glass-card p-2">
                <ImageIcon className="h-3 w-3" />
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-gray-500">{new Date(file.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Language
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Image or Text</h3>
        <div
          {...getRootProps()}
          className={`glass-card-hover border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive ? 'border-indigo-400 bg-indigo-50/50 scale-105' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <div className="inline-block p-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl mb-4">
            <Upload className="h-8 w-8 text-white" />
          </div>
          {isDragActive ? (
            <p className="text-lg text-indigo-600 font-medium">Drop the file here...</p>
          ) : (
            <div>
              <p className="text-lg text-gray-900 font-medium mb-2">
                Drag & drop your files here
              </p>
              <p className="text-sm text-gray-500">
                or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-2">
              Drag & drop an image or text file here, or click to select
                Supports: JPG, PNG, GIF, TXT
              </p>
            </div>
          )}
        </div>
        {uploading && (
          <div className="glass-card p-4 mt-4 flex items-center justify-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <span className="text-indigo-600 font-medium">Uploading and processing...</span>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Or Enter Text Directly</h3>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Enter your text here..."
          className="input-modern h-32 resize-none"
        />
        <button
          onClick={handleTextUpload}
          disabled={uploading || !textInput.trim()}
          className="mt-3 btn-primary flex items-center"
        >
          <FileText className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Text'}
        </button>
      </div>

      {message && (
        <div className={`glass-card p-4 border-l-4 ${
          message.includes('successful') 
            ? 'border-green-500 bg-green-50/50' 
            : 'border-red-500 bg-red-50/50'
        }`}>
          <div className="flex items-center space-x-2">
            {message.includes('successful') ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <span className="text-red-600 font-medium">⚠️</span>
            )}
            <span className={message.includes('successful') ? 'text-green-800 font-medium' : 'text-red-800 font-medium'}>
              {message}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
