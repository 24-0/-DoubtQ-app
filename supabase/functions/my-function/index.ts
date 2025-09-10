// Deno compatible imports for Supabase Edge Functions
import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Context, Next } from "https://deno.land/x/hono@v4.3.11/mod.ts";

// Custom CORS middleware
const cors = async (c: Context, next: Next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', '*');
  if (c.req.method === 'OPTIONS') {
    return c.text('OK', 204);
  }
  await next();
};

// Custom logger middleware
const logger = async (c: Context, next: Next) => {
  console.log(`${c.req.method} ${c.req.path}`);
  await next();
};
// Environment variables are automatically available in Supabase Edge Functions
// No need to import dotenv

// Environment variables are automatically available in Supabase Edge Functions
console.log('Environment variables:')
console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL') ? 'Found' : 'Missing')
console.log('SUPABASE_SERVICE_ROLE_KEY:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Found' : 'Missing')

// Database helper functions for Supabase Postgres

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

// Database row interfaces
interface QuestionRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  subject: string;
  answer_limit: number;
  answers: Answer[];
  saved_by: string[];
  created_at: string;
  users?: { name: string };
}

interface GroupRow {
  id: string;
  name: string;
  description: string;
  subject: string;
  owner_id: string;
  members: string[];
  messages: GroupMessage[];
  files: GroupFile[];
  created_at: string;
}

interface CommunityMessageRow {
  id: string;
  user_id: string;
  country: string;
  content: string;
  created_at: string;
  users?: { name: string };
}

// Type guard functions
function _isQuestion(obj: unknown): obj is Question {
  return typeof obj === 'object' && obj !== null &&
         'id' in obj && 'userId' in obj && 'title' in obj &&
         'content' in obj && 'tags' in obj && 'subject' in obj &&
         'answerLimit' in obj && 'answers' in obj && 'savedBy' in obj &&
         'createdAt' in obj;
}

function _isCommunityMessageArray(obj: unknown): obj is CommunityMessage[] {
  return Array.isArray(obj) && obj.every(_isCommunityMessage);
}

function _isCommunityMessage(obj: unknown): obj is CommunityMessage {
  return typeof obj === 'object' && obj !== null &&
         'id' in obj && 'userId' in obj && 'userName' in obj &&
         'content' in obj && 'createdAt' in obj;
}

function _isUserProfile(obj: unknown): obj is UserProfile {
  return typeof obj === 'object' && obj !== null &&
         'id' in obj && 'email' in obj && 'name' in obj &&
         'points' in obj && 'questionsAsked' in obj &&
         'questionsAnswered' in obj && 'createdAt' in obj;
}

function _isGroup(obj: unknown): obj is Group {
  return typeof obj === 'object' && obj !== null &&
         'id' in obj && 'name' in obj && 'description' in obj &&
         'subject' in obj && 'ownerId' in obj && 'members' in obj &&
         'messages' in obj && 'files' in obj && 'createdAt' in obj;
}

// Generate UUID function (Deno has crypto.randomUUID)
function randomUUID(): string {
  return crypto.randomUUID();
}

const app = new Hono()

app.use('*', cors)

app.use('*', logger)

console.log('Creating Supabase client...')

// Store values in variables first
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

console.log('URL length:', supabaseUrl?.length || 0)
console.log('Key length:', supabaseKey?.length || 0)

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

  // Get user profile from database
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !userProfile) return null

  return userProfile as UserProfile
}

