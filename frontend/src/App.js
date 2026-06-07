import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      text: 'Olá! Sou o **GamBot**, assistente especialista em gamificação educacional.\n\nPosso te ajudar com:\n- Mecânicas de gamificação\n- Sistemas de pontos e recompensas\n- Elementos de jogo no aprendizado\n- Projetos de gamificação acadêmica\n\nQual é a sua dúvida?',
      timestamp: new Date(),
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [questCount, setQuestCount] = useState(0);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    setLevel(Math.floor(xp / 100) + 1);
  }, [xp]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        text: data.answer || 'Não consegui processar sua pergunta.',
        sources: data.sources || [],
        timestamp: new Date(),
      }]);

      setXp(prev => prev + 25);
      setQuestCount(prev => prev + 1);

    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        text: 'Erro ao conectar com o servidor. Verifique se o backend está rodando.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      role: 'bot',
      text: 'Nova sessão iniciada. Como posso ajudar?',
      timestamp: new Date(),
    }]);
  };

  return (
    <div className="app-layout">
      <Sidebar xp={xp} level={level} questCount={questCount} apiUrl={API_URL} />
      <ChatWindow
        messages={messages}
        loading={loading}
        onSend={sendMessage}
        onClear={clearChat}
        xp={xp}
        level={level}
      />
    </div>
  );
}

export default App;
