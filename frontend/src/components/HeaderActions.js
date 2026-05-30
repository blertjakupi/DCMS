import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const iconButtonClass =
  'text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-highest transition-colors relative';

const authFetchLocal = async (url, options = {}) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  return res;
};

function HeaderActions() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const [reminderDropdownOpen, setReminderDropdownOpen] = useState(false);
  const [recentReminders, setRecentReminders] = useState([]);
  const [reminderLoading, setReminderLoading] = useState(false);
  const buttonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        setReminderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleReminderDropdown = async () => {
    if (reminderDropdownOpen) {
      setReminderDropdownOpen(false);
      return;
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        right: window.innerWidth - rect.right,
      });
    }
    setReminderDropdownOpen(true);
    if (recentReminders.length === 0 && !reminderLoading) {
      setReminderLoading(true);
      try {
        let res = await authFetchLocal('/api/reminders?limit=3&sort=-created_at');
        if (!res.ok) {
          res = await authFetchLocal('/api/reminders');
          if (!res.ok) throw new Error('Failed to fetch reminders');
          const json = await res.json();
          const allReminders = json.data || [];
          const sorted = [...allReminders].sort((a, b) => {
            const dateA = a.created_at || a.scheduled_date;
            const dateB = b.created_at || b.scheduled_date;
            return new Date(dateB) - new Date(dateA);
          });
          setRecentReminders(sorted.slice(0, 3));
        } else {
          const json = await res.json();
          setRecentReminders(json.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setReminderLoading(false);
      }
    }
  };

  const formatReminderDate = (reminder) => {
    const dateStr = reminder.scheduled_date || reminder.send_at || reminder.created_at;
    if (!dateStr) return 'Date unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPatientName = (reminder) => {
    const patient = reminder.Patient || reminder.Appointment?.Patient;
    if (patient) return `${patient.first_name} ${patient.last_name}`.trim();
    if (reminder.patient_id) return `Patient #${reminder.patient_id}`;
    return 'Unknown';
  };

  return (
    <div className="flex items-center gap-4 ml-auto">
      <button className={iconButtonClass} onClick={() => navigate(settingsPath)} title="Settings">
        <span className="material-symbols-outlined">settings</span>
      </button>

      <div className="relative" ref={buttonRef}>
        <button className={iconButtonClass} onClick={toggleReminderDropdown} title="Notifications">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface"></span>
        </button>
      </div>

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

      {reminderDropdownOpen && createPortal(
        <div
          className="fixed bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/20 w-72"
          style={{ top: dropdownPosition.top, right: dropdownPosition.right, zIndex: 10000 }}
        >
          <div className="p-3 border-b border-outline-variant/20">
            <span className="text-sm font-semibold text-on-surface">Recent Reminders</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {reminderLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : recentReminders.length === 0 ? (
              <div className="text-center text-on-surface-variant py-6 text-sm">No recent reminders.</div>
            ) : (
              <ul className="divide-y divide-outline-variant/20">
                {recentReminders.map((reminder) => (
                  <li key={reminder.reminder_id} className="p-3 hover:bg-surface-container-low transition-colors">
                    <p className="font-medium text-on-surface text-sm">{getPatientName(reminder)}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{reminder.reminder_type || reminder.type || 'Reminder'}</p>
                    <p className="text-xs text-outline mt-0.5">{formatReminderDate(reminder)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-2 border-t border-outline-variant/20 text-center">
            <button
              onClick={() => {
                setReminderDropdownOpen(false);
                navigate(remindersPath);
              }}
              className="text-primary text-xs font-semibold hover:underline"
            >
              View All Reminders
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default HeaderActions;