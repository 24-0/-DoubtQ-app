import React from 'react'
import { Search, PlusCircle, BookOpen, Users, Globe, User, LogOut, Award } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'

interface NavbarProps {
  user: any
  userProfile: any
  isGuest: boolean
  currentView: string
  setCurrentView: (view: string) => void
  onAuthClick: () => void
  onSignOut: () => void
}

export function Navbar({ 
  user, 
  userProfile, 
  isGuest, 
  currentView, 
  setCurrentView, 
  onAuthClick, 
  onSignOut 
}: NavbarProps) {
  const navItems = [
    { id: 'feed', label: 'Feed', icon: BookOpen },
    { id: 'post', label: 'Post', icon: PlusCircle },
    { id: 'study', label: 'Study', icon: BookOpen },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'community', label: 'Community', icon: Globe },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              StudyQ
            </div>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView(item.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              )
            })}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {userProfile && (
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-yellow-500" />
                <Badge variant="secondary">{userProfile.points || 0} pts</Badge>
              </div>
            )}
            
            {user || isGuest ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView('profile')}
                  className="flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>{isGuest ? 'Guest' : userProfile?.name || 'Profile'}</span>
                </Button>
                {!isGuest && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              <Button onClick={onAuthClick} size="sm">
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-gray-100">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={currentView === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentView(item.id)}
                className="flex flex-col items-center space-y-1 p-2"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{item.label}</span>
              </Button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}