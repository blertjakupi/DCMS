import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientNavbar from '../components/PatientNavbar';

const summaryCards = [
  {
    icon: 'calendar_month',
    label: 'Next Appointment',
    title: 'Oct 24, 2:30 PM',
    badge: 'Upcoming',
    details: [
      { icon: 'person', text: 'Dr. Sarah Smith' },
      { icon: 'dentistry', text: 'Routine Cleaning' },
    ],
  },
  {
    icon: 'payments',
    label: 'Outstanding Balance',
    title: '$120.00',
    action: 'Pay Now',
  },
  {
    icon: 'history',
    label: 'Last Visit',
    title: 'Aug 12, 2024',
    details: [{ icon: 'check_circle', text: 'Cavity Filling' }],
    link: 'View summary',
  },
];

const quickActions = [
  { icon: 'event_available', label: 'Book Appointment', path: '/patient/appointments' },
  { icon: 'chat_bubble', label: 'Message Clinic', path: '/patient/messages' },
  { icon: 'receipt_long', label: 'Pay Bill', path: '/patient/billing' },
];

const upcomingAppointments = [
  {
    month: 'Oct',
    day: '24',
    treatment: 'Routine Cleaning',
    dentist: 'Dr. Sarah Smith',
    time: '2:30 PM - 3:15 PM',
  },
];

const recentActivities = [
  {
    icon: 'medical_information',
    title: 'Cavity Filling',
    date: 'Aug 12, 2024',
    description: 'Lower right molar restoration completed successfully. No complications.',
    tags: ['Dr. Smith', 'X-Rays taken'],
  },
];

function PatientPortal() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const firstName = user.first_name || user.full_name?.split(' ')[0] || 'Alex';

  return (
    <div className="bg-surface text-on-surface font-body-base text-body-base antialiased min-h-screen flex flex-col">
      <PatientNavbar />

      <main className="flex-grow pt-32 pb-xl px-5 md:px-xl max-w-[1200px] mx-auto w-full">
        <header className="mb-xl">
          <h1 className="text-headline-lg font-headline-lg text-primary mb-2">
            Welcome back, {firstName}!
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant">
            Your smile is looking great. Here is your latest dental health summary.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-xl">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_0_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_0_rgba(0,0,0,0.08)] transition-shadow duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {card.icon}
                  </span>
                </div>
                {card.badge && (
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-caption font-label-bold">
                    {card.badge}
                  </span>
                )}
              </div>

              <h3 className="text-caption font-label-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                {card.label}
              </h3>
              <p className="text-headline-md font-headline-md text-on-surface mb-3">{card.title}</p>

              {card.details && (
                <div className="text-body-base text-on-surface-variant flex flex-col gap-1">
                  {card.details.map((detail) => (
                    <span key={detail.text} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">{detail.icon}</span>
                      {detail.text}
                    </span>
                  ))}
                </div>
              )}

              {card.action && (
                <button className="w-full bg-primary text-on-primary font-label-bold py-3 rounded-full hover:bg-surface-tint transition-colors">
                  {card.action}
                </button>
              )}

              {card.link && (
                <button className="font-label-bold text-primary flex items-center gap-1 hover:underline">
                  {card.link}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              )}
            </article>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <aside className="lg:col-span-1 flex flex-col gap-8">
            <section>
              <h2 className="text-headline-md font-headline-md text-primary mb-6">Quick Actions</h2>
              <div className="flex flex-col gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 flex items-center justify-between hover:border-primary hover:text-primary transition-colors group shadow-[0_4px_20px_0_rgba(0,0,0,0.04)]"
                  >
                    <span className="font-label-bold flex items-center gap-3">
                      <span className="material-symbols-outlined text-tertiary group-hover:text-primary transition-colors">
                        {action.icon}
                      </span>
                      {action.label}
                    </span>
                    <span className="material-symbols-outlined text-tertiary group-hover:text-primary transition-colors">
                      chevron_right
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <div className="lg:col-span-2 flex flex-col gap-8">
            <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-[0_4px_20px_0_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-headline-md font-headline-md text-primary">Upcoming Appointments</h2>
              </div>

              <div className="flex flex-col">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={`${appointment.month}-${appointment.day}-${appointment.time}`}
                    className="py-4 border-b border-surface-container-highest last:border-0 flex items-center justify-between hover:bg-surface-bright transition-colors rounded-lg px-2 -mx-2"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-surface-container-high rounded-lg p-3 text-center min-w-[70px]">
                        <div className="text-caption text-on-surface-variant uppercase">{appointment.month}</div>
                        <div className="text-headline-md font-headline-md text-primary">{appointment.day}</div>
                      </div>
                      <div>
                        <h4 className="font-label-bold text-on-surface mb-1">{appointment.treatment}</h4>
                        <p className="text-body-base text-on-surface-variant mb-1">{appointment.dentist}</p>
                        <div className="flex items-center gap-2 text-caption text-tertiary">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          {appointment.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        aria-label="Edit Appointment"
                        className="p-2 text-tertiary hover:bg-surface-container-high rounded-full transition-colors"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        aria-label="Cancel Appointment"
                        className="p-2 text-tertiary hover:bg-surface-container-high rounded-full transition-colors"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-[0_4px_20px_0_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-center mb-6 gap-4">
                <h2 className="text-headline-md font-headline-md text-primary">Recent Activity</h2>
                <button
                  onClick={() => navigate('/patient/records')}
                  className="font-label-bold text-primary hover:underline flex items-center gap-1"
                >
                  View full records
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {recentActivities.map((activity) => (
                  <article
                    key={`${activity.title}-${activity.date}`}
                    className="bg-surface-bright border border-surface-container-highest rounded-lg p-4 flex items-start gap-4"
                  >
                    <div className="mt-1 w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                      <span className="material-symbols-outlined text-[18px]">{activity.icon}</span>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start gap-4 mb-1">
                        <h4 className="font-label-bold text-on-surface">{activity.title}</h4>
                        <span className="text-caption text-on-surface-variant whitespace-nowrap">{activity.date}</span>
                      </div>
                      <p className="text-body-base text-on-surface-variant mb-2">{activity.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {activity.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-surface-container-high text-on-surface px-2 py-1 rounded text-caption font-label-bold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      
    </div>
  );
}

export default PatientPortal;
