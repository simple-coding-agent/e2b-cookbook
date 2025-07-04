import { CodingAgent } from './agent.js'

/**
 * Example: Using the coding agent for data analysis
 * 
 * This example shows how the agent can:
 * 1. Create a dataset
 * 2. Analyze it with pandas
 * 3. Create visualizations
 * 4. Save results
 */

async function dataAnalysisExample() {
  const agent = new CodingAgent()
  
  try {
    await agent.initialize()
    console.log('🤖 Coding Agent initialized!\n')
    
    // Step 1: Create a dataset
    console.log('📊 Creating a sales dataset...')
    let response = await agent.chat(
      `Create a Python script that generates a CSV file with mock sales data. 
      Include columns: date, product, quantity, price, region. 
      Generate 100 rows of random data for the last 30 days.`
    )
    console.log(response + '\n')
    
    // Step 2: Analyze the data
    console.log('📈 Analyzing the sales data...')
    response = await agent.chat(
      `Now create a script that reads the CSV file and performs analysis:
      1. Calculate total sales by product
      2. Find the best selling region
      3. Calculate daily sales trends
      Show the results.`
    )
    console.log(response + '\n')
    
    // Step 3: Create visualizations
    console.log('📉 Creating visualizations...')
    response = await agent.chat(
      `Create visualizations for:
      1. A bar chart showing sales by product
      2. A line chart showing daily sales trends
      3. A pie chart showing sales distribution by region
      Save the charts as PNG files.`
    )
    console.log(response + '\n')
    
    // Step 4: Generate a report
    console.log('📝 Generating summary report...')
    response = await agent.chat(
      `Create a markdown report summarizing the analysis findings. 
      Include key metrics, insights, and references to the charts.
      Save it as sales_report.md`
    )
    console.log(response + '\n')
    
    // Step 5: List all created files
    console.log('📁 Files created during analysis:')
    response = await agent.chat('List all the files we created')
    console.log(response)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await agent.close()
    console.log('\n✅ Analysis complete!')
  }
}

// Run the example
dataAnalysisExample().catch(console.error)