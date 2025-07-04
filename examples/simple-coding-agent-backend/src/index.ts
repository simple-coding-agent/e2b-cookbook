import { CodeInterpreter } from '@e2b/code-interpreter'
import Anthropic from '@anthropic-ai/sdk'
import * as readline from 'readline/promises'
import { stdin as input, stdout as output } from 'process'

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Tool definitions for Claude
const tools: Anthropic.Tool[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file in the sandbox',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to the file to read',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_files',
    description: 'List files and directories at a given path',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to list files from (default: current directory)',
        },
      },
      required: [],
    },
  },
  {
    name: 'edit_file',
    description: 'Create or edit a file in the sandbox',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to the file',
        },
        content: {
          type: 'string',
          description: 'The new content for the file',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'execute_code',
    description: 'Execute Python code in the sandbox',
    input_schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The Python code to execute',
        },
      },
      required: ['code'],
    },
  },
]

// Tool execution functions
async function executeTool(
  sandbox: CodeInterpreter,
  toolName: string,
  toolInput: any
): Promise<string> {
  console.log(`\x1b[92mTool:\x1b[0m ${toolName}(${JSON.stringify(toolInput)})`)
  
  try {
    switch (toolName) {
      case 'read_file':
        const readResult = await sandbox.filesystem.read(toolInput.path)
        return readResult
        
      case 'list_files':
        const path = toolInput.path || '/'
        const files = await sandbox.filesystem.list(path)
        return JSON.stringify(files.map(f => f.name), null, 2)
        
      case 'edit_file':
        await sandbox.filesystem.write(toolInput.path, toolInput.content)
        return `Successfully wrote to ${toolInput.path}`
        
      case 'execute_code':
        const execution = await sandbox.notebook.execCell(toolInput.code)
        const output = execution.logs?.stdout?.join('\n') || ''
        const errors = execution.logs?.stderr?.join('\n') || ''
        return errors ? `Error: ${errors}` : output || 'Code executed successfully'
        
      default:
        return `Unknown tool: ${toolName}`
    }
  } catch (error) {
    return `Error: ${error.message}`
  }
}

async function main() {
  // Create readline interface
  const rl = readline.createInterface({ input, output })
  
  // Initialize E2B sandbox
  console.log('Initializing E2B sandbox...')
  const sandbox = await CodeInterpreter.create()
  console.log('Sandbox ready!')
  console.log('Chat with Claude (use Ctrl+C to quit)\n')
  
  const messages: Anthropic.MessageParam[] = []
  
  try {
    while (true) {
      // Get user input
      const userInput = await rl.question('\x1b[94mYou:\x1b[0m ')
      
      // Add user message to conversation
      messages.push({
        role: 'user',
        content: userInput,
      })
      
      // Call Claude with tools
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages,
        tools,
      })
      
      // Add assistant message to conversation
      messages.push({
        role: 'assistant',
        content: response.content,
      })
      
      // Process the response
      for (const content of response.content) {
        if (content.type === 'text') {
          console.log(`\x1b[93mClaude:\x1b[0m ${content.text}`)
        } else if (content.type === 'tool_use') {
          // Execute the tool
          const result = await executeTool(sandbox, content.name, content.input)
          
          // Add tool result to conversation
          messages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: content.id,
                content: result,
              },
            ],
          })
          
          // Get Claude's response to the tool result
          const toolResponse = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages,
            tools,
          })
          
          // Add response to conversation
          messages.push({
            role: 'assistant',
            content: toolResponse.content,
          })
          
          // Display response
          for (const toolContent of toolResponse.content) {
            if (toolContent.type === 'text') {
              console.log(`\x1b[93mClaude:\x1b[0m ${toolContent.text}`)
            }
          }
        }
      }
    }
  } catch (error) {
    if (error.message.includes('canceled')) {
      console.log('\nGoodbye!')
    } else {
      console.error('Error:', error)
    }
  } finally {
    rl.close()
    await sandbox.close()
  }
}

// Run the main function
main().catch(console.error)