import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
  { icon: 'calendar_month', label: 'Appointments', path: '#' },
  { icon: 'groups', label: 'Patients', path: '#' },
  { icon: 'folder_shared', label: 'Dental Records', path: '#' },
  { icon: 'medical_services', label: 'Treatments', path: '#' },
  { icon: 'inventory_2', label: 'Inventory', path: '#' },
  { icon: 'receipt_long', label: 'Billing & Invoices', path: '#' },
  { icon: 'medical_information', label: 'Dentists', path: '#' },
  { icon: 'notifications_active', label: 'Reminders', path: '#' },
];

const adminItems = [
  { icon: 'manage_accounts', label: 'User Management' },
  { icon: 'settings_system_daydream', label: 'System Settings' },
];

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation(); 

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };
  

  return (
    <nav className="bg-surface-container-low text-primary w-64 fixed left-0 top-0 shadow-sm flex flex-col h-full p-4 space-y-2 z-20 hidden md:flex">
      <div className="px-4 py-6 mb-4 flex items-center gap-3">
        <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          dentistry
        </span>
        <h1 className="text-[24px] font-bold text-primary tracking-tight">DentaCare Pro</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {navItems.map((item) => {
  const isActive = location.pathname === item.path;
  return (
    <a
      key={item.label}
      href={item.path}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-[0.98] ${
        isActive
          ? 'bg-primary-container text-on-primary-container font-bold'
          : 'text-on-surface-variant hover:bg-surface-container-highest'
      }`}
    >
      <span className="material-symbols-outlined">{item.icon}</span>
      <span>{item.label}</span>
    </a>
  );
})}

        <div className="pt-4 pb-2">
          <p className="px-4 text-[12px] text-outline mb-2 uppercase tracking-wider">Administration</p>
          {adminItems.map((item) => {
  const path = item.label === 'User Management' ? '/admin/users' : '#';
  const isActive = location.pathname === path;
  return (
    <a
      key={item.label}
      href={path}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 active:scale-[0.98] ${
        isActive
          ? 'bg-primary-container text-on-primary-container font-bold'
          : 'text-on-surface-variant hover:bg-surface-container-highest'
      }`}
    >
      <span className="material-symbols-outlined">{item.icon}</span>
      <span>{item.label}</span>
    </a>
  );
})}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-surface-variant space-y-1">
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-colors duration-200">
          <span className="material-symbols-outlined">help</span>
          <span>Support</span>
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-error-container rounded-lg transition-colors duration-200"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}

export default AdminSidebar;