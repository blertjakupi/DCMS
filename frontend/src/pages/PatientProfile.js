import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientNavbar from '../components/PatientNavbar';
import { authFetch } from '../utils/authFetch';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'JD';

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input checked={checked} className="sr-only peer" type="checkbox" onChange={onChange} />
      <div className="w-11 h-6 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  );
}

function PatientProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  
  const [settings, setSettings] = useState([
    { label: 'Email Notifications', enabled: true },
    { label: 'SMS Reminders', enabled: true },
    { label: 'Appointment Reminders', enabled: true },
  ]);

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      setError('');
      try {
        const patRes = await authFetch('/api/patients/me');
        if (!patRes.ok) throw new Error('Failed to load patient profile');
        const patData = await patRes.json();
        setPatient(patData);

        const appRes = await authFetch(`/api/appointments/patient/${patData.patient_id}`);
        if (appRes.ok) {
          const appData = await appRes.json();
          setAppointments(appData.data || []);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, []);

  const displayName = useMemo(() => {
    if (!patient) return 'Jane Doe';
    return `${patient.first_name} ${patient.last_name}`;
  }, [patient]);

  const email = useMemo(() => {
    return patient?.email || patient?.User?.email || 'N/A';
  }, [patient]);

  const phone = useMemo(() => {
    return patient?.phone || patient?.User?.phone_number || 'N/A';
  }, [patient]);

  const personalInfo = useMemo(() => {
    if (!patient) return [];
    return [
      { label: 'Full Name', value: displayName },
      { label: 'Date of Birth', value: formatDate(patient.birth_date) },
      { label: 'Gender', value: 'Not Provided' },
      { label: 'Phone', value: phone },
      { label: 'Email', value: email },
      { label: 'Address', value: patient.address || 'N/A' },
    ];
  }, [patient, displayName, email, phone]);

  const allergiesList = useMemo(() => {
    if (!patient?.allergies) return ['None'];
    return patient.allergies.split(',').map(a => a.trim()).filter(Boolean);
  }, [patient]);

  const medicalInfo = useMemo(() => {
    return [
      { label: 'Blood Type', value: 'Not Provided', pill: true },
      { label: 'Allergies', values: allergiesList, allergy: true },
      { label: 'Current Medications', value: 'None', wide: true },
    ];
  }, [allergiesList]);

  // Find the Dentist of the last completed appointment, or any appointment
  const assignedDentist = useMemo(() => {
    if (appointments.length === 0) return null;
    const completed = appointments.filter(app => app.status === 'Completed');
    const source = completed.length > 0 ? completed : appointments;
    // Get dentist of most recent appointment
    return source[0]?.Dentist || null;
  }, [appointments]);

  const dentistName = assignedDentist ? `Dr. ${assignedDentist.first_name} ${assignedDentist.last_name}` : 'Sarah Smith';
  const dentistSpec = 'General Dentist';
  const dentistInitials = assignedDentist ? `${assignedDentist.first_name[0]}${assignedDentist.last_name[0]}`.toUpperCase() : 'SS';

  const updateSetting = (label) => {
    setSettings((current) =>
      current.map((setting) =>
        setting.label === label ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const changePassword = async () => {
    setPasswordSaving(true);
    setPasswordMessage('');
    try {
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        throw new Error('All password fields are required.');
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('New password and confirmation do not match.');
      }

      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
          confirm_password: passwordForm.confirmPassword,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || 'Failed to change password.');
      }

      setPasswordMessage(json.message || 'Password changed successfully. Please sign in again.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/login');
      }, 1200);
    } catch (err) {
      setPasswordMessage(err.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex flex-col justify-center items-center font-body-base text-on-surface">
        <span className="material-symbols-outlined text-primary text-[48px] animate-spin mb-4">
          progress_activity
        </span>
        <p className="text-body-lg">Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen flex flex-col justify-center items-center font-body-base text-error">
        <span className="material-symbols-outlined text-[48px] mb-4">error</span>
        <p className="text-body-lg font-bold">Error: {error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 bg-primary text-on-primary px-6 py-2 rounded-full font-label-bold">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-body-base antialiased min-h-screen flex flex-col">
      <PatientNavbar />

      <main className="flex-grow w-full max-w-[1200px] mx-auto px-5 md:px-xl py-xl pt-32 flex flex-col gap-gutter">
        <section className="bg-surface rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-gutter flex flex-col md:flex-row items-center md:items-start justify-between gap-gutter transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col md:flex-row items-center gap-gutter text-center md:text-left">
            <div className="w-24 h-24 shrink-0 rounded-full bg-primary-container flex items-center justify-center">
              <span className="text-on-primary-container text-headline-lg font-headline-lg">
                {initials(displayName)}
              </span>
            </div>
            <div>
              <h1 className="text-headline-lg font-headline-lg text-on-surface mb-2">{displayName}</h1>
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-on-surface-variant text-body-base">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">mail</span>
                  {email}
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">call</span>
                  {phone}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-start">
          <div className="md:col-span-8 flex flex-col gap-gutter">
            <section className="bg-surface rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-gutter transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/20 pb-4">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-container">person</span>
                </div>
                <h2 className="text-headline-md font-headline-md text-on-surface">Personal Information</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-gutter">
                {personalInfo.map((item) => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <span className="font-label-bold text-on-surface-variant">{item.label}</span>
                    <span className="text-body-base text-on-surface">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-surface rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-gutter transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/20 pb-4">
                <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-error-container">medical_information</span>
                </div>
                <h2 className="text-headline-md font-headline-md text-on-surface">Medical Information</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-gutter">
                {medicalInfo.map((item) => (
                  <div key={item.label} className={`flex flex-col gap-1 ${item.wide ? 'sm:col-span-2' : ''}`}>
                    <span className="font-label-bold text-on-surface-variant">{item.label}</span>
                    {item.pill && (
                      <div className="inline-flex bg-surface-container-high px-3 py-1 rounded-full w-fit">
                        <span className="font-label-bold text-on-surface">{item.value}</span>
                      </div>
                    )}
                    {item.allergy && (
                      <div className="flex gap-2 flex-wrap">
                        {item.values.map((value) => (
                          <span
                            key={value}
                            className="bg-error-container/50 text-on-error-container text-caption font-label-bold px-3 py-1 rounded-full"
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    )}
                    {!item.pill && !item.allergy && (
                      <span className="text-body-base text-on-surface">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="md:col-span-4 flex flex-col gap-gutter">
            <section className="bg-surface rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-gutter transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex flex-col items-center text-center">
              <h3 className="font-label-bold text-on-surface-variant self-start mb-4 uppercase tracking-wider">
                My Dentist
              </h3>
              <div className="w-20 h-20 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-headline-md font-headline-md mb-4 shadow-sm">
                {dentistInitials}
              </div>
              <h4 className="text-headline-md font-headline-md text-on-surface mb-1">{dentistName}</h4>
              <span className="text-body-base text-on-surface-variant mb-6">{dentistSpec}</span>
              <button
                onClick={() => navigate('/patient/appointments')}
                className="w-full font-label-bold px-6 py-3 rounded-full transition-colors flex items-center justify-center gap-2 bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                Book Appointment
              </button>
            </section>

            <section className="bg-surface rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-gutter transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
              <h3 className="font-label-bold text-on-surface-variant mb-6 uppercase tracking-wider border-b border-outline-variant/20 pb-4">
                Account Settings
              </h3>
              <div className="flex flex-col gap-4">
                {settings.map((setting) => (
                  <div key={setting.label} className="flex items-center justify-between gap-4">
                    <span className="text-body-base text-on-surface">{setting.label}</span>
                    <Toggle checked={setting.enabled} onChange={() => updateSetting(setting.label)} />
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-surface rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-gutter transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
              <h3 className="font-label-bold text-on-surface-variant mb-6 uppercase tracking-wider border-b border-outline-variant/20 pb-4">
                Security
              </h3>
              <div className="flex flex-col gap-3">
                {passwordMessage && (
                  <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-3 text-[13px] text-on-surface-variant">
                    {passwordMessage}
                  </div>
                )}
                <input
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  type="password"
                  placeholder="Current password"
                  value={passwordForm.currentPassword}
                  onChange={event => setPasswordForm(prev => ({ ...prev, currentPassword: event.target.value }))}
                />
                <input
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  type="password"
                  placeholder="New password"
                  value={passwordForm.newPassword}
                  onChange={event => setPasswordForm(prev => ({ ...prev, newPassword: event.target.value }))}
                />
                <input
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={event => setPasswordForm(prev => ({ ...prev, confirmPassword: event.target.value }))}
                />
                <button
                  onClick={changePassword}
                  disabled={passwordSaving}
                  className="w-full font-label-bold px-6 py-3 rounded-full transition-colors flex items-center justify-center gap-2 bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container shadow-sm active:scale-95 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">password</span>
                  {passwordSaving ? 'Saving...' : 'Change Password'}
                </button>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default PatientProfile;