// User registration
app.post('/make-server-0a52de3b/signup', async (c: Context) => {
  try {
    const { email, password, name }: SignupRequest = await c.req.json()

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true
    })

    if (error) {
      console.log('Signup error:', error)
      return c.json({ error: error.message }, 400)
    }

    // Initialize user profile in database
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email,
        name,
        points: 0,
        questions_asked: 0,
        questions_answered: 0
      })

    if (profileError) {
      console.log('Profile creation error:', profileError)
      return c.json({ error: 'Failed to create user profile' }, 500)
    }

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
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !user) {
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

    // Insert question into database
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        id: questionId,
        user_id: user.id,
        title,
        content,
        tags: tags || [],
        subject,
        answer_limit: answerLimit,
        answers: [],
        saved_by: []
      })
      .select()
      .single()

    if (questionError) {
      console.log('Question creation error:', questionError)
      return c.json({ error: 'Failed to create question' }, 500)
    }

    // Update user stats
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        questions_asked: (user.questionsAsked || 0) + 1
      })
      .eq('id', user.id)

    if (updateError) {
      console.log('User stats update error:', updateError)
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

    let query = supabase
      .from('questions')
      .select(`
        *,
        users!questions_user_id_fkey (
          name
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (subject) {
      query = query.eq('subject', subject)
    }

    if (tags) {
      const tagArray: string[] = tags.split(',')
      query = query.overlaps('tags', tagArray)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const { data: questions, error } = await query

    if (error) {
      console.log('Get questions error:', error)
      return c.json({ error: 'Failed to get questions' }, 500)
    }

    // Format questions with user names
    const questionsWithUsers = questions?.map((question: QuestionRow) => ({
      id: question.id,
      userId: question.user_id,
      title: question.title,
      content: question.content,
      tags: question.tags,
      subject: question.subject,
      answerLimit: question.answer_limit,
      answers: question.answers || [],
      savedBy: question.saved_by || [],
      createdAt: question.created_at,
      userName: question.users?.name || 'Anonymous'
    })) || []

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

    // Get question from database
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return c.json({ error: 'Question not found' }, 404)
    }

    // Check answer limit
    const currentAnswers = question.answers || []
    if (currentAnswers.length >= question.answer_limit) {
      return c.json({ error: 'Answer limit reached' }, 400)
    }

    const answerId = randomUUID()
    const newAnswer: Answer = {
      id: answerId,
      userId: user.id,
      content,
      createdAt: new Date().toISOString()
    }

    // Add answer to question
    const updatedAnswers = [...currentAnswers, newAnswer]
    const { error: updateError } = await supabase
      .from('questions')
      .update({ answers: updatedAnswers })
      .eq('id', questionId)

    if (updateError) {
      console.log('Update question error:', updateError)
      return c.json({ error: 'Failed to add answer' }, 500)
    }

    // Award points to answerer
    const { error: pointsError } = await supabase
      .from('profiles')
      .update({
        points: (user.points || 0) + 10,
        questions_answered: (user.questionsAnswered || 0) + 1
      })
      .eq('id', user.id)

    if (pointsError) {
      console.log('Update user points error:', pointsError)
    }

    return c.json({ answer: newAnswer })
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

    // Get question from database
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return c.json({ error: 'Question not found' }, 404)
    }

    // Check if user is the question owner
    if (question.user_id !== user.id) {
      return c.json({ error: 'Only question owner can remove answers' }, 403)
    }

    // Remove the answer from the answers array
    const currentAnswers = question.answers || []
    const updatedAnswers = currentAnswers.filter((answer: Answer) => answer.id !== answerId)

    // Update question in database
    const { error: updateError } = await supabase
      .from('questions')
      .update({ answers: updatedAnswers })
      .eq('id', questionId)

    if (updateError) {
      console.log('Update question error:', updateError)
      return c.json({ error: 'Failed to remove answer' }, 500)
    }

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

    // Get question from database
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return c.json({ error: 'Question not found' }, 404)
    }

    const savedBy: string[] = question.saved_by || []
    const alreadySaved = savedBy.includes(user.id)

    let updatedSavedBy: string[]
    if (alreadySaved) {
      updatedSavedBy = savedBy.filter((id: string) => id !== user.id)
    } else {
      updatedSavedBy = [...savedBy, user.id]
    }

    // Update question in database
    const { error: updateError } = await supabase
      .from('questions')
      .update({ saved_by: updatedSavedBy })
      .eq('id', questionId)

    if (updateError) {
      console.log('Update question error:', updateError)
      return c.json({ error: 'Failed to save question' }, 500)
    }

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

    // Get the target question from database
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return c.json({ error: 'Question not found' }, 404)
    }

    // Get similar questions from database
    const { data: similarQuestions, error: similarError } = await supabase
      .from('questions')
      .select(`
        *,
        users!questions_user_id_fkey (
          name
        )
      `)
      .neq('id', questionId)
      .or(`subject.eq.${question.subject},tags.overlaps.${JSON.stringify(question.tags || [])}`)
      .order('created_at', { ascending: false })
      .limit(10)

    if (similarError) {
      console.log('Get similar questions error:', similarError)
      return c.json({ error: 'Failed to get similar questions' }, 500)
    }

    // Format questions with user names
    const formattedQuestions = similarQuestions?.map((q: QuestionRow) => ({
      id: q.id,
      userId: q.user_id,
      title: q.title,
      content: q.content,
      tags: q.tags,
      subject: q.subject,
      answerLimit: q.answer_limit,
      answers: q.answers || [],
      savedBy: q.saved_by || [],
      createdAt: q.created_at,
      userName: q.users?.name || 'Anonymous'
    })) || []

    return c.json({ questions: formattedQuestions })
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

    // Insert group into database
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        id: groupId,
        name,
        description,
        subject,
        owner_id: user.id,
        members: [user.id],
        messages: [],
        files: []
      })
      .select()
      .single()

    if (groupError) {
      console.log('Create group error:', groupError)
      return c.json({ error: 'Failed to create group' }, 500)
    }

    // Format response to match expected structure
    const formattedGroup: Group = {
      id: group.id,
      name: group.name,
      description: group.description,
      subject: group.subject,
      ownerId: group.owner_id,
      members: group.members,
      messages: group.messages || [],
      files: group.files || [],
      createdAt: group.created_at
    }

    return c.json({ group: formattedGroup })
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

    // Get groups where user is a member
    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .contains('members', [user.id])

    if (error) {
      console.log('Get groups error:', error)
      return c.json({ error: 'Failed to get groups' }, 500)
    }

    // Format groups to match expected structure
    const formattedGroups: Group[] = groups?.map((group: GroupRow) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      subject: group.subject,
      ownerId: group.owner_id,
      members: group.members,
      messages: group.messages || [],
      files: group.files || [],
      createdAt: group.created_at
    })) || []

    return c.json({ groups: formattedGroups })
  } catch (error) {
    console.log('Get groups error:', error)
    return c.json({ error: 'Failed to get groups' }, 500)
  }
})

// Get global community messages
app.get('/make-server-0a52de3b/community/:country', async (c: Context) => {
  try {
    const country: string = c.req.param('country')

    // Get community messages from database
    const { data: messages, error } = await supabase
      .from('community_messages')
      .select(`
        *,
        users!community_messages_user_id_fkey (
          name
        )
      `)
      .eq('country', country)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.log('Get community messages error:', error)
      return c.json({ error: 'Failed to get community messages' }, 500)
    }

    // Format messages with user names
    const formattedMessages: CommunityMessage[] = messages?.map((msg: CommunityMessageRow) => ({
      id: msg.id,
      userId: msg.user_id,
      userName: msg.users?.name || 'Anonymous',
      content: msg.content,
      createdAt: msg.created_at
    })) || []

    return c.json({ messages: formattedMessages })
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

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Check if user has posted in the last week
    const { data: lastPost } = await supabase
      .from('user_community_posts')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('country', country)
      .gte('created_at', oneWeekAgo.toISOString())
      .single()

    if (lastPost) {
      return c.json({ error: 'You can only post once per week' }, 429)
    }

    const messageId = randomUUID()

    // Insert new community message
    const { data: message, error: messageError } = await supabase
      .from('community_messages')
      .insert({
        id: messageId,
        user_id: user.id,
        country,
        content
      })
      .select(`
        *,
        users!community_messages_user_id_fkey (
          name
        )
      `)
      .single()

    if (messageError) {
      console.log('Post community message error:', messageError)
      return c.json({ error: 'Failed to post community message' }, 500)
    }

    // Record user's post timestamp
    const { error: postRecordError } = await supabase
      .from('user_community_posts')
      .insert({
        user_id: user.id,
        country,
        created_at: now.toISOString()
      })

    if (postRecordError) {
      console.log('Post record error:', postRecordError)
      // Don't fail the request if this fails, just log it
    }

    // Clean up old messages (keep only last 100)
    const { data: allMessages } = await supabase
      .from('community_messages')
      .select('id')
      .eq('country', country)
      .order('created_at', { ascending: false })

    if (allMessages && allMessages.length > 100) {
      const messagesToDelete = allMessages.slice(100).map(msg => msg.id)
      await supabase
        .from('community_messages')
        .delete()
        .in('id', messagesToDelete)
    }

    // Format response message
    const formattedMessage: CommunityMessage = {
      id: message.id,
      userId: message.user_id,
      userName: message.users?.name || 'Anonymous',
      content: message.content,
      createdAt: message.created_at
    }

    return c.json({ message: formattedMessage })
  } catch (error) {
    console.log('Post community message error:', error)
    return c.json({ error: 'Failed to post community message' }, 500)
  }
})

// Root route
app.get('/', (c: Context) => {
  return c.json({ message: 'Doubt Posting App API is running!' })
})

// Additional route for local development
app.get('/my-function', (c: Context) => {
  console.log('Handling /my-function route')
  return c.json({ message: 'Doubt Posting App API is running!' })
})

export default app;