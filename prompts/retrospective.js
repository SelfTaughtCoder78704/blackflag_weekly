export const slideGenerationPrompt = (theme, detailedCommitSummary, workByCategory, commits, promptConfig = {}) => {
  const contributors = [...new Set(commits.map(c => c.author))];
  const timespan = Math.ceil((new Date(commits[0]?.date) - new Date(commits[commits.length - 1]?.date)) / (1000 * 60 * 60 * 24)) || 1;
  const velocity = commits.length / timespan;

  // Sprint analysis
  const sprintType = workByCategory.bugfix?.length > workByCategory.feature?.length ? 'maintenance-focused' :
    workByCategory.feature?.length > 0 ? 'feature-development' : 'general-improvement';

  const challengeIndicators = workByCategory.bugfix?.length || 0;
  const innovationWork = workByCategory.feature?.length || 0;
  const qualityWork = (workByCategory.refactoring?.length || 0) + (workByCategory.testing?.length || 0);

  // Collaboration patterns
  const collaborationLevel = contributors.length > 1 ? 'collaborative' : 'individual';
  const avgCommitSize = commits.reduce((sum, c) => sum + (c.stats?.files || 0), 0) / commits.length;
  const workDistribution = contributors.map(author => ({
    author,
    commits: commits.filter(c => c.author === author).length,
    impact: commits.filter(c => c.author === author).reduce((sum, c) => sum + (c.stats?.files || 0), 0)
  }));

  return `Create a team retrospective presentation focusing on process, collaboration, lessons learned, and team dynamics. This should facilitate discussion about what went well, what could be improved, and how to enhance future work.

IMPORTANT: You MUST return valid JSON in the exact schema format specified in your instructions.
Use theme: "${theme || 'default'}" in your JSON response.

SPRINT RETROSPECTIVE ANALYSIS:
Sprint Duration: ${timespan} days
Sprint Velocity: ${velocity.toFixed(1)} commits per day
Sprint Type: ${sprintType}
Team Composition: ${contributors.length} team member${contributors.length !== 1 ? 's' : ''}
Collaboration Style: ${collaborationLevel}

WORK BREAKDOWN & PATTERNS:
${Object.entries(workByCategory).map(([category, items]) =>
    `${category.toUpperCase()} WORK: ${items.length} items
${items.slice(0, 3).map(item => `  • ${item.message} (${item.author})`).join('\n')}`
  ).join('\n\n')}

TEAM COLLABORATION INSIGHTS:
${workDistribution.map(member =>
    `${member.author}: ${member.commits} commits, ${member.impact} files impacted`
  ).join('\n')}

Average commit scope: ${avgCommitSize.toFixed(1)} files per commit

PROCESS ANALYSIS:
• Innovation & Growth: ${innovationWork} new features/capabilities developed
• Challenge Resolution: ${challengeIndicators} issues addressed and resolved
• Quality Investment: ${qualityWork} refactoring and testing improvements
• Knowledge Sharing: ${workByCategory.documentation?.length || 0} documentation updates

RETROSPECTIVE FOCUS AREAS:

WHAT WENT WELL:
${innovationWork > 0 ? '• Strong feature development and innovation' : ''}
${challengeIndicators < commits.length * 0.3 ? '• Proactive development with minimal firefighting' : ''}
${qualityWork > 0 ? '• Investment in technical quality and maintainability' : ''}
${contributors.length > 1 ? '• Collaborative team approach to problem solving' : '• Focused individual contribution and ownership'}
${velocity > 1 ? '• Good development velocity and momentum' : ''}

CHALLENGES ENCOUNTERED:
${challengeIndicators > commits.length * 0.4 ? '• High volume of issues requiring resolution' : ''}
${avgCommitSize > 5 ? '• Large, complex changes that might benefit from smaller iterations' : ''}
${workByCategory.documentation?.length === 0 ? '• Limited documentation updates during development' : ''}

LESSONS LEARNED:
• Development patterns that worked effectively this sprint
• Collaboration approaches and communication strategies
• Technical decisions and their outcomes
• Process improvements that emerged naturally
• Challenges that became learning opportunities

PRESENTATION REQUIREMENTS:
- Create an open, constructive atmosphere for team discussion
- Balance achievements with areas for improvement
- Include specific examples that team members will recognize
- Focus on actionable insights and process improvements
- Encourage participation and shared reflection
- Structure for 30-40 minute team retrospective session
- Include forward-looking action items and commitments

STORY STRUCTURE FOR RETROSPECTIVE:
1. Sprint Overview: What did we set out to accomplish?
2. Journey Highlights: What were the key moments and milestones?
3. Collaboration Dynamics: How did we work together as a team?
4. Challenges & Learning: What obstacles did we overcome and what did we learn?
5. Process Insights: What worked well in our development process?
6. Action Items: What specific improvements will we implement going forward?

${promptConfig?.teamSize ? `
TEAM-SPECIFIC INSIGHTS:
- Optimize collaboration patterns for ${promptConfig.teamSize} team members
- Focus on communication strategies appropriate for team size
- Address coordination and knowledge sharing approaches
` : ''}

${promptConfig?.highlightChallenges ? `
CHALLENGE DEEP DIVE:
- Analyze specific challenges faced during this sprint
- Discuss root causes and systemic issues
- Identify preventive measures and process improvements
- Share problem-solving approaches that worked
` : ''}

Return ONLY valid JSON matching the schema in your instructions. Focus on team dynamics, process improvement, and constructive retrospective insights.`;
}; 