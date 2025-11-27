import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import apiService from '../services/api';
import '../styles/Chat.css';

function Chat({ onResponseReceived }) {
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: '¡Hola! Soy tu asistente de análisis. Pregúntame sobre el desempeño de leads, prospectos, cierres, canales o cualquier métrica del dashboard.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiService.sendMessage(input);
      
      const assistantMessage = {
        type: 'assistant',
        content: response.response,
        timestamp: new Date(response.timestamp)
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Notificar al componente padre sobre la respuesta
      if (onResponseReceived) {
        onResponseReceived(response.response);
      }
    } catch (error) {
      const errorMessage = {
        type: 'error',
        content: 'Error al procesar tu pregunta. Por favor, intenta nuevamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.type === 'user';
    const isError = message.type === 'error';

    return (
      <div key={index} className={`message ${message.type}`}>
        <div className="message-content">
          {typeof message.content === 'string' ? (
            <p>{message.content}</p>
          ) : (
            <pre>{JSON.stringify(message.content, null, 2)}</pre>
          )}
        </div>
        <div className="message-time">
          {message.timestamp.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat de Análisis</h2>
        <p>Consulta tus métricas con IA</p>
      </div>

      <div className="chat-messages">
        {messages.map(renderMessage)}
        {loading && (
          <div className="message assistant loading">
            <Loader2 className="spinner" />
            <span>Analizando datos...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta sobre tus métricas..."
          disabled={loading}
          className="chat-input"
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="chat-send-btn"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

export default Chat;
