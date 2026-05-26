import { useCallback, useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

const defaultSettings = {
  clinic_name: 'DentaCare Pro',
  clinic_address: '',
  clinic_phone: '',
  clinic_email: '',
  enable_email_reminders: true,
  enable_sms_reminders: false,
  reminder_lead_time_hours: 24,
  default_appointment_duration_minutes: 30,
  working_hours_start: '09:00',
  working_hours_end: '17:00',
  working_days: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  },
  session_timeout_minutes: 30,
  max_failed_login_attempts: 5,
};

const workingDayOptions = [
  ['monday', 'Mon'],
  ['tuesday', 'Tue'],
  ['wednesday', 'Wed'],
  ['thursday', 'Thu'],
  ['friday', 'Fri'],
  ['saturday', 'Sat'],
  ['sunday', 'Sun'],
];

const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[15px]';
const sectionCardClass = 'bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-outline-variant/20 overflow-hidden';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

function normalizeSettings(payload) {
  const source = payload?.data || payload || {};
  return {
    ...defaultSettings,
    clinic_name: source.clinic_name ?? source.clinicName ?? defaultSettings.clinic_name,
    clinic_address: source.clinic_address ?? source.clinicAddress ?? defaultSettings.clinic_address,
    clinic_phone: source.clinic_phone ?? source.clinicPhone ?? defaultSettings.clinic_phone,
    clinic_email: source.clinic_email ?? source.clinicEmail ?? defaultSettings.clinic_email,
    enable_email_reminders: source.enable_email_reminders ?? source.enableEmailReminders ?? defaultSettings.enable_email_reminders,
    enable_sms_reminders: source.enable_sms_reminders ?? source.enableSmsReminders ?? defaultSettings.enable_sms_reminders,
    reminder_lead_time_hours: source.reminder_lead_time_hours ?? source.reminderLeadTimeHours ?? defaultSettings.reminder_lead_time_hours,
    default_appointment_duration_minutes: source.default_appointment_duration_minutes ?? source.defaultAppointmentDurationMinutes ?? defaultSettings.default_appointment_duration_minutes,
    working_hours_start: source.working_hours_start ?? source.workingHoursStart ?? defaultSettings.working_hours_start,
    working_hours_end: source.working_hours_end ?? source.workingHoursEnd ?? defaultSettings.working_hours_end,
    working_days: {
      ...defaultSettings.working_days,
      ...(source.working_days || source.workingDays || {}),
    },
    session_timeout_minutes: source.session_timeout_minutes ?? source.sessionTimeoutMinutes ?? defaultSettings.session_timeout_minutes,
    max_failed_login_attempts: source.max_failed_login_attempts ?? source.maxFailedLoginAttempts ?? defaultSettings.max_failed_login_attempts,
  };
}

