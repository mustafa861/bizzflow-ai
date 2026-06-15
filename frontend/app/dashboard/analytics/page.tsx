'use client'
import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface Summary {
  total_documents: number
  total_content: number
  total_candidates: number
  approved_candidates: number
  rejected_candidates: number
  avg_cv_score: number
}

interface RecentContent {
  type: string
  topic: string
  created_at: string
}

interface AnalyticsData {
  summary: Summary
  content_by_type: Record<string, number>
  recent_content: RecentContent[]
}

const typeEmoji: Record<string, string> = {
  instagram: '📸',
  facebook: '👍',
  blog: '✍️',
  email: '📧',
  whatsapp: '💬',
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-1">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-semibold ${accent ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  )
}

function MiniBar({ label, value, max, emoji }: { label: string; value: number; max: number; emoji?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-24 text-gray-400 capitalize shrink-0">
        {emoji && <span className="mr-1">{emoji}</span>}
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right">{value}</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token = Cookies.get('token')

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get('http://localhost:8000/api/analytics/summary', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const contentTypeTotal = data
    ? Object.values(data.content_by_type).reduce((a, b) => a + b, 0)
    : 0

  const candidateTotal = data?.summary.total_candidates ?? 0
  const approvedPct =
    candidateTotal > 0
      ? Math.round(((data?.summary.approved_candidates ?? 0) / candidateTotal) * 100)
      : 0
  const rejectedPct =
    candidateTotal > 0
      ? Math.round(((data?.summary.rejected_candidates ?? 0) / candidateTotal) * 100)
      : 0

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
          <div className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm font-medium cursor-pointer">
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

      {/* Main */}
      <main className="flex-1 p-6 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-medium text-lg">Analytics</h2>
            <p className="text-xs text-gray-500 mt-1">Overview of your documents, content, and HR activity</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="text-xs text-blue-400 hover:text-blue-300 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 rounded-lg px-3 py-2 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600 text-sm">Loading analytics…</p>
          </div>
        ) : data ? (
          <div className="space-y-6">

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Documents" value={data.summary.total_documents} sub="Uploaded files" />
              <StatCard label="Content Generated" value={data.summary.total_content} sub="All time" />
              <StatCard label="Candidates" value={data.summary.total_candidates} sub="CVs reviewed" />
              <StatCard
                label="Approved"
                value={data.summary.approved_candidates}
                sub={`${approvedPct}% of candidates`}
                accent="text-green-400"
              />
              <StatCard
                label="Rejected"
                value={data.summary.rejected_candidates}
                sub={`${rejectedPct}% of candidates`}
                accent="text-red-400"
              />
              <StatCard
                label="Avg CV Score"
                value={data.summary.avg_cv_score ? `${data.summary.avg_cv_score}%` : '—'}
                sub="Across all candidates"
                accent="text-blue-400"
              />
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Content by Type */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Content by Type</p>
                {Object.keys(data.content_by_type).length === 0 ? (
                  <p className="text-gray-600 text-sm py-4 text-center">No content generated yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.content_by_type)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => (
                        <MiniBar
                          key={type}
                          label={type}
                          value={count}
                          max={contentTypeTotal}
                          emoji={typeEmoji[type]}
                        />
                      ))}
                  </div>
                )}
              </div>

              {/* Recent Content */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Recent Content</p>
                {data.recent_content.length === 0 ? (
                  <p className="text-gray-600 text-sm py-4 text-center">No recent content</p>
                ) : (
                  <div className="space-y-2">
                    {data.recent_content.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-3 py-2.5"
                      >
                        <span className="text-base">{typeEmoji[item.type] ?? '📝'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{item.topic}</p>
                          <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                        </div>
                        <p className="text-xs text-gray-600 shrink-0">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : null}
      </main>
    </div>
  )
}