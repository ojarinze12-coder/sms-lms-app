'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useBranch } from '@/lib/hooks/use-branch';
import { BackButton } from '@/components/BackButton';
import { authFetch } from '@/lib/auth-fetch';

interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function AcademicYearTermsPage() {
  const params = useParams();
  const { selectedBranch } = useBranch();
  const [year, setYear] = useState<AcademicYear | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadData();
    }
  }, [params.id, selectedBranch]);

  const loadData = async () => {
    try {
      const yearParams = new URLSearchParams();
      if (selectedBranch) yearParams.set('branchId', selectedBranch.id);
      const termsParams = new URLSearchParams();
      termsParams.set('academicYearId', params.id as string);
      if (selectedBranch) termsParams.set('branchId', selectedBranch.id);

      const [yearRes, termsRes] = await Promise.all([
        authFetch('/api/sms/academic-years?' + yearParams.toString()),
        authFetch('/api/sms/terms?' + termsParams.toString()),
      ]);

      const yearsData = await yearRes.json();
      const termsData = await termsRes.json();

      const currentYear = yearsData.years?.find((y: AcademicYear) => y.id === params.id);
      setYear(currentYear || null);
      setTerms(termsData.terms || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authFetch('/api/sms/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, academicYearId: params.id }),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', startDate: '', endDate: '', isCurrent: false });
        loadData();
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton href="/sms/academic-years" label="Back to Academic Years" />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">{year?.name || 'Academic Year'}</h1>
          <p className="text-gray-600 dark:text-gray-400">Terms for this academic year</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Term
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Term</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Start Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">End Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {terms.map((term) => (
              <tr key={term.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-sm dark:text-white">{term.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(term.startDate)}</td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(term.endDate)}</td>
                <td className="px-4 py-3 text-sm">
                  {term.isCurrent ? (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded text-xs">Current</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setFormData({ name: term.name, startDate: term.startDate.split('T')[0], endDate: term.endDate.split('T')[0], isCurrent: term.isCurrent }); setShowModal(true); }} className="text-blue-600 hover:underline text-sm">Edit</button>
                </td>
              </tr>
            ))}
            {terms.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No terms found. Add a term to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Add Term</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term Name</label>
                <select
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select term...</option>
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isCurrent"
                  checked={formData.isCurrent}
                  onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isCurrent" className="text-sm text-gray-700 dark:text-gray-300">Set as current term</label>
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormData({ name: '', startDate: '', endDate: '', isCurrent: false }); }}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}