import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import DentistSidebar from '../components/DentistSidebar';
import HeaderActions from '../components/HeaderActions';
import { authFetch } from '../utils/authFetch';


const emptyForm = {
  patient_id: '',
  dentist_id: '',
  treatment_id: '',
  appointment_date: '',
  appointment_time: '',
  notes: '',
};

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const statusStyles = {
  Scheduled: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
  'No-Show': 'bg-orange-100 text-orange-700',
};



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

const formatDuration = (minutes) => {
  const numericMinutes = Number(minutes || 30);
  if (numericMinutes < 60) return `${numericMinutes} min`;
  const hours = Math.floor(numericMinutes / 60);
  const remainingMinutes = numericMinutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes} min` : `${hours}h`;
};

const toDateString = (date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const getTodayDateString = () => toDateString(new Date());

const getLocalDate = (dateString) => {
  const [year, month, day] = String(dateString || '').split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
};

const isSundayDate = (dateString) => getLocalDate(dateString).getDay() === 0;

const buildCalendarDays = (visibleMonth) => {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
};

const normalizeTime = (time) => String(time || '').slice(0, 5);

function AppointmentsManagement() {
  const location = useLocation();
  const SidebarComponent = location.pathname.startsWith('/dentist') ? DentistSidebar : AdminSidebar;
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [filter, setFilter] = useState('today');
  const [dentistFilter, setDentistFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [visibleMonth, setVisibleMonth] = useState(() => getLocalDate(getTodayDateString()));
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewAppointment, setViewAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [appointmentsRes, patientsRes, dentistsRes, treatmentsRes] = await Promise.all([
        authFetch('/api/appointments'),
        authFetch('/api/patients'),
        authFetch('/api/dentists'),
        authFetch('/api/treatments'),
      ]);

      const [appointmentsJson, patientsJson, dentistsJson, treatmentsJson] = await Promise.all([
        appointmentsRes.json(),
        patientsRes.json(),
        dentistsRes.json(),
        treatmentsRes.json(),
      ]);

      if (!appointmentsRes.ok) throw new Error(appointmentsJson.message || 'Could not load appointments.');
      if (!patientsRes.ok) throw new Error(patientsJson.message || 'Could not load patients.');
      if (!dentistsRes.ok) throw new Error(dentistsJson.message || 'Could not load dentists.');
      if (!treatmentsRes.ok) throw new Error(treatmentsJson.message || 'Could not load treatments.');

      setAppointments(appointmentsJson.data || []);
      setPatients(patientsJson.data || []);
      setDentists(dentistsJson.data || []);
      setTreatments(treatmentsJson.data || []);
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
      if (event.key === 'Escape') {
        setQuickAddOpen(false);
        setViewAppointment(null);
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
      const dentistName = fullName(appointment.Dentist).toLowerCase();
      const treatmentName = appointment.Treatment?.treatment_name?.toLowerCase() || '';

      const matchesSearch =
        !query ||
        patientName.includes(query) ||
        dentistName.includes(query) ||
        treatmentName.includes(query) ||
        String(appointment.appointment_id).includes(query);

      const matchesDentist =
        dentistFilter === 'all' || String(appointment.dentist_id) === String(dentistFilter);

      const matchesDate =
        filter === 'today'
          ? appointment.appointment_date === today
          : filter === 'upcoming'
            ? appointment.appointment_date > today
            : filter === 'past'
              ? appointment.appointment_date < today
              : appointment.status === 'Scheduled';

      return matchesSearch && matchesDentist && matchesDate;
    });
  }, [appointments, dentistFilter, filter, search]);

  const selectedTreatment = treatments.find(
    (treatment) => String(treatment.treatment_id) === String(form.treatment_id)
  );
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const visibleMonthLabel = visibleMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!quickAddOpen || !form.dentist_id || !form.appointment_date || !form.treatment_id || isSundayDate(form.appointment_date)) {
        setAvailableSlots([]);
        if (isSundayDate(form.appointment_date)) {
          setForm((prev) => ({ ...prev, appointment_time: '' }));
        }
        return;
      }

      setSlotsLoading(true);
      try {
        const params = new URLSearchParams({
          date: form.appointment_date,
          treatmentId: form.treatment_id,
        });

        if (editingId) {
          params.set('excludeAppointmentId', editingId);
        }

        const response = await authFetch(`/api/appointments/dentist/${form.dentist_id}/availability?${params.toString()}`);
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Could not load available slots.');

        const slots = json.data?.slots || [];
        setAvailableSlots(slots);

        const currentTime = normalizeTime(form.appointment_time);
        const matchingSlot = slots.find((slot) => normalizeTime(slot.time) === currentTime && slot.available);
        if (matchingSlot && form.appointment_time !== matchingSlot.time) {
          setForm((prev) => ({
            ...prev,
            appointment_time: matchingSlot.time,
          }));
        } else if (!matchingSlot) {
          const firstAvailable = slots.find((slot) => slot.available);
          setForm((prev) => ({
            ...prev,
            appointment_time: firstAvailable ? firstAvailable.time : '',
          }));
        }
      } catch (err) {
        setAvailableSlots([]);
        setForm((prev) => ({ ...prev, appointment_time: '' }));
        setError(err.message);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchAvailability();
  }, [quickAddOpen, form.dentist_id, form.appointment_date, form.treatment_id, form.appointment_time, editingId]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setAvailableSlots([]);
    setVisibleMonth(getLocalDate(getTodayDateString()));
    setQuickAddOpen(true);
  };

  const openEdit = (appointment) => {
    setEditingId(appointment.appointment_id);
    setForm({
      patient_id: appointment.patient_id || '',
      dentist_id: appointment.dentist_id || '',
      treatment_id: appointment.treatment_id || '',
      appointment_date: appointment.appointment_date || '',
      appointment_time: String(appointment.appointment_time || '').slice(0, 5),
      notes: appointment.notes || '',
      status: appointment.status || 'Scheduled',
    });
    setAvailableSlots([]);
    setVisibleMonth(getLocalDate(appointment.appointment_date || getTodayDateString()));
    setQuickAddOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSundayDate(form.appointment_date)) {
      setError('Clinic is closed on Sundays. Please choose another date.');
      return;
    }

    if (!form.appointment_time) {
      setError('Please choose an available appointment time.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await authFetch(editingId ? `/api/appointments/${editingId}` : '/api/appointments', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify({ ...form, status: form.status || 'Scheduled' }),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Appointment could not be created.');

      setForm(emptyForm);
      setEditingId(null);
      setQuickAddOpen(false);
      setSuccessMessage(editingId ? 'Termini u perditesua me sukses.' : 'Termini u krijua me sukses.');
      window.setTimeout(() => setSuccessMessage(''), 5000);
      await loadData();
    } catch (err) {
      setError(err.message);
      setSuccessMessage('');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Cancel this appointment?')) return;

    try {
      const response = await authFetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Appointment could not be cancelled.');

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-background font-body-base text-body-base text-on-background min-h-screen overflow-x-hidden">
      <SidebarComponent />

  <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-surface/90 backdrop-blur-md z-10 flex items-center justify-between px-6 shadow-sm border-b border-outline-variant/20">
        <div className="flex-1 max-w-xl clinical-glow">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant">search</span>
            <input
              className="w-full bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-body-base focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/60"
              placeholder="Search patients, dentists, or treatments..."
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <HeaderActions />
      </header>

      <main className="md:ml-64 pt-28 p-4 md:p-gutter min-h-screen">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg mt-12">
          <div>
            <nav className="flex gap-2 text-caption text-on-surface-variant mb-1">
              <span>Admin</span>
              <span>/</span>
              <span className="text-primary font-bold">Appointments</span>
            </nav>
            <h2 className="text-headline-lg font-headline-lg text-on-surface">Appointments Management</h2>
          </div>
          <button
            className="bg-primary text-on-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-label-bold shadow-lg hover:bg-on-primary-fixed-variant transition-all active:scale-[0.98]"
            onClick={openCreate}
          >
            <span className="material-symbols-outlined">add_circle</span>
            New Appointment
          </button>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-lg flex flex-wrap items-center justify-between gap-md">
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

          <div className="flex items-center gap-md flex-wrap">
            <div className="flex items-center gap-2 bg-surface-container-low px-md py-2 rounded-lg border border-outline-variant/30">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">medical_information</span>
              <select
                className="bg-transparent border-none text-caption font-label-bold focus:ring-0 p-0 cursor-pointer"
                value={dentistFilter}
                onChange={(event) => setDentistFilter(event.target.value)}
              >
                <option value="all">All Dentists</option>
                {dentists.map((dentist) => (
                  <option key={dentist.dentist_id} value={dentist.dentist_id}>
                    {fullName(dentist)}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors border border-outline-variant/30"
              onClick={loadData}
              title="Refresh"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-md rounded-xl border border-error-container bg-error-container/60 px-4 py-3 text-error text-label-bold">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-md rounded-xl border border-[#ceead6] bg-[#e6f4ea] px-4 py-3 text-[#137333] text-label-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden border border-outline-variant/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Patient Name</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Dentist</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Treatment Type</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Date & Time</th>
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
                    const dentistName = fullName(appointment.Dentist);
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
                          <p className="font-label-bold text-on-surface">{dentistName}</p>
                          <p className="text-caption text-on-surface-variant">{appointment.Dentist?.specialization || 'Dentist'}</p>
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
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-label-bold ${badgeClass}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-gutter py-md text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="View"
                              onClick={() => setViewAppointment(appointment)}
                            >
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                            <button
                              className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="Edit"
                              onClick={() => openEdit(appointment)}
                              disabled={appointment.status === 'Cancelled'}
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                              title="Cancel"
                              onClick={() => handleCancel(appointment.appointment_id)}
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
              Showing <span className="font-label-bold text-on-surface">{filteredAppointments.length}</span> of{' '}
              <span className="font-label-bold text-on-surface">{appointments.length}</span> appointments
            </p>
          </div>
        </div>
      </main>

      <div
        className={`fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          quickAddOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => {
          setQuickAddOpen(false);
          setEditingId(null);
          setForm(emptyForm);
        }}
      >
        <form
          className={`fixed right-0 top-0 h-screen w-full max-w-md bg-surface-container-lowest shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
            quickAddOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(event) => event.stopPropagation()}
          onSubmit={handleSubmit}
        >
          <div className="p-gutter flex items-center justify-between border-b border-outline-variant/30">
            <h3 className="text-headline-md font-headline-md text-primary">{editingId ? 'Edit Appointment' : 'New Appointment'}</h3>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-all" type="button" onClick={() => {
              setQuickAddOpen(false);
              setEditingId(null);
              setForm(emptyForm);
            }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-gutter space-y-md">
            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Patient</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                value={form.patient_id}
                onChange={(event) => setForm((prev) => ({ ...prev, patient_id: event.target.value }))}
                required
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.patient_id} value={patient.patient_id}>{fullName(patient)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Select Dentist</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                value={form.dentist_id}
                onChange={(event) => setForm((prev) => ({ ...prev, dentist_id: event.target.value }))}
                required
              >
                <option value="">Select dentist</option>
                {dentists.map((dentist) => (
                  <option key={dentist.dentist_id} value={dentist.dentist_id}>
                    {fullName(dentist)}{dentist.specialization ? ` (${dentist.specialization})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Treatment Type</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                value={form.treatment_id}
                onChange={(event) => setForm((prev) => ({ ...prev, treatment_id: event.target.value }))}
                required
              >
                <option value="">Select treatment</option>
                {treatments.map((treatment) => (
                  <option key={treatment.treatment_id} value={treatment.treatment_id}>
                    {treatment.treatment_name} - {formatDuration(treatment.average_duration)}
                  </option>
                ))}
              </select>
              {selectedTreatment?.average_duration && (
                <p className="text-caption text-on-surface-variant">
                  Duration: {formatDuration(selectedTreatment.average_duration)}
                </p>
              )}
            </div>

            <div className="space-y-unit">
              <div className="flex items-center justify-between gap-3">
                <label className="font-label-bold text-on-surface-variant text-caption">Date</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant"
                    title="Previous month"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <span className="text-caption font-label-bold text-on-surface min-w-28 text-center">
                    {visibleMonthLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant"
                    title="Next month"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-caption">
                {weekDays.map((day) => (
                  <span
                    key={day}
                    className={`py-1 font-label-bold ${day === 'Sun' ? 'text-error' : 'text-on-surface-variant'}`}
                  >
                    {day}
                  </span>
                ))}
                {calendarDays.map((date, index) => {
                  if (!date) return <span key={`empty-${index}`} className="h-9" />;

                  const dateString = toDateString(date);
                  const isSelected = form.appointment_date === dateString;
                  const isPast = dateString < getTodayDateString();
                  const isSunday = date.getDay() === 0;
                  const disabled = isPast || isSunday;

                  return (
                    <button
                      key={dateString}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setError('');
                        setForm((prev) => ({ ...prev, appointment_date: dateString, appointment_time: '' }));
                      }}
                      className={`h-9 rounded-lg font-label-bold transition-colors ${
                        isSelected
                          ? 'bg-primary text-on-primary'
                          : isSunday
                            ? 'bg-error-container/30 text-error'
                            : 'text-on-surface hover:bg-primary/10'
                      } ${disabled ? 'opacity-60 cursor-not-allowed hover:bg-error-container/30' : ''}`}
                      title={isSunday ? 'Clinic is closed on Sundays' : dateString}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Time</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                value={form.appointment_time}
                onChange={(event) => setForm((prev) => ({ ...prev, appointment_time: event.target.value }))}
                disabled={!form.appointment_date || !form.dentist_id || !form.treatment_id || slotsLoading || availableSlots.length === 0}
                required
              >
                <option value="">
                  {slotsLoading ? 'Checking available times...' : 'Select time'}
                </option>
                {availableSlots.map((slot) => (
                  <option key={slot.time} value={slot.time} disabled={!slot.available} title={slot.reason || ''}>
                    {formatTime(slot.time)}{slot.available ? '' : ` - ${slot.reason || 'Unavailable'}`}
                  </option>
                ))}
              </select>
              {form.appointment_date && !slotsLoading && availableSlots.length > 0 && !availableSlots.some((slot) => slot.available) && (
                <p className="text-caption text-error">
                  No available times for this dentist on the selected date.
                </p>
              )}
              <p className="text-caption text-on-surface-variant">
                Clinic hours: 08:00-20:00, every 30 minutes. Selected treatment duration: {formatDuration(selectedTreatment?.average_duration)}.
              </p>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Reason for Visit / Notes</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base resize-none"
                placeholder="Any specific concerns or medical notes..."
                rows="4"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </div>

            {editingId && (
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Status</label>
                <select
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option>Scheduled</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                  <option>No-Show</option>
                </select>
              </div>
            )}

            <div className="bg-surface-container p-md rounded-2xl">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">info</span>
                <p className="text-caption text-on-surface-variant">
                  Appointment duration is calculated from the selected treatment.
                </p>
              </div>
            </div>
          </div>

          <div className="p-gutter border-t border-outline-variant/30 flex gap-md">
            <button
              className="flex-1 py-3 border border-outline-variant text-on-surface-variant rounded-xl font-label-bold hover:bg-surface-container-low transition-colors"
              type="button"
              onClick={() => {
                setQuickAddOpen(false);
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-label-bold hover:bg-on-primary-fixed-variant transition-all shadow-md active:scale-95 disabled:opacity-60"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>

      {viewAppointment && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewAppointment(null)}>
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="p-gutter flex items-center justify-between border-b border-outline-variant/30">
              <h3 className="text-headline-md font-headline-md text-primary">Appointment Details</h3>
              <button className="p-2 hover:bg-surface-container-high rounded-full transition-all" type="button" onClick={() => setViewAppointment(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-gutter grid grid-cols-1 sm:grid-cols-2 gap-md">
              {[
                ['Patient', fullName(viewAppointment.Patient)],
                ['Dentist', fullName(viewAppointment.Dentist)],
                ['Treatment', viewAppointment.Treatment?.treatment_name || `Treatment #${viewAppointment.treatment_id}`],
                ['Date', formatDate(viewAppointment.appointment_date)],
                ['Time', formatTime(viewAppointment.appointment_time)],
                ['Status', viewAppointment.status],
                ['Notes', viewAppointment.notes || '-'],
              ].map(([label, value]) => (
                <div key={label} className={label === 'Notes' ? 'sm:col-span-2' : ''}>
                  <p className="text-caption font-label-bold text-on-surface-variant uppercase">{label}</p>
                  <p className="text-body-base text-on-surface mt-1">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentsManagement;
