'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import UploadComponent from '@/components/UploadComponent'
import QueryComponent from '@/components/QueryComponent'
import StoryGenerator from '@/components/StoryGenerator'
import DashboardComponent from '@/components/DashboardComponent'

export default function Home() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('upload')
  
  // Lift state to persist across tab switches
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, id: string, timestamp: Date}[]>([])
  const [queryHistory, setQueryHistory] = useState<{query: string, results: any, timestamp: Date}[]>([])

  const handleUploadSuccess = (fileName: string, id: string) => {
    setUploadedFiles(prev => [...prev, {name: fileName, id, timestamp: new Date()}])
  }

  const handleQuerySuccess = (query: string, results: any) => {
    setQueryHistory(prev => [...prev, {query, results, timestamp: new Date()}])
  }

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">VisioLingua RAG</h1>
            <div>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SignedIn>
          <div className="mb-8">
            <nav className="flex space-x-8">
              {['upload', 'query', 'story', 'dashboard'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'upload' && uploadedFiles.length > 0 && (
                    <span className="ml-1 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                      {uploadedFiles.length}
                    </span>
                  )}
                  {tab === 'query' && queryHistory.length > 0 && (
                    <span className="ml-1 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                      {queryHistory.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            {activeTab === 'upload' && <UploadComponent onUploadSuccess={handleUploadSuccess} uploadedFiles={uploadedFiles} />}
            {activeTab === 'query' && <QueryComponent onQuerySuccess={handleQuerySuccess} queryHistory={queryHistory} />}
            {activeTab === 'story' && <StoryGenerator uploadedFiles={uploadedFiles} />}
            {activeTab === 'dashboard' && <DashboardComponent />}
          </div>
        </SignedIn>

        <SignedOut>
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to VisioLingua RAG</h2>
            <p className="text-lg text-gray-600 mb-8">
              A multi-modal multilingual RAG system powered by Gemini and Qdrant.
            </p>
            <SignInButton mode="modal">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg hover:bg-blue-700">
                Get Started
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </main>
    </div>
  )
}