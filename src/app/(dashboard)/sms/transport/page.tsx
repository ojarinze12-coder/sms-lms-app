'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Bus, Route, CreditCard } from 'lucide-react';

interface Vehicle {
  id: string;
  vehicleNo: string;
  model: string;
  capacity: number;
  driverName?: string;
  driverPhone?: string;
  status: string;
}

interface Route {
  id: string;
  name: string;
  description: string;
  fee: number;
  pickupPoints: string[];
}

interface TransportSubscription {
  id: string;
  student: { firstName: string; lastName: string; studentId: string };
  route: { name: string; fee: number };
  startDate: string;
  endDate: string;
  amount: number;
  paymentStatus: string;
  isActive: boolean;
}

export default function TransportPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [subscriptions, setSubscriptions] = useState<TransportSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'routes' | 'subscriptions'>('vehicles');
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ vehicleNo: '', model: '', capacity: '', driverName: '', driverPhone: '' });
  const [routeForm, setRouteForm] = useState({ name: '', description: '', pickupPoints: '', fee: '' });
  const [subscriptionForm, setSubscriptionForm] = useState({ studentId: '', routeId: '', startDate: '', endDate: '', amount: '', paymentMethod: 'CASH' });
  const [students, setStudents] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [vehRes, routesRes, subsRes, studentsRes, yearsRes] = await Promise.all([
        authFetch('/api/sms/transport/vehicles'),
        authFetch('/api/sms/transport/routes'),
        authFetch('/api/sms/transport/subscriptions'),
        authFetch('/api/sms/students'),
        authFetch('/api/sms/academic-years')
      ]);
      setVehicles(await vehRes.json());
      setRoutes(await routesRes.json());
      setSubscriptions(await subsRes.json());
      setStudents(await studentsRes.json());
      setAcademicYears(await yearsRes.json());
    } catch (err) {
      console.error('Failed to fetch transport data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault();
    try {
      await authFetch('/api/sms/transport/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vehicleForm, capacity: parseInt(vehicleForm.capacity), status: 'ACTIVE' }),
      });
      setShowVehicleForm(false);
      setVehicleForm({ vehicleNo: '', model: '', capacity: '', driverName: '', driverPhone: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to add vehicle:', err);
    }
  }

  async function handleAddRoute(e: React.FormEvent) {
    e.preventDefault();
    try {
      await authFetch('/api/sms/transport/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: routeForm.name, 
          area: routeForm.description,
          pickupPoints: routeForm.pickupPoints.split(',').map(p => p.trim()), 
          fare: parseFloat(routeForm.fee || '0') 
        }),
      });
      setShowRouteForm(false);
      setRouteForm({ name: '', description: '', pickupPoints: '', fee: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to add route:', err);
    }
  }

  async function handleAddSubscription(e: React.FormEvent) {
    e.preventDefault();
    try {
      const route = routes.find(r => r.id === subscriptionForm.routeId);
      await authFetch('/api/sms/transport/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: subscriptionForm.studentId,
          routeId: subscriptionForm.routeId,
          startDate: subscriptionForm.startDate,
          endDate: subscriptionForm.endDate,
          amount: parseFloat(subscriptionForm.amount) || route?.fee || 0,
          paymentMethod: subscriptionForm.paymentMethod
        }),
      });
      setShowSubscriptionForm(false);
      setSubscriptionForm({ studentId: '', routeId: '', startDate: '', endDate: '', amount: '', paymentMethod: 'CASH' });
      fetchData();
    } catch (err) {
      console.error('Failed to add subscription:', err);
    }
  }

  async function handleUpdateSubscriptionStatus(id: string, status: string) {
    try {
      await fetch(`/api/sms/transport/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: status })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update subscription:', err);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Paid</Badge>;
      case 'PENDING': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
      case 'OVERDUE': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Overdue</Badge>;
      case 'CANCELLED': return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white">Transport Management</h1>
      </div>

      <div className="flex gap-4 border-b dark:border-gray-700">
        <button 
          className={`px-4 py-2 flex items-center gap-2 dark:text-gray-300 ${activeTab === 'vehicles' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('vehicles')}
        >
          <Bus className="h-4 w-4" /> Vehicles
        </button>
        <button 
          className={`px-4 py-2 flex items-center gap-2 dark:text-gray-300 ${activeTab === 'routes' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          <Route className="h-4 w-4" /> Routes
        </button>
        <button 
          className={`px-4 py-2 flex items-center gap-2 dark:text-gray-300 ${activeTab === 'subscriptions' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          <CreditCard className="h-4 w-4" /> Subscriptions
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {activeTab === 'vehicles' && (
            <>
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold dark:text-white">Vehicles</h2>
                <Button onClick={() => setShowVehicleForm(!showVehicleForm)}>{showVehicleForm ? 'Cancel' : 'Add Vehicle'}</Button>
              </div>
              {showVehicleForm && (
                <Card className="dark:bg-gray-800">
                  <CardHeader><CardTitle className="dark:text-white">Add Vehicle</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddVehicle} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Plate Number" value={vehicleForm.vehicleNo} onChange={e => setVehicleForm({...vehicleForm, vehicleNo: e.target.value})} required />
                        <Input placeholder="Model" value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} required />
                        <Input type="number" placeholder="Capacity" value={vehicleForm.capacity} onChange={e => setVehicleForm({...vehicleForm, capacity: e.target.value})} required />
                        <Input placeholder="Driver Name" value={vehicleForm.driverName} onChange={e => setVehicleForm({...vehicleForm, driverName: e.target.value})} />
                        <Input placeholder="Driver Phone" value={vehicleForm.driverPhone} onChange={e => setVehicleForm({...vehicleForm, driverPhone: e.target.value})} />
                      </div>
                      <Button type="submit">Add Vehicle</Button>
                    </form>
                  </CardContent>
                </Card>
              )}
              <Card className="dark:bg-gray-800">
                <CardContent className="pt-6">
                  {vehicles.length === 0 ? <p className="text-gray-500 dark:text-gray-400">No vehicles found.</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {vehicles.map(vehicle => (
                        <div key={vehicle.id} className="border rounded p-4 dark:border-gray-700 dark:bg-gray-750">
                          <h3 className="font-bold dark:text-white">{vehicle.vehicleNo}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{vehicle.model}</p>
                          <p className="text-sm dark:text-gray-300">Capacity: {vehicle.capacity}</p>
                          {vehicle.driverName && <p className="text-sm dark:text-gray-300">Driver: {vehicle.driverName}</p>}
                          {vehicle.driverPhone && <p className="text-sm dark:text-gray-300">Phone: {vehicle.driverPhone}</p>}
                          <Badge className="mt-2">{vehicle.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'routes' && (
            <>
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold dark:text-white">Routes</h2>
                <Button onClick={() => setShowRouteForm(!showRouteForm)}>{showRouteForm ? 'Cancel' : 'Add Route'}</Button>
              </div>
              {showRouteForm && (
                <Card className="dark:bg-gray-800">
                  <CardHeader><CardTitle className="dark:text-white">Add Route</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddRoute} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Route Name" value={routeForm.name} onChange={e => setRouteForm({...routeForm, name: e.target.value})} required />
                        <Input placeholder="Area/Description" value={routeForm.description} onChange={e => setRouteForm({...routeForm, description: e.target.value})} required />
                        <Input placeholder="Pickup Points (comma separated)" value={routeForm.pickupPoints} onChange={e => setRouteForm({...routeForm, pickupPoints: e.target.value})} required className="col-span-2" />
                        <Input type="number" placeholder="Fare (₦)" value={routeForm.fee} onChange={e => setRouteForm({...routeForm, fee: e.target.value})} required />
                      </div>
                      <Button type="submit">Add Route</Button>
                    </form>
                  </CardContent>
                </Card>
              )}
              <Card className="dark:bg-gray-800">
                <CardHeader><CardTitle className="dark:text-white">Transport Routes</CardTitle></CardHeader>
                <CardContent>
                  {routes.length === 0 ? <p className="text-gray-500 dark:text-gray-400">No routes found.</p> : (
                    <div className="space-y-4">
                      {routes.map(route => (
                        <div key={route.id} className="border rounded p-4 dark:border-gray-700 dark:bg-gray-750">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold dark:text-white">{route.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Area: {route.description}</p>
                              <p className="text-sm dark:text-gray-300">Fare: ₦{route.fee?.toLocaleString() || 0}</p>
                              <p className="text-sm dark:text-gray-300">Pickup Points: {route.pickupPoints?.join(', ') || 'N/A'}</p>
                            </div>
                            <Badge>Active</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'subscriptions' && (
            <>
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold dark:text-white">Transport Subscriptions</h2>
                <Dialog open={showSubscriptionForm} onOpenChange={setShowSubscriptionForm}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" /> New Subscription</Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-gray-800">
                    <DialogHeader>
                      <DialogTitle className="dark:text-white">Add Transport Subscription</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddSubscription} className="space-y-4">
                      <div>
                        <Label className="dark:text-gray-200">Student</Label>
                        <Select value={subscriptionForm.studentId} onValueChange={val => setSubscriptionForm({...subscriptionForm, studentId: val})}>
                          <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                          <SelectContent>
                            {students.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentId})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="dark:text-gray-200">Route</Label>
                        <Select value={subscriptionForm.routeId} onValueChange={val => {
                          const route = routes.find(r => r.id === val);
                          setSubscriptionForm({...subscriptionForm, routeId: val, amount: route?.fee?.toString() || ''});
                        }}>
                          <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                          <SelectContent>
                            {routes.map(r => (
                              <SelectItem key={r.id} value={r.id}>{r.name} - ₦{r.fee?.toLocaleString()}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="dark:text-gray-200">Start Date</Label>
                          <Input type="date" value={subscriptionForm.startDate} onChange={e => setSubscriptionForm({...subscriptionForm, startDate: e.target.value})} required />
                        </div>
                        <div>
                          <Label className="dark:text-gray-200">End Date</Label>
                          <Input type="date" value={subscriptionForm.endDate} onChange={e => setSubscriptionForm({...subscriptionForm, endDate: e.target.value})} required />
                        </div>
                      </div>
                      <div>
                        <Label className="dark:text-gray-200">Amount (₦)</Label>
                        <Input type="number" value={subscriptionForm.amount} onChange={e => setSubscriptionForm({...subscriptionForm, amount: e.target.value})} required />
                      </div>
                      <div>
                        <Label className="dark:text-gray-200">Payment Method</Label>
                        <Select value={subscriptionForm.paymentMethod} onValueChange={val => setSubscriptionForm({...subscriptionForm, paymentMethod: val})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">Cash</SelectItem>
                            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                            <SelectItem value="ONLINE">Online</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full">Create Subscription</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <Card className="dark:bg-gray-800">
                <CardHeader><CardTitle className="dark:text-white">Active Subscriptions</CardTitle></CardHeader>
                <CardContent>
                  {subscriptions.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No subscriptions found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Student</th>
                            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Route</th>
                            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Period</th>
                            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Amount</th>
                            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Status</th>
                            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {subscriptions.map(sub => (
                            <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3">
                                <p className="font-medium dark:text-white">{sub.student?.firstName} {sub.student?.lastName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{sub.student?.studentId}</p>
                              </td>
                              <td className="px-4 py-3 dark:text-gray-300">{sub.route?.name}</td>
                              <td className="px-4 py-3 text-sm dark:text-gray-300">
                                {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '-'} - {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-4 py-3 dark:text-gray-300">₦{sub.amount?.toLocaleString()}</td>
                              <td className="px-4 py-3">{getStatusBadge(sub.paymentStatus)}</td>
                              <td className="px-4 py-3">
                                {sub.paymentStatus === 'PENDING' && (
                                  <Button size="sm" variant="outline" onClick={() => handleUpdateSubscriptionStatus(sub.id, 'PAID')}>
                                    Mark Paid
                                  </Button>
                                )}
                                {sub.paymentStatus === 'PAID' && (
                                  <Button size="sm" variant="outline" onClick={() => handleUpdateSubscriptionStatus(sub.id, 'CANCELLED')}>
                                    Cancel
                                  </Button>
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
            </>
          )}
        </>
      )}
    </div>
  );
}