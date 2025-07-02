#!/usr/bin/env node

import { program } from 'commander';
import { runBlackflagWeekly } from '../src/index.js';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

program
  .name('blackflag_weekly')
  .description('Generate weekly progress slides from git history using OpenAI Agents and Slidev')
  .version(packageJson.version)
  .option('-o, --output <path>', 'Output directory for generated slides', './slides')
  .option('--theme <theme>', 'Slidev theme to use', 'default')
  .option('--skip-ai', 'Skip AI processing and use raw commit messages')
  .option('--auto-start', 'Automatically start Slidev after generating slides (default)')
  .option('--no-auto-start', 'Don\'t start Slidev automatically')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('🏴 BlackFlag Weekly - Generating your progress slides...\n'));

      // Check if we're in a git repository
      if (!await isGitRepository()) {
        console.error(chalk.red('❌ Not a git repository. Please run this command in a git repository.'));
        process.exit(1);
      }

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

program.parse(); 