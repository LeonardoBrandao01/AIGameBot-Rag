import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './MessageBubble.css';

function formatTime(date) {
  return new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessageBubble({ message }) {
  const [showSources, setShowSources] = useState(false);
  const isBot = message.role === 'bot';

  return (
    <div className={`bubble-wrapper ${isBot ? 'bot' : 'user'}`}>
      {isBot && (
        <div className="bubble-avatar bot-avatar">G</div>
      )}

      <div className={`bubble ${isBot ? 'bubble-bot' : 'bubble-user'}`}>
        {isBot ? (
          <div className="bubble-markdown">
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        ) : (
          <p className="bubble-text">{message.text}</p>
        )}

        <div className="bubble-meta">
          <span className="bubble-time">{formatTime(message.timestamp)}</span>
          {isBot && message.sources && message.sources.length > 0 && (
            <button
              className="sources-toggle"
              onClick={() => setShowSources(s => !s)}
            >
              {showSources ? 'Ocultar fontes' : `${message.sources.length} fonte(s)`}
            </button>
          )}
        </div>

        {showSources && message.sources && (
          <div className="sources-panel">
            <p className="sources-title">Fontes consultadas:</p>
            {message.sources.map((s, i) => (
              <div key={i} className="source-item">
                <div className="source-header">
                  <span className="source-number">#{i + 1}</span>
                  <span className="source-similarity">
                    {Math.round(s.similarity * 100)}% relevância
                  </span>
                </div>
                <p className="source-text">{s.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isBot && (
        <div className="bubble-avatar user-avatar">U</div>
      )}
    </div>
  );
}
