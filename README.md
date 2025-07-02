# 🏴 BlackFlag Weekly

Generate professional weekly progress slides from your git history using OpenAI Agents and Slidev.

Transform your technical commits into compelling presentations that tell the story of your development progress.

## Features

- 📚 **Interactive Git History Selection** - Browse recent commits and pick your starting point
- 🧠 **Intelligent Code Analysis** - Advanced AI agent analyzes actual code changes, not just commit messages
- 🤖 **AI-Powered Storytelling** - Transform technical commits into engaging narratives using OpenAI Agents
- 🎨 **Professional Slides** - Generated using Slidev with customizable themes
- 🚀 **One-Command Workflow** - Automatically generates slides AND starts Slidev presentation
- 📊 **Smart Pattern Detection** - Identifies refactoring, architectural changes, and business impact from real code changes
- 🛡️ **Bulletproof Generation** - Structured output prevents broken slides with automatic fallback
- 🎯 **Multiple Presentation Styles** - Executive, technical, retrospective, and custom prompts
- ⚙️ **Flexible Customization** - Custom prompts, configuration files, and inline modifiers
- 🎭 **Audience Targeting** - Optimize presentations for executives, developers, or teams

## Installation

**Prerequisites:** Node.js 22.17.0 or higher required

```bash
# Check your Node version
node --version

# Use directly with npx (recommended)
npx blackflag_weekly

# Or install globally
npm install -g blackflag_weekly
```

## Usage

### Quick Start (Recommended)

Navigate to any git repository and run:

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=sk-your-api-key-here

# Generate slides and start presentation
npx blackflag_weekly
```

That's it! The tool will:
1. Show you recent git commits 
2. Let you select a starting point
3. Generate AI-powered narrative slides
4. **Automatically start Slidev at http://localhost:3030**

### Command Line Options

```bash
# Generate slides without starting Slidev
npx blackflag_weekly --no-auto-start

# Use raw commit messages (no AI processing)
npx blackflag_weekly --skip-ai

# Use legacy single-agent system (fallback option)
npx blackflag_weekly --legacy-agent

# Specify output directory  
npx blackflag_weekly --output ./my-slides

# Use a specific Slidev theme
npx blackflag_weekly --theme seriph

# Use presentation style presets
npx blackflag_weekly --style executive
npx blackflag_weekly --style technical --deep-dive
npx blackflag_weekly --style retrospective --team-size 5

# Use custom prompt file
npx blackflag_weekly --prompt ./my-custom-prompt.js

# Use configuration file
npx blackflag_weekly --config ./blackflag.config.js

# Mix presentation options
npx blackflag_weekly --style technical --focus technical --include-metrics
npx blackflag_weekly --style executive --audience executive --theme seriph
```

### Environment Setup

For AI-powered slide generation, set your OpenAI API key:

```bash
# Environment variable (recommended)
export OPENAI_API_KEY=sk-your-api-key-here

# Or create a .env file
echo "OPENAI_API_KEY=sk-your-api-key-here" > .env
```

## 🧠 Intelligent Code Analysis

BlackFlag Weekly uses an advanced AI agent that goes far beyond simple commit message keywords to understand what really changed in your codebase.

### **The Problem with Traditional Tools**
Most tools rely on keyword matching in commit messages:
- Looking for "refactor", "architect", "restructure" in messages
- Missing the real story when developers write simple messages like "fix auth bug"
- Cannot detect actual architectural changes from code patterns

### **Our Intelligent Solution**
Our smart AI agent analyzes the actual code changes:

```bash
# Traditional approach (keyword-based)
Commit: "fix auth bug" → Categorized as "bugfix" 
Reality: Actually restructured entire authentication system

# BlackFlag approach (intelligent analysis)
Commit: "fix auth bug" → Analyzes actual code changes
Result: "Major architectural refactoring of authentication system with security improvements"
```

### **What the AI Agent Detects**
- 🏗️ **Architectural Changes**: Analyzes file structure, module dependencies, and code organization
- 🚀 **Performance Improvements**: Identifies algorithm changes, database optimizations, and caching
- 🔒 **Security Enhancements**: Detects authentication, authorization, and validation improvements  
- 🧪 **Quality Improvements**: Recognizes test additions, code cleanup, and technical debt reduction
- 💼 **Business Impact**: Maps code changes to user-facing features and system capabilities
- 🔄 **Refactoring Patterns**: Identifies code restructuring even without explicit commit messages

### **Analysis Examples**

**File-Based Analysis:**
```
Files changed: 8 files, +634/-39 lines
- New modules in prompts/ directory → "Modular architecture implementation"
- CLI updates with new flags → "Enhanced user interface capabilities"  
- README documentation → "Comprehensive feature documentation"
Result: "Major feature release with modular prompt system"
```

**Pattern Detection:**
```
Multiple files with balanced additions/deletions → "Refactoring detected"
New authentication-related files → "Security system implementation"
Database schema changes → "Data model evolution"
```

## 🎨 Presentation Styles & Customization

BlackFlag Weekly offers multiple presentation styles optimized for different audiences and use cases.

### Built-in Presentation Styles

| Style | Description | Best For |
|-------|-------------|-----------|
| **default** | Balanced technical and narrative focus | General development updates |
| **executive** | Business impact, ROI, strategic outcomes | Stakeholder presentations |
| **technical** | Implementation details, architecture decisions | Developer reviews, technical deep dives |
| **retrospective** | Team dynamics, process improvement | Sprint retrospectives, team meetings |

### Style Examples

```bash
# Executive presentation for stakeholders
npx blackflag_weekly --style executive
# → Business language, strategic impact, timeline focus

