'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageSquare, Send, Plus, Users, Search, 
  MoreVertical, Phone, Video, Image, ArrowLeft
} from 'lucide-react'

interface Conversation {
  id: string
  type: string
  title: string | null
  lastMessageAt: string | null
  class?: { name: string } | null
  participants: Participant[]
  messages?: Message[]
}

interface Participant {
  id: string
  participantId: string
  participantType: string
  role: string
  lastReadAt: string | null
}

interface Message {
  id: string
  senderId: string
  senderType: string
  content: string
  type: string
  attachmentUrl: string | null
  createdAt: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  role: string
}

export default function ChatPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newChatOpen, setNewChatOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [contacts, setContacts] = useState<{id: string, name: string, type: string}[]>([])

  useEffect(() => {
    fetchCurrentUser()
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/comm/conversations')
      const data = await res.json()
      setConversations(Array.isArray(data) ? data : data?.data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    setIsLoadingMessages(true)
    try {
      const res = await fetch(`/api/comm/messages?conversationId=${conversationId}&limit=50`)
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : data?.data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const fetchContacts = async () => {
    try {
      const [studentsRes, parentsRes, teachersRes] = await Promise.all([
        fetch('/api/sms/students?limit=100'),
        fetch('/api/sms/parents?limit=100'),
        fetch('/api/sms/teachers?limit=100')
      ])
      
      const students = await studentsRes.json()
      const parents = await parentsRes.json()
      const teachers = await teachersRes.json()

      const allContacts = [
        ...(students?.data || students || []).map((s: any) => ({ 
          id: s.id, 
          name: `${s.firstName} ${s.lastName} (Student)`,
          type: 'student'
        })),
        ...(parents?.data || parents || []).map((p: any) => ({ 
          id: p.id, 
          name: `${p.firstName} ${p.lastName} (Parent)`,
          type: 'parent'
        })),
        ...(teachers?.data || teachers || []).map((t: any) => ({ 
          id: t.id, 
          name: `${t.firstName} ${t.lastName} (Teacher)`,
          type: 'teacher'
        }))
      ]
      setContacts(allContacts)
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const res = await fetch('/api/comm/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: newMessage,
          type: 'TEXT'
        })
      })

      if (res.ok) {
        setNewMessage('')
        fetchMessages(selectedConversation.id)
        fetchConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleStartNewChat = async (contactId: string) => {
    try {
      const res = await fetch('/api/comm/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DIRECT',
          participantIds: [contactId]
        })
      })

      if (res.ok) {
        const newConversation = await res.json()
        setNewChatOpen(false)
        fetchConversations()
        setSelectedConversation(newConversation)
      }
    } catch (error) {
      console.error('Error starting chat:', error)
    }
  }

  const openNewChat = () => {
    fetchContacts()
    setNewChatOpen(true)
  }

  const filteredConversations = conversations.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.class?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 h-[calc(100vh-100px)]">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Messages</h1>
      </div>
      <div className="flex gap-4 h-full">
        {/* Conversations List */}
        <Card className="w-80 flex-shrink-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <Button size="sm" onClick={openNewChat}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-1 p-2">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedConversation?.id === conv.id 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {conv.title || conv.class?.name || 'Chat'}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {conv.type === 'DIRECT' ? 'Direct message' : conv.type}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredConversations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={openNewChat}
                    >
                      Start a new chat
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedConversation.title || selectedConversation.class?.name || 'Chat'}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.type === 'DIRECT' ? 'Direct message' : selectedConversation.type}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.senderId === currentUser?.id
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isOwn
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwn ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                  <Button type="button" variant="outline" size="icon">
                    <Image className="w-4 h-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={openNewChat}
                >
                  Start a new conversation
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* New Chat Dialog */}
      {newChatOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px] max-h-[80vh]">
            <CardHeader>
              <CardTitle>New Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleStartNewChat(contact.id)}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{contact.type}</p>
                      </div>
                    </button>
                  ))}
                  {contacts.length === 0 && (
                    <p className="text-center text-gray-500 py-4">Loading contacts...</p>
                  )}
                </div>
              </ScrollArea>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setNewChatOpen(false)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
