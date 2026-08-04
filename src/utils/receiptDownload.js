import { api } from '../api/client.js';

export async function downloadVisitConsolidatedReceipt(visitId) {
  const res = await api.get(`/finance/visits/${visitId}/consolidated-receipt/pdf`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `visit-${visitId}-receipt.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPharmacyReceipt(prescriptionId) {
  const res = await api.get(`/finance/prescriptions/${prescriptionId}/pharmacy-receipt/pdf`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pharmacy-receipt-rx${prescriptionId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadLabReport(resultId) {
  const res = await api.get(`/lab/results/${resultId}/pdf`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lab-report-${resultId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
