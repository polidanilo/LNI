import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/api';
import { useAppContext } from '../context/AppContext';
import axios from 'axios';

const OrderDetail: React.FC = () => {
  console.log('🚀 OrderDetail component renderizzato');

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedShift } = useAppContext();

  console.log('📋 OrderDetail - ID parametro:', id);
  console.log('📋 OrderDetail - selectedShift:', selectedShift);

  // Controlli di sicurezza iniziali
  if (!id) {
    return (
      <div className="min-h-screen" style={{backgroundColor: '#F5F4ED'}}>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-red-500 text-sm mb-4">ID ordine mancante</div>
          <button
            onClick={() => navigate('/orders')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-300"
            style={{backgroundColor: '#10B981'}}
          >
            ← Torna agli Ordini
          </button>
        </div>
      </div>
    );
  }

  const [isEditing, setIsEditing] = useState(false);

  // Stato per i valori editabili
  const [editedValues, setEditedValues] = useState({
    created_by: '',
    category: '',
    order_date: '',
    notes: ''
  });

  // ✅ Carica utenti dal database
  const { 
    data: usersFromDb = [], 
    isLoading: usersLoading,
    error: usersError
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await axios.get('http://localhost:8000/auth/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        console.log('👥 Utenti caricati dal DB (OrderDetail):', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Errore caricamento utenti:', error);
        return []; // Ritorna array vuoto in caso di errore
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000 // Cache per 5 minuti
  });

  const availableUsers = Array.isArray(usersFromDb) ? usersFromDb.map((u: any) => u.username) : [];

  const availableCategories = [
    'Attrezzatura', 'Materiali', 'Servizi', 'Consulenza',
    'Formazione', 'Manutenzione', 'Software', 'Hardware'
  ];

  // Stati per i dropdown
  const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchCategories, setSearchCategories] = useState('');

  // Stato per conferma eliminazione
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Funzioni per filtrare i risultati
  const filteredUsers = Array.isArray(availableUsers) 
    ? availableUsers.filter((user: string) =>
        user.toLowerCase().includes(searchUsers.toLowerCase())
      )
    : [];

  const filteredCategories = availableCategories.filter(category =>
    category.toLowerCase().includes(searchCategories.toLowerCase())
  );

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      console.log('🔍 Caricamento ordine con ID:', id);
      try {
        const response = await orderService.getById(Number(id));
        console.log('✅ Ordine caricato:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Errore API:', error);
        throw error;
      }
    },
    enabled: !!id,
    retry: 1,
    staleTime: 0
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => orderService.update(Number(id), data),
    onMutate: async (variables) => {
      // Se è un cambio di stato, invalida le query PRIMA dell'aggiornamento
      if (variables.status && Object.keys(variables).length === 1) {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['orders', 'completed'] });
        queryClient.invalidateQueries({ queryKey: ['orders', 'pending'] });
      }
    },
    onSuccess: (data, variables) => {
      // Invalida completamente TUTTE le varianti di query orders possibili
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'completed'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'pending'] });
      queryClient.invalidateQueries({
        queryKey: ['orders'],
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey[0] === 'orders' && queryKey.length > 1;
        }
      });
      queryClient.invalidateQueries({ queryKey: ['order', id] });

      // Se abbiamo cambiato lo stato (variables contiene solo status), naviga indietro
      if (variables.status && Object.keys(variables).length === 1) {
        setTimeout(() => {
          navigate('/orders');
        }, 100);
      } else {
        // Altrimenti è un salvataggio normale, resetta editing
        setIsEditing(false);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => orderService.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate('/orders');
    }
  });

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUsersDropdownOpen && !(event.target as Element).closest('.users-dropdown')) {
        setIsUsersDropdownOpen(false);
      }
      if (isCategoriesDropdownOpen && !(event.target as Element).closest('.categories-dropdown')) {
        setIsCategoriesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUsersDropdownOpen, isCategoriesDropdownOpen]);

  // Gestione sicura degli errori
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{backgroundColor: '#F5F4ED'}}>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-gray-500 text-sm">Caricamento ordine...</div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('❌ Errore nel caricamento ordine:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    return (
      <div className="min-h-screen" style={{backgroundColor: '#F5F4ED'}}>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="text-red-500 text-sm mb-4">
              ❌ Errore nel caricamento ordine
            </div>
            <div className="text-xs text-gray-500 mb-2">
              Status: {error.response?.status || 'Unknown'}
            </div>
            <div className="text-xs text-gray-500 mb-4">
              Message: {error.message || 'Errore sconosciuto'}
            </div>
            <div className="text-xs text-gray-400 mb-4 max-w-md mx-auto">
              {error.response?.data?.detail || error.response?.data?.message || 'Nessun dettaglio disponibile'}
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-300"
              style={{backgroundColor: '#10B981'}}
            >
              ← Torna agli Ordini
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen" style={{backgroundColor: '#F5F4ED'}}>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="text-gray-500 text-sm mb-4">Ordine non trovato</div>
            <button
              onClick={() => navigate('/orders')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-300"
              style={{backgroundColor: '#10B981'}}
            >
              ← Torna agli Ordini
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Controllo aggiuntivo per i dati dell'ordine
  if (!order.id || !order.title) {
    console.error('Dati ordine incompleti:', order);
    return (
      <div className="min-h-screen" style={{backgroundColor: '#F5F4ED'}}>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="text-emerald-500 text-sm mb-4">Ordine trovato ma dati incompleti</div>
            <div className="text-xs text-gray-500 mb-4">ID: {order.id}, Title: {order.title}</div>
            <button
              onClick={() => navigate('/orders')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-300"
              style={{backgroundColor: '#10B981'}}
            >
              ← Torna agli Ordini
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F5F4ED'}}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-0.9">
            {/* Bottone Indietro */}
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center justify-center w-8 h-8 rounded-xl shadow-0 hover:shadow-0 transition-all duration-200 group"
            >
              <span className="text-gray-600 group-hover:text-emerald-600 text-sm">✕</span>
            </button>

            {/* Titolo centrale */}
            <div className="flex-1 text-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg hover:transition-all duration-600 group"
              >
                <h1 className="text-xl font-bold text-gray-800 group-hover:text-emerald-600 transition-colors duration-200">
                  Dettagli acquisto
                </h1>
              </button>
            </div>

            {/* Spazio vuoto per centrare */}
            <div className="w-8 h-8"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-40 pt-5">
        <div className="max-w-4xl mx-auto">

          {/* Titolo e Importo fuori dalla card */}
          <div className="mb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold">
                  {order.title}
                </h1>
                <span className={`px-5 py-1.5 rounded-full font-semibold ${
                  order.status === 'completed'
                    ? 'text-sm text-white bg-green-600 border-green-600'
                    : 'text-sm text-white bg-orange-600 border-orange-600'
                }`}>
                  {order.status === 'completed' ? 'Effettuato' : 'Programmato'}
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                €{order.amount?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
          
          {/* Tasto cambia stato */}
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => {
                // Calcola il nuovo stato - USA 'pending' invece di 'programmato'
                const newStatus = order.status === 'completed' ? 'pending' : 'completed';

                // Aggiornamento ottimistico locale per UI immediata
                // Crea una copia shallow per evitare mutazioni dirette
                const updatedOrder = { ...order, status: newStatus };
                Object.setPrototypeOf(updatedOrder, Object.getPrototypeOf(order));

                // Chiama la mutation
                updateMutation.mutate({ status: newStatus });
              }}
              disabled={updateMutation.isPending}
              className="flex-1 py-3.5 px-4 rounded font-semibold text-sm transition-all duration-300 text-white"
              style={{backgroundColor: '#10B981'}}
              onMouseEnter={(e) => {
                e.currentTarget.style.width = '280px';
                e.currentTarget.style.boxShadow = 'inset 0px 0px 100px rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.width = '50px';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {updateMutation.isPending
                ? 'Aggiorno...'
                : (order.status === 'completed' ? 'Segna come programmato' : 'Segna come effettuato')
              }
            </button>
          </div>

          {/* Pulsanti di azione */}
          <div className="flex gap-3 mb-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    // Salva le modifiche
                    updateMutation.mutate(editedValues);
                  }}
                  disabled={updateMutation.isPending}
                  className="flex-1 py-1.5 px-4 rounded font-semibold text-sm transition-all duration-300 text-white"
                  style={{backgroundColor: '#10B981', boxShadow: 'none'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'inset 0px 0px 100px rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {updateMutation.isPending ? 'Salva' : 'Salva'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    // Resetta i valori editabili
                    if (order) {
                      setEditedValues({
                        created_by: order.created_by || '',
                        category: order.category || '',
                        order_date: order.order_date ? new Date(order.order_date).toISOString().split('T')[0] : '',
                        notes: order.notes || ''
                      });
                    }
                  }}
                  className="flex-1 py-1.5 px-4 rounded font-semibold text-sm transition-all duration-300 bg-white text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 shadow"
                >
                  Annulla
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    // Inizializza i valori editabili con i dati attuali dell'ordine
                    if (order) {
                      setEditedValues({
                        created_by: order.created_by || '',
                        category: order.category || '',
                        order_date: order.order_date ? new Date(order.order_date).toISOString().split('T')[0] : '',
                        notes: order.notes || ''
                      });
                    }
                    setIsEditing(!isEditing);
                  }}
                  className="flex-1 py-1.5 px-4 rounded font-semibold text-sm transition-all duration-300 bg-white text-gray-600 hover:text-emerald-600 hover:bg-gray-50 border border-gray-200 shadow"
                >
                  Modifica
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 py-1.5 px-4 rounded font-semibold text-sm transition-all duration-300 bg-white text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 shadow"
                >
                  Elimina
                </button>
              </>
            )}
          </div>

          {/* Card principale */}
          <div className="bg-white border border-gray-200 rounded p-1 pt-0 mb-3.5 shadow">

            {/* Dettagli divisi come lista ordini */}
            <div className="space-y-0">

              {/* Creato da */}
              <div className="border-b py-2 border-emerald-100 last:border-b-0">
                <div className={`px-4 ${isEditing ? 'py-1.5' : 'py-2'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 text-sm">
                      Creato da
                    </span>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={editedValues.created_by}
                          onChange={(e) => {
                            setEditedValues(prev => ({ ...prev, created_by: e.target.value }));
                            setSearchUsers(e.target.value);
                            setIsUsersDropdownOpen(true);
                          }}
                          onFocus={() => setIsUsersDropdownOpen(true)}
                          className="font-bold text-emerald-600 text-sm bg-transparent focus:outline-none w-full min-w-0"
                          placeholder="Seleziona utente..."
                        />
                        <div className="absolute bottom-0 left-0 w-full h-px bg-emerald-500"></div>
                        {isUsersDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 users-dropdown">
                            <div className="max-h-48 overflow-y-auto">
                              {filteredUsers.length > 0 ? (
                                filteredUsers.map((user, index) => (
                                  <div
                                    key={index}
                                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm font-bold"
                                    onClick={() => {
                                      setEditedValues(prev => ({ ...prev, created_by: user }));
                                      setIsUsersDropdownOpen(false);
                                      setSearchUsers('');
                                    }}
                                  >
                                    {user}
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  {usersLoading ? 'Caricamento utenti...' : 'Nessun utente trovato'}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="font-bold text-emerald-600 text-sm">
                        {order.created_by || 'N/A'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Categoria */}
              <div className="border-b py-2 border-emerald-100 last:border-b-0">
                <div className={`px-4 ${isEditing ? 'py-1.5' : 'py-2'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 text-sm">
                      Categoria
                    </span>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={editedValues.category}
                          onChange={(e) => {
                            setEditedValues(prev => ({ ...prev, category: e.target.value }));
                            setSearchCategories(e.target.value);
                            setIsCategoriesDropdownOpen(true);
                          }}
                          onFocus={() => setIsCategoriesDropdownOpen(true)}
                          className="font-bold text-emerald-600 text-sm bg-transparent focus:outline-none w-full min-w-0"
                          placeholder="Seleziona categoria..."
                        />
                        <div className="absolute bottom-0 left-0 w-full h-px bg-emerald-500"></div>
                        {isCategoriesDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 categories-dropdown">
                            <div className="max-h-48 overflow-y-auto">
                              {filteredCategories.map((category, index) => (
                                <div
                                  key={index}
                                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm font-bold"
                                  onClick={() => {
                                    setEditedValues(prev => ({ ...prev, category: category }));
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
                    ) : (
                      <span className="font-bold text-emerald-600 text-sm">
                        {order.category || 'N/A'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Data */}
              <div className="border-b py-2 border-emerald-100 last:border-b-0">
                <div className={`px-4 ${isEditing ? 'py-1.5' : 'py-2'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 text-sm">
                      Data
                    </span>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="date"
                          value={editedValues.order_date}
                          onChange={(e) => setEditedValues(prev => ({ ...prev, order_date: e.target.value }))}
                          className="font-bold text-emerald-600 text-sm bg-transparent focus:outline-none cursor-pointer"
                        />
                        <div className="absolute bottom-0 left-0 w-full h-px bg-emerald-500"></div>
                      </div>
                    ) : (
                      <span className="font-bold text-emerald-600 text-sm">
                        {order.order_date ? new Date(order.order_date).toLocaleDateString('it-IT') : 'N/A'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Descrizione / Note */}
              <div className="border-b py-2 border-emerald-100 last:border-b-0">
                <div className="px-4 py-2">
                  <div className="space-y-2">
                    <span className="font-bold text-gray-700 text-sm">
                      Descrizione / Note
                    </span>
                    {isEditing ? (
                      <div className="w-full">
                        <textarea
                          value={editedValues.notes}
                          onChange={(e) => setEditedValues(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-bold transition-all duration-600 hover:bg-gray-50 hover:placeholder-emerald-600 text-emerald-600
                          focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px] resize-y"
                          placeholder="Aggiungi descrizione o note per questo acquisto"
                          rows={3}
                        />
                      </div>
                    ) : (
                      <div className="w-full">
                        {order.notes ? (
                          <div className="font-bold text-emerald-600 text-sm whitespace-pre-wrap break-words bg-gray-50 border border-gray-200 rounded p-3 py-2 min-h-[100px]">
                            {order.notes}
                          </div>
                        ) : (
                          <div className="font-bold text-gray-400 text-sm bg-gray-50 border border-gray-200 rounded p-3 min-h-[100px] flex items-center justify-center">
                            Nessuna descrizione o nota
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>



        </div>
      </div>

      {/* Modale di conferma eliminazione */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-4 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-1.5">
              Elimino?
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Sei sicuro di voler eliminare l'ordine "{order.title}"? Questa azione non può essere annullata!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 px-4 rounded font-semibold text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate();
                  setShowDeleteConfirm(false);
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 px-4 rounded font-semibold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Elimina' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
