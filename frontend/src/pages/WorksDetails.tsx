import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workService, authService } from '../services/api';
import type { Work } from '../types';
import CustomScrollbar from '../components/CustomScrollbar';

const WORK_CATEGORIES: Work['category'][] = ['Campo', 'Officina', 'Servizi', 'Gommoni', 'Barche', 'Vele', 'Altro'];

const WorksDetails: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const id = searchParams.get('id');

  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCreatedBy, setEditCreatedBy] = useState<number | null>(null);
  const [editWorkDate, setEditWorkDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [users, setUsers] = useState<Array<{ id: number; username: string }>>([]);
  
  // Swipe down to dismiss
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = React.useRef(0);

  const { data: work, isLoading } = useQuery({
    queryKey: ['work', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await workService.getById(Number(id));
      return res.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    authService.getUsers().then(res => {
      setUsers(res.data);
    }).catch(err => {
      console.error('Error loading users:', err);
    });
  }, []);

  useEffect(() => {
    if (work) {
      setEditingWork(work);
      setEditTitle(work.title || '');
      setEditDescription(work.description || '');
      setEditCategory(work.category || '');
      setEditCreatedBy(work.user_id || null);
      setEditWorkDate(work.work_date || '');
    }
  }, [work]);

  const toggleWorkStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'pending' | 'completed' }) => {
      const res = await workService.update(id, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-works'] });
    },
  });

  const deleteWorkMutation = useMutation({
    mutationFn: async (id: number) => {
      await workService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-works'] });
      navigate('/works');
    },
  });

  const handleClose = () => {
    navigate('/works');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 100) {
      handleClose();
    } else {
      setDragY(0);
    }
  };

  const handleToggleStatus = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!editingWork) return;
    const newStatus = editingWork.status === 'completed' ? 'pending' : 'completed';
    toggleWorkStatusMutation.mutate({ id: editingWork.id, status: newStatus });
    setEditingWork({ ...editingWork, status: newStatus });
    e.currentTarget.blur();
  };

  const handleSave = async () => {
    if (!editingWork) return;
    
    // Validation
    if (!editTitle.trim()) {
      alert('Inserisci un titolo');
      return;
    }
    if (!editCategory) {
      alert('Seleziona una categoria');
      return;
    }
    
    try {
      await workService.update(editingWork.id, {
        title: editTitle,
        description: editDescription,
        category: editCategory as Work['category'],
        user_id: editCreatedBy || undefined,
        work_date: editWorkDate || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['all-works'] });
      queryClient.invalidateQueries({ queryKey: ['work', id] });
      navigate('/works');
    } catch (error) {
      console.error('Error updating work:', error);
      alert('Errore durante l\'aggiornamento del lavoro');
    }
  };

  const handleDelete = () => {
    if (!editingWork) return;
    deleteWorkMutation.mutate(editingWork.id);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center">
        <div className="text-white">Caricamento...</div>
      </div>
    );
  }

  if (!editingWork) {
    return null;
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/30 z-[60] transition-opacity duration-300"
        onClick={handleClose}
      />
      
      <div 
        className="fixed inset-x-0 bottom-0 z-[70] bg-white backdrop-blur-sm rounded-t-3xl shadow-sm mx-0.3 transition-transform"
        style={{
          height: '60vh',
          animation: isDragging ? 'none' : 'slideUp 0.1s ease-out',
          transform: `translateY(${dragY}px)`
        }}
      >
        <div 
          className="flex justify-center pt-2 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-14 h-1.5 bg-gray-300 hover:bg-primary-ara transition-all duration-600 rounded-full"></div>
        </div>

        <div className="pl-7 pr-7 py-4" style={{borderColor: '#0F4295'}}>
          <div className="flex items-center justify-between max-w-2xl mx-auto mt-12">
            <div>
              <h3 className="text-lg font-bold font-greycliff black">
                Dettagli lavoro
              </h3>
            </div>
            <button
              onClick={handleToggleStatus}
              className="group w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm transition-all duration-200 cursor-pointer"
              style={{
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: editingWork.status === 'completed' ? '#10B981' : '#FF9151'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F3F4F6';
                e.currentTarget.style.borderColor = editingWork.status === 'completed' ? '#FF9151' : '#10B981';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = editingWork.status === 'completed' ? '#10B981' : '#FF9151';
              }}
              title={editingWork.status === 'completed' ? 'Segna come in attesa' : 'Segna come completato'}
            >
              {editingWork.status === 'completed' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 group-hover:hidden" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:hidden" viewBox="0 0 20 20" fill="#FF9151">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              )}
              {editingWork.status === 'completed' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 hidden group-hover:block" viewBox="0 0 20 20" fill="#FF9151">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 hidden group-hover:block" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="pl-6 pr-5 py-4 pb-0">
          <CustomScrollbar maxHeight="calc(81vh - 130px)">
            <div className="space-y-4 max-w-2xl mx-auto">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-1 py-1 bg-transparent border-0 border-b-2 text-sm black transition-all duration-200 focus:outline-none"
                style={{ borderColor: '#FF9151' }}
                placeholder="Lavoro"
              />

              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-0 py-1 bg-transparent border-0 border-b-2 text-sm transition-all duration-200 focus:outline-none black"
                style={{ borderColor: '#FF9151' }}
              >
                <option value="">Seleziona categoria</option>
                {WORK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Creato da e In data */}
              <div className="flex pt-4 gap-4">
                <div className="flex-1 flex items-center gap-3">
                  <div className="text-sm pl-1 black whitespace-nowrap">Aggiunto da</div>
                  <select
                    value={editCreatedBy || ''}
                    onChange={(e) => setEditCreatedBy(Number(e.target.value))}
                    className="flex-1 px-0 py-1 bg-transparent border-0 border-b-2 text-sm black transition-all duration-200 focus:outline-none"
                    style={{ borderColor: '#FF9151' }}
                  >
                    <option value="">Seleziona utente</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.username}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="text-sm black whitespace-nowrap">In data</div>
                  <input
                    type="date"
                    value={editWorkDate}
                    onChange={(e) => setEditWorkDate(e.target.value)}
                    className="flex-1 pl-1 pt-1 pb-0.5 bg-transparent border-0 border-b-2 text-sm black transition-all duration-200 focus:outline-none"
                    style={{ borderColor: '#FF9151' }}
                  />
                </div>
              </div>

              <div>
                <textarea
                  value={editDescription}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 110) {
                      setEditDescription(value);
                    }
                  }}
                  placeholder="Descrizione - Opzionale"
                  maxLength={110}
                  className="w-full mt-0 px-1 pt-1 pb-1 bg-transparent border-0 border-b-2 text-sm black resize-none transition-all duration-200 focus:outline-none"
                  style={{
                    backgroundColor: 'transparent',
                    height: 'auto',
                    minHeight: '20px',
                    overflow: 'hidden',
                    lineHeight: '1.3',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    borderColor: '#FF9151'
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
              </div>
            </div>
          </CustomScrollbar>
        </div>

        <div className="fixed bottom-2 left-0 right-0 bg-white backdrop-blur-sm px-6 py-3">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="py-1.5 rounded-full text-sm font-semibold transition-all duration-300"
                style={{
                  width: '120px',
                  backgroundColor: editingWork?.status === 'completed' ? '#10B981' : '#FF9151',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = editingWork?.status === 'completed' ? 'rgb(5, 150, 105)' : 'rgb(241, 120, 65)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = editingWork?.status === 'completed' ? '#10B981' : '#FF9151';
                }}
              >
                Salva
              </button>
            </div>

            {!showDeleteConfirm ? (
              <div className="flex gap-4">
                <button
                  onClick={handleClose}
                  className="text-sm font-semibold transition-all duration-300"
                  style={{
                    backgroundColor: 'white',
                    color: '#6B7280'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#FF9151';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6B7280';
                  }}
                >
                  Annulla
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm mr-1 font-semibold transition-all duration-300"
                  style={{ color: '#6B7280' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#FF9151';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6B7280';
                  }}
                >
                  Elimina
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mr-1">
                <button
                  onClick={handleDelete}
                  className="text-sm font-semibold"
                  style={{ color: '#FF9151' }}
                >
                  Conferma
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-sm font-semibold"
                  style={{ color: '#6B7280' }}
                >
                  Annulla
                </button>
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
          textarea::placeholder {
            color: #9CA3AF;
            opacity: 1;
          }
        `}</style>
      </div>
    </>
  );
};

export default WorksDetails;
