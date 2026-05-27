import { useEffect, useMemo, useState } from 'react';
import DentistSidebar from '../components/DentistSidebar';

const statusStyles = {
  Scheduled: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
  'No-Show': 'bg-orange-100 text-orange-700',
};

const allowedStatuses = ['Scheduled', 'Completed', 'Cancelled', 'No-Show'];

const getToken = () => localStorage.getItem('accessToken');

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  'Content-Type': 'application/json',
});

const fullName = (item) => {
  if (!item) return 'Unknown';
  return [item.first_name, item.last_name].filter(Boolean).join(' ') || 'Unknown';
};

const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'NA';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (value) => {
  if (!value) return '-';
  const [hours, minutes] = value.split(':');
  return new Date(2024, 0, 1, Number(hours), Number(minutes)).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

function DentistAppointments() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = user?.full_name ? initials(user.full_name) : 'DR';

  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('today');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dentistId, setDentistId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [statusModal, setStatusModal] = useState({ open: false, appointment: null });
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const [detailModal, setDetailModal] = useState({ open: false, appointment: null });

  useEffect(() => {
    fetch('/api/dentists/me', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setDentistId(data.dentist_id))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!dentistId) return;
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/appointments/dentist/${dentistId}`, {
          headers: authHeaders(),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Could not load appointments.');
        setAppointments(json.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dentistId, refreshTrigger]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setStatusModal({ open: false, appointment: null });
        setDetailModal({ open: false, appointment: null });
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredAppointments = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const query = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const patientName = fullName(appointment.Patient).toLowerCase();
      const treatmentName = appointment.Treatment?.treatment_name?.toLowerCase() || '';

      const matchesSearch =
        !query ||
        patientName.includes(query) ||
        treatmentName.includes(query) ||
        String(appointment.appointment_id).includes(query);

      const matchesDate =
        filter === 'today'
          ? appointment.appointment_date === today
          : filter === 'upcoming'
            ? appointment.appointment_date > today
            : filter === 'past'
              ? appointment.appointment_date < today
              : appointment.status === 'Scheduled';

      return matchesSearch && matchesDate;
    });
  }, [appointments, filter, search]);

  const openStatusModal = (appointment) => {
    setNewStatus(appointment.status);
    setStatusModal({ open: true, appointment });
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusModal.appointment) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/appointments/${statusModal.appointment.appointment_id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Could not update status.');
      setStatusModal({ open: false, appointment: null });
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="bg-background font-body-base text-body-base text-on-background min-h-screen overflow-x-hidden">
      <DentistSidebar />

      <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-surface/90 backdrop-blur-md z-10 flex items-center justify-between px-6 shadow-sm border-b border-outline-variant/20">
        <div className="flex-1 max-w-xl clinical-glow">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant">search</span>
            <input
              className="w-full bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-body-base focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/60"
              placeholder="Search patients or treatments..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
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
              <span>Dentist</span>
              <span>/</span>
              <span className="text-primary font-bold">My Appointments</span>
            </nav>
            <h2 className="text-headline-lg font-headline-lg text-on-surface">My Appointments</h2>
            <p className="text-body-base text-on-surface-variant mt-1">Your upcoming and past appointments</p>
          </div>
          <button
            className="bg-primary text-on-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-label-bold shadow-lg hover:bg-on-primary-fixed-variant transition-all active:scale-[0.98]"
            onClick={refreshData}
          >
            <span className="material-symbols-outlined">refresh</span>
            Refresh
          </button>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-lg flex flex-wrap items-center gap-md">
          <div className="flex items-center gap-xs overflow-x-auto pb-1 md:pb-0">
            {[
              ['today', 'Today'],
              ['upcoming', 'Upcoming'],
              ['scheduled', 'Scheduled'],
              ['past', 'Past'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`px-md py-2 rounded-full font-label-bold text-caption transition-colors ${
                  filter === value
                    ? 'bg-primary-container text-on-primary-container'
                    : 'hover:bg-surface-container text-on-surface-variant'
                }`}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-md rounded-xl border border-error-container bg-error-container/60 px-4 py-3 text-error text-label-bold">
            {error}
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden border border-outline-variant/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Patient</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Treatment</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Date & Time</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Duration</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {loading ? (
                  <tr>
                    <td className="px-gutter py-lg text-on-surface-variant" colSpan="6">Loading appointments...</td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td className="px-gutter py-lg text-on-surface-variant" colSpan="6">No appointments found.</td>
                  </tr>
                ) : (
                  filteredAppointments.map((appointment) => {
                    const patientName = fullName(appointment.Patient);
                    const badgeClass = statusStyles[appointment.status] || 'bg-surface-container text-on-surface-variant';
                    return (
                      <tr key={appointment.appointment_id} className="hover:bg-surface-container-low/60 transition-colors group">
                        <td className="px-gutter py-md">
                          <div className="flex items-center gap-sm">
                            <div className="h-10 w-10 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary font-bold text-caption">
                              {initials(patientName)}
                            </div>
                            <div>
                              <p className="font-label-bold text-on-surface">{patientName}</p>
                              <p className="text-caption text-on-surface-variant">#P-{appointment.patient_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-gutter py-md">
                          <span className="px-3 py-1 bg-surface-container text-on-surface text-caption rounded-lg border border-outline-variant/30">
                            {appointment.Treatment?.treatment_name || `Treatment #${appointment.treatment_id}`}
                          </span>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="font-label-bold text-on-surface">{formatDate(appointment.appointment_date)}</p>
                          <p className="text-caption text-on-surface-variant">{formatTime(appointment.appointment_time)}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="text-on-surface">{appointment.duration ? `${appointment.duration} min` : '-'}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-label-bold ${badgeClass}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-gutter py-md text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="View Details"
                              onClick={() => setDetailModal({ open: true, appointment })}
                            >
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                            <button
                              className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="Update Status"
                              onClick={() => openStatusModal(appointment)}
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
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
              Showing <span className="font-label-bold text-on-surface">{filteredAppointments.length}</span> of{' '}
              <span className="font-label-bold text-on-surface">{appointments.length}</span> appointments
            </p>
          </div>
        </div>
      </main>

      {/* Status Update Modal */}
      <div
        className={`fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          statusModal.open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setStatusModal({ open: false, appointment: null })}
      >
        <form
          className={`fixed right-0 top-0 h-screen w-full max-w-md bg-surface-container-lowest shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
            statusModal.open ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleStatusUpdate}
        >
          <div className="p-gutter flex items-center justify-between border-b border-outline-variant/30">
            <h3 className="text-headline-md font-headline-md text-primary">Update Status</h3>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-all" type="button" onClick={() => setStatusModal({ open: false, appointment: null })}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-gutter space-y-md">
            {statusModal.appointment && (
              <div className="bg-surface-container rounded-2xl p-md space-y-2">
                <p className="font-label-bold text-on-surface">{fullName(statusModal.appointment.Patient)}</p>
                <p className="text-caption text-on-surface-variant">
                  {formatDate(statusModal.appointment.appointment_date)} at {formatTime(statusModal.appointment.appointment_time)}
                </p>
                <p className="text-caption text-on-surface-variant">
                  {statusModal.appointment.Treatment?.treatment_name || `Treatment #${statusModal.appointment.treatment_id}`}
                </p>
              </div>
            )}
            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Status</label>
              <div className="space-y-2">
                {allowedStatuses.map((s) => (
                  <label
                    key={s}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      newStatus === s
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant/30 hover:bg-surface-container-low'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={newStatus === s}
                      onChange={() => setNewStatus(s)}
                      className="accent-primary"
                    />
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-label-bold ${statusStyles[s]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                      {s}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="p-gutter border-t border-outline-variant/30 flex gap-md">
            <button
              className="flex-1 py-3 border border-outline-variant text-on-surface-variant rounded-xl font-label-bold hover:bg-surface-container-low transition-colors"
              type="button"
              onClick={() => setStatusModal({ open: false, appointment: null })}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-label-bold hover:bg-on-primary-fixed-variant transition-all shadow-md active:scale-95 disabled:opacity-60"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>

      {/* Detail Modal */}
      <div
        className={`fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          detailModal.open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDetailModal({ open: false, appointment: null })}
      >
        <div
          className={`fixed right-0 top-0 h-screen w-full max-w-md bg-surface-container-lowest shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
            detailModal.open ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-gutter flex items-center justify-between border-b border-outline-variant/30">
            <h3 className="text-headline-md font-headline-md text-primary">Appointment Details</h3>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-all" type="button" onClick={() => setDetailModal({ open: false, appointment: null })}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          {detailModal.appointment && (
            <div className="flex-1 overflow-y-auto p-gutter space-y-md">
              <div className="flex items-center gap-sm">
                <div className="h-14 w-14 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary font-bold text-body-base">
                  {initials(fullName(detailModal.appointment.Patient))}
                </div>
                <div>
                  <p className="font-label-bold text-on-surface text-body-base">{fullName(detailModal.appointment.Patient)}</p>
                  <p className="text-caption text-on-surface-variant">#P-{detailModal.appointment.patient_id}</p>
                </div>
              </div>
              {[
                ['Date', formatDate(detailModal.appointment.appointment_date)],
                ['Time', formatTime(detailModal.appointment.appointment_time)],
                ['Duration', detailModal.appointment.duration ? `${detailModal.appointment.duration} minutes` : '-'],
                ['Treatment', detailModal.appointment.Treatment?.treatment_name || `Treatment #${detailModal.appointment.treatment_id}`],
                ['Status', detailModal.appointment.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-3 border-b border-outline-variant/20">
                  <span className="text-caption text-on-surface-variant font-label-bold">{label}</span>
                  <span className="text-caption text-on-surface font-label-bold">{value}</span>
                </div>
              ))}
              {detailModal.appointment.notes && (
                <div className="bg-surface-container rounded-2xl p-md">
                  <p className="text-caption font-label-bold text-on-surface-variant mb-2">Notes</p>
                  <p className="text-body-base text-on-surface">{detailModal.appointment.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DentistAppointments;