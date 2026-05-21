'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react';

interface FeeType {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  branchId: string | null;
  _count?: { feeComponents: number };
}

export default function FeeTypesPage() {
  const { toast } = useToast();
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingType, setEditingType] = useState<FeeType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadFeeTypes();
  }, []);

  async function loadFeeTypes() {
    setLoading(true);
    try {
      const res = await authFetch('/api/sms/fees/types');
      const data = await res.json();
      setFeeTypes(data.feeTypes || []);
    } catch {
      toast({ variant: 'destructive', description: 'Failed to load fee types' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.code || !formData.name) return;
    setSubmitting(true);
    try {
      const res = await authFetch('/api/sms/fees/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formData.code.toUpperCase(), name: formData.name }),
      });
      const data = await res.json();
      if (data.feeType) {
        toast({ description: 'Fee type created' });
        setShowAddDialog(false);
        setFormData({ code: '', name: '' });
        loadFeeTypes();
      } else {
        const msg = data.error?.fieldErrors ? Object.values(data.error.fieldErrors).flat().join(', ') : (data.error || 'Failed');
        toast({ variant: 'destructive', description: msg });
      }
    } catch {
      toast({ variant: 'destructive', description: 'Failed to create fee type' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingType) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/sms/fees/types/${editingType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name }),
      });
      const data = await res.json();
      if (data.feeType) {
        toast({ description: 'Fee type updated' });
        setShowEditDialog(false);
        setEditingType(null);
        setFormData({ code: '', name: '' });
        loadFeeTypes();
      } else {
        toast({ variant: 'destructive', description: data.error || 'Failed' });
      }
    } catch {
      toast({ variant: 'destructive', description: 'Failed to update fee type' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure? If this type is in use, it will be deactivated instead of deleted.')) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/sms/fees/types/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast({ description: data.message || 'Fee type removed' });
        loadFeeTypes();
      } else {
        toast({ variant: 'destructive', description: data.error || 'Failed' });
      }
    } catch {
      toast({ variant: 'destructive', description: 'Failed to remove fee type' });
    } finally {
      setSubmitting(false);
      setDeleteId(null);
    }
  }

  function openEditDialog(type: FeeType) {
    setEditingType(type);
    setFormData({ code: type.code, name: type.name });
    setShowEditDialog(true);
  }

  const activeTypes = feeTypes.filter(t => t.isActive);
  const inactiveTypes = feeTypes.filter(t => !t.isActive);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fee Types</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage fee categories for your school</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Fee Type</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Fee Type</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Code</Label>
                <Input
                  placeholder="e.g. EXAMINATION"
                  value={formData.code}
                  onChange={e => setFormData(p => ({ ...p, code: e.target.value }))}
                  className="uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier used in data (e.g. TUITION, EXAMINATION)</p>
              </div>
              <div>
                <Label>Display Name</Label>
                <Input
                  placeholder="e.g. Examination Fee"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {submitting ? 'Creating...' : 'Create Fee Type'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300">Code</TableHead>
                    <TableHead className="dark:text-gray-300">Name</TableHead>
                    <TableHead className="dark:text-gray-300">Status</TableHead>
                    <TableHead className="text-right dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTypes.map(type => (
                    <TableRow key={type.id} className="dark:border-gray-700">
                      <TableCell className="font-mono font-medium dark:text-white">{type.code}</TableCell>
                      <TableCell className="dark:text-white">{type.name}</TableCell>
                      <TableCell><Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">Active</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="outline" className="h-7" onClick={() => openEditDialog(type)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-red-500" onClick={() => handleDelete(type.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {activeTypes.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">No active fee types. Add one above.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {inactiveTypes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Inactive</h3>
              <Card className="opacity-60">
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      {inactiveTypes.map(type => (
                        <TableRow key={type.id} className="dark:border-gray-700">
                          <TableCell className="font-mono font-medium dark:text-gray-400">{type.code}</TableCell>
                          <TableCell className="dark:text-gray-400">{type.name}</TableCell>
                          <TableCell><Badge className="bg-gray-100 dark:bg-gray-800 text-gray-500">Inactive</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="outline" className="h-7" onClick={() => openEditDialog(type)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-red-500" onClick={() => handleDelete(type.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Fee Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label>Code</Label>
              <Input value={editingType?.code || ''} disabled className="opacity-60" />
              <p className="text-xs text-gray-500 mt-1">Code cannot be changed after creation</p>
            </div>
            <div>
              <Label>Display Name</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowEditDialog(false); setEditingType(null); }}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}