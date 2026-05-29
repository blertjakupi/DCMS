import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import DentistSidebar from '../components/DentistSidebar';
import HeaderActions from '../components/HeaderActions';
import { authFetch } from '../utils/authFetch';

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone_number: '',
  birth_date: '',
  address: '',
  allergies: '',
};



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

function PatientsManagement() {
  const location = useLocation();
  const SidebarComponent = location.pathname.startsWith('/dentist') ? DentistSidebar : AdminSidebar;
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [viewPatient, setViewPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [patientsRes, appointmentsRes] = await Promise.all([
        authFetch('/api/patients'),
        authFetch('/api/appointments'),
      ]);

      const [patientsJson, appointmentsJson] = await Promise.all([
        patientsRes.json(),
        appointmentsRes.json(),
      ]);

      if (!patientsRes.ok) throw new Error(patientsJson.message || 'Could not load patients.');
      if (!appointmentsRes.ok) throw new Error(appointmentsJson.message || 'Could not load appointments.');

      setPatients(patientsJson.data || []);
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
        setViewPatient(null);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

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
      const email = (patient.email || patient.User?.email || '').toLowerCase();
      const phone = patient.phone || patient.User?.phone_number || '';
      const matchesSearch =
        !query ||
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        String(patient.patient_id).includes(query);
      const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [patients, search, statusFilter]);

  const stats = useMemo(() => {
    const active = patients.filter((patient) => patient.status === 'Active').length;
    const pendingRecords = patients.filter((patient) => !patient.allergies).length;

    return {
      total: patients.length,
      active,
      inactive: patients.length - active,
      pendingRecords,
    };
  }, [patients]);

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setQuickAddOpen(true);
  };

  const openEdit = (patient) => {
    setEditingId(patient.patient_id);
    setForm({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      email: patient.email || patient.User?.email || '',
      password: '',
      phone_number: patient.phone || patient.User?.phone_number || '',
      birth_date: patient.birth_date || '',
      address: patient.address || '',
      allergies: patient.allergies || '',
    });
    setQuickAddOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await authFetch(editingId ? `/api/patients/${editingId}` : '/api/patients', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...form,
          phone: form.phone_number,
          status: 'Active',
          ...(editingId ? { password: undefined } : {}),
        }),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Patient could not be created.');

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

  const handleDelete = async (patientId) => {
    if (!window.confirm('Deactivate this patient?')) return;

    try {
      const response = await authFetch(`/api/patients/${patientId}`, {
        method: 'DELETE',
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Patient could not be deactivated.');

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
              placeholder="Search patients, doctors, or records..."
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
              <span className="text-primary font-bold">Patients</span>
            </nav>
            <h2 className="text-headline-lg font-headline-lg text-on-surface">Patients Management</h2>
          </div>
          <button
            className="bg-primary text-on-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-label-bold shadow-lg hover:bg-on-primary-fixed-variant transition-all active:scale-[0.98]"
            onClick={openCreate}
          >
            <span className="material-symbols-outlined">person_add</span>
            Add New Patient
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
          {[
            ['group', 'Total Patients', stats.total, 'bg-primary/10 text-primary'],
            ['check_circle', 'Active Patients', stats.active, 'bg-green-100 text-green-600'],
            ['person_off', 'Inactive Patients', stats.inactive, 'bg-blue-100 text-blue-600'],
            ['folder_open', 'Pending Records', stats.pendingRecords, 'bg-orange-100 text-orange-600'],
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
          <div className="flex items-center gap-xs">
            {[
              ['all', 'All'],
              ['Active', 'Active'],
              ['Inactive', 'Inactive'],
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
                    const patientAppointments = appointmentSummary[patient.patient_id] || {};
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
                          <p className="text-caption text-on-surface font-label-bold">{patient.email || patient.User?.email || '-'}</p>
                          <p className="text-caption text-on-surface-variant">{patient.phone || patient.User?.phone_number || '-'}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="text-caption text-on-surface">{formatDate(patientAppointments.lastVisit)}</p>
                        </td>
                        <td className="px-gutter py-md">
                          {patientAppointments.nextAppointment ? (
                            <p className="text-caption text-on-surface">{formatDate(patientAppointments.nextAppointment)}</p>
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
                              title="View"
                              onClick={() => setViewPatient(patient)}
                            >
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                            <button
                              className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="Edit"
                              onClick={() => openEdit(patient)}
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                              title="Deactivate"
                              onClick={() => handleDelete(patient.patient_id)}
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
              Showing <span className="font-label-bold text-on-surface">{filteredPatients.length}</span> of{' '}
              <span className="font-label-bold text-on-surface">{patients.length}</span> patients
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
            <h3 className="text-headline-md font-headline-md text-primary">{editingId ? 'Edit Patient' : 'New Patient'}</h3>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-all" type="button" onClick={() => {
              setQuickAddOpen(false);
              setEditingId(null);
              setForm(emptyForm);
            }}>
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
              <label className="font-label-bold text-on-surface-variant text-caption">Date of Birth</label>
              <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" type="date" value={form.birth_date} onChange={(event) => updateForm('birth_date', event.target.value)} />
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Phone Number</label>
              <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" placeholder="+383 44 000 000" type="tel" value={form.phone_number} onChange={(event) => updateForm('phone_number', event.target.value)} />
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Email Address</label>
              <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" placeholder="email@example.com" type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} required />
            </div>

            {!editingId && (
            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Temporary Password</label>
              <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" placeholder="At least 8 characters" type="password" value={form.password} onChange={(event) => updateForm('password', event.target.value)} minLength="8" required />
            </div>
            )}

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Address</label>
              <textarea className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base resize-none" placeholder="Street address, city..." rows="3" value={form.address} onChange={(event) => updateForm('address', event.target.value)} />
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Medical Notes / Allergies</label>
              <textarea className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base resize-none" placeholder="Known allergies or important notes..." rows="3" value={form.allergies} onChange={(event) => updateForm('allergies', event.target.value)} />
            </div>

            <div className="bg-surface-container p-md rounded-2xl">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">info</span>
                <p className="text-caption text-on-surface-variant">
                  A patient account is created together with the clinical profile.
                </p>
              </div>
            </div>
          </div>

          <div className="p-gutter border-t border-outline-variant/30 flex gap-md">
            <button className="flex-1 py-3 border border-outline-variant text-on-surface-variant rounded-xl font-label-bold hover:bg-surface-container-low transition-colors" type="button" onClick={() => {
              setQuickAddOpen(false);
              setEditingId(null);
              setForm(emptyForm);
            }}>
              Cancel
            </button>
            <button className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-label-bold hover:bg-on-primary-fixed-variant transition-all shadow-md active:scale-95 disabled:opacity-60" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>

      {viewPatient && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewPatient(null)}>
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="p-gutter flex items-center justify-between border-b border-outline-variant/30">
              <h3 className="text-headline-md font-headline-md text-primary">Patient Details</h3>
              <button className="p-2 hover:bg-surface-container-high rounded-full transition-all" type="button" onClick={() => setViewPatient(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-gutter grid grid-cols-1 sm:grid-cols-2 gap-md">
              {[
                ['Name', fullName(viewPatient)],
                ['Email', viewPatient.email || viewPatient.User?.email || '-'],
                ['Phone', viewPatient.phone || viewPatient.User?.phone_number || '-'],
                ['Birth Date', formatDate(viewPatient.birth_date)],
                ['Status', viewPatient.status || '-'],
                ['Address', viewPatient.address || '-'],
                ['Allergies / Notes', viewPatient.allergies || '-'],
              ].map(([label, value]) => (
                <div key={label} className={label === 'Allergies / Notes' || label === 'Address' ? 'sm:col-span-2' : ''}>
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

export default PatientsManagement;
