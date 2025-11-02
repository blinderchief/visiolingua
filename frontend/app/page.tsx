'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { Sparkles, Upload as UploadIcon, Search, BookOpen, BarChart3, Shield, Zap, Globe } from 'lucide-react'
import UploadComponent from '@/components/UploadComponent'
import QueryComponent from '@/components/QueryComponent'
import StoryGenerator from '@/components/StoryGenerator'
import DashboardComponent from '@/components/DashboardComponent'
import SettingsComponent from '@/components/SettingsComponent'

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
    <div className="min-h-screen" suppressHydrationWarning>
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 -z-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg5OSwgMTAyLCAyNDEsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
      </div>

      <header className="relative z-50">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-white/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4 animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl blur-lg opacity-30 animate-pulse-slow"></div>
                <div className="relative p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/25">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-indigo-800 bg-clip-text text-transparent">
                  VisioLingua
                </h1>
                <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">
                  AI-Powered Intelligence
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <SignedOut>
                <div className="hidden md:flex items-center space-x-8 text-sm">
                  <a href="#features" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300 font-medium">
                    Features
                  </a>
                  <a href="#about" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300 font-medium">
                    About
                  </a>
                  <a href="#contact" className="text-gray-600 hover:text-indigo-600 transition-colors duration-300 font-medium">
                    Contact
                  </a>
                </div>
                <SignInButton mode="modal">
                  <button className="ml-6 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:scale-105 transition-all duration-300">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center space-x-4">
                  <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-green-50/80 backdrop-blur-sm rounded-xl border border-green-200/50">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Secure</span>
                  </div>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SignedIn>
          {/* Welcome Section */}
          <div className="mb-12 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/50 text-sm font-medium text-indigo-700 mb-6">
                <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mr-2 animate-pulse"></div>
                Welcome back, {user?.firstName || 'Explorer'}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-4">
                Your AI Workspace
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Transform your content into intelligent conversations with multimodal AI
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { icon: UploadIcon, label: 'Uploads', value: uploadedFiles.length, color: 'from-blue-500 to-cyan-500' },
              { icon: Search, label: 'Queries', value: queryHistory.length, color: 'from-purple-500 to-pink-500' },
              { icon: BookOpen, label: 'Stories', value: '∞', color: 'from-emerald-500 to-teal-500' },
              { icon: Zap, label: 'AI Power', value: '100%', color: 'from-orange-500 to-red-500' }
            ].map((stat, index) => (
              <div key={index} className="group relative">
                <div className="absolute inset-0 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg transform group-hover:scale-105 transition-all duration-300"></div>
                <div className="relative p-6 text-center">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg mb-4 group-hover:shadow-xl transition-all duration-300`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8 animate-slide-up">
            <nav className="flex flex-wrap justify-center gap-2 p-2 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl max-w-4xl mx-auto">
              {[
                { id: 'upload', icon: UploadIcon, label: 'Upload' },
                { id: 'query', icon: Search, label: 'Query' },
                { id: 'story', icon: BookOpen, label: 'Stories' },
                { id: 'dashboard', icon: BarChart3, label: 'Analytics' },
                { id: 'settings', icon: Shield, label: 'Settings' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center space-x-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-gray-600 hover:bg-white/80 hover:text-indigo-600 hover:shadow-md'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 transition-transform duration-300 ${
                    activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'
                  }`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="glass-card-hover p-8 animate-slide-up">
            {activeTab === 'upload' && <UploadComponent onUploadSuccess={handleUploadSuccess} uploadedFiles={uploadedFiles} />}
            {activeTab === 'query' && <QueryComponent onQuerySuccess={handleQuerySuccess} queryHistory={queryHistory} />}
            {activeTab === 'story' && <StoryGenerator uploadedFiles={uploadedFiles} />}
            {activeTab === 'dashboard' && <DashboardComponent />}
            {activeTab === 'settings' && <SettingsComponent />}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            {[
              {
                icon: Zap,
                title: 'Quick Search',
                desc: 'Instant answers across all your content',
                action: () => setActiveTab('query')
              },
              {
                icon: BookOpen,
                title: 'Create Story',
                desc: 'Generate narratives from your uploads',
                action: () => setActiveTab('story')
              },
              {
                icon: BarChart3,
                title: 'View Analytics',
                desc: 'Track your usage and performance',
                action: () => setActiveTab('dashboard')
              }
            ].map((action, i) => (
              <button
                key={i}
                onClick={action.action}
                className="group text-left p-6 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/80 transform hover:scale-105 transition-all duration-300"
              >
                <action.icon className="w-8 h-8 text-indigo-600 mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors duration-300">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                  {action.desc}
                </p>
              </button>
            ))}
          </div>
        </SignedIn>

        <SignedOut>
          {/* Professional Hero Section */}
          <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-6xl mx-auto text-center">
              {/* Main Heading */}
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-200/50 text-sm font-medium text-indigo-700 mb-8 shadow-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI-Powered Multimodal Intelligence
                </div>
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
                  <span className="block bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                    Visio
                  </span>
                  <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Lingua
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
                  Transform your visual content into intelligent conversations.
                  Search, analyze, and generate stories across images and text in multiple languages.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <SignInButton mode="modal">
                  <button className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 transform hover:scale-105 transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Start Exploring
                    </span>
                  </button>
                </SignInButton>
                <button className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl hover:bg-white transform hover:scale-105 transition-all duration-300">
                  Learn More
                </button>
              </div>

              {/* Feature Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {[
                  {
                    icon: Search,
                    title: 'Intelligent Search',
                    description: 'Find answers across your images and documents with AI-powered semantic search',
                    gradient: 'from-blue-500 to-cyan-500'
                  },
                  {
                    icon: BookOpen,
                    title: 'Creative Generation',
                    description: 'Transform visual content into compelling stories and narratives',
                    gradient: 'from-purple-500 to-pink-500'
                  },
                  {
                    icon: Globe,
                    title: 'Multilingual',
                    description: 'Communicate in English, Spanish, French, German, Chinese, and Hindi',
                    gradient: 'from-emerald-500 to-teal-500'
                  }
                ].map((feature, index) => (
                  <div key={index} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl transform group-hover:scale-105 transition-all duration-500"></div>
                    <div className="relative p-8 text-center">
                      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg mb-6 group-hover:shadow-xl transition-all duration-300`}>
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-700 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats Section */}
              <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                {[
                  { number: '500ms', label: 'Response Time' },
                  { number: '6+', label: 'Languages' },
                  { number: 'GDPR', label: 'Compliant' },
                  { number: '99.9%', label: 'Uptime' }
                ].map((stat, index) => (
                  <div key={index} className="text-center group">
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600 font-medium uppercase tracking-wide">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SignedOut>
      </main>

      {/* Footer */}
      <footer className="relative mt-24">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50/80 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-indigo-800 bg-clip-text text-transparent">
                  VisioLingua
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed max-w-md">
                Transforming visual content into intelligent conversations with AI-powered multimodal understanding.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-indigo-600 transition-colors duration-300">Features</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors duration-300">Pricing</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors duration-300">API</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors duration-300">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-indigo-600 transition-colors duration-300">Documentation</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors duration-300">Help Center</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors duration-300">Contact</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors duration-300">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200/50 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4 md:mb-0">
              <span>© 2025 VisioLingua. All rights reserved.</span>
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="font-medium">GDPR Compliant</span>
              </div>
            </div>
            <div className="flex space-x-6 text-sm text-gray-600">
              <a href="#" className="hover:text-indigo-600 transition-colors duration-300">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-600 transition-colors duration-300">Terms of Service</a>
              <a href="#" className="hover:text-indigo-600 transition-colors duration-300">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}