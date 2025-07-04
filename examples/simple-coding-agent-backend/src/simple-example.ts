import { CodeInterpreter } from '@e2b/code-interpreter'
import Anthropic from '@anthropic-ai/sdk'

// Simple example showing how to create a coding agent with E2B

async function runCodingAgent() {
  // Initialize clients
  const anthropic = new Anthropic()
  const sandbox = await CodeInterpreter.create()
  
  try {
    // Define a simple tool for file operations
    const tools: Anthropic.Tool[] = [
      {
        name: 'write_and_run_code',
        description: 'Write a Python file and execute it',
        input_schema: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            code: { type: 'string' },
          },
          required: ['filename', 'code'],
        },
      },
    ]
    
    // Ask Claude to create and run a simple Python script
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: 'Create a Python script that generates the first 10 Fibonacci numbers and run it.',
        },
      ],
      tools,
    })
    
    // Process Claude's response
    for (const content of response.content) {
      if (content.type === 'text') {
        console.log('Claude:', content.text)
      } else if (content.type === 'tool_use' && content.name === 'write_and_run_code') {
        const { filename, code } = content.input as any
        
        // Write the file in the sandbox
        await sandbox.filesystem.write(filename, code)
        console.log(`Created file: ${filename}`)
        
        // Execute the code
        const result = await sandbox.notebook.execCell(code)
        console.log('Output:', result.logs?.stdout?.join('\n'))
      }
    }
  } finally {
    await sandbox.close()
  }
}

// Run the example
runCodingAgent().catch(console.error)