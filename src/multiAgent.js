import { Agent, run } from '@openai/agents';
import { z } from 'zod';
import chalk from 'chalk';
import { gitAnalysisTools } from './gitAnalysisTools.js';
import { getPromptByStyle } from '../prompts/index.js';
import { slideGenerationPrompt } from '../prompts/slideGeneration.js';

// =================================
// STRUCTURED OUTPUT SCHEMAS
// =================================

// Final Slide Generation Schema
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
// PER-SLIDE PIPELINE APPROACH
// =================================

// Simplified validation through agent instructions instead of custom tools

// Agent for generating individual slide content with narrative context
const slideContentAgent = new Agent({
  name: 'Slide Content Generator',
  instructions: `You are a slide content generator that creates individual slides as part of a larger narrative.

TASK: Generate content for ONE slide that fits into the overall presentation story.

NARRATIVE CONTEXT:
You will receive:
- Overall presentation theme and narrative arc
- Information about previous slides (to maintain continuity)
- Your slide's role in the story (introduction, development, climax, conclusion)
- Specific commits and technical content for this slide

CONTENT GENERATION RULES:
- Create engaging, narrative-driven content for this ONE slide
- Maintain story continuity with previous slides
- Use appropriate Slidev layouts (default, center, two-cols, cover)
- Include relevant emojis for visual appeal
- Add speaker notes for context

FORMATTING SAFETY:
- Use "- " for bullet points, NEVER "* "
- Use "**Bold Text**" for emphasis, NEVER standalone asterisks
- Use "1. " for numbered lists
- Avoid patterns like "* key:", "* themes:", "*anything"
- Keep content clean and simple

Return a single slide object with title, content, layout, and notes.`,
  outputType: z.object({
    title: z.string(),
    subtitle: z.string().nullable(),
    layout: z.enum(['default', 'center', 'two-cols', 'cover']).default('default'),
    content: z.string(),
    right_content: z.string().nullable(),
    notes: z.string().nullable()
  })
});

// Agent for formatting individual slides with built-in validation
const slideFormatterAgent = new Agent({
  name: 'Slide Formatter',
  instructions: `You are a slide formatting specialist that ensures perfect Slidev compatibility.

TASK: Take slide content and ensure it's perfect for Slidev rendering.

CRITICAL VALIDATION CHECKS:
1. YAML SAFETY (MOST IMPORTANT):
   - Scan for asterisk patterns like "* key:", "*'s", "* word " 
   - These create YAML aliases that break parsing
   - Convert to "**Key:**", "**What's**", "**word**" instead
   - NEVER use standalone asterisks outside of markdown formatting

2. HTML STRUCTURE:
   - No lists nested inside paragraphs or bold tags
   - Separate paragraphs and lists with blank lines
   - Proper markdown hierarchy

3. SAFE FORMATTING:
   - Use only emoji icons (🚀 💡 🔧 📊 etc.) - no icon components
   - Use "- " for bullet points, NEVER "* "
   - Use "**Bold Text**" for emphasis
   - Valid Slidev layouts: default, center, two-cols, cover

PROCESS:
1. Examine the input slide content carefully
2. Identify and fix any YAML-breaking patterns
3. Ensure proper HTML/markdown structure
4. Return perfectly formatted content

Return a cleaned slide object that will render flawlessly in Slidev.`,
  outputType: z.object({
    title: z.string(),
    subtitle: z.string().nullable(),
    layout: z.enum(['default', 'center', 'two-cols', 'cover']).default('default'),
    content: z.string(),
    right_content: z.string().nullable(),
    notes: z.string().nullable()
  })
});

// Agent for validating final slide quality
const slideValidatorAgent = new Agent({
  name: 'Slide Validator',
  instructions: `You are a slide validation specialist that performs final quality checks.

TASK: Examine a formatted slide and verify it meets all requirements.

VALIDATION CRITERIA:
- No YAML anchors or aliases (asterisk patterns)
- Proper HTML structure (no nested lists in paragraphs)
- Valid Slidev syntax and layouts
- Meaningful content (not empty or broken)
- Safe formatting that won't break rendering

Return validation results with specific feedback for any issues found.`,
  outputType: z.object({
    isValid: z.boolean(),
    issues: z.array(z.string()),
    recommendations: z.array(z.string()).nullable()
  })
});

