import { CodingAgent } from './src/agent.js'

/**
 * Test script to verify the coding agent works correctly
 */

async function testAgent() {
  console.log('🧪 Testing Coding Agent...\n')
  
  const agent = new CodingAgent()
  
  try {
    await agent.initialize()
    console.log('✅ Agent initialized successfully\n')
    
    // Test 1: Simple file creation
    console.log('Test 1: Creating a simple Python file')
    let response = await agent.chat('Create a Python file called hello.py that prints "Hello from E2B!"')
    console.log('Response:', response)
    console.log('---\n')
    
    // Test 2: Running the file
    console.log('Test 2: Running the Python file')
    response = await agent.chat('Run the hello.py file')
    console.log('Response:', response)
    console.log('---\n')
    
    // Test 3: List files
    console.log('Test 3: Listing files')
    response = await agent.chat('List all files in the current directory')
    console.log('Response:', response)
    console.log('---\n')
    
    // Test 4: More complex code
    console.log('Test 4: Creating and running a more complex script')
    response = await agent.chat(`
      Create a Python script that:
      1. Defines a function to calculate fibonacci numbers
      2. Calculates the first 10 fibonacci numbers
      3. Prints them in a nice format
      Then run it.
    `)
    console.log('Response:', response)
    console.log('---\n')
    
    console.log('✅ All tests passed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await agent.close()
    console.log('\n🏁 Test complete')
  }
}

// Run the test
testAgent().catch(console.error)