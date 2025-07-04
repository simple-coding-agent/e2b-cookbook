import express from 'express'
import { CodingAgent } from './agent.js'

/**
 * Simple Express server exposing the coding agent as an API
 */

const app = express()
app.use(express.json())

// Store agent instances per session
const sessions = new Map<string, CodingAgent>()

// Middleware to get or create agent for session
async function getAgent(sessionId: string): Promise<CodingAgent> {
  if (!sessions.has(sessionId)) {
    const agent = new CodingAgent()
    await agent.initialize()
    sessions.set(sessionId, agent)
  }
  return sessions.get(sessionId)!
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'coding-agent-backend' })
})

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }
    
    const agent = await getAgent(sessionId)
    const response = await agent.chat(message)
    
    res.json({ response, sessionId })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new session
app.post('/sessions', async (req, res) => {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const agent = new CodingAgent()
  await agent.initialize()
  sessions.set(sessionId, agent)
  
  res.json({ sessionId })
})

// Clear session history
app.post('/sessions/:sessionId/clear', async (req, res) => {
  const { sessionId } = req.params
  const agent = sessions.get(sessionId)
  
  if (!agent) {
    return res.status(404).json({ error: 'Session not found' })
  }
  
  agent.clearHistory()
  res.json({ message: 'History cleared' })
})

// Delete session
app.delete('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params
  const agent = sessions.get(sessionId)
  
  if (!agent) {
    return res.status(404).json({ error: 'Session not found' })
  }
  
  await agent.close()
  sessions.delete(sessionId)
  res.json({ message: 'Session deleted' })
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...')
  
  // Close all agent sessions
  for (const [sessionId, agent] of sessions) {
    await agent.close()
  }
  
  process.exit(0)
})

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Coding agent server running on http://localhost:${PORT}`)
  console.log(`
Available endpoints:
  POST   /chat              - Send a message to the agent
  POST   /sessions          - Create a new session
  POST   /sessions/:id/clear - Clear session history
  DELETE /sessions/:id      - Delete a session
  GET    /health           - Health check
  `)
})

/**
 * Example usage with curl:
 * 
 * # Create a new session
 * curl -X POST http://localhost:3000/sessions
 * 
 * # Send a message
 * curl -X POST http://localhost:3000/chat \
 *   -H "Content-Type: application/json" \
 *   -d '{"message": "Create a hello world Python script", "sessionId": "your-session-id"}'
 * 
 * # Clear history
 * curl -X POST http://localhost:3000/sessions/your-session-id/clear
 * 
 * # Delete session
 * curl -X DELETE http://localhost:3000/sessions/your-session-id
 */