import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import InvoiceForm from '../components/InvoiceForm.jsx';

export default function NewInvoice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [existingInvoice, setExistingInvoice] = useState(null);

  async function handleClientSelect(client) {
    try {
      const res = await api.get('/invoices', { params: { search: client.name, limit: 10 } });
      const openInvoices = res.data.invoices.filter(i => i.status !== 'paid');
      if (openInvoices.length > 0) {
        setExistingInvoice(openInvoices[0]);
      } else {
        setExistingInvoice(null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(data) {
    setLoading(true);
    try {
      const res = await api.post('/invoices', data);
      toast.success('Invoice created — ' + res.data.invoiceNo);
      navigate('/invoices/' + res.data._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating invoice');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/invoices" className="text-gray-400 hover:text-gray-600 text-sm">← Invoices</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">New Invoice</h1>
      </div>

      {existingInvoice && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
          <div>
            <p className="font-semibold text-sm mb-0.5">Open Bill Found</p>
            <p className="text-xs">This client already has an active bill ({existingInvoice.invoiceNo}). Would you like to continue with the old bill?</p>
          </div>
          <Link to={`/invoices/${existingInvoice._id}/edit`} className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Edit Old Bill
          </Link>
        </div>
      )}

      <InvoiceForm onSubmit={handleSubmit} loading={loading} onClientSelect={handleClientSelect} />
    </div>
  );
}
