'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, Video, Clock, Users, Plus, Play, Eye, Trash2, ArrowLeft } from 'lucide-react'

interface VirtualClass {
  id: string
  title: string
  description: string | null
  roomUrl: string
  hostUrl: string
  meetingPassword: string | null
  scheduledAt: string
  duration: number
  status: string
  subjectId: string | null
  classId: string | null
  teacherId: string | null
  class?: { name: string } | null
  subject?: { name: string } | null
  _count?: { attendances: number }
}

interface ClassOption {
  id: string
  name: string
  section?: string | null;
  department?: { id: string; name: string; code: string } | null;
}

interface Subject {
  id: string
  name: string
}

export default function VirtualClassesPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<VirtualClass[]>([])
  const [classOptions, setClassOptions] = useState<ClassOption[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<VirtualClass | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    scheduledAt: '',
    duration: 60,
    notifyStudents: true,
    allowRecording: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [classesRes, classesDataRes, subjectsRes] = await Promise.all([
        fetch('/api/sms/virtual-classes'),
        fetch('/api/sms/academic-classes?limit=100'),
        fetch('/api/sms/subjects?limit=100')
      ])

      const classesData = await classesRes.json()
      const classData = await classesDataRes.json()
      const subjectData = await subjectsRes.json()

      console.log('Subjects API response:', subjectData)

      setClasses(Array.isArray(classesData) ? classesData : [])
      
      // Handle API response format - aggressive deduplication using Map
      const rawClasses = Array.isArray(classData?.data) ? classData.data : Array.isArray(classData) ? classData : []
      const classesMap = new Map()
      rawClasses.forEach((c: any) => {
        if (c.id && !classesMap.has(c.id)) {
          classesMap.set(c.id, c)
        }
      })
      
      const uniqueClasses = Array.from(classesMap.values())
      // If no classes from API, use empty but allow form to work
      if (uniqueClasses.length === 0) {
        setClassOptions([])
      } else {
        setClassOptions(uniqueClasses)
      }
      
      // Handle subjects - aggressive deduplication using Map
      let rawSubjects = []
      if (subjectData?.data) {
        rawSubjects = subjectData.data
      } else if (Array.isArray(subjectData)) {
        rawSubjects = subjectData
      }
      
      const subjectsMap = new Map()
      rawSubjects.forEach((s: any) => {
        if (s.id && !subjectsMap.has(s.id)) {
          subjectsMap.set(s.id, s)
        }
      })
      
      const uniqueSubjects = Array.from(subjectsMap.values())
      console.log('Unique subjects:', uniqueSubjects.length)
      
      // If no subjects from API, use fallback
      if (uniqueSubjects.length === 0) {
        setSubjects([
          { id: 'math', name: 'Mathematics' },
          { id: 'english', name: 'English Language' },
          { id: 'physics', name: 'Physics' },
          { id: 'chemistry', name: 'Chemistry' },
          { id: 'biology', name: 'Biology' },
          { id: 'commerce', name: 'Commerce' },
          { id: 'accounts', name: 'Accounts' },
          { id: 'economics', name: 'Economics' },
          { id: 'government', name: 'Government' },
          { id: 'literature', name: 'Literature' }
        ])
      } else {
        setSubjects(uniqueSubjects)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      // Fallback subjects on error
      setSubjects([
        { id: 'math', name: 'Mathematics' },
        { id: 'english', name: 'English Language' },
        { id: 'physics', name: 'Physics' },
        { id: 'chemistry', name: 'Chemistry' },
        { id: 'biology', name: 'Biology' }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/sms/virtual-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setIsDialogOpen(false)
        fetchData()
        setFormData({
          title: '',
          description: '',
          subjectId: '',
          classId: '',
          scheduledAt: '',
          duration: 60,
          notifyStudents: true,
          allowRecording: true
        })
      }
    } catch (error) {
      console.error('Error creating virtual class:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this virtual class?')) return
    try {
      await fetch(`/api/sms/virtual-classes/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting virtual class:', error)
    }
  }

  const handleStart = async (vc: VirtualClass) => {
    try {
      await fetch(`/api/sms/virtual-classes/${vc.id}/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      })
      window.open(vc.hostUrl || vc.roomUrl, '_blank')
      fetchData()
    } catch (error) {
      console.error('Error starting class:', error)
    }
  }

  const handleJoin = (vc: VirtualClass) => {
    const joinUrl = vc.meetingPassword 
      ? `${vc.roomUrl}?pwd=${vc.meetingPassword}`
      : vc.roomUrl
    window.open(joinUrl, '_blank')
  }

  const filteredClasses = classes.filter(vc => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return vc.status === 'SCHEDULED' && new Date(vc.scheduledAt) > new Date()
    if (filter === 'live') return vc.status === 'LIVE'
    if (filter === 'ended') return vc.status === 'ENDED'
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return <Badge className="bg-red-500">Live Now</Badge>
      case 'SCHEDULED':
        return <Badge className="bg-blue-500">Scheduled</Badge>
      case 'ENDED':
        return <Badge className="bg-gray-500">Ended</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Virtual Classrooms</h1>
          <p className="text-gray-500">Manage live online classes with Jitsi Meet</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Class
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
        <Button variant={filter === 'upcoming' ? 'default' : 'outline'} onClick={() => setFilter('upcoming')}>Upcoming</Button>
        <Button variant={filter === 'live' ? 'default' : 'outline'} onClick={() => setFilter('live')}>Live</Button>
        <Button variant={filter === 'ended' ? 'default' : 'outline'} onClick={() => setFilter('ended')}>Ended</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((vc) => (
          <Card key={vc.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{vc.title}</CardTitle>
                {getStatusBadge(vc.status)}
              </div>
              {vc.class && <p className="text-sm text-gray-500">{vc.class.name}</p>}
            </CardHeader>
            <CardContent className="space-y-3">
              {vc.description && <p className="text-sm text-gray-600 line-clamp-2">{vc.description}</p>}
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(vc.scheduledAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {vc.duration} min
                </div>
                {vc._count?.attendances !== undefined && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {vc._count.attendances}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                {vc.status === 'SCHEDULED' && (
                  <Button size="sm" onClick={() => handleStart(vc)}>
                    <Play className="w-4 h-4 mr-1" /> Start
                  </Button>
                )}
                {vc.status === 'LIVE' && (
                  <Button size="sm" onClick={() => handleJoin(vc)}>
                    <Video className="w-4 h-4 mr-1" /> Join
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setSelectedClass(vc)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(vc.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            No virtual classes found. Schedule your first class!
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Virtual Class</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Mathematics Lesson"
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Lesson description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Class</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(v) => setFormData({ ...formData, classId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {classOptions.length > 0 ? classOptions.map((c) => {
                      const fullClassName = c.department 
                        ? `${c.name}-${c.department.code}${c.section ? '-' + c.section : ''}`
                        : c.section 
                          ? `${c.name}-${c.section}`
                          : c.name;
                      return (
                        <SelectItem key={c.id} value={c.id}>{fullClassName}</SelectItem>
                      );
                    }) : (
                      <div className="p-2 text-sm text-gray-500">No classes available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(v) => setFormData({ ...formData, subjectId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {subjects.length > 0 ? subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    )) : (
                      <div className="p-2 text-sm text-gray-500">No subjects available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  min={15}
                  max={180}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="notifyStudents"
                checked={formData.notifyStudents}
                onChange={(e) => setFormData({ ...formData, notifyStudents: e.target.checked })}
              />
              <Label htmlFor="notifyStudents">Notify students</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Schedule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedClass?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedClass?.description && (
              <p className="text-gray-600">{selectedClass.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Scheduled:</span>
                <p>{new Date(selectedClass?.scheduledAt || '').toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Duration:</span>
                <p>{selectedClass?.duration} minutes</p>
              </div>
              <div>
                <span className="text-gray-500">Meeting Password:</span>
                <p className="font-mono">{selectedClass?.meetingPassword || 'None'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {selectedClass?.status === 'SCHEDULED' && (
                <Button onClick={() => { handleStart(selectedClass); setSelectedClass(null); }}>
                  <Play className="w-4 h-4 mr-1" /> Start Class
                </Button>
              )}
              {selectedClass?.status === 'LIVE' && (
                <Button onClick={() => { handleJoin(selectedClass); setSelectedClass(null); }}>
                  <Video className="w-4 h-4 mr-1" /> Join Class
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
