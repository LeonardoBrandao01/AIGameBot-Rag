import React, { useState, useRef, useEffect } from 'react';
import './ChatInput.css';

export default function ChatInput({ onSend, loading }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !loading) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [text]);

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua pergunta sobre gamificação..."
          disabled={loading}
          rows={1}
          aria-label="Mensagem para o GamBot"
        />
        <button
          type="submit"
          className={`send-btn ${loading ? 'loading' : ''}`}
          disabled={loading || !text.trim()}
          aria-label="Enviar mensagem"
        >
          {loading ? '···' : '↑'}
        </button>
      </div>
      <p className="input-hint">
        Enter para enviar · Shift+Enter para nova linha · +25 XP por pergunta
      </p>
    </form>
  );
}
