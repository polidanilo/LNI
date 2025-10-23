import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workService } from '../services/api';
import { useAppContext } from '../context/AppContext';
import axios from 'axios';

const WorkDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedShift } = useAppContext();

  // Controlli di sicurezza iniziali
  if (!id) {
    return (
      <div className="min-h-screen" style={{backgroundColor: '#F5F4ED'}}>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-red-500 text-sm mb-4">ID lavoro mancante</div>
          <button
            onClick={() => navigate('/works')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-300"
            style={{backgroundColor: '#FF6B35'}}
          >
            ← Torna ai Lavori
          </button>
        </div>
      </div>
    );
  }

const [isEditing, setIsEditing] = useState(false);
const [searchUsers, setSearchUsers] = useState('');
const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(false);

// Stato per i valori editabili - INIZIALIZZA VUOTO
const [editedValues, setEditedValues] = useState({
  user_id: 0,
  category: '',
  work_date: '',
  notes: ''
});

// ✅ PUNTO 1: URL corretto /auth/users
const { 
  data: usersFromDb = [], 
  isLoading: usersLoading,
  error: usersError
} = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const response = await axios.get('http://localhost:8000/auth/users', {  // ← CORRETTO
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    console.log('👥 Utenti caricati dal DB:', response.data);
    return response.data.map((u: any) => ({ id: u.id, name: u.username }));
  }
});

const availableUsers = usersFromDb;

// ✅ PUNTO 2: Filtra gli utenti in base alla ricerca
const filteredUsers = availableUsers.filter(user => 
  user.name.toLowerCase().includes(searchUsers.toLowerCase())
);

// ✅ PUNTO 3: Trova il nome dell'utente corrente per mostrarlo nell'input
const currentUserName = availableUsers.find(u => u.id === editedValues.user_id)?.name || '';  

  const availableCategories = [
    'Campo', 'Officina', 'Servizi', 'Gommoni', 'Barche', 'Vele', 'Altro'
  ];

  // Stati per i dropdown
// Stati per i dropdown (altri stati già dichiarati sopra)
const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
const [searchCategories, setSearchCategories] = useState('');

  // Stato per conferma eliminazione
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filteredCategories = availableCategories.filter(category =>
    category.toLowerCase().includes(searchCategories.toLowerCase())
  );

  const { data: work, isLoading, error } = useQuery({
    queryKey: ['work', id],
    queryFn: async () => {
      const response = await workService.getById(Number(id));
      console.log('🔄 Dati lavoro ricaricati:', response.data);
      console.log('🔄 Controllo campo created_by:', response.data.created_by);
      return response.data;
    },
    enabled: !!id
  });

