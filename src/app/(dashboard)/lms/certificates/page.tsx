'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Certificate {
  id: string;
  title: string;
  description?: string;
  template?: string;
  courseId?: string;
  createdAt: string;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', template: '' });

  useEffect(() => {
    fetchCertificates();
  }, []);

  async function fetchCertificates() {
    try {
      const res = await fetch('/api/lms/certificates');
      const data = await res.json();
      setCertificates(data);
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/lms/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setShowForm(false);
      setFormData({ title: '', description: '', template: '' });
      fetchCertificates();
    } catch (err) {
      console.error('Failed to create certificate:', err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Certificates</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create Certificate'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Create Certificate Template</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Certificate Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              <textarea className="border rounded w-full p-2" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <textarea className="border rounded w-full p-2" placeholder="Template (HTML)" value={formData.template} onChange={e => setFormData({...formData, template: e.target.value})} />
              <Button type="submit">Create Certificate</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Certificate Templates</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : certificates.length === 0 ? (
            <p className="text-gray-500">No certificates created yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <div key={cert.id} className="border rounded-lg p-4 hover:shadow-md">
                  <div className="text-3xl mb-2">🎓</div>
                  <h3 className="font-bold">{cert.title}</h3>
                  <p className="text-sm text-gray-600">{cert.description}</p>
                  <p className="text-xs text-gray-400 mt-2">Created: {new Date(cert.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
