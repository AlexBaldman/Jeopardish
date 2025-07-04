# Creating and Using Sub-Agents for Jeopardish Development

## Overview

This guide provides detailed instructions on how to create and effectively use specialized sub-agents for the Jeopardish project using various AI tools and platforms.

## Method 1: Using Warp Terminal

Warp is an AI-powered terminal that allows you to interact with AI directly in your command line interface.

### Setting Up Sub-Agents in Warp

1. **Open Warp Terminal**
2. **Start a conversation** with the AI by typing your query or using the built-in AI features
3. **Use the specialized prompts** from the sub-agents document

### Example Workflow in Warp:

```bash
# Example 1: Architecture Review
# Type this directly in Warp's AI chat:
I want you to act as The Architect for the Jeopardish project. The current structure has all logic in a single app.js file (2888 lines). How should I refactor this into a modular architecture?

# Example 2: CSS Optimization
# After getting architecture advice, switch to CSS specialist:
I want you to act as The CSS Artisan for the Jeopardish project. I have multiple CSS files (styles.css, styles-new.css) with potential redundancy. How can I optimize and consolidate these stylesheets?
```

### Saving Warp Conversations

1. **Save important conversations** using Warp's built-in features
2. **Create snippets** for frequently used prompts
3. **Export conversations** for documentation

## Method 2: Using Claude Projects

Claude's Projects feature allows you to create persistent contexts for specific projects.

### Setting Up a Jeopardish Project in Claude:

1. **Create a New Project**:
   - Go to Claude.ai
   - Create a new project named "Jeopardish Development"

2. **Add Project Context**:
   - Upload key files (app.js, index.html, styles.css)
   - Add the architecture analysis document
   - Include the sub-agents specification document

3. **Create Custom Instructions** for each sub-agent role:

```markdown
Project: Jeopardish Development
Role: The Architect

You are The Architect for the Jeopardish project. Your responsibilities include:
- Designing and maintaining system architecture
- Making technical stack decisions
- Creating module boundaries and interfaces
- Ensuring maintainable and scalable code structure

Current project state:
- Single-page web application
- 2888-line app.js file needs refactoring
- Uses Firebase for auth and Gemini AI for host responses
- No build system currently in place

When I ask questions, respond as The Architect with focus on architecture and system design.
```

### Using Claude Projects Effectively:

1. **Switch between roles** by updating the custom instructions
2. **Reference uploaded files** directly in conversations
3. **Maintain conversation history** for context

## Method 3: VS Code AI Extensions

Several VS Code extensions can act as specialized sub-agents.

### GitHub Copilot Setup:

1. **Install GitHub Copilot** extension
2. **Configure for Jeopardish**:
   - Create `.github/copilot/prompts.md` in your project:

```markdown
# Jeopardish Project Context

This is a Jeopardy-style trivia game with AI host integration.

## Architecture Guidelines
- Modular ES6 modules
- Component-based UI structure
- Firebase for authentication
- Gemini AI for host responses

## Coding Standards
- Use async/await for asynchronous operations
- Implement error boundaries
- Follow accessibility guidelines
- Optimize for mobile devices
```

### Codeium Setup:

1. **Install Codeium** extension
2. **Create context files** for each sub-agent role:

```javascript
// .codeium/architect-context.js
/**
 * @role The Architect
 * @focus System design and architecture
 * @guidelines
 * - Prefer modular architecture
 * - Implement proper separation of concerns
 * - Use dependency injection where appropriate
 * - Design for testability
 */
```

## Method 4: Creating Custom GPTs

If you have access to ChatGPT Plus, you can create custom GPTs for each sub-agent.

### Creating a Custom GPT:

1. **Go to ChatGPT** → "Explore GPTs" → "Create a GPT"

2. **Configure the GPT**:
   - Name: "Jeopardish Architect"
   - Description: "Specialized in architecture and system design for the Jeopardish project"
   
3. **Add Instructions**:
```
You are The Architect for the Jeopardish project, a web-based Jeopardy-style trivia game.

Project Overview:
- HTML/CSS/JavaScript frontend
- Firebase authentication and storage
- Gemini AI integration for host
- Currently monolithic (2888-line app.js)

Your expertise:
- Application architecture patterns
- Module systems and dependency management
- Technical debt management
- Code organization strategies

Always provide actionable, specific advice for refactoring and improving the codebase architecture.
```

4. **Upload Knowledge Files**:
   - Architecture analysis document
   - Current codebase structure
   - Development roadmap

## Method 5: Local AI Tools

### Using Ollama with Custom Models:

1. **Install Ollama**:
```bash
# macOS
brew install ollama

# Start Ollama
ollama serve
```

