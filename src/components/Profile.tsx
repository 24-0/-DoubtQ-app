import React, { useState } from 'react'
import { User, Award, BookOpen, MessageCircle, Settings, Edit, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { toast } from 'sonner'

interface ProfileProps {
  user: any
  userProfile: any
  onUpdateProfile: (profile: any) => void
}

export function Profile({ user, userProfile, onUpdateProfile }: ProfileProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [editedProfile, setEditedProfile] = useState({
    name: userProfile?.name || '',
    bio: userProfile?.bio || '',
    interests: userProfile?.interests || []
  })

  const achievements = [
    { 
      id: 1, 
      name: 'First Question', 
      description: 'Asked your first question',
      icon: '🎯',
      unlocked: (userProfile?.questionsAsked || 0) > 0,
      requirement: 'Ask 1 question'
    },
    { 
      id: 2, 
      name: 'Helper', 
      description: 'Answered 5 questions',
      icon: '🤝',
      unlocked: (userProfile?.questionsAnswered || 0) >= 5,
      requirement: 'Answer 5 questions'
    },
    { 
      id: 3, 
      name: 'Scholar', 
      description: 'Earned 100 points',
      icon: '📚',
      unlocked: (userProfile?.points || 0) >= 100,
      requirement: 'Earn 100 points'
    },
    { 
      id: 4, 
      name: 'Mentor', 
      description: 'Answered 20 questions',
      icon: '👨‍🏫',
      unlocked: (userProfile?.questionsAnswered || 0) >= 20,
      requirement: 'Answer 20 questions'
    },
    { 
      id: 5, 
      name: 'Point Master', 
      description: 'Earned 500 points',
      icon: '💎',
      unlocked: (userProfile?.points || 0) >= 500,
      requirement: 'Earn 500 points'
    },
    { 
      id: 6, 
      name: 'Expert', 
      description: 'Answered 50 questions',
      icon: '🏆',
      unlocked: (userProfile?.questionsAnswered || 0) >= 50,
      requirement: 'Answer 50 questions'
    }
  ]

  const redeemableRewards = [
    {
      id: 1,
      name: 'Study Guide: Mathematics',
      points: 100,
      description: 'Comprehensive mathematics study guide',
      category: 'Educational'
    },
    {
      id: 2,
      name: 'Virtual Study Session',
      points: 150,
      description: '1-hour virtual tutoring session',
      category: 'Tutoring'
    },
    {
      id: 3,
      name: 'Premium Study Tools',
      points: 200,
      description: 'Access to advanced study tools for 1 month',
      category: 'Tools'
    },
    {
      id: 4,
      name: 'Certificate of Achievement',
      points: 300,
      description: 'Personalized certificate for your dedication',
      category: 'Recognition'
    },
    {
      id: 5,
      name: 'Expert Consultation',
      points: 500,
      description: '30-minute consultation with subject expert',
      category: 'Mentoring'
    }
  ]

  const handleSaveProfile = () => {
    // In a real app, this would save to the backend
    const updatedProfile = {
      ...userProfile,
      ...editedProfile
    }
    onUpdateProfile(updatedProfile)
    setShowEditModal(false)
    toast.success('Profile updated successfully!')
  }

  const handleRedeemReward = (reward: { id: number; name: string; points: number; description: string; category: string }) => {
    if ((userProfile?.points || 0) < reward.points) {
      toast.error(`You need ${reward.points} points to redeem this reward`)
      return
    }

    toast.success(`${reward.name} redeemed! Check your email for details.`)

    // Update points (in real app, this would be done via backend)
    const updatedProfile = {
      ...userProfile,
      points: (userProfile?.points || 0) - reward.points
    }
    onUpdateProfile(updatedProfile)
  }

  const getLevel = (points: number) => {
    if (points >= 1000) return { level: 5, name: 'Expert', color: 'text-purple-600' }
    if (points >= 500) return { level: 4, name: 'Advanced', color: 'text-blue-600' }
    if (points >= 200) return { level: 3, name: 'Intermediate', color: 'text-green-600' }
    if (points >= 50) return { level: 2, name: 'Beginner', color: 'text-yellow-600' }
    return { level: 1, name: 'Novice', color: 'text-gray-600' }
  }

  const currentLevel = getLevel(userProfile?.points || 0)
  const nextLevelPoints = [50, 200, 500, 1000, 2000][currentLevel.level - 1] || 2000
  const progressToNext = currentLevel.level === 5 ? 100 : 
    ((userProfile?.points || 0) / nextLevelPoints) * 100

  if (!userProfile) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Loading profile...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{userProfile.name}</h1>
                <p className="text-gray-600">{user?.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={currentLevel.color}>
                    Level {currentLevel.level} - {currentLevel.name}
                  </Badge>
                  <Badge variant="outline">
                    {userProfile.points || 0} points
                  </Badge>
                </div>
              </div>
            </div>
            
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editedProfile.name}
                      onChange={(e) => setEditedProfile(prev => ({ 
                        ...prev, 
                        name: e.target.value 
                      }))}
                    />
                  </div>
                  <Button onClick={handleSaveProfile} className="w-full">
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Level Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progress to next level</span>
              <span className="text-sm text-gray-600">
                {userProfile.points || 0} / {nextLevelPoints}
              </span>
            </div>
            <Progress value={progressToNext} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Questions Asked</p>
                <p className="text-2xl font-bold">{userProfile.questionsAsked || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Questions Answered</p>
                <p className="text-2xl font-bold">{userProfile.questionsAnswered || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-2xl font-bold">{userProfile.points || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  achievement.unlocked
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      achievement.unlocked ? 'text-green-800' : 'text-gray-600'
                    }`}>
                      {achievement.name}
                    </h4>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    {!achievement.unlocked && (
                      <p className="text-xs text-gray-500 mt-1">
                        {achievement.requirement}
                      </p>
                    )}
                  </div>
                  {achievement.unlocked && (
                    <Badge variant="secondary" className="text-green-600">
                      Unlocked
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Redeemable Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Redeem Rewards</span>
          </CardTitle>
          <p className="text-gray-600">Use your points to unlock exclusive rewards</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {redeemableRewards.map((reward) => (
              <div key={reward.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{reward.name}</h4>
                    <p className="text-sm text-gray-600">{reward.description}</p>
                    <Badge variant="outline" className="mt-1">
                      {reward.category}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold">{reward.points} points</span>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => handleRedeemReward(reward)}
                    disabled={(userProfile?.points || 0) < reward.points}
                    variant={(userProfile?.points || 0) >= reward.points ? "default" : "outline"}
                  >
                    {(userProfile?.points || 0) >= reward.points ? 'Redeem' : 'Need more points'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}