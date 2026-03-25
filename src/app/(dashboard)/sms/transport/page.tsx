'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  driverName?: string;
  driverPhone?: string;
  status: string;
}

interface Route {
  id: string;
  name: string;
  area: string;
  pickupPoints: string[];
  fare: number;
  status: string;
}

export default function TransportPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'routes'>('vehicles');
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ plateNumber: '', model: '', capacity: '', driverName: '', driverPhone: '' });
  const [routeForm, setRouteForm] = useState({ name: '', area: '', pickupPoints: '', fare: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [vehRes, routesRes] = await Promise.all([
        fetch('/api/sms/transport/vehicles'),
        fetch('/api/sms/transport/routes'),
      ]);
      setVehicles(await vehRes.json());
      setRoutes(await routesRes.json());
    } catch (err) {
      console.error('Failed to fetch transport data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/sms/transport/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vehicleForm, capacity: parseInt(vehicleForm.capacity), status: 'ACTIVE' }),
      });
      setShowVehicleForm(false);
      setVehicleForm({ plateNumber: '', model: '', capacity: '', driverName: '', driverPhone: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to add vehicle:', err);
    }
  }

  async function handleAddRoute(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/sms/transport/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...routeForm, pickupPoints: routeForm.pickupPoints.split(',').map(p => p.trim()), fare: parseFloat(routeForm.fare), status: 'ACTIVE' }),
      });
      setShowRouteForm(false);
      setRouteForm({ name: '', area: '', pickupPoints: '', fare: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to add route:', err);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transport Management</h1>

      <div className="flex gap-4 border-b">
        <button className={`px-4 py-2 ${activeTab === 'vehicles' ? 'border-b-2 border-blue-500 font-bold' : ''}`} onClick={() => setActiveTab('vehicles')}>Vehicles</button>
        <button className={`px-4 py-2 ${activeTab === 'routes' ? 'border-b-2 border-blue-500 font-bold' : ''}`} onClick={() => setActiveTab('routes')}>Routes</button>
      </div>

      {activeTab === 'vehicles' && (
        <>
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">Vehicles</h2>
            <Button onClick={() => setShowVehicleForm(!showVehicleForm)}>{showVehicleForm ? 'Cancel' : 'Add Vehicle'}</Button>
          </div>
          {showVehicleForm && (
            <Card>
              <CardHeader><CardTitle>Add Vehicle</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddVehicle} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="Plate Number" value={vehicleForm.plateNumber} onChange={e => setVehicleForm({...vehicleForm, plateNumber: e.target.value})} required />
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
          <Card>
            <CardContent className="pt-6">
              {loading ? <p>Loading...</p> : vehicles.length === 0 ? <p className="text-gray-500">No vehicles found.</p> : (
                <div className="grid grid-cols-3 gap-4">
                  {vehicles.map(vehicle => (
                    <div key={vehicle.id} className="border rounded p-4">
                      <h3 className="font-bold">{vehicle.plateNumber}</h3>
                      <p className="text-sm text-gray-600">{vehicle.model}</p>
                      <p className="text-sm">Capacity: {vehicle.capacity}</p>
                      {vehicle.driverName && <p className="text-sm">Driver: {vehicle.driverName}</p>}
                      {vehicle.driverPhone && <p className="text-sm">Phone: {vehicle.driverPhone}</p>}
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
            <h2 className="text-xl font-semibold">Routes</h2>
            <Button onClick={() => setShowRouteForm(!showRouteForm)}>{showRouteForm ? 'Cancel' : 'Add Route'}</Button>
          </div>
          {showRouteForm && (
            <Card>
              <CardHeader><CardTitle>Add Route</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddRoute} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="Route Name" value={routeForm.name} onChange={e => setRouteForm({...routeForm, name: e.target.value})} required />
                    <Input placeholder="Area" value={routeForm.area} onChange={e => setRouteForm({...routeForm, area: e.target.value})} required />
                    <Input placeholder="Pickup Points (comma separated)" value={routeForm.pickupPoints} onChange={e => setRouteForm({...routeForm, pickupPoints: e.target.value})} required />
                    <Input type="number" placeholder="Fare (₦)" value={routeForm.fare} onChange={e => setRouteForm({...routeForm, fare: e.target.value})} required />
                  </div>
                  <Button type="submit">Add Route</Button>
                </form>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle>Transport Routes</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p>Loading...</p> : routes.length === 0 ? <p className="text-gray-500">No routes found.</p> : (
                <div className="space-y-4">
                  {routes.map(route => (
                    <div key={route.id} className="border rounded p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold">{route.name}</h3>
                          <p className="text-sm text-gray-600">Area: {route.area}</p>
                          <p className="text-sm">Fare: ₦{route.fare.toLocaleString()}</p>
                          <p className="text-sm">Pickup Points: {route.pickupPoints?.join(', ') || 'N/A'}</p>
                        </div>
                        <Badge>{route.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
