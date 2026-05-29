import AdminSidebar from '../components/AdminSidebar';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderActions from '../components/HeaderActions';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const toDateOnly = (date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const getMonthRange = (offset = 0) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = offset === 0
    ? now
    : new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);

  return {
    from: toDateOnly(start),
    to: toDateOnly(end),
  };
};

const isDateWithinRange = (value, range) => {
  if (!value) return false;
  const date = toDateOnly(new Date(value));
  return date >= range.from && date <= range.to;
};

const getTrend = (current, previous, label = 'vs last month') => {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);

  if (previousValue === 0 && currentValue === 0) {
    return {
      text: `0% ${label}`,
      icon: 'trending_flat',
      color: 'text-on-surface-variant',
    };
  }

  if (previousValue === 0) {
    return {
      text: `New growth ${label}`,
      icon: 'trending_up',
      color: 'text-primary',
    };
  }

  const percent = ((currentValue - previousValue) / previousValue) * 100;
  const formatted = `${percent > 0 ? '+' : ''}${percent.toFixed(1)}% ${label}`;

  if (percent > 0) {
    return { text: formatted, icon: 'trending_up', color: 'text-primary' };
  }

  if (percent < 0) {
    return { text: formatted, icon: 'trending_down', color: 'text-error' };
  }

  return { text: formatted, icon: 'trending_flat', color: 'text-on-surface-variant' };
};

const getAppointmentDateTime = (appointment) => {
  if (!appointment?.appointment_date || !appointment?.appointment_time) return null;
  const time = String(appointment.appointment_time).slice(0, 5);
  const dateTime = new Date(`${appointment.appointment_date}T${time}:00`);
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
};

const getAppointmentTrend = (appointments) => {
  if (!appointments.length) {
    return {
      text: 'No appointments today',
      icon: 'event_busy',
      color: 'text-on-surface-variant',
    };
  }

  const now = new Date();
  const nextAppointment = appointments
    .map(getAppointmentDateTime)
    .filter((date) => date && date >= now)
    .sort((a, b) => a - b)[0];

  if (!nextAppointment) {
    return {
      text: 'No upcoming appointments',
      icon: 'event_available',
      color: 'text-on-surface-variant',
    };
  }

  const minutesUntil = Math.max(0, Math.round((nextAppointment - now) / 60000));

  if (minutesUntil < 1) {
    return {
      text: 'Next appointment now',
      icon: 'schedule',
      color: 'text-primary',
    };
  }

  if (minutesUntil < 60) {
    return {
      text: `Next in ${minutesUntil} min`,
      icon: 'schedule',
      color: 'text-primary',
    };
  }

  const hours = Math.floor(minutesUntil / 60);
  const minutes = minutesUntil % 60;

  return {
    text: `Next in ${hours}h${minutes ? ` ${minutes}m` : ''}`,
    icon: 'schedule',
    color: 'text-primary',
  };
};

