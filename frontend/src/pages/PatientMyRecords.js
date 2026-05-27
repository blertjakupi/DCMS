import { useMemo, useState } from 'react';
import PatientNavbar from '../components/PatientNavbar';

const recordTypes = ['All', 'Treatments', 'X-Rays', 'Documents'];

const records = [
  {
    id: 1,
    type: 'Treatments',
    icon: 'dentistry',
    iconClass: 'bg-surface-container text-primary',
    title: 'Root Canal Treatment',
    provider: 'Dr. Sarah Smith',
    date: 'Oct 15, 2023',
    status: 'Completed',
  },
  {
    id: 2,
    type: 'X-Rays',
    icon: 'image',
    iconClass: 'bg-secondary-container/30 text-secondary',
    title: 'Panoramic X-Ray',
    provider: 'Radiology Dept',
    date: 'Sep 12, 2023',
    status: 'Available',
  },
  {
    id: 3,
    type: 'Documents',
    icon: 'description',
    iconClass: 'bg-tertiary-container/20 text-tertiary',
    title: 'Treatment Summary PDF',
    provider: 'Dr. John Doe',
    date: 'Aug 05, 2023',
    status: 'Available',
  },
  {
    id: 4,
    type: 'Treatments',
    icon: 'dentistry',
    iconClass: 'bg-surface-container text-primary',
    title: 'Cavity Filling',
    provider: 'Dr. Sarah Smith',
    date: 'Jun 20, 2023',
    status: 'Completed',
  },
];

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
  const [activeType, setActiveType] = useState('All');
  const [search, setSearch] = useState('');

  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesType = activeType === 'All' || record.type === activeType;
      const matchesSearch =
        !query ||
        record.title.toLowerCase().includes(query) ||
        record.provider.toLowerCase().includes(query) ||
        record.date.toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [activeType, search]);

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
          <button className="bg-primary text-on-primary font-label-bold px-6 py-3 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm active:scale-95 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              description
            </span>
            Request Records
          </button>
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
              const status = statusStyles[record.status];

              return (
                <article
                  key={record.id}
                  className="bg-surface rounded-xl p-6 border border-outline-variant/20 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${record.iconClass}`}>
                      <span className="material-symbols-outlined">{record.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-headline-md font-headline-md text-on-background">{record.title}</h3>
                      <div className="text-body-base text-on-surface-variant flex items-center gap-2 mt-1">
                        <span>{record.provider}</span>
                        <span className="text-outline-variant">•</span>
                        <span>{record.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <span className={`px-3 py-1 rounded-full text-caption font-label-bold flex items-center gap-1 ${status.className}`}>
                      <span className="material-symbols-outlined text-[14px]">{status.icon}</span>
                      {record.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <button className="text-primary hover:bg-surface-container px-4 py-2 rounded-lg font-label-bold transition-colors">
                        View
                      </button>
                      <button
                        aria-label={`Download ${record.title}`}
                        className="text-on-surface-variant hover:bg-surface-container p-2 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined">download</span>
                      </button>
                    </div>
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
          <span>Total Records: 14</span>
          <span>Last Updated: Oct 20, 2023</span>
        </footer>
      </main>
    </div>
  );
}

export default PatientMyRecords;
