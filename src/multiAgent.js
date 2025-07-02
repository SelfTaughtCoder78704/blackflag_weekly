import { Agent, run } from '@openai/agents';
import { z } from 'zod';
import chalk from 'chalk';
import { gitAnalysisTools } from './gitAnalysisTools.js';

// =================================
// STRUCTURED OUTPUT SCHEMAS
// =================================

// Agent 1: Commit Analysis Schema
const CommitAnalysisSchema = z.object({
  commits: z.array(z.object({
    hash: z.string(),
    message: z.string(),
    author: z.string(),
    date: z.string(),
    actualChanges: z.object({
      filesModified: z.array(z.string()),
      linesAdded: z.number(),
      linesDeleted: z.number(),
      architecturalImpact: z.enum(['none', 'minor', 'major', 'breaking']),
      changeType: z.enum(['feature', 'bugfix', 'refactor', 'performance', 'security', 'documentation', 'testing', 'other']),
      technicalComplexity: z.enum(['low', 'medium', 'high']),
      businessImpact: z.string(),
      riskLevel: z.enum(['low', 'medium', 'high']),
      dependencies: z.array(z.string()),
      affectedModules: z.array(z.string())
    })
  })),
  metadata: z.object({
    totalCommits: z.number(),
    timespan: z.number(),
    uniqueAuthors: z.array(z.string()),
    codeVelocity: z.number(),
    overallComplexity: z.enum(['low', 'medium', 'high']),
    majorThemes: z.array(z.string())
  })
});

// Agent 2: Categorization Schema
const CategorizationSchema = z.object({
  categories: z.record(z.array(z.string())), // commit hashes grouped by category
  narratives: z.array(z.object({
    theme: z.string(),
    commitHashes: z.array(z.string()),
    importance: z.enum(['low', 'medium', 'high', 'critical']),
    storyArc: z.string(),
    technicalJourney: z.string(),
    businessValue: z.string()
  })),
  overallAssessment: z.object({
    sprintSummary: z.string(),
    majorAchievements: z.array(z.string()),
    technicalProgress: z.string(),
    challengesOvercome: z.array(z.string()),
    riskFactors: z.array(z.string()),
    collaborationPatterns: z.string(),
    nextSteps: z.array(z.string())
  }),
  insights: z.object({
    developmentVelocity: z.string(),
    codeQuality: z.string(),
    teamDynamics: z.string(),
    architecturalEvolution: z.string()
  })
});

// Agent 3: Content Planning Schema
const ContentPlanSchema = z.object({
  presentationStrategy: z.object({
    audienceLevel: z.enum(['executive', 'technical', 'mixed']),
    narrativeStyle: z.enum(['story-driven', 'data-driven', 'problem-solution', 'chronological']),
    keyMessage: z.string(),
    callToAction: z.string()
  }),
  slideOutline: z.array(z.object({
    slideNumber: z.number(),
    title: z.string(),
    purpose: z.string(),
    keyPoints: z.array(z.string()),
    supportingData: z.array(z.string()),
    visualSuggestions: z.array(z.string()),
    transitionTo: z.string().nullable()
  })),
  contentFlow: z.object({
    openingHook: z.string(),
    mainNarratives: z.array(z.string()),
    climax: z.string(),
    resolution: z.string(),
    futureOutlook: z.string()
  }),
  designGuidance: z.object({
    theme: z.string(),
    primaryLayouts: z.array(z.enum(['default', 'center', 'two-cols', 'cover'])),
    visualElements: z.array(z.string()),
    colorEmphasis: z.array(z.string())
  })
});

// Agent 4: Final Slide Generation Schema
const SlideDeckSchema = z.object({
  title: z.string(),
  theme: z.string(),
  slides: z.array(z.object({
    title: z.string(),
    subtitle: z.string().nullable(),
    layout: z.enum(['default', 'center', 'two-cols', 'cover']).default('default'),
    content: z.string(),
    right_content: z.string().nullable(),
    notes: z.string().nullable()
  }))
});

// =================================
// SPECIALIZED AGENTS
// =================================

// =================================
// SIMPLIFIED SINGLE AGENT APPROACH
// =================================

const smartSlideGenerationAgent = new Agent({
  name: 'Smart Slide Generator',
  instructions: `You are an intelligent slide generation agent that combines commit analysis with slide creation.

TASK: Analyze the provided git commits and generate a complete Slidev presentation.

ANALYSIS PROCESS:
1. Examine each commit's actual changes (not just messages)
2. Identify patterns: new features, bug fixes, refactoring, performance improvements
3. Determine business impact and technical significance
4. Create a compelling narrative that shows development progression

SLIDE GENERATION:
- Create 4-6 slides that tell the development story
- Include title slide, development journey, key achievements, and conclusion
- Use appropriate Slidev layouts and formatting
- Make it engaging for the target audience

Return a complete slide deck in JSON format with title, theme, and slides array.`,
  outputType: SlideDeckSchema
});

