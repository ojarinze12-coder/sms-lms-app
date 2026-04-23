'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/BackButton';
import { 
  Ticket, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Send,
  Loader2
} from 'lucide-react';

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}

const CATEGORIES = [
  { value: 'BILLING', label: 'Billing & Payments' },
  { value: 'TECHNICAL', label: 'Technical Issue' },
  { value: 'ACADEMIC', label: 'Academic & Curriculum' },
  { value: 'ACCOUNT', label: 'Account Management' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  { value: 'BUG_REPORT', label: 'Bug Report' },
  { value: 'OTHER', label: 'Other' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-200 text-red-900' },
];

const STATUSES = [
  { value: 'OPEN', label: 'Open', color: 'bg-green-100 text-green-800' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'PENDING_REPLY', label: 'Pending Reply', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'RESOLVED', label: 'Resolved', color: 'bg-purple-100 text-purple-800' },
  { value: 'CLOSED', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
];

export default function SchoolSupportPage() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'TECHNICAL',
    priority: 'MEDIUM',
  });

  useEffect(() => {
    if (!authLoading) {
      fetchTickets();
    }
  }, [authLoading]);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support-tickets');
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setShowModal(false);
        setFormData({ subject: '', description: '', category: 'TECHNICAL', priority: 'MEDIUM' });
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const openTicketDetail = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setLoadingMessages(true);
    
    try {
      const res = await fetch(`/api/support-tickets/${ticket.id}`);
      const data = await res.json();
      setMessages(data.ticket?.messages || []);
      if (data.ticket) {
        setSelectedTicket(prev => prev ? { ...prev, status: data.ticket.status } : null);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    
    try {
      const res = await fetch(`/api/support-tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' }),
      });
      
      if (res.ok) {
        setSelectedTicket({ ...selectedTicket, status: 'CLOSED' });
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to close ticket:', err);
    }
  };

  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedTicket) return;
    
    setSendingReply(true);
    try {
      const res = await fetch(`/api/support-tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data.message]);
        setReplyContent('');
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITIES.find(p => p.value === priority)?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    return STATUSES.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton href="/school/dashboard" label="Back to Dashboard" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Submit and manage support requests</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Ticket className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tickets.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <AlertCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tickets.filter(t => t.status === 'OPEN').length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tickets.filter(t => t.status === 'PENDING_REPLY').length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Your Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No support tickets yet</p>
              <Button onClick={() => setShowModal(true)} variant="outline" className="mt-4">
                Create your first ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => openTicketDetail(ticket)}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                          {ticket.ticketNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{ticket.subject}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {ticket._count.messages}
                      </span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Support Ticket</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((pri) => (
                        <SelectItem key={pri.value} value={pri.value}>{pri.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed information about your issue..."
                  rows={5}
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" onClick={() => setShowModal(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedTicket.subject}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedTicket.ticketNumber} • {new Date(selectedTicket.createdAt).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex gap-2 mb-6 items-center">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                {selectedTicket.priority}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                {selectedTicket.status.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {CATEGORIES.find(c => c.value === selectedTicket.category)?.label}
              </span>
              {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
                <Button 
                  onClick={handleCloseTicket}
                  size="sm"
                  variant="outline"
                  className="ml-auto text-green-600 border-green-600 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Close Ticket
                </Button>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Description</p>
                <p className="text-gray-600 dark:text-gray-300">{selectedTicket.description}</p>
              </div>

              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : messages.length > 1 ? (
                <div className="space-y-4 mb-4">
                  {messages.slice(1).map((msg: any) => (
                    <div key={msg.id} className={`p-4 rounded-lg ${msg.senderType === 'ADMIN' ? 'bg-blue-50 dark:bg-blue-900/20 ml-8' : 'bg-gray-50 dark:bg-gray-700/50 mr-8'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{msg.senderName}</span>
                        <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">{msg.content}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
              <div className="flex gap-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply..."
                  rows={2}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1"
                />
                <Button onClick={handleSendReply} disabled={sendingReply || !replyContent.trim()} className="self-end">
                  {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
