'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authFetch } from '@/lib/auth-fetch';

interface Forum {
  id: string;
  title: string;
  description?: string;
  category: string;
  isLocked: boolean;
  postCount: number;
  lastPostAt?: string;
  createdAt: string;
}

export default function ForumsPage() {
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'GENERAL' });

  useEffect(() => {
    fetchForums();
  }, []);

  async function fetchForums() {
    try {
      const res = await authFetch('/api/lms/forums');
      const data = await res.json();
      setForums(data);
    } catch (err) {
      console.error('Failed to fetch forums:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await authFetch('/api/lms/forums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, isLocked: false }),
      });
      setShowForm(false);
      setFormData({ title: '', description: '', category: 'GENERAL' });
      fetchForums();
    } catch (err) {
      console.error('Failed to create forum:', err);
    }
  }

  const categories = ['GENERAL', 'COURSE', 'ASSIGNMENTS', 'EXAMS', 'ANNOUNCEMENTS', 'TECHNICAL'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">Discussion Forums</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create Forum'}
        </Button>
      </div>

      {showForm && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader><CardTitle className="dark:text-white">Create New Forum</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Forum Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                <select className="border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea className="border rounded w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <Button type="submit">Create Forum</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader><CardTitle className="dark:text-white">Forums</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="dark:text-gray-300">Loading...</p>
          ) : forums.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No forums created yet.</p>
          ) : (
            <div className="space-y-3">
              {forums.map((forum) => (
                <div key={forum.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg dark:text-white">{forum.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{forum.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-gray-100 dark:bg-gray-600 dark:text-gray-300 px-2 py-1 rounded">{forum.category}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{forum.postCount} posts</span>
                      </div>
                    </div>
                    {forum.isLocked && (
                      <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded">Locked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