// =================================
// PER-SLIDE PIPELINE FUNCTIONS
// =================================

// Generate individual slide with retry logic and narrative continuity
const generateSlideWithPipeline = async (slideData, narrativeContext) => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Step 1: Generate slide content with narrative context
      console.log(chalk.cyan(`📝 Generating slide ${narrativeContext.slideIndex + 1}...`));

      // Use custom prompt system for slide generation
      const promptFunction = slideData.promptOptions?.customPromptFunction ||
        getPromptByStyle(slideData.promptOptions?.style) ||
        slideGenerationPrompt;

      // Create detailed commit summary for this slide's commits
      const detailedCommitSummary = slideData.commits.map(c => {
        const fileList = c.fileChanges?.map(fc => `${fc.status}: ${fc.file} (${fc.type})`).join(', ') || '';
        return `
COMMIT: ${c.message}
Author: ${c.author}
Date: ${new Date(c.date).toLocaleDateString()}
Type: ${c.changeType}
Files affected: ${c.stats?.files || 0} files, +${c.stats?.insertions || 0} lines, -${c.stats?.deletions || 0} lines
Changes: ${fileList || 'No file details available'}
${c.body ? `Description: ${c.body}` : ''}
`;
      }).join('\n---\n');

      // Generate the full prompt using the selected prompt function
      const fullStylePrompt = promptFunction(
        slideData.theme,
        detailedCommitSummary,
        slideData.workByCategory,
        slideData.commits,
        slideData.promptOptions
      );

      // Enhance with narrative context for per-slide generation
      const contentPrompt = `${fullStylePrompt}

IMPORTANT: You are generating slide ${narrativeContext.slideIndex + 1} of ${narrativeContext.totalSlides} for a presentation with narrative continuity.

NARRATIVE CONTEXT:
- Overall Theme: ${narrativeContext.overallTheme}
- Slide Type: ${narrativeContext.slideType} (${narrativeContext.isFirst ? 'Opening slide' : narrativeContext.isLast ? 'Closing slide' : 'Content slide'})
- Slide Focus: ${narrativeContext.slideFocus}

STORY CONTINUITY:
${narrativeContext.previousSlides.length > 0 ?
          `Previous slides covered:\n${narrativeContext.previousSlides.map((s, i) => `Slide ${i + 1}: ${s.title} - ${s.content.substring(0, 100)}...`).join('\n')}` :
          'This is the first slide - set the stage for the development story.'}

SPECIFIC FOCUS FOR THIS SLIDE:
Generate content for this ONE slide that:
1. Maintains story continuity with previous slides
2. Focuses on the commits assigned to this slide: ${slideData.commits.length} commits
3. Follows the presentation style: ${slideData.promptOptions?.style || 'default'}
4. Advances the overall narrative toward: ${narrativeContext.isLast ? 'conclusion and next steps' : 'the next phase of development'}`;

      const contentResult = await run(slideContentAgent, contentPrompt);

      // Step 2: Format with validation tools (up to 3 retries)
      console.log(chalk.cyan(`🔧 Formatting slide ${narrativeContext.slideIndex + 1}...`));

      const formatPrompt = `Format this slide content for perfect Slidev compatibility:

${JSON.stringify(contentResult.finalOutput, null, 2)}

Carefully examine the content and fix any YAML-breaking patterns, HTML structure issues, or formatting problems. Ensure it will render perfectly in Slidev.`;

      const formattedResult = await run(slideFormatterAgent, formatPrompt);

      // Step 3: Final validation
      console.log(chalk.cyan(`✅ Validating slide ${narrativeContext.slideIndex + 1}...`));

      const validationPrompt = `Validate this formatted slide for Slidev compatibility:

${JSON.stringify(formattedResult.finalOutput, null, 2)}

Check for YAML anchors, HTML structure issues, and other rendering problems.`;

      const validationResult = await run(slideValidatorAgent, validationPrompt);

      if (validationResult.finalOutput.isValid) {
        console.log(chalk.green(`✨ Slide ${narrativeContext.slideIndex + 1} completed successfully`));
        return formattedResult.finalOutput;
      } else {
        console.log(chalk.yellow(`⚠️  Slide ${narrativeContext.slideIndex + 1} validation failed (attempt ${attempt + 1}/${maxRetries})`));
        console.log(chalk.gray(`   Issues: ${validationResult.finalOutput.issues.join(', ')}`));
        attempt++;

        if (attempt === maxRetries) {
          console.log(chalk.red(`❌ Slide ${narrativeContext.slideIndex + 1} failed after ${maxRetries} attempts`));
          throw new Error(`Slide validation failed after ${maxRetries} attempts: ${validationResult.finalOutput.issues.join(', ')}`);
        }
      }

    } catch (error) {
      attempt++;
      console.error(chalk.red(`❌ Slide ${narrativeContext.slideIndex + 1} error (attempt ${attempt}/${maxRetries}):`, error.message));

      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
};

