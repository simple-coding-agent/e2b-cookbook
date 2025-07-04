# Simple Coding Agent Backend with E2B

This example demonstrates how to build a simple coding agent backend using E2B sandboxes. The agent can read files, list directories, and edit files in a secure sandbox environment.

## Overview

This is a simplified version of a coding agent that uses E2B sandboxes to provide a secure environment for code execution. The agent communicates with Claude AI and can perform file operations within the sandbox.

## Features

- Interactive chat with Claude AI
- Secure file operations in E2B sandbox:
  - Read files
  - List directory contents
  - Edit or create files
- TypeScript implementation for easy integration

## Prerequisites

- Node.js 18+
- E2B API key
- Anthropic API key (for Claude AI)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
export E2B_API_KEY=your_e2b_api_key
export ANTHROPIC_API_KEY=your_anthropic_api_key
```

3. Run the agent:
```bash
npm start
```

## How it works

The agent creates an E2B sandbox instance where all file operations are performed. When you chat with Claude, it can use the following tools:

- `read_file`: Read the contents of a file in the sandbox
- `list_files`: List files and directories in the sandbox
- `edit_file`: Create or modify files in the sandbox

All operations are isolated within the E2B sandbox, ensuring security and preventing any unwanted changes to your local system.

## Example Usage

```
You: Can you create a Python script that calculates fibonacci numbers?
Claude: I'll create a Python script that calculates Fibonacci numbers for you.
[Creates fibonacci.py in the sandbox]

You: Can you run the script?
Claude: I'll run the fibonacci script for you.
[Executes the script in the sandbox and shows output]
```