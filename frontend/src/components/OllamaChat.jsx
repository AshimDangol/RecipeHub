import { useState, useRef, useEffect, useCallback } from 'react'
import { chatApi } from '../api.js'

const SUGGESTIONS = [
  'Give me a quick weeknight dinner idea',
  'What can I make with chicken and lemon?',
  'Tips for perfect scrambled eggs',
  'Who is Gordon Ramsay?',
  'How do I create a recipe on RecipeNest?',
]

function TypingDots() {
  return (
    <span className="chat-typing-dots">
      <span /><span /><span />
    </span>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`chat-msg ${isUser ? 'chat-msg-user' : 'chat-msg-bot'}`}>
      {!isUser && (
        <div className="chat-msg-avatar">🤖</div>
      )}
      <div className="chat-msg-bubble">
        {msg.content || <TypingDots />}
      </div>
      {isUser && (
        <div className="chat-msg-avatar chat-msg-avatar-user">👤</div>
      )}
    </div>
  )
}

export default function OllamaChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm ChefBot 🍳 Ask me anything about recipes, cooking techniques, chefs, or how to use RecipeNest!",
    },
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(false)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  const send = useCallback(async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || streaming) return

    setInput('')
    setError('')
    abortRef.current = false

    // Add user message
    const userMsg = { role: 'user', content: msg }
    // Add empty bot placeholder
    const botMsg = { role: 'assistant', content: '' }

    setMessages(prev => [...prev, userMsg, botMsg])
    setStreaming(true)

    // Build history (exclude the empty placeholder we just added)
    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

    try {
      await chatApi.sendMessage(
        msg,
        history,
        (token) => {
          if (abortRef.current) return
          setMessages(prev => {
            const next = [...prev]
            next[next.length - 1] = {
              ...next[next.length - 1],
              content: next[next.length - 1].content + token,
            }
            return next
          })
        },
        () => { setStreaming(false) },
      )
    } catch (err) {
      setError(err.message || 'Something went wrong. Is Ollama running?')
      // Remove the empty bot placeholder
      setMessages(prev => prev.slice(0, -1))
      setStreaming(false)
    }
  }, [input, messages, streaming])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const clearChat = () => {
    abortRef.current = true
    setStreaming(false)
    setError('')
    setMessages([{
      role: 'assistant',
      content: "Hi! I'm ChefBot 🍳 Ask me anything about recipes, cooking techniques, chefs, or how to use RecipeNest!",
    }])
  }

  return (
    <>
      {/* Floating button */}
      <button
        className={`chat-fab${open ? ' chat-fab-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open ChefBot chat"
        title="ChefBot — AI cooking assistant"
      >
        {open ? '✕' : '🤖'}
        {!open && <span className="chat-fab-label">ChefBot</span>}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-header-icon">🤖</span>
              <div>
                <div className="chat-header-title">ChefBot</div>
                <div className="chat-header-sub">Powered by Ollama · Always cooking</div>
              </div>
            </div>
            <div className="chat-header-actions">
              <button className="chat-icon-btn" onClick={clearChat} title="Clear chat">🗑</button>
              <button className="chat-icon-btn" onClick={() => setOpen(false)} title="Close">✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {error && (
              <div className="chat-error">
                ⚠️ {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions — only show when just the greeting is there */}
          {messages.length === 1 && (
            <div className="chat-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="chat-suggestion" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-row">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Ask about recipes, chefs, cooking tips…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={streaming}
            />
            <button
              className="chat-send-btn"
              onClick={() => send()}
              disabled={!input.trim() || streaming}
              title="Send"
            >
              {streaming ? <span className="chat-send-spinner" /> : '➤'}
            </button>
          </div>
          <p className="chat-footer-note">Shift+Enter for new line · Enter to send</p>
        </div>
      )}
    </>
  )
}
