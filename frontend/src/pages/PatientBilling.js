import { useState, useEffect, useMemo } from 'react';
import PatientNavbar from '../components/PatientNavbar';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

const filters = ['All', 'Pending', 'Paid', 'Overdue'];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const statusStyles = {
  Pending: 'bg-secondary-container text-on-secondary-container',
  Paid: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Overdue: 'bg-error-container text-on-error-container',
  'Partially Paid': 'bg-secondary-container text-on-secondary-container',
  Unpaid: 'bg-error-container text-on-error-container',
};

function PatientBilling() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [paymentModal, setPaymentModal] = useState({ open: false, invoice: null });
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      setError('');
      try {
        const patRes = await fetch('/api/patients/me', { headers: authHeaders() });
        if (!patRes.ok) throw new Error('Failed to load patient profile');
        const patData = await patRes.json();
        setPatient(patData);

        const invRes = await fetch('/api/invoices', { headers: authHeaders() });
        if (!invRes.ok) throw new Error('Failed to load invoices');
        const invData = await invRes.json();
        setInvoices(invData.data || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, []);

  // Map backend status to frontend display status
  const mappedInvoices = useMemo(() => {
    return invoices.map(inv => {
      const displayStatus = inv.status === 'Unpaid' ? 'Pending' : inv.status;
      const title = inv.InvoiceItems?.[0]?.Treatment?.treatment_name || 'Dental Care Treatment';
      const provider = 'DentaCare Pro Clinic';
      const totalAmount = parseFloat(inv.total_amount || 0);
      const paidAmount = (inv.Payments || []).reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
      const balance = Math.max(totalAmount - paidAmount, 0);

      return {
        id: `INV-2026-${inv.invoice_id.toString().padStart(3, '0')}`,
        title,
        provider,
        date: formatDate(inv.invoice_date),
        amount: `$${balance.toFixed(2)}`,
        totalAmount,
        paidAmount,
        rawAmount: balance,
        status: displayStatus, // Pending, Paid, Overdue, Partially Paid
        invoiceDateRaw: new Date(inv.invoice_date),
        raw: inv
      };
    });
  }, [invoices]);

  const openPaymentModal = (invoice) => {
    setPaymentError('');
    setPaymentMethod('Card');
    setPaymentModal({ open: true, invoice });
  };

  const closePaymentModal = () => {
    setPaymentModal({ open: false, invoice: null });
    setPaymentError('');
  };

  const handlePayment = async (event) => {
    event.preventDefault();
    if (!paymentModal.invoice) return;

    setPaymentLoading(true);
    setPaymentError('');

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          invoice_id: paymentModal.invoice.raw.invoice_id,
          amount: paymentModal.invoice.rawAmount,
          payment_date: new Date().toISOString().slice(0, 10),
          payment_method: paymentMethod,
          payment_status: 'Completed'
        })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Payment could not be completed.');

      const invRes = await fetch('/api/invoices', { headers: authHeaders() });
      if (!invRes.ok) throw new Error('Failed to refresh invoices');
      const invData = await invRes.json();
      setInvoices(invData.data || []);
      closePaymentModal();
    } catch (err) {
      setPaymentError(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const visibleInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return mappedInvoices.filter((invoice) => {
      const matchesFilter = activeFilter === 'All' || invoice.status === activeFilter;
      const matchesSearch =
        !query ||
        invoice.id.toLowerCase().includes(query) ||
        invoice.title.toLowerCase().includes(query) ||
        invoice.provider.toLowerCase().includes(query) ||
        invoice.date.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search, mappedInvoices]);

  // Dynamic calculations for KPI summary items
  const totalDue = useMemo(() => {
    return mappedInvoices
      .filter(inv => inv.status === 'Pending' || inv.status === 'Unpaid' || inv.status === 'Partially Paid')
      .reduce((sum, inv) => sum + inv.rawAmount, 0);
  }, [mappedInvoices]);

  const paidThisYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return mappedInvoices
      .filter(inv => inv.status === 'Paid' && inv.invoiceDateRaw.getFullYear() === currentYear)
      .reduce((sum, inv) => sum + inv.rawAmount, 0);
  }, [mappedInvoices]);

  const nextDueDate = useMemo(() => {
    const pending = mappedInvoices.filter(inv => inv.status === 'Pending' || inv.status === 'Partially Paid');
    if (pending.length === 0) return 'No due date';
    // Sort ascending by date
    pending.sort((a, b) => a.invoiceDateRaw - b.invoiceDateRaw);
    return pending[0].date;
  }, [mappedInvoices]);

  const summaryItems = useMemo(() => {
    return [
      { label: 'Total Due', value: `$${totalDue.toFixed(2)}`, valueClass: totalDue > 0 ? 'text-error' : 'text-primary' },
      { label: 'Paid This Year', value: `$${paidThisYear.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valueClass: 'text-primary' },
      { label: 'Next Due Date', value: nextDueDate, valueClass: 'text-on-surface' },
    ];
  }, [totalDue, paidThisYear, nextDueDate]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex flex-col justify-center items-center font-body-base text-on-surface">
        <span className="material-symbols-outlined text-primary text-[48px] animate-spin mb-4">
          progress_activity
        </span>
        <p className="text-body-lg">Loading billing records...</p>
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
                  <span className="text-caption font-label-bold text-outline">{invoice.id}</span>
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-label-bold mt-1 ${statusStyles[invoice.status] || 'bg-surface-variant'}`}>
                      {invoice.status}
                    </span>
                  </div>
                  {invoice.status !== 'Paid' && invoice.rawAmount > 0 && (
                    <button
                      className="bg-primary text-on-primary px-5 py-2 rounded-full font-label-bold hover:bg-primary-container hover:text-on-primary-container transition-colors"
                      onClick={() => openPaymentModal(invoice)}
                    >
                      Pay Now
                    </button>
                  )}
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
          <span>Total Invoices: {mappedInvoices.length}</span>
          <span>Last Updated: {nextDueDate}</span>
        </footer>
      </main>

      {paymentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closePaymentModal}>
          <form className="bg-surface w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onSubmit={handlePayment} onClick={(event) => event.stopPropagation()}>
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
              <h2 className="text-headline-md font-headline-md text-on-surface">Pay Invoice</h2>
              <button type="button" onClick={closePaymentModal} className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {paymentError && (
                <div className="p-3 bg-error-container/30 text-error text-sm rounded border border-error-container">
                  {paymentError}
                </div>
              )}

              <div className="bg-surface-container-low rounded-xl p-4">
                <p className="text-caption text-on-surface-variant font-label-bold">Amount</p>
                <p className="text-headline-md font-headline-md text-on-surface">{paymentModal.invoice?.amount}</p>
              </div>

              <label className="block">
                <span className="block font-label-bold text-on-surface-variant mb-2">Payment Method</span>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-outline-variant/50 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-body-base"
                >
                  <option>Card</option>
                  <option>Bank Transfer</option>
                </select>
              </label>
            </div>

            <div className="p-6 bg-surface-container-low">
              <button type="submit" disabled={paymentLoading} className="w-full bg-primary text-on-primary font-label-bold py-3 rounded-full hover:bg-primary-container transition-colors shadow-sm active:scale-[0.98] disabled:opacity-60">
                {paymentLoading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default PatientBilling;
