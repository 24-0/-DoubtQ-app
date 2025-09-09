import React, { useState, useEffect } from 'react'
import { Users, Plus, MessageCircle, Upload, File, Image } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'
import { projectId } from '../utils/supabase/info'

interface GroupsProps {
  user: any
  session: any
}

interface Group {
  id: string;
  name: string;
  description: string;
  subject: string;
  members?: any[];
  createdAt: string;
  messages?: any[];
  files?: any[];
}

interface GroupChatProps {
  group: Group;
  onBack: () => void;
}

export function Groups({ user, session }: GroupsProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    subject: ''
  })

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'History', 'Geography', 'Literature', 'Economics', 'Philosophy',
    'Psychology', 'Sociology', 'Art', 'Music', 'Engineering', 'Medicine',
    'General Discussion', 'Study Tips', 'Career Guidance'
  ]

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0a52de3b/groups`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
      toast.error('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newGroup.name.trim() || !newGroup.description.trim() || !newGroup.subject) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0a52de3b/groups`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify(newGroup)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create group')
      }

      toast.success('Group created successfully!')
      setShowCreateModal(false)
      setNewGroup({ name: '', description: '', subject: '' })
      fetchGroups()
    } catch (error: any) {
      console.error('Error creating group:', error)
      toast.error(error.message || 'Failed to create group')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewGroup(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (selectedGroup) {
    return <GroupChat group={selectedGroup} onBack={() => setSelectedGroup(null)} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Study Groups</h1>
          <p className="text-gray-600">
            Create discussion rooms and collaborate on unsolved mysteries
          </p>
        </div>
        
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create Group</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Study Group</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter group name..."
                  value={newGroup.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="What will this group discuss?"
                  value={newGroup.description}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={newGroup.subject} onValueChange={(value: string) =>
                  setNewGroup(prev => ({ ...prev, subject: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full">
                Create Group
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No groups yet. Create your first study group!</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </CardContent>
          </Card>
        ) : (
          groups.map((group) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <p className="text-gray-600 text-sm mt-1">{group.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <Badge variant="outline">{group.subject}</Badge>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{group.members?.length || 0} members</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setSelectedGroup(group)}
                    className="flex items-center space-x-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Join Discussion</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

function GroupChat({ group, onBack }: GroupChatProps) {
  const [messages, setMessages] = useState(group.messages || [])
  const [newMessage, setNewMessage] = useState('')
  const [files, setFiles] = useState(group.files || [])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: 'You',
      timestamp: new Date().toISOString()
    }

    setMessages((prev: any[]) => [...prev, message])
    setNewMessage('')
    toast.success('Message sent!')
  }

  const handleFileUpload = () => {
    toast.info('File upload feature coming soon! You\'ll be able to share PDFs, images, and documents.')
  }

  const handleFileChange = (file: File) => {
    // Placeholder for file handling logic
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          ← Back to Groups
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-gray-600">{group.description}</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Discussion</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No messages yet. Start the discussion!
                  </p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{message.sender}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{message.text}</p>
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage()
                    }
                  }}
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Files & Resources */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <File className="w-5 h-5" />
                <span>Shared Files</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleFileUpload}
                className="w-full mb-4"
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              
              {files.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">
                  No files shared yet
                </p>
              ) : (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <File className="w-4 h-4" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Group Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Subject:</strong> {group.subject}</p>
                <p><strong>Members:</strong> {group.members?.length || 0}</p>
                <p><strong>Created:</strong> {new Date(group.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}