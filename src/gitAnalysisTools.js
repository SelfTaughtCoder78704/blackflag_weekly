import { tool } from '@openai/agents';
import { z } from 'zod';
import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';

// Initialize git instance
const git = simpleGit();

// Tool to analyze git diff for a specific commit
export const analyzeGitDiffTool = tool({
  name: 'analyze_git_diff',
  description: 'Analyze the actual code changes in a git commit by examining the diff',
  parameters: z.object({
    commitHash: z.string(),
    maxLines: z.number().optional().default(500)
  }),
  async execute({ commitHash, maxLines }) {
    try {
      // Get the detailed diff for this commit
      const diffResult = await git.show([
        commitHash,
        '--format=fuller',
        '--stat',
        '--name-status',
        `--max-count=${maxLines}`
      ]);

      // Parse the diff to understand the changes
      const analysis = parseDiffContent(diffResult, commitHash);

      return JSON.stringify(analysis, null, 2);
    } catch (error) {
      return `Error analyzing commit ${commitHash}: ${error.message}`;
    }
  }
});

// Tool to detect architectural patterns in code changes
export const detectArchitecturalPatternsTool = tool({
  name: 'detect_architectural_patterns',
  description: 'Detect architectural patterns and refactoring in code changes',
  parameters: z.object({
    fileChanges: z.array(z.object({
      file: z.string(),
      status: z.string(),
      insertions: z.number().nullable(),
      deletions: z.number().nullable()
    })),
    commitMessage: z.string()
  }),
  async execute({ fileChanges, commitMessage }) {
    const patterns = analyzeArchitecturalPatterns(fileChanges, commitMessage);
    return JSON.stringify(patterns, null, 2);
  }
});

// Tool to assess business impact of changes
export const assessBusinessImpactTool = tool({
  name: 'assess_business_impact',
  description: 'Assess the business impact of code changes based on affected files and systems',
  parameters: z.object({
    fileChanges: z.array(z.object({
      file: z.string(),
      status: z.string()
    })),
    commitHash: z.string()
  }),
  async execute({ fileChanges, commitHash }) {
    const impact = assessBusinessImpact(fileChanges);
    return JSON.stringify(impact, null, 2);
  }
});

// Tool to analyze code complexity changes
export const analyzeComplexityChangesTool = tool({
  name: 'analyze_complexity_changes',
  description: 'Analyze changes in code complexity and technical debt',
  parameters: z.object({
    commitHash: z.string(),
    fileChanges: z.array(z.object({
      file: z.string(),
      insertions: z.number().nullable(),
      deletions: z.number().nullable()
    }))
  }),
  async execute({ commitHash, fileChanges }) {
    const complexity = analyzeComplexityChanges(fileChanges, commitHash);
    return JSON.stringify(complexity, null, 2);
  }
});

// Helper function to parse git diff content
function parseDiffContent(diffOutput, commitHash) {
  const lines = diffOutput.split('\n');
  const analysis = {
    commitHash,
    fileAnalysis: [],
    overallImpact: {
      architecturalChanges: false,
      breakingChanges: false,
      performanceImpact: 'unknown',
      securityImpact: 'none',
      testingChanges: false
    },
    codePatterns: []
  };

  let currentFile = null;
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    // Parse file headers
    if (line.startsWith('diff --git')) {
      const match = line.match(/diff --git a\/(.+) b\/(.+)/);
      if (match) {
        currentFile = {
          file: match[1],
          type: getFileCategory(match[1]),
          changes: {
            additions: 0,
            deletions: 0,
            modifications: []
          },
          impact: 'low'
        };
        analysis.fileAnalysis.push(currentFile);
      }
    }

    // Parse additions/deletions
    if (line.startsWith('+') && !line.startsWith('+++') && currentFile) {
      currentFile.changes.additions++;
      additions++;

      // Analyze the actual code being added
      const codeAnalysis = analyzeCodeLine(line.substring(1));
      if (codeAnalysis.significance > 0) {
        currentFile.changes.modifications.push({
          type: 'addition',
          content: line.substring(1).trim(),
          significance: codeAnalysis.significance,
          category: codeAnalysis.category
        });
      }
    }

    if (line.startsWith('-') && !line.startsWith('---') && currentFile) {
      currentFile.changes.deletions++;
      deletions++;

      // Analyze the actual code being removed
      const codeAnalysis = analyzeCodeLine(line.substring(1));
      if (codeAnalysis.significance > 0) {
        currentFile.changes.modifications.push({
          type: 'deletion',
          content: line.substring(1).trim(),
          significance: codeAnalysis.significance,
          category: codeAnalysis.category
        });
      }
    }
  }

  // Determine overall impact based on actual changes
  analysis.overallImpact = determineOverallImpact(analysis.fileAnalysis);

  return analysis;
}

