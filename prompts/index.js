// Import all prompt presets
import { slideGenerationPrompt as defaultPrompt } from './slideGeneration.js';
import { slideGenerationPrompt as executivePrompt } from './executiveSummary.js';
import { slideGenerationPrompt as technicalPrompt } from './technicalDeepDive.js';
import { slideGenerationPrompt as retrospectivePrompt } from './retrospective.js';

// Export individual prompts
export {
  defaultPrompt,
  executivePrompt,
  technicalPrompt,
  retrospectivePrompt
};

// Prompt registry for CLI usage
export const promptStyles = {
  'default': defaultPrompt,
  'executive': executivePrompt,
  'technical': technicalPrompt,
  'retrospective': retrospectivePrompt
};

// Available styles list for CLI help and validation
export const availableStyles = Object.keys(promptStyles);

// Style descriptions for CLI help
export const styleDescriptions = {
  'default': 'General development story with balanced technical and narrative focus',
  'executive': 'Business-focused presentation for stakeholders and leadership',
  'technical': 'Developer-focused deep dive with implementation details and architecture',
  'retrospective': 'Team-focused retrospective for process improvement and collaboration'
};

// Utility function to get prompt by style name
export function getPromptByStyle(styleName) {
  const style = styleName?.toLowerCase();
  if (!style || !promptStyles[style]) {
    return promptStyles.default;
  }
  return promptStyles[style];
}

// Utility function to validate style name
export function isValidStyle(styleName) {
  return availableStyles.includes(styleName?.toLowerCase());
} 