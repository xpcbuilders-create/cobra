import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost, apiPatch } from '../../api';
import SignaturePad from '../../components/SignaturePad';
import { AdminNavbar } from '../../components/AdminNavbar';

type Application = any;

export default function EmiAdmin() {
  const { token, user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || user?.role !== 'admin') return;
    setLoading(true);
    apiGet<{ applications: Application[] }>('/api/emi/admin/applications', token)
      .then((d) => setApps(d.applications))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, user?.role]);

  function filtered() {
    return apps.filter((a) => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (search && !a.customer.fullName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }

  async function doApprove(id: string) {
    if (!token) return;
    await apiPost(`/api/emi/admin/applications/${id}/approve`, {}, token);
    setApps((s) => s.map((a) => (a._id === id ? { ...a, status: 'approved' } : a)));
  }

  async function doReject(id: string) {
    if (!token) return;
    const reason = window.prompt('Reason for rejection') || 'Not specified';
    await apiPost(`/api/emi/admin/applications/${id}/reject`, { reason }, token);
    setApps((s) => s.map((a) => (a._id === id ? { ...a, status: 'rejected' } : a)));
  }

  async function doHold(id: string) {
    if (!token) return;
    const note = window.prompt('Note for hold (optional)') || 'On hold';
    await apiPost(`/api/emi/admin/applications/${id}/hold`, { note }, token);
    setApps((s) => s.map((a) => (a._id === id ? { ...a, status: 'on_hold' } : a)));
  }

  // Edit modal
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  async function uploadSignature(appId: string, blob: Blob) {
    if (!token) return;
    const fd = new FormData();
    fd.append('signature', blob, 'signature.png');
    const res = await fetch(`/api/emi/admin/applications/${appId}/signature`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    setApps((s) => s.map((a) => (a._id === appId ? { ...a, signatureUrl: data.url } : a)));
    setShowSignaturePad(false);
  }

  async function saveEdit() {
    if (!token || !editingApp) return;
    const body = { customer: editingApp.customer, adminNote: editingApp.adminNote };
    await apiPatch(`/api/emi/admin/applications/${editingApp._id}`, body, token);
    setApps((s) => s.map((a) => (a._id === editingApp._id ? { ...a, ...editingApp } : a)));
    setEditingApp(null);
  }

  async function regenerateAgreement(id: string) {
    if (!token) return;
    const res = await apiPost<{ url: string }>(`/api/emi/applications/${id}/generate-agreement`, {}, token);
    setApps((s) => s.map((a) => (a._id === id ? { ...a, agreementPdfUrl: res.url } : a)));
    alert('Agreement regenerated and saved.');
  }

  if (!token || user?.role !== 'admin') {
    return <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">Admin access only</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">EMI Applications</h1>
        <p className="mt-2 text-sm text-slate-600">Review, approve, reject, hold, and update customer EMI applications.</p>
      </div>
      <AdminNavbar />
      <div className="flex gap-3">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="on_hold">On Hold</option>
        </select>
        <input placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded px-2" />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-1">Name</th>
                <th className="px-2 py-1">Mobile</th>
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1">Submitted</th>
                <th className="px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered().map((a) => (
                <tr key={a._id} className="border-t">
                  <td className="px-2 py-2">{a.customer.fullName}</td>
                  <td className="px-2 py-2">{a.customer.mobile}</td>
                  <td className="px-2 py-2">{a.status}</td>
                  <td className="px-2 py-2">{new Date(a.createdAt).toLocaleString()}</td>
                  <td className="px-2 py-2">
                    <button onClick={() => doApprove(a._id)} className="mr-2 rounded bg-green-600 px-2 py-1 text-white">Approve</button>
                    <button onClick={() => doHold(a._id)} className="mr-2 rounded bg-yellow-600 px-2 py-1 text-white">Hold</button>
                    <button onClick={() => doReject(a._id)} className="mr-2 rounded bg-red-600 px-2 py-1 text-white">Reject</button>
                    <button onClick={() => setEditingApp(a)} className="mr-2 rounded bg-slate-600 px-2 py-1 text-white">Edit</button>
                    <button onClick={() => regenerateAgreement(a._id)} className="rounded bg-indigo-600 px-2 py-1 text-white">Regenerate Agreement</button>
                    <div className="mt-1">
                      {a.agreementPdfUrl && (
                        <a href={a.agreementPdfUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600">Download agreement</a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}
      {editingApp && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="bg-white p-6 rounded shadow max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-2">Edit Application</h3>
            <label className="block text-sm">Full name</label>
            <input className="w-full rounded p-2 mb-2" value={editingApp.customer.fullName} onChange={(e) => setEditingApp({ ...editingApp, customer: { ...editingApp.customer, fullName: e.target.value } })} />
            <label className="block text-sm">Address</label>
            <input className="w-full rounded p-2 mb-2" value={editingApp.customer.address || ''} onChange={(e) => setEditingApp({ ...editingApp, customer: { ...editingApp.customer, address: e.target.value } })} />
            <label className="block text-sm">Admin note</label>
            <input className="w-full rounded p-2 mb-4" value={editingApp.adminNote || ''} onChange={(e) => setEditingApp({ ...editingApp, adminNote: e.target.value })} />
            <div className="mb-2">
              <p className="text-sm font-medium">Aadhaar</p>
              {editingApp.documents?.aadhaarUrl ? (
                <a href={editingApp.documents.aadhaarUrl} target="_blank" rel="noreferrer" className="text-indigo-600">View Aadhaar</a>
              ) : (
                <p className="text-sm text-slate-500">No Aadhaar uploaded</p>
              )}
            </div>
            <div className="mb-2">
              <p className="text-sm font-medium">PAN</p>
              {editingApp.documents?.panUrl ? (
                <a href={editingApp.documents.panUrl} target="_blank" rel="noreferrer" className="text-indigo-600">View PAN</a>
              ) : (
                <p className="text-sm text-slate-500">No PAN uploaded</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingApp(null)} className="px-3 py-2 border rounded">Cancel</button>
              <button onClick={saveEdit} className="px-3 py-2 bg-indigo-600 text-white rounded">Save & Update</button>
            </div>
            <div className="mt-4">
              <button onClick={() => setShowSignaturePad(true)} className="px-3 py-2 bg-green-600 text-white rounded">Capture Signature</button>
              <label className="ml-3 inline-flex items-center px-3 py-2 border rounded cursor-pointer">
                Upload Signature
                <input type="file" accept="image/*,application/pdf" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f || !editingApp) return;
                  const fd = new FormData();
                  fd.append('signature', f);
                  const res = await fetch(`/api/emi/admin/applications/${editingApp._id}/signature`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: fd,
                  });
                  if (res.ok) {
                    const json = await res.json();
                    setApps((s) => s.map((a) => (a._id === editingApp._id ? { ...a, signatureUrl: json.url } : a)));
                    setEditingApp({ ...editingApp, signatureUrl: json.url });
                  }
                }} style={{ display: 'none' }} />
              </label>
            </div>
            {showSignaturePad && editingApp && (
              <div className="mt-4">
                <SignaturePad onSave={(b) => uploadSignature(editingApp._id, b)} onCancel={() => setShowSignaturePad(false)} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
