import React, { useState, useEffect } from 'react'
import { Search, Bookmark, Link, MessageCircle, Award, Trash2, Bot } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader } from './ui/card'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface QuestionFeedProps {
  user: any
  session: any
  isGuest: boolean
}

export function QuestionFeed({ user, session, isGuest }: QuestionFeedProps) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedTags, setSelectedTags] = useState('')
  const [answerContent, setAnswerContent] = useState({})
  const [submittingAnswer, setSubmittingAnswer] = useState(null)
  const [similarQuestions, setSimilarQuestions] = useState({})

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'History', 'Geography', 'Literature', 'Economics', 'Philosophy'
  ]

  useEffect(() => {
    fetchQuestions()
  }, [selectedSubject, selectedTags, searchQuery])

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedSubject && selectedSubject !== 'all') params.append('subject', selectedSubject)
      if (selectedTags) params.append('tags', selectedTags)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0a52de3b/questions?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast.error('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSubmit = async (questionId) => {
    if (!user && !isGuest) {
      toast.error('Please sign in to answer questions')
      return
    }

    if (!answerContent[questionId]?.trim()) {
      toast.error('Please enter an answer')
      return
    }

    if (isGuest) {
      toast.error('Please sign in to submit answers')
      return
    }

    setSubmittingAnswer(questionId)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0a52de3b/questions/${questionId}/answers`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            content: answerContent[questionId]
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit answer')
      }

      toast.success('Answer submitted successfully! You earned 10 points!')
      setAnswerContent(prev => ({ ...prev, [questionId]: '' }))
      fetchQuestions() // Refresh to show new answer
    } catch (error: any) {
      console.error('Error submitting answer:', error)
      toast.error(error.message || 'Failed to submit answer')
    } finally {
      setSubmittingAnswer(null)
    }
  }

  const handleSaveQuestion = async (questionId) => {
    if (!user) {
      toast.error('Please sign in to save questions')
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0a52de3b/questions/${questionId}/save`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        toast.success(data.saved ? 'Question saved!' : 'Question unsaved!')
        fetchQuestions()
      }
    } catch (error) {
      console.error('Error saving question:', error)
      toast.error('Failed to save question')
    }
  }

  const handleViewSimilar = async (questionId) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0a52de3b/questions/${questionId}/similar`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSimilarQuestions(prev => ({ ...prev, [questionId]: data.questions }))
        toast.success(`Found ${data.questions.length} similar questions`)
      }
    } catch (error) {
      console.error('Error fetching similar questions:', error)
      toast.error('Failed to load similar questions')
    }
  }

  const handleRemoveAnswer = async (questionId, answerId) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0a52de3b/questions/${questionId}/answers/${answerId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      )

      if (response.ok) {
        toast.success('Answer removed')
        fetchQuestions()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove answer')
      }
    } catch (error: any) {
      console.error('Error removing answer:', error)
      toast.error(error.message || 'Failed to remove answer')
    }
  }

  const handleAIAnswer = (questionId) => {
    toast.info('AI Answer feature coming soon! This will provide intelligent responses to help with your studies.')
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

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Tags (comma separated)"
              value={selectedTags}
              onChange={(e) => setSelectedTags(e.target.value)}
              className="w-full md:w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions Feed */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No questions found. Be the first to ask!</p>
            </CardContent>
          </Card>
        ) : (
          questions.map((question) => (
            <Card key={question.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{question.title}</h3>
                    <p className="text-gray-600 mb-3">{question.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>by {question.userName}</span>
                      <Badge variant="outline">{question.subject}</Badge>
                      <span>{question.answers?.length || 0}/{question.answerLimit} answers</span>
                    </div>
                  </div>
                </div>
                
                {question.tags && question.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {question.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                {/* Existing Answers */}
                {question.answers && question.answers.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <h4 className="font-medium">Answers:</h4>
                    {question.answers.map((answer) => (
                      <div key={answer.id} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-700 mb-2">{answer.content}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Answered on {new Date(answer.createdAt).toLocaleDateString()}</span>
                          {user && question.userId === user.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveAnswer(question.id, answer.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Answer Input */}
                {(!question.answers || question.answers.length < question.answerLimit) && (
                  <div className="space-y-3 mb-4">
                    <Textarea
                      placeholder="Write your answer..."
                      value={answerContent[question.id] || ''}
                      onChange={(e) => setAnswerContent(prev => ({ 
                        ...prev, 
                        [question.id]: e.target.value 
                      }))}
                      className="w-full"
                    />
                    <Button
                      onClick={() => handleAnswerSubmit(question.id)}
                      disabled={submittingAnswer === question.id}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>
                        {submittingAnswer === question.id ? 'Submitting...' : 'Submit Answer'}
                      </span>
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span>+10 pts</span>
                    </Button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveQuestion(question.id)}
                    className="flex items-center space-x-2"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>Save</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewSimilar(question.id)}
                    className="flex items-center space-x-2"
                  >
                    <Link className="w-4 h-4" />
                    <span>Similar</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIAnswer(question.id)}
                    className="flex items-center space-x-2"
                  >
                    <Bot className="w-4 h-4" />
                    <span>AI Answer</span>
                  </Button>
                </div>

                {/* Similar Questions */}
                {similarQuestions[question.id] && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium mb-2">Similar Questions:</h5>
                    <div className="space-y-2">
                      {similarQuestions[question.id].slice(0, 3).map((similar) => (
                        <div key={similar.id} className="text-sm">
                          <p className="text-gray-700">{similar.title}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {similar.subject}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}