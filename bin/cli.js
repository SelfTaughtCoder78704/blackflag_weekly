#!/usr/bin/env node

import { program } from 'commander';
import { runBlackflagWeekly } from '../src/index.js';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { availableStyles, styleDescriptions, isValidStyle } from '../prompts/index.js';

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

// Process prompt options with priority handling
async function processPromptOptions(options) {
  // Priority: custom prompt file > config file > style preset > default

  // 1. Handle custom prompt file (highest priority)
  if (options.prompt) {
    console.log(chalk.blue(`📝 Loading custom prompt: ${options.prompt}`));
    try {
      const customPromptModule = await import(resolve(options.prompt));
      if (!customPromptModule.slideGenerationPrompt) {
        throw new Error('Custom prompt file must export slideGenerationPrompt function');
      }
      options.customPromptFunction = customPromptModule.slideGenerationPrompt;
      options.promptSource = 'custom-file';
      return;
    } catch (error) {
      console.error(chalk.red(`❌ Failed to load custom prompt: ${error.message}`));
      process.exit(1);
    }
  }

  // 2. Handle config file
  if (options.config) {
    console.log(chalk.blue(`⚙️ Loading configuration: ${options.config}`));
    try {
      const configModule = await import(resolve(options.config));
      const config = configModule.default || configModule;

      // Merge config with CLI options (CLI options take precedence)
      Object.keys(config).forEach(key => {
        if (options[key] === undefined) {
          options[key] = config[key];
        }
      });

      // Load custom prompt from config if specified
      if (config.customPrompt) {
        const customPromptModule = await import(resolve(config.customPrompt));
        options.customPromptFunction = customPromptModule.slideGenerationPrompt;
        options.promptSource = 'config-file';
        return;
      }

      // Use style from config if not overridden
      options.style = options.style || config.style || 'default';
    } catch (error) {
      console.error(chalk.red(`❌ Failed to load configuration: ${error.message}`));
      process.exit(1);
    }
  }

  // 3. Validate style preset
  if (options.style && !isValidStyle(options.style)) {
    console.error(chalk.red(`❌ Invalid style: ${options.style}`));
    console.log(chalk.yellow('Available styles:'));
    availableStyles.forEach(style => {
      console.log(chalk.white(`  ${style}: ${styleDescriptions[style]}`));
    });
    process.exit(1);
  }

  // 4. Set up prompt configuration for inline modifiers
  options.promptConfig = {
    focus: options.focus,
    audience: options.audience,
    deepDive: options.deepDive,
    includeMetrics: options.includeMetrics,
    highlightChallenges: options.highlightChallenges,
    teamSize: options.teamSize ? parseInt(options.teamSize) : undefined
  };

  // 5. Set prompt source for logging
  if (!options.promptSource) {
    options.promptSource = options.style !== 'default' ? `style-${options.style}` : 'default';
  }

  // Show what we're using
  const modifiers = Object.entries(options.promptConfig)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');

  if (modifiers) {
    console.log(chalk.gray(`📊 Prompt style: ${options.promptSource} (${modifiers})`));
  } else {
    console.log(chalk.gray(`📊 Prompt style: ${options.promptSource}`));
  }
}

program
  .name('blackflag_weekly')
  .description('Generate weekly progress slides from git history using OpenAI Agents and Slidev')
  .version(packageJson.version)
  .option('-o, --output <path>', 'Output directory for generated slides', './slides')
  .option('--theme <theme>', 'Slidev theme to use', 'default')
  .option('--skip-ai', 'Skip AI processing and use raw commit messages')
  .option('--legacy-agent', 'Use single-agent system instead of multi-agent architecture')
  .option('--auto-start', 'Automatically start Slidev after generating slides (default)')
  .option('--no-auto-start', 'Don\'t start Slidev automatically')

  // Prompt customization options
  .option('-s, --style <style>', `Presentation style (${availableStyles.join('|')})`, 'default')
  .option('-p, --prompt <path>', 'Path to custom prompt file')
  .option('-c, --config <path>', 'Path to configuration file')

  // Inline prompt modifiers
  .option('--focus <type>', 'Focus area (business|technical|process)')
  .option('--audience <type>', 'Target audience (executive|developers|team|mixed)')
  .option('--deep-dive', 'Include technical deep-dive sections')
  .option('--include-metrics', 'Include detailed metrics and analytics')
  .option('--highlight-challenges', 'Emphasize challenges and problem-solving')
  .option('--team-size <number>', 'Specify team size for collaboration insights')

  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('🏴 BlackFlag Weekly - Generating your progress slides...\n'));

      // Check if we're in a git repository
      if (!await isGitRepository()) {
        console.error(chalk.red('❌ Not a git repository. Please run this command in a git repository.'));
        process.exit(1);
      }

      // Validate and process prompt options
      await processPromptOptions(options);

      // Check for OpenAI API key if not skipping AI
      if (!options.skipAi && !process.env.OPENAI_API_KEY) {
        console.error(chalk.red('❌ OpenAI API key not found. Please set OPENAI_API_KEY environment variable.'));
        console.log(chalk.yellow('   You can also use --skip-ai to generate slides without AI Agent processing.'));
        process.exit(1);
      }

      await runBlackflagWeekly(options);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

async function isGitRepository() {
  const fs = (await import('fs')).promises;
  try {
    await fs.access('.git');
    return true;
  } catch {
    return false;
  }
}

// Add additional help information
program.addHelpText('after', `

Examples:
  # Use default multi-agent analysis (recommended)
  $ blackflag_weekly

  # Use built-in style presets with multi-agent system
  $ blackflag_weekly --style executive
  $ blackflag_weekly --style technical --deep-dive
  $ blackflag_weekly --style retrospective --team-size 5

  # Use custom prompt file
  $ blackflag_weekly --prompt ./my-custom-prompt.js

  # Use configuration file
  $ blackflag_weekly --config ./blackflag.config.js

  # Mix and match options
  $ blackflag_weekly --style technical --theme seriph --include-metrics
  $ blackflag_weekly --style executive --focus business --audience executive

  # Use legacy single-agent system (if multi-agent has issues)
  $ blackflag_weekly --legacy-agent

Available Styles:
${availableStyles.map(style => `  ${style.padEnd(12)} ${styleDescriptions[style]}`).join('\n')}

For more information, visit: https://github.com/SelfTaughtCoder78704/blackflag_weekly
`);

program.parse(); 