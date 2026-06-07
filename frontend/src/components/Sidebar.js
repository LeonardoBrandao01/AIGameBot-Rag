import React, { useState, useEffect } from 'react';
import './Sidebar.css';

const ACHIEVEMENTS = [
  { id: 1, label: 'Primeira Pergunta', xpReq: 25 },
  { id: 2, label: 'Explorador',        xpReq: 100 },
  { id: 3, label: 'Consistente',       xpReq: 250 },
  { id: 4, label: 'Especialista',      xpReq: 500 },
  { id: 5, label: 'Mestre',            xpReq: 1000 },
];

const TIPS = [
  'Gamificação aumenta o engajamento em até 48%',
  'Badges e pontos ativam circuitos de recompensa',
  'Leaderboards estimulam competição saudável',
  'Mecânicas de jogo melhoram retenção de conteúdo',
  'Recompensas variáveis mantêm o interesse',
  'Progresso visível motiva a continuidade',
];

export default function Sidebar({ xp, level, questCount, apiUrl }) {
  const [status, setStatus] = useState('checking');
  const [tipIdx, setTipIdx] = useState(0);
  const [docs, setDocs] = useState(0);

  const xpInLevel  = xp % 100;
  const xpToNext   = 100 - xpInLevel;

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${apiUrl}/health`);
        if (r.ok) {
          const d = await r.json();
          setStatus('online');
          setDocs(d.documents_in_db || 0);
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('offline');
      }
    };
    check();
    const iv = setInterval(check, 30_000);
    return () => clearInterval(iv);
  }, [apiUrl]);

  useEffect(() => {
    const iv = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 6000);
    return () => clearInterval(iv);
  }, []);

  const statusConfig = {
    checking: { color: 'var(--yellow)', label: 'Verificando...' },
    online:   { color: 'var(--green)',  label: `Online — ${docs} docs` },
    offline:  { color: 'var(--red)',    label: 'Offline' },
    error:    { color: 'var(--red)',    label: 'Erro' },
  };
  const st = statusConfig[status];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="gambot-logo">
          <div className="logo-icon">G</div>
          <div>
            <h1 className="logo-title">GamBot</h1>
            <p className="logo-sub">Assistente RAG</p>
          </div>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="status-row">
          <span className="status-dot" style={{ background: st.color }} />
          <span className="status-label">{st.label}</span>
        </div>
      </div>

      <div className="sidebar-section player-card">
        <div className="player-header">
          <div className="player-avatar">U</div>
          <div>
            <p className="player-name">Usuário</p>
            <p className="player-class">Pesquisador de Gamificação</p>
          </div>
        </div>

        <div className="xp-section">
          <div className="xp-labels">
            <span>Nível {level}</span>
            <span>{xpInLevel}/100 XP</span>
          </div>
          <div className="xp-bar-bg">
            <div className="xp-bar-fill" style={{ width: `${xpInLevel}%` }} />
          </div>
          <p className="xp-next">+{xpToNext} XP para o próximo nível</p>
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-value">{xp}</span>
            <span className="stat-label">XP Total</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{level}</span>
            <span className="stat-label">Nível</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{questCount}</span>
            <span className="stat-label">Perguntas</span>
          </div>
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="section-title">Conquistas</h3>
        <div className="achievements">
          {ACHIEVEMENTS.map(a => (
            <div
              key={a.id}
              className={`achievement ${xp >= a.xpReq ? 'unlocked' : 'locked'}`}
              title={xp >= a.xpReq ? a.label : `Desbloqueie com ${a.xpReq} XP`}
            >
              <span className="ach-dot" />
              <span className="ach-label">{a.label}</span>
              {xp < a.xpReq && (
                <span className="ach-lock">{a.xpReq} XP</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-tip">
        <p key={tipIdx} className="tip-text">{TIPS[tipIdx]}</p>
      </div>
    </aside>
  );
}
