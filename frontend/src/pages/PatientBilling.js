import { useMemo, useState } from 'react';
import PatientNavbar from '../components/PatientNavbar';

const filters = ['All', 'Pending', 'Paid', 'Overdue'];

const summaryItems = [
  { label: 'Total Due', value: '$120.00', valueClass: 'text-error' },
  { label: 'Paid This Year', value: '$1,450.00', valueClass: 'text-primary' },
  { label: 'Next Due Date', value: 'Nov 15, 2023', valueClass: 'text-on-surface' },
];

const invoices = [
  {
    id: 'INV-2023-041',
    title: 'Root Canal Treatment',
    provider: 'Dr. Sarah Smith',
    date: 'Oct 15, 2023',
    amount: '$120.00',
    status: 'Pending',
  },
  {
    id: 'INV-2023-038',
    title: 'General Consultation & Cleaning',
    provider: 'Dr. James Wilson',
    date: 'Sep 02, 2023',
    amount: '$250.00',
    status: 'Paid',
  },
  {
    id: 'INV-2023-025',
    title: 'Dental X-Ray & Exam',
    provider: 'Dr. Sarah Smith',
    date: 'Jun 18, 2023',
    amount: '$180.00',
    status: 'Paid',
  },
  {
    id: 'INV-2023-012',
    title: 'Teeth Whitening Procedure',
    provider: 'Dr. James Wilson',
    date: 'Feb 10, 2023',
    amount: '$450.00',
    status: 'Paid',
  },
];

const statusStyles = {
  Pending: 'bg-secondary-container text-on-secondary-container',
  Paid: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Overdue: 'bg-error-container text-on-error-container',
};

function PatientBilling() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  const visibleInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesFilter = activeFilter === 'All' || invoice.status === activeFilter;
      const matchesSearch =
        !query ||
        invoice.id.toLowerCase().includes(query) ||
        invoice.title.toLowerCase().includes(query) ||
        invoice.provider.toLowerCase().includes(query) ||
        invoice.date.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search]);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col antialiased font-body-base">
      <PatientNavbar />

      <main className="flex-grow w-full px-5 md:px-xl max-w-[1200px] mx-auto py-xl pt-32 flex flex-col gap-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-primary mb-2">
              Billing
            </h1>
            <p className="text-body-base text-on-surface-variant">
              View and manage your invoices and payment history.
            </p>
          </div>
          <button className="bg-primary text-on-primary font-label-bold px-6 py-3 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm active:scale-95 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              payment
            </span>
            Make a Payment
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {summaryItems.map((item) => (
            <article
              key={item.label}
              className="bg-surface rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between h-32"
            >
              <div className="text-caption font-label-bold text-on-surface-variant uppercase tracking-wide">
                {item.label}
              </div>
              <div className={`text-headline-lg font-headline-lg ${item.valueClass}`}>{item.value}</div>
            </article>
          ))}
        </section>

        <section className="flex flex-col md:flex-row justify-between items-center gap-6 bg-surface p-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant/20">
          <div className="flex overflow-x-auto w-full md:w-auto">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`font-label-bold px-5 py-2 rounded-full transition-colors whitespace-nowrap ${
                  activeFilter === filter
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-variant/50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <label className="relative w-full md:w-64 px-2 pb-2 md:pb-0">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none md:top-2 md:-translate-y-0">
              search
            </span>
            <input
              className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-body-base text-on-surface focus:ring-2 focus:ring-primary/50 outline-none placeholder:text-on-surface-variant/60"
              placeholder="Search invoices..."
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </section>

        {visibleInvoices.length > 0 ? (
          <section className="flex flex-col gap-4">
            {visibleInvoices.map((invoice) => (
              <article
                key={invoice.id}
                className="bg-surface rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
              >
                <div className="flex flex-col gap-2 flex-grow">
                  <span className="text-caption font-label-bold text-outline">#{invoice.id}</span>
                  <h3 className="text-headline-md font-headline-md text-on-surface">{invoice.title}</h3>
                  <div className="text-body-base text-on-surface-variant flex items-center gap-2">
                    <span>{invoice.provider}</span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                    <span>{invoice.date}</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 w-full md:w-auto">
                  <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                    <span className="text-headline-md font-headline-md text-on-surface">{invoice.amount}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-label-bold mt-1 ${statusStyles[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <button className="text-primary font-label-bold hover:underline transition-all px-2">
                      View Invoice
                    </button>
                    <button
                      aria-label={`Download ${invoice.id}`}
                      className="text-on-surface-variant hover:bg-surface-variant/50 p-2 rounded-full transition-colors flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined">download</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant/20">
            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-outline mb-5">
              <span className="material-symbols-outlined text-4xl">receipt_long</span>
            </div>
            <h2 className="text-headline-md font-headline-md text-on-surface mb-2">No invoices found</h2>
            <p className="text-body-base text-on-surface-variant max-w-md">
              Try another invoice status or search term to find your billing history.
            </p>
          </section>
        )}

        <footer className="flex justify-between items-center text-caption font-label-bold text-outline pt-4 pb-8">
          <span>Total Invoices: 24</span>
          <span>Last Updated: Oct 20, 2023</span>
        </footer>
      </main>
    </div>
  );
}

export default PatientBilling;
