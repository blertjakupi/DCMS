import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import DentistSidebar from '../components/DentistSidebar';

const statuses = ['Pending', 'Sent', 'Failed'];

const statusBadge = {
  Pending: 'bg-surface-variant/30 text-on-surface-variant border-outline-variant/30',
  Sent: 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]',
  Failed: 'bg-error-container/30 text-error border-error/30',
};

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

function patientName(reminder) {
  const patient = reminder.Patient || reminder.Appointment?.Patient;
  const name = `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim();
  return name || (reminder.patient_id ? `Patient #${reminder.patient_id}` : 'Unassigned Patient');
}

function reminderType(reminder) {
  return reminder.reminder_type || reminder.type || 'Appointment';
}

function scheduledValue(reminder) {
  return reminder.scheduled_date || reminder.send_at || reminder.sent_date || '';
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function RemindersPage() {
  const location = useLocation();
  const SidebarComponent = location.pathname.startsWith('/dentist') ? DentistSidebar : AdminSidebar;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [form, setForm] = useState({
    type: '',
    scheduledDate: '',
    status: 'Pending',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/reminders', {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to fetch reminders (${res.status})`);
      }
      const json = await res.json();
      setReminders(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const types = useMemo(() => {
    const uniqueTypes = new Set(reminders.map(reminderType).filter(Boolean));
    return Array.from(uniqueTypes).sort();
  }, [reminders]);

  const filtered = reminders.filter(reminder => {
    const name = patientName(reminder).toLowerCase();
    const type = reminderType(reminder).toLowerCase();
    const status = (reminder.status || '').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || type === typeFilter;
    const matchStatus = statusFilter === 'all' || status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const openModal = (reminder) => {
    setSelectedReminder(reminder);
    setForm({
      type: reminderType(reminder),
      scheduledDate: toDateTimeLocal(scheduledValue(reminder)),
      status: reminder.status || 'Pending',
    });
    setModalOpen(true);
  };

  const saveReminder = async () => {
    if (!selectedReminder) return;
    setSaving(true);
    setError('');
    try {
      if (!form.type.trim()) throw new Error('Reminder type is required.');
      if (!form.scheduledDate) throw new Error('Scheduled date is required.');

      const scheduledDate = form.scheduledDate ? new Date(form.scheduledDate).toISOString() : null;
      const res = await fetch(`/api/reminders/${selectedReminder.reminder_id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          type: form.type,
          reminder_type: form.type,
          send_at: scheduledDate,
          scheduled_date: scheduledDate,
          status: form.status,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update reminder');
      }
      await fetchReminders();
      setModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reminder) => {
    if (!window.confirm(`Are you sure you want to delete this reminder for ${patientName(reminder)}? This action cannot be undone.`)) return;
    setDeleting(reminder.reminder_id);
    setError('');
    try {
      const res = await fetch(`/api/reminders/${reminder.reminder_id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to delete reminder');
      }
      await fetchReminders();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="font-body-base text-body-base text-on-background h-screen overflow-hidden flex">
      <SidebarComponent />

      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        <header className="bg-surface fixed top-0 right-0 left-0 md:left-64 h-16 z-10 flex justify-between items-center px-6 shadow-sm border-b border-surface-variant hidden md:flex">
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative rounded-full bg-surface-container-low flex items-center px-4 py-2 border border-outline-variant focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-outline mr-2">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-[15px] text-on-surface w-full placeholder:text-outline p-0 focus:outline-none"
                placeholder="Search patients, dentists, or records..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <button className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-highest transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-highest transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface"></span>
            </button>
            <button className="p-1 rounded-full hover:bg-surface-container-highest transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[14px] font-semibold">
                {initials}
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 mt-16 pb-24 md:pb-6 bg-background">
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-8">
              <h2 className="text-[32px] font-bold text-on-surface">Reminders</h2>
              <p className="text-[16px] text-on-surface-variant mt-1">Manage patient appointment reminders and delivery status.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-outline-variant/20 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-outline-variant/20 flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface">
                <div className="relative w-full sm:w-72">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg pl-10 pr-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[15px]"
                    placeholder="Search by patient name"
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <select
                    className="bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg px-3 py-2 focus:border-primary outline-none cursor-pointer text-[15px]"
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                  >
                    <option value="all">Type: All</option>
                    {types.map(type => (
                      <option key={type} value={type.toLowerCase()}>{type}</option>
                    ))}
                  </select>
                  <select
                    className="bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg px-3 py-2 focus:border-primary outline-none cursor-pointer text-[15px]"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Status: All</option>
                    {statuses.map(status => (
                      <option key={status} value={status.toLowerCase()}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-on-surface-variant">Loading reminders...</span>
                  </div>
                </div>
              )}

              {!loading && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant text-[12px] font-semibold uppercase tracking-wider">
                        <th className="py-3 px-6">Patient Name</th>
                        <th className="py-3 px-6">Type</th>
                        <th className="py-3 px-6">Scheduled Date</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-on-surface-variant text-sm">
                            No reminders found.
                          </td>
                        </tr>
                      ) : (
                        filtered.map(reminder => (
                          <tr key={reminder.reminder_id} className="hover:bg-surface-variant/20 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[13px] font-semibold shrink-0">
                                  {patientName(reminder).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <div className="text-[15px] font-semibold text-on-surface">{patientName(reminder)}</div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-[15px] text-on-surface-variant">{reminderType(reminder)}</td>
                            <td className="py-4 px-6 text-[15px] text-on-surface-variant">{formatDateTime(scheduledValue(reminder))}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${statusBadge[reminder.status] || statusBadge.Pending}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${reminder.status === 'Sent' ? 'bg-[#137333]' : reminder.status === 'Failed' ? 'bg-error' : 'bg-outline'}`}></span>
                                {reminder.status || 'Pending'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => openModal(reminder)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-xs font-semibold"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit_square</span> Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(reminder)}
                                  disabled={deleting === reminder.reminder_id}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-error/30 text-error hover:bg-error/5 transition-colors text-xs font-semibold disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                  {deleting === reminder.reminder_id ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && (
                <div className="p-4 px-6 border-t border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest">
                  <span className="text-[12px] text-on-surface-variant">Showing {filtered.length} of {reminders.length} entries</span>
                  <button
                    onClick={fetchReminders}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span> Refresh
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-lg border border-outline-variant/20 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
              <h3 className="text-[24px] font-semibold text-on-surface">Edit Reminder</h3>
              <button onClick={() => setModalOpen(false)} className="text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-[14px] font-semibold text-on-surface mb-2">Patient</label>
                <div className="text-[16px] text-on-surface-variant p-3 bg-surface-container-low rounded-lg border border-outline-variant/30">
                  {selectedReminder ? patientName(selectedReminder) : ''}
                </div>
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-on-surface mb-2">Reminder Type</label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg p-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[15px]"
                  required
                  value={form.type}
                  onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-on-surface mb-2">Scheduled Date</label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg p-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[15px]"
                  type="datetime-local"
                  required
                  value={form.scheduledDate}
                  onChange={e => setForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-on-surface mb-2">Status</label>
                <select
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg p-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[15px]"
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 bg-surface border-t border-outline-variant/20 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="px-6 py-2 rounded-lg border border-outline text-on-surface text-[14px] font-semibold hover:bg-surface-variant/50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveReminder}
                disabled={saving}
                className="px-6 py-2 rounded-lg bg-primary text-on-primary text-[14px] font-semibold hover:bg-[#005049] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RemindersPage;
