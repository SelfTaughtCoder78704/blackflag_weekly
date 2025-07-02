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
npx blackflag_weekly --raw

# Specify output directory  
npx blackflag_weekly --output ./my-slides

# Use a specific Slidev theme
npx blackflag_weekly --theme seriph
```

### Environment Setup

For AI-powered slide generation, set your OpenAI API key:

```bash
# Environment variable (recommended)
export OPENAI_API_KEY=sk-your-api-key-here

# Or create a .env file
echo "OPENAI_API_KEY=sk-your-api-key-here" > .env
```

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
- Creates engaging narrative presentations
- Connects commits into a cohesive story
- Professional language suitable for stakeholders
- Analyzes technical changes and explains their impact

### Raw Mode (`--raw`)
- Fast generation without API calls
- Direct commit-to-slide conversion
- Good for quick internal reviews
- No AI processing required

## Command Reference

| Command | Description |
|---------|-------------|
| `npx blackflag_weekly` | Generate AI slides and start Slidev |
| `npx blackflag_weekly --raw` | Generate raw slides (no AI) |
| `npx blackflag_weekly --no-auto-start` | Generate slides only (don't start Slidev) |
| `npx blackflag_weekly --output ./slides` | Specify output directory |
| `npx blackflag_weekly --theme seriph` | Use specific Slidev theme |

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
