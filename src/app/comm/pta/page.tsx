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
import { Bell, Plus, Eye, Edit, Trash2, Calendar, Users, ArrowLeft } from 'lucide-react'

interface Notice {
  id: string
  title: string
  content: string
  priority: string
  targetClass: string[]
  isPublished: boolean
  views: number
  likes: number
  publishAt: string | null
  expiresAt: string | null
  createdAt: string
}

interface ClassOption {
  id: string
  name: string
}

export default function PtaNoticesPage() {
  const router = useRouter()
  const [notices, setNotices] = useState<Notice[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    targetClass: [] as string[],
    isPublished: false,
    publishAt: '',
    expiresAt: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [noticesRes, classesRes] = await Promise.all([
        fetch('/api/comm/pta-notices'),
        fetch('/api/sms/academic-classes?limit=100')
      ])

      const noticesData = await noticesRes.json()
      const classesData = await classesRes.json()

      // Aggressive deduplication using Map
      const rawClasses = Array.isArray(classesData?.data) ? classesData.data : Array.isArray(classesData) ? classesData : []
      const classesMap = new Map()
      rawClasses.forEach((c: any) => {
        if (c.id && !classesMap.has(c.id)) {
          classesMap.set(c.id, c)
        }
      })

      setNotices(Array.isArray(noticesData) ? noticesData : noticesData?.data || [])
      setClasses(Array.from(classesMap.values()))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/comm/pta-notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          publishAt: formData.publishAt || null,
          expiresAt: formData.expiresAt || null
        })
      })

      if (res.ok) {
        setDialogOpen(false)
        fetchData()
        setFormData({
          title: '',
          content: '',
          priority: 'NORMAL',
          targetClass: [],
          isPublished: false,
          publishAt: '',
          expiresAt: ''
        })
      }
    } catch (error) {
      console.error('Error creating notice:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return
    try {
      await fetch(`/api/comm/pta-notices/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting notice:', error)
    }
  }

  const handlePublish = async (notice: Notice) => {
    try {
      await fetch(`/api/comm/pta-notices/${notice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !notice.isPublished })
      })
      fetchData()
    } catch (error) {
      console.error('Error toggling publish:', error)
    }
  }

  const filteredNotices = notices.filter(n => {
    if (filter === 'all') return true
    if (filter === 'published') return n.isPublished
    if (filter === 'draft') return !n.isPublished
    return true
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'NORMAL': return 'bg-blue-100 text-blue-800'
      case 'LOW': return 'bg-gray-100 text-gray-800'
      default: return ''
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
          <h1 className="text-2xl font-bold">PTA Notices</h1>
          <p className="text-gray-500">Manage Parent-Teacher Association announcements</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Notice
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
        <Button variant={filter === 'published' ? 'default' : 'outline'} onClick={() => setFilter('published')}>Published</Button>
        <Button variant={filter === 'draft' ? 'default' : 'outline'} onClick={() => setFilter('draft')}>Drafts</Button>
      </div>

      <div className="grid gap-4">
        {filteredNotices.map((notice) => (
          <Card key={notice.id} className={notice.isPublished ? '' : 'opacity-75'}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{notice.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getPriorityColor(notice.priority)}>{notice.priority}</Badge>
                    <Badge variant={notice.isPublished ? 'default' : 'secondary'}>
                      {notice.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                    {notice.targetClass.length > 0 && (
                      <Badge variant="outline">
                        <Users className="w-3 h-3 mr-1" /> Targeted
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedNotice(notice); setViewDialogOpen(true); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handlePublish(notice)}>
                    {notice.isPublished ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(notice.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 line-clamp-2">{notice.content}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {notice.views} views
                </span>
                {notice.publishAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Published: {new Date(notice.publishAt).toLocaleDateString()}
                  </span>
                )}
                <span>Created: {new Date(notice.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredNotices.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              No notices found. Create your first PTA notice!
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create PTA Notice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notice title"
                required
              />
            </div>
            <div>
              <Label>Content</Label>
              <textarea
                className="w-full p-2 border rounded-md min-h-[120px]"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Notice content..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  id="publish"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                />
                <Label htmlFor="publish">Publish now</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Publish Date (optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.publishAt}
                  onChange={(e) => setFormData({ ...formData, publishAt: e.target.value })}
                />
              </div>
              <div>
                <Label>Expiry Date (optional)</Label>
                <Input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Target Classes (optional - leave empty for all)</Label>
              <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto border rounded p-2">
                {classes.map((cls) => (
                  <label key={cls.id} className="flex items-center gap-2 border px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.targetClass.includes(cls.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, targetClass: [...formData.targetClass, cls.id] })
                        } else {
                          setFormData({ ...formData, targetClass: formData.targetClass.filter(id => id !== cls.id) })
                        }
                      }}
                    />
                    {cls.name}
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Create Notice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedNotice?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(selectedNotice?.priority || 'NORMAL')}>
                {selectedNotice?.priority}
              </Badge>
              <Badge variant={selectedNotice?.isPublished ? 'default' : 'secondary'}>
                {selectedNotice?.isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{selectedNotice?.content}</p>
            </div>
            <div className="text-sm text-gray-500">
              <p>Views: {selectedNotice?.views}</p>
              <p>Created: {selectedNotice?.createdAt ? new Date(selectedNotice.createdAt).toLocaleString() : ''}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
