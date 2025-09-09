import React, { useState, useEffect } from 'react'
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js'
import { Navbar } from './components/Navbar'
import { QuestionFeed } from './components/QuestionFeed'
import { PostQuestion } from './components/PostQuestion'
import { StudyTable } from './components/StudyTable'
import { Groups } from './components/Groups'
import { Community } from './components/Community'
import { Profile } from './components/Profile'
import { AuthModal } from './components/AuthModal'
import { Toaster } from './components/ui/sonner'
import { getSupabaseClient } from './utils/supabase/client'
import { projectId, publicAnonKey } from './utils/supabase/info'

interface UserProfile {
  id: string
  email: string
  // Add other properties as needed
}

const supabase = getSupabaseClient()

export default function App() {
  const [currentView, setCurrentView] = useState<string>('feed')
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false)
  const [isGuest, setIsGuest] = useState<boolean>(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Handle navigation to auth-required views
  useEffect(() => {
    if (isAuthRequired(currentView) && !user && !isGuest) {
      // Auto-show auth modal when navigating to auth-required view without being authenticated
      const timer = setTimeout(() => {
        setShowAuthModal(true)
      }, 100) // Small delay to prevent immediate trigger during render
      
      return () => clearTimeout(timer)
    }
  }, [currentView, user, isGuest])

  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0a52de3b/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const handleGuestMode = () => {
    setIsGuest(true)
    setShowAuthModal(false)
  }

  const isAuthRequired = (view: string) => {
    return ['post', 'groups', 'profile'].includes(view)
  }

  const renderCurrentView = () => {
    // Check if current view requires auth but user is not authenticated
    if (isAuthRequired(currentView) && !user && !isGuest) {
      return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h2>
            {"Please sign in to access this feature"}
            <button 
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Sign In to Continue
            </button>
          </div>
        </div>
      )
    }

    if (currentView === 'all-portals') {
      return (
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Feed</h2>
            <QuestionFeed user={user} session={session} isGuest={isGuest} />
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Post Question</h2>
            <PostQuestion user={user} session={session} onSuccess={() => setCurrentView('feed')} />
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Study Table</h2>
            <StudyTable user={user} session={session} isGuest={isGuest} />
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Groups</h2>
            <Groups user={user} session={session} />
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Community</h2>
            <Community user={user} session={session} isGuest={isGuest} />
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Profile</h2>
            <Profile user={user} userProfile={userProfile} onUpdateProfile={setUserProfile} />
          </section>
        </div>
      )
    }

    switch (currentView) {
      case 'feed':
        return <QuestionFeed user={user} session={session} isGuest={isGuest} />
      case 'post':
        return <PostQuestion user={user} session={session} onSuccess={() => setCurrentView('feed')} />
      case 'study':
        return <StudyTable user={user} session={session} isGuest={isGuest} />
      case 'groups':
        return <Groups user={user} session={session} />
      case 'community':
        return <Community user={user} session={session} isGuest={isGuest} />
      case 'profile':
        return <Profile user={user} userProfile={userProfile} onUpdateProfile={setUserProfile} />
      default:
        return <QuestionFeed user={user} session={session} isGuest={isGuest} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navbar 
        user={user}
        userProfile={userProfile}
        isGuest={isGuest}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onAuthClick={() => setShowAuthModal(true)}
        onSignOut={() => {
          supabase.auth.signOut()
          setIsGuest(false)
        }}
      />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {renderCurrentView()}
      </main>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onGuestMode={handleGuestMode}
      />

      <Toaster />
    </div>
  )
}
