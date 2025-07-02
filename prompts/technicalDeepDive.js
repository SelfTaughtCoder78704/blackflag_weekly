export const slideGenerationPrompt = (theme, detailedCommitSummary, workByCategory, commits, promptConfig = {}) => {
  const codeFiles = commits.reduce((sum, c) => sum + (c.fileChanges?.filter(fc => fc.type === 'code').length || 0), 0);
  const configFiles = commits.reduce((sum, c) => sum + (c.fileChanges?.filter(fc => fc.type === 'configuration').length || 0), 0);
  const testFiles = commits.reduce((sum, c) => sum + (c.fileChanges?.filter(fc => fc.type === 'testing').length || 0), 0);

  // Technical patterns analysis
  const architecturalChanges = commits.filter(c =>
    c.message.toLowerCase().includes('refactor') ||
    c.message.toLowerCase().includes('architect') ||
    c.message.toLowerCase().includes('restructure')
  );

  const performanceWork = commits.filter(c =>
    c.message.toLowerCase().includes('performance') ||
    c.message.toLowerCase().includes('optimize') ||
    c.message.toLowerCase().includes('speed')
  );

  const securityWork = commits.filter(c =>
    c.message.toLowerCase().includes('security') ||
    c.message.toLowerCase().includes('auth') ||
    c.message.toLowerCase().includes('permission')
  );

  return `Create a technical deep dive presentation for developers, architects, and technical stakeholders. Focus on implementation details, technical decisions, code quality, and architectural patterns.

IMPORTANT: You MUST return valid JSON in the exact schema format specified in your instructions.
Use theme: "${theme || 'default'}" in your JSON response.

TECHNICAL ANALYSIS:
${detailedCommitSummary}

CODE IMPACT BREAKDOWN:
• Source Code Files: ${codeFiles} modified
• Configuration Files: ${configFiles} updated  
• Test Files: ${testFiles} affected
• Architectural Changes: ${architecturalChanges.length} structural modifications
• Performance Work: ${performanceWork.length} optimization commits
• Security Enhancements: ${securityWork.length} security-focused changes

DETAILED TECHNICAL CONTEXT:
${Object.entries(workByCategory).map(([category, items]) =>
    `${category.toUpperCase()} IMPLEMENTATION (${items.length} commits):
${items.map(item => {
      const fileTypes = item.fileChanges?.map(fc => fc.type).join(', ') || 'mixed';
      const complexity = (item.stats?.insertions || 0) > 100 ? 'complex' :
        (item.stats?.insertions || 0) > 20 ? 'moderate' : 'simple';
      return `  • ${item.message}
    Files: ${item.stats?.files || 0} (${fileTypes})
    Scale: +${item.stats?.insertions || 0}/-${item.stats?.deletions || 0} lines
    Complexity: ${complexity} change`;
    }).join('\n')}`
  ).join('\n\n')}

ARCHITECTURAL PATTERNS & DECISIONS:
${architecturalChanges.length > 0 ? `
Structural Changes Made:
${architecturalChanges.map(change => `• ${change.message} - ${change.stats?.files || 0} files restructured`).join('\n')}
` : 'No major architectural changes in this period.'}

TECHNICAL DEBT & QUALITY:
• Refactoring Work: ${workByCategory.refactoring?.length || 0} code quality improvements
• Testing Coverage: ${workByCategory.testing?.length || 0} test-related changes
• Bug Resolution: ${workByCategory.bugfix?.length || 0} defects addressed
• Documentation: ${workByCategory.documentation?.length || 0} technical docs updated

PRESENTATION REQUIREMENTS:
- Include code examples and technical implementation details
- Explain architectural decisions and their rationale  
- Discuss patterns, best practices, and technical trade-offs
- Show before/after comparisons where relevant
- Include performance implications and technical metrics
- Address technical debt and code quality improvements
- Explain testing strategies and coverage changes
- Use developer-appropriate technical language
- Structure for 20-25 minute technical review

STORY STRUCTURE FOR DEVELOPERS:
1. Technical Context: What was the existing architecture/codebase state?
2. Implementation Journey: Walk through key technical changes step by step
3. Architectural Decisions: Why were specific patterns/approaches chosen?
4. Code Quality Impact: How did this improve the technical foundation?
5. Technical Outcomes: What new capabilities or improvements were achieved?
6. Future Technical Direction: What does this enable for future development?

${promptConfig?.deepDive ? `
DEEP DIVE FOCUS:
- Include detailed code analysis and complexity metrics
- Show specific implementation patterns and examples
- Discuss performance benchmarks and optimization details
- Cover security implications and technical risk assessment
` : ''}

Return ONLY valid JSON matching the schema in your instructions. Focus on technical implementation, architectural decisions, and developer-focused insights.`;
}; 