2. **Create a Modelfile** for each sub-agent:

```dockerfile
# Modelfile.architect
FROM llama2

PARAMETER temperature 0.7
PARAMETER top_p 0.9

SYSTEM """
You are The Architect for the Jeopardish project. You specialize in:
- System architecture design
- Code organization
- Module boundaries
- Technical debt management

The project is a web-based trivia game using HTML/CSS/JavaScript with Firebase and AI integration.
"""
```

3. **Create the model**:
```bash
ollama create jeopardish-architect -f Modelfile.architect
```

4. **Use the model**:
```bash
ollama run jeopardish-architect "How should I refactor the 2888-line app.js file?"
```

## Method 6: AI Agent Workflows

### Creating Automated Workflows:

1. **Use n8n or Zapier** to create AI agent workflows:

```json
{
  "workflow": "Jeopardish Code Review",
  "steps": [
    {
      "agent": "The Architect",
      "action": "Review code structure",
      "output": "architecture-review.md"
    },
    {
      "agent": "The Testing Guru",
      "action": "Identify missing tests",
      "output": "test-coverage-report.md"
    },
    {
      "agent": "The Performance Optimizer",
      "action": "Analyze performance bottlenecks",
      "output": "performance-audit.md"
    }
  ]
}
```

## Best Practices for Using Sub-Agents

### 1. Context Switching

When switching between sub-agents, provide clear context:

```bash
# Good context switch
"I've just finished the architecture review with The Architect. Now I want you to act as The Frontend Wizard. Based on the new modular structure we designed, help me implement the UI components."

# Include relevant decisions from previous agent
"The Architect recommended using a component-based structure with these modules: [list modules]. As The Frontend Wizard, how should I structure the UI components?"
```

### 2. Maintaining Consistency

Create a shared knowledge base that all sub-agents can reference:

```markdown
# shared-context.md

## Project Decisions Log

### Architecture (by The Architect)
- Date: 2024-01-04
- Decision: Migrate to ES6 modules
- Rationale: Better code organization and tree-shaking

### UI Framework (by The Frontend Wizard)
- Date: 2024-01-04
- Decision: Vanilla JS with Web Components
- Rationale: Lightweight, no framework overhead

### State Management (by The State Manager)
- Date: 2024-01-04
- Decision: Custom event-driven store
- Rationale: Simple needs, avoid Redux complexity
```

### 3. Agent Collaboration

Simulate collaboration between agents:

```bash
# Step 1: Architecture Design
"As The Architect, design the module structure for multiplayer feature"

# Step 2: API Design
"As The API Integrator, based on The Architect's module structure, design the WebSocket API for real-time multiplayer"

# Step 3: Frontend Implementation
"As The Frontend Wizard, implement the UI for the multiplayer lobby using the API design from The API Integrator"
```

### 4. Documentation Integration

Each sub-agent should contribute to documentation:

```bash
# The Architect's contribution
"As The Architect, write the architecture decision record (ADR) for the modularization effort"

# The Testing Guru's contribution
"As The Testing Guru, document the testing strategy and create a testing guide"

# The Documentarian's synthesis
"As The Documentarian, combine all agent contributions into a comprehensive development guide"
```

## Measuring Sub-Agent Effectiveness

### Key Metrics:

1. **Code Quality Improvements**
   - Reduction in code complexity
   - Increase in test coverage
   - Decrease in bug reports

2. **Development Velocity**
   - Time to implement features
   - Time to fix bugs
   - Code review turnaround

3. **Knowledge Transfer**
   - Quality of documentation
   - Onboarding time for new developers
   - Consistency in code patterns

### Feedback Loop:

```markdown
# Weekly Sub-Agent Review

## What Worked Well
- The Architect's modular design reduced coupling
- The Testing Guru's test strategy caught 5 bugs
- The CSS Artisan's optimization reduced CSS by 30%

## Areas for Improvement
- Need better coordination between Frontend Wizard and CSS Artisan
- The AI Specialist needs more context about game mechanics
- Documentation lag between implementation and updates

## Action Items
- Create shared style guide for Frontend Wizard and CSS Artisan
- Schedule weekly sync between related sub-agents
- Implement documentation-as-code workflow
```

## Conclusion

The key to successful sub-agent usage is:

1. **Clear role definition** - Each agent should have a specific focus
2. **Good context management** - Maintain project knowledge across agents
3. **Effective handoffs** - Clear communication between agent roles
4. **Continuous improvement** - Refine agent prompts based on results

By following these practices, you can leverage specialized AI agents to significantly improve the development process for the Jeopardish project.
