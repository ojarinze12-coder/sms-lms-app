'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function PromotionsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [sourceClass, setSourceClass] = useState<any>(null);
  const [targetClassId, setTargetClassId] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/sms/academic-classes', { headers: getAuthHeaders(), credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed')))
      .then(d => setClasses(d.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!sourceClass) return;
    loadPreview();
  }, [sourceClass, targetClassId]);

  async function loadPreview() {
    if (!sourceClass) return;
    setLoading(true);
    setError('');
    setPreview([]);
    try {
      const params = new URLSearchParams({ sourceClassId: sourceClass.id });
      if (targetClassId) params.set('targetClassId', targetClassId);
      
      const res = await fetch(`/api/sms/students/promote-bulk?${params}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const d = await res.json();
      console.log('Preview response:', d);
      if (res.ok) {
        if (d.message && d.preview?.length === 0) {
          setError(d.message);
          setPreview([]);
        } else {
          setPreview(d.preview || []);
        }
      } else {
        setError(d.error || 'Preview failed');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handlePromote(dryRun: boolean) {
    if (!sourceClass || !targetClassId) return;
    setPromoting(true);
    setResult(null);
    try {
      const res = await fetch('/api/sms/students/promote-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({ sourceClassId: sourceClass.id, targetClassId, dryRun }),
      });
      const d = await res.json();
      setResult(d);
      if (res.ok && !dryRun) loadPreview();
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setPromoting(false);
  }

  const getTargetClasses = () => {
    if (!sourceClass) return [];
    return classes.filter((c: any) => c.tierId === sourceClass.tierId && c.level === (sourceClass.level || 0) + 1);
  };
  const targetClasses = getTargetClasses();
  const eligibleCount = preview.filter((p: any) => p.eligible).length;

  const handleClassSelect = (cls: any) => {
    setSourceClass(cls);
    setTargetClassId('');
    setPreview([]);
    setResult(null);
    setError('');
    setShowClassDialog(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Promotions</h1>
          <p className="text-gray-500 dark:text-gray-400">Bulk promote students to next higher class</p>
        </div>
        <Button onClick={() => setShowClassDialog(true)}>
          {sourceClass ? `Change Class (${sourceClass.name})` : 'Select Class'}
        </Button>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded mb-4">{error}</div>}

      {/* CURRENT SELECTION INFO */}
      {sourceClass && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium dark:text-white">Source: {sourceClass.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Level {sourceClass.level}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowClassDialog(true)}>
              Change
            </Button>
          </div>
        </div>
      )}

      {/* TARGET CLASS SELECTOR */}
      {sourceClass && (
        <div className="mb-6">
          <h2 className="font-semibold mb-3 dark:text-white">Select Target Class</h2>
          <select
            value={targetClassId}
            onChange={(e) => setTargetClassId(e.target.value)}
            className="w-full md:w-1/2 p-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            <option value="">-- Auto-detect next level --</option>
            {targetClasses.map((tc: any) => (
              <option key={tc.id} value={tc.id}>{tc.name} (Level {tc.level})</option>
            ))}
          </select>
        </div>
      )}

      {/* PREVIEW AND ACTIONS */}
      {sourceClass && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
          <div className="flex gap-3 mb-4">
            <Button variant="outline" onClick={() => handlePromote(true)} disabled={!targetClassId || promoting}>
              {promoting ? 'Checking...' : 'Preview Eligible'}
            </Button>
            <Button onClick={() => handlePromote(false)} disabled={!targetClassId || promoting || eligibleCount === 0}>
              {promoting ? 'Promoting...' : `Promote ${eligibleCount} Students`}
            </Button>
          </div>

          {result && (
            <div className={`p-3 rounded mb-4 ${result.success ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {result.success ? (
                <p className={result.success ? 'text-green-700 dark:text-green-300' : ''}>✅ Promoted: {result.results?.promoted || 0} | Skipped: {result.results?.skipped || 0}</p>
              ) : <p className="text-red-600 dark:text-red-400">❌ {result.error || 'Failed'}</p>}
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <div className="flex gap-4 mb-3 text-sm">
                <span className="text-green-600 dark:text-green-400 font-medium">✅ {eligibleCount} eligible</span>
                <span className="text-red-600 dark:text-red-400 font-medium">❌ {preview.length - eligibleCount} not eligible</span>
              </div>
              <div className="overflow-x-auto border rounded dark:border-gray-600">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr><th className="p-2 text-left dark:text-white">ID</th><th className="p-2 text-left dark:text-white">Name</th><th className="p-2 text-left dark:text-white">Status</th><th className="p-2 text-left dark:text-white">Reasons</th></tr>
                  </thead>
                  <tbody>
                    {preview.map((s: any) => (
                      <tr key={s.studentId} className="border-t dark:border-gray-600">
                        <td className="p-2 dark:text-gray-200">{s.studentIdno}</td>
                        <td className="p-2 dark:text-gray-200">{s.studentName}</td>
                        <td className="p-2">{s.eligible ? <span className="text-green-600 dark:text-green-400">✅</span> : <span className="text-red-500 dark:text-red-400">❌</span>}</td>
                        <td className="p-2 text-gray-500 dark:text-gray-400">{s.reasons?.join(', ') || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLASS SELECTION DIALOG */}
      {showClassDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">Select Source Class</h2>
              <button onClick={() => setShowClassDialog(false)} className="text-gray-500 dark:text-gray-400">✕</button>
            </div>
            
            {loading ? (
              <p className="dark:text-gray-300">Loading...</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {classes.map((cls: any) => (
                  <button
                    key={cls.id}
                    onClick={() => handleClassSelect(cls)}
                    className={`p-3 border rounded text-left dark:border-gray-600 ${sourceClass?.id === cls.id ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <div className="font-medium dark:text-white">{cls.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Level {cls.level}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}