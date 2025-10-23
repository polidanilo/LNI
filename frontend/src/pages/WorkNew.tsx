import React, { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workService } from '../services/api';
import { useAppContext } from '../context/AppContext';

const WorkNew: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { selectedShift, currentUser } = useAppContext();
  const [searchParams] = useSearchParams();

  // Determina lo stato iniziale basato sulla lista da cui si proviene
  const getInitialStatus = () => {
    const statusParam = searchParams.get('status');
    return statusParam === 'completed' ? 'completed' : 'pending';
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    work_date: new Date().toISOString().split('T')[0],
    notes: '',
    created_by: currentUser?.username || 'User',
    shift_id: selectedShift?.id || 1,
    status: getInitialStatus()
  });

  const [isEditing, setIsEditing] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const categories = ['Campo', 'Officina', 'Servizi', 'Gommoni', 'Barche', 'Vele', 'Altro'];

  // Stato per i dropdown
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const [searchCategories, setSearchCategories] = useState('');

  const filteredCategories = categories.filter(category =>
    category.toLowerCase().includes(searchCategories.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => workService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['works'] });
      navigate('/works');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    createMutation.mutate({
      ...formData,
      category: formData.category as any
    });
  };

  const toggleStatus = () => {
    setFormData(prev => ({
      ...prev,
      status: prev.status === 'pending' ? 'completed' : 'pending'
    }));
  };

  // Funzione per chiudere dropdown quando si clicca fuori
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Element;
    if (!target.closest('.categories-dropdown') && !target.closest('.category-input')) {
      setIsCategoriesDropdownOpen(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F5F4ED', minHeight: 'calc(100vh + 3rem)'}}>
      {/* Header */}
      <div className="bg-white  mb-5 border-b border-gray-200 px-4 py-3 shadow">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-0.9">
            {/* Bottone Indietro */}
            <button
              onClick={() => navigate('/works')}
              className="flex items-center justify-center w-8 h-8 rounded-xl shadow-0 hover:shadow-0 transition-all duration-200 group"
            >
              <span className="text-gray-600 group-hover:text-orange-500 text-sm">✕</span>
            </button>

            {/* Titolo centrale */}
            <div className="flex-1 text-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg hover:transition-all duration-600 group"
              >
                <h1 className="text-xl font-bold text-gray-800 group-hover:text-orange-500 transition-colors duration-200">
                  Nuovo lavoro
                </h1>
              </button>
            </div>

            {/* Spazio vuoto per centrare */}
            <div className="w-8 h-8"></div>
          </div>
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded p-1 pt-0 mb-3 shadow">

            {/* Dettagli divisi come lista lavori */}
            <div className="space-y-0">

              {/* Titolo e Categoria fuori dalla card */}
              <div className="pt-4 pl-4 pr-3.5 mb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Inserisci il titolo del lavoro"
                      className="text-sm font-bold text-orange-500 bg-transparent focus:outline-none border-b-2 border-transparent hover:border-orange-500 transition-all duration-200 w-full min-w-0"
                    />
                    <button
                      onClick={toggleStatus}
                      className={`px-4 py-1.5 rounded-full font-semibold text-sm text-white transition-all duration-200 hover:scale-105 min-w-[110px] text-center inline-flex items-center justify-center ${
                        formData.status === 'pending'
                          ? 'bg-orange-600 hover:bg-green-600 hover:text-white'
                          : 'bg-green-600 hover:bg-orange-600 hover:text-white'
                      }`}
                      title={`Clicca per cambiare in ${formData.status === 'pending' ? 'Concluso' : 'In corso!'}`}
                      onMouseEnter={(e) => {
                        if (formData.status === 'pending') {
                          e.currentTarget.textContent = 'Concluso';
                          e.currentTarget.classList.remove('bg-orange-600');
                          e.currentTarget.classList.add('bg-green-600', 'shadow-md');
                        } else {
                          e.currentTarget.textContent = 'In corso!';
                          e.currentTarget.classList.remove('bg-green-600');
                          e.currentTarget.classList.add('bg-orange-600', 'shadow-md');
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.textContent = formData.status === 'pending' ? 'In corso!' : 'Concluso';
                        if (formData.status === 'pending') {
                          e.currentTarget.classList.remove('bg-green-600', 'shadow-md');
                          e.currentTarget.classList.add('bg-orange-600');
                        } else {
                          e.currentTarget.classList.remove('bg-orange-600', 'shadow-md');
                          e.currentTarget.classList.add('bg-green-600');
                        }
                      }}
                    >
                      {formData.status === 'pending' ? 'In corso!' : 'Concluso'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Categoria */}
              <div className="border-b py-2 border-orange-100 last:border-b-0">
                <div className={`px-4 ${isEditing ? 'py-1.5' : 'py-2'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 text-sm">
                      Categoria
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, category: e.target.value }));
                          setSearchCategories(e.target.value);
                          setIsCategoriesDropdownOpen(true);
                        }}
                        onFocus={() => setIsCategoriesDropdownOpen(true)}
                        className="category-input font-bold text-orange-500 text-sm bg-transparent focus:outline-none w-full min-w-0"
                        placeholder="Seleziona categoria"
                      />
                      <div className="absolute bottom-0 left-0 w-full h-px bg-orange-500"></div>
                      {isCategoriesDropdownOpen && (
                        <div className="categories-dropdown absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          <div className="max-h-48 overflow-y-auto">
                            {filteredCategories.map((category, index) => (
                              <div
                                key={index}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm font-bold"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, category: category }));
                                  setIsCategoriesDropdownOpen(false);
                                  setSearchCategories('');
                                }}
                              >
                                {category}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data */}
              <div className="border-b py-2 border-orange-100 last:border-b-0">
                <div className={`px-4 ${isEditing ? 'py-1.5' : 'py-2'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 text-sm">
                      Data lavoro
                    </span>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.work_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, work_date: e.target.value }))}
                        className="font-bold text-orange-500 text-sm bg-transparent focus:outline-none cursor-pointer"
                      />
                      <div className="absolute bottom-0 left-0 w-full h-px bg-orange-500"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descrizione / Note */}
              <div className="border-b py-2 border-orange-100 last:border-b-0">
                <div className="px-4 pt-2">
                  <div className="space-y-2">
                    <span className="font-bold text-gray-700 text-sm">
                      Descrizione / Note
                    </span>
                    <div className="w-full">
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-bold transition-all duration-600 hover:bg-gray-50 hover:placeholder-orange-500 text-orange-500
                        focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 min-h-[100px] resize-y"
                        placeholder="Aggiungi descrizione o note per questo lavoro"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Pulsanti di azione sotto la card principale */}
          <div className="flex flex-col gap-2.5 mb-6">
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="w-full py-3 px-4 rounded font-semibold text-sm transition-all duration-300 bg-orange-500 hover:bg-orange-600 text-white shadow"
              style={{backgroundColor: '#FF6B35'}}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'inset 0px 0px 100px rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              {createMutation.isPending ? 'Creo...' : 'Aggiungi nuovo lavoro'}
            </button>
            <button
              onClick={() => navigate('/works')}
              className="w-full py-1.5 px-4 rounded font-semibold text-sm transition-all duration-300 bg-white text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 shadow hover:shadow-md"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkNew;
