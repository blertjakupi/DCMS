import { useEffect, useState, useMemo } from 'react';
import DentistSidebar from '../components/DentistSidebar';

const emptyForm = {
  patient_id: '',
  dentist_id: '',
  appointment_id: '',
  record_date: '',
  tooth: '',
  condition: '',
  notes: '',
};

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

const fullName = (patient) =>
  [patient?.first_name, patient?.last_name].filter(Boolean).join(' ') || 'Unknown';

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

function PatientsView() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dentistId, setDentistId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [dentists, setDentists] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = user?.full_name ? initials(user.full_name) : 'AD';

  
  useEffect(() => {
    fetch('/api/dentists/me', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => {
        setDentistId(data.dentist_id);
        setForm(prev => ({ ...prev, dentist_id: data.dentist_id }));
      })
      .catch(err => console.error(err));
    fetch('/api/dentists', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setDentists(data.data || []))
      .catch(err => console.error(err));
  }, []);

  
  useEffect(() => {
    if (!dentistId) return;
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        
        const patientsRes = await fetch(`/api/dentists/${dentistId}/patients`, { headers: authHeaders() });
        if (!patientsRes.ok) throw new Error('Could not load patients');
        const patientsJson = await patientsRes.json();
        setPatients(patientsJson.data || []);

        
        const appointmentsRes = await fetch(`/api/appointments/dentist/${dentistId}`, { headers: authHeaders() });
        if (!appointmentsRes.ok) throw new Error('Could not load appointments');
        const appointmentsJson = await appointmentsRes.json();
        setAppointments(appointmentsJson.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dentistId, refreshTrigger]);

  
  useEffect(() => {
    if (!form.patient_id) {
      setPatientAppointments([]);
      return;
    }
    fetch(`/api/appointments/patient/${form.patient_id}`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setPatientAppointments(data.data || []))
      .catch(err => console.error(err));
  }, [form.patient_id]);

  const appointmentSummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const summary = {};
    appointments.forEach((appointment) => {
      const patientId = appointment.patient_id;
      if (!summary[patientId]) summary[patientId] = { lastVisit: null, nextAppointment: null };
      if (appointment.appointment_date < today) {
        if (!summary[patientId].lastVisit || appointment.appointment_date > summary[patientId].lastVisit) {
          summary[patientId].lastVisit = appointment.appointment_date;
        }
      }
      if (appointment.appointment_date >= today && appointment.status !== 'Cancelled') {
        if (!summary[patientId].nextAppointment || appointment.appointment_date < summary[patientId].nextAppointment) {
          summary[patientId].nextAppointment = appointment.appointment_date;
        }
      }
    });
    return summary;
  }, [appointments]);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    return patients.filter((patient) => {
      const name = fullName(patient).toLowerCase();
      const email = (patient.email || '').toLowerCase();
      const phone = (patient.phone || '').toLowerCase();
      const matchesSearch = !query || name.includes(query) || email.includes(query) || phone.includes(query) || String(patient.patient_id).includes(query);
      const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [patients, search, statusFilter]);

  const stats = useMemo(() => {
    const active = patients.filter((p) => p.status === 'Active').length;
    return { total: patients.length, active, inactive: patients.length - active };
  }, [patients]);

  const openCreateForPatient = (patientId) => {
    setEditingId(null);
    setForm({
      patient_id: patientId,
      dentist_id: dentistId || '',
      appointment_id: '',
      record_date: new Date().toISOString().slice(0, 10),
      tooth: '',
      condition: '',
      notes: '',
    });
    setQuickAddOpen(true);
  };

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, appointment_id: form.appointment_id || null };
      const url = editingId ? `/api/dental-records/${editingId}` : '/api/dental-records';
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Could not save record');
      setQuickAddOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      // Refresh the data after saving
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
              placeholder="Search patients..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              <span>Dentist</span>
              <span>/</span>
              <span className="text-primary font-bold">Patients</span>
            </nav>
            <h2 className="text-headline-lg font-headline-lg text-on-surface">My Patients</h2>
            <p className="text-body-base text-on-surface-variant mt-1">Patients who have had appointments with you</p>
          </div>
          <button
            className="bg-primary text-on-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-label-bold shadow-lg hover:bg-on-primary-fixed-variant transition-all active:scale-[0.98]"
            onClick={refreshData}
          >
            <span className="material-symbols-outlined">refresh</span>
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md mb-lg">
          <div className="bg-surface-container-lowest p-md rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-outline-variant/10 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[32px]">groups</span>
            </div>
            <div>
              <p className="text-caption text-on-surface-variant font-label-bold uppercase">Total Patients</p>
              <p className="text-headline-md font-bold">{stats.total}</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-md rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-outline-variant/10 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100 text-green-600">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <div>
              <p className="text-caption text-on-surface-variant font-label-bold uppercase">Active</p>
              <p className="text-headline-md font-bold">{stats.active}</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-md rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-outline-variant/10 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <span className="material-symbols-outlined text-[32px]">person_off</span>
            </div>
            <div>
              <p className="text-caption text-on-surface-variant font-label-bold uppercase">Inactive</p>
              <p className="text-headline-md font-bold">{stats.inactive}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-lg flex flex-wrap items-center justify-between gap-md">
          <div className="flex items-center gap-xs">
            {[
              ['all', 'All'],
              ['Active', 'Active'],
              ['Inactive', 'Inactive'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`px-md py-2 rounded-full font-label-bold text-caption transition-colors ${
                  statusFilter === value ? 'bg-primary-container text-on-primary-container' : 'hover:bg-surface-container text-on-surface-variant'
                }`}
                onClick={() => setStatusFilter(value)}
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
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Patient Name</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Contact Info</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Last Visit</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Next Appointment</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {loading ? (
                  <tr>
                    <td className="px-gutter py-lg text-on-surface-variant" colSpan="6">Loading patients...</td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td className="px-gutter py-lg text-on-surface-variant" colSpan="6">No patients found.</td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => {
                    const name = fullName(patient);
                    const patientAppointmentsSummary = appointmentSummary[patient.patient_id] || {};
                    const isActive = patient.status === 'Active';
                    return (
                      <tr key={patient.patient_id} className="hover:bg-surface-container-low/60 transition-colors group">
                        <td className="px-gutter py-md">
                          <div className="flex items-center gap-sm">
                            <div className="h-10 w-10 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary font-bold text-caption">
                              {initials(name)}
                            </div>
                            <div>
                              <p className="font-label-bold text-on-surface">{name}</p>
                              <p className="text-caption text-on-surface-variant">#P-{patient.patient_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="text-caption text-on-surface font-label-bold">{patient.email || '-'}</p>
                          <p className="text-caption text-on-surface-variant">{patient.phone || '-'}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="text-caption text-on-surface">{formatDate(patientAppointmentsSummary.lastVisit)}</p>
                        </td>
                        <td className="px-gutter py-md">
                          {patientAppointmentsSummary.nextAppointment ? (
                            <p className="text-caption text-on-surface">{formatDate(patientAppointmentsSummary.nextAppointment)}</p>
                          ) : (
                            <p className="text-caption text-on-surface-variant italic">Not scheduled</p>
                          )}
                        </td>
                        <td className="px-gutter py-md">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-label-bold ${
                            isActive ? 'bg-green-100 text-green-700' : 'bg-outline-variant/20 text-on-surface-variant'
                          }`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                            {patient.status || 'Inactive'}
                          </span>
                        </td>
                        <td className="px-gutter py-md text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="Create Dental Record"
                              onClick={() => openCreateForPatient(patient.patient_id)}
                            >
                              <span className="material-symbols-outlined text-[20px]">edit_note</span>
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
              Showing <span className="font-label-bold text-on-surface">{filteredPatients.length}</span> of{' '}
              <span className="font-label-bold text-on-surface">{patients.length}</span> patients
            </p>
          </div>
        </div>
      </main>

      {}
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
            <h3 className="text-headline-md font-headline-md text-primary">{editingId ? 'Edit Dental Record' : 'New Dental Record'}</h3>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-all" type="button" onClick={() => setQuickAddOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-gutter space-y-md">
            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Patient</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                value={form.patient_id}
                onChange={(event) => updateForm('patient_id', event.target.value)}
                required
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.patient_id} value={patient.patient_id}>{fullName(patient)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Dentist</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                value={form.dentist_id}
                disabled
              >
                {dentists.map((dentist) => (
                  <option key={dentist.dentist_id} value={dentist.dentist_id}>{fullName(dentist)}</option>
                ))}
              </select>
              <p className="text-caption text-on-surface-variant mt-1">Your dentist ID is automatically assigned.</p>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Record Date</label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  type="date"
                  value={form.record_date}
                  onChange={(event) => updateForm('record_date', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Tooth</label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  placeholder="e.g. 16, 24"
                  type="text"
                  value={form.tooth}
                  onChange={(event) => updateForm('tooth', event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Related Appointment</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                value={form.appointment_id}
                onChange={(event) => updateForm('appointment_id', event.target.value)}
              >
                <option value="">No appointment</option>
                {patientAppointments.map((appointment) => (
                  <option key={appointment.appointment_id} value={appointment.appointment_id}>
                    #{appointment.appointment_id} - {formatDate(appointment.appointment_date)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Condition / Diagnosis</label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                placeholder="Cavity, sensitivity, crown follow-up..."
                type="text"
                value={form.condition}
                onChange={(event) => updateForm('condition', event.target.value)}
              />
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Clinical Notes</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base resize-none"
                placeholder="Findings, observations, prescribed follow-up..."
                rows="5"
                value={form.notes}
                onChange={(event) => updateForm('notes', event.target.value)}
              />
            </div>
          </div>

          <div className="p-gutter border-t border-outline-variant/30 flex gap-md">
            <button className="flex-1 py-3 border border-outline-variant text-on-surface-variant rounded-xl font-label-bold hover:bg-surface-container-low transition-colors" type="button" onClick={() => setQuickAddOpen(false)}>Cancel</button>
            <button className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-label-bold hover:bg-on-primary-fixed-variant transition-all shadow-md active:scale-95 disabled:opacity-60" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PatientsView;