// Analyze architectural patterns in file changes
function analyzeArchitecturalPatterns(fileChanges, commitMessage) {
  const patterns = {
    refactoring: false,
    newFeature: false,
    bugfix: false,
    performance: false,
    security: false,
    testing: false,
    documentation: false,
    configuration: false,
    architectural: false,
    evidence: []
  };

  // Analyze by file types and changes
  const fileTypes = fileChanges.reduce((acc, change) => {
    const type = getFileCategory(change.file);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Detect refactoring patterns
  if (hasRefactoringPattern(fileChanges)) {
    patterns.refactoring = true;
    patterns.evidence.push('Multiple files modified with balanced additions/deletions suggesting code restructuring');
  }

  // Detect architectural changes
  if (hasArchitecturalPattern(fileChanges)) {
    patterns.architectural = true;
    patterns.evidence.push('Changes to core system files, configuration, or multiple modules');
  }

  // Detect new features
  if (hasNewFeaturePattern(fileChanges)) {
    patterns.newFeature = true;
    patterns.evidence.push('New files created or significant additions to existing functionality');
  }

  // Detect performance work
  if (hasPerformancePattern(fileChanges, commitMessage)) {
    patterns.performance = true;
    patterns.evidence.push('Changes to algorithms, database queries, or optimization-related files');
  }

  // Detect security improvements
  if (hasSecurityPattern(fileChanges, commitMessage)) {
    patterns.security = true;
    patterns.evidence.push('Changes to authentication, authorization, validation, or security-related files');
  }

  return patterns;
}

// Assess business impact based on file changes
function assessBusinessImpact(fileChanges) {
  const impact = {
    level: 'low',
    categories: [],
    userFacing: false,
    systemCritical: false,
    dataImpact: false,
    apiChanges: false,
    description: ''
  };

  const criticalPaths = [
    'api/', 'routes/', 'controllers/', 'models/',
    'database/', 'migrations/', 'auth/', 'payment/',
    'user/', 'admin/', 'security/', 'config/'
  ];

  const userFacingPaths = [
    'ui/', 'components/', 'pages/', 'views/',
    'frontend/', 'client/', 'public/', 'assets/'
  ];

  for (const change of fileChanges) {
    const filePath = change.file.toLowerCase();

    // Check for critical system files
    if (criticalPaths.some(path => filePath.includes(path))) {
      impact.systemCritical = true;
      impact.level = 'high';
      impact.categories.push('system-critical');
    }

    // Check for user-facing changes
    if (userFacingPaths.some(path => filePath.includes(path))) {
      impact.userFacing = true;
      impact.categories.push('user-experience');
    }

    // Check for API changes
    if (filePath.includes('api') || filePath.includes('endpoint') || filePath.includes('route')) {
      impact.apiChanges = true;
      impact.categories.push('api-changes');
    }

    // Check for data impact
    if (filePath.includes('model') || filePath.includes('schema') || filePath.includes('migration')) {
      impact.dataImpact = true;
      impact.categories.push('data-model');
    }
  }

  // Generate description
  if (impact.categories.length > 0) {
    impact.description = `Changes affect: ${impact.categories.join(', ')}`;
  } else {
    impact.description = 'Internal implementation changes with minimal external impact';
  }

  return impact;
}

// Analyze complexity changes
function analyzeComplexityChanges(fileChanges, commitHash) {
  const complexity = {
    overallChange: 'neutral',
    technicalDebt: 'maintained',
    codeQuality: 'maintained',
    maintainability: 'maintained',
    evidence: []
  };

  let totalAdditions = 0;
  let totalDeletions = 0;
  let testFiles = 0;
  let codeFiles = 0;

  for (const change of fileChanges) {
    totalAdditions += change.insertions ?? 0;
    totalDeletions += change.deletions ?? 0;

    if (change.file.includes('test') || change.file.includes('spec')) {
      testFiles++;
    } else if (getFileCategory(change.file) === 'code') {
      codeFiles++;
    }
  }

  // Analyze net change
  const netChange = totalAdditions - totalDeletions;

  if (netChange > 100) {
    complexity.overallChange = 'increased';
    complexity.evidence.push('Significant code additions');
  } else if (netChange < -100) {
    complexity.overallChange = 'decreased';
    complexity.evidence.push('Significant code removal/cleanup');
  }

  // Test coverage analysis
  if (testFiles > 0 && codeFiles > 0) {
    complexity.codeQuality = 'improved';
    complexity.evidence.push('Tests added/modified alongside code changes');
  }

  return complexity;
}

// Helper functions for pattern detection
function hasRefactoringPattern(fileChanges) {
  // Multiple files with balanced add/delete ratios often indicate refactoring
  const multipleFiles = fileChanges.length > 2;
  const balancedChanges = fileChanges.some(change =>
    (change.insertions ?? 0) > 0 && (change.deletions ?? 0) > 0
  );
  return multipleFiles && balancedChanges;
}

function hasArchitecturalPattern(fileChanges) {
  // Changes to multiple modules or core configuration files
  const coreFiles = ['config', 'package.json', 'docker', 'makefile', 'webpack'];
  const moduleChanges = new Set(fileChanges.map(change =>
    change.file.split('/')[0]
  )).size > 2;

  const coreChanges = fileChanges.some(change =>
    coreFiles.some(core => change.file.toLowerCase().includes(core))
  );

  return moduleChanges || coreChanges;
}

function hasNewFeaturePattern(fileChanges) {
  // New files created or significant additions
  const newFiles = fileChanges.some(change => change.status === 'A');
  const significantAdditions = fileChanges.some(change =>
    (change.insertions ?? 0) > (change.deletions ?? 0) * 2
  );
  return newFiles || significantAdditions;
}

function hasPerformancePattern(fileChanges, commitMessage) {
  const performanceKeywords = ['optimize', 'performance', 'speed', 'cache', 'query', 'index'];
  const messageHasKeywords = performanceKeywords.some(keyword =>
    commitMessage.toLowerCase().includes(keyword)
  );

  const performanceFiles = fileChanges.some(change =>
    ['database', 'query', 'cache', 'index'].some(keyword =>
      change.file.toLowerCase().includes(keyword)
    )
  );

  return messageHasKeywords || performanceFiles;
}

function hasSecurityPattern(fileChanges, commitMessage) {
  const securityKeywords = ['security', 'auth', 'permission', 'validation', 'sanitize'];
  const messageHasKeywords = securityKeywords.some(keyword =>
    commitMessage.toLowerCase().includes(keyword)
  );

  const securityFiles = fileChanges.some(change =>
    ['auth', 'security', 'permission', 'validation'].some(keyword =>
      change.file.toLowerCase().includes(keyword)
    )
  );

  return messageHasKeywords || securityFiles;
}

// Helper function to categorize files
function getFileCategory(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  const filename = path.basename(filepath).toLowerCase();

  // Documentation
  if (ext === '.md' || ext === '.txt' || ext === '.rst') return 'documentation';

  // Configuration
  if (ext === '.json' || ext === '.yaml' || ext === '.yml' || ext === '.toml' ||
    filename.includes('config') || filename.includes('package')) return 'configuration';

  // Testing
  if (filename.includes('test') || filename.includes('spec') || filepath.includes('__tests__')) return 'testing';

  // Code files
  if (['.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.go', '.java', '.c', '.cpp', '.cs'].includes(ext)) return 'code';

  return 'other';
}

// Analyze individual code lines for significance
function analyzeCodeLine(codeLine) {
  const line = codeLine.trim();
  let significance = 0;
  let category = 'general';

  // Function/method definitions
  if (line.match(/^(function|const|let|var|def|class|interface|type)/)) {
    significance = 3;
    category = 'definition';
  }

  // API endpoints or routes
  if (line.match(/(app\.|router\.|@|endpoint|route)/)) {
    significance = 4;
    category = 'api';
  }

  // Database or model changes
  if (line.match(/(model|schema|migration|database|query)/i)) {
    significance = 4;
    category = 'data';
  }

  // Security-related changes
  if (line.match(/(auth|permission|security|validate|sanitize)/i)) {
    significance = 4;
    category = 'security';
  }

  // Configuration changes
  if (line.match(/(config|setting|environment|env)/i)) {
    significance = 3;
    category = 'configuration';
  }

  // Comments and documentation
  if (line.startsWith('//') || line.startsWith('*') || line.startsWith('#')) {
    significance = 1;
    category = 'documentation';
  }

  return { significance, category };
}

// Determine overall impact from file analysis
function determineOverallImpact(fileAnalysis) {
  const impact = {
    architecturalChanges: false,
    breakingChanges: false,
    performanceImpact: 'minimal',
    securityImpact: 'none',
    testingChanges: false
  };

  for (const file of fileAnalysis) {
    // Check for architectural changes based on file types and modification patterns
    if (file.type === 'configuration' || file.changes.modifications.length > 10) {
      impact.architecturalChanges = true;
    }

    // Check for potential breaking changes
    if (file.changes.modifications.some(mod =>
      mod.category === 'api' && mod.type === 'deletion'
    )) {
      impact.breakingChanges = true;
    }

    // Assess performance impact
    if (file.changes.modifications.some(mod => mod.category === 'data')) {
      impact.performanceImpact = 'moderate';
    }

    // Assess security impact
    if (file.changes.modifications.some(mod => mod.category === 'security')) {
      impact.securityImpact = 'positive';
    }

    // Check for testing changes
    if (file.type === 'testing') {
      impact.testingChanges = true;
    }
  }

  return impact;
}

// Export all tools as an array for easy use
export const gitAnalysisTools = [
  analyzeGitDiffTool,
  detectArchitecturalPatternsTool,
  assessBusinessImpactTool,
  analyzeComplexityChangesTool
]; 