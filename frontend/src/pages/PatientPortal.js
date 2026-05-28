import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientNavbar from '../components/PatientNavbar';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const quickActions = [
  { icon: 'event_available', label: 'Book Appointment', path: '/patient/appointments' },
  { icon: 'receipt_long', label: 'Pay Bill', path: '/patient/billing' },
];

function PatientPortal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Fetch patient profile
        const patientRes = await fetch('/api/patients/me', { headers: authHeaders() });
        if (!patientRes.ok) throw new Error('Failed to fetch patient profile');
        const patientData = await patientRes.json();
        setPatient(patientData);

        const patientId = patientData.patient_id;

        // 2. Fetch appointments, invoices and dental records in parallel
        const [appRes, invRes, recRes] = await Promise.all([
          fetch(`/api/appointments/patient/${patientId}`, { headers: authHeaders() }),
          fetch(`/api/invoices`, { headers: authHeaders() }),
          fetch(`/api/dental-records/patient/${patientId}`, { headers: authHeaders() })
        ]);

        if (appRes.ok) {
          const appData = await appRes.json();
          setAppointments(appData.data || []);
        }
        if (invRes.ok) {
          const invData = await invRes.json();
          setInvoices(invData.data || []);
        }
        if (recRes.ok) {
          const recData = await recRes.json();
          setRecords(recData.data || []);
        }

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [navigate]);

  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const firstName = patient?.first_name || user.first_name || user.full_name?.split(' ')[0] || 'Patient';

  // Calculations for summary cards
  const nextAppointment = useMemo(() => {
    const now = new Date();
    // Filter scheduled future appointments
    const scheduled = appointments.filter(app => {
      if (app.status !== 'Scheduled') return false;
      const appDateTime = new Date(`${app.appointment_date}T${app.appointment_time}`);
      return appDateTime >= now;
    });
    // Sort ascending
    scheduled.sort((a, b) => new Date(`${a.appointment_date}T${a.appointment_time}`) - new Date(`${b.appointment_date}T${b.appointment_time}`));
    return scheduled[0] || null;
  }, [appointments]);

  const outstandingBalance = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'Unpaid' || inv.status === 'Partially Paid')
      .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
  }, [invoices]);

  const lastVisit = useMemo(() => {
    // Find most recent completed appointment or dental record
    const completed = appointments.filter(app => app.status === 'Completed');
    completed.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));
    return completed[0] || null;
  }, [appointments]);

  const summaryCards = useMemo(() => {
    return [
      {
        icon: 'calendar_month',
        label: 'Next Appointment',
        title: nextAppointment 
          ? `${formatDate(nextAppointment.appointment_date)} at ${formatTime(nextAppointment.appointment_time)}`
          : 'No upcoming visits',
        badge: nextAppointment ? 'Upcoming' : null,
        details: nextAppointment 
          ? [
              { icon: 'person', text: nextAppointment.Dentist ? `Dr. ${nextAppointment.Dentist.first_name} ${nextAppointment.Dentist.last_name}` : 'Dentist' },
              { icon: 'dentistry', text: nextAppointment.Treatment?.treatment_name || 'Dental Appointment' },
            ]
          : [{ icon: 'info', text: 'Book your next checkup' }],
      },
      {
        icon: 'payments',
        label: 'Outstanding Balance',
        title: `$${outstandingBalance.toFixed(2)}`,
        action: outstandingBalance > 0 ? 'Pay Now' : null,
        details: outstandingBalance === 0 ? [{ icon: 'check_circle', text: 'All bills paid!' }] : null,
      },
      {
        icon: 'history',
        label: 'Last Visit',
        title: lastVisit 
          ? formatDate(lastVisit.appointment_date)
          : 'No past visits',
        details: lastVisit 
          ? [{ icon: 'check_circle', text: lastVisit.notes || 'Dental Care' }]
          : [{ icon: 'info', text: 'Welcome to our clinic!' }],
        link: lastVisit ? 'View summary' : null,
      },
    ];
  }, [nextAppointment, outstandingBalance, lastVisit]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const scheduled = appointments.filter(app => {
      if (app.status !== 'Scheduled') return false;
      const appDateTime = new Date(`${app.appointment_date}T${app.appointment_time}`);
      return appDateTime >= now;
    });
    scheduled.sort((a, b) => new Date(`${a.appointment_date}T${a.appointment_time}`) - new Date(`${b.appointment_date}T${b.appointment_time}`));
    
    return scheduled.slice(0, 3).map(app => {
      const date = new Date(app.appointment_date);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: months[date.getMonth()],
        day: date.getDate().toString(),
        treatment: app.Treatment?.treatment_name || 'Routine Checkup',
        dentist: app.Dentist ? `Dr. ${app.Dentist.first_name} ${app.Dentist.last_name}` : 'Dentist',
        time: `${formatTime(app.appointment_time)} (${app.duration || 30} mins)`,
      };
    });
  }, [appointments]);

  const recentActivities = useMemo(() => {
    // Show recent dental records
    const sortedRecords = [...records];
    sortedRecords.sort((a, b) => new Date(b.record_date) - new Date(a.record_date));
    
    return sortedRecords.slice(0, 3).map(rec => ({
      icon: 'medical_information',
      title: rec.condition || 'Dental Care Visit',
      date: formatDate(rec.record_date),
      description: rec.notes || 'Treatment completed successfully.',
      tags: [
        rec.Dentist ? `Dr. ${rec.Dentist.first_name}` : 'Dentist',
        rec.tooth ? `Tooth ${rec.tooth}` : null
      ].filter(Boolean),
    }));
  }, [records]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex flex-col justify-center items-center font-body-base text-on-surface">
        <span className="material-symbols-outlined text-primary text-[48px] animate-spin mb-4">
          progress_activity
        </span>
        <p className="text-body-lg">Loading your portal...</p>
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
    <div className="bg-surface text-on-surface font-body-base text-body-base antialiased min-h-screen flex flex-col">
      <PatientNavbar />

      <main className="flex-grow pt-32 pb-xl px-5 md:px-xl max-w-[1200px] mx-auto w-full">
        <header className="mb-xl">
          <h1 className="text-headline-lg font-headline-lg text-primary mb-2">
            Welcome back, {firstName}!
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant">
            Your smile is looking great. Here is your latest dental health summary.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-xl">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_0_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_0_rgba(0,0,0,0.08)] transition-shadow duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {card.icon}
                  </span>
                </div>
                {card.badge && (
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-caption font-label-bold">
                    {card.badge}
                  </span>
                )}
              </div>

              <h3 className="text-caption font-label-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                {card.label}
              </h3>
              <p className="text-headline-md font-headline-md text-on-surface mb-3">{card.title}</p>

              {card.details && (
                <div className="text-body-base text-on-surface-variant flex flex-col gap-1">
                  {card.details.map((detail) => (
                    <span key={detail.text} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">{detail.icon}</span>
                      {detail.text}
                    </span>
                  ))}
                </div>
              )}

              {card.action && (
                <button 
                  onClick={() => navigate('/patient/billing')}
                  className="w-full bg-primary text-on-primary font-label-bold py-3 rounded-full hover:bg-surface-tint transition-colors mt-2"
                >
                  {card.action}
                </button>
              )}

              {card.link && (
                <button 
                  onClick={() => navigate('/patient/records')}
                  className="font-label-bold text-primary flex items-center gap-1 hover:underline mt-2"
                >
                  {card.link}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              )}
            </article>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <aside className="lg:col-span-1 flex flex-col gap-8">
            <section>
              <h2 className="text-headline-md font-headline-md text-primary mb-6">Quick Actions</h2>
              <div className="flex flex-col gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 flex items-center justify-between hover:border-primary hover:text-primary transition-colors group shadow-[0_4px_20px_0_rgba(0,0,0,0.04)]"
                  >
                    <span className="font-label-bold flex items-center gap-3">
                      <span className="material-symbols-outlined text-tertiary group-hover:text-primary transition-colors">
                        {action.icon}
                      </span>
                      {action.label}
                    </span>
                    <span className="material-symbols-outlined text-tertiary group-hover:text-primary transition-colors">
                      chevron_right
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <div className="lg:col-span-2 flex flex-col gap-8">
            <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-[0_4px_20px_0_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-headline-md font-headline-md text-primary">Upcoming Appointments</h2>
              </div>

              <div className="flex flex-col">
                {upcomingAppointments.length === 0 ? (
                  <div className="text-on-surface-variant text-center py-6">No upcoming appointments.</div>
                ) : (
                  upcomingAppointments.map((appointment, idx) => (
                    <div
                      key={idx}
                      className="py-4 border-b border-surface-container-highest last:border-0 flex items-center justify-between hover:bg-surface-bright transition-colors rounded-lg px-2 -mx-2"
                    >
                      <div className="flex items-start gap-4">
                        <div className="bg-surface-container-high rounded-lg p-3 text-center min-w-[70px]">
                          <div className="text-caption text-on-surface-variant uppercase">{appointment.month}</div>
                          <div className="text-headline-md font-headline-md text-primary">{appointment.day}</div>
                        </div>
                        <div>
                          <h4 className="font-label-bold text-on-surface mb-1">{appointment.treatment}</h4>
                          <p className="text-body-base text-on-surface-variant mb-1">{appointment.dentist}</p>
                          <div className="flex items-center gap-2 text-caption text-tertiary">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            {appointment.time}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate('/patient/appointments')}
                          aria-label="Manage Appointment"
                          className="p-2 text-tertiary hover:bg-surface-container-high rounded-full transition-colors"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-[0_4px_20px_0_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-center mb-6 gap-4">
                <h2 className="text-headline-md font-headline-md text-primary">Recent Activity</h2>
                <button
                  onClick={() => navigate('/patient/records')}
                  className="font-label-bold text-primary hover:underline flex items-center gap-1"
                >
                  View full records
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {recentActivities.length === 0 ? (
                  <div className="text-on-surface-variant text-center py-6">No recent dental activities.</div>
                ) : (
                  recentActivities.map((activity, idx) => (
                    <article
                      key={idx}
                      className="bg-surface-bright border border-surface-container-highest rounded-lg p-4 flex items-start gap-4"
                    >
                      <div className="mt-1 w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                        <span className="material-symbols-outlined text-[18px]">{activity.icon}</span>
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start gap-4 mb-1">
                          <h4 className="font-label-bold text-on-surface">{activity.title}</h4>
                          <span className="text-caption text-on-surface-variant whitespace-nowrap">{activity.date}</span>
                        </div>
                        <p className="text-body-base text-on-surface-variant mb-2">{activity.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {activity.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-surface-container-high text-on-surface px-2 py-1 rounded text-caption font-label-bold"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PatientPortal;
