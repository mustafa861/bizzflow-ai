'use client'
import { useState, useEffect, useRef } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = Cookies.get('token')
    const userData = Cookies.get('user')
    if (!token || !userData) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(userData))
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    inputRef.current?.focus()
  }, [messages])

  const logout = () => {
    Cookies.remove('token')
    Cookies.remove('user')
    router.push('/login')
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const token = Cookies.get('token')
      const res = await axios.post(
        'http://localhost:8000/api/chat',
        { message: input },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
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
          <div className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm font-medium cursor-pointer">
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
          <div className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors">
            📊 Analytics
          </div>
        </nav>

        {/* User */}
        <div className="border-t border-gray-800 pt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-white font-medium">{user?.full_name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-sm text-gray-400 hover:text-red-400 transition-colors px-2 py-1"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">

        {/* Top Bar */}
        <div className="border-b border-gray-800 px-6 py-4">
          <h2 className="text-white font-medium">AI Chat</h2>
          <p className="text-xs text-gray-500">Ask anything about your business</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-2xl mb-3">👋</p>
                <p className="text-gray-400 text-lg">Hello, {user?.full_name?.split(' ')[0]}!</p>
                <p className="text-gray-600 text-sm mt-1">How can I help your business today?</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl px-4 py-3 text-sm text-gray-400">
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your business..."
              className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 placeholder-gray-500 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl px-5 py-3 text-sm font-medium transition-colors"
            >
              Send
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}