'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-fetch';

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  requesterName: string;
  requesterEmail: string;
  tenantId: string | null;
  tenant?: { name: string };
  assignedTo: string | null;
  createdAt: string;
  _count: { messages: number };
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    try {
      const url = filter === 'all' ? '/api/admin/tickets' : `/api/admin/tickets?status=${filter}`;
      const res = await authFetch(url);
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return;
    setReplying(true);
    try {
      await authFetch(`/api/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      });
      setReplyContent('');
      fetchTickets();
    } catch (err) {
      console.error(err);
    } finally {
      setReplying(false);
    }
  };

  const handleAssign = async (ticketId: string, adminId: string) => {
    try {
      await authFetch(`/api/admin/tickets/${ticketId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: adminId }),
      });
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'URGENT': return 'bg-orange-100 text-orange-800';
      case 'HIGH': return 'bg-yellow-100 text-yellow-800';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'PENDING_REPLY': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-purple-100 text-purple-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage support requests from tenants</p>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'OPEN', 'IN_PROGRESS', 'PENDING_REPLY', 'RESOLVED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Tickets</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No tickets found</div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedTicket?.id === ticket.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{ticket.subject}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{ticket.requesterName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{ticket.ticketNumber}</p>
                    </div>
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          {selectedTicket ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedTicket.subject}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedTicket.ticketNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <p><span className="font-medium dark:text-white">From:</span> {selectedTicket.requesterName} ({selectedTicket.requesterEmail})</p>
                  <p><span className="font-medium dark:text-white">Category:</span> {selectedTicket.category}</p>
                  <p><span className="font-medium dark:text-white">Date:</span> {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto max-h-[400px]">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedTicket.description}</p>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <div className="flex justify-between mt-3">
                  <select
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                    onChange={(e) => handleAssign(selectedTicket.id, e.target.value)}
                    value={selectedTicket.assignedTo || ''}
                  >
                    <option value="">Assign to...</option>
                    <option value="admin1">Admin 1</option>
                    <option value="admin2">Admin 2</option>
                  </select>
                  <button
                    onClick={handleReply}
                    disabled={replying || !replyContent.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {replying ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 p-8">
              Select a ticket to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
