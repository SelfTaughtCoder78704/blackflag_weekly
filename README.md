# 🏴 BlackFlag Weekly

Generate professional weekly progress slides from your git history using OpenAI Agents and Slidev.

Transform your technical commits into compelling presentations that tell the story of your development progress.

## Features

- 📚 **Interactive Git History Selection** - Browse recent commits and pick your starting point
- 🤖 **AI-Powered Storytelling** - Transform technical commits into engaging narratives using OpenAI Agents
- 🎨 **Professional Slides** - Generated using Slidev with customizable themes
- 🚀 **One-Command Workflow** - Automatically generates slides AND starts Slidev presentation
- 📊 **Smart Analysis** - Analyzes file changes, commit types, and project evolution
- 🛡️ **Bulletproof Generation** - Structured output prevents broken slides
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
🔍 Work categories: feature, bugfix, documentation
🔍 AI generated 2847 characters
🔍 Parsed JSON: 5 slides
✅ Final slides: 2156 characters

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

```markdown
---
theme: default
title: "Authentication & Mobile: A Development Sprint"
---

# 🚀 The Story of Our Latest Sprint
## March 1-8, 2024

Our journey from authentication challenges to mobile-first improvements

---

# 🎯 Where We Started

The challenge was clear: users needed secure access while our mobile experience was falling short...

---

# 💡 The Authentication Breakthrough

### We tackled user security head-on
- Comprehensive authentication system implemented
- Password reset and session management added
- This unlocked secure user workflows across the platform

---

# 🔧 Mobile Experience Revolution  

### Building on our security foundation
- Critical mobile layout issues resolved
- User experience now consistent across all devices
- Mobile-first approach guides future development

---
layout: center
---

# 🎉 The Outcome

**We now have**: Secure, mobile-optimized platform ready for scale
**Next chapter**: Enhanced user management and continued mobile excellence

*3 commits • 15 files • 847 lines of focused progress*
```

## AI vs Raw Modes

### AI Mode (Default)
- Creates engaging narrative presentations with multiple style options
- Connects commits into a cohesive story with audience-specific language
- **Executive style**: Business impact, ROI, strategic outcomes
- **Technical style**: Implementation details, code examples, architecture
- **Retrospective style**: Team dynamics, process insights, lessons learned
- Analyzes technical changes and explains their impact

### Raw Mode (`--skip-ai`)
- Fast generation without API calls
- Direct commit-to-slide conversion
- Good for quick internal reviews
- No AI processing required

## Command Reference

### Core Options
| Command | Description |
|---------|-------------|
| `npx blackflag_weekly` | Generate AI slides and start Slidev |
| `npx blackflag_weekly --skip-ai` | Generate raw slides (no AI) |
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
