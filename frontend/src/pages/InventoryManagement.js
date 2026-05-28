import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

const emptyForm = {
  item_name: '',
  description: '',
  category: '',
  unit: '',
  minimum_stock: '',
  expiry_date: '',
  supplier_name: '',
  batch_lot_number: '',
  purchase_price: '',
  storage_location: '',
  barcode: '',
};

const emptyTransactionForm = {
  item_id: '',
  transaction_type: 'IN',
  quantity: '',
  transaction_date: new Date().toISOString().slice(0, 10),
  notes: '',
};

const categories = ['Consumable', 'Instrument', 'Medication', 'Equipment'];
const units = ['Box', 'Piece', 'Bottle', 'Pack', 'Tube', 'Vial', 'Syringe'];

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const isExpiringSoon = (value) => {
  if (!value) return false;
  const today = new Date();
  const expiry = new Date(`${value}T00:00:00`);
  const days = (expiry - today) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 30;
};

const itemStatus = (item) => {
  if (item.quantity_in_stock <= 0) return 'Out of Stock';
  if (item.quantity_in_stock <= item.minimum_stock) return 'Low Stock';
  return 'In Stock';
};

const statusClasses = {
  'In Stock': 'bg-green-100 text-green-700',
  'Low Stock': 'bg-error-container text-on-error-container',
  'Out of Stock': 'bg-outline-variant/20 text-on-surface-variant',
};

