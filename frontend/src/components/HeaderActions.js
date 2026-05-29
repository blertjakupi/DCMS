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

  return (
    <div className="flex items-center gap-4 ml-auto">
      <button className={iconButtonClass} onClick={() => navigate(settingsPath)} title="Settings">
        <span className="material-symbols-outlined">settings</span>
      </button>
      <button className={iconButtonClass} onClick={() => navigate(remindersPath)} title="Notifications">
        <span className="material-symbols-outlined">notifications</span>
        <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface"></span>
      </button>
      <button className="p-1 rounded-full hover:bg-surface-container-highest transition-colors" title="Profile">
        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[14px] font-semibold">
          {initials}
        </div>
      </button>
    </div>
  );
}

export default HeaderActions;
