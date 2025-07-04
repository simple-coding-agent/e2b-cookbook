import { CodeInterpreter } from '@e2b/code-interpreter'
import Anthropic from '@anthropic-ai/sdk'

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: any
  execute: (sandbox: CodeInterpreter, input: any) => Promise<string>
}

export class CodingAgent {
  private anthropic: Anthropic
  private sandbox: CodeInterpreter | null = null
  private tools: ToolDefinition[]
  private messages: Anthropic.MessageParam[] = []
  
  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({ apiKey })
    this.tools = this.defineTools()
  }
  
  private defineTools(): ToolDefinition[] {
    return [
      {
        name: 'read_file',
        description: 'Read the contents of a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to read' },
          },
          required: ['path'],
        },
        execute: async (sandbox, input) => {
          try {
            const content = await sandbox.filesystem.read(input.path)
            return content
          } catch (error) {
            return `Error reading file: ${error.message}`
          }
        },
      },
      {
        name: 'write_file',
        description: 'Write content to a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to write' },
            content: { type: 'string', description: 'Content to write' },
          },
          required: ['path', 'content'],
        },
        execute: async (sandbox, input) => {
          try {
            await sandbox.filesystem.write(input.path, input.content)
            return `Successfully wrote to ${input.path}`
          } catch (error) {
            return `Error writing file: ${error.message}`
          }
        },
      },
      {
        name: 'run_python',
        description: 'Execute Python code',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Python code to execute' },
          },
          required: ['code'],
        },
        execute: async (sandbox, input) => {
          try {
            const result = await sandbox.notebook.execCell(input.code)
            const output = result.logs?.stdout?.join('\n') || ''
            const errors = result.logs?.stderr?.join('\n') || ''
            return errors ? `Error: ${errors}` : output || 'Code executed successfully'
          } catch (error) {
            return `Error executing code: ${error.message}`
          }
        },
      },
      {
        name: 'list_files',
        description: 'List files in a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path (default: /)' },
          },
          required: [],
        },
        execute: async (sandbox, input) => {
          try {
            const path = input.path || '/'
            const files = await sandbox.filesystem.list(path)
            return JSON.stringify(files.map(f => ({
              name: f.name,
              type: f.type,
            })), null, 2)
          } catch (error) {
            return `Error listing files: ${error.message}`
          }
        },
      },
    ]
  }
  
  async initialize(): Promise<void> {
    if (!this.sandbox) {
      this.sandbox = await CodeInterpreter.create()
    }
  }
  
  async close(): Promise<void> {
    if (this.sandbox) {
      await this.sandbox.close()
      this.sandbox = null
    }
  }
  
  async chat(userMessage: string): Promise<string> {
    if (!this.sandbox) {
      await this.initialize()
    }
    
    // Add user message
    this.messages.push({ role: 'user', content: userMessage })
    
    // Convert tools to Anthropic format
    const anthropicTools: Anthropic.Tool[] = this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }))
    
    // Get Claude's response
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: this.messages,
      tools: anthropicTools,
    })
    
    // Add assistant response
    this.messages.push({ role: 'assistant', content: response.content })
    
    // Process response and execute tools if needed
    let finalResponse = ''
    
    for (const content of response.content) {
      if (content.type === 'text') {
        finalResponse += content.text
      } else if (content.type === 'tool_use') {
        // Find and execute the tool
        const tool = this.tools.find(t => t.name === content.name)
        if (tool) {
          const result = await tool.execute(this.sandbox!, content.input)
          
          // Add tool result
          this.messages.push({
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: content.id,
              content: result,
            }],
          })
          
          // Get Claude's response to the tool result
          const toolResponse = await this.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: this.messages,
            tools: anthropicTools,
          })
          
          this.messages.push({ role: 'assistant', content: toolResponse.content })
          
          // Add tool response to final response
          for (const toolContent of toolResponse.content) {
            if (toolContent.type === 'text') {
              finalResponse += '\n' + toolContent.text
            }
          }
        }
      }
    }
    
    return finalResponse
  }
  
  clearHistory(): void {
    this.messages = []
  }
}

// Example usage
async function example() {
  const agent = new CodingAgent()
  
  try {
    await agent.initialize()
    
    // Ask the agent to create and run a Python script
    const response = await agent.chat(
      'Create a Python script that calculates the factorial of 10 and run it'
    )
    console.log('Agent:', response)
    
    // Ask a follow-up question
    const followUp = await agent.chat(
      'Now modify the script to calculate factorials for numbers 1 through 5'
    )
    console.log('Agent:', followUp)
    
  } finally {
    await agent.close()
  }
}

// Uncomment to run the example
// example().catch(console.error)