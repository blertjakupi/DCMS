import { useMemo, useState } from 'react';
import PatientNavbar from '../components/PatientNavbar';

const filters = ['All', 'Upcoming', 'Completed', 'Cancelled'];

const appointments = [
  {
    id: 1,
    month: 'Oct',
    day: '24',
    title: 'Routine Cleaning',
    dentist: 'Dr. Sarah Smith',
    initials: 'SS',
    time: '2:30 PM - 3:30 PM',
    status: 'Scheduled',
  },
  {
    id: 2,
    month: 'Apr',
    day: '12',
    title: 'Whitening Consultation',
    dentist: 'Dr. John Doe',
    initials: 'JD',
    time: '10:00 AM - 10:45 AM',
    status: 'Completed',
  },
  {
    id: 3,
    month: 'Jan',
    day: '05',
    title: 'Wisdom Tooth Extraction',
    dentist: 'Dr. Sarah Smith',
    initials: 'SS',
    time: '9:00 AM - 10:00 AM',
    status: 'Cancelled',
  },
];

const timeSlots = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'];

const statusStyles = {
  Scheduled: {
    card: 'border-transparent hover:border-outline-variant/20',
    date: 'bg-surface-container-low text-primary',
    title: 'text-on-surface',
    badge: 'bg-primary/10 text-primary',
  },
  Completed: {
    card: 'border-transparent hover:border-outline-variant/20 opacity-75 hover:opacity-100',
    date: 'bg-surface-variant text-on-surface-variant',
    title: 'text-on-surface',
    badge: 'bg-tertiary/10 text-tertiary',
  },
  Cancelled: {
    card: 'border-error/20 opacity-60',
    date: 'bg-surface-variant text-on-surface-variant',
    title: 'text-on-surface line-through decoration-outline-variant',
    badge: 'bg-error/10 text-error',
  },
};

function PatientAppointments() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('10:00 AM');

  const visibleAppointments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Upcoming' && appointment.status === 'Scheduled') ||
        appointment.status === activeFilter;
      const matchesSearch =
        !normalizedSearch ||
        appointment.title.toLowerCase().includes(normalizedSearch) ||
        appointment.dentist.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search]);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <div className="bg-background text-on-background min-h-screen font-body-base pt-20">
      <PatientNavbar />

      <main className="max-w-[1200px] mx-auto px-5 md:px-xl py-xl">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-primary mb-2">
              My Appointments
            </h1>
            <p className="text-body-base text-on-surface-variant">
              Manage and track your upcoming and past visits.
            </p>
          </div>
          <button
            onClick={openModal}
            className="bg-primary text-on-primary font-label-bold px-6 py-3 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              add_circle
            </span>
            Book Appointment
          </button>
        </header>

        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 bg-surface-container-lowest p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant/20">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full font-label-bold transition-colors ${
                  activeFilter === filter
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-variant'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <label className="relative flex-grow sm:flex-grow-0">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                search
              </span>
              <input
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-surface border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body-base text-on-surface placeholder:text-outline transition-colors"
                placeholder="Search appointments..."
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="relative flex-grow sm:flex-grow-0">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                calendar_today
              </span>
              <input
                className="w-full sm:w-48 pl-10 pr-4 py-2 bg-surface border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body-base text-on-surface placeholder:text-outline transition-colors cursor-pointer"
                placeholder="Select dates"
                readOnly
                type="text"
              />
            </label>
          </div>
        </section>

        {visibleAppointments.length > 0 ? (
          <div className="flex flex-col gap-4">
            {visibleAppointments.map((appointment) => {
              const styles = statusStyles[appointment.status];

              return (
                <article
                  key={appointment.id}
                  className={`bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow duration-300 p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center border group ${styles.card}`}
                >
                  <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-lg flex-shrink-0 ${styles.date}`}>
                    <span className="text-caption uppercase tracking-wider">{appointment.month}</span>
                    <span className="text-headline-md font-headline-md leading-none mt-1">{appointment.day}</span>
                  </div>

                  <div className="flex-grow flex flex-col gap-2">
                    <h3 className={`text-headline-md font-headline-md ${styles.title}`}>{appointment.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-on-surface-variant text-body-base">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-caption font-label-bold">
                          {appointment.initials}
                        </div>
                        <span>{appointment.dentist}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                        <span>{appointment.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-outline-variant/20 sm:border-t-0">
                    <span className={`font-label-bold text-caption px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1 ${styles.badge}`}>
                      {appointment.status === 'Completed' && (
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      )}
                      {appointment.status}
                    </span>
                    <div className="flex gap-2">
                      {appointment.status === 'Scheduled' && (
                        <>
                          <button className="flex items-center gap-2 h-10 px-4 rounded-full text-primary font-label-bold hover:bg-primary/10 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                            <span>Reschedule</span>
                          </button>
                          <button
                            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-error transition-colors"
                            title="Cancel Appointment"
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </>
                      )}
                      {appointment.status === 'Completed' && (
                        <button className="h-10 px-4 rounded-full flex items-center justify-center text-primary font-label-bold hover:bg-primary/10 transition-colors">
                          View Details
                        </button>
                      )}
                      {appointment.status === 'Cancelled' && (
                        <button className="h-10 px-4 rounded-full flex items-center justify-center text-secondary font-label-bold hover:bg-secondary/10 transition-colors">
                          Reschedule
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant/20 mt-8">
            <div className="w-24 h-24 bg-surface-variant rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-outline">calendar_today</span>
            </div>
            <h2 className="text-headline-md font-headline-md text-on-surface mb-2">No appointments found</h2>
            <p className="text-body-base text-on-surface-variant max-w-md mb-8">
              It looks like you do not have any appointments matching your current filters. Would you like to schedule one now?
            </p>
            <button
              onClick={openModal}
              className="bg-primary text-on-primary font-label-bold px-8 py-3 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm active:scale-95"
            >
              Book Appointment
            </button>
          </section>
        )}
      </main>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
              <h2 className="text-headline-md font-headline-md text-on-surface">Book New Appointment</h2>
              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block font-label-bold text-on-surface-variant mb-2">Select Date</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    calendar_today
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant/50 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-body-base"
                    type="date"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-bold text-on-surface-variant mb-2">Available Time Slots</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-2 px-3 rounded-full border text-label-bold transition-colors ${
                        selectedTime === slot
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-outline-variant/50 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-label-bold text-on-surface-variant mb-2">Treatment Type</label>
                <select className="w-full px-4 py-2 bg-surface border border-outline-variant/50 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-body-base">
                  <option>Routine Cleaning</option>
                  <option>Consultation</option>
                  <option>Extraction</option>
                </select>
              </div>
            </div>

            <div className="p-6 bg-surface-container-low">
              <button
                onClick={closeModal}
                className="w-full bg-primary text-on-primary font-label-bold py-3 rounded-full hover:bg-primary-container transition-colors shadow-sm active:scale-[0.98]"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientAppointments;
