import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone_number: '',
  birth_date: '',
  specialization: '',
};

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

const fullName = (dentist) =>
  [dentist?.first_name, dentist?.last_name].filter(Boolean).join(' ') || 'Unknown';

const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

const formatTime = (value) => {
  if (!value) return '';
  const [hours, minutes] = value.split(':');
  return new Date(2024, 0, 1, Number(hours), Number(minutes)).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const todayDate = () => new Date().toISOString().slice(0, 10);

const todayDayName = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
  });

function DentistsManagement() {
  const [dentists, setDentists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = user?.full_name ? initials(user.full_name) : 'AD';

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [dentistsRes, appointmentsRes, schedulesRes] = await Promise.all([
        fetch('/api/dentists', { headers: authHeaders() }),
        fetch('/api/appointments', { headers: authHeaders() }),
        fetch('/api/work-schedules', { headers: authHeaders() }),
      ]);

      const [dentistsJson, appointmentsJson, schedulesJson] = await Promise.all([
        dentistsRes.json(),
        appointmentsRes.json(),
        schedulesRes.json(),
      ]);

      if (!dentistsRes.ok) throw new Error(dentistsJson.message || 'Could not load dentists.');
      if (!appointmentsRes.ok) throw new Error(appointmentsJson.message || 'Could not load appointments.');
      if (!schedulesRes.ok) throw new Error(schedulesJson.message || 'Could not load schedules.');

      setDentists(dentistsJson.data || []);
      setAppointments(appointmentsJson.data || []);
      setSchedules(schedulesJson.data || []);
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

  const scheduleByDentist = useMemo(() => {
    return schedules.reduce((grouped, schedule) => {
      if (!grouped[schedule.dentist_id]) grouped[schedule.dentist_id] = [];
      grouped[schedule.dentist_id].push(schedule);
      return grouped;
    }, {});
  }, [schedules]);

  const todayAppointmentCounts = useMemo(() => {
    return appointments
      .filter((appointment) => appointment.appointment_date === todayDate() && appointment.status !== 'Cancelled')
      .reduce((counts, appointment) => {
        counts[appointment.dentist_id] = (counts[appointment.dentist_id] || 0) + 1;
        return counts;
      }, {});
  }, [appointments]);

  const dentistAvailability = useCallback((dentist) => {
    if (dentist.status !== 'Active') return 'Off-duty';

    const todaySchedule = (scheduleByDentist[dentist.dentist_id] || []).find(
      (schedule) => schedule.day === todayDayName()
    );

    if (!todaySchedule) return 'Off-duty';
    if ((todayAppointmentCounts[dentist.dentist_id] || 0) > 0) return 'Busy';
    return 'Available';
  }, [scheduleByDentist, todayAppointmentCounts]);

  const stats = useMemo(() => {
    const active = dentists.filter((dentist) => dentist.status === 'Active').length;
    const availableToday = dentists.filter((dentist) => dentistAvailability(dentist) === 'Available').length;
    const offDuty = dentists.filter((dentist) => dentistAvailability(dentist) === 'Off-duty').length;

    return {
      total: dentists.length,
      active,
      availableToday,
      offDuty,
    };
  }, [dentists, dentistAvailability]);

  const filteredDentists = useMemo(() => {
    const query = search.trim().toLowerCase();

    return dentists.filter((dentist) => {
      const name = fullName(dentist).toLowerCase();
      const email = (dentist.email || dentist.User?.email || '').toLowerCase();
      const phone = dentist.phone || dentist.User?.phone_number || '';
      const specialization = (dentist.specialization || '').toLowerCase();
      const availability = dentistAvailability(dentist);
      const matchesSearch =
        !query ||
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        specialization.includes(query) ||
        String(dentist.dentist_id).includes(query);
      const matchesStatus =
        statusFilter === 'all' ||
        dentist.status === statusFilter ||
        availability === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [dentists, search, statusFilter, dentistAvailability]);

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/dentists', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          phone: form.phone_number,
          status: 'Active',
        }),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Dentist could not be created.');

      setForm(emptyForm);
      setQuickAddOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dentistId) => {
    if (!window.confirm('Deactivate this dentist?')) return;

    try {
      const response = await fetch(`/api/dentists/${dentistId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Dentist could not be deactivated.');

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const scheduleLabel = (dentistId) => {
    const dentistSchedules = scheduleByDentist[dentistId] || [];
    if (dentistSchedules.length === 0) return 'No schedule set';

    return dentistSchedules
      .slice(0, 2)
      .map((schedule) => `${schedule.day.slice(0, 3)}, ${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`)
      .join(' / ');
  };

  const availabilityClasses = {
    Available: 'bg-green-100 text-green-700',
    Busy: 'bg-orange-100 text-orange-700',
    'Off-duty': 'bg-outline-variant/20 text-on-surface-variant',
  };

  return (
    <div className="bg-background font-body-base text-body-base text-on-background min-h-screen overflow-x-hidden">
      <AdminSidebar />

      <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-surface/90 backdrop-blur-md z-10 flex items-center justify-between px-6 shadow-sm border-b border-outline-variant/20">
        <div className="flex-1 max-w-xl clinical-glow">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant">search</span>
            <input
              className="w-full bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-body-base focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/60"
              placeholder="Search dentists, specialization, or contact..."
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
              <span className="text-primary font-bold">Dentists</span>
            </nav>
            <h2 className="text-headline-lg font-headline-lg text-on-surface">Dentists Management</h2>
          </div>
          <button
            className="bg-primary text-on-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-label-bold shadow-lg hover:bg-on-primary-fixed-variant transition-all active:scale-[0.98]"
            onClick={() => setQuickAddOpen(true)}
          >
            <span className="material-symbols-outlined">person_add</span>
            Add New Dentist
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
          {[
            ['groups', 'Total Dentists', stats.total, 'bg-primary/10 text-primary'],
            ['check_circle', 'Active Dentists', stats.active, 'bg-green-100 text-green-600'],
            ['event_available', 'Available Today', stats.availableToday, 'bg-blue-100 text-blue-600'],
            ['event_busy', 'Off-duty', stats.offDuty, 'bg-orange-100 text-orange-600'],
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
              ['Active', 'Active'],
              ['Available', 'Available'],
              ['Busy', 'Busy'],
              ['Off-duty', 'Off-duty'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`px-md py-2 rounded-full font-label-bold text-caption transition-colors ${
                  statusFilter === value
                    ? 'bg-primary-container text-on-primary-container'
                    : 'hover:bg-surface-container text-on-surface-variant'
                }`}
                onClick={() => setStatusFilter(value)}
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
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Name</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Specialization</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Contact Info</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Schedule</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {loading ? (
                  <tr>
                    <td className="px-gutter py-lg text-on-surface-variant" colSpan="6">Loading dentists...</td>
                  </tr>
                ) : filteredDentists.length === 0 ? (
                  <tr>
                    <td className="px-gutter py-lg text-on-surface-variant" colSpan="6">No dentists found.</td>
                  </tr>
                ) : (
                  filteredDentists.map((dentist) => {
                    const name = fullName(dentist);
                    const availability = dentistAvailability(dentist);

                    return (
                      <tr key={dentist.dentist_id} className="hover:bg-surface-container-low/60 transition-colors group">
                        <td className="px-gutter py-md">
                          <div className="flex items-center gap-sm">
                            <div className="h-10 w-10 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary font-bold text-caption">
                              {initials(name)}
                            </div>
                            <div>
                              <p className="font-label-bold text-on-surface">Dr. {name}</p>
                              <p className="text-caption text-on-surface-variant">#D-{dentist.dentist_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="text-caption text-on-surface font-label-bold">{dentist.specialization || 'General Dentistry'}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="text-caption text-on-surface">{dentist.email || dentist.User?.email || '-'}</p>
                          <p className="text-caption text-on-surface-variant">{dentist.phone || dentist.User?.phone_number || '-'}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="text-caption text-on-surface">{scheduleLabel(dentist.dentist_id)}</p>
                          <button className="text-primary text-xs font-label-bold hover:underline mt-1">Manage Shifts</button>
                        </td>
                        <td className="px-gutter py-md">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-label-bold ${availabilityClasses[availability]}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                            {availability}
                          </span>
                        </td>
                        <td className="px-gutter py-md text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="View">
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                            <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Edit">
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                              title="Deactivate"
                              onClick={() => handleDelete(dentist.dentist_id)}
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
              Showing <span className="font-label-bold text-on-surface">{filteredDentists.length}</span> of{' '}
              <span className="font-label-bold text-on-surface">{dentists.length}</span> dentists
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
            <h3 className="text-headline-md font-headline-md text-primary">Add New Dentist</h3>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-all" type="button" onClick={() => setQuickAddOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-gutter space-y-md">
            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">First Name</label>
                <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" placeholder="First name" type="text" value={form.first_name} onChange={(event) => updateForm('first_name', event.target.value)} required />
              </div>
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Last Name</label>
                <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" placeholder="Last name" type="text" value={form.last_name} onChange={(event) => updateForm('last_name', event.target.value)} required />
              </div>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Specialization</label>
              <select className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" value={form.specialization} onChange={(event) => updateForm('specialization', event.target.value)} required>
                <option value="">Select specialization</option>
                <option>Orthodontics</option>
                <option>Dental Surgeon</option>
                <option>Periodontist</option>
                <option>General Dentistry</option>
                <option>Endodontics</option>
                <option>Pediatric Dentistry</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Email</label>
                <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" placeholder="Email" type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} required />
              </div>
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Phone</label>
                <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" placeholder="Phone" type="tel" value={form.phone_number} onChange={(event) => updateForm('phone_number', event.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Date of Birth</label>
                <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" type="date" value={form.birth_date} onChange={(event) => updateForm('birth_date', event.target.value)} />
              </div>
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Temporary Password</label>
                <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" placeholder="8+ characters" type="password" minLength="8" value={form.password} onChange={(event) => updateForm('password', event.target.value)} required />
              </div>
            </div>

            <div className="bg-surface-container p-md rounded-2xl">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">info</span>
                <p className="text-caption text-on-surface-variant">
                  A dentist user account is created together with the dentist profile.
                </p>
              </div>
            </div>
          </div>

          <div className="p-gutter border-t border-outline-variant/30 flex gap-md">
            <button className="flex-1 py-3 border border-outline-variant text-on-surface-variant rounded-xl font-label-bold hover:bg-surface-container-low transition-colors" type="button" onClick={() => setQuickAddOpen(false)}>
              Cancel
            </button>
            <button className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-label-bold hover:bg-on-primary-fixed-variant transition-all shadow-md active:scale-95 disabled:opacity-60" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Dentist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DentistsManagement;