# Technical deep dive for developers  
npx blackflag_weekly --style technical --deep-dive
# → Code examples, architecture patterns, implementation details

# Team retrospective for process improvement
npx blackflag_weekly --style retrospective --team-size 5 --highlight-challenges
# → Collaboration insights, lessons learned, action items
```

### Custom Prompt Files

Create your own presentation style by writing a custom prompt file:

```javascript
// my-custom-prompt.js
export const slideGenerationPrompt = (theme, commits, workByCategory, detailedSummary, config) => {
  return `Create a presentation focusing on security and compliance...
  
  COMMIT ANALYSIS: ${commits.length} commits analyzed
  WORK CATEGORIES: ${Object.keys(workByCategory).join(', ')}
  
  Focus on: security improvements, compliance requirements, risk mitigation...`;
};
```

```bash
# Use your custom prompt
npx blackflag_weekly --prompt ./my-custom-prompt.js
```

### Configuration Files

Set up reusable configurations for consistent presentation styles:

```javascript
// blackflag.config.js
export default {
  style: 'executive',
  theme: 'seriph',
  output: './weekly-reports',
  autoStart: false,
  promptConfig: {
    focus: 'business',
    audience: 'executive',
    includeMetrics: true
  }
};
```

```bash
# Use configuration file
npx blackflag_weekly --config ./blackflag.config.js
```

### Inline Presentation Modifiers

Fine-tune any style with inline options:

```bash
# Technical focus with metrics
npx blackflag_weekly --style technical --focus technical --include-metrics --deep-dive

# Executive presentation with business focus
npx blackflag_weekly --style executive --focus business --audience executive

# Retrospective with team insights
npx blackflag_weekly --style retrospective --team-size 8 --highlight-challenges

# Custom audience targeting
npx blackflag_weekly --audience developers --focus process
```

**Available Modifiers:**
- `--focus business|technical|process` - Primary presentation focus
- `--audience executive|developers|team|mixed` - Target audience
- `--deep-dive` - Include detailed technical analysis
- `--include-metrics` - Add detailed analytics and metrics
- `--highlight-challenges` - Emphasize problem-solving and challenges
- `--team-size <number>` - Optimize for specific team size

## Example Workflow

```bash
cd your-project
export OPENAI_API_KEY=sk-your-key-here
npx blackflag_weekly
```

**Output:**
```
🏴 BlackFlag Weekly - Generating your progress slides...

📚 Fetching recent git history...

? Select starting point (FROM THIS POINT): 
❯ [1] feat: add user authentication (2 days ago) - abc123f
  [2] fix: resolve mobile layout issues (3 days ago) - def456a  
  [3] docs: update API documentation (5 days ago) - ghi789b

✅ Found 3 commits from selected point to HEAD

🤖 Processing commits with AI Agent...

🔍 Processing 3 commits
🤖 Using intelligent analysis for advanced code understanding...
🔄 Starting smart slide generation...
🔍 Prepared 3 commits for intelligent analysis
🔍 Analyzing actual code changes beyond commit messages...
✅ Smart slide generation complete
✅ Intelligent slides: 2958 characters

📝 Slides written to: ./slides/slides.md

🚀 Starting Slidev...
✅ Slidev already initialized
🚀 Starting Slidev dev server...

🎉 Slides generated successfully!
🌐 Slidev running at: http://localhost:3030
```

Your presentation opens automatically in the browser! 🎯

## Generated Output

The tool creates compelling narrative slides that tell your development story:

### Example Generated Slides

**From simple commit messages to sophisticated analysis:**

```markdown
---
theme: default
title: "Security Architecture & User Experience: A Technical Evolution"
---

# 🏗️ Architectural Evolution in Action
## March 1-8, 2024

How three "simple" commits revealed a comprehensive system transformation

---

# 🔍 What the Intelligent Analysis Discovered

**Commit messages said:**
- "feat: add user authentication"
- "fix: resolve mobile layout issues" 
- "docs: update API documentation"

**Reality revealed by code analysis:**
- Complete security architecture implementation
- Mobile-first responsive design system
- API contract standardization with breaking changes

---

# 🚀 The Security Foundation

### Beyond basic authentication - we built enterprise-ready security
- **JWT token management** with refresh token rotation
- **Role-based access control** affecting 12 components
- **Session security** with device fingerprinting
- **Password policies** meeting OWASP standards

