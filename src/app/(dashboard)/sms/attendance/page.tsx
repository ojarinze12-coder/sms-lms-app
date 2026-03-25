'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Send
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  enrollments: Array<{
    academicClass: {
      id: string;
      name: string;
    };
  }>;
}

interface AcademicClass {
  id: string;
  name: string;
  level: number;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  remarks: string | null;
  studentId: string;
  student: {
    studentId: string;
    firstName: string;
    lastName: string;
  };
}

export default function AttendancePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchAttendance();
    }
  }, [selectedClass, selectedDate]);

  async function fetchClasses() {
    try {
      const res = await fetch('/api/sms/academic-classes');
      const data = await res.json();
      setClasses(data.classes || []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  }

  async function fetchStudents() {
    try {
      const res = await fetch(`/api/sms/students?classId=${selectedClass}`);
      const data = await res.json();
      setStudents(data || []);
      
      const initialAttendance: Record<string, string> = {};
      (data || []).forEach((s: Student) => {
        initialAttendance[s.id] = 'PRESENT';
      });
      setAttendance(initialAttendance);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  }

  async function fetchAttendance() {
    try {
      const res = await fetch(`/api/sms/attendance?classId=${selectedClass}&date=${selectedDate}`);
      const data = await res.json();
      setAttendanceList(data.attendance || []);
      
      const existingAttendance: Record<string, string> = {};
      (data.attendance || []).forEach((r: AttendanceRecord) => {
        existingAttendance[r.studentId] = r.status;
      });
      setAttendance(existingAttendance);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    }
  }

  async function markAttendance() {
    if (!selectedClass || !selectedDate) {
      toast({ variant: 'destructive', description: 'Please select a class and date' });
      return;
    }

    setLoading(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      const res = await fetch('/api/sms/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk',
          classId: selectedClass,
          date: selectedDate,
          records,
          notifyParents: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({ description: `Marked ${data.marked} students present` });
        fetchAttendance();
      } else {
        toast({ variant: 'destructive', description: data.error || 'Failed to mark attendance' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to mark attendance' });
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    PRESENT: 'bg-green-100 text-green-800',
    ABSENT: 'bg-red-100 text-red-800',
    LATE: 'bg-yellow-100 text-yellow-800',
    EXCUSED: 'bg-blue-100 text-blue-800',
    HALF_DAY: 'bg-orange-100 text-orange-800',
  };

  const presentCount = Object.values(attendance).filter(s => s === 'PRESENT').length;
  const absentCount = Object.values(attendance).filter(s => s === 'ABSENT').length;
  const lateCount = Object.values(attendance).filter(s => s === 'LATE').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Attendance Management</h1>
          <p className="text-gray-500">Mark daily attendance and track student presence</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Send className="w-4 h-4 mr-2" />
            Send Alerts
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-gray-500">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{presentCount}</p>
                <p className="text-sm text-gray-500">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{absentCount}</p>
                <p className="text-sm text-gray-500">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lateCount}</p>
                <p className="text-sm text-gray-500">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mark Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>Select class and date to mark attendance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-64">
              <label className="text-sm font-medium mb-2 block">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} (Level {cls.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-64">
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {selectedClass && students.length > 0 && (
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.studentId}</TableCell>
                      <TableCell>{student.firstName} {student.lastName}</TableCell>
                      <TableCell>
                        <Select 
                          value={attendance[student.id] || 'PRESENT'}
                          onValueChange={(value) => setAttendance(prev => ({ ...prev, [student.id]: value }))}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRESENT">
                              <Badge className="bg-green-100 text-green-800">Present</Badge>
                            </SelectItem>
                            <SelectItem value="ABSENT">
                              <Badge className="bg-red-100 text-red-800">Absent</Badge>
                            </SelectItem>
                            <SelectItem value="LATE">
                              <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>
                            </SelectItem>
                            <SelectItem value="EXCUSED">
                              <Badge className="bg-blue-100 text-blue-800">Excused</Badge>
                            </SelectItem>
                            <SelectItem value="HALF_DAY">
                              <Badge className="bg-orange-100 text-orange-800">Half Day</Badge>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Optional remarks"
                          className="w-40"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex justify-end">
                <Button onClick={markAttendance} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Attendance'}
                </Button>
              </div>
            </div>
          )}

          {selectedClass && students.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No students found in this class
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceList.slice(0, 10).map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>{record.student.studentId}</TableCell>
                  <TableCell>{record.student.firstName} {record.student.lastName}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[record.status]}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.remarks || '-'}</TableCell>
                </TableRow>
              ))}
              {attendanceList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    No attendance records yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
