'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, Bed, Users, Building, Save, Check } from 'lucide-react';

interface Hostel {
  id: string;
  name: string;
  type: string;
  description?: string;
  address?: string;
  wardenName?: string;
  wardenPhone?: string;
  totalBeds: number;
  occupiedBeds: number;
  status: string;
  rooms?: HostelRoom[];
  _count?: { allocations: number };
}

interface HostelRoom {
  id: string;
  hostelId: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  roomType: string;
  status: string;
  beds?: HostelBed[];
  _count?: { allocations: number };
}

interface HostelBed {
  id: string;
  roomId: string;
  bedNumber: string;
  status: string;
}

interface HostelAllocation {
  id: string;
  studentId: string;
  student: { firstName: string; lastName: string; studentId: string };
  room: { roomNumber: string };
  bed: { bedNumber: string };
  checkInDate: string;
  status: string;
}

export default function HostelPage() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hostels' | 'rooms' | 'allocations'>('hostels');
  
  const [showHostelForm, setShowHostelForm] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  
  const [hostelForm, setHostelForm] = useState({ name: '', type: 'MALE', description: '', address: '', wardenName: '', wardenPhone: '' });
  const [roomForm, setRoomForm] = useState({ hostelId: '', roomNumber: '', floor: '1', capacity: '4', roomType: 'DORMITORY' });
  const [allocationForm, setAllocationForm] = useState({ hostelId: '', roomId: '', bedId: '', studentId: '', academicYearId: '', checkInDate: '' });

  const [availableBeds, setAvailableBeds] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [hostelsRes, roomsRes, allocationsRes] = await Promise.all([
        fetch('/api/sms/hostels'),
        fetch('/api/sms/hostels/rooms'),
        fetch('/api/sms/hostels/allocations'),
      ]);
      
      const hostelsData = await hostelsRes.json();
      const roomsData = await roomsRes.json();
      const allocationsData = await allocationsRes.json();
      
      setHostels(Array.isArray(hostelsData) ? hostelsData : []);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setAllocations(Array.isArray(allocationsData) ? allocationsData : []);
    } catch (err) {
      console.error('Failed to fetch hostel data:', err);
      setHostels([]);
      setRooms([]);
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFormData() {
    try {
      const [bedsRes, studentsRes, yearsRes] = await Promise.all([
        fetch('/api/sms/hostels/available-beds'),
        fetch('/api/sms/students'),
        fetch('/api/sms/academic-years'),
      ]);
      
      setAvailableBeds(await bedsRes.json());
      setStudents((await studentsRes.json()).slice(0, 20));
      setAcademicYears(await yearsRes.json());
    } catch (err) {
      console.error('Failed to fetch form data:', err);
    }
  }

  async function handleCreateHostel(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/sms/hostels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hostelForm),
      });
      setShowHostelForm(false);
      setHostelForm({ name: '', type: 'MALE', description: '', address: '', wardenName: '', wardenPhone: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to create hostel:', err);
    }
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/sms/hostels/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roomForm,
          floor: parseInt(roomForm.floor),
          capacity: parseInt(roomForm.capacity),
        }),
      });
      setShowRoomForm(false);
      setRoomForm({ hostelId: '', roomNumber: '', floor: '1', capacity: '4', roomType: 'DORMITORY' });
      fetchData();
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  }

  async function handleCreateAllocation(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/sms/hostels/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allocationForm),
      });
      setShowAllocationForm(false);
      setAllocationForm({ hostelId: '', roomId: '', bedId: '', studentId: '', academicYearId: '', checkInDate: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to create allocation:', err);
    }
  }

  async function handleCheckout(allocationId: string) {
    try {
      await fetch(`/api/sms/hostels/allocations/${allocationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout' }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to check out:', err);
    }
  }

  async function deleteHostel(id: string) {
    if (!confirm('Are you sure you want to delete this hostel?')) return;
    try {
      await fetch(`/api/sms/hostels/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete hostel:', err);
    }
  }

  async function deleteRoom(id: string) {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      await fetch(`/api/sms/hostels/rooms/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete room:', err);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500 dark:bg-green-600';
      case 'INACTIVE': return 'bg-gray-500 dark:bg-gray-600';
      case 'MAINTENANCE': return 'bg-yellow-500 dark:bg-yellow-600';
      case 'AVAILABLE': return 'bg-green-500 dark:bg-green-600';
      case 'OCCUPIED': return 'bg-blue-500 dark:bg-blue-600';
      default: return 'bg-gray-500 dark:bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">Hostel Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchData(); }}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-4 border-b dark:border-gray-700">
        <button
          className={`px-4 py-2 dark:text-gray-300 ${activeTab === 'hostels' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('hostels')}
        >
          Hostels
        </button>
        <button
          className={`px-4 py-2 dark:text-gray-300 ${activeTab === 'rooms' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          Rooms
        </button>
        <button
          className={`px-4 py-2 dark:text-gray-300 ${activeTab === 'allocations' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('allocations')}
        >
          Allocations
        </button>
      </div>

      {activeTab === 'hostels' && (
          <>
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold dark:text-white">Hostels</h2>
            <Dialog open={showHostelForm} onOpenChange={setShowHostelForm}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Add Hostel</Button>
              </DialogTrigger>
              <DialogContent className="dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Add New Hostel</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateHostel} className="space-y-4">
                  <div>
                    <Label className="dark:text-white">Hostel Name</Label>
                    <Input value={hostelForm.name} onChange={e => setHostelForm({...hostelForm, name: e.target.value})} required />
                  </div>
                  <div>
                    <Label className="dark:text-white">Type</Label>
                    <Select value={hostelForm.type} onValueChange={v => setHostelForm({...hostelForm, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="MIXED">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="dark:text-white">Description</Label>
                    <Input value={hostelForm.description} onChange={e => setHostelForm({...hostelForm, description: e.target.value})} />
                  </div>
                  <div>
                    <Label className="dark:text-white">Address</Label>
                    <Input value={hostelForm.address} onChange={e => setHostelForm({...hostelForm, address: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="dark:text-white">Warden Name</Label>
                      <Input value={hostelForm.wardenName} onChange={e => setHostelForm({...hostelForm, wardenName: e.target.value})} />
                    </div>
                    <div>
                      <Label className="dark:text-white">Warden Phone</Label>
                      <Input value={hostelForm.wardenPhone} onChange={e => setHostelForm({...hostelForm, wardenPhone: e.target.value})} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Create Hostel</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hostels.map(hostel => (
              <Card key={hostel.id} className="dark:bg-gray-800">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg dark:text-white">{hostel.name}</CardTitle>
                    <Badge className={getStatusColor(hostel.status)}>{hostel.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Type:</span>
                      <span className="dark:text-gray-200">{hostel.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Total Beds:</span>
                      <span className="dark:text-gray-200">{hostel.totalBeds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Occupied:</span>
                      <span className="dark:text-gray-200">{hostel.occupiedBeds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Available:</span>
                      <span className="dark:text-gray-200">{hostel.totalBeds - hostel.occupiedBeds}</span>
                    </div>
                    {hostel.wardenName && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Warden:</span>
                        <span className="dark:text-gray-200">{hostel.wardenName}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => deleteHostel(hostel.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {hostels.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                No hostels found. Add your first hostel to get started.
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'rooms' && (
        <>
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold dark:text-white">Rooms</h2>
            <Dialog open={showRoomForm} onOpenChange={setShowRoomForm}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Add Room</Button>
              </DialogTrigger>
              <DialogContent className="dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Add New Room</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <Label className="dark:text-white">Hostel</Label>
                    <Select value={roomForm.hostelId} onValueChange={v => setRoomForm({...roomForm, hostelId: v})}>
                      <SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger>
                      <SelectContent>
                        {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="dark:text-white">Room Number</Label>
                    <Input value={roomForm.roomNumber} onChange={e => setRoomForm({...roomForm, roomNumber: e.target.value})} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="dark:text-white">Floor</Label>
                      <Input type="number" value={roomForm.floor} onChange={e => setRoomForm({...roomForm, floor: e.target.value})} />
                    </div>
                    <div>
                      <Label className="dark:text-white">Capacity</Label>
                      <Input type="number" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <Label className="dark:text-white">Room Type</Label>
                    <Select value={roomForm.roomType} onValueChange={v => setRoomForm({...roomForm, roomType: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DORMITORY">Dormitory</SelectItem>
                        <SelectItem value="BUNK">Bunk</SelectItem>
                        <SelectItem value="SEMI_PRIVATE">Semi-Private</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Create Room</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2 dark:text-gray-300">Hostel</th>
                      <th className="text-left py-2 dark:text-gray-300">Room</th>
                      <th className="text-left py-2 dark:text-gray-300">Floor</th>
                      <th className="text-left py-2 dark:text-gray-300">Type</th>
                      <th className="text-left py-2 dark:text-gray-300">Capacity</th>
                      <th className="text-left py-2 dark:text-gray-300">Status</th>
                      <th className="text-left py-2 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map(room => (
                      <tr key={room.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-2 dark:text-gray-300">{hostels.find(h => h.id === room.hostelId)?.name || '-'}</td>
                        <td className="py-2 dark:text-gray-300">{room.roomNumber}</td>
                        <td className="py-2 dark:text-gray-300">{room.floor}</td>
                        <td className="py-2 dark:text-gray-300">{room.roomType}</td>
                        <td className="py-2 dark:text-gray-300">{room.capacity}</td>
                        <td className="py-2"><Badge className={getStatusColor(room.status)}>{room.status}</Badge></td>
                        <td className="py-2">
                          <Button size="sm" variant="ghost" onClick={() => deleteRoom(room.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rooms.length === 0 && (
                  <p className="text-center py-4 text-gray-500 dark:text-gray-400">No rooms found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'allocations' && (
        <>
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold dark:text-white">Allocations</h2>
            <Dialog open={showAllocationForm} onOpenChange={setShowAllocationForm}>
              <DialogTrigger asChild>
                <Button onClick={fetchFormData}><Plus className="mr-2 h-4 w-4" />Allocate Bed</Button>
              </DialogTrigger>
              <DialogContent className="dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Allocate Bed to Student</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAllocation} className="space-y-4">
                  <div>
                    <Label className="dark:text-white">Hostel</Label>
                    <Select value={allocationForm.hostelId} onValueChange={v => {
                      setAllocationForm({...allocationForm, hostelId: v, roomId: '', bedId: ''});
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger>
                      <SelectContent>
                        {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="dark:text-white">Available Beds</Label>
                    <Select value={allocationForm.bedId} onValueChange={v => {
                      const bed = availableBeds.find(b => b.bed.id === v);
                      setAllocationForm({
                        ...allocationForm,
                        bedId: v,
                        roomId: bed?.room?.id || '',
                      });
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select available bed" /></SelectTrigger>
                      <SelectContent>
                        {availableBeds.filter(b => b.hostel.id === allocationForm.hostelId).map(bed => (
                          <SelectItem key={bed.bed.id} value={bed.bed.id}>
                            Room {bed.room.roomNumber} - {bed.bed.bedNumber} ({bed.room.roomType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="dark:text-white">Student</Label>
                    <Select value={allocationForm.studentId} onValueChange={v => setAllocationForm({...allocationForm, studentId: v})}>
                      <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                      <SelectContent>
                        {students.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentId})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="dark:text-white">Academic Year</Label>
                    <Select value={allocationForm.academicYearId} onValueChange={v => setAllocationForm({...allocationForm, academicYearId: v})}>
                      <SelectTrigger><SelectValue placeholder="Select academic year" /></SelectTrigger>
                      <SelectContent>
                        {academicYears.map(ay => <SelectItem key={ay.id} value={ay.id}>{ay.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="dark:text-white">Check-in Date</Label>
                    <Input type="date" value={allocationForm.checkInDate} onChange={e => setAllocationForm({...allocationForm, checkInDate: e.target.value})} required />
                  </div>
                  <Button type="submit" className="w-full">Allocate Bed</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2 dark:text-gray-300">Student</th>
                      <th className="text-left py-2 dark:text-gray-300">Hostel</th>
                      <th className="text-left py-2 dark:text-gray-300">Room</th>
                      <th className="text-left py-2 dark:text-gray-300">Bed</th>
                      <th className="text-left py-2 dark:text-gray-300">Check-in</th>
                      <th className="text-left py-2 dark:text-gray-300">Status</th>
                      <th className="text-left py-2 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map(allocation => (
                      <tr key={allocation.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-2 dark:text-gray-300">{allocation.student.firstName} {allocation.student.lastName}</td>
                        <td className="py-2 dark:text-gray-300">{hostels.find(h => h.id === allocationForm.hostelId)?.name || '-'}</td>
                        <td className="py-2 dark:text-gray-300">{allocation.room?.roomNumber || '-'}</td>
                        <td className="py-2 dark:text-gray-300">{allocation.bed?.bedNumber || '-'}</td>
                        <td className="py-2 dark:text-gray-300">{new Date(allocation.checkInDate).toLocaleDateString()}</td>
                        <td className="py-2"><Badge className={getStatusColor(allocation.status)}>{allocation.status}</Badge></td>
                        <td className="py-2">
                          {allocation.status === 'ACTIVE' && (
                            <Button size="sm" variant="outline" onClick={() => handleCheckout(allocation.id)}>
                              Check Out
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allocations.length === 0 && (
                  <p className="text-center py-4 text-gray-500 dark:text-gray-400">No allocations found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}