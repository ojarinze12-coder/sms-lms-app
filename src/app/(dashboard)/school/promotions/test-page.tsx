'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';

interface ClassOption {
  id: string;
  name: string;
}

export default function PromotionsPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sourceClassId, setSourceClassId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [targetClasses, setTargetClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sms/academic-classes');
      if (!res.ok) throw new Error('Failed to load');
      
      const data = await res.json();
      console.log('API Response:', data);
      
      if (data.classes) {
        setClasses(data.classes);
      } else if (data.data?.data) {
        setClasses(data.data.data);
      } else if (Array.isArray(data.data)) {
        setClasses(data.data);
      } else {
        setError('No class data found');
      }
    } catch (e: any) {
      console.error('Load error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPreview() {
    if (!sourceClassId) return;
    
    try {
      const params = new URLSearchParams({ sourceClassId });
      if (targetClassId) params.set('targetClassId', targetClassId);
      
      const res = await fetch(`/api/sms/students/promote-bulk?${params}`);
      if (!res.ok) throw new Error('Preview failed');
      
      const data = await res.json();
      console.log('Preview:', data);
      setTargetClasses(data.targetClasses || []);
    } catch (e: any) {
      console.error('Preview error:', e);
    }
  }

  function handleSelect(clsId: string) {
    console.log('Selected:', clsId);
    setSourceClassId(clsId);
    setTargetClassId('');
    loadPreview();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Promotions</h1>
      
      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      {loading ? (
        <div>Loading classes...</div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => handleSelect(cls.id)}
              className={`p-4 border rounded-lg ${sourceClassId === cls.id ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50'}`}
            >
              {cls.name}
            </button>
          ))}
        </div>
      )}
      
      {sourceClassId && (
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-medium">Target Class</h3>
          <select 
            value={targetClassId}
            onChange={e => setTargetClassId(e.target.value)}
            className="w-full mt-2 p-2 border"
          >
            <option value="">Select target</option>
            {targetClasses.map(tc => (
              <option key={tc.id} value={tc.id}>{tc.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}