// ✅ PUNTO 4: Inizializza editedValues quando carichi il lavoro
useEffect(() => {
  if (work && !isEditing) {
    console.log('📝 Inizializzazione valori da work:', work);
    setEditedValues({
      user_id: work.user_id || 0,
      category: work.category || '',
      work_date: work.work_date ? new Date(work.work_date).toISOString().split('T')[0] : '',
      notes: work.description || ''
    });
  }
}, [work, isEditing]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      // Se è solo un cambio di stato
      if (data.status && Object.keys(data).length === 1) {
        console.log('🔄 Cambio stato semplice:', data);
        return workService.update(Number(id), data);
      }

      // Altrimenti è una modifica completa - mappa i campi per l'API
      const mappedData: any = {
        category: data.category,
        work_date: data.work_date,
        description: data.notes, // L'API si aspetta 'description', non 'notes'
        user_id: data.user_id, // Invia user_id invece di created_by
      };

      console.log('🔄 Dati originali:', data);
      console.log('🔄 Campo user_id inviato:', data.user_id);
      console.log('🔄 Dati mappati per API:', mappedData);

      return workService.update(Number(id), mappedData);
    },
    onMutate: async (variables) => {
      // Se è un cambio di stato, invalida le query PRIMA dell'aggiornamento
      if (variables.status && Object.keys(variables).length === 1) {
        queryClient.invalidateQueries({ queryKey: ['works'] });
        queryClient.invalidateQueries({ queryKey: ['works', 'completed'] });
        queryClient.invalidateQueries({ queryKey: ['works', 'pending'] });
      }
    },
    onSuccess: (data, variables) => {
      console.log('✅ Salvataggio completato - dati ricevuti:', data);
      console.log('✅ Variabili inviate:', variables);

      // Forza il refresh dei dati del singolo lavoro
      queryClient.invalidateQueries({ queryKey: ['work', id] });
      queryClient.refetchQueries({ queryKey: ['work', id] });

      console.log('🔄 Query invalidate e refetch completati');

      // Se abbiamo cambiato lo stato (variables contiene solo status), naviga indietro
      if (variables.status && Object.keys(variables).length === 1) {
        setTimeout(() => {
          navigate('/works');
        }, 100);
      } else {
        // Altrimenti è un salvataggio normale, resetta editing
        console.log('🔄 Reset modalità modifica');
        setIsEditing(false);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => workService.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['works'] });
      navigate('/works');
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
          <div className="text-gray-500 text-sm">Caricamento lavoro...</div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Errore nel caricamento lavoro:', error);
    return (
      <div className="min-h-screen" style={{backgroundColor: '#F5F4ED'}}>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="text-red-500 text-sm mb-4">Errore nel caricamento: {error.message || 'Errore sconosciuto'}</div>
            <button
              onClick={() => navigate('/works')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-300"
              style={{backgroundColor: '#FF6B35'}}
            >
              ← Torna ai Lavori
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="min-h-screen" style={{backgroundColor: '#F5F4ED'}}>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="text-gray-500 text-sm mb-4">Lavoro non trovato</div>
            <button
              onClick={() => navigate('/works')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-300"
              style={{backgroundColor: '#FF6B35'}}
            >
              ← Torna ai Lavori
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Controllo aggiuntivo per i dati del lavoro
  if (!work.id || !work.title) {
    console.error('Dati lavoro incompleti:', work);
    return (
      <div className="min-h-screen" style={{backgroundColor: '#F5F4ED'}}>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="text-orange-500 text-sm mb-4">Dati lavoro incompleti</div>
            <button
              onClick={() => navigate('/works')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-300"
              style={{backgroundColor: '#FF6B35'}}
            >
              ← Torna ai Lavori
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
              onClick={() => {
                console.log('🔙 Navigazione indietro a /works');
                navigate('/works');
              }}
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
                  Dettagli lavoro
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

          {/* Titolo e Categoria fuori dalla card */}
          <div className="mb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold">
                  {work.title}
                </h1>
                <span className={`px-5 py-1.5 rounded-full font-semibold ${
                  work.status === 'completed'
                    ? 'text-sm text-white bg-green-600 border-green-600'
                    : 'text-sm text-white bg-orange-600 border-orange-600'
                }`}>
                  {work.status === 'completed' ? 'Concluso' : 'In corso!'}
                </span>
              </div>
            </div>
          </div>

          {/* Tasto cambia stato */}
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => {
                // Calcola il nuovo stato - USA 'pending' invece di 'da fare'
                const newStatus = work.status === 'completed' ? 'pending' : 'completed';

                // Aggiornamento ottimistico locale per UI immediata
                // Crea una copia shallow per evitare mutazioni dirette
                const updatedWork = { ...work, status: newStatus };
                Object.setPrototypeOf(updatedWork, Object.getPrototypeOf(work));

                console.log('🔄 Cambio stato da:', work.status, 'a:', newStatus);

                // Chiama la mutation
                updateMutation.mutate({ status: newStatus });
              }}
              disabled={updateMutation.isPending}
              className="flex-1 py-3.5 px-4 rounded font-semibold text-sm transition-all duration-300 text-white"
              style={{backgroundColor: '#FF6B35'}}
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
                : (work.status === 'completed' ? 'Segna come in corso' : 'Segna come concluso')
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
                    console.log('💾 Salvataggio modifiche - editedValues completo:', editedValues);
                    console.log('💾 Campo user_id da inviare:', editedValues.user_id);
                    console.log('💾 Campo user_id tipo:', typeof editedValues.user_id);
                    updateMutation.mutate(editedValues);
                  }}
                  disabled={updateMutation.isPending}
                  className="flex-1 py-1.5 px-4 rounded font-semibold text-sm transition-all duration-300 text-white"
                  style={{backgroundColor: '#FF6B35', boxShadow: 'none'}}
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
    setSearchUsers('');
    setIsUsersDropdownOpen(false);
    // Resetta i valori editabili
    if (work) {
      setEditedValues({
        user_id: work.user_id || 0,
        category: work.category || '',
        work_date: work.work_date ? new Date(work.work_date).toISOString().split('T')[0] : '',
        notes: work.description || ''
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
    // Inizializza i valori editabili con i dati attuali del lavoro
    if (work) {
      console.log('📝 Inizializzazione modalità modifica con valori:', work);
      setEditedValues({
        user_id: work.user_id || 0,
        category: work.category || '',
        work_date: work.work_date ? new Date(work.work_date).toISOString().split('T')[0] : '',
        notes: work.description || ''
      });
    }
    setIsEditing(true);  // ← CAMBIA DA !isEditing a true
  }}
  className="flex-1 py-1.5 px-4 rounded font-semibold text-sm transition-all duration-300 bg-white text-gray-600 hover:text-orange-500 hover:bg-gray-50 border border-gray-200 shadow"
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

            {/* Dettagli divisi come lista lavori */}
            <div className="space-y-0">

{/* Creato da */}
<div className="border-b py-2 border-blue-100 last:border-b-0">
  <div className={`px-4 ${isEditing ? 'py-1.5' : 'py-2'}`}>
    <div className="flex items-center justify-between">
      <span className="font-bold text-gray-700 text-sm">
        Creato o modificato da
      </span>
      {isEditing ? (
        <div className="relative">
          <input
            type="text"
            value={currentUserName}  // ← USA currentUserName invece di editedValues.created_by
            onChange={(e) => {
              setSearchUsers(e.target.value);
              setIsUsersDropdownOpen(true);
            }}
            onFocus={() => setIsUsersDropdownOpen(true)}
            className="font-bold text-orange-500 text-sm bg-transparent focus:outline-none w-full min-w-0"
            placeholder="Seleziona utente..."
          />
          <div className="absolute bottom-0 left-0 w-full h-px bg-orange-500"></div>
          {isUsersDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 users-dropdown">
              <div className="max-h-48 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}  // ← USA user.id come key
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm font-bold"
                    onClick={() => {
                      // ✅ SALVA user_id invece di username
                      setEditedValues(prev => ({ ...prev, user_id: user.id }));
                      setIsUsersDropdownOpen(false);
                      setSearchUsers('');
                    }}
                  >
                    {user.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <span className="font-bold text-orange-500 text-sm">
          {work?.created_by || 'N/A'}
        </span>
      )}
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
                          className="font-bold text-orange-500 text-sm bg-transparent focus:outline-none w-full min-w-0"
                          placeholder="Seleziona categoria..."
                        />
                        <div className="absolute bottom-0 left-0 w-full h-px bg-orange-500"></div>
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
                      <span className="font-bold text-orange-500 text-sm">
                        {work.category || 'N/A'}
                      </span>
                    )}
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
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="date"
                          value={editedValues.work_date}
                          onChange={(e) => setEditedValues(prev => ({ ...prev, work_date: e.target.value }))}
                          className="font-bold text-orange-500 text-sm bg-transparent focus:outline-none cursor-pointer"
                        />
                        <div className="absolute bottom-0 left-0 w-full h-px bg-orange-500"></div>
                      </div>
                    ) : (
                      <span className="font-bold text-orange-500 text-sm">
                        {work.work_date ? new Date(work.work_date).toLocaleDateString('it-IT') : 'N/A'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Descrizione / Note */}
              <div className="border-b py-2 border-orange-100 last:border-b-0">
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
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-bold transition-all duration-600 hover:bg-gray-50 hover:placeholder-orange-500 text-orange-500
                          focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 min-h-[100px] resize-y"
                          placeholder="Aggiungi descrizione o note per questo lavoro"
                          rows={3}
                        />
                      </div>
                    ) : (
                      <div className="w-full">
                        {work.description ? (
                          <div className="font-bold text-orange-500 text-sm whitespace-pre-wrap break-words bg-gray-50 border border-gray-200 rounded p-3 py-2 min-h-[100px]">
                            {work.description}
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
              Sei sicuro di voler eliminare il lavoro "{work.title}"? Questa azione non può essere annullata!
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

export default WorkDetail;
