import { serve } from '@hono/node-server'
import 'npm:dotenv/config'
// Add this debug code:
import process from "node:process";
console.log('Environment variables:')
console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'Missing')
import { Hono, Context } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
/**
 * Supabase Edge Functions do not support Node.js built-in modules like '@hono/node-server'.
 * The serve() function and server startup code should be removed for deployment to Supabase Edge Functions.
 * 
 * Instead, export the app as default and deploy as an Edge Function.
 */

import * as kv from '../my-function/index.ts'


// Define interfaces for request bodies
interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

interface SigninRequest {
  email: string;
  password: string;
}

interface PostQuestionRequest {
  title: string;
  content: string;
  tags?: string[];
  subject: string;
  answerLimit?: number;
}

interface PostAnswerRequest {
  content: string;
}

interface CreateGroupRequest {
  name: string;
  description: string;
  subject: string;
}

interface PostCommunityRequest {
  content: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  points: number;
  questionsAsked: number;
  questionsAnswered: number;
  createdAt: string;
}

interface Answer {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

interface Question {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  subject: string;
  answerLimit: number;
  answers: Answer[];
  savedBy: string[];
  createdAt: string;
}

interface GroupMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

interface GroupFile {
  id: string;
  name: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  subject: string;
  ownerId: string;
  members: string[];
  messages: GroupMessage[];
  files: GroupFile[];
  createdAt: string;
}

interface CommunityMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

// Type guard functions
function isQuestion(obj: unknown): obj is Question {
  return typeof obj === 'object' && obj !== null &&
         'id' in obj && 'userId' in obj && 'title' in obj &&
         'content' in obj && 'tags' in obj && 'subject' in obj &&
         'answerLimit' in obj && 'answers' in obj && 'savedBy' in obj &&
         'createdAt' in obj;
}

function isCommunityMessageArray(obj: unknown): obj is CommunityMessage[] {
  return Array.isArray(obj) && obj.every(isCommunityMessage);
}

function isCommunityMessage(obj: unknown): obj is CommunityMessage {
  return typeof obj === 'object' && obj !== null &&
         'id' in obj && 'userId' in obj && 'userName' in obj &&
         'content' in obj && 'createdAt' in obj;
}

function isUserProfile(obj: unknown): obj is UserProfile {
  return typeof obj === 'object' && obj !== null &&
         'id' in obj && 'email' in obj && 'name' in obj &&
         'points' in obj && 'questionsAsked' in obj &&
         'questionsAnswered' in obj && 'createdAt' in obj;
}

function isGroup(obj: unknown): obj is Group {
  return typeof obj === 'object' && obj !== null &&
         'id' in obj && 'name' in obj && 'description' in obj &&
         'subject' in obj && 'ownerId' in obj && 'members' in obj &&
         'messages' in obj && 'files' in obj && 'createdAt' in obj;
}

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))

app.use('*', logger(console.log))
console.log('Creating Supabase client with URL:', process.env.SUPABASE_URL)
console.log('Creating Supabase client with URL:', process.env.SUPABASE_URL)

// Store values in variables first
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('URL length:', supabaseUrl.length)
console.log('Key length:', supabaseKey.length)

const supabase = createClient(supabaseUrl, supabaseKey)
console.log('Supabase client created successfully!')

// Initialize storage buckets
async function initStorage() {
  const buckets = [
    'make-0a52de3b-avatars',
    'make-0a52de3b-attachments',
    'make-0a52de3b-group-files'
  ]

  for (const bucketName of buckets) {
    const { data: existingBuckets } = await supabase.storage.listBuckets()
    const bucketExists = existingBuckets?.some((bucket: { name: string }) => bucket.name === bucketName)

    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, { public: false })
    }
  }
}

initStorage().catch(console.error)

// Helper function to verify user authentication
async function verifyUser(c: Context): Promise<UserProfile | null> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return null

  const accessToken = authHeader.split(' ')[1]
  if (!accessToken) return null

  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user) return null

  // Get user profile from KV store
  const userProfile = await kv.get(`user:${user.id}`) as UserProfile | null
  return userProfile
}

