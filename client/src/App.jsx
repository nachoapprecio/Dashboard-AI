import { useState, useEffect } from 'react';
import { LogOut, User, MessageSquare, BarChart3 } from 'lucide-react';
import Login from './components/Login';
import Chat from './components/Chat';
import Dashboard from './components/Dashboard';
import apiService from './services/api';
import './styles/index.css';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    // Verificar si hay una sesión activa
    if (apiService.isAuthenticated()) {
      setIsAuthenticated(true);
      setUser(apiService.getUser());
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setUser(apiService.getUser());
  };

  const handleLogout = () => {
    apiService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setAiResponse(null);
  };

  const handleResponseReceived = (response) => {
    setAiResponse(response);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <img 
            src="https://estudios.apprecio.com/hubfs/Logo%20Apprecio-03-1.png" 
            alt="Apprecio" 
            className="header-logo"
          />
          <h1 className="header-title">Dashboard AI</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <User size={20} />
            <span>{user?.nombre || user?.email}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={18} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className={`main-chat ${!showChat ? 'hidden' : ''}`}>
          <Chat onResponseReceived={handleResponseReceived} />
        </div>
        <div className={`main-dashboard ${showChat ? 'hidden' : ''}`}>
          <Dashboard aiResponse={aiResponse} />
        </div>

        {/* Toggle para móvil */}
        <button 
          className="mobile-toggle"
          onClick={() => setShowChat(!showChat)}
        >
          {showChat ? <BarChart3 size={24} /> : <MessageSquare size={24} />}
        </button>
      </main>
    </div>
  );
}

export default App;
