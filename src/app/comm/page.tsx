'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Bell, Send, Users, Plus, Mail, Phone, MessageCircle, ArrowLeft } from 'lucide-react'

interface Campaign {
  id: string
  title: string
  message: string
  channels: string[]
  targetType: string
  status: string
  totalRecipients: number
  createdAt: string
}

interface Notice {
  id: string
  title: string
  content: string
  priority: string
  isPublished: boolean
  views: number
  createdAt: string
}

export default function CommunicationPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [classes, setClasses] = useState<{id: string, name: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false)
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false)
  const [campaignSubmitting, setCampaignSubmitting] = useState(false)

  const [campaignForm, setCampaignForm] = useState({
    title: '',
    message: '',
    channels: ['SMS'],
    targetType: 'ALL',
    targetIds: [] as string[]
  })

  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    isPublished: false
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [campaignsRes, noticesRes, classesRes] = await Promise.all([
        fetch('/api/comm/campaigns'),
        fetch('/api/comm/pta-notices'),
        fetch('/api/sms/academic-classes?limit=100')
      ])

      const campaignsData = await campaignsRes.json()
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
      
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : [])
      setNotices(Array.isArray(noticesData) ? noticesData : [])
      setClasses(Array.from(classesMap.values()))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setCampaignSubmitting(true)
    try {
      const payload = {
        ...campaignForm,
        channels: campaignForm.channels.length > 0 ? campaignForm.channels : ['SMS']
      }
      const res = await fetch('/api/comm/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      console.log('Campaign response:', res.status, data)
      
      if (res.ok) {
        setCampaignDialogOpen(false)
        fetchData()
        setCampaignForm({ title: '', message: '', channels: ['SMS'], targetType: 'ALL', targetIds: [] })
        alert('Campaign created successfully!')
      } else {
        alert('Error: ' + (data.error || 'Failed to create campaign'))
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Failed to create campaign')
    } finally {
      setCampaignSubmitting(false)
    }
  }

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/comm/pta-notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticeForm)
      })

      if (res.ok) {
        setNoticeDialogOpen(false)
        fetchData()
        setNoticeForm({ title: '', content: '', priority: 'NORMAL', isPublished: false })
      }
    } catch (error) {
      console.error('Error creating notice:', error)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SMS': return <Phone className="w-3 h-3" />
      case 'WHATSAPP': return <MessageCircle className="w-3 h-3" />
      case 'EMAIL': return <Mail className="w-3 h-3" />
      default: return <MessageSquare className="w-3 h-3" />
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
          <h1 className="text-2xl font-bold">Communication Hub</h1>
          <p className="text-gray-500">Bulk messaging, PTA notices, and parent-teacher chat</p>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">
            <Send className="w-4 h-4 mr-2" /> Bulk Campaigns
          </TabsTrigger>
          <TabsTrigger value="notices">
            <Bell className="w-4 h-4 mr-2" /> PTA Notices
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageCircle className="w-4 h-4 mr-2" /> Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bulk Message Campaigns</CardTitle>
              <Button onClick={() => setCampaignDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> New Campaign
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{campaign.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{campaign.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {campaign.channels.map((ch) => (
                          <Badge key={ch} variant="outline" className="flex items-center gap-1">
                            {getChannelIcon(ch)} {ch}
                          </Badge>
                        ))}
                        <Badge>{campaign.targetType}</Badge>
                        <Badge variant={campaign.status === 'SENT' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{campaign.totalRecipients} recipients</p>
                      <p>{new Date(campaign.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No campaigns yet. Create your first campaign!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>PTA Notices</CardTitle>
              <Button onClick={() => setNoticeDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> New Notice
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notices.map((notice) => (
                  <div key={notice.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{notice.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{notice.content}</p>
                      </div>
                      <Badge variant={notice.priority === 'URGENT' ? 'destructive' : 'outline'}>
                        {notice.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>{notice.views} views</span>
                      <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                      <Badge variant={notice.isPublished ? 'default' : 'secondary'}>
                        {notice.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {notices.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No notices yet. Create your first notice!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Parent-Teacher chat coming soon!</p>
              <p className="text-sm">Real-time messaging between parents and teachers</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Campaign Dialog */}
      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Bulk Campaign</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <Label>Campaign Title</Label>
              <Input
                value={campaignForm.title}
                onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                placeholder="e.g., Term 2 Announcement"
                required
              />
            </div>
            <div>
              <Label>Message</Label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={4}
                value={campaignForm.message}
                onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                placeholder="Enter your message..."
                required
              />
            </div>
            <div>
              <Label>Channels</Label>
              <div className="flex gap-4 mt-2">
                {['SMS', 'WHATSAPP', 'EMAIL'].map((ch) => (
                  <label key={ch} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={campaignForm.channels.includes(ch)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCampaignForm({ ...campaignForm, channels: [...campaignForm.channels, ch] })
                        } else {
                          setCampaignForm({ ...campaignForm, channels: campaignForm.channels.filter(c => c !== ch) })
                        }
                      }}
                    />
                    {ch}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Target Audience</Label>
              <Select
                value={campaignForm.targetType}
                onValueChange={(v) => setCampaignForm({ ...campaignForm, targetType: v, targetIds: [] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All (Students, Parents, Staff)</SelectItem>
                  <SelectItem value="STUDENTS">Students Only</SelectItem>
                  <SelectItem value="PARENTS">Parents Only</SelectItem>
                  <SelectItem value="TEACHERS">Teachers Only</SelectItem>
                  <SelectItem value="CLASS">Specific Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {campaignForm.targetType === 'CLASS' && (
              <div>
                <Label>Select Classes</Label>
                <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto border rounded p-2">
                  {classes.map((cls) => (
                    <label key={cls.id} className="flex items-center gap-2 border px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={campaignForm.targetIds.includes(cls.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCampaignForm({ ...campaignForm, targetIds: [...campaignForm.targetIds, cls.id] })
                          } else {
                            setCampaignForm({ ...campaignForm, targetIds: campaignForm.targetIds.filter(id => id !== cls.id) })
                          }
                        }}
                      />
                      {cls.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCampaignDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={campaignSubmitting}>
                {campaignSubmitting ? 'Creating...' : 'Create Campaign'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Notice Dialog */}
      <Dialog open={noticeDialogOpen} onOpenChange={setNoticeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create PTA Notice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateNotice} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                placeholder="Notice title"
                required
              />
            </div>
            <div>
              <Label>Content</Label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={4}
                value={noticeForm.content}
                onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                placeholder="Notice content..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={noticeForm.priority}
                  onValueChange={(v) => setNoticeForm({ ...noticeForm, priority: v })}
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
                  checked={noticeForm.isPublished}
                  onChange={(e) => setNoticeForm({ ...noticeForm, isPublished: e.target.checked })}
                />
                <Label htmlFor="publish">Publish immediately</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNoticeDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Create Notice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
