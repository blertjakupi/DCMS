import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import DentistSidebar from '../components/DentistSidebar';
import HeaderActions from '../components/HeaderActions';

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

const fullName = (item) => [item?.first_name, item?.last_name].filter(Boolean).join(' ') || 'Unknown';

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

function DentalRecordsManagement() {
  const location = useLocation();
  const SidebarComponent = location.pathname.startsWith('/dentist') ? DentistSidebar : AdminSidebar;
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [dentistFilter, setDentistFilter] = useState('all');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [recordsRes, patientsRes, dentistsRes, appointmentsRes] = await Promise.all([
        fetch('/api/dental-records', { headers: authHeaders() }),
        fetch('/api/patients', { headers: authHeaders() }),
        fetch('/api/dentists', { headers: authHeaders() }),
        fetch('/api/appointments', { headers: authHeaders() }),
      ]);

      const [recordsJson, patientsJson, dentistsJson, appointmentsJson] = await Promise.all([
        recordsRes.json(),
        patientsRes.json(),
        dentistsRes.json(),
        appointmentsRes.json(),
      ]);

      if (!recordsRes.ok) throw new Error(recordsJson.message || 'Could not load dental records.');
      if (!patientsRes.ok) throw new Error(patientsJson.message || 'Could not load patients.');
      if (!dentistsRes.ok) throw new Error(dentistsJson.message || 'Could not load dentists.');
      if (!appointmentsRes.ok) throw new Error(appointmentsJson.message || 'Could not load appointments.');

      setRecords(recordsJson.data || []);
      setPatients(patientsJson.data || []);
      setDentists(dentistsJson.data || []);
      setAppointments(appointmentsJson.data || []);
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
        setViewRecord(null);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const stats = useMemo(() => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);
    const recentKey = recentDate.toISOString().slice(0, 10);
    const patientIds = new Set(records.map((record) => record.patient_id));

    return {
      total: records.length,
      recent: records.filter((record) => record.record_date >= recentKey).length,
      activePatients: patientIds.size,
      linkedAppointments: records.filter((record) => record.appointment_id).length,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const patientName = fullName(record.Patient).toLowerCase();
      const dentistName = fullName(record.Dentist).toLowerCase();
      const matchesSearch =
        !query ||
        patientName.includes(query) ||
        dentistName.includes(query) ||
        (record.condition || '').toLowerCase().includes(query) ||
        (record.tooth || '').toLowerCase().includes(query) ||
        String(record.record_id).includes(query);
      const matchesDentist = dentistFilter === 'all' || String(record.dentist_id) === String(dentistFilter);

      return matchesSearch && matchesDentist;
    });
  }, [records, search, dentistFilter]);

  const selectedPatientAppointments = appointments.filter(
    (appointment) => String(appointment.patient_id) === String(form.patient_id)
  );

  const updateForm = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setQuickAddOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.record_id);
    setForm({
      patient_id: record.patient_id || '',
      dentist_id: record.dentist_id || '',
      appointment_id: record.appointment_id || '',
      record_date: record.record_date || '',
      tooth: record.tooth || '',
      condition: record.condition || '',
      notes: record.notes || '',
    });
    setQuickAddOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(editingId ? `/api/dental-records/${editingId}` : '/api/dental-records', {
        method: editingId ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ...form, appointment_id: form.appointment_id || null }),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Dental record could not be saved.');

      setForm(emptyForm);
      setEditingId(null);
      setQuickAddOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Delete this dental record?')) return;

    try {
      const response = await fetch(`/api/dental-records/${recordId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Dental record could not be deleted.');

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
              placeholder="Search patients, dentists, records, or tooth..."
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
              <span className="text-primary font-bold">Dental Records</span>
            </nav>
            <h2 className="text-headline-lg font-headline-lg text-on-surface">Dental Records Management</h2>
          </div>
          <button
            className="bg-primary text-on-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-label-bold shadow-lg hover:bg-on-primary-fixed-variant transition-all active:scale-[0.98]"
            onClick={openCreate}
          >
            <span className="material-symbols-outlined">note_add</span>
            New Record
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
          {[
            ['folder_shared', 'Total Records', stats.total, 'bg-primary/10 text-primary'],
            ['history', 'Recent Records', stats.recent, 'bg-blue-100 text-blue-600'],
            ['groups', 'Active Patient Records', stats.activePatients, 'bg-green-100 text-green-700'],
            ['event_available', 'Linked Appointments', stats.linkedAppointments, 'bg-orange-100 text-orange-600'],
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
          <div className="flex items-center gap-2 bg-surface-container-low px-md py-2 rounded-lg border border-outline-variant/30">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">medical_information</span>
            <select className="bg-transparent border-none text-caption font-label-bold focus:ring-0 p-0 cursor-pointer" value={dentistFilter} onChange={(event) => setDentistFilter(event.target.value)}>
              <option value="all">All Dentists</option>
              {dentists.map((dentist) => (
                <option key={dentist.dentist_id} value={dentist.dentist_id}>{fullName(dentist)}</option>
              ))}
            </select>
          </div>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors border border-outline-variant/30" onClick={loadData} title="Refresh">
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
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Patient</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Dentist</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Tooth</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Condition</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Record Date</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {loading ? (
                  <tr>
                    <td className="px-gutter py-lg text-on-surface-variant" colSpan="6">Loading dental records...</td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td className="px-gutter py-lg text-on-surface-variant" colSpan="6">No dental records found.</td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const patientName = fullName(record.Patient);
                    const dentistName = fullName(record.Dentist);

                    return (
                      <tr key={record.record_id} className="hover:bg-surface-container-low/60 transition-colors group">
                        <td className="px-gutter py-md">
                          <div className="flex items-center gap-sm">
                            <div className="h-10 w-10 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary font-bold text-caption">
                              {initials(patientName)}
                            </div>
                            <div>
                              <p className="font-label-bold text-on-surface">{patientName}</p>
                              <p className="text-caption text-on-surface-variant">#P-{record.patient_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="font-label-bold text-on-surface">{dentistName}</p>
                          <p className="text-caption text-on-surface-variant">#{record.dentist_id}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <span className="px-3 py-1 bg-surface-container text-on-surface text-caption rounded-lg border border-outline-variant/30">
                            {record.tooth || 'General'}
                          </span>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="text-caption text-on-surface max-w-[220px] truncate">{record.condition || '-'}</p>
                          <p className="text-caption text-on-surface-variant max-w-[260px] truncate">{record.notes || 'No notes'}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="font-label-bold text-on-surface">{formatDate(record.record_date)}</p>
                          <p className="text-caption text-on-surface-variant">{record.appointment_id ? `Appointment #${record.appointment_id}` : 'No appointment'}</p>
                        </td>
                        <td className="px-gutter py-md text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="View" onClick={() => setViewRecord(record)}>
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                            <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Edit" onClick={() => openEdit(record)}>
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all" title="Delete" onClick={() => handleDelete(record.record_id)}>
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
              Showing <span className="font-label-bold text-on-surface">{filteredRecords.length}</span> of <span className="font-label-bold text-on-surface">{records.length}</span> records
            </p>
          </div>
        </div>
      </main>

      <div className={`fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${quickAddOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setQuickAddOpen(false)}>
        <form className={`fixed right-0 top-0 h-screen w-full max-w-md bg-surface-container-lowest shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${quickAddOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
          <div className="p-gutter flex items-center justify-between border-b border-outline-variant/30">
            <h3 className="text-headline-md font-headline-md text-primary">{editingId ? 'Edit Dental Record' : 'New Dental Record'}</h3>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-all" type="button" onClick={() => setQuickAddOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-gutter space-y-md">
            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Patient</label>
              <select className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" value={form.patient_id} onChange={(event) => updateForm('patient_id', event.target.value)} required>
                <option value="">Select patient</option>
                {patients.map((patient) => <option key={patient.patient_id} value={patient.patient_id}>{fullName(patient)}</option>)}
              </select>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Dentist</label>
              <select className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" value={form.dentist_id} onChange={(event) => updateForm('dentist_id', event.target.value)} required>
                <option value="">Select dentist</option>
                {dentists.map((dentist) => <option key={dentist.dentist_id} value={dentist.dentist_id}>{fullName(dentist)}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Record Date</label>
                <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" type="date" value={form.record_date} onChange={(event) => updateForm('record_date', event.target.value)} required />
              </div>
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Tooth</label>
                <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" placeholder="e.g. 16, 24" type="text" value={form.tooth} onChange={(event) => updateForm('tooth', event.target.value)} />
              </div>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Related Appointment</label>
              <select className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" value={form.appointment_id} onChange={(event) => updateForm('appointment_id', event.target.value)}>
                <option value="">No appointment</option>
                {selectedPatientAppointments.map((appointment) => (
                  <option key={appointment.appointment_id} value={appointment.appointment_id}>#{appointment.appointment_id} - {formatDate(appointment.appointment_date)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Condition / Diagnosis</label>
              <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" placeholder="Cavity, sensitivity, crown follow-up..." type="text" value={form.condition} onChange={(event) => updateForm('condition', event.target.value)} />
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Clinical Notes</label>
              <textarea className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base resize-none" placeholder="Findings, observations, prescribed follow-up..." rows="5" value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} />
            </div>
          </div>

          <div className="p-gutter border-t border-outline-variant/30 flex gap-md">
            <button className="flex-1 py-3 border border-outline-variant text-on-surface-variant rounded-xl font-label-bold hover:bg-surface-container-low transition-colors" type="button" onClick={() => setQuickAddOpen(false)}>Cancel</button>
            <button className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-label-bold hover:bg-on-primary-fixed-variant transition-all shadow-md active:scale-95 disabled:opacity-60" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Record'}</button>
          </div>
        </form>
      </div>

      {viewRecord && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewRecord(null)}>
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/20 w-full max-w-xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="p-gutter flex items-center justify-between border-b border-outline-variant/30">
              <div>
                <p className="text-caption text-on-surface-variant font-label-bold uppercase">Dental Record</p>
                <h3 className="text-headline-md font-headline-md text-primary">#{viewRecord.record_id}</h3>
              </div>
              <button className="p-2 hover:bg-surface-container-high rounded-full transition-all" type="button" onClick={() => setViewRecord(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-gutter space-y-md">
              <div className="grid grid-cols-2 gap-md">
                <div><p className="text-caption text-on-surface-variant font-label-bold uppercase">Patient</p><p className="font-label-bold text-on-surface">{fullName(viewRecord.Patient)}</p></div>
                <div><p className="text-caption text-on-surface-variant font-label-bold uppercase">Dentist</p><p className="font-label-bold text-on-surface">{fullName(viewRecord.Dentist)}</p></div>
                <div><p className="text-caption text-on-surface-variant font-label-bold uppercase">Date</p><p className="font-label-bold text-on-surface">{formatDate(viewRecord.record_date)}</p></div>
                <div><p className="text-caption text-on-surface-variant font-label-bold uppercase">Tooth</p><p className="font-label-bold text-on-surface">{viewRecord.tooth || 'General'}</p></div>
              </div>
              <div><p className="text-caption text-on-surface-variant font-label-bold uppercase mb-1">Condition</p><p className="text-on-surface">{viewRecord.condition || '-'}</p></div>
              <div><p className="text-caption text-on-surface-variant font-label-bold uppercase mb-1">Notes</p><p className="text-on-surface whitespace-pre-wrap">{viewRecord.notes || 'No notes recorded.'}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DentalRecordsManagement;
