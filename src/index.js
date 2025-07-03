import simpleGit from 'simple-git';
import inquirer from 'inquirer';
import { Agent, run, setDefaultOpenAIKey } from '@openai/agents';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { slideGenerationPrompt } from '../prompts/slideGeneration.js';
import { getPromptByStyle } from '../prompts/index.js';
import { generateSlidesWithMultiAgent } from './multiAgent.js';

class BlackflagWeekly {
  constructor(options = {}) {
    this.options = options;
    this.git = simpleGit();

    // Set up OpenAI API key for Agents SDK
    if (!options.skipAi && process.env.OPENAI_API_KEY) {
      setDefaultOpenAIKey(process.env.OPENAI_API_KEY);
    }

    this.slideAgent = options.skipAi ? null : new Agent({
      name: 'Slide Generator Agent',
      instructions: `You are a technical storyteller who creates compelling presentations from git commit history. You must return structured JSON data that will be converted to Slidev markdown.

STORYTELLING PRINCIPLES:
- Tell a coherent story with beginning, middle, and end
- Each slide should have ONE focused message
- Connect the dots between different changes
- Show progression and evolution, not just a list of changes
- Make it engaging while staying truthful
- Use narrative flow: "We started with X, then discovered Y, which led to Z"

SLIDE STRUCTURE - Tell the story across these sections:
1. Title: Set the scene and time period
2. The Starting Point: Where we began this journey
3. Key Developments: The main story beats (1-2 per slide)
4. Challenges & Solutions: What problems came up and how they were solved
5. The Outcome: Where we ended up and what it means

CRITICAL RULES:
- Return ONLY valid JSON matching the schema below
- ONE main point per slide maximum
- Connect each slide to the overall narrative
- Be specific about technical details that advance the story
- Don't list everything - focus on the most important story beats
- Use transitions in your content: "This led to...", "Building on that...", "However..."
- End with clear outcomes and future direction

JSON SCHEMA:
{
  "title": "Engaging presentation title that captures the story",
  "theme": "${this.options.theme || 'default'}",
  "slides": [
    {
      "title": "Slide title with emoji",
      "subtitle": "Optional subtitle for context",
      "layout": "default|center|two-cols", 
      "content": "Main content as markdown text",
      "right_content": "Only for two-cols layout - right column content"
    }
  ]
}

LAYOUT GUIDELINES:
- "default": Standard slide with title and content
- "center": Use ONLY for final summary/conclusion slides
- "two-cols": For comparison or overview slides with left/right content

CONTENT GUIDELINES:
- Use theme: "${this.options.theme || 'default'}" in your JSON response
- Use markdown: **bold**, *italic*, - bullets, ## headings
- Include emojis for visual appeal
- Write engaging, story-driven content
- Each slide should advance the narrative
- Minimum 50 words per slide content
- Maximum 200 words per slide content

Return clean, valid JSON that tells a compelling technical story.`,
      responseFormat: {
        type: 'json_schema',
        json_schema: {
          name: 'presentation_structure',
          schema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Engaging presentation title'
              },
              theme: {
                type: 'string',
                enum: ['default', 'seriph', 'apple', 'nordic'],
                description: 'Slidev theme'
              },
              slides: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                      description: 'Slide title with emoji'
                    },
                    subtitle: {
                      type: 'string',
                      description: 'Optional subtitle for context'
                    },
                    layout: {
                      type: 'string',
                      enum: ['default', 'center', 'two-cols'],
                      description: 'Slide layout type'
                    },
                    content: {
                      type: 'string',
                      description: 'Main slide content in markdown'
                    },
                    right_content: {
                      type: 'string',
                      description: 'Right column content for two-cols layout'
                    }
                  },
                  required: ['title', 'layout', 'content'],
                  additionalProperties: false
                }
              }
            },
            required: ['title', 'theme', 'slides'],
            additionalProperties: false
          }
        }
      }
    });
  }

  async run() {
    console.log(chalk.blue('📚 Fetching recent git history...\n'));

    // Get recent commits
    const recentCommits = await this.getRecentCommits();

    if (recentCommits.length === 0) {
      console.log(chalk.yellow('⚠️  No commits found in this repository.'));
      return;
    }

    // Let user select starting point
    const selectedCommit = await this.selectStartingCommit(recentCommits);

    // Get commits from selected point to HEAD
    const commits = await this.getCommitsFromPoint(selectedCommit.hash);

    console.log(chalk.green(`\n✅ Found ${commits.length} commits from selected point to HEAD\n`));

    // Store commits for potential fallback
    this.lastCommits = commits;

    // Process with AI or use raw data
    const slideContent = this.options.skipAi
      ? await this.generateRawSlides(commits)
      : await this.generateAISlides(commits);

    // Create slides
    await this.createSlidevPresentation(slideContent);

    console.log(chalk.green.bold('\n🎉 Slides generated successfully!'));
    console.log(chalk.blue(`📁 Output: ${path.resolve(this.options.output)}`));
  }

  async getRecentCommits(count = 20) {
    try {
      const log = await this.git.log(['-n', count.toString()]);
      return log.all.map((commit, index) => ({
        index: index + 1,
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        date: commit.date,
        relativeDate: this.getRelativeDate(commit.date)
      }));
    } catch (error) {
      throw new Error(`Failed to fetch git history: ${error.message}`);
    }
  }

  async selectStartingCommit(commits) {
    const choices = commits.map(commit => ({
      name: `[${commit.index}] ${commit.message} (${commit.relativeDate}) - ${commit.hash.substring(0, 7)}`,
      value: commit
    }));

    const { selectedCommit } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedCommit',
        message: 'Select starting point (FROM THIS POINT):',
        choices,
        pageSize: 15
      }
    ]);

    return selectedCommit;
  }

  async getCommitsFromPoint(fromHash) {
    try {
      // Get all commits and filter from the selected commit to HEAD
      const allLog = await this.git.log();
      const commits = allLog.all;

      // Find the index of the selected commit
      const startIndex = commits.findIndex(commit => commit.hash === fromHash);

      if (startIndex === -1) {
        throw new Error(`Commit ${fromHash} not found in history`);
      }

      // Get commits from the selected commit (inclusive) to HEAD
      const selectedCommits = commits.slice(0, startIndex + 1);

      // Enhance each commit with file changes and stats
      const enhancedCommits = await Promise.all(
        selectedCommits.map(async (commit) => {
          try {
            // Get file changes for this commit
            const diffSummary = await this.git.diffSummary([`${commit.hash}^`, commit.hash]);
            const show = await this.git.show([commit.hash, '--name-status']);

            // Parse file changes
            const fileChanges = this.parseFileChanges(show);

            return {
              hash: commit.hash,
              message: commit.message,
              author: commit.author_name,
              date: commit.date,
              body: commit.body,
              stats: {
                files: diffSummary.files.length,
                insertions: diffSummary.insertions,
                deletions: diffSummary.deletions
              },
              fileChanges: fileChanges,
              changeType: this.categorizeCommit(commit.message, fileChanges)
            };
          } catch (error) {
            // Fallback for commits that can't be diffed (like initial commit)
            return {
              hash: commit.hash,
              message: commit.message,
              author: commit.author_name,
              date: commit.date,
              body: commit.body,
              stats: { files: 0, insertions: 0, deletions: 0 },
              fileChanges: [],
              changeType: this.categorizeCommit(commit.message, [])
            };
          }
        })
      );

      return enhancedCommits;
    } catch (error) {
      throw new Error(`Failed to fetch commits from ${fromHash}: ${error.message}`);
    }
  }

  parseFileChanges(showOutput) {
    const lines = showOutput.split('\n');
    const changes = [];

    for (const line of lines) {
      if (line.match(/^[AMD]\s+/)) {
        const [status, ...pathParts] = line.split('\s+');
        const path = pathParts.join(' ');
        changes.push({
          status: status, // A=Added, M=Modified, D=Deleted
          file: path,
          type: this.getFileType(path)
        });
      }
    }

    return changes;
  }

  getFileType(filepath) {
    if (filepath.endsWith('.md')) return 'documentation';
    if (filepath.endsWith('.js') || filepath.endsWith('.ts')) return 'code';
    if (filepath.endsWith('.json')) return 'configuration';
    if (filepath.endsWith('.test.js') || filepath.includes('test')) return 'testing';
    if (filepath.includes('README')) return 'documentation';
    return 'other';
  }

  categorizeCommit(message, fileChanges) {
    const msg = message.toLowerCase();
    const fileTypes = fileChanges.map(c => c.type);

    if (msg.startsWith('feat')) return 'feature';
    if (msg.startsWith('fix')) return 'bugfix';
    if (msg.startsWith('docs')) return 'documentation';
    if (msg.startsWith('test')) return 'testing';
    if (msg.startsWith('refactor')) return 'refactoring';
    if (fileTypes.includes('testing')) return 'testing';
    if (fileTypes.includes('documentation')) return 'documentation';
    if (fileTypes.includes('configuration')) return 'configuration';

    return 'general';
  }

  async generateRawSlides(commits) {
    // Better handling for minimal commit scenarios
    const totalFiles = commits.reduce((sum, c) => sum + (c.stats?.files || 0), 0);
    const totalInsertions = commits.reduce((sum, c) => sum + (c.stats?.insertions || 0), 0);
    const totalDeletions = commits.reduce((sum, c) => sum + (c.stats?.deletions || 0), 0);
    const contributors = [...new Set(commits.map(c => c.author))];
    const workByCategory = this.categorizeWork(commits);

    // Analyze the story arc
    const firstCommit = commits[commits.length - 1];
    const lastCommit = commits[0];
    const mainWorkType = Object.keys(workByCategory).reduce((a, b) =>
      workByCategory[a]?.length > workByCategory[b]?.length ? a : b);

    // Create a narrative based on the commits
    const isFeatureDevelopment = workByCategory.feature?.length > 0;
    const hadChallenges = workByCategory.bugfix?.length > 0;
    const hasDocumentation = workByCategory.documentation?.length > 0;

    const slideContent = `---
theme: ${this.options.theme}
title: Development Story
info: Generated by BlackFlag Weekly
class: text-center
transition: slide-left
---

# 📖 Development Story
## ${new Date(firstCommit?.date).toLocaleDateString()} - ${new Date(lastCommit?.date).toLocaleDateString()}

${commits.length === 1 ?
        'A focused development session' :
        `${commits.length} commits tell the story of ${contributors.length > 1 ? 'collaborative' : 'focused'} development`}

---

# 🎯 The Mission

${isFeatureDevelopment ?
        `We set out to build new capabilities${commits.length > 3 ? ', with several key milestones planned' : ''}` :
        workByCategory.bugfix?.length > 0 ?
          'Our focus was on improving and fixing existing functionality' :
          'We worked on enhancing the codebase'}

**Scope**: ${totalFiles} files • **Scale**: +${totalInsertions}/-${totalDeletions} lines

---

# 🚀 The Journey

${commits.slice().reverse().map((commit, index) => {
            const isFirst = index === 0;
            const isLast = index === commits.length - 1;
            const connector = isFirst ? 'We started by' :
              isLast ? 'Finally, we' :
                index === 1 ? 'Then we' : 'We continued by';

            return `**${connector}** ${commit.message.toLowerCase()}
${commit.stats?.files ? `*${commit.stats.files} files modified*` : ''}`;
          }).join('\n\n')}

---

${hadChallenges ? `# 🔧 Challenges & Solutions

${workByCategory.bugfix?.slice(0, 2).map(commit =>
            `### ${commit.message}
- **Impact**: ${commit.stats?.files || 0} files affected
- **Author**: ${commit.author}
${commit.body ? `- **Context**: ${commit.body.substring(0, 80)}${commit.body.length > 80 ? '...' : ''}` : ''}`
          ).join('\n\n')}

---

` : ''}# 🎉 The Outcome

${commits.length === 1 ?
        '✨ **Mission accomplished** with a single, focused change' :
        commits.length < 3 ?
          '🚀 **Streamlined execution** - efficient and effective' :
          '📈 **Significant progress** across multiple fronts'}

## What We Achieved
${Object.entries(workByCategory).map(([category, items]) =>
            `- **${items.length}** ${category} ${items.length === 1 ? 'update' : 'updates'}${items.length > 0 ? ` (${items.reduce((sum, item) => sum + (item.stats?.files || 0), 0)} files)` : ''
            }`
          ).join('\n')}

---
layout: center
---

# 🔮 What's Next?

${isFeatureDevelopment && !hadChallenges ?
        'With these new capabilities in place, we\'re ready for the next phase of development' :
        hadChallenges ?
          'Having resolved these challenges, the foundation is now stronger for future work' :
          'This work sets us up for continued progress ahead'}

**${contributors.join(' & ')}** • Generated with 🏴 BlackFlag Weekly
`;

    return slideContent;
  }

  async generateAISlides(commits) {
    console.log(chalk.blue('🤖 Processing commits with AI Agent...\n'));

    // Store commits for potential fallback
    this.lastCommits = commits;

    // Debug: Show what we're working with
    console.log(chalk.gray(`🔍 Processing ${commits.length} commits`));
    commits.forEach((commit, index) => {
      console.log(chalk.gray(`   ${index + 1}. ${commit.message} (${commit.stats?.files || 0} files, +${commit.stats?.insertions || 0}/-${commit.stats?.deletions || 0})`));
    });

    // Check if multi-agent system is enabled (default to true for better analysis)
    // Use legacy single-agent if specifically requested
    const useMultiAgent = !this.options.legacyAgent;

    if (useMultiAgent) {
      console.log(chalk.blue('🤖 Using multi-agent architecture for advanced analysis...'));

      try {
        // Prepare options for multi-agent system
        const multiAgentOptions = {
          style: this.options.style,
          theme: this.options.theme,
          audience: this.options.audience,
          focus: this.options.focus,
          includeMetrics: this.options.includeMetrics,
          deepDive: this.options.deepDive,
          repositoryName: this.options.repositoryName,
          timespan: this.options.timespan,
          promptConfig: this.options.promptConfig,
          customPromptFunction: this.options.customPromptFunction
        };

        const slideContent = await generateSlidesWithMultiAgent(commits, multiAgentOptions);

        console.log(chalk.gray(`✅ Multi-agent slides: ${slideContent.length} characters`));
        return slideContent;

      } catch (error) {
        console.log(chalk.yellow('⚠️ Multi-agent processing failed, falling back to single-agent system'));
        console.log(chalk.red(`Multi-agent error: ${error.message}`));
        // Fall through to single-agent system
      }
    }

    // Single-agent system (legacy/fallback)
    console.log(chalk.blue('🤖 Using single-agent system...'));

    // Create detailed commit analysis
    const detailedCommitSummary = commits.map(c => {
      const fileList = c.fileChanges.map(fc => `${fc.status}: ${fc.file} (${fc.type})`).join(', ');
      return `
COMMIT: ${c.message}
Author: ${c.author}
Date: ${new Date(c.date).toLocaleDateString()}
Type: ${c.changeType}
Files affected: ${c.stats.files} files, +${c.stats.insertions} lines, -${c.stats.deletions} lines
Changes: ${fileList || 'No file details available'}
${c.body ? `Description: ${c.body}` : ''}
`;
    }).join('\n---\n');

    // Create work summary by category
    const workByCategory = this.categorizeWork(commits);

    console.log(chalk.gray(`🔍 Work categories: ${Object.keys(workByCategory).join(', ')}`));

    // Determine which prompt function to use (hybrid system)
    const promptFunction = this.options.customPromptFunction ||
      getPromptByStyle(this.options.style) ||
      slideGenerationPrompt;

    const prompt = promptFunction(
      this.options.theme,
      detailedCommitSummary,
      workByCategory,
      commits,
      this.options.promptConfig
    );

    console.log(chalk.gray(`🔍 Prompt length: ${prompt.length} characters`));

    try {
      const result = await run(this.slideAgent, prompt);
      const aiOutput = result.finalOutput;

      console.log(chalk.gray(`🔍 AI generated ${aiOutput.length} characters`));
      console.log(chalk.gray(`🔍 AI preview: ${aiOutput.substring(0, 200)}...`));

      // Parse JSON response and convert to Slidev markdown
      const slideContent = this.convertJSONToSlidev(aiOutput);

      console.log(chalk.gray(`✅ Final slides: ${slideContent.length} characters`));
      return slideContent;

    } catch (error) {
      console.log(chalk.yellow('⚠️  AI Agent processing failed, falling back to raw slides'));
      console.log(chalk.red(`Error: ${error.message}`));
      return this.generateRawSlides(commits);
    }
  }

  convertJSONToSlidev(jsonOutput) {
    try {
      // Clean up any potential markdown code blocks or extra formatting
      let cleanJson = jsonOutput.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\n/, '').replace(/\n```$/, '');
      }
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const data = JSON.parse(cleanJson);

      console.log(chalk.gray(`🔍 Parsed JSON: ${data.slides.length} slides`));

      // Validate structure
      if (!data.title || !data.slides || !Array.isArray(data.slides)) {
        throw new Error('Invalid JSON structure - missing title or slides array');
      }

      // Convert to Slidev markdown
      let markdown = `---
theme: ${data.theme || this.options.theme || 'default'}
title: "${data.title}"
info: Generated by BlackFlag Weekly
class: text-center
transition: slide-left
---

`;

      data.slides.forEach((slide, index) => {
        // Add slide separator (except for first slide)
        if (index > 0) {
          markdown += '---\n';
          if (slide.layout && slide.layout !== 'default') {
            markdown += `layout: ${slide.layout}\n`;
          }
          markdown += '---\n\n';
        }

        // Add slide title
        markdown += `# ${slide.title}\n`;

        // Add subtitle if present
        if (slide.subtitle) {
          markdown += `## ${slide.subtitle}\n`;
        }

        markdown += '\n';

        // Handle different layouts
        if (slide.layout === 'two-cols' && slide.right_content) {
          markdown += `${slide.content}\n\n::right::\n\n${slide.right_content}\n\n`;
        } else {
          markdown += `${slide.content}\n\n`;
        }
      });

      return markdown;

    } catch (error) {
      console.log(chalk.yellow(`⚠️  JSON parsing failed: ${error.message}`));
      console.log(chalk.gray(`Raw AI output: ${jsonOutput.substring(0, 500)}...`));

      // Fallback to raw slides
      if (this.lastCommits) {
        return this.generateRawSlides(this.lastCommits);
      }

      throw new Error('Failed to parse JSON and no fallback commits available');
    }
  }

  async validateAndFixSlides(aiOutput) {
    console.log(chalk.gray(`🔍 Original AI output length: ${aiOutput.length} characters`));
    console.log(chalk.gray(`🔍 Original preview: ${aiOutput.substring(0, 300)}...`));

    // Remove wrapping code blocks that break Slidev
    let cleaned = aiOutput;

    // Fix: Remove markdown code block wrappers
    if (cleaned.startsWith('```markdown\n') || cleaned.startsWith('```\n')) {
      cleaned = cleaned.replace(/^```(?:markdown)?\n/, '');
      cleaned = cleaned.replace(/\n```$/, '');
    }

    // Fix: Remove any stray backticks at start/end
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');

    // CRITICAL: Remove all HTML div tags that break Vue compilation
    cleaned = cleaned.replace(/<div[^>]*>/g, '');
    cleaned = cleaned.replace(/<\/div>/g, '');

    // Fix: Replace HTML lists with markdown (common AI mistake)
    cleaned = cleaned.replace(/<ul>\s*<li>/g, '- ');
    cleaned = cleaned.replace(/<\/li>\s*<li>/g, '\n- ');
    cleaned = cleaned.replace(/<\/li>\s*<\/ul>/g, '');
    cleaned = cleaned.replace(/<li>/g, '- ');
    cleaned = cleaned.replace(/<\/li>/g, '');

    // Fix: Replace HTML bold/em with markdown
    cleaned = cleaned.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
    cleaned = cleaned.replace(/<em>(.*?)<\/em>/g, '*$1*');

    // Fix: Remove other problematic HTML tags
    cleaned = cleaned.replace(/<h([1-6])>/g, (match, level) => '#'.repeat(parseInt(level)) + ' ');
    cleaned = cleaned.replace(/<\/h[1-6]>/g, '');
    cleaned = cleaned.replace(/<p>/g, '');
    cleaned = cleaned.replace(/<\/p>/g, '\n');

    // Fix: Clean up extra whitespace and empty lines
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleaned = cleaned.trim();

    // Fix: YAML frontmatter issues
    // Quote titles with colons to prevent YAML parsing errors
    cleaned = cleaned.replace(/^title: (.+)$/gm, (match, title) => {
      if (title.includes(':') && !title.startsWith('"') && !title.startsWith("'")) {
        return `title: "${title}"`;
      }
      return match;
    });

    console.log(chalk.gray(`🔧 After cleaning: ${cleaned.length} characters`));
    console.log(chalk.gray(`🔧 Cleaned preview: ${cleaned.substring(0, 300)}...`));

    // Enhanced validation
    const hasValidFrontmatter = cleaned.includes('---\ntheme:') || cleaned.includes('---\n theme:');
    const hasSlideBreaks = cleaned.includes('\n---\n');
    const hasProblematicHTML = cleaned.includes('<div') || cleaned.includes('v-click');
    const hasActualContent = cleaned.split('\n---\n').length >= 3; // At least 3 slides
    const isMinimalContent = cleaned.length < 500; // Too short

    // Check for common failure patterns
    const hasOnlyLayoutCenter = cleaned.includes('layout: center') && !cleaned.includes('layout: two-cols');
    const lacksSubstantialContent = !cleaned.includes('##') && !cleaned.includes('###');

    // Specific check for the "layout:center only" problem
    const slideSections = cleaned.split('\n---\n');
    const hasEmptySlides = slideSections.some(section => {
      const contentLines = section.split('\n').filter(line =>
        line.trim() &&
        !line.startsWith('---') &&
        !line.includes('theme:') &&
        !line.includes('layout:') &&
        !line.includes('background:') &&
        !line.includes('title:') &&
        !line.includes('info:') &&
        !line.includes('class:') &&
        !line.includes('transition:') &&
        !line.startsWith('::') // Slidev two-cols syntax
      );
      return contentLines.length === 0; // Completely empty slide (not just < 2)
    });

    console.log(chalk.gray(`🔍 Validation details:`));
    console.log(chalk.gray(`   frontmatter: ${hasValidFrontmatter}`));
    console.log(chalk.gray(`   slide breaks: ${hasSlideBreaks}`));
    console.log(chalk.gray(`   problematic HTML: ${hasProblematicHTML}`));
    console.log(chalk.gray(`   actual content: ${hasActualContent} (${cleaned.split('\n---\n').length} slides)`));
    console.log(chalk.gray(`   minimal content: ${isMinimalContent}`));
    console.log(chalk.gray(`   only layout center: ${hasOnlyLayoutCenter}`));
    console.log(chalk.gray(`   lacks content: ${lacksSubstantialContent}`));
    console.log(chalk.gray(`   has empty slides: ${hasEmptySlides}`));

    // Determine if AI output is usable (less aggressive validation)
    const shouldUseFallback = !hasValidFrontmatter ||
      !hasSlideBreaks ||
      hasProblematicHTML ||
      !hasActualContent ||
      isMinimalContent ||
      (hasEmptySlides && lacksSubstantialContent); // Only fail if BOTH empty AND lacks content

    if (shouldUseFallback) {
      console.log(chalk.yellow('⚠️  AI output failed validation, falling back to raw slides'));

      if (!this.lastCommits) {
        console.log(chalk.red('❌ No commits available for fallback - this is a bug!'));
        return cleaned; // Return whatever we have
      }

      const fallbackSlides = await this.generateRawSlides(this.lastCommits);
      console.log(chalk.gray(`📄 Fallback slides: ${fallbackSlides.length} characters`));
      console.log(chalk.gray(`📄 Fallback preview: ${fallbackSlides.substring(0, 200)}...`));
      return fallbackSlides;
    }

    console.log(chalk.green('✅ AI slides validated and sanitized'));
    return cleaned;
  }

  categorizeWork(commits) {
    const categories = {};

    for (const commit of commits) {
      const category = commit.changeType;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(commit);
    }

    return categories;
  }

  async createSlidevPresentation(content) {
    const outputDir = path.resolve(this.options.output);

    try {
      await fs.mkdir(outputDir, { recursive: true });

      const slidesPath = path.join(outputDir, 'slides.md');
      await fs.writeFile(slidesPath, content, 'utf8');

      console.log(chalk.green(`📝 Slides written to: ${slidesPath}`));

      // Auto-start Slidev (default behavior unless --no-auto-start)
      if (this.options.autoStart !== false) {
        console.log(chalk.blue('\n🚀 Starting Slidev...'));
        await this.autoStartSlidev(outputDir);
      } else {
        console.log(chalk.blue(`\n📖 To view your slides with Slidev:`));
        console.log(chalk.white(`   cd ${outputDir} && npm init slidev@latest`));
        console.log(chalk.white(`   npm run dev`));

        console.log(chalk.blue(`\n📄 To export as PDF/PPTX/PNG:`));
        console.log(chalk.white(`   npm run export`));
      }
    } catch (error) {
      throw new Error(`Failed to create presentation: ${error.message}`);
    }
  }

  async autoStartSlidev(outputDir) {
    try {
      // Check if Slidev is already running on port 3030
      const isRunning = await this.checkSlidevRunning();
      if (isRunning) {
        console.log(chalk.green('✅ Slidev already running at http://localhost:3030'));
        console.log(chalk.blue('   Slides updated - Slidev will hot-reload automatically!'));
        this.openBrowser('http://localhost:3030');
        return;
      }

      // Check if we need to initialize Slidev first
      const packageJsonPath = path.join(outputDir, 'package.json');
      let needsInit = true;

      try {
        const packageJson = await fs.readFile(packageJsonPath, 'utf8');
        const pkg = JSON.parse(packageJson);
        if (pkg.dependencies && pkg.dependencies['@slidev/cli']) {
          needsInit = false;
          console.log(chalk.green('✅ Slidev already initialized'));
        }
      } catch (error) {
        // package.json doesn't exist or is invalid, need to init
      }

      process.chdir(outputDir);

      if (needsInit) {
        console.log(chalk.blue('📦 Initializing Slidev project...'));

        // Check Node.js compatibility
        const nodeVersion = process.version;
        const [major, minor, patch] = nodeVersion.slice(1).split('.').map(Number);

        // Node 20.19.0+ or 22.12.0+ required for latest Slidev
        const isCompatible = (major > 22) ||
          (major === 22 && minor >= 12) ||
          (major === 20 && minor >= 19);

        if (!isCompatible) {
          console.log(chalk.yellow(`⚠️  Node ${nodeVersion} detected - using compatible Slidev version`));

          // Manual setup for older Node.js
          await this.runCommand('npm', ['init', '-y'], { stdio: 'inherit' });
          await this.runCommand('npm', ['install', '@slidev/cli@0.49.4', '@slidev/theme-default@0.23.5'], { stdio: 'inherit' });

          // Create basic package.json scripts
          const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
          packageJson.scripts = {
            ...packageJson.scripts,
            dev: 'slidev slides.md --open',
            build: 'slidev build slides.md',
            export: 'slidev export slides.md'
          };
          await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));

        } else {
          console.log(chalk.blue(`   Using latest Slidev (Node ${nodeVersion})`));

          // CRITICAL: Backup AI-generated slides.md before init overwrites it
          const slidesOriginal = path.join(outputDir, 'slides.md');
          let backupContent = null;

          try {
            backupContent = await fs.readFile(slidesOriginal, 'utf8');
            console.log(chalk.blue('   💾 Backing up your AI-generated slides...'));
            console.log(chalk.gray(`   📄 Backup size: ${backupContent.length} characters`));
          } catch (error) {
            console.log(chalk.yellow('   ⚠️  No slides.md found to backup'));
          }

          console.log(chalk.blue('   🔧 Initializing Slidev (this may take a moment)...'));

          try {
            // Run Slidev init with automated responses
            await this.runCommand('npm', ['init', 'slidev@latest', '.'], {
              stdio: 'pipe',
              input: 'slides\nyes\nyes\nnpm\n' // package name, remove files, install, npm
            });
          } catch (error) {
            console.log(chalk.yellow('   ⚠️  Slidev init had issues, setting up manually...'));
          }

          // Ensure package.json exists with proper scripts
          await this.ensureSlidevPackageJson(outputDir);

          // CRITICAL: Restore AI-generated slides.md after init
          if (backupContent) {
            try {
              // Add a small delay to ensure init is complete
              await new Promise(resolve => setTimeout(resolve, 500));
              await fs.writeFile(slidesOriginal, backupContent, 'utf8');
              console.log(chalk.green('   ✅ Restored your AI-generated slides!'));

              // Verify the restore worked
              const restoredContent = await fs.readFile(slidesOriginal, 'utf8');
              if (restoredContent.length === backupContent.length) {
                console.log(chalk.green('   ✅ Backup/restore verified successful'));
              } else {
                console.log(chalk.yellow('   ⚠️  Backup/restore size mismatch - please check slides'));
              }
            } catch (error) {
              console.log(chalk.red('   ❌ Failed to restore slides.md: ' + error.message));
              console.log(chalk.yellow('   💡 Your original AI slides may have been overwritten'));
            }
          }
        }
      }

      console.log(chalk.blue('🚀 Starting Slidev dev server...'));

      // Start the dev server in background
      const devProcess = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        detached: false
      });

      // Give it a moment to start
      setTimeout(() => {
        console.log(chalk.green('🌐 Slidev should be running at: http://localhost:3030'));
        console.log(chalk.blue('   Press Ctrl+C to stop the server'));

        // Try to open browser (macOS/Windows/Linux compatible)
        this.openBrowser('http://localhost:3030');
      }, 3000);

      // Handle process cleanup
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n👋 Stopping Slidev...'));
        devProcess.kill();
        process.exit(0);
      });

    } catch (error) {
      console.log(chalk.red(`❌ Failed to auto-start Slidev: ${error.message}`));
      console.log(chalk.blue('📖 Please start manually:'));
      console.log(chalk.white(`   cd ${outputDir}`));
      console.log(chalk.white(`   npm init slidev@latest`));
      console.log(chalk.white(`   npm run dev`));
    }
  }

  async ensureSlidevPackageJson(outputDir) {
    const packageJsonPath = path.join(outputDir, 'package.json');

    try {
      // Check if package.json already exists and has Slidev
      const existingPkg = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      if (existingPkg.dependencies && existingPkg.dependencies['@slidev/cli']) {
        console.log(chalk.green('   ✅ Slidev package.json already configured'));
        return;
      }
    } catch (error) {
      // package.json doesn't exist or is invalid, create it
    }

    console.log(chalk.blue('   📦 Creating Slidev package.json configuration...'));

    const packageConfig = {
      name: 'weekly-slides',
      version: '1.0.0',
      description: 'Weekly progress slides generated by BlackFlag Weekly',
      main: 'slides.md',
      scripts: {
        dev: 'slidev slides.md --open',
        build: 'slidev build slides.md',
        export: 'slidev export slides.md'
      }
    };

    await fs.writeFile(packageJsonPath, JSON.stringify(packageConfig, null, 2));

    // Install latest Slidev dependencies
    console.log(chalk.blue('   📥 Installing Slidev dependencies...'));
    await this.runCommand('npm', ['install', '@slidev/cli', '@slidev/theme-default'], { stdio: 'inherit' });

    console.log(chalk.green('   ✅ Slidev configuration complete!'));
  }

  async checkSlidevRunning() {
    try {
      const response = await fetch('http://localhost:3030', {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: options.stdio || 'pipe',
        ...options
      });

      if (options.input && child.stdin) {
        // Write input with slight delay to ensure prompts are ready
        setTimeout(() => {
          child.stdin.write(options.input);
          child.stdin.end();
        }, 100);
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  openBrowser(url) {
    const open = (cmd) => spawn(cmd, [url], { stdio: 'ignore', detached: true }).unref();

    try {
      if (process.platform === 'darwin') {
        open('open');
      } else if (process.platform === 'win32') {
        open('start');
      } else {
        open('xdg-open');
      }
    } catch (error) {
      // Browser opening failed, that's ok
      console.log(chalk.blue(`💡 Manually open: ${url}`));
    }
  }

  getRelativeDate(date) {
    const now = new Date();
    const commitDate = new Date(date);
    const diffMs = now - commitDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }
}

async function runBlackflagWeekly(options) {
  const bf = new BlackflagWeekly(options);
  await bf.run();
}

export { runBlackflagWeekly, BlackflagWeekly };