'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  appliedClass: string;
  jambRegNo?: string;
  waecNo?: string;
  previousSchool?: string;
  status: string;
  appliedAt: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    appliedClass: '',
    jambRegNo: '',
    waecNo: '',
    previousSchool: '',
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      const res = await fetch('/api/sms/applications');
      const data = await res.json();
      setApplications(data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/sms/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        fetchApplications();
        setFormData({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: 'MALE', appliedClass: '', jambRegNo: '', waecNo: '', previousSchool: '' });
      }
    } catch (err) {
      console.error('Failed to create application:', err);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/api/sms/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchApplications();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500',
    APPROVED: 'bg-green-500',
    REJECTED: 'bg-red-500',
    ADMITTED: 'bg-blue-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admissions</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Application'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Admission Application</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                <Input placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                <Input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                <Input placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                <Input type="date" placeholder="Date of Birth" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} required />
                <select className="border rounded px-3 py-2" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                <Input placeholder="Applied Class" value={formData.appliedClass} onChange={e => setFormData({...formData, appliedClass: e.target.value})} required />
                <Input placeholder="JAMB Registration No." value={formData.jambRegNo} onChange={e => setFormData({...formData, jambRegNo: e.target.value})} />
                <Input placeholder="WAEC No." value={formData.waecNo} onChange={e => setFormData({...formData, waecNo: e.target.value})} />
                <Input placeholder="Previous School" value={formData.previousSchool} onChange={e => setFormData({...formData, previousSchool: e.target.value})} />
              </div>
              <Button type="submit">Submit Application</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Application List</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : applications.length === 0 ? (
            <p className="text-gray-500">No applications found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Phone</th>
                    <th className="text-left py-2">Class</th>
                    <th className="text-left py-2">JAMB No.</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{app.firstName} {app.lastName}</td>
                      <td className="py-2">{app.email}</td>
                      <td className="py-2">{app.phone}</td>
                      <td className="py-2">{app.appliedClass}</td>
                      <td className="py-2">{app.jambRegNo || '-'}</td>
                      <td className="py-2">
                        <Badge className={statusColors[app.status]}>{app.status}</Badge>
                      </td>
                      <td className="py-2 space-x-2">
                        {app.status === 'PENDING' && (
                          <>
                            <Button size="sm" onClick={() => updateStatus(app.id, 'APPROVED')}>Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => updateStatus(app.id, 'REJECTED')}>Reject</Button>
                          </>
                        )}
                        {app.status === 'APPROVED' && (
                          <Button size="sm" onClick={() => updateStatus(app.id, 'ADMITTED')}>Admit</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