const initialsFromName = (name) => {
  if (!name) return '??';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  const [totalPatients, setTotalPatients] = useState(0);
  const [revenueThisMonth, setRevenueThisMonth] = useState(0);
  const [activeDentists, setActiveDentists] = useState(0);
  const [appointmentsToday, setAppointmentsToday] = useState(0);
  const [patientTrend, setPatientTrend] = useState(getTrend(0, 0, 'new vs last month'));
  const [revenueTrend, setRevenueTrend] = useState(getTrend(0, 0));
  const [appointmentTrend, setAppointmentTrend] = useState(getAppointmentTrend([]));


  const [recentUsers, setRecentUsers] = useState([]);
  const [headerSearch, setHeaderSearch] = useState('');

  
  const [alerts, setAlerts] = useState([]);

 const loadDashboardData = useCallback(async () => {
  setLoading(true);
  setError('');

  try {
    const fetchJson = async (url) => {
      const res = await fetch(url, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Failed: ${url}`);
      return json;
    };

    const today = toDateOnly(new Date());
    const currentMonth = getMonthRange();
    const previousMonth = getMonthRange(-1);

    const results = await Promise.allSettled([
      fetchJson('/api/patients/count'),
      fetchJson('/api/dentists/count'),
      fetchJson(`/api/appointments/count?date=${today}&status=Scheduled`),
      fetchJson(`/api/payments/sum?from=${currentMonth.from}&to=${currentMonth.to}`),
      fetchJson('/api/users?limit=1000&sort=-created_at'),
      fetchJson('/api/inventory-items?limit=1000'),
      fetchJson('/api/invoices?limit=1000'),
      fetchJson('/api/reminders?limit=1000'),
      fetchJson(`/api/payments/sum?from=${previousMonth.from}&to=${previousMonth.to}`),
      fetchJson('/api/appointments'),
    ]);

    const getValue = (result, defaultValue) => result.status === 'fulfilled' ? result.value : defaultValue;

    const patientCount = getValue(results[0], { count: 0 });
    const dentistCount = getValue(results[1], { count: 0 });
    const appointmentCount = getValue(results[2], { count: 0 });
    const revenueSum = getValue(results[3], { total: 0 });
    const usersData = getValue(results[4], { data: [] });
    const inventoryData = getValue(results[5], { data: [] });
    const invoicesData = getValue(results[6], { data: [] });
    const remindersData = getValue(results[7], { data: [] });
    const previousRevenueSum = getValue(results[8], { total: 0 });
    const appointmentsData = getValue(results[9], { data: [] });

    setTotalPatients(patientCount.count);
    setActiveDentists(dentistCount.count);
    setAppointmentsToday(appointmentCount.count);
    setRevenueThisMonth(revenueSum.total);

    const users = usersData.data || [];
    const patientUsers = users.filter((user) =>
      (user.Role?.normalized_name || user.Role?.role_name || '').toUpperCase() === 'PATIENT'
    );
    const currentPatientRegistrations = patientUsers.filter((user) => isDateWithinRange(user.created_at, currentMonth)).length;
    const previousPatientRegistrations = patientUsers.filter((user) => isDateWithinRange(user.created_at, previousMonth)).length;
    const todayAppointments = (appointmentsData.data || [])
      .filter((appointment) =>
        appointment.appointment_date === today &&
        appointment.status === 'Scheduled'
      )
      .sort((a, b) => {
        const first = getAppointmentDateTime(a);
        const second = getAppointmentDateTime(b);
        return (first?.getTime() || 0) - (second?.getTime() || 0);
      });

    setPatientTrend(getTrend(currentPatientRegistrations, previousPatientRegistrations, 'new vs last month'));
    setRevenueTrend(getTrend(revenueSum.total, previousRevenueSum.total));
    setAppointmentTrend(getAppointmentTrend(todayAppointments));

    const registrations = [...users].slice(0, 5).map(user => ({
      user_id: user.user_id,
      initials: initialsFromName(`${user.first_name} ${user.last_name}`),
      name: `${user.first_name} ${user.last_name}`,
      role: user.Role?.role_name || (user.roles && user.roles[0]) || 'User',
      email: user.email,
      date: formatDate(user.created_at),
      active: user.status === 'Active' && !user.is_deleted,
      avatarBg: user.status === 'Active'
        ? 'bg-primary-container text-on-primary-container'
        : 'bg-surface-container-high text-on-surface-variant',
    }));
    setRecentUsers(registrations);

    const alertsArray = [];
    const inventory = inventoryData.data || [];
    const lowStockItems = inventory.filter(item => (item.quantity || 0) < 10);
    if (lowStockItems.length > 0) {
      alertsArray.push({
        icon: 'inventory_2',
        title: 'Low Inventory Warning',
        desc: `${lowStockItems.length} item(s) low on stock. Reorder recommended.`,
        action: 'Order Now',
        path: '/admin/inventory',
        actionColor: 'text-primary',
        bg: 'bg-surface-container-low border-surface-variant',
        iconBg: 'bg-secondary-container text-on-secondary-container',
      });
    }

    const invoices = invoicesData.data || [];
    const overdue = invoices.filter(inv => inv.status === 'Unpaid' && inv.invoice_date < today);
    if (overdue.length > 0) {
      alertsArray.push({
        icon: 'receipt_long',
        title: 'Overdue Invoice',
        desc: `${overdue.length} invoice(s) past due. Total: ${formatCurrency(overdue.reduce((s, i) => s + Number(i.total_amount), 0))}`,
        action: 'View Details',
        path: '/admin/billing',
        actionColor: 'text-error',
        bg: 'bg-error-container/30 border-error-container',
        iconBg: 'bg-error-container text-error',
      });
    }

    const reminders = remindersData.data || [];
    const failedReminders = reminders.filter(r => r.status === 'Failed');
    if (failedReminders.length > 0) {
      alertsArray.push({
        icon: 'sms_failed',
        title: 'Failed Reminder Delivery',
        desc: `${failedReminders.length} reminder(s) failed to send. Check contact details.`,
        action: 'Update Contact',
        path: '/admin/reminders',
        actionColor: 'text-primary',
        bg: 'bg-surface-container-low border-surface-variant',
        iconBg: 'bg-surface-container-highest text-on-surface-variant',
      });
    }

    setAlerts(alertsArray);
  } catch (err) {
    console.error(err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, []); 

useEffect(() => {
  loadDashboardData();
}, [loadDashboardData]); 

  const filteredRecentUsers = recentUsers.filter((item) => {
    const query = headerSearch.trim().toLowerCase();
    return !query ||
      item.name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.role.toLowerCase().includes(query);
  });

 
  const kpis = [
    {
      label: 'Total Patients',
      value: loading ? '...' : totalPatients.toLocaleString(),
      trend: patientTrend.text,
      trendIcon: patientTrend.icon,
      trendColor: patientTrend.color,
      icon: 'groups',
      iconColor: 'text-primary',
      glowColor: 'bg-primary-container/20',
      hoverBorder: 'hover:border-primary-container',
    },
    {
      label: 'Total Revenue This Month',
      value: loading ? '...' : formatCurrency(revenueThisMonth),
      trend: revenueTrend.text,
      trendIcon: revenueTrend.icon,
      trendColor: revenueTrend.color,
      icon: 'account_balance_wallet',
      iconColor: 'text-tertiary',
      glowColor: 'bg-tertiary-container/20',
      hoverBorder: 'hover:border-tertiary-container',
    },
    {
      label: 'Active Dentists',
      value: loading ? '...' : activeDentists,
      trend: 'All shifts covered',
      trendIcon: 'check_circle',
      trendColor: 'text-on-surface-variant',
      icon: 'medical_information',
      iconColor: 'text-secondary',
      glowColor: 'bg-secondary-container/20',
      hoverBorder: 'hover:border-secondary-container',
    },
    {
      label: 'Appointments Today',
      value: loading ? '...' : appointmentsToday,
      trend: appointmentTrend.text,
      trendIcon: appointmentTrend.icon,
      trendColor: appointmentTrend.color,
      icon: 'event_available',
      iconColor: 'text-primary',
      glowColor: 'bg-primary-container/20',
      hoverBorder: 'hover:border-primary-container',
    },
  ];

  return (
    <div className="font-body-base text-body-base text-on-background h-screen overflow-hidden flex">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        {/* Top Bar (unchanged) */}
        <header className="bg-surface fixed top-0 right-0 left-0 md:left-64 h-16 z-10 flex justify-between items-center px-6 shadow-sm border-b border-surface-variant hidden md:flex">
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative rounded-full bg-surface-container-low flex items-center px-4 py-2 border border-outline-variant focus-within:border-primary focus-within:bg-surface-container-lowest transition-colors clinical-glow">
              <span className="material-symbols-outlined text-outline mr-2">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-[15px] text-on-surface w-full placeholder:text-outline p-0 focus:outline-none"
                placeholder="Search patients, dentists, or records..."
                type="text"
                value={headerSearch}
                onChange={(event) => setHeaderSearch(event.target.value)}
              />
            </div>
          </div>
          <HeaderActions />
        </header>

        {/* Main Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 mt-16 pb-24 md:pb-6 bg-background">
          {/* Page Header (static) */}
          <div className="mb-8">
            <h2 className="text-[32px] font-bold text-on-surface">Admin Overview</h2>
            <p className="text-[16px] text-on-surface-variant mt-1">Clinic-wide management and system health.</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className={`bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-surface-variant relative overflow-hidden group ${kpi.hoverBorder} transition-colors duration-300`}
              >
                <div className={`absolute -right-4 -top-4 w-24 h-24 ${kpi.glowColor} rounded-full blur-2xl transition-all duration-300`}></div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="text-[14px] font-semibold text-on-surface-variant">{kpi.label}</span>
                  <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center">
                    <span className={`material-symbols-outlined ${kpi.iconColor}`}>{kpi.icon}</span>
                  </div>
                </div>
                <div className="relative z-10">
                  <span className="text-[32px] font-bold text-on-surface">{kpi.value}</span>
                  <div className={`flex items-center mt-2 ${kpi.trendColor} text-[12px] font-semibold`}>
                    <span className="material-symbols-outlined text-[16px] mr-1">{kpi.trendIcon}</span>
                    <span>{kpi.trend}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Registrations Table */}
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-surface-variant overflow-hidden flex flex-col">
              <div className="p-6 border-b border-surface-variant flex justify-between items-center bg-surface">
                <h3 className="text-[24px] font-semibold text-on-surface">Recent Registrations</h3>
                <button
                  className="text-primary hover:text-on-primary-fixed-variant text-[14px] font-semibold flex items-center gap-1 transition-colors"
                  onClick={() => navigate('/admin/users')}
                >
                  View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
              <div className="overflow-x-auto flex-1">
                {error && <div className="p-4 text-error">Error loading registrations: {error}</div>}
                {loading ? (
                  <div className="p-4 text-on-surface-variant">Loading registrations...</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-surface-variant text-on-surface-variant text-[12px] font-semibold uppercase tracking-wider">
                        <th className="p-4 whitespace-nowrap">Name</th>
                        <th className="p-4 whitespace-nowrap">Role</th>
                        <th className="p-4 whitespace-nowrap hidden sm:table-cell">Email</th>
                        <th className="p-4 whitespace-nowrap hidden md:table-cell">Date Joined</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 whitespace-nowrap text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant text-[15px]">
                      {filteredRecentUsers.map((user) => (
                        <tr key={user.user_id} className="hover:bg-surface-container-low transition-colors">
                          <td className="p-4 font-semibold text-on-surface">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full ${user.avatarBg} flex items-center justify-center text-[12px] font-semibold shrink-0`}>
                                {user.initials}
                              </div>
                              {user.name}
                            </div>
                          </td>
                          <td className="p-4 text-on-surface-variant">{user.role}</td>
                          <td className="p-4 text-on-surface-variant hidden sm:table-cell">{user.email}</td>
                          <td className="p-4 text-on-surface-variant hidden md:table-cell">{user.date}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.active
                                ? 'bg-primary-container text-on-primary-container'
                                : 'bg-surface-container-high text-on-surface-variant'
                            }`}>
                              {user.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              className="text-outline hover:text-primary p-1 rounded hover:bg-surface-container-low transition-colors"
                              title="Edit"
                              onClick={() => navigate('/admin/users')}
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              className="text-outline hover:text-error p-1 rounded hover:bg-error-container transition-colors"
                              title="Deactivate"
                              onClick={() => navigate('/admin/users')}
                            >
                              <span className="material-symbols-outlined text-[20px]">block</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredRecentUsers.length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-4 text-center text-on-surface-variant">No recent registrations</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* System Alerts */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-surface-variant flex flex-col">
              <div className="p-6 border-b border-surface-variant bg-surface flex items-center justify-between">
                <h3 className="text-[24px] font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-error">warning</span>
                  System Alerts
                </h3>
                <span className="bg-error-container text-on-error-container text-[12px] font-bold px-2 py-1 rounded-full">{alerts.length}</span>
              </div>
              <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                {loading ? (
                  <div className="text-on-surface-variant">Loading alerts...</div>
                ) : alerts.length === 0 ? (
                  <div className="text-center text-on-surface-variant py-6">No active alerts</div>
                ) : (
                  alerts.map((alert, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${alert.bg} hover:brightness-95 transition-all flex gap-4 items-start`}>
                      <div className={`w-10 h-10 rounded-full ${alert.iconBg} flex items-center justify-center shrink-0 mt-1`}>
                        <span className="material-symbols-outlined">{alert.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-[14px] font-semibold text-on-surface">{alert.title}</h4>
                        <p className="text-[12px] text-on-surface-variant mt-1">{alert.desc}</p>
                        <button
                          className={`mt-2 ${alert.actionColor} text-[12px] font-semibold hover:underline`}
                          onClick={() => navigate(alert.path)}
                        >
                          {alert.action}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-surface-variant text-center">
                <button className="text-on-surface-variant hover:text-primary text-[12px] font-semibold transition-colors" onClick={() => loadDashboardData()}>
                  Refresh Alerts
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
