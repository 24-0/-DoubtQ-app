import React, { useState, useEffect } from 'react'
import { Book, Clock, Target, TrendingUp, Calendar, Award, Play, Pause, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner@2.0.3'

interface StudyTableProps {
  user: any
  session: any
  isGuest: boolean
}

export function StudyTable({ user, session, isGuest }: StudyTableProps) {
  const [activeSession, setActiveSession] = useState(null)
  const [studySessions, setStudySessions] = useState([])
  const [goals, setGoals] = useState([])
  const [newGoal, setNewGoal] = useState('')
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [currentSubject, setCurrentSubject] = useState('')

  // Timer effect
  useEffect(() => {
    let interval = null
    if (isRunning && activeSession) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1)
      }, 1000)
    } else if (!isRunning) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isRunning, activeSession])

  // Load study data from localStorage (since we're focusing on frontend for study table)
  useEffect(() => {
    const savedSessions = localStorage.getItem('studySessions')
    const savedGoals = localStorage.getItem('studyGoals')
    
    if (savedSessions) {
      setStudySessions(JSON.parse(savedSessions))
    }
    
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals))
    }
  }, [])

  const saveToLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data))
  }

  const startStudySession = () => {
    if (!currentSubject.trim()) {
      toast.error('Please enter a subject to study')
      return
    }

    const session = {
      id: Date.now(),
      subject: currentSubject,
      startTime: new Date().toISOString(),
      duration: 0,
      status: 'active'
    }

    setActiveSession(session)
    setIsRunning(true)
    setTimer(0)
    toast.success(`Started studying ${currentSubject}`)
  }

  const pauseSession = () => {
    setIsRunning(!isRunning)
    toast.info(isRunning ? 'Session paused' : 'Session resumed')
  }

  const endSession = () => {
    if (!activeSession) return

    const completedSession = {
      ...activeSession,
      endTime: new Date().toISOString(),
      duration: timer,
      status: 'completed'
    }

    const updatedSessions = [completedSession, ...studySessions]
    setStudySessions(updatedSessions)
    saveToLocalStorage('studySessions', updatedSessions)

    setActiveSession(null)
    setIsRunning(false)
    setTimer(0)
    setCurrentSubject('')

    toast.success(`Study session completed! You studied for ${formatTime(timer)}`)
  }

  const addGoal = () => {
    if (!newGoal.trim()) return

    const goal = {
      id: Date.now(),
      text: newGoal,
      completed: false,
      createdAt: new Date().toISOString()
    }

    const updatedGoals = [...goals, goal]
    setGoals(updatedGoals)
    saveToLocalStorage('studyGoals', updatedGoals)
    setNewGoal('')
    toast.success('Goal added!')
  }

  const toggleGoal = (goalId) => {
    const updatedGoals = goals.map(goal =>
      goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
    )
    setGoals(updatedGoals)
    saveToLocalStorage('studyGoals', updatedGoals)
  }

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`
    } else if (mins > 0) {
      return `${mins}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const getTotalStudyTime = () => {
    return studySessions.reduce((total, session) => total + session.duration, 0)
  }

  const getStreakDays = () => {
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    
    const todaySessions = studySessions.filter(session => 
      new Date(session.startTime).toDateString() === today
    )
    
    const yesterdaySessions = studySessions.filter(session => 
      new Date(session.startTime).toDateString() === yesterday
    )

    if (todaySessions.length > 0) return 1
    if (yesterdaySessions.length > 0) return 1
    return 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Your Personal Study Table
        </h1>
        <p className="text-gray-600 mt-2">
          Track your progress, set goals, and build consistent study habits
        </p>
      </div>

      {/* Study Timer */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Study Timer</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!activeSession ? (
            <div className="space-y-4">
              <Input
                placeholder="What are you studying?"
                value={currentSubject}
                onChange={(e) => setCurrentSubject(e.target.value)}
              />
              <Button onClick={startStudySession} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Start Study Session
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-4xl font-mono font-bold text-indigo-600">
                {formatTime(timer)}
              </div>
              <div className="text-lg text-gray-700">
                Studying: <span className="font-semibold">{activeSession.subject}</span>
              </div>
              <div className="flex justify-center space-x-4">
                <Button onClick={pauseSession} variant="outline">
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button onClick={endSession} variant="destructive">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  End Session
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Study Time</p>
                <p className="text-xl font-bold">{formatTime(getTotalStudyTime())}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Study Streak</p>
                <p className="text-xl font-bold">{getStreakDays()} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Sessions Today</p>
                <p className="text-xl font-bold">
                  {studySessions.filter(session => 
                    new Date(session.startTime).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Study Goals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Add a new study goal..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addGoal()
                  }
                }}
              />
              <Button onClick={addGoal}>Add Goal</Button>
            </div>

            <div className="space-y-2">
              {goals.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No goals set yet. Add your first study goal above!
                </p>
              ) : (
                goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      goal.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={goal.completed}
                      onChange={() => toggleGoal(goal.id)}
                      className="w-4 h-4"
                    />
                    <span 
                      className={goal.completed ? 'line-through text-gray-500' : 'text-gray-800'}
                    >
                      {goal.text}
                    </span>
                    {goal.completed && (
                      <Badge variant="secondary" className="ml-auto">
                        Completed
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Book className="w-5 h-5" />
            <span>Recent Study Sessions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studySessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No study sessions yet. Start your first session above!
            </p>
          ) : (
            <div className="space-y-3">
              {studySessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{session.subject}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(session.startTime).toLocaleDateString()} at{' '}
                      {new Date(session.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-indigo-600">
                      {formatTime(session.duration)}
                    </p>
                    <Badge variant="outline">Completed</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}