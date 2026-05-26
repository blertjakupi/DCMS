import { useNavigate, useLocation, Link } from 'react-router-dom';

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', path: '/dentist/dashboard' },
  { icon: 'calendar_month', label: 'Appointments', path: '/dentist/appointments' },
  { icon: 'groups', label: 'Patients', path: '/dentist/patients' },
  { icon: 'folder_shared', label: 'Dental Records', path: '/dentist/dental-records' },
  { icon: 'medical_services', label: 'Treatments', path: '/dentist/treatments' },
  { icon: 'notifications_active', label: 'Reminders', path: '/dentist/reminders' },
];

function DentistSidebar() {
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
      <div className="px-2 py-6 mb-4 flex items-center gap-3">
        <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          dentistry
        </span>
        <h1 className="text-[24px] font-bold text-primary tracking-tight leading-tight whitespace-nowrap">DentaCare Pro</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}   // ✅ Changed from href to to
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-[0.98] ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-surface-variant space-y-1">
        <Link to="/dentist/appointments" className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-on-primary hover:bg-[#005049] rounded-lg transition-colors duration-200 font-semibold">
          <span className="material-symbols-outlined">add</span>
          <span>New Appointment</span>
        </Link>
        <Link to="#" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-colors duration-200">
          <span className="material-symbols-outlined">help</span>
          <span>Support</span>
        </Link>
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

export default DentistSidebar;