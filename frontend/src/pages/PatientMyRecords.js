import { useState, useEffect, useMemo } from 'react';
import PatientNavbar from '../components/PatientNavbar';
import { authFetch } from '../utils/authFetch';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const recordTypes = ['All', 'Treatments', 'X-Rays', 'Documents'];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const statusStyles = {
  Completed: {
    className: 'bg-[#e6f4ea] text-[#137333]',
    icon: 'check_circle',
  },
  Available: {
    className: 'bg-secondary-fixed text-on-secondary-fixed-variant',
    icon: 'info',
  },
};

function PatientMyRecords() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [activeType, setActiveType] = useState('All');
  const [search, setSearch] = useState('');

  const downloadRecord = async (record) => {
  try {
    const pdfContent = document.createElement('div');
    pdfContent.style.position = 'absolute';
    pdfContent.style.left = '-9999px';
    pdfContent.style.top = '-9999px';
    pdfContent.style.width = '800px';
    pdfContent.style.padding = '0';
    pdfContent.style.fontFamily = "'Inter', sans-serif";
    pdfContent.style.backgroundColor = '#f8fafc';
    pdfContent.style.color = '#111e1d';
    pdfContent.style.lineHeight = '1.5';

    pdfContent.innerHTML = `
      <div class="a4-canvas" style="width: 100%; max-width: 800px; min-height: 1123px; margin: 0 auto; background: white; box-shadow: none; padding: 60px 48px; font-family: 'Inter', sans-serif;">
        <!-- Brand Header -->
        <header style="display: flex; flex-direction: column; align-items: center; margin-bottom: 32px;">
          <div style="width: 64px; height: 64px; border-radius: 18px; background: #e8f7f5; color: #004943; display: flex; align-items: center; justify-content: center; font-family: 'Material Symbols Outlined'; font-size: 38px; font-variation-settings: 'FILL' 1; margin-bottom: 16px;">dentistry</div>
          <h1 style="font-family: 'Manrope', sans-serif; font-size: 40px; font-weight: 700; letter-spacing: -0.02em; color: #004943; margin: 0;">UBT Dent</h1>
          <div style="margin-top: 32px; display: flex; flex-direction: column; align-items: center; width: 100%;">
            <p style="font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #3f4947; margin-bottom: 8px;">Dental Diagnosis Report</p>
            <div style="height: 2px; width: 48px; background-color: #004943; border-radius: 9999px;"></div>
          </div>
        </header>

        <!-- Summary Metadata Card -->
        <section style="background-color: #e8f7f5; border: 1px solid #bec9c6; border-radius: 12px; padding: 16px; margin-bottom: 32px;">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px 20px;">
            <div>
              <label style="font-weight: 700; font-size: 12px; color: #004943; display: block; margin-bottom: 4px;">Record ID</label>
              <p style="font-size: 16px; line-height: 24px; color: #111e1d; margin: 0;">${record.id}</p>
            </div>
            <div>
              <label style="font-weight: 700; font-size: 12px; color: #004943; display: block; margin-bottom: 4px;">Date</label>
              <p style="font-size: 16px; line-height: 24px; color: #111e1d; margin: 0;">${record.date}</p>
            </div>
            <div>
              <label style="font-weight: 700; font-size: 12px; color: #004943; display: block; margin-bottom: 4px;">Patient</label>
              <p style="font-size: 16px; line-height: 24px; color: #111e1d; margin: 0;">${patient?.first_name || ''} ${patient?.last_name || ''}</p>
            </div>
            <div>
              <label style="font-weight: 700; font-size: 12px; color: #004943; display: block; margin-bottom: 4px;">Tooth</label>
              <p style="font-size: 16px; line-height: 24px; color: #111e1d; margin: 0;">${record.tooth || '—'}</p>
            </div>
            <div>
              <label style="font-weight: 700; font-size: 12px; color: #004943; display: block; margin-bottom: 4px;">Provider</label>
              <p style="font-size: 16px; line-height: 24px; color: #111e1d; margin: 0;">${record.provider}</p>
            </div>
            <div>
              <label style="font-weight: 700; font-size: 12px; color: #004943; display: block; margin-bottom: 4px;">Type</label>
              <p style="font-size: 16px; line-height: 24px; color: #111e1d; margin: 0;">${record.type}</p>
            </div>
          </div>
        </section>

        <!-- Content Body -->
        <div style="display: flex; flex-direction: column; gap: 32px; flex-grow: 1;">
          <!-- Diagnosis Section -->
          <section>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <div style="width: 4px; height: 32px; background-color: #004943; border-radius: 9999px;"></div>
              <h2 style="font-family: 'Manrope', sans-serif; font-size: 20px; font-weight: 600; color: #004943; margin: 0;">Diagnosis / Condition</h2>
            </div>
            <div style="background-color: #e8f7f5; border-radius: 8px; padding: 16px; border: 1px solid transparent;">
              <p style="font-size: 16px; line-height: 24px; color: #111e1d; margin: 0;">${record.title}</p>
            </div>
          </section>

          <!-- Clinical Notes Section -->
          <section>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <div style="width: 4px; height: 32px; background-color: #004943; border-radius: 9999px;"></div>
              <h2 style="font-family: 'Manrope', sans-serif; font-size: 20px; font-weight: 600; color: #004943; margin: 0;">Clinical Notes</h2>
            </div>
            <div style="background-color: #e8f7f5; border-radius: 8px; padding: 16px; min-height: 100px;">
              <p style="font-size: 14px; line-height: 20px; color: #111e1d; margin: 0;">${record.notes}</p>
            </div>
          </section>

          <!-- No Images Placeholder -->
          <section style="margin-top: 32px;">
            <div style="border-top: 1px solid #bec9c6; padding-top: 32px; text-align: center;">
              <p style="font-size: 14px; color: #6f7977; font-style: italic;">No diagnostic images or radiographs attached to this report.</p>
            </div>
          </section>
        </div>

        <!-- Footer -->
        <footer style="margin-top: 32px; border-top: 1px solid #bec9c6; padding-top: 16px; text-align: center;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <p style="font-size: 14px; line-height: 20px; color: #3f4947; margin: 0;">UBT Dent - Dukagjini Center, Prishtina, Kati 3</p>
            <p style="font-size: 12px; line-height: 16px; color: #6f7977; font-style: italic; margin: 0;">This document is electronically generated and does not require a physical signature.</p>
            <p style="font-weight: 700; font-size: 12px; line-height: 16px; color: #3f4947; margin-top: 8px;">Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <div style="margin-top: 16px; display: flex; justify-content: center; align-items: center; gap: 16px; opacity: 0.2;">
            <div style="height: 1px; width: 80px; background-color: #6f7977;"></div>
            <span style="font-family: 'Material Symbols Outlined'; font-size: 16px; color: #6f7977; font-variation-settings: 'FILL' 1;">verified_user</span>
            <div style="height: 1px; width: 80px; background-color: #6f7977;"></div>
          </div>
        </footer>
      </div>
    `;

    document.body.appendChild(pdfContent);

    const canvas = await html2canvas(pdfContent, {
      scale: 2,
      backgroundColor: '#f8fafc',
      logging: false,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`diagnosis-record-${record.id}.pdf`);
    document.body.removeChild(pdfContent);
  } catch (err) {
    console.error(err);
    setError('Failed to generate PDF. Please try again.');
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

        const recRes = await authFetch(`/api/dental-records/patient/${patData.patient_id}`);
        if (!recRes.ok) throw new Error('Failed to load dental records');
        const recData = await recRes.json();
        setRecords(recData.data || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, []);

  const mappedRecords = useMemo(() => {
    return records.map((rec) => {
      const condition = rec.condition || 'Dental Examination';
      const notes = rec.notes || 'Routine checkup and dental cleaning.';
      
      // Determine Type
      let type = 'Treatments';
      let icon = 'dentistry';
      let iconClass = 'bg-surface-container text-primary';

      const conditionLower = condition.toLowerCase();
      if (conditionLower.includes('x-ray') || conditionLower.includes('röntgen') || conditionLower.includes('rentgen') || conditionLower.includes('radiology')) {
        type = 'X-Rays';
        icon = 'image';
        iconClass = 'bg-secondary-container/30 text-secondary';
      } else if (conditionLower.includes('pdf') || conditionLower.includes('document') || conditionLower.includes('fletë') || conditionLower.includes('raport')) {
        type = 'Documents';
        icon = 'description';
        iconClass = 'bg-tertiary-container/20 text-tertiary';
      }

      const dentistName = rec.Dentist ? `Dr. ${rec.Dentist.first_name} ${rec.Dentist.last_name}` : 'General Clinic';

      return {
        id: rec.record_id,
        type,
        icon,
        iconClass,
        title: condition,
        provider: dentistName,
        date: formatDate(rec.record_date),
        notes,
        tooth: rec.tooth,
        status: 'Available',
      };
    });
  }, [records]);

  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return mappedRecords.filter((record) => {
      const matchesType = activeType === 'All' || record.type === activeType;
      const matchesSearch =
        !query ||
        record.title.toLowerCase().includes(query) ||
        record.provider.toLowerCase().includes(query) ||
        record.notes.toLowerCase().includes(query) ||
        record.date.toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [activeType, search, mappedRecords]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex flex-col justify-center items-center font-body-base text-on-surface">
        <span className="material-symbols-outlined text-primary text-[48px] animate-spin mb-4">
          progress_activity
        </span>
        <p className="text-body-lg">Loading records...</p>
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

  const lastUpdated = mappedRecords.length > 0 ? mappedRecords[0].date : 'N/A';

  return (
    <div className="bg-background min-h-screen flex flex-col text-on-background font-body-base">
      <PatientNavbar />

      <main className="flex-grow w-full max-w-[1200px] mx-auto px-5 md:px-xl py-xl pt-32">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-primary mb-2">
              My Records
            </h1>
            <p className="text-body-base text-on-surface-variant">
              View your dental history, treatment notes, and documents.
            </p>
          </div>
        </header>

        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-outline-variant/30 pb-4">
          <div className="flex flex-wrap gap-2">
            {recordTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-5 py-2 rounded-full font-label-bold transition-colors ${
                  activeType === type
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface hover:bg-surface-container text-on-surface-variant border border-outline-variant/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <label className="relative w-full lg:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full bg-surface-container-low border border-outline-variant/50 text-body-base rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="Search records..."
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </section>

        {visibleRecords.length > 0 ? (
          <div className="flex flex-col gap-4 mb-12">
            {visibleRecords.map((record) => {
              const status = statusStyles[record.status] || statusStyles.Available;

              return (
                <article
                  key={record.id}
                  className="bg-surface rounded-xl p-6 border border-outline-variant/20 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${record.iconClass}`}>
                      <span className="material-symbols-outlined">{record.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-headline-md font-headline-md text-on-background">
                        {record.title} {record.tooth && <span className="text-primary-container bg-primary/10 px-2 py-0.5 rounded text-sm ml-2">Tooth {record.tooth}</span>}
                      </h3>
                      <p className="text-body-base text-on-surface-variant mt-1 mb-2 max-w-xl">
                        {record.notes}
                      </p>
                      <div className="text-caption text-on-surface-variant flex items-center gap-2 mt-1 font-semibold">
                        <span>{record.provider}</span>
                        <span className="text-outline-variant">•</span>
                        <span>{record.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t border-outline-variant/10 pt-4 md:pt-0 md:border-t-0 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-caption font-label-bold flex items-center gap-1 ${status.className}`}>
                      <span className="material-symbols-outlined text-[14px]">{status.icon}</span>
                      {record.status}
                    </span>
                    <button
                      className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                      onClick={() => downloadRecord(record)}
                      title="Download diagnosis"
                    >
                      <span className="material-symbols-outlined">download</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant/20 mb-12">
            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-outline mb-5">
              <span className="material-symbols-outlined text-4xl">folder_open</span>
            </div>
            <h2 className="text-headline-md font-headline-md text-on-background mb-2">No records found</h2>
            <p className="text-body-base text-on-surface-variant max-w-md">
              Try another record type or search term to find your dental history.
            </p>
          </section>
        )}

        <footer className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-label-bold text-outline px-2">
          <span>Total Records: {mappedRecords.length}</span>
          <span>Last Updated: {lastUpdated}</span>
        </footer>
      </main>
    </div>
  );
}

export default PatientMyRecords;