// =================================
// MAIN EXPORT FUNCTION
// =================================

export async function generateSlidesWithMultiAgent(commits, options = {}) {
  console.log(chalk.blue('🎬 Starting per-slide pipeline with narrative continuity...'));

  try {
    // Plan the overall narrative structure
    const totalSlides = Math.max(5, Math.min(8, Math.ceil(commits.length / 3)));
    const overallTheme = `Development Journey: ${commits.length} commits analyzed`;

    console.log(chalk.cyan(`📋 Planning ${totalSlides} slides with narrative continuity...`));

    // Divide commits into slide groups
    const slideGroups = [];
    const commitsPerSlide = Math.ceil(commits.length / (totalSlides - 2)); // -2 for title and conclusion

    // Title slide
    slideGroups.push({
      type: 'title',
      commits: [],
      focus: 'introduction'
    });

    // Content slides
    for (let i = 0; i < totalSlides - 2; i++) {
      const startIdx = i * commitsPerSlide;
      const endIdx = Math.min((i + 1) * commitsPerSlide, commits.length);
      slideGroups.push({
        type: 'content',
        commits: commits.slice(startIdx, endIdx),
        focus: i === 0 ? 'early_development' : i === totalSlides - 3 ? 'recent_changes' : 'development_progress'
      });
    }

    // Conclusion slide
    slideGroups.push({
      type: 'conclusion',
      commits: [],
      focus: 'summary'
    });

    // Generate slides with narrative context
    const slides = [];
    const previousSlides = [];

    for (let i = 0; i < slideGroups.length; i++) {
      const slideGroup = slideGroups[i];

      const narrativeContext = {
        slideIndex: i,
        totalSlides: slideGroups.length,
        overallTheme,
        previousSlides: [...previousSlides],
        slideType: slideGroup.type,
        slideFocus: slideGroup.focus,
        isFirst: i === 0,
        isLast: i === slideGroups.length - 1
      };

      const slideData = {
        theme: options.theme || 'default',
        commits: slideGroup.commits,
        detailedCommitSummary: `Processing ${slideGroup.commits.length} commits for ${slideGroup.focus}`,
        workByCategory: {
          [slideGroup.focus]: slideGroup.commits
        },
        promptOptions: options,
        slideGroup
      };

      try {
        const slide = await generateSlideWithPipeline(slideData, narrativeContext);
        slides.push(slide);

        // Add to previous slides for narrative continuity (keep last 2 for context)
        previousSlides.push({
          title: slide.title,
          content: slide.content.substring(0, 200) + '...' // Truncated for context
        });
        if (previousSlides.length > 2) {
          previousSlides.shift();
        }

      } catch (error) {
        console.error(chalk.red(`❌ Failed to generate slide ${i + 1}:`), error.message);
        console.log(chalk.yellow('⚠️  Falling back to simplified slide...'));

        // Create a safe fallback slide
        slides.push({
          title: slideGroup.type === 'title' ? 'Development Overview' :
            slideGroup.type === 'conclusion' ? 'Summary' :
              `Development Progress ${i}`,
          subtitle: null,
          layout: 'default',
          content: slideGroup.type === 'title' ?
            `# Development Journey\n\n🚀 **${commits.length} commits** analyzed\n\n📊 Generated with AI analysis` :
            slideGroup.type === 'conclusion' ?
              `# Summary\n\n✅ **Development completed**\n\n📈 **Progress made across multiple areas**` :
              `# Development Update\n\n📝 **Commits processed**: ${slideGroup.commits.length}\n\n🔧 **Work completed** in this phase`,
          right_content: null,
          notes: 'Fallback slide due to generation error'
        });
      }
    }

    const slideDeck = {
      title: `Development Review: ${commits.length} Commits`,
      theme: options.theme || 'default',
      slides: slides
    };

    console.log(chalk.green(`✨ Successfully generated ${slides.length} slides with narrative continuity`));

    // Convert structured output to Slidev markdown format
    const slidevMarkdown = convertSlideDeckToSlidev(slideDeck);

    console.log(chalk.green('✅ Per-slide pipeline complete'));

    return slidevMarkdown;

  } catch (error) {
    console.error(chalk.red('❌ Per-slide pipeline failed:'), error.message);
    throw error;
  }
}

