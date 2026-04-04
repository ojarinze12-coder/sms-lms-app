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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FolderOpen, FileVideo, FileText, Image, FileAudio, Link, 
  Plus, Upload, Trash2, Eye, Play, Download, Search, ArrowLeft
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string | null
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  type: string
  resources: Resource[]
}

interface Resource {
  id: string
  name: string
  type: string
  url: string
  mimeType: string | null
  duration: number | null
  size: number | null
  isExternal: boolean
  createdAt: string
}

interface ClassOption {
  id: string
  name: string
}

export default function ContentLibraryPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterClass, setFilterClass] = useState<string>('all')

  const [resourceForm, setResourceForm] = useState({
    name: '',
    type: 'DOCUMENT',
    url: '',
    isExternal: false
  })

  const [createCourseDialogOpen, setCreateCourseDialogOpen] = useState(false)
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    classId: ''
  })

  useEffect(() => {
    fetchData()
  }, [filterClass])

  const fetchData = async () => {
    try {
      const classParam = filterClass !== 'all' ? `&classId=${filterClass}` : ''
      const [coursesRes, classesRes] = await Promise.all([
        fetch(`/api/lms/courses?limit=100${classParam}`),
        fetch('/api/sms/academic-classes?limit=100')
      ])

      const coursesData = await coursesRes.json()
      const classesData = await classesRes.json()

      const coursesList = coursesData?.data || coursesData || []
      
      // Fetch lessons and resources for each course
      const coursesWithLessons = await Promise.all(
        (Array.isArray(coursesList) ? coursesList : []).map(async (course: any) => {
          try {
            const lessonsRes = await fetch(`/api/lms/courses/${course.id}/lessons`)
            const lessonsData = await lessonsRes.json()
            const lessons = Array.isArray(lessonsData) ? lessonsData : lessonsData?.data || []
            
            // Fetch resources for each lesson
            const lessonsWithResources = await Promise.all(
              lessons.map(async (lesson: any) => {
                try {
                  const resourcesRes = await fetch(`/api/lms/lessons/${lesson.id}/resources`)
                  const resourcesData = await resourcesRes.json()
                  return {
                    ...lesson,
                    resources: Array.isArray(resourcesData) ? resourcesData : resourcesData?.data || []
                  }
                } catch {
                  return { ...lesson, resources: [] }
                }
              })
            )
            
            return { ...course, lessons: lessonsWithResources }
          } catch {
            return { ...course, lessons: [] }
          }
        })
      )

      setCourses(coursesWithLessons)
      
      // Aggressive deduplication using Map
      const rawClasses = Array.isArray(classesData?.data) ? classesData.data : Array.isArray(classesData) ? classesData : []
      const classesMap = new Map()
      rawClasses.forEach((c: any) => {
        if (c.id && !classesMap.has(c.id)) {
          classesMap.set(c.id, c)
        }
      })
      setClasses(Array.from(classesMap.values()))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLesson) return

    try {
      const res = await fetch(`/api/lms/lessons/${selectedLesson.id}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resourceForm)
      })

      if (res.ok) {
        setResourceDialogOpen(false)
        fetchData()
        setResourceForm({ name: '', type: 'DOCUMENT', url: '', isExternal: false })
      }
    } catch (error) {
      console.error('Error adding resource:', error)
    }
  }

  const handleDeleteResource = async (lessonId: string, resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    
    try {
      await fetch(`/api/lms/lessons/${lessonId}/resources/${resourceId}`, {
        method: 'DELETE'
      })
      fetchData()
    } catch (error) {
      console.error('Error deleting resource:', error)
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <FileVideo className="w-5 h-5 text-blue-500" />
      case 'AUDIO': return <FileAudio className="w-5 h-5 text-purple-500" />
      case 'IMAGE': return <Image className="w-5 h-5 text-green-500" />
      case 'PDF':
      case 'DOCUMENT': return <FileText className="w-5 h-5 text-red-500" />
      case 'LINK': return <Link className="w-5 h-5 text-gray-500" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const getAllResources = () => {
    let resources: { resource: Resource; lesson: Lesson; course: Course }[] = []
    
    courses.forEach(course => {
      course.lessons.forEach(lesson => {
        lesson.resources.forEach(resource => {
          resources.push({ resource, lesson, course })
        })
      })
    })

    if (searchQuery) {
      resources = resources.filter(r => 
        r.resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.course.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterType !== 'all') {
      resources = resources.filter(r => r.resource.type === filterType)
    }

    return resources
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (isLoading) {
    return <div className="p-6">Loading content library...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Content Library</h1>
          <p className="text-gray-500">Manage digital content and resources for your courses</p>
        </div>
        <Button onClick={() => setCreateCourseDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Course
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="VIDEO">Video</SelectItem>
            <SelectItem value="DOCUMENT">Document</SelectItem>
            <SelectItem value="PDF">PDF</SelectItem>
            <SelectItem value="IMAGE">Image</SelectItem>
            <SelectItem value="AUDIO">Audio</SelectItem>
            <SelectItem value="LINK">Link</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="resources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resources">All Resources</TabsTrigger>
          <TabsTrigger value="courses">By Course</TabsTrigger>
        </TabsList>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>All Digital Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getAllResources().map(({ resource, lesson, course }) => (
                  <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      {getResourceIcon(resource.type)}
                      <div>
                        <p className="font-medium">{resource.name}</p>
                        <p className="text-sm text-gray-500">
                          {course.title} → {lesson.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{resource.type}</Badge>
                      {resource.size && (
                        <span className="text-sm text-gray-500">{formatFileSize(resource.size)}</span>
                      )}
                      {resource.duration && (
                        <span className="text-sm text-gray-500">{Math.floor(resource.duration / 60)}:{(resource.duration % 60).toString().padStart(2, '0')}</span>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => window.open(resource.url, '_blank')}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedLesson(lesson)
                          setResourceDialogOpen(true)
                        }}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {getAllResources().length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No resources found. Create a course and add lessons with content.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <div className="grid gap-4">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>{course.title}</CardTitle>
                    <Badge>{course.lessons.length} lessons</Badge>
                  </div>
                  {course.description && (
                    <p className="text-sm text-gray-500">{course.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {course.lessons.map((lesson) => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FolderOpen className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            <p className="text-xs text-gray-500">{lesson.resources.length} resources</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lesson.resources.slice(0, 3).map((r) => (
                            <span key={r.id} className="text-xs">{getResourceIcon(r.type)}</span>
                          ))}
                          {lesson.resources.length > 3 && (
                            <Badge variant="outline">+{lesson.resources.length - 3}</Badge>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedCourse(course)
                              setSelectedLesson(lesson)
                              setResourceDialogOpen(true)
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {course.lessons.length === 0 && (
                      <p className="text-sm text-gray-500">No lessons in this course yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {courses.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-gray-500">
                  No courses found. Create courses and add lessons to build your content library.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Resource Dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Resource to Lesson</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Adding to: {selectedLesson?.title}
          </p>
          <form onSubmit={handleAddResource} className="space-y-4">
            <div>
              <Label>Resource Name</Label>
              <Input
                value={resourceForm.name}
                onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                placeholder="e.g., Lecture Video, Worksheet, etc."
                required
              />
            </div>
            <div>
              <Label>Resource Type</Label>
              <Select
                value={resourceForm.type}
                onValueChange={(v) => setResourceForm({ ...resourceForm, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="DOCUMENT">Document</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="IMAGE">Image</SelectItem>
                  <SelectItem value="AUDIO">Audio</SelectItem>
                  <SelectItem value="LINK">External Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL</Label>
              <Input
                value={resourceForm.url}
                onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isExternal"
                checked={resourceForm.isExternal}
                onChange={(e) => setResourceForm({ ...resourceForm, isExternal: e.target.checked })}
              />
              <Label htmlFor="isExternal">External link (YouTube, Vimeo, etc.)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResourceDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Add Resource</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Course Dialog */}
      <Dialog open={createCourseDialogOpen} onOpenChange={setCreateCourseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            fetch('/api/lms/courses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...courseForm,
                description: courseForm.description || null
              })
            }).then(() => {
              setCreateCourseDialogOpen(false)
              fetchData()
              setCourseForm({ title: '', description: '', classId: '' })
            })
          }} className="space-y-4">
            <div>
              <Label>Course Title</Label>
              <Input
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                placeholder="e.g., Mathematics Basics"
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={3}
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="Course description..."
              />
            </div>
            <div>
              <Label>Class</Label>
              <Select
                value={courseForm.classId}
                onValueChange={(v) => setCourseForm({ ...courseForm, classId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateCourseDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Create Course</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
