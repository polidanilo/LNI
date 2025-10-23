import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/api';
import { useAppContext } from '../context/AppContext';
import type { Order } from '../types';

const FIXED_CATEGORY = 'Infermieria';

const Infirmary: React.FC = () => {
  const { selectedShift } = useAppContext();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'completed' | 'pending'>('completed');
  const [sortKey, setSortKey] = useState<'order_date' | 'amount' | 'title'>('order_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: FIXED_CATEGORY,
    order_date: new Date().toISOString().split('T')[0],
    notes: '',
    created_by: 'User',
    shift_id: selectedShift?.id || 0,
  });

  // pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [filters, setFilters] = useState({
    q: '',
    date_from: '',
    date_to: '',
    amount_min: '',
    amount_max: '',
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['infirmary-orders', activeTab, selectedShift?.id, filters, sortKey, sortDir, page, pageSize],
    queryFn: async () => {
      const response = await orderService.getAll({
        status_filter: activeTab,
        shift_id: selectedShift?.id,
        q: filters.q || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        category: FIXED_CATEGORY,
        amount_min: filters.amount_min ? Number(filters.amount_min) : undefined,
        amount_max: filters.amount_max ? Number(filters.amount_max) : undefined,
        sort_by: sortKey,
        order: sortDir,
        page,
        page_size: pageSize,
      });
      return response.data;
    },
  });

  const addOrderMutation = useMutation({
    mutationFn: async (newOrder: Omit<Order, 'id'>) => {
      const response = await orderService.create(newOrder);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infirmary-orders'] });
      setShowModal(false);
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        amount: '',
        category: FIXED_CATEGORY,
        order_date: new Date().toISOString().split('T')[0],
        notes: '',
        created_by: 'User',
        shift_id: selectedShift?.id || 0,
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (payload: { id: number; data: Partial<Order> }) => {
      const response = await orderService.update(payload.id, payload.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infirmary-orders'] });
      setShowModal(false);
      setEditingId(null);
    },
  });

  const handleAddOrder = () => {
    if (!formData.title || !formData.amount) {
      alert('Compila i campi obbligatori');
      return;
    }
    if (!selectedShift?.id) {
      alert('Seleziona un turno prima di salvare');
      return;
    }

    if (editingId) {
      updateOrderMutation.mutate({
        id: editingId,
        data: {
          title: formData.title,
          description: formData.description || undefined,
          amount: parseFloat(formData.amount),
          category: FIXED_CATEGORY,
          order_date: formData.order_date,
          notes: formData.notes || undefined,
          status: activeTab,
        },
      });
    } else {
      addOrderMutation.mutate({
        ...formData,
        category: FIXED_CATEGORY,
        amount: parseFloat(formData.amount),
        order_date: formData.order_date,
        shift_id: selectedShift.id,
        status: activeTab as 'completed' | 'pending',
      } as Omit<Order, 'id'>);
    }
  };

  const items = orders || [];

  const toggleSort = (key: 'order_date' | 'amount' | 'title') => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  };

  const handleExport = async () => {
    const res = await orderService.export({
      status_filter: activeTab,
      shift_id: selectedShift?.id,
      q: filters.q || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
      category: FIXED_CATEGORY,
      sort_by: sortKey,
      order: sortDir,
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'infirmary_orders.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Infermieria</h1>

        <div className="flex border-b border-gray-200 gap-4">
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'completed' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Acquisti Effettuati
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Da Effettuare
          </button>
        </div>
      </div>

      {/* Info sorting */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-sm text-gray-600">
        Clicca sull'intestazione tabella per ordinare (ora: {sortKey} {sortDir})
      </div>

      {/* Filtri */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-6 gap-3">
        <input
          placeholder="Cerca (q)"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
        <input
          type="number"
          placeholder="Importo min"
          value={filters.amount_min}
          onChange={(e) => setFilters((f) => ({ ...f, amount_min: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
        <input
          type="number"
          placeholder="Importo max"
          value={filters.amount_max}
          onChange={(e) => setFilters((f) => ({ ...f, amount_max: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
        <div className="col-span-1 md:col-span-1 flex justify-end gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Tabella Ordini */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Caricamento...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Nessun acquisto infermieria</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th onClick={() => toggleSort('title')} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">Titolo {sortKey==='title' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                  <th onClick={() => toggleSort('amount')} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">Importo {sortKey==='amount' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                  <th onClick={() => toggleSort('order_date')} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">Data {sortKey==='order_date' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Effettuato da</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Note</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setDetailsOrder(order); setShowDetails(true); }}>
                    <td className="px-6 py-3 text-sm font-medium text-gray-800">{order.title}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">€{order.amount.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{order.order_date}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{order.created_by}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 truncate">{order.notes || '-'}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!confirm(`Confermi il cambio di stato per "${order.title}"?`)) return;
                            updateOrderMutation.mutate({ id: order.id, data: { status: order.status === 'completed' ? 'pending' : 'completed' } });
                          }}
                          className="px-3 py-1 border rounded text-xs"
                        >
                          {order.status === 'completed' ? 'Segna Da Fare' : 'Segna Completato'}
                        </button>
                        <button
                          onClick={() => {
                            setShowModal(true);
                            setEditingId(order.id);
                            setFormData({
                              title: order.title,
                              description: order.description || '',
                              amount: String(order.amount),
                              category: FIXED_CATEGORY,
                              order_date: order.order_date,
                              notes: order.notes || '',
                              created_by: order.created_by || 'User',
                              shift_id: order.shift_id,
                            });
                          }}
                          className="px-3 py-1 border rounded"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Eliminare acquisto "${order.title}"?`)) return;
                            await orderService.delete(order.id);
                            queryClient.invalidateQueries({ queryKey: ['infirmary-orders'] });
                          }}
                          className="px-3 py-1 border rounded text-red-700 border-red-300"
                        >
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginazione */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2 text-sm">
          <span>Righe per pagina:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
            className="px-2 py-1 border rounded"
          >
            {[10,20,50,100].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={page<=1} onClick={() => setPage((p)=>Math.max(1, p-1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <span className="text-sm">Pagina {page}</span>
          <button onClick={() => setPage((p)=>p+1)} className="px-3 py-1 border rounded">Next</button>
        </div>
      </div>

      {/* Side-panel Dettagli */}
      {showDetails && detailsOrder && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowDetails(false)} />
          <div className="w-full max-w-md bg-white shadow-xl h-full overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Dettagli Acquisto</h3>
              <button onClick={() => setShowDetails(false)} className="px-2 py-1 border rounded">Chiudi</button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Titolo:</span> {detailsOrder.title}</div>
              <div><span className="font-medium">Importo:</span> €{detailsOrder.amount.toFixed(2)}</div>
              <div><span className="font-medium">Data:</span> {detailsOrder.order_date}</div>
              <div><span className="font-medium">Creato da:</span> {detailsOrder.created_by || '-'}</div>
              <div><span className="font-medium">Note:</span> {detailsOrder.notes || '-'}</div>
              <div><span className="font-medium">Stato:</span> {detailsOrder.status}</div>
              <div><span className="font-medium">ID:</span> {detailsOrder.id}</div>
              <div><span className="font-medium">Categoria:</span> {detailsOrder.category}</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aggiungi/Modifica */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingId ? 'Modifica Acquisto' : 'Aggiungi Acquisto'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Titolo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Importo *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                <input
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleAddOrder}
                disabled={addOrderMutation.isPending || updateOrderMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {editingId ? (updateOrderMutation.isPending ? 'Salvataggio...' : 'Salva') : (addOrderMutation.isPending ? 'Salvataggio...' : 'Salva')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Infirmary;
