import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { projectId } from '../utils/supabase/info'

interface PostQuestionProps {
  user: any
  session: any
  onSuccess: () => void
}

export function PostQuestion({ user, session, onSuccess }: PostQuestionProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject: '',
    answerLimit: 3
  })
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'History', 'Geography', 'Literature', 'Economics', 'Philosophy',
    'Psychology', 'Sociology', 'Art', 'Music', 'Engineering', 'Medicine'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubjectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      subject: value
    }))
  }

  const handleAnswerLimitChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      answerLimit: parseInt(value)
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags(prev => [...prev, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.subject) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0a52de3b/questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            ...formData,
            tags
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to post question')
      }

      toast.success('Question posted successfully!')
      onSuccess()
    } catch (error) {
      console.error('Error posting question:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to post question')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Ask a Question</CardTitle>
        <p className="text-gray-600">
          Share your doubt and get help from the community
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Question Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="What's your question?"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Question Details *</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Provide more details about your question..."
              value={formData.content}
              onChange={handleInputChange}
              rows={6}
              required
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Select value={formData.subject} onValueChange={handleSubjectChange}>
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

          {/* Answer Limit */}
          <div className="space-y-2">
            <Label>How many answers do you need?</Label>
            <Select 
              value={formData.answerLimit.toString()} 
              onValueChange={handleAnswerLimitChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 answer</SelectItem>
                <SelectItem value="2">2 answers</SelectItem>
                <SelectItem value="3">3 answers</SelectItem>
                <SelectItem value="5">5 answers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (optional)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Add a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                disabled={tags.length >= 5}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Add up to 5 tags to help others find your question
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting Question...' : 'Post Question'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}