// User registration
app.post('/make-server-0a52de3b/signup', async (c: Context) => {
  try {
    const { email, password, name }: SignupRequest = await c.req.json()

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    })

    if (error) {
      console.log('Signup error:', error)
      return c.json({ error: error.message }, 400)
    }

    // Initialize user profile
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      points: 0,
      questionsAsked: 0,
      questionsAnswered: 0,
      createdAt: new Date().toISOString()
    })

    return c.json({ user: data.user })
  } catch (error) {
    console.log('Signup error:', error)
    return c.json({ error: 'Failed to create user' }, 500)
  }
})

// User signin
app.post('/make-server-0a52de3b/signin', async (c: Context) => {
  try {
    const { email, password }: SigninRequest = await c.req.json()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.log('Signin error:', error)
      return c.json({ error: error.message }, 400)
    }

    return c.json({
      user: data.user,
      session: data.session,
      access_token: data.session?.access_token
    })
  } catch (error) {
    console.log('Signin error:', error)
    return c.json({ error: 'Failed to sign in' }, 500)
  }
})

// Get user profile
app.get('/make-server-0a52de3b/user/:id', async (c: Context) => {
  try {
    const userId: string = c.req.param('id')
    const user = await kv.get(`user:${userId}`)
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json({ user })
  } catch (error) {
    console.log('Get user error:', error)
    return c.json({ error: 'Failed to get user' }, 500)
  }
})

 // Post a question
app.post('/make-server-0a52de3b/questions', async (c: Context) => {
  try {
    const user = await verifyUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { title, content, tags, subject, answerLimit = 3 }: PostQuestionRequest = await c.req.json()

    const questionId = randomUUID()
    const question: Question = {
      id: questionId,
      userId: user.id,
      title,
      content,
      tags: tags || [],
      subject,
      answerLimit,
      answers: [],
      savedBy: [],
      createdAt: new Date().toISOString()
    }

    await kv.set(`question:${questionId}`, question)

    // Update user stats
    const userProfile = await kv.get(`user:${user.id}`) as UserProfile | null
    if (userProfile) {
      userProfile.questionsAsked = (userProfile.questionsAsked || 0) + 1
      await kv.set(`user:${user.id}`, userProfile)
    }

    return c.json({ question })
  } catch (error) {
    console.log('Post question error:', error)
    return c.json({ error: 'Failed to post question' }, 500)
  }
})