*Files: 8 new security modules, 1,247 lines added*

---

# 📱 Mobile Experience Revolution

### Responsive design patterns emerged from "bug fixes"
- **CSS Grid adoption** replacing legacy flexbox patterns
- **Progressive Web App** capabilities added
- **Touch gesture support** for mobile interactions
- **Performance optimization** reducing bundle size by 23%

*Files: 15 components refactored, 892 lines changed*

---

# 📋 Documentation as Code Architecture

### API documentation revealed system-wide changes
- **OpenAPI 3.0 specification** with automated validation
- **Breaking changes** to 7 API endpoints documented
- **Migration guides** for frontend integration
- **Type definitions** exported for external consumers

---
layout: center
---

# 🎯 The Strategic Impact

**Technical Achievement**: Modular security system with mobile-first architecture
**Business Value**: Enterprise-ready platform with improved user retention
**Next Phase**: Multi-tenant capabilities and advanced analytics

*3 commits • 23 files • 2,139 lines • Architectural complexity: High*
```

## Analysis Modes

### 🧠 Intelligent AI Mode (Default)
- **Smart Code Analysis**: Analyzes actual file changes and code patterns, not just commit messages
- **Pattern Recognition**: Detects refactoring, architectural changes, and business impact automatically
- **Engaging Narratives**: Creates compelling stories that show development progression
- **Multiple Styles**: Executive, technical, retrospective with audience-specific language
- **Superior Quality**: Produces professional presentations with deeper insights

### 🏛️ Legacy AI Mode (`--legacy-agent`)
- **Keyword-Based Analysis**: Traditional approach using commit message keywords
- **Fallback Option**: Available if intelligent analysis has issues
- **Proven Stability**: Uses the original single-agent prompt system
- **Same Output Quality**: Professional slides but with simpler analysis

### ⚡ Raw Mode (`--skip-ai`)
- **No AI Processing**: Fast generation without API calls
- **Direct Conversion**: Simple commit-to-slide transformation
- **Quick Reviews**: Good for rapid internal updates
- **No API Key Required**: Works without OpenAI integration

**Recommendation**: Use the default intelligent mode for best results. The legacy mode provides a reliable fallback, and raw mode offers speed when AI analysis isn't needed.

## Command Reference

### Core Options
| Command | Description |
|---------|-------------|
| `npx blackflag_weekly` | Generate intelligent AI slides and start Slidev |
| `npx blackflag_weekly --skip-ai` | Generate raw slides (no AI) |
| `npx blackflag_weekly --legacy-agent` | Use legacy keyword-based AI analysis |
| `npx blackflag_weekly --no-auto-start` | Generate slides only (don't start Slidev) |
| `npx blackflag_weekly --output ./slides` | Specify output directory |
| `npx blackflag_weekly --theme seriph` | Use specific Slidev theme |

### Presentation Styles
| Command | Description |
|---------|-------------|
| `--style executive` | Business-focused presentation for stakeholders |
| `--style technical` | Developer-focused with implementation details |
| `--style retrospective` | Team-focused for process improvement |
| `--style default` | Balanced technical and narrative focus |

### Customization Options
| Command | Description |
|---------|-------------|
| `--prompt ./custom.js` | Use custom prompt file |
| `--config ./config.js` | Load configuration file |
| `--focus business\|technical\|process` | Set presentation focus area |
| `--audience executive\|developers\|team` | Target specific audience |
| `--deep-dive` | Include detailed technical analysis |
| `--include-metrics` | Add analytics and detailed metrics |
| `--highlight-challenges` | Emphasize problem-solving |
| `--team-size <number>` | Optimize for team size |

## Requirements

- **Node.js** 22.17.0 or higher (required for latest Slidev and ES module compatibility)
- **Git repository** with commit history  
- **OpenAI API Key** (for AI features)

## Programmatic Usage

```javascript
import { BlackflagWeekly } from 'blackflag_weekly';

const bf = new BlackflagWeekly({
  output: './slides',
  theme: 'default',
  skipAi: false,
  autoStart: true
});

await bf.run();
```

## Troubleshooting

### Common Issues

**"No commits found"**
- Ensure you're in a git repository with commit history

**"OpenAI API failed"**  
- Check your API key is set correctly
- Tool automatically falls back to raw slides

**"Node version incompatible"**
- Update to Node.js 22.17.0 or higher
- Use `nvm install 22` if you have nvm
- Tool detects version and uses compatible Slidev

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)  
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Test

To test the package locally:

```bash
git clone <your-repo>
cd blackflag_weekly
npm test
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

**SelfTaughtCoder78704**

- GitHub: [@SelfTaughtCoder78704](https://github.com/SelfTaughtCoder78704)
- Repository: [blackflag_weekly](https://github.com/SelfTaughtCoder78704/blackflag_weekly)

---

*Raise the flag on your weekly progress* 🏴 # Test changes
