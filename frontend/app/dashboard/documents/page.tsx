'use client'
import { useState, useEffect, useRef } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const token = Cookies.get('token')

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }
    fetchDocuments()
  }, [])

  useEffect(() => {
    if (selectedDoc) {
      inputRef.current?.focus()
    }
  }, [selectedDoc])

  const fetchDocuments = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/documents/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDocuments(res.data.documents)
    } catch (err) {
      console.error('Failed to fetch documents')
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      await axios.post('http://localhost:8000/api/documents/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      fetchDocuments()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleAsk = async () => {
    if (!question.trim() || !selectedDoc) return
    setAsking(true)
    setAnswer('')
    const currentQuestion = question
    setQuestion('')

    try {
      const res = await axios.post(
        `http://localhost:8000/api/documents/ask/${selectedDoc.id}`,
        { question: currentQuestion },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setAnswer(res.data.answer)
    } catch (err) {
      setAnswer('Something went wrong. Please try again.')
    } finally {
      setAsking(false)
      inputRef.current?.focus()
    }
  }

  const handleDelete = async (docId: string) => {
    try {
      await axios.delete(`http://localhost:8000/api/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchDocuments()
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null)
        setAnswer('')
      }
    } catch (err) {
      console.error('Delete failed')
    }
  }

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
          <div className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm font-medium cursor-pointer">
            📄 Documents
          </div>
          <div
  onClick={() => router.push('/dashboard/content')}
  className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors"
>
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
      <main className="flex-1 flex flex-col">

        {/* Top Bar */}
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-medium">Documents</h2>
            <p className="text-xs text-gray-500">Upload PDF and ask questions</p>
          </div>
          <label className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 text-sm font-medium cursor-pointer transition-colors">
            {uploading ? 'Uploading...' : '+ Upload PDF'}
            <input
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">

          {/* Documents List */}
          <div className="w-72 border-r border-gray-800 p-4 overflow-y-auto">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Your Documents</h3>
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm">No documents yet</p>
                <p className="text-gray-700 text-xs mt-1">Upload a PDF to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => { setSelectedDoc(doc); setAnswer(''); setQuestion('') }}
                    className={`rounded-xl p-3 cursor-pointer transition-colors group ${
                      selectedDoc?.id === doc.id
                        ? 'bg-blue-600/20 border border-blue-500/30'
                        : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">📄 {doc.file_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id) }}
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

          {/* Ask Question Area */}
          <div className="flex-1 flex flex-col p-6">
            {!selectedDoc ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl mb-4">📄</p>
                  <p className="text-gray-400">Select a document to ask questions</p>
                  <p className="text-gray-600 text-sm mt-1">Or upload a new PDF</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h3 className="text-white font-medium">{selectedDoc.file_name}</h3>
                  <p className="text-xs text-gray-500 mt-1">Ask any question about this document</p>
                </div>

                {answer && (
                  <div className="bg-gray-800 rounded-2xl p-4 mb-4 flex-1 overflow-y-auto">
                    <p className="text-xs text-gray-500 mb-2">Answer</p>
                    <p className="text-gray-100 text-sm leading-relaxed">{answer}</p>
                  </div>
                )}

                <div className="flex gap-3 mt-auto">
                  <input
                    ref={inputRef}
                    type="text"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAsk()}
                    placeholder="Ask a question about this document..."
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 placeholder-gray-500 transition-colors"
                  />
                  <button
                    onClick={handleAsk}
                    disabled={asking}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl px-5 py-3 text-sm font-medium transition-colors"
                  >
                    {asking ? '...' : 'Ask'}
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}