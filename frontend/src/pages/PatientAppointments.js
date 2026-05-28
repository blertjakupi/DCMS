import { useMemo, useState, useEffect } from 'react';
import PatientNavbar from '../components/PatientNavbar';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

const filters = ['All', 'Upcoming', 'Completed', 'Cancelled'];

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
  'No-Show': {
    card: 'border-error/20 opacity-60',
    date: 'bg-surface-variant text-on-surface-variant',
    title: 'text-on-surface line-through decoration-outline-variant',
    badge: 'bg-error/10 text-error',
  }
};

const defaultTimeSlots = ['09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '11:30:00', '13:00:00', '13:30:00', '14:00:00', '14:30:00', '15:00:00', '15:30:00'];

const formatTimeLabel = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

function PatientAppointments() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  
  // Modal State & Dropdowns
  const [dentists, setDentists] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Booking Form State
  const [selectedDentist, setSelectedDentist] = useState('');
  const [selectedTreatment, setSelectedTreatment] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('10:00:00');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Search/Filters
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchAppointments = async (patientId) => {
    try {
      const res = await fetch(`/api/appointments/patient/${patientId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load appointments');
      const data = await res.json();
      setAppointments(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Get current Patient profile
        const patRes = await fetch('/api/patients/me', { headers: authHeaders() });
        if (!patRes.ok) throw new Error('Failed to load patient profile');
        const patData = await patRes.json();
        setPatient(patData);

        // 2. Fetch appointments
        await fetchAppointments(patData.patient_id);

        // 3. Fetch dentists & treatments in parallel for booking dropdowns
        const [dentRes, treatRes] = await Promise.all([
          fetch('/api/dentists', { headers: authHeaders() }),
          fetch('/api/treatments', { headers: authHeaders() })
        ]);

        if (dentRes.ok) {
          const dentData = await dentRes.json();
          setDentists(dentData.data || []);
          if (dentData.data?.length > 0) {
            setSelectedDentist(dentData.data[0].dentist_id.toString());
          }
        }

        if (treatRes.ok) {
          const treatData = await treatRes.json();
          setTreatments(treatData.data || []);
          if (treatData.data?.length > 0) {
            setSelectedTreatment(treatData.data[0].treatment_id.toString());
          }
        }

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, []);

  const visibleAppointments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const now = new Date();

    return appointments.filter((appointment) => {
      const appDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Upcoming' && appointment.status === 'Scheduled' && appDateTime >= now) ||
        appointment.status === activeFilter;
        
      const dentistName = appointment.Dentist ? `${appointment.Dentist.first_name} ${appointment.Dentist.last_name}` : '';
      const notes = appointment.notes || '';
      
      const matchesSearch =
        !normalizedSearch ||
        notes.toLowerCase().includes(normalizedSearch) ||
        dentistName.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search, appointments]);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDentist || !selectedTreatment || !selectedDate || !selectedTime) {
      setBookingError('Ju lutem plotësoni të gjitha fushat e detyrueshme.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    try {
      const payload = {
        patient_id: patient.patient_id,
        dentist_id: parseInt(selectedDentist, 10),
        treatment_id: parseInt(selectedTreatment, 10),
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        notes: bookingNotes || 'Patient Self Booking',
        status: 'Scheduled'
      };

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Rezervimi dështoi.');
      }

      // Success
      await fetchAppointments(patient.patient_id);
      setModalOpen(false);
      setBookingNotes('');
      // Reset date/time
      setSelectedDate('');
    } catch (err) {
      console.error(err);
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm('A jeni të sigurt që dëshironi të anuloni këtë takim?')) return;
    
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Anulimi dështoi.');
      }

      await fetchAppointments(patient.patient_id);
    } catch (err) {
      alert(err.message);
    }
  };

  const openModal = () => {
    setBookingError('');
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex flex-col justify-center items-center font-body-base text-on-surface">
        <span className="material-symbols-outlined text-primary text-[48px] animate-spin mb-4">
          progress_activity
        </span>
        <p className="text-body-lg">Loading appointments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen flex flex-col justify-center items-center font-body-base text-error">
        <span className="material-symbols-outlined text-[48px] mb-4">error</span>
        <p className="text-body-lg font-bold">Error: {error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 bg-primary text-on-primary px-6 py-2 rounded-full font-label-bold">
          Try Again
        </button>
      </div>
    );
  }

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
                placeholder="Search dentist or notes..."
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>
        </section>

        {visibleAppointments.length > 0 ? (
          <div className="flex flex-col gap-4">
            {visibleAppointments.map((appointment) => {
              const styles = statusStyles[appointment.status] || statusStyles.Scheduled;
              const appDate = new Date(appointment.appointment_date);
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const monthStr = months[appDate.getMonth()];
              const dayStr = appDate.getDate().toString();
              const dentistName = appointment.Dentist ? `Dr. ${appointment.Dentist.first_name} ${appointment.Dentist.last_name}` : 'Dentist';
              const dentistInitials = appointment.Dentist ? `${appointment.Dentist.first_name[0]}${appointment.Dentist.last_name[0]}`.toUpperCase() : 'DN';

              return (
                <article
                  key={appointment.appointment_id}
                  className={`bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow duration-300 p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center border group ${styles.card}`}
                >
                  <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-lg flex-shrink-0 ${styles.date}`}>
                    <span className="text-caption uppercase tracking-wider">{monthStr}</span>
                    <span className="text-headline-md font-headline-md leading-none mt-1">{dayStr}</span>
                  </div>

                  <div className="flex-grow flex flex-col gap-2">
                    <h3 className={`text-headline-md font-headline-md ${styles.title}`}>{appointment.notes || 'Dental Care Visit'}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-on-surface-variant text-body-base">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-caption font-label-bold">
                          {dentistInitials}
                        </div>
                        <span>{dentistName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                        <span>{formatTimeLabel(appointment.appointment_time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">hourglass_empty</span>
                        <span>{appointment.duration || 30} mins</span>
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
                        <button
                          onClick={() => handleCancelAppointment(appointment.appointment_id)}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-error transition-colors"
                          title="Anulo Takimin"
                        >
                          <span className="material-symbols-outlined">close</span>
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
            <h2 className="text-headline-md font-headline-md text-on-surface mb-2">Nuk u gjet asnjë takim</h2>
            <p className="text-body-base text-on-surface-variant max-w-md mb-8">
              Nuk keni asnjë takim që përputhet me këtë filtër. Dëshironi të rezervoni një takim të ri tani?
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
          <form
            onSubmit={handleBookAppointment}
            className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
              <h2 className="text-headline-md font-headline-md text-on-surface">Rezervo Takim të Ri</h2>
              <button
                type="button"
                onClick={closeModal}
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {bookingError && (
                <div className="p-3 bg-error-container/30 text-error text-sm rounded border border-error-container">
                  {bookingError}
                </div>
              )}

              <div>
                <label className="block font-label-bold text-on-surface-variant mb-2">Dentisti *</label>
                <select
                  value={selectedDentist}
                  onChange={(e) => setSelectedDentist(e.target.value)}
                  className="w-full px-4 py-2 bg-surface border border-outline-variant/50 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-body-base"
                  required
                >
                  {dentists.map((d) => (
                    <option key={d.dentist_id} value={d.dentist_id}>
                      Dr. {d.first_name} {d.last_name} ({d.specialization || 'Stomatolog'})
                    </option>
                  ))}
                  {dentists.length === 0 && <option>Nuk ka dentistë të disponueshëm</option>}
                </select>
              </div>

              <div>
                <label className="block font-label-bold text-on-surface-variant mb-2">Lloji i Trajtimit *</label>
                <select
                  value={selectedTreatment}
                  onChange={(e) => setSelectedTreatment(e.target.value)}
                  className="w-full px-4 py-2 bg-surface border border-outline-variant/50 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-body-base"
                  required
                >
                  {treatments.map((t) => (
                    <option key={t.treatment_id} value={t.treatment_id}>
                      {t.name} - ${parseFloat(t.price).toFixed(2)}
                    </option>
                  ))}
                  {treatments.length === 0 && <option>Nuk ka trajtime të disponueshme</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-bold text-on-surface-variant mb-2">Zgjidh Datën *</label>
                  <input
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 bg-surface border border-outline-variant/50 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-body-base"
                    type="date"
                    required
                  />
                </div>

                <div>
                  <label className="block font-label-bold text-on-surface-variant mb-2">Zgjidh Orën *</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-4 py-2 bg-surface border border-outline-variant/50 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-body-base"
                    required
                  >
                    {defaultTimeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {formatTimeLabel(slot)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-label-bold text-on-surface-variant mb-2">Shënime shtesë / Simptomat</label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Shkruani shënime apo simptoma (p.sh. dhimbje dhëmbi, etj.)"
                  className="w-full px-4 py-2 bg-surface border border-outline-variant/50 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-body-base h-20 resize-none"
                />
              </div>
            </div>

            <div className="p-6 bg-surface-container-low">
              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full bg-primary text-on-primary font-label-bold py-3 rounded-full hover:bg-primary-container transition-colors shadow-sm active:scale-[0.98] disabled:opacity-60"
              >
                {bookingLoading ? 'Duke rezervuar...' : 'Konfirmo Rezervimin'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default PatientAppointments;
