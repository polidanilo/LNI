// src/components/BottomNav.tsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';


const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  console.log('🧭 BottomNav renderizzato - location:', location.pathname);

  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      color: '#10B981', // Emerald

icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: 'Imbarcazioni', 
      path: '/boats', 
      color: '#FF5958', // Rosso LNI
      newPath: '/boats?modal=new',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.5c-3.5 0-6.5 1.5-8 4 1.5 2.5 4.5 4 8 4s6.5-1.5 8-4c-1.5-2.5-4.5-4-8-4zM3 10.5c0-1.5.5-3 1.5-4M21 10.5c0-1.5-.5-3-1.5-4M12 19.5v-5M8 21l4-2 4 2" />
        </svg>
      )
    },
    { 
      name: 'Lavori', 
      path: '/works', 
      color: '#FF9151', // Arancione LNI
      newPath: '/works?modal=new',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      )
    },
    { 
      name: 'Acquisti', 
      path: '/orders', 
      color: '#39A8FB', // Blu
      newPath: '/orders?modal=new',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
  ];

  // Determina quale pagina è attiva per il pulsante +
  const getActivePageForAdd = () => {
    const currentPath = location.pathname;
    if (currentPath.startsWith('/boats')) return navItems.find(item => item.path === '/boats');
    if (currentPath.startsWith('/works')) return navItems.find(item => item.path === '/works');
    if (currentPath.startsWith('/orders')) return navItems.find(item => item.path === '/orders');
    return null;
  };

  const activePageForAdd = getActivePageForAdd();
  const isAddButtonActive = activePageForAdd !== null;

  const handleAddClick = () => {
    if (activePageForAdd?.newPath) {
      navigate(activePageForAdd.newPath);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center items-center">
      <div className="shadow-sm px-2.5 py-1.5 w-full max-w-2xl mx-auto" style={{backgroundColor: 'rgb(17, 17, 17)'}}>
        <div className="flex items-center justify-around">
          {/* Dashboard */}
          <Link
            to={navItems[0].path}
            className={`flex-1 flex items-center justify-center p-3 transition-all duration-200 ${
              location.pathname === navItems[0].path
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {navItems[0].icon}
          </Link>

          {/* Imbarcazioni */}
          <Link
            to={navItems[1].path}
            className={`flex-1 flex items-center justify-center p-3 transition-all duration-200 ${
              location.pathname.startsWith('/boats')
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {navItems[1].icon}
          </Link>

          {/* Pulsante + centrale */}
          <div className="flex-1 flex items-center justify-center relative group px-3 ">
            <button
              onClick={handleAddClick}
              disabled={!isAddButtonActive}
              className={`w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center ${
                isAddButtonActive
                  ? 'text-white hover:opacity-90'
                  : 'text-gray-600'
              }`}
              style={
                isAddButtonActive && activePageForAdd 
                  ? {backgroundColor: activePageForAdd.color, border: '2px solid white'} 
                  : {backgroundColor: ' #2a2a2a', border: '0px solid #047857'}
              }
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 12H4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {/* Tooltip quando disabled */}
            {!isAddButtonActive && (
              <div className="absolute bottom-full mb-2 text-center hidden group-hover:block bg-primary-tip bg-opacity-80 text-white text-xs rounded py-2 px-2 whitespace-nowrap">
                Passa alle altre pagine per poter <br></br> aggiungere problemi / lavori / ordini
              </div>
            )}
          </div>

          {/* Lavori */}
          <Link
            to={navItems[2].path}
            className={`flex-1 flex items-center justify-center p-3 transition-all duration-200 ${
              location.pathname.startsWith('/works')
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {navItems[2].icon}
          </Link>

          {/* Acquisti */}
          <Link
            to={navItems[3].path}
            className={`flex-1 flex items-center justify-center p-3 transition-all duration-200 ${
              location.pathname.startsWith('/orders')
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {navItems[3].icon}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;