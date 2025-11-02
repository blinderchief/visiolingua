'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle } from 'lucide-react'

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
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-900 mb-2 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Recently Uploaded ({uploadedFiles.length})
          </h3>
          <div className="space-y-1">
            {uploadedFiles.slice(-5).reverse().map((file, idx) => (
              <div key={idx} className="text-xs text-green-700">
                • {file.name} ({new Date(file.timestamp).toLocaleTimeString()})
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Language
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Image or Text</h3>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-lg text-blue-600">Drop the file here...</p>
          ) : (
            <p className="text-lg text-gray-600">
              Drag & drop an image or text file here, or click to select
            </p>
          )}
        </div>
        {uploading && <p className="text-center text-blue-600 mt-4">Uploading...</p>}
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Or Enter Text Directly</h3>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Enter your text here..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleTextUpload}
          disabled={uploading || !textInput.trim()}
          className="mt-2 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="h-4 w-4 mr-2" />
          Upload Text
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.includes('successful') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}
    </div>
  )
}
 