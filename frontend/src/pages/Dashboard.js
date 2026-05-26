import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DentistSidebar from '../components/DentistSidebar';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const getStatusStyle = (status) => {
  const map = {
    Scheduled: 'bg-surface-container-highest text-on-surface-variant',
    Completed: 'bg-primary-container/20 text-on-primary-container',
    Cancelled: 'bg-surface-container-highest text-on-surface-variant line-through',
    'No-Show': 'bg-error-container/50 text-on-error-container',
  };
  return map[status] || 'bg-surface-container-highest text-on-surface-variant';
};

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dentist, setDentist] = useState(null);
  const [todayAppointmentsCount, setTodayAppointmentsCount] = useState(0);
  const [patientsSeenCount, setPatientsSeenCount] = useState(0);
  const [pendingRecordsCount, setPendingRecordsCount] = useState(0);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [patientQueue, setPatientQueue] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const loadDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/dentists/dashboard', { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to load dashboard');
        const data = await res.json();

        setDentist(data.dentist);
        setTodayAppointmentsCount(data.stats.todayAppointmentsCount);
        setPatientsSeenCount(data.stats.patientsSeenCount);
        setPendingRecordsCount(data.stats.pendingRecordsCount);

        if (data.nextAppointment) {
          setNextAppointment({
            appointment_time: data.nextAppointment.time,
            Patient: {
              first_name: data.nextAppointment.patient_name.split(' ')[0],
              last_name: data.nextAppointment.patient_name.split(' ').slice(1).join(' ') || ''
            }
          });
        } else {
          setNextAppointment(null);
        }

        setTodaySchedule(data.schedule);
        setPatientQueue(data.queue);
        setRecentRecords(data.recentRecords);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const displayName = dentist?.first_name ? `${dentist.first_name} ${dentist.last_name}` : (user.full_name || 'Doctor');
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-error text-center">Error: {error}</div>;

  return (
    <div className="bg-background text-on-background font-body-base antialiased flex h-screen overflow-hidden">
      <DentistSidebar />

      <div className="ml-0 md:ml-64 flex-1 flex flex-col min-w-0">
        <header className="bg-surface/80 backdrop-blur-md shadow-sm fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-16 flex items-center justify-between px-gutter z-40">
          <div className="flex items-center flex-1">
            <div className="relative w-full max-w-md hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input className="w-full pl-10 pr-4 py-2 bg-surface-container-highest border-none rounded-full text-body-base focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all" placeholder="Search patients, records..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-sm">
            <button className="w-10 h-10 rounded-full hover:bg-surface-container-highest transition-all flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="w-10 h-10 rounded-full hover:bg-surface-container-highest transition-all flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            <button className="w-10 h-10 rounded-full hover:bg-surface-container-highest transition-all flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-on-primary font-bold shadow-sm cursor-pointer">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto mt-16 p-gutter pb-xl bg-background">
          <div className="mb-lg">
            <h2 className="text-headline-lg font-headline-lg text-on-background mb-unit">Good morning, Dr. {displayName}</h2>
            <p className="text-body-lg font-body-lg text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              {todayStr}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-lg">
            <div className="bg-surface-container-lowest rounded-[24px] p-md shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-surface-container-highest/50 flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container mb-sm">
                <span className="material-symbols-outlined">calendar_today</span>
              </div>
              <div>
                <p className="text-caption font-caption text-on-surface-variant mb-unit uppercase tracking-wider">Today's Appointments</p>
                <p className="text-headline-lg font-headline-lg text-on-background">{todayAppointmentsCount}</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-[24px] p-md shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-surface-container-highest/50 flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-secondary-container/50 flex items-center justify-center text-on-secondary-container mb-sm">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <div>
                <p className="text-caption font-caption text-on-surface-variant mb-unit uppercase tracking-wider">Patients Seen</p>
                <p className="text-headline-lg font-headline-lg text-on-background">{patientsSeenCount}</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-[24px] p-md shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-surface-container-highest/50 flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-error-container/50 flex items-center justify-center text-on-error-container mb-sm">
                <span className="material-symbols-outlined">assignment_late</span>
              </div>
              <div>
                <p className="text-caption font-caption text-on-surface-variant mb-unit uppercase tracking-wider">Pending Records</p>
                <p className="text-headline-lg font-headline-lg text-on-background">{pendingRecordsCount}</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-[24px] p-md shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-surface-container-highest/50 flex flex-col justify-between relative overflow-hidden hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent pointer-events-none"></div>
              <div className="flex justify-between items-start mb-sm relative z-10">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                {nextAppointment && (
                  <span className="text-caption font-label-bold text-primary bg-primary-container/20 px-2 py-1 rounded-full">
                    In {Math.max(0, Math.ceil((new Date(`${nextAppointment.appointment_date}T${nextAppointment.appointment_time}`) - new Date()) / 60000))}m
                  </span>
                )}
              </div>
              <div className="relative z-10">
                <p className="text-caption font-caption text-on-surface-variant mb-unit uppercase tracking-wider">Next Appointment</p>
                <p className="text-headline-md font-headline-md text-on-background">{nextAppointment ? formatTime(nextAppointment.appointment_time) : 'None'}</p>
                {nextAppointment && <p className="text-caption text-on-surface-variant">{nextAppointment.Patient?.first_name} {nextAppointment.Patient?.last_name}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-lg">
            <div className="lg:col-span-8 bg-surface-container-lowest rounded-[24px] p-md md:p-lg shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-surface-container-highest/30">
              <div className="flex items-center justify-between mb-md">
                <h3 className="text-headline-md font-headline-md text-on-background">Today's Schedule</h3>
                <button className="text-primary font-label-bold hover:underline text-sm">View Full Calendar</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">
                      <th className="pb-sm font-semibold">Time</th>
                      <th className="pb-sm font-semibold">Patient Name</th>
                      <th className="pb-sm font-semibold">Treatment Type</th>
                      <th className="pb-sm font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-body-base divide-y divide-outline-variant/20">
                    {todaySchedule.length === 0 ? (
                      <tr><td colSpan="4" className="py-4 text-center text-on-surface-variant">No appointments today</td></tr>
                    ) : (
                      todaySchedule.map((appt) => (
                        <tr key={appt.appointment_id} className="hover:bg-surface-container-lowest transition-colors">
                          <td className="py-md whitespace-nowrap font-label-bold text-on-surface-variant">{formatTime(appt.appointment_time)}</td>
                          <td className="py-md font-semibold text-on-background">{appt.patient_name}</td>
                          <td className="py-md text-on-surface-variant">{appt.treatment_name}</td>
                          <td className="py-md text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-label-bold ${getStatusStyle(appt.status)}`}>
                              {appt.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-4 bg-surface-container-lowest rounded-[24px] p-md md:p-lg shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-surface-container-highest/30 flex flex-col">
              <div className="flex items-center justify-between mb-md">
                <h3 className="text-headline-md font-headline-md text-on-background">Patient Queue</h3>
                <span className="bg-surface-container-highest text-on-surface-variant text-xs px-2 py-1 rounded-full font-label-bold">{patientQueue.length} Waiting</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-sm">
                {patientQueue.length === 0 ? (
                  <div className="text-center text-on-surface-variant py-4">No patients waiting</div>
                ) : (
                  patientQueue.map((p, idx) => (
                    <div key={idx} className={`flex items-center gap-sm p-sm rounded-xl border transition-colors cursor-pointer ${
                      p.active ? 'border-primary/20 bg-primary/5 hover:bg-primary/10' : 'border-outline-variant/20 hover:bg-surface-container-highest'
                    }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-label-bold text-sm shadow-sm ${
                        p.active ? 'bg-primary text-on-primary' : 'bg-secondary-container text-on-secondary-container'
                      }`}>
                        {p.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-base font-semibold text-on-background truncate">{p.name}</p>
                        <p className="text-caption text-on-surface-variant truncate">{p.location}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-caption font-label-bold ${p.active ? 'text-primary' : 'text-on-surface-variant'}`}>{p.time}</p>
                        {p.wait && <p className="text-[10px] text-on-surface-variant">{p.wait}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-[24px] p-md md:p-lg shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-surface-container-highest/30">
            <div className="flex items-center justify-between mb-md">
              <h3 className="text-headline-md font-headline-md text-on-background">Recent Patient Records</h3>
              <button className="flex items-center gap-xs text-primary font-label-bold hover:bg-primary-container/10 px-3 py-1.5 rounded-lg transition-colors text-sm">
                View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="pb-sm font-semibold pl-2">Patient Name</th>
                    <th className="pb-sm font-semibold">Last Visit</th>
                    <th className="pb-sm font-semibold">Treatment</th>
                    <th className="pb-sm font-semibold text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="text-body-base divide-y divide-outline-variant/10">
                  {recentRecords.length === 0 ? (
                    <tr><td colSpan="4" className="py-4 text-center text-on-surface-variant">No records yet</td></tr>
                  ) : (
                    recentRecords.map((r) => (
                      <tr key={r.name} className="hover:bg-surface-container-highest/50 transition-colors">
                        <td className="py-sm pl-2 font-semibold text-on-background">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${r.color}`}>{r.initials}</div>
                            {r.name}
                          </div>
                        </td>
                        <td className="py-sm text-on-surface-variant">{r.lastVisit}</td>
                        <td className="py-sm text-on-surface-variant">{r.treatment}</td>
                        <td className="py-sm text-right pr-2">
                          <button className="text-primary font-label-bold text-sm px-3 py-1 rounded border border-primary/20 hover:bg-primary/5 transition-all">View</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;