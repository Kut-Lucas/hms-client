import { useState } from 'react';
import { downloadVisitConsolidatedReceipt } from '../utils/receiptDownload.js';

export default function VisitReceiptButton({ visitId, className = '', label = 'Full visit receipt (PDF)' }) {
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  if (!visitId) return null;

  return (
    <div className={className}>
      <button
        type="button"
        disabled={loading}
        className="rounded-lg border border-hospital-700 bg-white px-3 py-1.5 text-sm font-medium text-hospital-900 hover:bg-hospital-50 disabled:opacity-50"
        onClick={async () => {
          setErr('');
          setLoading(true);
          try {
            await downloadVisitConsolidatedReceipt(visitId);
          } catch (e) {
            setErr(e.response?.data?.message || 'Could not generate receipt');
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? 'Generating…' : label}
      </button>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}
