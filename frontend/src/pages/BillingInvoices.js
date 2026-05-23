import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

const emptyInvoiceForm = {
  patient_id: '',
  appointment_id: '',
  invoice_date: new Date().toISOString().slice(0, 10),
};

const emptyPaymentForm = {
  invoice_id: '',
  amount: '',
  payment_date: new Date().toISOString().slice(0, 10),
  payment_method: 'Cash',
};

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

const fullName = (item) =>
  [item?.first_name, item?.last_name].filter(Boolean).join(' ') || 'Unknown';

const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

const statusClass = {
  Paid: 'bg-green-100 text-green-700',
  Unpaid: 'bg-blue-100 text-blue-700',
  'Partially Paid': 'bg-orange-100 text-orange-700',
  Cancelled: 'bg-outline-variant/20 text-on-surface-variant',
};

function BillingInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = user?.full_name ? initials(user.full_name) : 'AD';

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [invoicesRes, patientsRes, appointmentsRes, paymentsRes] = await Promise.all([
        fetch('/api/invoices?limit=100', { headers: authHeaders() }),
        fetch('/api/patients', { headers: authHeaders() }),
        fetch('/api/appointments', { headers: authHeaders() }),
        fetch('/api/payments?limit=100', { headers: authHeaders() }),
      ]);

      const [invoicesJson, patientsJson, appointmentsJson, paymentsJson] = await Promise.all([
        invoicesRes.json(),
        patientsRes.json(),
        appointmentsRes.json(),
        paymentsRes.json(),
      ]);

      if (!invoicesRes.ok) throw new Error(invoicesJson.message || 'Could not load invoices.');
      if (!patientsRes.ok) throw new Error(patientsJson.message || 'Could not load patients.');
      if (!appointmentsRes.ok) throw new Error(appointmentsJson.message || 'Could not load appointments.');
      if (!paymentsRes.ok) throw new Error(paymentsJson.message || 'Could not load payments.');

      setInvoices(invoicesJson.data || []);
      setPatients(patientsJson.data || []);
      setAppointments(appointmentsJson.data || []);
      setPayments(paymentsJson.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setInvoiceOpen(false);
        setPaymentOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const paymentTotals = useMemo(() => {
    return payments.reduce((totals, payment) => {
      totals[payment.invoice_id] = (totals[payment.invoice_id] || 0) + Number(payment.amount || 0);
      return totals;
    }, {});
  }, [payments]);

  const stats = useMemo(() => {
    const paid = invoices.filter((invoice) => invoice.status === 'Paid');
    const pending = invoices.filter((invoice) => invoice.status === 'Unpaid' || invoice.status === 'Partially Paid');
    const revenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const overdue = invoices.filter((invoice) => {
      if (invoice.status === 'Paid' || invoice.status === 'Cancelled') return false;
      return invoice.invoice_date < new Date().toISOString().slice(0, 10);
    });

    return {
      revenue,
      paid: paid.length,
      pending: pending.length,
      overdue: overdue.length,
    };
  }, [invoices, payments]);

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const patientName = fullName(invoice.Patient).toLowerCase();
      const matchesSearch =
        !query ||
        patientName.includes(query) ||
        String(invoice.invoice_id).includes(query) ||
        String(invoice.total_amount).includes(query);
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const availableAppointments = useMemo(() => {
    if (!invoiceForm.patient_id) return appointments;
    return appointments.filter((appointment) => String(appointment.patient_id) === String(invoiceForm.patient_id));
  }, [appointments, invoiceForm.patient_id]);

  const updateInvoiceForm = (field, value) => {
    setInvoiceForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === 'patient_id' ? { appointment_id: '' } : {}),
    }));
  };

  const updatePaymentForm = (field, value) => {
    setPaymentForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleCreateInvoice = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(invoiceForm),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Invoice could not be created.');

      setInvoiceForm(emptyInvoiceForm);
      setInvoiceOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openPaymentModal = (invoice) => {
    const paid = paymentTotals[invoice.invoice_id] || 0;
    const balance = Math.max(Number(invoice.total_amount || 0) - paid, 0);

    setPaymentForm({
      ...emptyPaymentForm,
      invoice_id: invoice.invoice_id,
      amount: balance ? String(balance.toFixed(2)) : '',
    });
    setPaymentOpen(true);
  };

  const handleCreatePayment = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...paymentForm,
          amount: Number(paymentForm.amount),
          payment_status: 'Completed',
        }),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Payment could not be recorded.');

      setPaymentForm(emptyPaymentForm);
      setPaymentOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelInvoice = async (invoiceId) => {
    if (!window.confirm('Cancel this invoice?')) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      const json = await response.json();

      if (!response.ok) throw new Error(json.message || 'Invoice could not be cancelled.');

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-background font-body-base text-body-base text-on-background min-h-screen overflow-x-hidden">
      <AdminSidebar />

      <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-surface/90 backdrop-blur-md z-10 flex items-center justify-between px-6 shadow-sm border-b border-outline-variant/20">
        <div className="flex-1 max-w-xl clinical-glow">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant">search</span>
            <input
              className="w-full bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-body-base focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/60"
              placeholder="Search invoices, patients, or amounts..."
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-full transition-all">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-full transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="h-10 w-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-bold">
            {userInitials}
          </div>
        </div>
      </header>

      <main className="md:ml-64 pt-28 p-4 md:p-gutter min-h-screen">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg mt-12">
          <div>
            <nav className="flex gap-2 text-caption text-on-surface-variant mb-1">
              <span>Admin</span>
              <span>/</span>
              <span className="text-primary font-bold">Billing & Invoices</span>
            </nav>
            <h2 className="text-headline-lg font-headline-lg text-on-surface">Billing & Invoices</h2>
          </div>
          <button
            className="bg-primary text-on-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-label-bold shadow-lg hover:bg-on-primary-fixed-variant transition-all active:scale-[0.98]"
            onClick={() => setInvoiceOpen(true)}
          >
            <span className="material-symbols-outlined">add</span>
            New Invoice
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
          {[
            ['payments', 'Total Revenue', formatCurrency(stats.revenue), 'bg-primary/10 text-primary'],
            ['check_circle', 'Paid Invoices', stats.paid, 'bg-green-100 text-green-600'],
            ['schedule', 'Pending Payments', stats.pending, 'bg-blue-100 text-blue-600'],
            ['warning', 'Overdue Invoices', stats.overdue, 'bg-red-100 text-red-600'],
          ].map(([icon, label, value, tone]) => (
            <div key={label} className="bg-surface-container-lowest p-md rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-outline-variant/10 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${tone}`}>
                <span className="material-symbols-outlined text-[32px]">{icon}</span>
              </div>
              <div>
                <p className="text-caption text-on-surface-variant font-label-bold uppercase">{label}</p>
                <p className={`text-headline-md font-bold ${label === 'Overdue Invoices' ? 'text-error' : ''}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-lg flex flex-wrap items-center justify-between gap-md">
          <div className="flex items-center gap-xs overflow-x-auto">
            {[
              ['all', 'All'],
              ['Paid', 'Paid'],
              ['Unpaid', 'Unpaid'],
              ['Partially Paid', 'Partially Paid'],
              ['Cancelled', 'Cancelled'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`px-md py-2 rounded-full font-label-bold text-caption transition-colors ${
                  statusFilter === value
                    ? 'bg-primary-container text-on-primary-container'
                    : 'hover:bg-surface-container text-on-surface-variant'
                }`}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors border border-outline-variant/30"
            onClick={loadData}
            title="Refresh"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>

        {error && (
          <div className="mb-md rounded-xl border border-error-container bg-error-container/60 px-4 py-3 text-error text-label-bold">
            {error}
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden border border-outline-variant/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Invoice #</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Patient Name</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Date</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Amount</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Paid</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-gutter py-md text-caption font-label-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {loading ? (
                  <tr>
                    <td className="px-gutter py-lg text-on-surface-variant" colSpan="7">Loading invoices...</td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td className="px-gutter py-lg text-on-surface-variant" colSpan="7">No invoices found.</td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const paidAmount = paymentTotals[invoice.invoice_id] || 0;
                    const patientName = fullName(invoice.Patient);

                    return (
                      <tr key={invoice.invoice_id} className="hover:bg-surface-container-low/60 transition-colors group">
                        <td className="px-gutter py-md">
                          <p className="text-caption text-on-surface font-label-bold">#INV-{invoice.invoice_id}</p>
                          <p className="text-caption text-on-surface-variant">Appt #{invoice.appointment_id}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="text-caption text-on-surface">{patientName}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="text-caption text-on-surface">{formatDate(invoice.invoice_date)}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="text-caption text-on-surface font-label-bold">{formatCurrency(invoice.total_amount)}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <p className="text-caption text-on-surface">{formatCurrency(paidAmount)}</p>
                        </td>
                        <td className="px-gutter py-md">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-label-bold ${statusClass[invoice.status] || statusClass.Unpaid}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-gutter py-md text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Download">
                              <span className="material-symbols-outlined text-[20px]">download</span>
                            </button>
                            <button
                              className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="Record Payment"
                              onClick={() => openPaymentModal(invoice)}
                              disabled={invoice.status === 'Paid' || invoice.status === 'Cancelled'}
                            >
                              <span className="material-symbols-outlined text-[20px]">payments</span>
                            </button>
                            <button
                              className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                              title="Cancel Invoice"
                              onClick={() => handleCancelInvoice(invoice.invoice_id)}
                              disabled={invoice.status === 'Cancelled'}
                            >
                              <span className="material-symbols-outlined text-[20px]">priority_high</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-gutter flex items-center justify-between border-t border-outline-variant/20 bg-surface-container-low/30">
            <p className="text-caption text-on-surface-variant">
              Showing <span className="font-label-bold text-on-surface">{filteredInvoices.length}</span> of{' '}
              <span className="font-label-bold text-on-surface">{invoices.length}</span> invoices
            </p>
          </div>
        </div>
      </main>

      <div
        className={`fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          invoiceOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setInvoiceOpen(false)}
      >
        <form
          className={`fixed right-0 top-0 h-screen w-full max-w-md bg-surface-container-lowest shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
            invoiceOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(event) => event.stopPropagation()}
          onSubmit={handleCreateInvoice}
        >
          <div className="p-gutter flex items-center justify-between border-b border-outline-variant/30">
            <h3 className="text-headline-md font-headline-md text-primary">New Invoice</h3>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-all" type="button" onClick={() => setInvoiceOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-gutter space-y-md">
            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Patient</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                value={invoiceForm.patient_id}
                onChange={(event) => updateInvoiceForm('patient_id', event.target.value)}
                required
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.patient_id} value={patient.patient_id}>{fullName(patient)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Appointment</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                value={invoiceForm.appointment_id}
                onChange={(event) => updateInvoiceForm('appointment_id', event.target.value)}
                required
              >
                <option value="">Select appointment</option>
                {availableAppointments.map((appointment) => (
                  <option key={appointment.appointment_id} value={appointment.appointment_id}>
                    #{appointment.appointment_id} - {formatDate(appointment.appointment_date)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Invoice Date</label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                type="date"
                value={invoiceForm.invoice_date}
                onChange={(event) => updateInvoiceForm('invoice_date', event.target.value)}
                required
              />
            </div>

            <div className="bg-surface-container p-md rounded-2xl">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">info</span>
                <p className="text-caption text-on-surface-variant">
                  Invoice total starts at 0. Add invoice items from the invoice item workflow/API.
                </p>
              </div>
            </div>
          </div>

          <div className="p-gutter border-t border-outline-variant/30 flex gap-md">
            <button className="flex-1 py-3 border border-outline-variant text-on-surface-variant rounded-xl font-label-bold hover:bg-surface-container-low transition-colors" type="button" onClick={() => setInvoiceOpen(false)}>
              Cancel
            </button>
            <button className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-label-bold hover:bg-on-primary-fixed-variant transition-all shadow-md active:scale-95 disabled:opacity-60" type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>

      <div
        className={`fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          paymentOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setPaymentOpen(false)}
      >
        <form
          className={`fixed right-0 top-0 h-screen w-full max-w-md bg-surface-container-lowest shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
            paymentOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(event) => event.stopPropagation()}
          onSubmit={handleCreatePayment}
        >
          <div className="p-gutter flex items-center justify-between border-b border-outline-variant/30">
            <h3 className="text-headline-md font-headline-md text-primary">Record Payment</h3>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-all" type="button" onClick={() => setPaymentOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-gutter space-y-md">
            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Invoice</label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant border text-body-base"
                value={`#INV-${paymentForm.invoice_id}`}
                readOnly
              />
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Amount</label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                min="0.01"
                step="0.01"
                type="number"
                value={paymentForm.amount}
                onChange={(event) => updatePaymentForm('amount', event.target.value)}
                required
              />
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Payment Date</label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                type="date"
                value={paymentForm.payment_date}
                onChange={(event) => updatePaymentForm('payment_date', event.target.value)}
                required
              />
            </div>

            <div className="space-y-unit">
              <label className="font-label-bold text-on-surface-variant text-caption">Payment Method</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-outline-variant focus:ring-2 focus:ring-primary/20 border text-body-base"
                value={paymentForm.payment_method}
                onChange={(event) => updatePaymentForm('payment_method', event.target.value)}
                required
              >
                <option>Cash</option>
                <option>Card</option>
                <option>Bank Transfer</option>
                <option>Insurance</option>
              </select>
            </div>
          </div>

          <div className="p-gutter border-t border-outline-variant/30 flex gap-md">
            <button className="flex-1 py-3 border border-outline-variant text-on-surface-variant rounded-xl font-label-bold hover:bg-surface-container-low transition-colors" type="button" onClick={() => setPaymentOpen(false)}>
              Cancel
            </button>
            <button className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-label-bold hover:bg-on-primary-fixed-variant transition-all shadow-md active:scale-95 disabled:opacity-60" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BillingInvoices;
