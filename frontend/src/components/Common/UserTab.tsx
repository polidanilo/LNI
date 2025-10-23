import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const UserTab: React.FC = () => {
  const { currentUser, setToken, setCurrentUser, setSelectedSeason, setSelectedShift } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setSelectedSeason(null);
    setSelectedShift(null);
    navigate('/login');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const displayName = currentUser?.full_name || currentUser?.username || '';
  const firstLetter = displayName.charAt(0);

  return (
    <div className="bg-white border border-gray-200 rounded px-1 pt-1 pb-1 shadow mt-1 mb-3">
      <div className="px-4 pt-4 pb-3">
        {currentUser ? (
          // Utente loggato: icona, nome utente, logout cliccabile sotto
          <div className="flex gap-4">
            {/* Avatar circolare con prima lettera */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ backgroundColor: '#0F4295' }}
            >
              {firstLetter}
            </div>

            {/* Nome utente e logout */}
            <div className="flex-1 min-w-0">
              
              <p className="text font-medium text-gray-800 mb-0 leading-tight">
               Ciao {displayName}! Buon lavoro :)
              </p>
              <button
                onClick={handleLogout}
                className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          // Utente non loggato: icona X, messaggio e pulsante login
          <div className="flex items-center gap-3">
            {/* Avatar circolare con X */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: '#0F4295'}}
            >
              ✕
            </div>

            {/* Messaggio e pulsante */}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 mb-1">
                Non sei loggato!
              </p>
              <button
                onClick={handleGoToLogin}
                className="px-3 py-1.5 text-white text-xs font-medium rounded transition-all duration-300"
                style={{ backgroundColor: '#0F4295' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0px 0px 100px rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Vai alla pagina di login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTab;
