import React, { useRef, useEffect } from 'react';
import './ChatWindow.css';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

const SUGGESTED = [
  'O que é gamificação?',
  'Quais são os principais elementos de gamificação?',
  'Como usar pontos e badges na educação?',
  'Exemplos de gamificação em projetos acadêmicos',
  'Como medir o engajamento na gamificação?',
];

export default function ChatWindow({ messages, loading, onSend, onClear, xp, level }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const showSuggestions = messages.length <= 1;

  return (
    <main className="chat-window">
      <header className="chat-topbar">
        <div className="topbar-info">
          <div className="topbar-avatar">G</div>
          <div>
            <h2 className="topbar-title">GamBot</h2>
            <p className="topbar-status">Especialista em Gamificação Educacional</p>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="level-badge">
            Nível {level} <span className="xp-badge">{xp} XP</span>
          </div>
          <button className="clear-btn" onClick={onClear} title="Nova sessão">
            Nova sessão
          </button>
        </div>
      </header>

      <div className="chat-messages">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="bot-loading">
            <div className="loading-avatar">G</div>
            <div className="loading-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        {showSuggestions && !loading && (
          <div className="suggestions">
            <p className="suggestions-title">Perguntas sugeridas</p>
            <div className="suggestions-grid">
              {SUGGESTED.map((s, i) => (
                <button key={i} className="suggestion-btn" onClick={() => onSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <ChatInput onSend={onSend} loading={loading} />
    </main>
  );
}
