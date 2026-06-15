'use client'
import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function HRPage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<any[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [requirements, setRequirements] = useState('')
  const [error, setError] = useState('')
  const [showUploadForm, setShowUploadForm] = useState(false)

  const token = Cookies.get('token')

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/hr/candidates', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCandidates(res.data.candidates)
    } catch (err) {
      console.error('Failed to fetch candidates')
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('job_title', jobTitle || 'General Position')
    formData.append('requirements', requirements)

    try {
      const res = await axios.post('http://localhost:8000/api/hr/upload-cv', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      setSelectedCandidate({
        ...res.data.candidate,
        analysis: res.data.analysis
      })
      fetchCandidates()
      setShowUploadForm(false)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const updateStatus = async (candidateId: string, status: string) => {
    try {
      await axios.patch(
        `http://localhost:8000/api/hr/candidates/${candidateId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchCandidates()
      if (selectedCandidate?.id === candidateId) {
        setSelectedCandidate({ ...selectedCandidate, status })
      }
    } catch (err) {
      console.error('Status update failed')
    }
  }

  const handleDelete = async (candidateId: string) => {
    try {
      await axios.delete(`http://localhost:8000/api/hr/candidates/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchCandidates()
      if (selectedCandidate?.id === candidateId) setSelectedCandidate(null)
    } catch (err) {
      console.error('Delete failed')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStatusColor = (status: string) => {
    if (status === 'approved') return 'bg-green-500/20 text-green-400'
    if (status === 'rejected') return 'bg-red-500/20 text-red-400'
    return 'bg-yellow-500/20 text-yellow-400'
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
          <div onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors">
            💬 AI Chat
          </div>
          <div onClick={() => router.push('/dashboard/documents')} className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors">
            📄 Documents
          </div>
          <div onClick={() => router.push('/dashboard/content')} className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors">
            ✍️ Content
          </div>
          <div className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm font-medium cursor-pointer">
            👥 HR Tools
          </div>
          <div
  onClick={() => router.push('/dashboard/analytics')}
  className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors"
>
  👥 Analytics
</div>
        </nav>
        <div className="border-t border-gray-800 pt-4">
          <button
            onClick={() => { Cookies.remove('token'); Cookies.remove('user'); router.push('/login') }}
            className="w-full text-left text-sm text-gray-400 hover:text-red-400 transition-colors px-2 py-1"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">

        {/* Candidates List */}
        <div className="w-80 border-r border-gray-800 flex flex-col">
          <div className="border-b border-gray-800 px-4 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-white font-medium">HR Tools</h2>
              <p className="text-xs text-gray-500">AI CV Screening</p>
            </div>
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            >
              + Upload CV
            </button>
          </div>

          {/* Upload Form */}
          {showUploadForm && (
            <div className="border-b border-gray-800 p-4 bg-gray-900">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2 text-xs mb-3">
                  {error}
                </div>
              )}
              <input
                type="text"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="Job Title (e.g. Software Engineer)"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 placeholder-gray-500 mb-2"
              />
              <textarea
                value={requirements}
                onChange={e => setRequirements(e.target.value)}
                placeholder="Key requirements (optional)"
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 placeholder-gray-500 mb-3 resize-none"
              />
              <label className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-xs font-medium cursor-pointer transition-colors flex items-center justify-center">
                {uploading ? 'Analyzing CV...' : '📄 Select PDF CV'}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          )}

          {/* Candidates */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Candidates ({candidates.length})
            </p>
            {candidates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm">No candidates yet</p>
                <p className="text-gray-700 text-xs mt-1">Upload a CV to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {candidates.map(c => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCandidate(c)}
                    className={`rounded-xl p-3 cursor-pointer transition-colors group border ${
                      selectedCandidate?.id === c.id
                        ? 'bg-blue-600/20 border-blue-500/30'
                        : 'bg-gray-800/50 hover:bg-gray-800 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{c.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{c.email || 'No email'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-sm font-bold ${getScoreColor(c.score)}`}>
                            {c.score}%
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(c.status)}`}>
                            {c.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }}
                        className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Candidate Detail */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedCandidate ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-4xl mb-4">👥</p>
                <p className="text-gray-400">Select a candidate to view details</p>
                <p className="text-gray-600 text-sm mt-1">Or upload a new CV</p>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl">

              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedCandidate.name}</h2>
                  <p className="text-gray-400 text-sm mt-1">{selectedCandidate.email}</p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${getScoreColor(selectedCandidate.score)}`}>
                    {selectedCandidate.score}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">AI Score</p>
                </div>
              </div>

              {/* Status Buttons */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => updateStatus(selectedCandidate.id, 'approved')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCandidate.status === 'approved'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => updateStatus(selectedCandidate.id, 'pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCandidate.status === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  ⏳ Pending
                </button>
                <button
                  onClick={() => updateStatus(selectedCandidate.id, 'rejected')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCandidate.status === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  ✕ Reject
                </button>
              </div>

              {/* Analysis */}
              {selectedCandidate.analysis && (
                <>
                  {/* Strengths */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
                    <h3 className="text-sm font-medium text-white mb-3">✅ Strengths</h3>
                    <ul className="space-y-2">
                      {selectedCandidate.analysis.strengths?.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
                    <h3 className="text-sm font-medium text-white mb-3">⚠️ Areas to Explore</h3>
                    <ul className="space-y-2">
                      {selectedCandidate.analysis.weaknesses?.map((w: string, i: number) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Interview Questions */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <h3 className="text-sm font-medium text-white mb-3">💬 Interview Questions</h3>
                    <ol className="space-y-3">
                      {selectedCandidate.analysis.interview_questions?.map((q: string, i: number) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-3">
                          <span className="text-blue-400 font-medium min-w-[20px]">{i + 1}.</span> {q}
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              )}

              {/* No analysis — show from DB */}
              {!selectedCandidate.analysis && selectedCandidate.interview_questions && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-white mb-3">💬 Interview Questions</h3>
                  <ol className="space-y-3">
                    {JSON.parse(selectedCandidate.interview_questions).map((q: string, i: number) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-3">
                        <span className="text-blue-400 font-medium min-w-[20px]">{i + 1}.</span> {q}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

            </div>
          )}
        </div>

      </main>
    </div>
  )
}