import { useMemo, useState, useEffect } from 'react';
import PatientNavbar from '../components/PatientNavbar';
import { authFetch } from '../utils/authFetch';

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

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatTimeLabel = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const formatDuration = (minutes) => {
  const numericMinutes = Number(minutes || 30);
  if (numericMinutes < 60) return `${numericMinutes} min`;
  const hours = Math.floor(numericMinutes / 60);
  const remainingMinutes = numericMinutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes} min` : `${hours}h`;
};

const getTodayDateString = () => {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
};

const toDateString = (date) => {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
};

const getLocalDate = (dateString) => {
  const [year, month, day] = String(dateString || '').split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
};

const isSundayDate = (dateString) => getLocalDate(dateString).getDay() === 0;

const buildCalendarDays = (visibleMonth) => {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
};

const getAppointmentDateTime = (appointment) => {
  return new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
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
  const [selectedTime, setSelectedTime] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(() => getLocalDate(getTodayDateString()));
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Search/Filters
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const todayDate = getTodayDateString();

  const fetchAppointments = async (patientId) => {
    try {
      const res = await authFetch(`/api/appointments/patient/${patientId}`);
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
      
        const patRes = await authFetch('/api/patients/me');
        if (!patRes.ok) throw new Error('Failed to load patient profile');
        const patData = await patRes.json();
        setPatient(patData);

        
        await fetchAppointments(patData.patient_id);

      
        const [dentRes, treatRes] = await Promise.all([
          authFetch('/api/dentists'),
          authFetch('/api/treatments')
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

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDentist || !selectedDate || !selectedTreatment || isSundayDate(selectedDate)) {
        setAvailableSlots([]);
        setSelectedTime('');
        return;
      }

      setSlotsLoading(true);
      try {
        const params = new URLSearchParams({
          date: selectedDate,
          treatmentId: selectedTreatment
        });
        const res = await authFetch(`/api/appointments/dentist/${selectedDentist}/availability?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Nuk u moren oraret e lira.');

        const slots = data.data?.slots || [];
        setAvailableSlots(slots);

        const stillAvailable = slots.some((slot) => slot.time === selectedTime && slot.available);
        if (!stillAvailable) {
          setSelectedTime(slots.find((slot) => slot.available)?.time || '');
        }
      } catch (err) {
        console.error(err);
        setAvailableSlots([]);
        setSelectedTime('');
        setBookingError(err.message);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedDentist, selectedDate, selectedTreatment, selectedTime]);

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
      const treatmentName = appointment.Treatment?.treatment_name || '';
      const notes = appointment.notes || '';
      
      const matchesSearch =
        !normalizedSearch ||
        notes.toLowerCase().includes(normalizedSearch) ||
        dentistName.toLowerCase().includes(normalizedSearch) ||
        treatmentName.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search, appointments]);

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const visibleMonthLabel = visibleMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
  const selectedTreatmentDetails = useMemo(
    () => treatments.find((treatment) => treatment.treatment_id.toString() === selectedTreatment),
    [selectedTreatment, treatments]
  );

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDentist || !selectedTreatment || !selectedDate || !selectedTime) {
      setBookingError('Ju lutem plotësoni të gjitha fushat e detyrueshme.');
      return;
    }

    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    if (isSundayDate(selectedDate)) {
      setBookingError('Klinika nuk punon te dielave. Ju lutem zgjidhni nje date tjeter.');
      return;
    }

    if (selectedDate < todayDate || selectedDateTime < new Date()) {
      setBookingError('Nuk mund të rezervoni takim në datë ose orë të kaluar.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess('');
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

      const res = await authFetch('/api/appointments', {
        method: 'POST',
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
      setSelectedTime('');
      setBookingSuccess('Termini u rezervua me sukses.');
      window.setTimeout(() => setBookingSuccess(''), 5000);
    } catch (err) {
      console.error(err);
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (appointment) => {
    if (!appointment || appointment.status !== 'Scheduled' || getAppointmentDateTime(appointment) < new Date()) {
      alert('Nuk mund të anuloni një takim që ka kaluar.');
      return;
    }

    if (!window.confirm('A jeni të sigurt që dëshironi të anuloni këtë takim?')) return;
    
    try {
      const res = await authFetch(`/api/appointments/${appointment.appointment_id}`, {
        method: 'DELETE',

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
    setBookingSuccess('');
    setVisibleMonth(getLocalDate(selectedDate || todayDate));
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

        {bookingSuccess && (
          <div className="mb-6 rounded-xl border border-[#ceead6] bg-[#e6f4ea] px-4 py-3 text-[#137333] text-label-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{bookingSuccess}</span>
          </div>
        )}

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
              const appDate = new Date(`${appointment.appointment_date}T00:00:00`);
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const monthStr = months[appDate.getMonth()];
              const dayStr = appDate.getDate().toString();
              const dentistName = appointment.Dentist ? `Dr. ${appointment.Dentist.first_name} ${appointment.Dentist.last_name}` : 'Dentist';
              const dentistInitials = appointment.Dentist ? `${appointment.Dentist.first_name[0]}${appointment.Dentist.last_name[0]}`.toUpperCase() : 'DN';
              const treatmentName = appointment.Treatment?.treatment_name || 'Dental Care Visit';
              const canCancel = appointment.status === 'Scheduled' && getAppointmentDateTime(appointment) >= new Date();

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
                    <h3 className={`text-headline-md font-headline-md ${styles.title}`}>{treatmentName}</h3>
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
                    {appointment.notes && (
                      <p className="text-caption text-on-surface-variant">{appointment.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-outline-variant/20 sm:border-t-0">
                    <span className={`font-label-bold text-caption px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1 ${styles.badge}`}>
                      {appointment.status === 'Completed' && (
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      )}
                      {appointment.status}
                    </span>
                    <div className="flex gap-2">
                      {canCancel && (
                        <button
                          onClick={() => handleCancelAppointment(appointment)}
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
            className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
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

            <div className="p-6 space-y-4 overflow-y-auto">
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
                      {t.treatment_name} - {formatDuration(t.average_duration)} - ${parseFloat(t.price).toFixed(2)}
                    </option>
                  ))}
                  {treatments.length === 0 && <option>Nuk ka trajtime të disponueshme</option>}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-label-bold text-on-surface-variant">Zgjidh Datën *</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant"
                        title="Muaji i kaluar"
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                      </button>
                      <span className="text-label-base font-label-bold text-on-surface min-w-28 text-center">
                        {visibleMonthLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant"
                        title="Muaji tjeter"
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-caption">
                    {weekDays.map((day) => (
                      <span
                        key={day}
                        className={`py-1 font-label-bold ${day === 'Sun' ? 'text-error' : 'text-on-surface-variant'}`}
                      >
                        {day}
                      </span>
                    ))}
                    {calendarDays.map((date, index) => {
                      if (!date) return <span key={`empty-${index}`} className="h-9" />;

                      const dateString = toDateString(date);
                      const isSelected = selectedDate === dateString;
                      const isPast = dateString < todayDate;
                      const isSunday = date.getDay() === 0;
                      const disabled = isPast || isSunday;

                      return (
                        <button
                          key={dateString}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            setSelectedDate(dateString);
                            setBookingError('');
                          }}
                          className={`h-9 rounded-lg font-label-bold transition-colors ${
                            isSelected
                              ? 'bg-primary text-on-primary'
                              : isSunday
                                ? 'bg-error-container/30 text-error'
                                : 'text-on-surface hover:bg-primary/10'
                          } ${disabled ? 'opacity-60 cursor-not-allowed hover:bg-error-container/30' : ''}`}
                          title={isSunday ? 'Klinika nuk punon te dielave' : dateString}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-label-bold text-on-surface-variant mb-2">Zgjidh Orën *</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-4 py-2 bg-surface border border-outline-variant/50 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-body-base"
                    required
                    disabled={!selectedDate || slotsLoading || availableSlots.length === 0}
                  >
                    <option value="">
                      {slotsLoading ? 'Duke kontrolluar oraret...' : 'Zgjidhni orarin'}
                    </option>
                    {availableSlots.map((slot) => (
                      <option key={slot.time} value={slot.time} disabled={!slot.available} title={slot.reason || ''}>
                        {formatTimeLabel(slot.time)}{slot.available ? '' : ` - ${slot.reason || 'i zene'}`}
                      </option>
                    ))}
                  </select>
                  {selectedDate && !slotsLoading && availableSlots.length > 0 && !availableSlots.some((slot) => slot.available) && (
                    <p className="mt-2 text-caption text-error">
                      Nuk ka orare te lira per kete dentist ne daten e zgjedhur.
                    </p>
                  )}
                  <p className="mt-2 text-caption text-on-surface-variant">
                    Orari i klinikes: 08:00-20:00, cdo 30 minuta. Trajtimi i zgjedhur zgjat {formatDuration(selectedTreatmentDetails?.average_duration)}.
                  </p>
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
                disabled={bookingLoading || !selectedTime}
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
