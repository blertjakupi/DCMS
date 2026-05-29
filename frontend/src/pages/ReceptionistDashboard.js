import AdminSidebar from '../components/AdminSidebar';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderActions from '../components/HeaderActions';
import { authFetch } from '../utils/authFetch';


const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const toDateOnly = (date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const getMonthStart = () => {
  const now = new Date();
  return toDateOnly(new Date(now.getFullYear(), now.getMonth(), 1));
};

const formatTime = (time) => String(time || '').slice(0, 5) || '-';

function ReceptionistDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [appointmentsToday, setAppointmentsToday] = useState(0);
  const [newPatientsMonth, setNewPatientsMonth] = useState(0);
  const [cashToday, setCashToday] = useState(0);
  const [pendingInvoices, setPendingInvoices] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [billingQueue, setBillingQueue] = useState([]);
  const [reminderCount, setReminderCount] = useState(0);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const fetchJson = async (url) => {
        const response = await authFetch(url);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || `Failed: ${url}`);
        return data;
      };

      const today = toDateOnly(new Date());
      const monthStart = getMonthStart();

      const results = await Promise.allSettled([
        fetchJson(`/api/appointments/count?date=${today}&status=Scheduled`),
        fetchJson('/api/users?limit=1000&sort=-created_at'),
        fetchJson(`/api/payments/sum?from=${today}&to=${today}`),
        fetchJson('/api/invoices?limit=100'),
        fetchJson('/api/appointments'),
        fetchJson('/api/reminders?limit=100'),
      ]);

      const getValue = (result, defaultValue) => result.status === 'fulfilled' ? result.value : defaultValue;
      const appointmentCount = getValue(results[0], { count: 0 });
      const usersData = getValue(results[1], { data: [] });
      const paymentsSum = getValue(results[2], { total: 0 });
      const invoicesData = getValue(results[3], { data: [] });
      const appointmentsData = getValue(results[4], { data: [] });
      const remindersData = getValue(results[5], { data: [] });

      const patientUsers = (usersData.data || []).filter((user) =>
        (user.Role?.normalized_name || user.Role?.role_name || '').toUpperCase() === 'PATIENT'
      );
      const monthPatients = patientUsers.filter((user) => {
        const createdDate = user.created_at ? toDateOnly(new Date(user.created_at)) : '';
        return createdDate >= monthStart && createdDate <= today;
      });

      const invoices = invoicesData.data || [];
      const unpaidInvoices = invoices.filter((invoice) =>
        ['Unpaid', 'Partially Paid'].includes(invoice.status)
      );

      const appointments = (appointmentsData.data || [])
        .filter((appointment) => appointment.appointment_date === today && appointment.status === 'Scheduled')
        .sort((a, b) => String(a.appointment_time).localeCompare(String(b.appointment_time)));

      const activeReminders = (remindersData.data || []).filter((reminder) =>
        ['Pending', 'Scheduled'].includes(reminder.status)
      );

      setAppointmentsToday(appointmentCount.count);
      setNewPatientsMonth(monthPatients.length);
      setCashToday(paymentsSum.total);
      setPendingInvoices(unpaidInvoices.length);
      setTodayAppointments(appointments.slice(0, 6));
      setBillingQueue(unpaidInvoices.slice(0, 5));
      setReminderCount(activeReminders.length);
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

  const filteredAppointments = todayAppointments.filter((appointment) => {
    const query = search.trim().toLowerCase();
    const patientName = `${appointment.Patient?.first_name || ''} ${appointment.Patient?.last_name || ''}`.toLowerCase();
    const dentistName = `${appointment.Dentist?.first_name || ''} ${appointment.Dentist?.last_name || ''}`.toLowerCase();
    return !query || patientName.includes(query) || dentistName.includes(query);
  });

  const kpis = [
    {
      label: 'Appointments Today',
      value: loading ? '...' : appointmentsToday,
      trend: appointmentsToday ? 'Reception schedule active' : 'No appointments today',
      trendIcon: appointmentsToday ? 'event_available' : 'event_busy',
      color: 'text-primary',
      icon: 'calendar_month',
    },
    {
      label: 'New Patients This Month',
      value: loading ? '...' : newPatientsMonth,
      trend: 'Registered by front desk',
      trendIcon: 'person_add',
      color: 'text-secondary',
      icon: 'groups',
    },
    {
      label: 'Cash Collected Today',
      value: loading ? '...' : formatCurrency(cashToday),
      trend: 'Front desk payments',
      trendIcon: 'payments',
      color: 'text-tertiary',
      icon: 'point_of_sale',
    },
    {
      label: 'Pending Invoices',
      value: loading ? '...' : pendingInvoices,
      trend: pendingInvoices ? 'Needs payment follow-up' : 'Billing queue clear',
      trendIcon: pendingInvoices ? 'receipt_long' : 'check_circle',
      color: pendingInvoices ? 'text-error' : 'text-primary',
      icon: 'request_quote',
    },
  ];

  const quickActions = [
    { label: 'Create Appointment', icon: 'add_circle', path: '/admin/appointments' },
    { label: 'Register Patient', icon: 'person_add', path: '/admin/patients' },
    { label: 'Cash Payment', icon: 'point_of_sale', path: '/admin/billing' },
    { label: 'Appointment Reminders', icon: 'notifications_active', path: '/admin/reminders' },
  ];

  return (
    <div className="font-body-base text-body-base text-on-background h-screen overflow-hidden flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        <header className="bg-surface fixed top-0 right-0 left-0 md:left-64 h-16 z-10 flex justify-between items-center px-6 shadow-sm border-b border-surface-variant hidden md:flex">
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative rounded-full bg-surface-container-low flex items-center px-4 py-2 border border-outline-variant focus-within:border-primary focus-within:bg-surface-container-lowest transition-colors clinical-glow">
              <span className="material-symbols-outlined text-outline mr-2">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-[15px] text-on-surface w-full placeholder:text-outline p-0 focus:outline-none"
                placeholder="Search today's appointments..."
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <HeaderActions />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 mt-16 pb-24 md:pb-6 bg-background">
          <div className="mb-8">
            <h2 className="text-[32px] font-bold text-on-surface">Reception Overview</h2>
            <p className="text-[16px] text-on-surface-variant mt-1">Front desk workflow for appointments, patients, billing, and reminders.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-error-container/40 border border-error-container text-error">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-surface-variant relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="text-[14px] font-semibold text-on-surface-variant">{kpi.label}</span>
                  <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center">
                    <span className={`material-symbols-outlined ${kpi.color}`}>{kpi.icon}</span>
                  </div>
                </div>
                <span className="text-[32px] font-bold text-on-surface">{kpi.value}</span>
                <div className={`flex items-center mt-2 ${kpi.color} text-[12px] font-semibold`}>
                  <span className="material-symbols-outlined text-[16px] mr-1">{kpi.trendIcon}</span>
                  <span>{kpi.trend}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className="bg-surface-container-lowest rounded-xl p-5 border border-surface-variant shadow-sm hover:border-primary-container hover:bg-surface-container-low transition-colors text-left flex items-center gap-4"
                onClick={() => navigate(action.path)}
              >
                <span className="material-symbols-outlined text-primary text-[28px]">{action.icon}</span>
                <span className="font-semibold text-on-surface">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-surface-variant overflow-hidden">
              <div className="p-6 border-b border-surface-variant flex justify-between items-center bg-surface">
                <h3 className="text-[24px] font-semibold text-on-surface">Today's Appointments</h3>
                <button className="text-primary text-[14px] font-semibold flex items-center gap-1" onClick={() => navigate('/admin/appointments')}>
                  View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-4 text-on-surface-variant">Loading appointments...</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-surface-variant text-on-surface-variant text-[12px] font-semibold uppercase tracking-wider">
                        <th className="p-4">Time</th>
                        <th className="p-4">Patient</th>
                        <th className="p-4">Dentist</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant text-[15px]">
                      {filteredAppointments.map((appointment) => (
                        <tr key={appointment.appointment_id} className="hover:bg-surface-container-low transition-colors">
                          <td className="p-4 font-semibold text-on-surface">{formatTime(appointment.appointment_time)}</td>
                          <td className="p-4 text-on-surface">{appointment.Patient?.first_name} {appointment.Patient?.last_name}</td>
                          <td className="p-4 text-on-surface-variant">{appointment.Dentist?.first_name} {appointment.Dentist?.last_name}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-container text-on-primary-container">
                              {appointment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredAppointments.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-4 text-center text-on-surface-variant">No appointments for today</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-surface-variant overflow-hidden">
              <div className="p-6 border-b border-surface-variant bg-surface">
                <h3 className="text-[24px] font-semibold text-on-surface">Billing Queue</h3>
                <p className="text-[13px] text-on-surface-variant mt-1">{reminderCount} active reminder(s)</p>
              </div>
              <div className="p-4 space-y-3">
                {loading ? (
                  <div className="text-on-surface-variant">Loading billing...</div>
                ) : billingQueue.length === 0 ? (
                  <div className="text-center text-on-surface-variant py-6">No pending invoices</div>
                ) : billingQueue.map((invoice) => (
                  <button
                    key={invoice.invoice_id}
                    className="w-full p-4 rounded-xl border border-surface-variant hover:bg-surface-container-low text-left transition-colors"
                    onClick={() => navigate('/admin/billing')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-on-surface">Invoice #{invoice.invoice_id}</span>
                      <span className="text-error font-semibold">{formatCurrency(invoice.total_amount)}</span>
                    </div>
                    <p className="text-[13px] text-on-surface-variant mt-1">
                      {invoice.Patient?.first_name} {invoice.Patient?.last_name} - {invoice.status}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ReceptionistDashboard;
