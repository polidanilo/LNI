import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boatService, problemService, seasonService, shiftService } from '../services/api';
import { useAppContext } from '../context/AppContext';
import type { Boat, Problem } from '../types';
import BottomNav from '../components/Layout/BottomNav';
import { getShiftOrdinalName } from '../utils/shiftNames';
import CustomScrollbar from '../components/CustomScrollbar';

const BOAT_TYPES: Boat['type'][] = ['Gommone', 'Optimist', 'Fly', 'Equipe', 'Caravella', 'Trident'];

type ProblemForm = {
  description: string;
  part_affected: string;
};

const Boats: React.FC = () => {
  const { selectedShift, selectedSeason, setSelectedSeason, setSelectedShift } = useAppContext();
  const queryClient = useQueryClient();

  const [selectedType, setSelectedType] = useState<Boat['type'] | ''>('');
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [problemForm, setProblemForm] = useState<ProblemForm>({ description: '', part_affected: '' });
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editPartAffected, setEditPartAffected] = useState('');
  const [editReportedBy, setEditReportedBy] = useState('');
  const [editReportedDate, setEditReportedDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState<number | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('open');

  // Fetch seasons
  const { data: seasons, isLoading: seasonsLoading } = useQuery({
    queryKey: ['seasons'],
    queryFn: async () => {
      const response = await seasonService.getAll();
      return response.data;
    },
  });

  // Fetch shifts quando cambia la stagione
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts', selectedSeason?.id],
    queryFn: async () => {
      if (!selectedSeason) return [];
      const response = await shiftService.getBySeasonId(selectedSeason.id);
      const sortedShifts = response.data.sort((a, b) => a.shift_number - b.shift_number);
      return sortedShifts;
    },
    enabled: !!selectedSeason,
  });

  // Boats by selected type
  const { data: boats, isLoading: boatsLoading } = useQuery({
    queryKey: ['boats', selectedType],
    queryFn: async () => {
      const res = await (selectedType ? boatService.getByType(selectedType) : boatService.getAll());
      return res.data;
    },
  });

  // Parts by type
  const { data: parts } = useQuery({
    queryKey: ['boat-parts', selectedType],
    enabled: Boolean(selectedType),
    queryFn: async () => {
      if (!selectedType) return [] as string[];
      const res = await boatService.getPartsByType(selectedType);
      return res.data;
    },
  });

  // TUTTI i problemi esistenti (non solo della barca selezionata)
  const { data: allProblems, isLoading: problemsLoading } = useQuery({
    queryKey: ['all-problems', selectedShift?.id],
    queryFn: async () => {
      if (!selectedShift?.id) return [];
      const res = await problemService.list({ shift_id: selectedShift.id });
      return res.data;
    },
    enabled: !!selectedShift?.id,
  });

  const createProblemMutation = useMutation({
    mutationFn: async (payload: Omit<Problem, 'id' | 'resolved_date'>) => {
      const res = await problemService.createWithDate(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-problems'] });
      setShowProblemModal(false);
      setProblemForm({ description: '', part_affected: '' });
    },
  });

  const toggleProblemStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'open' | 'closed' }) => {
      const res = await problemService.update(id, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-problems'] });
    },
  });

  const handleToggleStatus = (e: React.MouseEvent, problem: Problem) => {
    e.stopPropagation(); // Previene navigazione
    const newStatus = problem.status === 'open' ? 'closed' : 'open';
    toggleProblemStatusMutation.mutate({ id: problem.id, status: newStatus });
  };

  const deleteProblemMutation = useMutation({
    mutationFn: async (id: number) => {
      await problemService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-problems'] });
    },
  });


  const handleAddProblem = () => {
    if (!selectedBoat?.id) {
      alert('Seleziona un\'imbarcazione');
      return;
    }
    if (!selectedShift?.id) {
      alert('Seleziona un turno');
      return;
    }
    if (!problemForm.description) {
      alert('Descrizione obbligatoria');
      return;
    }
    createProblemMutation.mutate({
      boat_id: selectedBoat.id,
      description: problemForm.description,
      part_affected: problemForm.part_affected || undefined,
      status: 'open',
      reported_date: new Date().toISOString().split('T')[0],
      shift_id: selectedShift.id,
    } as Omit<Problem, 'id' | 'resolved_date'>);
  };

  // Filtered problems - ora filtra da TUTTI i problemi esistenti
  // Handlers per season e shift
  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const seasonId = Number(e.target.value);
    const season = seasons?.find((s) => s.id === seasonId);
    if (season) {
      setSelectedSeason(season);
      setSelectedShift(null);
    }
  };

  const handleShiftChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const shiftId = Number(e.target.value);
    const shift = shifts?.find((s) => s.id === shiftId);
    if (shift) {
      setSelectedShift(shift);
    }
  };

  const filteredProblems = useMemo(() => {
    if (!allProblems) return [];

    let filtered = allProblems;

    // Filtro per stato (aperti/archiviati)
    if (filterStatus === 'open') {
      filtered = filtered.filter(p => p.status === 'open');
    } else if (filterStatus === 'closed') {
      filtered = filtered.filter(p => p.status === 'closed');
    }

    // Filtro per barca selezionata
    if (selectedBoat) {
      filtered = filtered.filter(p => p.boat_id === selectedBoat.id);
    }

    // Filtro per testo di ricerca
    if (searchText) {
      filtered = filtered.filter(p =>
        p.description.toLowerCase().includes(searchText.toLowerCase()) ||
        (p.part_affected || '').toLowerCase().includes(searchText.toLowerCase()) ||
        p.boat_name?.toLowerCase().includes(searchText.toLowerCase()) || false
      );
    }

    // Ordina: problemi aperti sempre in cima
    return filtered.sort((a, b) => {
      if (a.status === 'open' && b.status !== 'open') return -1;
      if (a.status !== 'open' && b.status === 'open') return 1;
      return 0;
    });
  }, [allProblems, selectedBoat, searchText, filterStatus]);

  return (
    <div className="h-screen overflow-hidden" style={{backgroundColor: '#FFF4EF'}}>
      <CustomScrollbar maxHeight="100vh">
        <div className="pb-9" style={{backgroundColor: '#FFF4EF', minHeight: 'calc(100vh + 8rem)'}}>
      {/* Top Bar con Saluto e Logout */}
      <div style={{backgroundColor: '#FFF4EF'}} className="px-4 pt-8 pb-0.5">
        <div className="max-w-4xl mx-auto flex items-start justify-between">
          {/* Riquadro Imbarcazioni con immagine di sfondo */}
          <div className="flex-1">
            <div 
              className="relative overflow-hidden rounded-2xl shadow-sm mb-4"
              style={{
                height: '80px',
                backgroundImage: 'url(/public/boats.png)', // ← Modifica qui il nome dell'immagine
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Overlay scuro per oscurare l'immagine */}
              <div className="absolute inset-0 bg-black opacity-40"></div>
              
              {/* Testo sopra l'immagine */}
              <div className="ml-6 relative z-10 flex items-center h-full">
                <h1 className="text-3xl font-bold font-greycliff text-white">
                  Imbarcazioni
                </h1>
              </div>
            </div>
            
            <p className="pl-2 pt-2 text-sm text-gray-600">
              Ecco problemi e danni segnalati nel turno selezionato:
            </p>
          </div>
          
          {/* Info Icon */}
          <button
            onClick={() => setShowInfoModal(true)}
            className="ml-2 pl-0 pr-1 py-1.5 mt-4 rounded-full"
            title="Informazioni e istruzioni"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Selettori Stagione e Turno */}
      <div style={{backgroundColor: '#FFF4EF'}} className="px-4 pb-2">
        <div className="px-1 max-w-4xl mx-auto flex gap-3">
          {/* Stagione */}
          <select
            value={selectedSeason?.id || ''}
            onChange={handleSeasonChange}
            disabled={seasonsLoading}
            className="px-0 py-1 bg-transparent border-0 border-b-2 border-gray-300 text-sm transition-all duration-200 focus:outline-none focus:border-primary-ros disabled:opacity-50 text-gray-700"
            style={{backgroundColor: 'transparent'}}
          >
            <option value="">Seleziona stagione</option>
            {seasons?.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>

          {/* Turno */}
          <select
            value={selectedShift?.id || ''}
            onChange={handleShiftChange}
            disabled={!selectedSeason || shiftsLoading || !shifts || shifts.length === 0}
            className="px-0 py-1 bg-transparent border-0 border-b-2 border-gray-300 text-sm transition-all duration-200 focus:outline-none focus:border-primary-ros disabled:opacity-50 text-gray-700"
            style={{backgroundColor: 'transparent'}}
          >
            <option value="">
              {shiftsLoading ? 'Caricamento...' : 
               !selectedSeason ? 'Seleziona prima stagione' :
               !shifts || shifts.length === 0 ? 'Nessun turno' :
               'Seleziona turno'}
            </option>
            {shifts?.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {getShiftOrdinalName(shift.shift_number)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Problemi - Stile Dashboard */}
      <div style={{backgroundColor: '#FFF4EF'}} className="px-4 pb-9">
        <div className="bg-white rounded-3xl px-4 pb-10 mt-6 shadow-sm relative" style={{
          background: 'linear-gradient(white, white) padding-box, linear-gradient(45deg, #FF5958 0%, #FF5958 85%, #39A8FB 85%) border-box',
          border: '0px solid transparent',
          borderRadius: '24px',
          minHeight: '500px'
        }}>

          {/* Tasti Switch e Pulsante + */}
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterStatus('open')}
                className="py-1.5 rounded-full text-sm font-semibold transition-all duration-300"
                style={{
                  width: '120px',
                  backgroundColor: filterStatus === 'open' ? '#FF5958' : 'white',
                  color: filterStatus === 'open' ? 'white' : '#6B7280'
                }}
                onMouseEnter={(e) => {
                  if (filterStatus === 'open') {
                    e.currentTarget.style.backgroundColor = 'rgb(239, 73, 73)';
                  } else {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 89, 88, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filterStatus === 'open') {
                    e.currentTarget.style.backgroundColor = '#FF5958';
                  } else {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                Aperti
              </button>
              <button
                onClick={() => setFilterStatus('closed')}
                className="py-1.5 rounded-full text-sm font-semibold transition-all duration-300"
                style={{
                  width: '120px',
                  backgroundColor: filterStatus === 'closed' ? '#10B981' : 'white',
                  color: filterStatus === 'closed' ? 'white' : '#6B7280'
                }}
                onMouseEnter={(e) => {
                  if (filterStatus === 'closed') {
                    e.currentTarget.style.backgroundColor = 'rgb(5, 150, 105)';
                  } else {
                    e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filterStatus === 'closed') {
                    e.currentTarget.style.backgroundColor = '#10B981';
                  } else {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                Archiviati
              </button>
            </div>

            {/* Pulsante + sulla destra */}
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 w-12 h-12 rounded-full text-white shadow transition-all duration-300 flex items-center justify-center"
              style={{backgroundColor: 'rgb(17, 17, 17)'}}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(239, 73, 73)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FF5958';
              }}
              title="Aggiungi un problema"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Barra di ricerca */}
          <div className="mb-4 ml-0.5 mr-0.5">
            <div className="relative group">
              <input
                type="text"
                placeholder="Cerca problemi"
                className="w-full pl-8 pr-4 pb-1.5 pt-2 bg-transparent border-0 border-b-2 border-gray-300 text-sm transition-all duration-200 focus:outline-none focus:border-primary-ros text-gray-700"
                style={{backgroundColor: 'transparent', color: '#6B7280'}}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-ros transition-colors duration-200">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10C17 13.866 13.866 17 10 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 15.0005L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Lista Problemi dentro la tab - Stile Dashboard */}
          <CustomScrollbar maxHeight="400px">
            {!selectedShift ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-sm">Seleziona una stagione e un turno per visualizzare i problemi</div>
              </div>
            ) : problemsLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-sm">Caricamento problemi...</div>
              </div>
            ) : !allProblems || allProblems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-sm">Nessun problema trovato per questo turno</div>
              </div>
            ) : filteredProblems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-sm">Nessun problema corrisponde ai filtri selezionati</div>
              </div>
            ) : (
              <div className="space-y-2 pb-1">
                {filteredProblems.map((problem) => (
                  <div
                    key={problem.id}
                    className="relative transition-all duration-200 cursor-pointer rounded-2xl pl-4 pb-3 pt-3 pr-3"
                    style={{
                      backgroundColor: problem.status === 'closed' 
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'rgba(255, 89, 88, 0.5)'
                    }}
                    onMouseEnter={(e) => {
                      if (problem.status === 'closed') {
                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.5)';
                      } else {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 89, 88, 0.6)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (problem.status === 'closed') {
                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.3)';
                      } else {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 89, 88, 0.5)';
                      }
                    }}
                    onClick={() => {
                      setEditingProblem(problem);
                      setShowProblemModal(true);
                      setIsEditMode(true);
                      setEditDescription(problem.description || '');
                      setEditPartAffected(problem.part_affected || '');
                      setEditReportedBy(problem.reported_by || '');
                      setEditReportedDate(problem.reported_date || '');
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="pt-0 text-base font-semibold text-gray-800 mb-0">
                          {problem.boat?.type || 'N/A'} {problem.boat?.number || ''}
                        </h4>
                        <div className="flex items-center gap-1 text-sm text-gray-600 pl-0.5">
                          <span>{problem.reported_date ? new Date(problem.reported_date).toLocaleDateString('it-IT') : 'N/A'}</span>
                          <span>•</span>
                          <span>{problem.boat?.type || 'Categoria'}</span>
                          {problem.part_affected && (
                            <>
                              <span>•</span>
                              <span>{problem.part_affected}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={(e) => handleToggleStatus(e, problem)}
                          className="group w-8 h-8 mr-1 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-100 transition-all duration-200"
                          title={problem.status === 'closed' ? 'Segna come aperto' : 'Segna come risolto'}
                        >
                          {/* Icona normale */}
                          {problem.status === 'closed' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 group-hover:hidden" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:hidden" viewBox="0 0 20 20" fill="#FF5958">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                          {/* Icona hover (stato opposto) */}
                          {problem.status === 'closed' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 hidden group-hover:block" viewBox="0 0 20 20" fill="#FF5958">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 hidden group-hover:block" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProblem(problem);
                            setShowProblemModal(true);
                          }}
                          className="w-6 h-6 rounded-full bg-white shadow-sm hover:bg-gray-100 transition-all duration-200 flex items-center justify-center"
                          title="Vedi dettagli"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-600">
                            <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CustomScrollbar>
        </div>
      </div>

      {/* Cerchi decorativi emerald di sfondo - fixed per parallax */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{zIndex: -1, right: '15px'}}>
        {/* Cerchio emerald grande - alto destra */}
        <div 
          className="absolute rounded-full shadow-sm"
          style={{
            width: '210px',
            height: '30px',
            backgroundColor: '#10B981',
            top: '85%',
            right: '8%',
            opacity: 0.9
          }}
        />

        <div 
          className="absolute rounded-full shadow-sm"
          style={{
            width: '35px',
            height: '15px',
            backgroundColor: '#10B981',
            top: '85%',
            left: '52%',
            opacity: 0.6
          }}
        />

        {/* Cerchio emerald grande - alto destra */}
        <div 
          className="absolute rounded-full shadow-sm"
          style={{
            width: '65px',
            height: '25px',
            backgroundColor: '#10B981',
            top: '85%',
            left: '7%',
            opacity: 0.4
          }}
        />

        {/* Cerchio emerald grande - alto destra */}
        <div 
          className="absolute rounded-full shadow-sm"
          style={{
            width: '45px',
            height: '20px',
            backgroundColor: '#10B981',
            top: '85%',
            right: '20%',
            opacity: 0.6
          }}
        />
      </div>

      <BottomNav />

      {/* Modal Modifica Problema - Slide from Bottom */}
      {showProblemModal && editingProblem && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/70 z-[60] transition-opacity duration-300"
            onClick={() => {
              setShowProblemModal(false);
              setEditingProblem(null);
            }}
          />
          
          {/* Modal Panel - Stile Tab Dashboard */}
          <div 
            className="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-3xl shadow-sm mx-0.3"
            style={{
              height: '87vh',
              animation: 'slideUp 0.1s ease-out'
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-2 pb-2">
              <div className="w-14 h-1.5 bg-gray-300 hover:bg-primary-ros transition-all duration-600 rounded-full"></div>
            </div>

            {/* Header con stile Dashboard */}
            <div className="pl-6 pr-4 py-4" style={{borderColor: '#0F4295'}}>
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold font-greycliff text-gray-800 flex items-center gap-2" style={{color: ''}}>
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#FF5958'}} />
                    Dettagli problema
                  </h3>
                  {/* Stato Icona */}
                  <button
                    onClick={async (e) => {
                      if (!isEditMode) return;
                      e.stopPropagation();
                      try {
                        const newStatus = editingProblem.status === 'closed' ? 'open' : 'closed';
                        await problemService.update(editingProblem.id, { status: newStatus });
                        setEditingProblem({ ...editingProblem, status: newStatus });
                        queryClient.invalidateQueries({ queryKey: ['problems'] });
                      } catch (error) {
                        console.error('Error updating status:', error);
                      }
                    }}
                    className="group w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                    title={editingProblem.status === 'closed' ? 'Segna come aperto' : 'Segna come risolto'}
                  >
                    {/* Icona normale */}
                    {editingProblem.status === 'closed' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 group-hover:hidden" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:hidden" viewBox="0 0 20 20" fill="#FF5958">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    {/* Icona hover (stato opposto) */}
                    {editingProblem.status === 'closed' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 hidden group-hover:block" viewBox="0 0 20 20" fill="#FF5958">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 hidden group-hover:block" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowProblemModal(false);
                    setEditingProblem(null);
                    setIsEditMode(false);
                  }}
                  className="w-8 h-8 rounded-full transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1 text-gray-400 hover:text-primary-ros transition-all duration-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="pl-6 pr-3.5 py-8">
              <CustomScrollbar maxHeight="calc(81vh - 130px)">
              <div className=" max-w-2xl mx-auto">
                {/* Categoria - Stile Stagione/Turno SENZA freccia */}
                <div className="w-full px-1 py-1 bg-transparent border-0 border-b-2 border-gray-300 text-sm text-gray-800">
                  {editingProblem.boat?.type || 'Categoria'}
                </div>

                {/* Imbarcazione - Stile Stagione/Turno SENZA freccia */}
                <div className="pt-5 mb-5 w-full px-1 py-1 bg-transparent border-0 border-b-2 border-gray-300 text-sm text-gray-800">
                  {editingProblem.boat?.name || 'Imbarcazione'}
                </div>

                {/* Parte Coinvolta - Stile Stagione/Turno */}
                <select
                  value={editPartAffected}
                  onChange={(e) => setEditPartAffected(e.target.value)}
                  className="pt-0 mb-4 w-full px-0 pt-0 pb-1.5 bg-transparent border-0 border-b-2 border-primary-ros text-sm text-gray-800 transition-all duration-200 focus:outline-none"
                  style={{backgroundColor: 'transparent'}}
                >
                  <option value="">Seleziona una parte - Opzionale</option>
                  {parts?.map((part) => (
                    <option key={part} value={part}>{part}</option>
                  ))}
                </select>

                {/* Descrizione */}
                <div className="pt-5">
                  <textarea
                    value={editDescription}
                    onChange={(e) => {
                      if (e.target.value.length <= 180) {
                        setEditDescription(e.target.value);
                      }
                    }}
                    maxLength={180}
                    className="w-full px-1 pt-1 pb-1 bg-transparent border-0 border-b-2 border-primary-ros text-sm text-gray-800 resize-none transition-all duration-200 focus:outline-none"
                    style={{
                      backgroundColor: 'transparent',
                      height: 'auto',
                      minHeight: '20px',
                      overflow: 'hidden'
                    }}
                    onInput={(e) => {
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                    }}
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }
                    }}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {editDescription.length}/180 caratteri
                  </div>
                </div>

                

                {/* Titolo Segnalato da e Data */}
                <div className="flex pt-0 pl-1 gap-4 mt-4">
                  <div className="flex-1 text-xs text-gray-500 font-semibold">Segnalato da</div>
                  <div className="flex-1 text-xs text-gray-500 font-semibold">In data</div>
                </div>

                
                    
                {/* Segnalato da e Data sulla stessa riga */}
                <div className="flex gap-4">
                  {/* User */}
                  <input
                    type="text"
                    value={editReportedBy}
                    onChange={(e) => setEditReportedBy(e.target.value)}
                    className="flex-1 px-1 pt-0.5 pb-1 bg-transparent border-0 border-b-2 border-primary-ros text-sm text-gray-800 transition-all duration-200 focus:outline-none"
                    style={{backgroundColor: 'transparent'}}
                    placeholder="Nome utente"
                  />
                  
                  {/* Data */}
                  <input
                    type="date"
                    value={editReportedDate}
                    onChange={(e) => setEditReportedDate(e.target.value)}
                    className="flex-1 px-1 pt-0.5 pb-1 bg-transparent border-0 border-b-2 border-primary-ros text-sm text-gray-800 transition-all duration-200 focus:outline-none"
                    style={{backgroundColor: 'transparent'}}
                  />
                </div>

                {/* Tasti Salva ed Elimina in basso a destra */}
                <div className="flex justify-end gap-4 mt-8">
                  <button
                    onClick={async () => {
                      // Salva modifiche
                      try {
                        await problemService.update(editingProblem.id, {
                          description: editDescription,
                          part_affected: editPartAffected,
                          reported_by: editReportedBy,
                          reported_date: editReportedDate
                        });
                        setEditingProblem({
                          ...editingProblem,
                          description: editDescription,
                          part_affected: editPartAffected,
                          reported_by: editReportedBy,
                          reported_date: editReportedDate
                        });
                        queryClient.invalidateQueries({ queryKey: ['problems'] });
                      } catch (error) {
                        console.error('Error updating problem:', error);
                        alert('Errore durante l\'aggiornamento del problema');
                      }
                    }}
                    className="text-sm font-semibold transition-all duration-300"
                    style={{color: '#FF5958'}}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'rgb(239, 73, 73)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#FF5958';
                    }}
                  >
                    Salva modifiche
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setProblemToDelete(editingProblem.id);
                      setShowProblemModal(false);
                    }}
                    className="text-sm font-semibold transition-all duration-300 text-gray-600"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#FF5958';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#4B5563';
                    }}
                  >
                    Elimina problema
                  </button>
                </div>
              </div>
              </CustomScrollbar>
            </div>

          </div>

          {/* CSS Animation */}
          <style>{`
            @keyframes slideUp {
              from {
                transform: translateY(100%);
              }
              to {
                transform: translateY(0);
              }
            }
          `}</style>
        </>
      )}

      {/* Modal add problem OLD - DA RIMUOVERE */}
      {false && showProblemModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-primary-lni" style={{color: '#0F4295'}}>Aggiungi nuovo problema</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Parte coinvolta (opzionale)</label>
                <select
                  value={problemForm.part_affected}
                  onChange={(e) => setProblemForm({ ...problemForm, part_affected: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm font-bold transition-all duration-200 hover:bg-gray-50 text-primary-lni focus:outline-none focus:ring-2 focus:ring-primary-lni"
                  style={{color: '#0F4295'}}
                >
                  <option value="">Seleziona parte</option>
                  {(parts || []).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Descrizione (opzionale)</label>
                <textarea
                  value={problemForm.description}
                  onChange={(e) => setProblemForm({ ...problemForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm font-bold transition-all duration-200 hover:bg-gray-50 text-primary-lni focus:outline-none focus:ring-2 focus:ring-primary-lni"
                  style={{color: '#0F4295'}}
                  rows={4}
                  placeholder="Descrivi il problema"
                />
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={handleAddProblem}
                disabled={createProblemMutation.isPending}
                className="w-full py-3.5 rounded-full text-white text-base font-bold shadow transition-all duration-300 flex items-center justify-center gap-2"
                style={{backgroundColor: '#FF5958'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(239, 73, 73)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF5958';
                }}
              >
                {createProblemMutation.isPending ? (
                  'Salvataggio...'
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                    Aggiungi Problema
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal conferma eliminazione */}
      {showDeleteConfirm && problemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-4 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-1.5">
              Elimino?
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Sei sicuro di voler eliminare questo problema? Questa azione non può essere annullata!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setProblemToDelete(null);
                }}
                className="flex-1 py-2 px-4 rounded font-semibold text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  if (problemToDelete) {
                    deleteProblemMutation.mutate(problemToDelete);
                  }
                  setShowDeleteConfirm(false);
                  setProblemToDelete(null);
                }}
                disabled={deleteProblemMutation.isPending}
                className="flex-1 py-2 px-4 rounded font-semibold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              >
                {deleteProblemMutation.isPending ? 'Elimina' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Informazioni */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowInfoModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800">ℹ️ Informazioni</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 text-gray-700">
              <div>
                <h4 className="font-bold text-lg mb-2">📋 Pagina Imbarcazioni</h4>
                <p className="text-sm leading-relaxed">
                  In questa pagina puoi visualizzare tutti i problemi e danni segnalati sulle imbarcazioni durante il turno selezionato.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-base mb-2">🔍 Come usare:</h4>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>Usa la <strong>barra di ricerca</strong> per filtrare i problemi</li>
                  <li>Clicca sul <strong>pulsante toggle</strong> per cambiare lo stato (aperto/risolto)</li>
                  <li>I problemi <span className="text-red-600 font-bold">aperti</span> hanno sfondo rosso</li>
                  <li>I problemi <span className="text-emerald-600 font-bold">risolti</span> hanno sfondo verde</li>
                </ul>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 italic">
                  💡 Suggerimento: Seleziona stagione e turno per visualizzare i dati specifici
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aggiungi Problema - Slide from Bottom */}
      {showAddModal && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/70 z-[60] transition-opacity duration-300"
            onClick={() => setShowAddModal(false)}
          />
          
          {/* Modal Panel - Stile Tab Dashboard */}
          <div 
            className="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-3xl shadow-sm mx-0.3"
            style={{
              height: '69vh',
              animation: 'slideUp 0.1s ease-out'
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-2 pb-2">
              <div className="w-14 h-1.5 bg-gray-300 hover:bg-primary-ros transition-all duration-600 rounded-full"></div>
            </div>

            {/* Header con stile Dashboard */}
            <div className="pl-6 pr-4 py-4" style={{borderColor: '#0F4295'}}>
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                <h3 className="text-lg font-bold font-greycliff text-gray-800 flex items-center gap-2" style={{color: ''}}>
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#FF5958'}} />
                  Aggiungi un problema
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1 text-gray-400 hover:text-primary-ros transition-all duration-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="pl-6 pr-3.5 py-4">
              <CustomScrollbar maxHeight="calc(81vh - 130px)">
              <div className="space-y-4 max-w-2xl mx-auto">
                {/* Categoria - Stile Stagione/Turno */}
                <select
                  value={selectedType}
                  onChange={(e) => {
                    const t = e.target.value as Boat['type'] | '';
                    setSelectedType(t);
                    setSelectedBoat(null);
                    setSelectedPart('');
                  }}
                  className="w-full px-0 py-1 bg-transparent border-0 border-b-2 border-gray-300 text-sm transition-all duration-200 focus:outline-none focus:border-primary-ros disabled:opacity-50 text-gray-800"
                  style={{backgroundColor: 'transparent'}}
                >
                  <option value="">Seleziona una categoria</option>
                  {BOAT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {/* Imbarcazione - Stile Stagione/Turno */}
                <select
                  value={selectedBoat?.id || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const b = (boats || []).find(x => x.id === id) || null;
                    setSelectedBoat(b);
                    setSelectedPart('');
                  }}
                  disabled={!selectedType || !boats || boats.length === 0}
                  className="w-full px-0 py-1 bg-transparent border-0 border-b-2 border-gray-300 text-sm transition-all duration-200 focus:outline-none focus:border-primary-ros disabled:opacity-50 text-gray-800"
                  style={{backgroundColor: 'transparent'}}
                >
                  <option value="">
                    {!selectedType ? 'Seleziona prima una categoria' :
                     !boats || boats.length === 0 ? 'Nessuna imbarcazione' :
                     "Seleziona un'imbarcazione"}
                  </option>
                  {(boats || []).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>

                {/* Parte Coinvolta - Dropdown Stile Stagione/Turno */}
                <select
                  value={problemForm.part_affected}
                  onChange={(e) => setProblemForm({ ...problemForm, part_affected: e.target.value })}
                  disabled={!selectedBoat}
                  className="w-full px-0 py-1 bg-transparent border-0 border-b-2 border-gray-300 text-sm transition-all duration-200 focus:outline-none focus:border-primary-ros disabled:opacity-50 text-gray-800"
                  style={{backgroundColor: 'transparent'}}
                >
                  <option value="">
                    {!selectedBoat ? "Seleziona prima un'imbarcazione" : "Seleziona una parte - Opzionale"}
                  </option>
                  {parts?.map((part) => (
                    <option key={part} value={part}>{part}</option>
                  ))}
                </select>

                {/* Descrizione */}
                <div>
                  <textarea
                    value={problemForm.description}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 180) {
                        setProblemForm({ ...problemForm, description: value });
                      }
                    }}
                    placeholder="Descrivi il problema - Opzionale"
                    maxLength={180}
                    className="w-full px-1 pt-1 pb-1 bg-transparent border-0 border-b-2 border-gray-300 text-sm text-gray-800 resize-none transition-all duration-200 focus:outline-none focus:border-primary-ros"
                    style={{
                      backgroundColor: 'transparent',
                      height: 'auto',
                      minHeight: '20px',
                      overflow: 'hidden',
                      lineHeight: '1.3',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word'
                    }}
                    onInput={(e) => {
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                    }}
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }
                    }}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {problemForm.description.length}/180 caratteri
                  </div>
                </div>
              </div>
              </CustomScrollbar>
            </div>

            {/* Footer - Fixed Bottom */}
            <div className="absolute bottom-0 inset-x-0 px-8 pb-6 bg-white">
              <div className="max-w-2xl mx-auto">
                <button
                  onClick={() => {
                    if (!selectedType) {
                      alert('Seleziona una categoria');
                      return;
                    }
                    if (!selectedBoat?.id) {
                      alert('Seleziona un\'imbarcazione');
                      return;
                    }
                    handleAddProblem();
                    setShowAddModal(false);
                  }}
                  className="w-full py-3.5 rounded-full text-white text-base font-bold shadow transition-all duration-300 flex items-center justify-center gap-2"
                  style={{backgroundColor: '#FF5958'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(239, 73, 73)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FF5958';
                  }}
                >
                  Aggiungi
                </button>
              </div>
            </div>
          </div>

          {/* CSS Animation */}
          <style>{`
            @keyframes slideUp {
              from {
                transform: translateY(100%);
              }
              to {
                transform: translateY(0);
              }
            }
          `}</style>
        </>
      )}
        </div>
      </CustomScrollbar>
    </div>
  );
};

export default Boats;
