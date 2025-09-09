import React, { useState, useEffect } from 'react'
import { Globe, MessageCircle, MapPin, Calendar, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface CommunityProps {
  user: any
  session: any
  isGuest: boolean
}

export function Community({ user, session, isGuest }: CommunityProps) {
  const [selectedCountry, setSelectedCountry] = useState('United States')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [canPost, setCanPost] = useState(true)

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'India', 'Japan', 'China', 'Brazil', 'Mexico', 'Spain',
    'Italy', 'Netherlands', 'Sweden', 'Norway', 'South Korea', 'Singapore'
  ]

  useEffect(() => {
    fetchCommunityMessages()
  }, [selectedCountry])

  const fetchCommunityMessages = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0a52de3b/community/${encodeURIComponent(selectedCountry)}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching community messages:', error)
      toast.error('Failed to load community messages')
    } finally {
      setLoading(false)
    }
  }

  const handlePostMessage = async () => {
    if (!user) {
      toast.error('Please sign in to post messages')
      return
    }

    if (isGuest) {
      toast.error('Please create an account to post messages')
      return
    }

    if (!newMessage.trim()) {
      toast.error('Please enter a message')
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0a52de3b/community/${encodeURIComponent(selectedCountry)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            content: newMessage
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 429) {
          setCanPost(false)
          toast.error('You can only post once per week in the community')
        } else {
          throw new Error(error.error || 'Failed to post message')
        }
        return
      }

      toast.success('Message posted successfully!')
      setNewMessage('')
      setCanPost(false)
      fetchCommunityMessages()
    } catch (error: any) {
      console.error('Error posting message:', error)
      toast.error(error.message || 'Failed to post message')
    }
  }

  const sampleTopics = [
    {
      id: 1,
      title: "New AI breakthrough in quantum computing",
      category: "Technology",
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      title: "Climate change impact on education systems",
      category: "Environment",
      timestamp: "5 hours ago"
    },
    {
      id: 3,
      title: "Latest developments in space exploration",
      category: "Science",
      timestamp: "1 day ago"
    },
    {
      id: 4,
      title: "Educational policy changes and reforms",
      category: "Education",
      timestamp: "2 days ago"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold flex items-center justify-center space-x-2">
          <Globe className="w-6 h-6" />
          <span>Global Community</span>
        </h1>
        <p className="text-gray-600 mt-2">
          Stay updated with important topics and discussions from around the world
        </p>
      </div>

      {/* Country Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Select Country</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Choose a country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map(country => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Post Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Share Important Updates</span>
          </CardTitle>
          <div className="flex items-center space-x-2 text-sm text-orange-600">
            <AlertCircle className="w-4 h-4" />
            <span>You can post once per week</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Share important news, educational updates, or topics relevant to your country..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={4}
              disabled={!user || isGuest || !canPost}
            />
            
            <Button 
              onClick={handlePostMessage}
              disabled={!user || isGuest || !canPost || !newMessage.trim()}
              className="w-full md:w-auto"
            >
              {!user ? 'Sign in to post' : 
               isGuest ? 'Account required' :
               !canPost ? 'Posted this week' :
               'Post Update'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Community Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Community Updates - {selectedCountry}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                No community updates yet for {selectedCountry}
              </p>
              <p className="text-sm text-gray-400">
                Be the first to share important news or topics!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="border-l-4 border-indigo-500 pl-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{message.userName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{message.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Topics (Sample) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Trending Educational Topics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sampleTopics.map((topic) => (
              <div key={topic.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{topic.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {topic.category}
                    </Badge>
                    <span className="text-xs text-gray-500">{topic.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Note:</strong> These are sample trending topics. In a full implementation, 
              these would be dynamically generated based on community activity and current events.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}