// =================================
// MAIN EXPORT FUNCTION
// =================================

export async function generateSlidesWithMultiAgent(commits, options = {}) {
  console.log(chalk.blue('🔄 Starting multi-agent slide generation...'));

  // Prepare git data for analysis - ensure commit hashes and file data are available
  const gitData = {
    commits: commits.map(commit => ({
      hash: commit.hash,
      message: commit.message,
      author: commit.author,
      date: commit.date,
      fileChanges: commit.fileChanges || [],
      stats: {
        files: commit.stats?.files || 0,
        insertions: commit.stats?.insertions || 0,
        deletions: commit.stats?.deletions || 0
      },
      body: commit.body || ''
    })),
    repository: {
      name: options.repositoryName || 'Repository',
      timespan: options.timespan || 7,
      totalCommits: commits.length
    },
    analysisOptions: {
      style: options.style || 'default',
      audience: options.audience || 'mixed',
      focus: options.focus || 'balanced',
      includeMetrics: options.includeMetrics || false,
      deepDive: options.deepDive || false,
      theme: options.theme || 'default'
    }
  };

  console.log(chalk.gray(`🔍 Prepared ${gitData.commits.length} commits for multi-agent analysis`));
  console.log(chalk.gray(`🔍 Commit hashes: ${gitData.commits.map(c => c.hash.substring(0, 7)).join(', ')}`));

  const input = `Generate a compelling Slidev presentation from this git repository data.

REPOSITORY DATA:
${JSON.stringify(gitData, null, 2)}

PRESENTATION REQUIREMENTS:
- Style: ${options.style || 'default'}
- Theme: ${options.theme || 'default'}
- Audience: ${options.audience || 'mixed'}
- Focus: ${options.focus || 'balanced'}

ANALYSIS INSTRUCTIONS:
Look beyond just the commit messages. Analyze the actual file changes, patterns, and development progression. Create a presentation that tells a compelling story of what was really accomplished.

Generate a complete slide deck in JSON format.`;

  try {
    console.log(chalk.gray('🔍 Starting smart slide generation...'));

    const result = await run(smartSlideGenerationAgent, input);

    console.log(chalk.green('✅ Smart slide generation complete'));
    console.log(chalk.gray(`🔍 Final agent: ${result.lastAgent?.name || 'unknown'}`));
    console.log(chalk.gray(`🔍 Result type: ${typeof result.finalOutput}`));

    // The final output should be the SlideDeckSchema from the last agent
    const slideDeck = result.finalOutput;

    // Handle different possible output formats
    if (typeof slideDeck === 'string') {
      // If it's already Slidev markdown, return it
      if (slideDeck.includes('---\ntheme:') || slideDeck.includes('---\n theme:')) {
        console.log(chalk.green('✅ Received Slidev markdown directly'));
        return slideDeck;
      }
      // If it's JSON string, try to parse it
      try {
        const parsed = JSON.parse(slideDeck);
        const slidevMarkdown = convertSlideDeckToSlidev(parsed);
        return slidevMarkdown;
      } catch (e) {
        throw new Error('Final output is string but not valid JSON or Slidev markdown');
      }
    }

    if (!slideDeck || typeof slideDeck !== 'object') {
      throw new Error(`Invalid slide deck generated by agents. Type: ${typeof slideDeck}, Content: ${JSON.stringify(slideDeck)?.substring(0, 200)}`);
    }

    // Convert structured output to Slidev markdown format
    const slidevMarkdown = convertSlideDeckToSlidev(slideDeck);

    return slidevMarkdown;

  } catch (error) {
    console.log(chalk.yellow('⚠️ Multi-agent processing failed:', error.message));
    console.log(chalk.red('Full error:', error));
    throw error;
  }
}

// Helper function to convert structured slide deck to Slidev markdown
function convertSlideDeckToSlidev(slideDeck) {
  let markdown = `---
theme: ${slideDeck.theme || 'default'}
title: "${slideDeck.title}"
---

`;

  slideDeck.slides.forEach((slide, index) => {
    if (index > 0) {
      markdown += '\n---\n';
    }

    if (slide.layout && slide.layout !== 'default') {
      markdown += `layout: ${slide.layout}\n`;
    }

    markdown += `\n# ${slide.title}\n`;

    if (slide.subtitle && slide.subtitle !== null) {
      markdown += `## ${slide.subtitle}\n\n`;
    }

    if (slide.layout === 'two-cols') {
      markdown += '\n::left::\n\n';
      markdown += slide.content;
      if (slide.right_content && slide.right_content !== null) {
        markdown += '\n\n::right::\n\n';
        markdown += slide.right_content;
      }
    } else {
      markdown += `\n${slide.content}`;
    }

    if (slide.notes && slide.notes !== null) {
      markdown += `\n\n<!--\n${slide.notes}\n-->`;
    }

    markdown += '\n';
  });

  return markdown;
}

// Re-export agent for potential individual use
export {
  smartSlideGenerationAgent
}; 