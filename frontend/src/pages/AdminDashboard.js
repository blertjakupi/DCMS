import { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';



const kpis = [
  {
    label: 'Total Patients',
    value: '2,450',
    trend: '+12% vs last month',
    trendIcon: 'trending_up',
    trendColor: 'text-primary',
    icon: 'groups',
    iconColor: 'text-primary',
    glowColor: 'bg-primary-container/20',
    hoverBorder: 'hover:border-primary-container',
  },
  {
    label: 'Total Revenue This Month',
    value: '$142,000',
    trend: '+8.4% vs last month',
    trendIcon: 'trending_up',
    trendColor: 'text-tertiary',
    icon: 'account_balance_wallet',
    iconColor: 'text-tertiary',
    glowColor: 'bg-tertiary-container/20',
    hoverBorder: 'hover:border-tertiary-container',
  },
  {
    label: 'Active Dentists',
    value: '12',
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
    value: '48',
    trend: 'Next in 15 mins',
    trendIcon: 'schedule',
    trendColor: 'text-on-surface-variant',
    icon: 'event_available',
    iconColor: 'text-primary',
    glowColor: 'bg-primary-container/20',
    hoverBorder: 'hover:border-primary-container',
  },
];

const registrations = [
  {
    initials: 'SJ',
    name: 'Sarah Jenkins',
    role: 'Hygienist',
    email: 's.jenkins@dentacare.com',
    date: 'Oct 24, 2023',
    active: true,
    avatarBg: 'bg-secondary-container text-on-secondary-container',
  },
  {
    initials: 'MR',
    name: 'Michael Reyes',
    role: 'Front Desk',
    email: 'm.reyes@dentacare.com',
    date: 'Oct 22, 2023',
    active: true,
    avatarBg: 'bg-tertiary-container text-on-tertiary-container',
  },
  {
    initials: 'EC',
    name: 'Dr. Emily Chen',
    role: 'Dentist',
    email: 'e.chen@dentacare.com',
    date: 'Oct 15, 2023',
    active: false,
    avatarBg: 'bg-surface-container-high text-on-surface-variant',
  },
  {
    initials: 'DT',
    name: 'David Thompson',
    role: 'IT Support',
    email: 'd.thompson@dentacare.com',
    date: 'Oct 10, 2023',
    active: true,
    avatarBg: 'bg-secondary-container text-on-secondary-container',
  },
];

const alerts = [
  {
    icon: 'inventory_2',
    title: 'Low Inventory Warning',
    desc: 'Lidocaine low stock (Current: 5 vials). Reorder recommended.',
    action: 'Order Now',
    actionColor: 'text-primary',
    bg: 'bg-surface-container-low border-surface-variant',
    iconBg: 'bg-secondary-container text-on-secondary-container',
  },
  {
    icon: 'receipt_long',
    title: 'Overdue Invoice',
    desc: 'INV-2024-089 is 15 days overdue. Amount: $1,250.00.',
    action: 'View Details',
    actionColor: 'text-error',
    bg: 'bg-error-container/30 border-error-container',
    iconBg: 'bg-error-container text-error',
  },
  {
    icon: 'sms_failed',
    title: 'Failed Reminder Delivery',
    desc: 'SMS Reminder for Marcus Brody failed to send (Invalid Number).',
    action: 'Update Contact',
    actionColor: 'text-primary',
    bg: 'bg-surface-container-low border-surface-variant',
    iconBg: 'bg-surface-container-highest text-on-surface-variant',
  },
];

function AdminDashboard() {
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = user?.full_name
  ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  : 'AD';

  return (
    <div className="font-body-base text-body-base text-on-background h-screen overflow-hidden flex">

	<AdminSidebar />  {}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">

        {/* Top Bar */}
        <header className="bg-surface fixed top-0 right-0 left-0 md:left-64 h-16 z-10 flex justify-between items-center px-6 shadow-sm border-b border-surface-variant hidden md:flex">
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative rounded-full bg-surface-container-low flex items-center px-4 py-2 border border-outline-variant focus-within:border-primary focus-within:bg-surface-container-lowest transition-colors clinical-glow">
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

        {/* Main Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 mt-16 pb-24 md:pb-6 bg-background">

          {/* Page Header */}
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
                <button className="text-primary hover:text-on-primary-fixed-variant text-[14px] font-semibold flex items-center gap-1 transition-colors">
                  View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
              <div className="overflow-x-auto flex-1">
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
                    {registrations.map((r) => (
                      <tr key={r.email} className="hover:bg-surface-container-low transition-colors">
                        <td className="p-4 font-semibold text-on-surface">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${r.avatarBg} flex items-center justify-center text-[12px] font-semibold shrink-0`}>
                              {r.initials}
                            </div>
                            {r.name}
                          </div>
                        </td>
                        <td className="p-4 text-on-surface-variant">{r.role}</td>
                        <td className="p-4 text-on-surface-variant hidden sm:table-cell">{r.email}</td>
                        <td className="p-4 text-on-surface-variant hidden md:table-cell">{r.date}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            r.active
                              ? 'bg-primary-container text-on-primary-container'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}>
                            {r.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button className="text-outline hover:text-primary p-1 rounded hover:bg-surface-container-low transition-colors" title="Edit">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button className="text-outline hover:text-error p-1 rounded hover:bg-error-container transition-colors" title="Deactivate">
                            <span className="material-symbols-outlined text-[20px]">block</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* System Alerts */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-surface-variant flex flex-col">
              <div className="p-6 border-b border-surface-variant bg-surface flex items-center justify-between">
                <h3 className="text-[24px] font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-error">warning</span>
                  System Alerts
                </h3>
                <span className="bg-error-container text-on-error-container text-[12px] font-bold px-2 py-1 rounded-full">3 New</span>
              </div>
              <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                {alerts.map((alert) => (
                  <div key={alert.title} className={`p-4 rounded-xl border ${alert.bg} hover:brightness-95 transition-all flex gap-4 items-start`}>
                    <div className={`w-10 h-10 rounded-full ${alert.iconBg} flex items-center justify-center shrink-0 mt-1`}>
                      <span className="material-symbols-outlined">{alert.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-[14px] font-semibold text-on-surface">{alert.title}</h4>
                      <p className="text-[12px] text-on-surface-variant mt-1">{alert.desc}</p>
                      <button className={`mt-2 ${alert.actionColor} text-[12px] font-semibold hover:underline`}>
                        {alert.action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-surface-variant text-center">
                <button className="text-on-surface-variant hover:text-primary text-[12px] font-semibold transition-colors">
                  Clear All Alerts
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