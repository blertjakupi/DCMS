import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { navigate('/login'); return; }
    try { setUser(JSON.parse(userData)); }
    catch { localStorage.clear(); navigate('/login'); }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  const displayName = user.full_name || 'Doctor';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const navItems = [
    { label: 'Dashboard', icon: 'dashboard', active: true },
    { label: 'Appointments', icon: 'calendar_today' },
    { label: 'Patients', icon: 'group' },
    { label: 'Dental Records', icon: 'folder_shared' },
    { label: 'Treatments', icon: 'medical_services' },
    { label: 'Inventory', icon: 'inventory_2' },
    { label: 'Billing & Invoices', icon: 'receipt_long' },
    { label: 'Dentists', icon: 'person_search' },
    { label: 'Reminders', icon: 'notifications_active' },
  ];

  const schedule = [
    { time: '09:00 AM', patient: 'John Doe', treatment: 'Routine Checkup', status: 'Completed' },
    { time: '10:30 AM', patient: 'Emily Chen', treatment: 'Root Canal', status: 'Next Up' },
    { time: '11:45 AM', patient: 'Michael Chang', treatment: 'Teeth Whitening', status: 'Confirmed' },
    { time: '01:00 PM', patient: 'Sarah Williams', treatment: 'Orthodontic Consult', status: 'Pending' },
  ];

  const queue = [
    { initials: 'EC', name: 'Emily Chen', location: 'Waiting Room A', time: '10:30 AM', wait: '15m wait', active: true },
    { initials: 'MC', name: 'Michael Chang', location: 'Reception', time: '11:45 AM', active: false },
    { initials: 'SW', name: 'Sarah Williams', location: 'Not Arrived', time: '01:00 PM', active: false, dim: true },
  ];

  const records = [
    { initials: 'AJ', name: 'Alex Johnson', lastVisit: 'Oct 12, 2024', treatment: 'Cavity Filling', color: 'bg-tertiary-container/30 text-on-tertiary-container' },
    { initials: 'DP', name: 'David Palmer', lastVisit: 'Oct 10, 2024', treatment: 'Crown Installation', color: 'bg-secondary-container/50 text-on-secondary-container' },
    { initials: 'MR', name: 'Maria Rodriguez', lastVisit: 'Oct 08, 2024', treatment: 'Annual Cleaning', color: 'bg-primary-container/30 text-on-primary-container' },
  ];

  const statusStyles = {
    'Completed': 'bg-surface-container-highest text-on-surface-variant',
    'Next Up': 'bg-primary-container/20 text-on-primary-container border border-primary-container/30',
    'Confirmed': 'bg-secondary-container/50 text-on-secondary-container',
    'Pending': 'bg-error-container/50 text-on-error-container',
  };

  return (
    <div className="bg-background text-on-background font-body-base antialiased flex h-screen overflow-hidden">

      {/* Sidebar */}
      <nav className="bg-surface-container-low h-screen w-64 fixed left-0 top-0 hidden md:flex flex-col h-full py-md px-sm overflow-y-auto border-r border-outline-variant/30 z-50">
        <div className="mb-lg px-sm">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">dentistry</span>
            </div>
            <div>
              <h1 className="text-headline-md font-headline-md font-bold text-primary">DentaCare Pro</h1>
              <p className="text-caption font-caption text-on-surface-variant">Clinic Management</p>
            </div>
          </div>
        </div>

        <ul className="flex-1 space-y-unit">
          {navItems.map((item) => (
            <li key={item.label}>
              <a href="#" className={`flex items-center gap-sm px-sm py-sm rounded-lg transition-colors duration-200 ${
                item.active
                  ? 'bg-primary text-on-primary font-label-bold'
                  : 'text-on-surface-variant font-body-base hover:bg-surface-container-high'
              }`}>
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-md space-y-2">
          <button className="w-full bg-primary text-on-primary font-label-bold py-sm px-md rounded-full hover:bg-primary-fixed-dim transition-colors duration-200 shadow-sm flex items-center justify-center gap-xs">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Appointment
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-sm px-sm py-sm text-error hover:bg-error-container rounded-lg transition-colors duration-200">
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <div className="ml-0 md:ml-64 flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
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

        {/* Main Canvas */}
        <main className="flex-1 overflow-y-auto mt-16 p-gutter pb-xl bg-background">

          {/* Header */}
          <div className="mb-lg">
            <h2 className="text-headline-lg font-headline-lg text-on-background mb-unit">Good morning, Dr. {displayName}</h2>
            <p className="text-body-lg font-body-lg text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              {today}
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-lg">
            <div className="bg-surface-container-lowest rounded-[24px] p-md shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-surface-container-highest/50 flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container mb-sm">
                <span className="material-symbols-outlined">calendar_today</span>
              </div>
              <div>
                <p className="text-caption font-caption text-on-surface-variant mb-unit uppercase tracking-wider">Today's Appointments</p>
                <p className="text-headline-lg font-headline-lg text-on-background">12</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-[24px] p-md shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-surface-container-highest/50 flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-secondary-container/50 flex items-center justify-center text-on-secondary-container mb-sm">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <div>
                <p className="text-caption font-caption text-on-surface-variant mb-unit uppercase tracking-wider">Patients Seen</p>
                <p className="text-headline-lg font-headline-lg text-on-background">8</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-[24px] p-md shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-surface-container-highest/50 flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-error-container/50 flex items-center justify-center text-on-error-container mb-sm">
                <span className="material-symbols-outlined">assignment_late</span>
              </div>
              <div>
                <p className="text-caption font-caption text-on-surface-variant mb-unit uppercase tracking-wider">Pending Records</p>
                <p className="text-headline-lg font-headline-lg text-on-background">5</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-[24px] p-md shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-surface-container-highest/50 flex flex-col justify-between relative overflow-hidden hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent pointer-events-none"></div>
              <div className="flex justify-between items-start mb-sm relative z-10">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <span className="text-caption font-label-bold text-primary bg-primary-container/20 px-2 py-1 rounded-full">In 15m</span>
              </div>
              <div className="relative z-10">
                <p className="text-caption font-caption text-on-surface-variant mb-unit uppercase tracking-wider">Next Appointment</p>
                <p className="text-headline-md font-headline-md text-on-background">10:30 AM</p>
              </div>
            </div>
          </div>

          {/* Schedule + Queue */}
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
                    {schedule.map((row) => (
                      <tr key={row.time} className={`hover:bg-surface-container-lowest transition-colors ${row.status === 'Next Up' ? 'bg-primary-container/5' : ''}`}>
                        <td className={`py-md whitespace-nowrap font-label-bold ${row.status === 'Next Up' ? 'text-primary' : 'text-on-surface-variant'}`}>{row.time}</td>
                        <td className="py-md font-semibold text-on-background">
                          <div className="flex items-center gap-2">
                            {row.patient}
                            {row.status === 'Next Up' && <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>}
                          </div>
                        </td>
                        <td className="py-md text-on-surface-variant">{row.treatment}</td>
                        <td className="py-md text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-label-bold ${statusStyles[row.status]}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-4 bg-surface-container-lowest rounded-[24px] p-md md:p-lg shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-surface-container-highest/30 flex flex-col">
              <div className="flex items-center justify-between mb-md">
                <h3 className="text-headline-md font-headline-md text-on-background">Patient Queue</h3>
                <span className="bg-surface-container-highest text-on-surface-variant text-xs px-2 py-1 rounded-full font-label-bold">3 Waiting</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-sm">
                {queue.map((p) => (
                  <div key={p.name} className={`flex items-center gap-sm p-sm rounded-xl border transition-colors cursor-pointer ${
                    p.active ? 'border-primary/20 bg-primary/5 hover:bg-primary/10' : 'border-outline-variant/20 hover:bg-surface-container-highest'
                  } ${p.dim ? 'opacity-70' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-label-bold text-sm shadow-sm ${
                      p.active ? 'bg-primary text-on-primary' : p.dim ? 'bg-surface-container-high text-on-surface-variant' : 'bg-secondary-container text-on-secondary-container'
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
                ))}
              </div>
            </div>
          </div>

          {/* Recent Records */}
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
                  {records.map((r) => (
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
                  ))}
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