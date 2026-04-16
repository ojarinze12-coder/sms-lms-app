'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { authFetch } from '@/lib/auth-fetch';
import { useBranch } from '@/lib/hooks/use-branch';
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
  Send,
  Upload
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
  stream?: string | null;
  department?: { id: string; name: string; code: string } | null;
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
  const { selectedBranch } = useBranch();
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    fetchClasses();
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsAndAttendance();
    }
  }, [selectedClass, selectedDate]);

  async function fetchClasses() {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) {
        params.set('branchId', selectedBranch.id);
      }
      const url = '/api/sms/academic-classes' + (params.toString() ? '?' + params.toString() : '');
      const res = await authFetch(url);
      const data = await res.json();
      setClasses(data.data || data || []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  }

  async function fetchStudentsAndAttendance() {
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        fetch(`/api/sms/students?classId=${selectedClass}`),
        fetch(`/api/sms/attendance?classId=${selectedClass}&date=${selectedDate}`)
      ]);
      
      const studentsData = await studentsRes.json();
      const attendanceData = await attendanceRes.json();
      
      setStudents(studentsData || []);
      setAttendanceList(attendanceData.attendance || []);
      
      const existingAttendance: Record<string, string> = {};
      const studentIdsInClass = new Set((studentsData || []).map((s: Student) => s.id));
      
      (studentsData || []).forEach((s: Student) => {
        existingAttendance[s.id] = 'PRESENT';
      });
      
      (attendanceData.attendance || []).forEach((r: AttendanceRecord) => {
        if (studentIdsInClass.has(r.studentId)) {
          existingAttendance[r.studentId] = r.status;
        }
      });
      
      setAttendance(existingAttendance);
    } catch (err) {
      console.error('Failed to fetch data:', err);
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

      const res = await authFetch('/api/sms/attendance', {
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
        toast({ description: `Marked ${data.marked} students` });
        fetchStudentsAndAttendance();
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
    PRESENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    ABSENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    LATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    EXCUSED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    HALF_DAY: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  };

  const presentCount = Object.values(attendance).filter(s => s === 'PRESENT').length;
  const absentCount = Object.values(attendance).filter(s => s === 'ABSENT').length;
  const lateCount = Object.values(attendance).filter(s => s === 'LATE').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Attendance Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Mark daily attendance and track student presence</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
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
        <Card className="dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{students.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{presentCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{absentCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{lateCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mark Attendance */}
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white">Mark Attendance</CardTitle>
          <CardDescription className="dark:text-gray-400">Select class and date to mark attendance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-64">
              <label className="text-sm font-medium mb-2 block dark:text-white">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => {
                    const fullClassName = cls.department 
                      ? `${cls.name}-${cls.department.code}${cls.stream ? '-' + cls.stream : ''}`
                      : cls.stream 
                        ? `${cls.name}-${cls.stream}`
                        : cls.name;
                    return (
                      <SelectItem key={cls.id} value={cls.id}>
                        {fullClassName} (Level {cls.level})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-64">
              <label className="text-sm font-medium mb-2 block dark:text-white">Date</label>
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
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300">Student ID</TableHead>
                    <TableHead className="dark:text-gray-300">Name</TableHead>
                    <TableHead className="dark:text-gray-300">Status</TableHead>
                    <TableHead className="dark:text-gray-300">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} className="dark:border-gray-700">
                      <TableCell className="font-medium dark:text-gray-200">{student.studentId}</TableCell>
                      <TableCell className="dark:text-gray-300">{student.firstName} {student.lastName}</TableCell>
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
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Present</Badge>
                            </SelectItem>
                            <SelectItem value="ABSENT">
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Absent</Badge>
                            </SelectItem>
                            <SelectItem value="LATE">
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Late</Badge>
                            </SelectItem>
                            <SelectItem value="EXCUSED">
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Excused</Badge>
                            </SelectItem>
                            <SelectItem value="HALF_DAY">
                              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">Half Day</Badge>
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
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No students found in this class
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white">Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="dark:border-gray-700">
                <TableHead className="dark:text-gray-300">Date</TableHead>
                <TableHead className="dark:text-gray-300">Student ID</TableHead>
                <TableHead className="dark:text-gray-300">Name</TableHead>
                <TableHead className="dark:text-gray-300">Status</TableHead>
                <TableHead className="dark:text-gray-300">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceList.slice(0, 10).map((record) => (
                <TableRow key={record.id} className="dark:border-gray-700">
                  <TableCell className="dark:text-gray-300">{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell className="dark:text-gray-300">{record.student.studentId}</TableCell>
                  <TableCell className="dark:text-gray-300">{record.student.firstName} {record.student.lastName}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[record.status]}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="dark:text-gray-300">{record.remarks || '-'}</TableCell>
                </TableRow>
              ))}
              {attendanceList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">
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