function InventoryManagement() {
  const [items, setItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [transactionForm, setTransactionForm] = useState(emptyTransactionForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = user?.full_name ? initials(user.full_name) : 'AD';

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [itemsRes, lowStockRes] = await Promise.all([
        fetch('/api/inventory-items', { headers: authHeaders() }),
        fetch('/api/inventory-items/low-stock', { headers: authHeaders() }),
      ]);

      const [itemsJson, lowStockJson] = await Promise.all([
        itemsRes.json(),
        lowStockRes.json(),
      ]);

      if (!itemsRes.ok) throw new Error(itemsJson.message || 'Could not load inventory items.');
      if (!lowStockRes.ok) throw new Error(lowStockJson.message || 'Could not load low stock items.');

      setItems(itemsJson.data || []);
      setLowStockItems(lowStockJson.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setQuickAddOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const stats = useMemo(() => {
    return {
      total: items.length,
      lowStock: lowStockItems.length,
      expiringSoon: items.filter((item) => isExpiringSoon(item.expiry_date)).length,
      inactive: items.filter((item) => item.status === 'Inactive').length,
    };
  }, [items, lowStockItems]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const status = itemStatus(item);
      const matchesSearch =
        !query ||
        item.item_name.toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query) ||
        (item.unit || '').toLowerCase().includes(query) ||
        String(item.item_id).includes(query);
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && status === 'Low Stock') ||
        (stockFilter === 'out' && status === 'Out of Stock') ||
        (stockFilter === 'in' && status === 'In Stock');

      return matchesSearch && matchesStock;
    });
  }, [items, search, stockFilter]);

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const updateTransactionForm = (field, value) => {
    setTransactionForm((previous) => ({ ...previous, [field]: value }));
  };

  const openTransactionModal = (item, type = 'IN') => {
    setTransactionForm({
      ...emptyTransactionForm,
      item_id: item.item_id,
      transaction_type: type,
      notes: `${type} transaction for ${item.item_name}`,
    });
    setTransactionOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/inventory-items', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          minimum_stock: form.minimum_stock === '' ? 0 : Number(form.minimum_stock),
          purchase_price: form.purchase_price === '' ? null : Number(form.purchase_price),
          expiry_date: form.expiry_date || null,
          status: 'Active',
        }),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Inventory item could not be created.');

      setForm(emptyForm);
      setQuickAddOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTransactionSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/inventory-transactions', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...transactionForm,
          quantity: Number(transactionForm.quantity),
        }),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Inventory transaction could not be created.');

      setTransactionForm(emptyTransactionForm);
      setTransactionOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Deactivate this inventory item?')) return;

    try {
      const response = await fetch(`/api/inventory-items/${itemId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Inventory item could not be deactivated.');

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const lowStockNames = lowStockItems.slice(0, 3).map((item) => item.item_name);

  return (
    <div className="bg-background font-body-base text-body-base text-on-background min-h-screen overflow-x-hidden">
      <AdminSidebar />

      <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-surface/90 backdrop-blur-md z-10 flex items-center justify-between px-6 shadow-sm border-b border-outline-variant/20">
        <div className="flex-1 max-w-xl clinical-glow">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant">search</span>
            <input
              className="w-full bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-body-base focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/60"
              placeholder="Search inventory items..."
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-full transition-all">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-full transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="h-10 w-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-bold">
            {userInitials}
          </div>
        </div>
      </header>

      <main className="md:ml-64 pt-28 p-4 md:p-gutter min-h-screen">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg mt-12">
          <div>
            <nav className="flex gap-2 text-caption text-on-surface-variant mb-1">
              <span>Admin</span>
              <span>/</span>
              <span className="text-primary font-bold">Inventory</span>
            </nav>
            <h2 className="text-headline-lg font-headline-lg text-on-surface">Inventory Management</h2>
          </div>
          <button
            className="bg-primary text-on-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-label-bold shadow-lg hover:bg-on-primary-fixed-variant transition-all active:scale-[0.98]"
            onClick={() => setQuickAddOpen(true)}
          >
            <span className="material-symbols-outlined">add</span>
            Add New Item
          </button>
        </div>

        {lowStockItems.length > 0 && (
          <div className="bg-error-container/30 border border-error/20 rounded-xl p-md mb-lg flex items-start gap-md">
            <div className="p-2 bg-error-container text-error rounded-full">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <div>
              <h4 className="font-label-bold text-on-surface mb-1">Low Stock Alerts</h4>
              <p className="text-body-base text-on-surface-variant">
                The following items are running low and need reordering:{' '}
                <span className="font-bold">{lowStockNames.join(', ')}</span>
                {lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more.` : '.'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
          {[
            ['inventory_2', 'Total Items', stats.total, 'bg-primary/10 text-primary'],
            ['warning', 'Low Stock Alerts', stats.lowStock, 'bg-error/10 text-error'],
            ['event_busy', 'Expiring Soon', stats.expiringSoon, 'bg-orange-100 text-orange-600'],
            ['block', 'Inactive Items', stats.inactive, 'bg-blue-100 text-blue-600'],
          ].map(([icon, label, value, tone]) => (
            <div key={label} className="bg-surface-container-lowest p-md rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-outline-variant/10 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${tone}`}>
                <span className="material-symbols-outlined text-[32px]">{icon}</span>
              </div>
              <div>
                <p className="text-caption text-on-surface-variant font-label-bold uppercase">{label}</p>
                <p className="text-headline-md font-bold">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-lg flex flex-wrap items-center justify-between gap-md">
          <div className="flex items-center gap-xs overflow-x-auto">
            {[
              ['all', 'All'],
              ['in', 'In Stock'],
              ['low', 'Low Stock'],
              ['out', 'Out of Stock'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`px-md py-2 rounded-full font-label-bold text-caption transition-colors ${
                  stockFilter === value
                    ? 'bg-primary-container text-on-primary-container'
                    : 'hover:bg-surface-container text-on-surface-variant'
                }`}
                onClick={() => setStockFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors border border-outline-variant/30"
            onClick={loadData}
            title="Refresh"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>

        {error && (
          <div className="mb-md rounded-xl border border-error-container bg-error-container/60 px-4 py-3 text-error text-label-bold">
            {error}
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden border border-outline-variant/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Item Name</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Description</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Quantity</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Unit</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Expiry</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {loading ? (
                  <tr>
                    <td className="px-gutter py-lg text-on-surface-variant" colSpan="7">Loading inventory...</td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td className="px-gutter py-lg text-on-surface-variant" colSpan="7">No inventory items found.</td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const status = itemStatus(item);

                    return (
                      <tr key={item.item_id} className="hover:bg-surface-container-low/60 transition-colors group">
                        <td className="px-gutter py-md">
                          <div className="flex items-center gap-sm">
                            <div className="h-10 w-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                              <span className="material-symbols-outlined">inventory_2</span>
                            </div>
                            <div>
                              <p className="font-label-bold text-on-surface">{item.item_name}</p>
                              <p className="text-caption text-on-surface-variant">#INV-{item.item_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="text-caption text-on-surface max-w-[260px] truncate">{item.description || '-'}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <p className={`text-body-base font-bold ${status !== 'In Stock' ? 'text-error' : 'text-on-surface'}`}>
                            {item.quantity_in_stock}
                          </p>
                          <p className="text-caption text-on-surface-variant">Min {item.minimum_stock}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="text-caption text-on-surface">{item.unit}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <p className={`text-caption ${isExpiringSoon(item.expiry_date) ? 'text-orange-600 font-label-bold' : 'text-on-surface'}`}>
                            {formatDate(item.expiry_date)}
                          </p>
                        </td>
                        <td className="px-gutter py-md">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-label-bold ${statusClasses[status]}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                            {status}
                          </span>
                        </td>
                        <td className="px-gutter py-md text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="Inventory Transaction"
                              onClick={() => openTransactionModal(item, 'IN')}
                            >
                              <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                            </button>
                            <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Edit">
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                              title="Deactivate"
                              onClick={() => handleDelete(item.item_id)}
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-gutter flex items-center justify-between border-t border-outline-variant/20 bg-surface-container-low/30">
            <p className="text-caption text-on-surface-variant">
              Showing <span className="font-label-bold text-on-surface">{filteredItems.length}</span> of{' '}
              <span className="font-label-bold text-on-surface">{items.length}</span> items
            </p>
          </div>
        </div>
      </main>

      <div
        className={`fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          quickAddOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setQuickAddOpen(false)}
      >
        <form
          className={`fixed right-0 top-0 h-screen w-full max-w-md bg-surface-container-lowest shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
            quickAddOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(event) => event.stopPropagation()}
          onSubmit={handleSubmit}
        >
          <div className="p-gutter flex items-center justify-between border-b border-outline-variant/30">
            <h3 className="text-headline-md font-headline-md text-primary">New Item</h3>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-all" type="button" onClick={() => setQuickAddOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-gutter space-y-md">
            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Item Name</label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                placeholder="Enter item name..."
                type="text"
                value={form.item_name}
                onChange={(event) => updateForm('item_name', event.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Category</label>
                <select
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  value={form.category}
                  onChange={(event) => updateForm('category', event.target.value)}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Unit</label>
                <select
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  value={form.unit}
                  onChange={(event) => updateForm('unit', event.target.value)}
                  required
                >
                  <option value="">Select unit</option>
                  {units.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Current Qty</label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-high border-outline-variant border text-body-base text-on-surface-variant"
                  type="number"
                  value="0"
                  readOnly
                />
              </div>
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Min Level</label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  min="0"
                  placeholder="0"
                  type="number"
                  value={form.minimum_stock}
                  onChange={(event) => updateForm('minimum_stock', event.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Supplier Name</label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  placeholder="Supplier..."
                  type="text"
                  value={form.supplier_name}
                  onChange={(event) => updateForm('supplier_name', event.target.value)}
                />
              </div>
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Batch / Lot</label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  placeholder="LOT-2026..."
                  type="text"
                  value={form.batch_lot_number}
                  onChange={(event) => updateForm('batch_lot_number', event.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Purchase Price</label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.purchase_price}
                  onChange={(event) => updateForm('purchase_price', event.target.value)}
                />
              </div>
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Expiry Date</label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  type="date"
                  value={form.expiry_date}
                  onChange={(event) => updateForm('expiry_date', event.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Storage Location</label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  placeholder="Cabinet A..."
                  type="text"
                  value={form.storage_location}
                  onChange={(event) => updateForm('storage_location', event.target.value)}
                />
              </div>
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Barcode / QR Code</label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  placeholder="Scan or enter code..."
                  type="text"
                  value={form.barcode}
                  onChange={(event) => updateForm('barcode', event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Item Description / Storage Notes</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base resize-none"
                placeholder="Enter storage requirements or descriptions..."
                rows="4"
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
              />
            </div>

            <div className="bg-surface-container p-md rounded-2xl">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">info</span>
                <p className="text-caption text-on-surface-variant">
                  Low-stock alerts are calculated from quantity and minimum stock.
                </p>
              </div>
            </div>
          </div>

          <div className="p-gutter border-t border-outline-variant/30 flex gap-md">
            <button className="flex-1 py-3 border border-outline-variant text-on-surface-variant rounded-xl font-label-bold hover:bg-surface-container-low transition-colors" type="button" onClick={() => setQuickAddOpen(false)}>
              Cancel
            </button>
            <button className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-label-bold hover:bg-on-primary-fixed-variant transition-all shadow-md active:scale-95 disabled:opacity-60" type="submit" disabled={saving}>
              {saving ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>

      <div
        className={`fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          transactionOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setTransactionOpen(false)}
      >
        <form
          className={`fixed right-0 top-0 h-screen w-full max-w-md bg-surface-container-lowest shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
            transactionOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(event) => event.stopPropagation()}
          onSubmit={handleTransactionSubmit}
        >
          <div className="p-gutter flex items-center justify-between border-b border-outline-variant/30">
            <h3 className="text-headline-md font-headline-md text-primary">Inventory Transaction</h3>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-all" type="button" onClick={() => setTransactionOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-gutter space-y-md">
            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Item</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                value={transactionForm.item_id}
                onChange={(event) => updateTransactionForm('item_id', event.target.value)}
                required
              >
                <option value="">Select item</option>
                {items.map((item) => (
                  <option key={item.item_id} value={item.item_id}>
                    {item.item_name} ({item.quantity_in_stock} {item.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Type</label>
                <select
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  value={transactionForm.transaction_type}
                  onChange={(event) => updateTransactionForm('transaction_type', event.target.value)}
                  required
                >
                  <option value="IN">IN</option>
                  <option value="OUT">OUT</option>
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                </select>
              </div>
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">
                  {transactionForm.transaction_type === 'ADJUSTMENT' ? 'New Stock Qty' : 'Quantity'}
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  min={transactionForm.transaction_type === 'ADJUSTMENT' ? '0' : '1'}
                  type="number"
                  value={transactionForm.quantity}
                  onChange={(event) => updateTransactionForm('quantity', event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Transaction Date</label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                type="date"
                value={transactionForm.transaction_date}
                onChange={(event) => updateTransactionForm('transaction_date', event.target.value)}
                required
              />
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Notes</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base resize-none"
                rows="4"
                value={transactionForm.notes}
                onChange={(event) => updateTransactionForm('notes', event.target.value)}
              />
            </div>
          </div>

          <div className="p-gutter border-t border-outline-variant/30 flex gap-md">
            <button className="flex-1 py-3 border border-outline-variant text-on-surface-variant rounded-xl font-label-bold hover:bg-surface-container-low transition-colors" type="button" onClick={() => setTransactionOpen(false)}>
              Cancel
            </button>
            <button className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-label-bold hover:bg-on-primary-fixed-variant transition-all shadow-md active:scale-95 disabled:opacity-60" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InventoryManagement;
