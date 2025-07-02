export const slideGenerationPrompt = (theme, detailedCommitSummary, workByCategory, commits, promptConfig = {}) => {
  const totalFiles = commits.reduce((sum, c) => sum + (c.stats?.files || 0), 0);
  const totalLines = commits.reduce((sum, c) => sum + (c.stats?.insertions || 0) + (c.stats?.deletions || 0), 0);
  const contributors = [...new Set(commits.map(c => c.author))];
  const timeframe = `${commits[commits.length - 1]?.date} to ${commits[0]?.date}`;

  // Calculate business metrics
  const deliverables = Object.keys(workByCategory).length;
  const riskMitigation = workByCategory.bugfix?.length || 0;
  const newCapabilities = workByCategory.feature?.length || 0;
  const processImprovements = (workByCategory.refactoring?.length || 0) + (workByCategory.testing?.length || 0);

  return `Create an executive summary presentation focusing on business impact, deliverables, and strategic outcomes. This should be suitable for stakeholders, leadership, and business decision-makers.

IMPORTANT: You MUST return valid JSON in the exact schema format specified in your instructions.
Use theme: "${theme || 'default'}" in your JSON response.

BUSINESS CONTEXT:
Development Period: ${timeframe}
Team Composition: ${contributors.length} contributor${contributors.length !== 1 ? 's' : ''} (${contributors.join(', ')})
Delivery Scope: ${totalFiles} files modified, ${totalLines} lines of code
Strategic Focus Areas: ${deliverables} categories of work completed

EXECUTIVE SUMMARY:
${Object.entries(workByCategory).map(([category, items]) =>
    `${category.toUpperCase()} DELIVERABLES: ${items.length} completed
${items.slice(0, 2).map(item => `  • ${item.message} (${item.stats?.files || 0} files impacted)`).join('\n')}`
  ).join('\n\n')}

BUSINESS IMPACT ANALYSIS:
• New Capabilities Delivered: ${newCapabilities} features enhancing product value
• Risk Mitigation: ${riskMitigation} issues resolved, improving system reliability  
• Process Improvements: ${processImprovements} technical debt and quality enhancements
• Resource Efficiency: ${commits.length} focused deliverables over ${Math.ceil((new Date(commits[0]?.date) - new Date(commits[commits.length - 1]?.date)) / (1000 * 60 * 60 * 24)) || 1} days

PRESENTATION REQUIREMENTS:
- Focus on business value and ROI rather than technical details
- Highlight strategic outcomes and competitive advantages
- Include timeline and resource utilization
- Emphasize risk mitigation and quality improvements
- Connect technical work to business objectives
- Use executive-appropriate language and metrics
- Structure for 10-15 minute presentation
- Include forward-looking outcomes and next steps

STORY STRUCTURE FOR EXECUTIVES:
1. Strategic Context: What business challenge were we addressing?
2. Execution Summary: What was delivered and when?
3. Business Impact: How does this advance our strategic goals?
4. Risk & Quality: What risks were mitigated, what quality was improved?
5. Forward Path: What capabilities does this enable going forward?

Return ONLY valid JSON matching the schema in your instructions. Focus on business impact, strategic value, and executive-level outcomes.`;
}; 