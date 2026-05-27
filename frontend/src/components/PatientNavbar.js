import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', path: '/patient/dashboard' },
  { label: 'My Appointments', path: '/patient/appointments' },
  { label: 'My Records', path: '/patient/records' },
  { label: 'Billing', path: '/patient/billing' },
  { label: 'My Profile', path: '/patient/profile' },
];

function PatientNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = user?.full_name
  ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  : (user?.first_name?.[0] || '') + (user?.last_name?.[0] || '') || '?';

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
      <div className="flex justify-between items-center max-w-[1200px] mx-auto px-12 h-20">

        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/patient/dashboard')}>
          <span
            className="material-symbols-outlined text-[32px] text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            dentistry
          </span>
          <span className="text-[24px] font-bold text-primary tracking-tight">DentaCare Pro</span>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex gap-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`text-[14px] font-medium transition-colors duration-200 pb-1 ${
                  isActive
                    ? 'text-primary font-bold border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4 text-primary">
          <button className="hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined">notifications</span>
          </button>

          {/* Avatar + Logout */}
          <div className="relative group ml-2">
            <button className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[14px] font-semibold">
			{initials}
			</button>
            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-outline-variant/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="px-4 py-3 border-b border-outline-variant/20">
                <p className="text-[13px] font-semibold text-on-surface truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-[12px] text-on-surface-variant truncate">{user.email}</p>
              </div>
              <button
                onClick={() => navigate('/patient/profile')}
                className="w-full text-left px-4 py-2 text-[13px] text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                My Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-[13px] text-error hover:bg-surface-container-low transition-colors flex items-center gap-2 rounded-b-xl"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
            </div>
          </div>
        </div>

      </div>
    </nav>
  );
}

export default PatientNavbar;