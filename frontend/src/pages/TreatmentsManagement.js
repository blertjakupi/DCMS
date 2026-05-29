import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import DentistSidebar from '../components/DentistSidebar';
import HeaderActions from '../components/HeaderActions';

const emptyForm = {
  treatment_name: '',
  description: '',
  price: '',
  average_duration: '',
};

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

const fullName = (item) => [item?.first_name, item?.last_name].filter(Boolean).join(' ') || 'Unknown';

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const patientTreatmentStatus = (entry) => {
  const appointmentStatus = entry.Appointment?.status;
  if (appointmentStatus === 'Completed') return 'Completed';
  if (appointmentStatus === 'Cancelled') return 'Cancelled';
  if (entry.treatment_date && entry.treatment_date <= new Date().toISOString().slice(0, 10)) return 'Ongoing';
  return 'Scheduled';
};

const statusClasses = {
  Active: 'bg-green-100 text-green-700',
  Scheduled: 'bg-blue-100 text-blue-700',
  Ongoing: 'bg-orange-100 text-orange-600',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-error-container text-on-error-container',
};

function TreatmentsManagement() {
  const location = useLocation();
  const SidebarComponent = location.pathname.startsWith('/dentist') ? DentistSidebar : AdminSidebar;
  const [treatments, setTreatments] = useState([]);
  const [patientTreatments, setPatientTreatments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [treatmentsRes, patientTreatmentsRes] = await Promise.all([
        fetch('/api/treatments', { headers: authHeaders() }),
        fetch('/api/patient-treatments', { headers: authHeaders() }),
      ]);

      const [treatmentsJson, patientTreatmentsJson] = await Promise.all([
        treatmentsRes.json(),
        patientTreatmentsRes.json(),
      ]);

      if (!treatmentsRes.ok) throw new Error(treatmentsJson.message || 'Could not load treatments.');
      if (!patientTreatmentsRes.ok) throw new Error(patientTreatmentsJson.message || 'Could not load patient treatments.');

      setTreatments(treatmentsJson.data || []);
      setPatientTreatments(patientTreatmentsJson.data || []);
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

  const treatmentUsage = useMemo(() => {
    const usage = {};
    patientTreatments.forEach((entry) => {
      const treatmentId = entry.treatment_id;
      if (!usage[treatmentId]) {
        usage[treatmentId] = {
          total: 0,
          scheduled: 0,
          ongoing: 0,
          completed: 0,
          latest: null,
          patient: null,
          dentist: null,
        };
      }

      const status = patientTreatmentStatus(entry);
      usage[treatmentId].total += 1;
      if (status === 'Scheduled') usage[treatmentId].scheduled += 1;
      if (status === 'Ongoing') usage[treatmentId].ongoing += 1;
      if (status === 'Completed') usage[treatmentId].completed += 1;
      if (!usage[treatmentId].latest || entry.treatment_date > usage[treatmentId].latest) {
        usage[treatmentId].latest = entry.treatment_date;
        usage[treatmentId].patient = entry.Patient;
        usage[treatmentId].dentist = entry.Dentist;
      }
    });
    return usage;
  }, [patientTreatments]);

  const stats = useMemo(() => {
    const usageValues = Object.values(treatmentUsage);
    return {
      total: treatments.length,
      scheduled: usageValues.reduce((sum, item) => sum + item.scheduled, 0),
      ongoing: usageValues.reduce((sum, item) => sum + item.ongoing, 0),
      completed: usageValues.reduce((sum, item) => sum + item.completed, 0),
    };
  }, [treatments, treatmentUsage]);

  const filteredTreatments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return treatments.filter((treatment) => {
      const usage = treatmentUsage[treatment.treatment_id] || {};
      const patientName = fullName(usage.patient).toLowerCase();
      const dentistName = fullName(usage.dentist).toLowerCase();
      const matchesSearch =
        !query ||
        (treatment.treatment_name || '').toLowerCase().includes(query) ||
        (treatment.description || '').toLowerCase().includes(query) ||
        patientName.includes(query) ||
        dentistName.includes(query) ||
        String(treatment.treatment_id).includes(query);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'scheduled' && usage.scheduled > 0) ||
        (statusFilter === 'ongoing' && usage.ongoing > 0) ||
        (statusFilter === 'completed' && usage.completed > 0);

      return matchesSearch && matchesStatus;
    });
  }, [treatments, treatmentUsage, search, statusFilter]);

  const updateForm = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setQuickAddOpen(true);
  };

  const openEdit = (treatment) => {
    setEditingId(treatment.treatment_id);
    setForm({
      treatment_name: treatment.treatment_name || '',
      description: treatment.description || '',
      price: treatment.price || '',
      average_duration: treatment.average_duration || '',
    });
    setQuickAddOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(editingId ? `/api/treatments/${editingId}` : '/api/treatments', {
        method: editingId ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          treatment_name: form.treatment_name,
          description: form.description,
          price: Number(form.price),
          average_duration: form.average_duration === '' ? null : Number(form.average_duration),
        }),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Treatment could not be saved.');

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

  const handleDelete = async (treatmentId) => {
    if (!window.confirm('Deactivate this treatment?')) return;

    try {
      const response = await fetch(`/api/treatments/${treatmentId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Treatment could not be deactivated.');

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
              placeholder="Search treatment type, patient, or dentist..."
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
              <span className="text-primary font-bold">Treatments</span>
            </nav>
            <h2 className="text-headline-lg font-headline-lg text-on-surface">Treatments Management</h2>
          </div>
          <button
            className="bg-primary text-on-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-label-bold shadow-lg hover:bg-on-primary-fixed-variant transition-all active:scale-[0.98]"
            onClick={openCreate}
          >
            <span className="material-symbols-outlined">add_circle</span>
            New Treatment
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
          {[
            ['medical_services', 'Total Treatments', stats.total, 'bg-primary/10 text-primary'],
            ['event_available', 'Scheduled', stats.scheduled, 'bg-blue-100 text-blue-700'],
            ['pending_actions', 'Ongoing', stats.ongoing, 'bg-orange-100 text-orange-600'],
            ['check_circle', 'Completed', stats.completed, 'bg-green-100 text-green-700'],
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
              ['scheduled', 'Scheduled'],
              ['ongoing', 'Ongoing'],
              ['completed', 'Completed'],
            ].map(([value, label]) => (
              <button key={value} className={`px-md py-2 rounded-full font-label-bold text-caption transition-colors ${statusFilter === value ? 'bg-primary-container text-on-primary-container' : 'hover:bg-surface-container text-on-surface-variant'}`} onClick={() => setStatusFilter(value)}>
                {label}
              </button>
            ))}
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
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Treatment</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Details</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Related Patient</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Related Dentist</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {loading ? (
                  <tr>
                    <td className="px-gutter py-lg text-on-surface-variant" colSpan="6">Loading treatments...</td>
                  </tr>
                ) : filteredTreatments.length === 0 ? (
                  <tr>
                    <td className="px-gutter py-lg text-on-surface-variant" colSpan="6">No treatments found.</td>
                  </tr>
                ) : (
                  filteredTreatments.map((treatment) => {
                    const usage = treatmentUsage[treatment.treatment_id] || {};
                    const displayStatus = usage.ongoing > 0 ? 'Ongoing' : usage.scheduled > 0 ? 'Scheduled' : usage.completed > 0 ? 'Completed' : 'Active';

                    return (
                      <tr key={treatment.treatment_id} className="hover:bg-surface-container-low/60 transition-colors group">
                        <td className="px-gutter py-md">
                          <div className="flex items-center gap-sm">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <span className="material-symbols-outlined">medical_services</span>
                            </div>
                            <div>
                              <p className="font-label-bold text-on-surface">{treatment.treatment_name}</p>
                              <p className="text-caption text-on-surface-variant">#TR-{treatment.treatment_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="font-label-bold text-on-surface">{formatCurrency(treatment.price)}</p>
                          <p className="text-caption text-on-surface-variant">{treatment.average_duration ? `${treatment.average_duration} min` : 'No duration'} - {usage.total || 0} case(s)</p>
                          <p className="text-caption text-on-surface-variant max-w-[260px] truncate">{treatment.description || 'No description'}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="font-label-bold text-on-surface">{usage.patient ? fullName(usage.patient) : '-'}</p>
                          <p className="text-caption text-on-surface-variant">{usage.latest ? formatDate(usage.latest) : 'No patient case'}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="font-label-bold text-on-surface">{usage.dentist ? fullName(usage.dentist) : '-'}</p>
                          <p className="text-caption text-on-surface-variant">{usage.dentist ? `#${usage.dentist.dentist_id}` : 'Unassigned'}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-label-bold ${statusClasses[displayStatus]}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                            {displayStatus}
                          </span>
                        </td>
                        <td className="px-gutter py-md text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Edit" onClick={() => openEdit(treatment)}>
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all" title="Deactivate" onClick={() => handleDelete(treatment.treatment_id)}>
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
              Showing <span className="font-label-bold text-on-surface">{filteredTreatments.length}</span> of <span className="font-label-bold text-on-surface">{treatments.length}</span> treatments
            </p>
          </div>
        </div>
      </main>

      <div className={`fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${quickAddOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setQuickAddOpen(false)}>
        <form className={`fixed right-0 top-0 h-screen w-full max-w-md bg-surface-container-lowest shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${quickAddOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
          <div className="p-gutter flex items-center justify-between border-b border-outline-variant/30">
            <h3 className="text-headline-md font-headline-md text-primary">{editingId ? 'Edit Treatment' : 'New Treatment'}</h3>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-all" type="button" onClick={() => setQuickAddOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-gutter space-y-md">
            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Treatment Name</label>
              <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" placeholder="Cleaning, filling, extraction..." type="text" value={form.treatment_name} onChange={(event) => updateForm('treatment_name', event.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Price</label>
                <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" min="0" step="0.01" placeholder="0.00" type="number" value={form.price} onChange={(event) => updateForm('price', event.target.value)} required />
              </div>
              <div className="space-y-unit">
                <label className="font-label-bold text-on-surface-variant text-caption">Duration</label>
                <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base" min="1" placeholder="Minutes" type="number" value={form.average_duration} onChange={(event) => updateForm('average_duration', event.target.value)} />
              </div>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Treatment Description</label>
              <textarea className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base resize-none" placeholder="Describe what this treatment covers..." rows="5" value={form.description} onChange={(event) => updateForm('description', event.target.value)} />
            </div>

            <div className="bg-surface-container p-md rounded-2xl">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">info</span>
                <p className="text-caption text-on-surface-variant">Treatment status is derived from related patient treatment cases.</p>
              </div>
            </div>
          </div>

          <div className="p-gutter border-t border-outline-variant/30 flex gap-md">
            <button className="flex-1 py-3 border border-outline-variant text-on-surface-variant rounded-xl font-label-bold hover:bg-surface-container-low transition-colors" type="button" onClick={() => setQuickAddOpen(false)}>Cancel</button>
            <button className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-label-bold hover:bg-on-primary-fixed-variant transition-all shadow-md active:scale-95 disabled:opacity-60" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Treatment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TreatmentsManagement;
