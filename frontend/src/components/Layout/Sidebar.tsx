import React, { useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const Sidebar: React.FC = () => {
  const { sidebarOpen, setSidebarOpen, setToken } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Determina se siamo nella sezione lavori per applicare colori arancioni
  const isWorksSection = location.pathname.startsWith('/works');

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen, setSidebarOpen]);

  const menuItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Resoconto', path: '/reports', icon: '📊' },
    { name: 'Acquisti', path: '/orders', icon: '📦' },
    { name: 'Lavori', path: '/works', icon: '🔧' },
    { name: 'Infermieria', path: '/infirmary', icon: '🏥' },
    { name: 'Imbarcazioni', path: '/boats', icon: '⛵' },
  ];

  return (
    <aside
      ref={sidebarRef}
      className={`${
        sidebarOpen ? 'w-64 bg-white border-r border-gray-200' : 'w-0 bg-transparent'
      } text-gray-900 transition-all duration-300 flex flex-col fixed left-0 top-0 h-full z-50 overflow-hidden`}
    >
      {/* Logo */}
      <div className={`p-3 border-b ${sidebarOpen ? 'border-gray-200' : 'border-transparent'}`}>
        <div className="flex items-center justify-center">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className={`flex items-center hover:bg-gray-100 rounded-lg p-2 transition-all duration-300 relative group ${
              sidebarOpen ? 'hover:bg-gray-100' : 'hover:bg-transparent'
            }`}
          >
            <span className={`text-2xl transition-transform duration-300 ${sidebarOpen ? 'scale-100' : 'scale-90'}`}>
              ⚓
            </span>
            {sidebarOpen && (
              <span className={`ml-2 font-bold text-lg transition-all duration-300 ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
                LNI
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Menu items */}
      <nav className={`flex-1 p-3 space-y-1 ${sidebarOpen ? '' : 'opacity-0 pointer-events-none'}`}>
        {menuItems.map((item, index) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-300 group ${
              sidebarOpen ? 'justify-start' : 'justify-center'
            } ${
              location.pathname === item.path
                ? isWorksSection
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            }`}
            title={!sidebarOpen ? item.name : ''}
            style={{
              animationDelay: `${index * 50}ms`
            }}
          >
            <span className={`text-xl transition-all duration-300 ${sidebarOpen ? 'scale-100' : 'scale-110'}`}>
              {item.icon}
            </span>
            {sidebarOpen && (
              <span className={`ml-3 font-medium transition-all duration-300 ${
                sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
              }`}>
                {item.name}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            {/* User avatar */}
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                isWorksSection ? 'bg-orange-500' : 'bg-blue-600'
              }`}>
                U
              </div>
              <div className="text-sm text-gray-700">User</div>
            </div>

            {/* Logout */}
            <button
              onClick={() => {
                setToken(null);
                navigate('/login');
              }}
              className="text-sm text-red-500 hover:text-red-600 hover:underline transition-colors"
            >
              logout
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;