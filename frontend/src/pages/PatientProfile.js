import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientNavbar from '../components/PatientNavbar';

const personalInfo = [
  { label: 'Full Name', value: 'Jane Doe' },
  { label: 'Date of Birth', value: 'May 12, 1988' },
  { label: 'Gender', value: 'Female' },
  { label: 'Phone', value: '(555) 123-4567' },
  { label: 'Email', value: 'jane.doe@example.com' },
  { label: 'Address', value: '123 Maple Avenue, Springfield' },
];

const medicalInfo = [
  { label: 'Blood Type', value: 'O+', pill: true },
  { label: 'Allergies', values: ['Penicillin', 'Pollen'], allergy: true },
  { label: 'Current Medications', value: 'None', wide: true },
  { label: 'Emergency Contact Name', value: 'John Doe' },
  { label: 'Emergency Contact Phone', value: '(555) 987-6543' },
];

const initialSettings = [
  { label: 'Email Notifications', enabled: true },
  { label: 'SMS Reminders', enabled: true },
  { label: 'Appointment Reminders', enabled: true },
];

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
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.full_name || 'Jane Doe';
  const email = user.email || 'jane.doe@example.com';
  const phone = user.phone || user.phone_number || '(555) 123-4567';
  const [settings, setSettings] = useState(initialSettings);

  const profileInfo = personalInfo.map((item) => {
    if (item.label === 'Full Name') return { ...item, value: displayName };
    if (item.label === 'Email') return { ...item, value: email };
    if (item.label === 'Phone') return { ...item, value: phone };
    return item;
  });

  const updateSetting = (label) => {
    setSettings((current) =>
      current.map((setting) =>
        setting.label === label ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  return (
    <div className="bg-background text-on-background font-body-base antialiased min-h-screen flex flex-col">
      <PatientNavbar />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-5 md:px-xl py-xl pt-32 flex flex-col gap-gutter">
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
          <button className="bg-primary text-on-primary font-label-bold px-6 py-3 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm active:scale-95 flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Edit Profile
          </button>
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
                {profileInfo.map((item) => (
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
                SS
              </div>
              <h4 className="text-headline-md font-headline-md text-on-surface mb-1">Dr. Sarah Smith</h4>
              <span className="text-body-base text-on-surface-variant mb-6">General Dentist</span>
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
          </aside>
        </div>
      </main>
    </div>
  );
}

export default PatientProfile;