function SettingsCard({ title, subtitle, children, onSave, saving, saved }) {
  return (
    <section className={sectionCardClass}>
      <div className="p-6 border-b border-outline-variant/20 bg-surface flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-[24px] font-semibold text-on-surface">{title}</h3>
          <p className="text-[14px] text-on-surface-variant mt-1">{subtitle}</p>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-2 rounded-lg bg-primary text-on-primary text-[14px] font-semibold hover:bg-[#005049] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>}
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div className="p-6">
        {saved && (
          <div className="mb-5 p-3 bg-[#e6f4ea] border border-[#ceead6] rounded-lg text-[#137333] text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{saved}</span>
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between gap-4 p-3 bg-surface-container-low rounded-lg border border-outline-variant/30 cursor-pointer">
      <span className="text-[15px] font-semibold text-on-surface">{label}</span>
      <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-outline-variant'}`}>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onChange}
        />
        <span className={`inline-block h-5 w-5 transform rounded-full bg-surface transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`}></span>
      </span>
    </label>
  );
}

function SystemSettings() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingSection, setSavingSection] = useState('');
  const [savedMessages, setSavedMessages] = useState({});
  const [sessionSaving, setSessionSaving] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState('');
  const [sessionError, setSessionError] = useState('');

  const updateField = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateWorkingDay = (day) => {
    setSettings(prev => ({
      ...prev,
      working_days: {
        ...prev.working_days,
        [day]: !prev.working_days[day],
      },
    }));
  };

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/settings', {
        headers: authHeaders(),
      });

      if (res.status === 404) {
        setSettings(defaultSettings);
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to fetch settings (${res.status})`);
      }

      const json = await res.json();
      setSettings(normalizeSettings(json));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSection = async (section, payload) => {
    setSavingSection(section);
    setError('');
    setSavedMessages(prev => ({ ...prev, [section]: '' }));

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.status === 404) {
        setSavedMessages(prev => ({
          ...prev,
          [section]: 'Settings API is not available yet. Values are kept on this page with defaults.',
        }));
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save settings');
      }

      const json = await res.json().catch(() => null);
      if (json) setSettings(prev => normalizeSettings({ data: { ...prev, ...(json.data || json) } }));
      setSavedMessages(prev => ({ ...prev, [section]: 'Settings saved successfully.' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingSection('');
    }
  };

  const forceLogoutAllUsers = async () => {
    if (!window.confirm('Are you sure? All users will be logged out immediately.')) return;

    setSessionSaving(true);
    setSessionSuccess('');
    setSessionError('');

    try {
      const res = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to revoke active sessions.');
      }

      setSessionSuccess('All sessions have been revoked.');
    } catch (err) {
      setSessionError(err.message);
    } finally {
      setSessionSaving(false);
    }
  };

  return (
    <div className="font-body-base text-body-base text-on-background h-screen overflow-hidden flex">
      <AdminSidebar />

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
              <h2 className="text-[32px] font-bold text-on-surface">System Settings</h2>
              <p className="text-[16px] text-on-surface-variant mt-1">Configure clinic profile, reminders, and appointment defaults.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            {loading ? (
              <div className={sectionCardClass}>
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-on-surface-variant">Loading settings...</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SettingsCard
                  title="Clinic Information"
                  subtitle="Public clinic details used across patient-facing communications."
                  saving={savingSection === 'clinic'}
                  saved={savedMessages.clinic}
                  onSave={() => saveSection('clinic', {
                    clinic_name: settings.clinic_name,
                    clinic_address: settings.clinic_address,
                    clinic_phone: settings.clinic_phone,
                    clinic_email: settings.clinic_email,
                  })}
                >
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[14px] font-semibold text-on-surface mb-2">Clinic Name</label>
                      <input className={inputClass} value={settings.clinic_name} onChange={e => updateField('clinic_name', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[14px] font-semibold text-on-surface mb-2">Address</label>
                      <input className={inputClass} value={settings.clinic_address} onChange={e => updateField('clinic_address', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[14px] font-semibold text-on-surface mb-2">Phone</label>
                        <input className={inputClass} type="tel" value={settings.clinic_phone} onChange={e => updateField('clinic_phone', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[14px] font-semibold text-on-surface mb-2">Email</label>
                        <input className={inputClass} type="email" value={settings.clinic_email} onChange={e => updateField('clinic_email', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </SettingsCard>

                <SettingsCard
                  title="Notification Settings"
                  subtitle="Control automated reminder channels and reminder timing."
                  saving={savingSection === 'notifications'}
                  saved={savedMessages.notifications}
                  onSave={() => saveSection('notifications', {
                    enable_email_reminders: settings.enable_email_reminders,
                    enable_sms_reminders: settings.enable_sms_reminders,
                    reminder_lead_time_hours: Number(settings.reminder_lead_time_hours),
                  })}
                >
                  <div className="grid grid-cols-1 gap-4">
                    <Toggle
                      label="Enable email reminders"
                      checked={settings.enable_email_reminders}
                      onChange={() => updateField('enable_email_reminders', !settings.enable_email_reminders)}
                    />
                    <Toggle
                      label="Enable SMS reminders"
                      checked={settings.enable_sms_reminders}
                      onChange={() => updateField('enable_sms_reminders', !settings.enable_sms_reminders)}
                    />
                    <div>
                      <label className="block text-[14px] font-semibold text-on-surface mb-2">Reminder Lead Time (hours)</label>
                      <input className={inputClass} type="number" min="1" value={settings.reminder_lead_time_hours} onChange={e => updateField('reminder_lead_time_hours', e.target.value)} />
                    </div>
                  </div>
                </SettingsCard>

                <SettingsCard
                  title="Appointment Settings"
                  subtitle="Set appointment length, operating hours, and working days."
                  saving={savingSection === 'appointments'}
                  saved={savedMessages.appointments}
                  onSave={() => saveSection('appointments', {
                    default_appointment_duration_minutes: Number(settings.default_appointment_duration_minutes),
                    working_hours_start: settings.working_hours_start,
                    working_hours_end: settings.working_hours_end,
                    working_days: settings.working_days,
                  })}
                >
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[14px] font-semibold text-on-surface mb-2">Default Appointment Duration (minutes)</label>
                      <input className={inputClass} type="number" min="5" step="5" value={settings.default_appointment_duration_minutes} onChange={e => updateField('default_appointment_duration_minutes', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[14px] font-semibold text-on-surface mb-2">Working Hours Start</label>
                        <input className={inputClass} type="time" value={settings.working_hours_start} onChange={e => updateField('working_hours_start', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[14px] font-semibold text-on-surface mb-2">Working Hours End</label>
                        <input className={inputClass} type="time" value={settings.working_hours_end} onChange={e => updateField('working_hours_end', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[14px] font-semibold text-on-surface mb-2">Working Days</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {workingDayOptions.map(([day, label]) => (
                          <label key={day} className="flex items-center gap-2 p-3 bg-surface-container-low rounded-lg border border-outline-variant/30 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-outline-variant text-primary cursor-pointer"
                              checked={settings.working_days[day]}
                              onChange={() => updateWorkingDay(day)}
                            />
                            <span className="text-[14px] font-semibold text-on-surface">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </SettingsCard>

                <section className={sectionCardClass}>
                  <div className="p-6 border-b border-outline-variant/20 bg-surface">
                    <h3 className="text-[24px] font-semibold text-on-surface">Session Management</h3>
                  </div>
                  <div className="p-6">
                    {sessionSuccess && (
                      <div className="mb-5 p-3 bg-[#e6f4ea] border border-[#ceead6] rounded-lg text-[#137333] text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span>{sessionSuccess}</span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h4 className="text-[16px] font-semibold text-on-surface">Force Logout All Users</h4>
                        <p className="text-[14px] text-on-surface-variant mt-1">Immediately revoke all active sessions. All users will be required to log in again.</p>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2">
                        <button
                          onClick={forceLogoutAllUsers}
                          disabled={sessionSaving}
                          className="px-6 py-2 rounded-lg border border-error/30 text-error hover:bg-error/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-[14px] font-semibold"
                        >
                          {sessionSaving ? (
                            <span className="w-4 h-4 border-2 border-error border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                          )}
                          {sessionSaving ? 'Revoking...' : 'Force Logout'}
                        </button>
                        {sessionError && <p className="text-[12px] text-error text-left sm:text-right">{sessionError}</p>}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default SystemSettings;
