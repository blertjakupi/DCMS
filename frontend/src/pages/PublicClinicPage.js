import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const formatNumber = (value) => Number(value || 0).toLocaleString('en-US');

const initialsFromName = (firstName, lastName) =>
  `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'DC';

const getDashboardPath = (role) => {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'DENTIST') return '/dentist/dashboard';
  if (role === 'PATIENT') return '/patient/dashboard';
  if (role === 'RECEPTIONIST') return '/receptionist/dashboard';
  return '/dashboard';
};

function PublicClinicPage() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const accessToken = localStorage.getItem('accessToken');
  const userRole = storedUser.roles?.[0];
  const isAuthenticated = Boolean(accessToken && userRole);
  const dashboardPath = getDashboardPath(userRole);
  const [stats, setStats] = useState({ patients: 0, dentists: 0, years: 12, services: 8 });
  const [dentists, setDentists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamError, setTeamError] = useState('');
  const [contactForm, setContactForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    message: ''
  });
  const [contactStatus, setContactStatus] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactSending, setContactSending] = useState(false);

  useEffect(() => {
    let active = true;

    const loadClinic = async () => {
      try {
        const response = await fetch('/api/public/clinic');
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Clinic data could not be loaded.');
        if (!active) return;
        setStats(data.stats || { patients: 0, dentists: 0, years: 12, services: 8 });
        setDentists(data.dentists || []);
        setTeamError('');
      } catch (err) {
        if (!active) return;
        setDentists([]);
        setTeamError('Te dhenat e ekipit nuk u ngarkuan. Kontrollo nese backend-i eshte restartuar.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadClinic();
    return () => {
      active = false;
    };
  }, []);

  const statItems = [
    { label: 'Paciente aktive', value: formatNumber(stats.patients), icon: 'groups' },
    { label: 'Dentiste ne ekip', value: formatNumber(stats.dentists || dentists.length), icon: 'medical_information' },
    { label: 'Vite pervoje', value: `${stats.years}+`, icon: 'verified' },
    { label: 'Sherbime klinike', value: `${stats.services}+`, icon: 'health_and_safety' }
  ];

  const updateContactForm = (field, value) => {
    setContactForm((previous) => ({ ...previous, [field]: value }));
  };

  const submitContactForm = async (event) => {
    event.preventDefault();
    setContactSending(true);
    setContactStatus('');
    setContactError('');

    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Mesazhi nuk mund te dergohej.');

      setContactForm({ first_name: '', last_name: '', phone_number: '', message: '' });
      setContactStatus('Mesazhi u dergua me sukses. Stafi i klinikes do ta shqyrtoje se shpejti.');
    } catch (err) {
      setContactError(err.message);
    } finally {
      setContactSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-base">
      <header className="sticky top-0 z-50 h-16 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
        <div className="max-w-[1200px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <button className="flex items-center gap-3" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>dentistry</span>
            <span className="text-[22px] font-bold text-primary">UBT Dent</span>
          </button>
          <nav className="hidden md:flex items-center gap-2">
            <a className="px-3 py-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary-container/10 transition-colors" href="#home">Ballina</a>
            <a className="px-3 py-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary-container/10 transition-colors" href="#team">Ekipi</a>
            <a className="px-3 py-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary-container/10 transition-colors" href="#history">Historiku</a>
            <a className="px-3 py-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary-container/10 transition-colors" href="#contact">Kontakti</a>
          </nav>
          <Link
            className="bg-primary text-on-primary px-4 py-2 rounded-lg text-[14px] font-semibold hover:bg-on-primary-fixed-variant transition-colors"
            to={isAuthenticated ? dashboardPath : '/login'}
          >
            {isAuthenticated ? 'Dashboard' : 'Kyqu'}
          </Link>
        </div>
      </header>

      <main>
        <section id="home" className="bg-surface-container-low">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 md:py-20 grid lg:grid-cols-[1fr_0.95fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-variant text-primary text-[14px] font-semibold mb-5">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Kujdes dentar profesional
              </div>
              <h1 className="text-[34px] md:text-[48px] leading-tight font-bold text-on-surface max-w-2xl">
                Klinike dentare moderne per buzeqeshje te shendetshme.
              </h1>
              <p className="text-[16px] text-on-surface-variant mt-5 max-w-xl">
                UBT Dent kombinon staf te specializuar, teknologji bashkekohore dhe kujdes te qete per paciente te te gjitha moshave.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <a className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-semibold hover:bg-on-primary-fixed-variant transition-colors shadow-[0_8px_22px_rgba(0,106,98,0.22)]" href="#team">
                  Shiko ekipin
                  <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                </a>
                <Link
                  className="inline-flex items-center justify-center gap-2 border border-secondary text-secondary px-6 py-3 rounded-xl font-semibold hover:bg-secondary-container/20 transition-colors"
                  to={isAuthenticated ? dashboardPath : '/login'}
                >
                  {isAuthenticated ? 'Kthehu ne dashboard' : 'Kyqu'}
                  <span className="material-symbols-outlined text-[20px]">
                    {isAuthenticated ? 'dashboard' : 'login'}
                  </span>
                </Link>
              </div>
            </div>

            <div className="relative min-h-[360px] rounded-2xl overflow-hidden bg-surface-container-lowest border border-outline-variant/30 shadow-[0_20px_45px_rgba(0,106,98,0.12)]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#ffffff_0%,#edf4ff_55%,#d2e4fb_100%)]"></div>
              <div className="absolute left-8 top-8 right-8 rounded-xl bg-white/80 border border-outline-variant/30 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>dentistry</span>
                  <div>
                    <p className="text-[13px] text-on-surface-variant">Salla kryesore</p>
                    <p className="text-[18px] font-semibold text-on-surface">Kontroll, trajtim dhe kujdes preventiv</p>
                  </div>
                </div>
              </div>
              <div className="absolute left-10 bottom-10 right-10 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-primary text-on-primary p-5">
                  <span className="material-symbols-outlined">calendar_month</span>
                  <p className="text-[22px] font-bold mt-4">Orar fleksibil</p>
                  <p className="text-[13px] text-primary-fixed-dim mt-1">Takime dhe follow-up te organizuara.</p>
                </div>
                <div className="rounded-xl bg-surface-container-high text-on-surface p-5">
                  <span className="material-symbols-outlined text-secondary">monitor_heart</span>
                  <p className="text-[22px] font-bold mt-4">Pajisje moderne</p>
                  <p className="text-[13px] text-on-surface-variant mt-1">Ambient i paster, i qete dhe i sigurt.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 bg-background">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statItems.map((item) => (
              <div key={item.label} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <span className="material-symbols-outlined text-primary">{item.icon}</span>
                <p className="text-[28px] font-bold text-on-surface mt-3">{loading ? '...' : item.value}</p>
                <p className="text-[13px] text-on-surface-variant">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid lg:grid-cols-3 gap-5">
            {[
              ['dentistry', 'Kontrolle preventive', 'Vizita rutinore, pastrim profesional dhe keshillim per higjiene orale.'],
              ['orthopedics', 'Trajtime restauruese', 'Mbushje, trajtime te dhembeve dhe plane te personalizuara sipas gjendjes klinike.'],
              ['sentiment_satisfied', 'Estetike dentare', 'Zgjidhje estetike per nje buzeqeshje natyrale, te shendetshme dhe te qendrueshme.']
            ].map(([icon, title, text]) => (
              <article key={title} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <span className="material-symbols-outlined text-primary text-[32px]">{icon}</span>
                <h3 className="text-[20px] font-semibold text-on-surface mt-5">{title}</h3>
                <p className="text-[14px] text-on-surface-variant mt-3">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="team" className="py-16 bg-surface">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <p className="text-primary font-semibold">Ekipi</p>
                <h2 className="text-[30px] font-bold text-on-surface mt-1">Dentistet tane</h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {loading ? (
                <div className="col-span-full text-on-surface-variant">Duke ngarkuar ekipin...</div>
              ) : teamError ? (
                <div className="col-span-full bg-error-container/30 border border-error-container rounded-xl p-6 text-error">
                  {teamError}
                </div>
              ) : dentists.length === 0 ? (
                <div className="col-span-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 text-on-surface-variant">
                  Nuk ka dentiste per t'u shfaqur.
                </div>
              ) : dentists.map((dentist) => (
                <article key={dentist.dentist_id} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                  <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[18px] font-bold">
                    {initialsFromName(dentist.first_name, dentist.last_name)}
                  </div>
                  <h3 className="text-[20px] font-semibold text-on-surface mt-5">
                    Dr. {dentist.first_name} {dentist.last_name}
                  </h3>
                  <p className="text-primary font-semibold mt-1">{dentist.specialization || 'General Dentistry'}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="history" className="py-16 bg-background">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid lg:grid-cols-[0.85fr_1fr] gap-8 items-start">
            <div>
              <p className="text-primary font-semibold">Historiku i klinikes</p>
              <h2 className="text-[30px] font-bold text-on-surface mt-1">Nga kujdesi familjar te klinika moderne.</h2>
              <div className="grid gap-3 mt-6">
                {[
                  ['diagnosis', 'Diagnostike e kujdesshme', 'Vleresim i qarte para cdo trajtimi.'],
                  ['auto_fix_high', 'Trajtime estetike', 'Zgjidhje natyrale per buzeqeshje me te sigurt.'],
                  ['health_and_safety', 'Kontrolle preventive', 'Kujdes i vazhdueshem per shendet oral.']
                ].map(([icon, title, text]) => (
                  <div key={title} className="rounded-xl bg-surface-container-low border border-outline-variant/20 p-4 text-on-surface">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary">{icon}</span>
                      <div>
                        <p className="font-semibold">{title}</p>
                        <p className="text-[13px] text-on-surface-variant mt-1">{text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4 text-on-surface-variant">
              <p>
                Klinika jone u krijua me nje ide te thjeshte: pacienti duhet te ndihet i informuar, i degjuar dhe i sigurt para cdo trajtimi.
              </p>
              <p>
                Me kalimin e viteve, ekipi eshte zgjeruar me specializime te ndryshme dhe me sisteme digjitale qe e bejne pervojen me te organizuar, nga termini deri te historiku mjekesor.
              </p>
              <p>
                Sot UBT Dent ofron nje pervoje me te qete dhe me transparente per pacientin: kontrolli fillon me vleresim te kujdesshem, vazhdon me shpjegim te qarte te gjendjes dhe perfundon me plan trajtimi qe mund te ndiqet edhe ne portal. Kjo e ben komunikimin me te lehte per pacientet, dentistet dhe stafin administrativ.
              </p>
              <p>
                Qellimi yne eshte qe cdo vizite te kete standard te njejte profesional, nga kujdesi preventiv deri te trajtimet me komplekse. Ne i kushtojme rendesi dokumentimit, sigurise se te dhenave dhe nje ambienti qe e ben pacientin te ndihet i respektuar ne cdo hap.
              </p>
            </div>
          </div>
        </section>

        <section id="contact" className="py-16 bg-surface">
          <div className="max-w-[760px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <p className="text-primary font-semibold">Kontakti</p>
              <h2 className="text-[30px] font-bold text-on-surface mt-1">Na shkruani per kliniken.</h2>
              <p className="text-on-surface-variant mt-4 max-w-xl mx-auto">
                Plotesoni te dhenat tuaja dhe mesazhi do t'i shkoje direkt administratorit te klinikes si njoftim.
              </p>
            </div>

            <form className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)]" onSubmit={submitContactForm}>
              {contactStatus && (
                <div className="mb-4 rounded-lg bg-primary-container/30 border border-primary-container px-4 py-3 text-primary text-[14px] font-semibold">
                  {contactStatus}
                </div>
              )}
              {contactError && (
                <div className="mb-4 rounded-lg bg-error-container/40 border border-error-container px-4 py-3 text-error text-[14px] font-semibold">
                  {contactError}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-[13px] font-semibold text-on-surface-variant mb-2">Emri</span>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface"
                    value={contactForm.first_name}
                    onChange={(event) => updateContactForm('first_name', event.target.value)}
                    required
                  />
                </label>
                <label className="block">
                  <span className="block text-[13px] font-semibold text-on-surface-variant mb-2">Mbiemri</span>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface"
                    value={contactForm.last_name}
                    onChange={(event) => updateContactForm('last_name', event.target.value)}
                    required
                  />
                </label>
              </div>

              <label className="block mt-4">
                <span className="block text-[13px] font-semibold text-on-surface-variant mb-2">Numri kontaktues</span>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface"
                  type="tel"
                  value={contactForm.phone_number}
                  onChange={(event) => updateContactForm('phone_number', event.target.value)}
                  required
                />
              </label>

              <label className="block mt-4">
                <span className="block text-[13px] font-semibold text-on-surface-variant mb-2">Mesazhi per kliniken</span>
                <textarea
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface resize-none"
                  rows="5"
                  value={contactForm.message}
                  onChange={(event) => updateContactForm('message', event.target.value)}
                  required
                />
              </label>

              <button
                className="mt-5 w-full bg-primary text-on-primary px-6 py-3 rounded-xl font-semibold hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                type="submit"
                disabled={contactSending}
              >
                {contactSending ? 'Duke derguar...' : 'Dergo mesazhin'}
                {!contactSending && <span className="material-symbols-outlined text-[20px]">send</span>}
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-surface-container-highest border-t border-outline-variant/20 py-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <p className="text-primary font-bold">UBT Dent</p>
          <p className="text-[13px] text-on-surface-variant">Kujdes dentar modern dhe portal i sigurt per paciente.</p>
        </div>
      </footer>
    </div>
  );
}

export default PublicClinicPage;
