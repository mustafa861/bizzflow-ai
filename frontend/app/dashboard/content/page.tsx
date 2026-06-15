'use client'
import { useState, useEffect, useRef } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function ContentPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    type: 'instagram',
    topic: '',
    tone: 'professional',
    language: 'english'
  })
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const token = Cookies.get('token')

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/content/history', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHistory(res.data.history)
    } catch (err) {
      console.error('Failed to fetch history')
    }
  }

  const handleGenerate = async () => {
    if (!form.topic.trim()) return
    setLoading(true)
    setError('')
    setOutput('')

    try {
      const res = await axios.post(
        'http://localhost:8000/api/content/generate',
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setOutput(res.data.content)
      fetchHistory()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:8000/api/content/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchHistory()
    } catch (err) {
      console.error('Delete failed')
    }
  }

  const typeOptions = [
    { value: 'instagram', label: '📸 Instagram' },
    { value: 'facebook', label: '👍 Facebook' },
    { value: 'blog', label: '✍️ Blog' },
    { value: 'email', label: '📧 Email' },
    { value: 'whatsapp', label: '💬 WhatsApp' },
  ]

  const toneOptions = [
    { value: 'professional', label: '👔 Professional' },
    { value: 'casual', label: '😊 Casual' },
    { value: 'funny', label: '😄 Funny' },
  ]

  const langOptions = [
    { value: 'english', label: '🇬🇧 English' },
    { value: 'roman_urdu', label: '🇵🇰 Roman Urdu' },
    { value: 'urdu', label: '🇵🇰 Urdu' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">BizFlow AI</h1>
          <p className="text-xs text-gray-500 mt-1">Business Assistant</p>
        </div>
        <nav className="flex-1 space-y-1">
          <div
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors"
          >
            💬 AI Chat
          </div>
          <div
            onClick={() => router.push('/dashboard/documents')}
            className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors"
          >
            📄 Documents
          </div>
          <div className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm font-medium cursor-pointer">
            ✍️ Content
          </div>
          <div
  onClick={() => router.push('/dashboard/hr')}
  className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors"
>
  👥 HR Tools
</div>
          <div className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors">
            📊 Analytics
          </div>
        </nav>
        <div className="border-t border-gray-800 pt-4">
          <button
            onClick={() => {
              Cookies.remove('token')
              Cookies.remove('user')
              router.push('/login')
            }}
            className="w-full text-left text-sm text-gray-400 hover:text-red-400 transition-colors px-2 py-1"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">

        {/* Generator Panel */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">

          {/* Top Bar */}
          <div className="mb-6">
            <h2 className="text-white font-medium text-lg">Content Generator</h2>
            <p className="text-xs text-gray-500 mt-1">Generate social media, blog, and email content with AI</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">

            {/* Content Type */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Content Type</label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm({ ...form, type: opt.value })}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      form.type === opt.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Topic / Product</label>
              <input
                type="text"
                value={form.topic}
                onChange={e => setForm({ ...form, topic: e.target.value })}
                placeholder="e.g. New summer collection launch, Restaurant special offer..."
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 placeholder-gray-500 transition-colors"
              />
            </div>

            {/* Tone */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Tone</label>
              <div className="flex gap-2">
                {toneOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm({ ...form, tone: opt.value })}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      form.tone === opt.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="mb-6">
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Language</label>
              <div className="flex gap-2">
                {langOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm({ ...form, language: opt.value })}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      form.language === opt.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !form.topic.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-medium transition-colors"
            >
              {loading ? 'Generating...' : '✨ Generate Content'}
            </button>
          </div>

          {/* Output */}
          {output && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Generated Content</p>
                <button
                  onClick={handleCopy}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-gray-100 text-sm leading-relaxed whitespace-pre-line">{output}</p>
            </div>
          )}
        </div>

        {/* History Panel */}
        <div className="w-72 border-l border-gray-800 p-4 overflow-y-auto">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Recent Content</h3>
          {history.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No content yet</p>
          ) : (
            <div className="space-y-2">
              {history.map(item => (
                <div
                  key={item.id}
                  onClick={() => setOutput(item.output)}
                  className="bg-gray-800/50 hover:bg-gray-800 border border-transparent rounded-xl p-3 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-400 mb-1 capitalize">{item.type}</p>
                      <p className="text-sm text-white truncate">{item.topic}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                      className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}