// Helper function to convert structured slide deck to Slidev markdown
function convertSlideDeckToSlidev(slideDeck) {
  // Sanitize function to remove only problematic YAML anchors while preserving Slidev features
  function sanitizeContent(content) {
    if (!content) return '';

    return content
      // Minimal sanitization - let the formatting agent do the heavy lifting
      .replace(/&lt;/g, '<')  // Fix encoded < 
      .replace(/&gt;/g, '>')  // Fix encoded >
      .replace(/&amp;/g, '&') // Fix encoded &
      .replace(/<<:/g, '') // Remove YAML merge keys
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // Remove control characters
      // Safety net: only target obvious YAML alias patterns that agents miss
      .replace(/\*[a-zA-Z][a-zA-Z0-9]*\s/g, '**') // *Word followed by space
      .replace(/\*[a-zA-Z][a-zA-Z0-9]*$/g, '**') // *Word at end of line
      .trim();
  }

  // Sanitize title to ensure it's safe for YAML
  const safeTitle = sanitizeContent(slideDeck.title || 'Weekly Development Update');

  // Handle first slide layout in main frontmatter
  const firstSlideLayout = slideDeck.slides[0]?.layout;
  let markdown = `---
theme: ${slideDeck.theme || 'default'}
title: "${safeTitle}"`;

  if (firstSlideLayout && firstSlideLayout !== 'default') {
    markdown += `\nlayout: ${firstSlideLayout}`;
  }

  markdown += `\n---

`;

  slideDeck.slides.forEach((slide, index) => {
    if (index > 0) {
      markdown += '\n---\n';

      // Add layout to frontmatter if not default
      if (slide.layout && slide.layout !== 'default') {
        markdown += `layout: ${slide.layout}\n---\n`;
      } else {
        // Close the frontmatter even for default layout
        markdown += '---\n';
      }
    }

    const safeSlideTitle = sanitizeContent(slide.title) || `Slide ${index + 1}`;
    markdown += `\n# ${safeSlideTitle}\n`;

    if (slide.subtitle && slide.subtitle !== null) {
      const safeSubtitle = sanitizeContent(slide.subtitle);
      if (safeSubtitle) {
        markdown += `## ${safeSubtitle}\n\n`;
      }
    }

    if (slide.layout === 'two-cols') {
      markdown += '\n::left::\n\n';
      const safeContent = sanitizeContent(slide.content);
      markdown += safeContent || 'Content placeholder';

      if (slide.right_content && slide.right_content !== null) {
        markdown += '\n\n::right::\n\n';
        const safeRightContent = sanitizeContent(slide.right_content);
        markdown += safeRightContent || 'Content placeholder';
      }
    } else {
      const safeContent = sanitizeContent(slide.content);
      markdown += `\n${safeContent || 'Content placeholder'}`;
    }

    if (slide.notes && slide.notes !== null) {
      const safeNotes = sanitizeContent(slide.notes);
      if (safeNotes) {
        markdown += `\n\n<!--\n${safeNotes}\n-->`;
      }
    }

    markdown += '\n';
  });

  return markdown;
}

// Re-export agents for potential individual use
export {
  slideContentAgent,
  slideFormatterAgent,
  slideValidatorAgent
}; 