// Get questions feed
app.get('/make-server-0a52de3b/questions', async (c: Context) => {
  try {
    const { subject, tags, search } = c.req.query()

    const rawQuestions = await kv.getByPrefix('question:')
    console.log('Raw questions data:', JSON.stringify(rawQuestions, null, 2))
    let filteredQuestions = rawQuestions
      .filter(isQuestion) // Filter out invalid questions using type guard
      .sort((a: Question, b: Question) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

    // Apply filters
    if (subject) {
      filteredQuestions = filteredQuestions.filter((q: Question) => q.subject === subject)
    }

    if (tags) {
      const tagArray: string[] = tags.split(',')
      filteredQuestions = filteredQuestions.filter((q: Question) =>
        tagArray.some((tag: string) => q.tags?.includes(tag))
      )
    }

    if (search) {
      filteredQuestions = filteredQuestions.filter((q: Question) =>
        q.title?.toLowerCase().includes(search.toLowerCase()) ||
        q.content?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Get user info for each question
    const questionsWithUsers = await Promise.all(
      filteredQuestions.map(async (question: Question) => {
        try {
          const user = await kv.get(`user:${question.userId}`) as UserProfile | null
          return {
            ...question,
            userName: user?.name || 'Anonymous'
          }
        } catch (error) {
          console.log('Error getting user for question:', question.id, error)
          return {
            ...question,
            userName: 'Anonymous'
          }
        }
      })
    )

    console.log('Questions with user info:', JSON.stringify(questionsWithUsers, null, 2))

    return c.json({ questions: questionsWithUsers })
  } catch (error) {
    console.log('Get questions error:', error)
    return c.json({ error: 'Failed to get questions' }, 500)
  }
})

// Post an answer
app.post('/make-server-0a52de3b/questions/:id/answers', async (c: Context) => {
  try {
    const user = await verifyUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const questionId: string = c.req.param('id')
    const { content }: PostAnswerRequest = await c.req.json()

    const rawQuestion = await kv.get(`question:${questionId}`)
    if (!isQuestion(rawQuestion)) {
      return c.json({ error: 'Question not found' }, 404)
    }
    const question: Question = rawQuestion

    if (question.answers.length >= question.answerLimit) {
      return c.json({ error: 'Answer limit reached' }, 400)
    }

    const answerId = randomUUID()
    const answer: Answer = {
      id: answerId,
      userId: user.id,
      content,
      createdAt: new Date().toISOString()
    }

    question.answers.push(answer)
    await kv.set(`question:${questionId}`, question)

    // Award points to answerer
    const userProfile = await kv.get(`user:${user.id}`) as UserProfile | null
    if (userProfile) {
      userProfile.points = (userProfile.points || 0) + 10
      userProfile.questionsAnswered = (userProfile.questionsAnswered || 0) + 1
      await kv.set(`user:${user.id}`, userProfile)
    }

    return c.json({ answer })
  } catch (error) {
    console.log('Post answer error:', error)
    return c.json({ error: 'Failed to post answer' }, 500)
  }
})

 // Remove an answer (only by question owner)
app.delete('/make-server-0a52de3b/questions/:questionId/answers/:answerId', async (c: Context) => {
  try {
    const user = await verifyUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const questionId: string = c.req.param('questionId')
    const answerId: string = c.req.param('answerId')

    const rawQuestion = await kv.get(`question:${questionId}`)
    if (!isQuestion(rawQuestion)) {
      return c.json({ error: 'Question not found' }, 404)
    }
    const question: Question = rawQuestion

    if (question.userId !== user.id) {
      return c.json({ error: 'Only question owner can remove answers' }, 403)
    }

    question.answers = question.answers.filter((answer: Answer) => answer.id !== answerId)
    await kv.set(`question:${questionId}`, question)

    return c.json({ success: true })
  } catch (error) {
    console.log('Remove answer error:', error)
    return c.json({ error: 'Failed to remove answer' }, 500)
  }
})

// Save/unsave a question
app.post('/make-server-0a52de3b/questions/:id/save', async (c: Context) => {
  try {
    const user = await verifyUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const questionId: string = c.req.param('id')
    const rawQuestion = await kv.get(`question:${questionId}`)
    if (!isQuestion(rawQuestion)) {
      return c.json({ error: 'Question not found' }, 404)
    }
    const question: Question = rawQuestion

    const savedBy: string[] = question.savedBy || []
    const alreadySaved = savedBy.includes(user.id)

    if (alreadySaved) {
      question.savedBy = savedBy.filter((id: string) => id !== user.id)
    } else {
      question.savedBy = [...savedBy, user.id]
    }

    await kv.set(`question:${questionId}`, question)

    return c.json({ saved: !alreadySaved })
  } catch (error) {
    console.log('Save question error:', error)
    return c.json({ error: 'Failed to save question' }, 500)
  }
})

// Get similar questions
app.get('/make-server-0a52de3b/questions/:id/similar', async (c: Context) => {
  try {
    const questionId: string = c.req.param('id')
    const rawQuestion = await kv.get(`question:${questionId}`)
    if (!isQuestion(rawQuestion)) {
      return c.json({ error: 'Question not found' }, 404)
    }
    const question: Question = rawQuestion

    const allQuestionsRaw = await kv.getByPrefix('question:')
    const similarQuestions = allQuestionsRaw
      .filter(isQuestion)
      .filter((q: Question) =>
        q.id !== questionId &&
        (q.subject === question.subject ||
         question.tags?.some((tag: string) => q.tags?.includes(tag)))
      )
      .slice(0, 10)

    return c.json({ questions: similarQuestions })
  } catch (error) {
    console.log('Get similar questions error:', error)
    return c.json({ error: 'Failed to get similar questions' }, 500)
  }
})

// Create a group
app.post('/make-server-0a52de3b/groups', async (c: Context) => {
  try {
    const user = await verifyUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { name, description, subject }: CreateGroupRequest = await c.req.json()

    const groupId = randomUUID()
    const group: Group = {
      id: groupId,
      name,
      description,
      subject,
      ownerId: user.id,
      members: [user.id],
      messages: [],
      files: [],
      createdAt: new Date().toISOString()
    }

    await kv.set(`group:${groupId}`, group)

    return c.json({ group })
  } catch (error) {
    console.log('Create group error:', error)
    return c.json({ error: 'Failed to create group' }, 500)
  }
})

// Get user's groups
app.get('/make-server-0a52de3b/groups', async (c: Context) => {
  try {
    const user = await verifyUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const allGroupsRaw = await kv.getByPrefix('group:')
    const userGroups = allGroupsRaw
      .filter(isGroup)
      .filter((group: Group) => group.members.includes(user.id))

    return c.json({ groups: userGroups })
  } catch (error) {
    console.log('Get groups error:', error)
    return c.json({ error: 'Failed to get groups' }, 500)
  }
})

// Get global community messages
app.get('/make-server-0a52de3b/community/:country', async (c: Context) => {
  try {
    const country: string = c.req.param('country')
    const rawMessages = await kv.get(`community:${country}`)
    const messages: CommunityMessage[] = isCommunityMessageArray(rawMessages) ? rawMessages : []

    return c.json({ messages })
  } catch (error) {
    console.log('Get community messages error:', error)
    return c.json({ error: 'Failed to get community messages' }, 500)
  }
})

// Post to global community (once per week limit)
app.post('/make-server-0a52de3b/community/:country', async (c: Context) => {
  try {
    const user = await verifyUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const country: string = c.req.param('country')
    const { content }: PostCommunityRequest = await c.req.json()

    // Check if user has posted in the last week
    const rawLastPost = await kv.get(`user_community_post:${user.id}:${country}`)
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    if (rawLastPost && typeof rawLastPost === 'object' && 'createdAt' in rawLastPost && new Date(rawLastPost.createdAt as string) > oneWeekAgo) {
      return c.json({ error: 'You can only post once per week' }, 429)
    }

    const rawMessages = await kv.get(`community:${country}`)
    const messages: CommunityMessage[] = isCommunityMessageArray(rawMessages) ? rawMessages : []
    const messageId = randomUUID()

    const rawUser = await kv.get(`user:${user.id}`)
    const userName = (isUserProfile(rawUser) ? rawUser.name : 'Anonymous')

    const message: CommunityMessage = {
      id: messageId,
      userId: user.id,
      userName,
      content,
      createdAt: now.toISOString()
    }

    messages.unshift(message)

    // Keep only last 100 messages
    if (messages.length > 100) {
      messages.splice(100)
    }

    await kv.set(`community:${country}`, messages)
    await kv.set(`user_community_post:${user.id}:${country}`, { createdAt: now.toISOString() })

    return c.json({ message })
  } catch (error) {
    console.log('Post community message error:', error)
    return c.json({ error: 'Failed to post community message' }, 500)
  }
})

app.get('/', (c: Context) => {
  try {
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Doubt Posting App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
    return c.html(html)
  } catch (error) {
    console.error('Error serving frontend:', error)
    return c.text('Internal Server Error', 500)
  }
})

app.get('*', (c: Context) => {
  // Skip API routes - serve HTML for all other routes (SPA routing)
  const path = c.req.path
  if (path.startsWith('/make-server-0a52de3b/') || path.startsWith('/src/') || path.startsWith('/@')) {
    return c.text('Not Found', 404)
  }

  try {
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Doubt Posting App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
    return c.html(html)
  } catch (error) {
    console.error('Error serving frontend:', error)
    return c.text('Internal Server Error', 500)
  }
})

export default app;

// Local development server
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  const port = 3000
  console.log(`🚀 Server running at http://localhost:${port}`)
  
  serve({
    fetch: app.fetch,
    port,
  })
}
