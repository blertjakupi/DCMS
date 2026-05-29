import { useLocation, useNavigate } from 'react-router-dom';

const iconButtonClass =
  'text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-highest transition-colors relative';

function HeaderActions() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const isDentist = location.pathname.startsWith('/dentist') || location.pathname === '/dashboard';
  const isReceptionist = user.roles?.[0] === 'RECEPTIONIST' || location.pathname.startsWith('/receptionist');
  const remindersPath = isDentist ? '/dentist/reminders' : '/admin/reminders';
  const settingsPath = isDentist
    ? '/dentist/reminders'
    : isReceptionist
      ? '/receptionist/dashboard'
      : '/admin/settings';
  const displayName = user.full_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex items-center gap-4 ml-auto">
      <button className={iconButtonClass} onClick={() => navigate(settingsPath)} title="Settings">
        <span className="material-symbols-outlined">settings</span>
      </button>
      <button className={iconButtonClass} onClick={() => navigate(remindersPath)} title="Notifications">
        <span className="material-symbols-outlined">notifications</span>
        <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface"></span>
      </button>
      <div className="relative group">
        <button className="p-1 rounded-full hover:bg-surface-container-highest transition-colors" title="Profile">
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[14px] font-semibold">
            {initials}
          </div>
        </button>
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-outline-variant/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="px-4 py-3 border-b border-outline-variant/20">
            <p className="text-[13px] font-semibold text-on-surface truncate">{displayName}</p>
            <p className="text-[12px] text-on-surface-variant truncate">{user.email}</p>
          </div>
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
  );
}

export default HeaderActions;
