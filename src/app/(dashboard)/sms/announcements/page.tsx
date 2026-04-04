'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Bell, 
  Send, 
  Calendar,
  Users,
  AlertTriangle,
  Megaphone,
  GraduationCap,
  DollarSign,
  Clock,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  targetRoles: string[];
  priority: string;
  isPublished: boolean;
  publishAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'GENERAL',
    priority: 'NORMAL',
    isPublished: false,
    targetRoles: ['ALL'] as string[],
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    try {
      const res = await fetch('/api/sms/announcements');
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    }
  }

  async function createAnnouncement() {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast({ variant: 'destructive', description: 'Please fill in title and content' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/sms/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnnouncement),
      });

      const data = await res.json();
      if (data.announcement) {
        toast({ description: 'Announcement created successfully' });
        setShowAddDialog(false);
        setNewAnnouncement({
          title: '',
          content: '',
          type: 'GENERAL',
          priority: 'NORMAL',
          isPublished: false,
          targetRoles: ['ALL'],
        });
        fetchAnnouncements();
      } else {
        toast({ variant: 'destructive', description: data.error || 'Failed to create announcement' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to create announcement' });
    } finally {
      setLoading(false);
    }
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const res = await fetch(`/api/sms/announcements?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({ description: 'Announcement deleted' });
        fetchAnnouncements();
      } else {
        toast({ variant: 'destructive', description: 'Failed to delete announcement' });
      }
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to delete announcement' });
    }
  }

  const typeIcons: Record<string, any> = {
    GENERAL: Bell,
    ACADEMIC: GraduationCap,
    EVENT: Calendar,
    FEE: DollarSign,
    ATTENDANCE: Users,
    EMERGENCY: AlertTriangle,
  };

  const typeColors: Record<string, string> = {
    GENERAL: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    ACADEMIC: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    EVENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    FEE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    ATTENDANCE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    EMERGENCY: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    NORMAL: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    HIGH: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
    URGENT: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Announcements</h1>
          <p className="text-gray-500 dark:text-gray-400">School-wide notifications and communications</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Megaphone className="w-4 h-4 mr-2" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Create Announcement</DialogTitle>
              <DialogDescription className="dark:text-gray-400">Send notifications to parents, students, and staff</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block dark:text-white">Title</label>
                <Input 
                  placeholder="e.g., School Resumes Next Monday"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block dark:text-white">Content</label>
                <Textarea 
                  placeholder="Write your announcement here..."
                  rows={5}
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block dark:text-white">Type</label>
                  <Select value={newAnnouncement.type} onValueChange={(v) => setNewAnnouncement(prev => ({ ...prev, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">General</SelectItem>
                      <SelectItem value="ACADEMIC">Academic</SelectItem>
                      <SelectItem value="EVENT">Event</SelectItem>
                      <SelectItem value="FEE">Fee</SelectItem>
                      <SelectItem value="ATTENDANCE">Attendance</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block dark:text-white">Priority</label>
                  <Select value={newAnnouncement.priority} onValueChange={(v) => setNewAnnouncement(prev => ({ ...prev, priority: v }))}>
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
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="publish"
                  checked={newAnnouncement.isPublished}
                  onCheckedChange={(checked) => setNewAnnouncement(prev => ({ ...prev, isPublished: checked as boolean }))}
                />
                <label htmlFor="publish" className="text-sm dark:text-gray-300">
                  Publish immediately (send to WhatsApp/SMS)
                </label>
              </div>
              <Button onClick={createAnnouncement} disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Announcement'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{announcements.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Announcements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Send className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{announcements.filter(a => a.isPublished).length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Published</p>
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
                <p className="text-2xl font-bold dark:text-white">{announcements.filter(a => !a.isPublished).length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white">All Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="dark:border-gray-700">
                <TableHead className="dark:text-gray-300">Type</TableHead>
                <TableHead className="dark:text-gray-300">Title</TableHead>
                <TableHead className="dark:text-gray-300">Priority</TableHead>
                <TableHead className="dark:text-gray-300">Status</TableHead>
                <TableHead className="dark:text-gray-300">Created</TableHead>
                <TableHead className="dark:text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((announcement) => {
                const TypeIcon = typeIcons[announcement.type] || Bell;
                return (
                  <TableRow key={announcement.id} className="dark:border-gray-700">
                    <TableCell>
                      <Badge className={typeColors[announcement.type]}>
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {announcement.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium dark:text-gray-200">{announcement.title}</TableCell>
                    <TableCell>
                      <Badge className={priorityColors[announcement.priority]}>
                        {announcement.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {announcement.isPublished ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Published</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedAnnouncement(announcement)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {announcements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No announcements yet. Create your first announcement!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
        <DialogContent className="max-w-2xl dark:bg-gray-800">
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge className={typeColors[selectedAnnouncement.type]}>
                    {selectedAnnouncement.type}
                  </Badge>
                  <Badge className={priorityColors[selectedAnnouncement.priority]}>
                    {selectedAnnouncement.priority}
                  </Badge>
                </div>
                <DialogTitle className="mt-2 dark:text-white">{selectedAnnouncement.title}</DialogTitle>
                <DialogDescription className="dark:text-gray-400">
                  Created on {new Date(selectedAnnouncement.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg dark:text-gray-200">
                <p className="whitespace-pre-wrap">{selectedAnnouncement.content}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setSelectedAnnouncement(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
