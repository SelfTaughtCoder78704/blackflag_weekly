export const slideGenerationPrompt = (theme, detailedCommitSummary, workByCategory, commits, promptConfig = {}) => {
  return `Tell the story of this development period through a structured JSON response that will be converted to a Slidev presentation. Focus on the NARRATIVE - what happened, why it mattered, and how it all connects together.

IMPORTANT: You MUST return valid JSON in the exact schema format specified in your instructions.
Use theme: "${theme || 'default'}" in your JSON response.

COMMIT TIMELINE TO ANALYZE:
${detailedCommitSummary}

STORY CONTEXT:
${Object.entries(workByCategory).map(([category, items]) =>
    `${category.toUpperCase()}: ${items.length} commits
${items.map(item => `  - ${item.message} (${item.stats.files} files, +${item.stats.insertions}/-${item.stats.deletions} lines)`).join('\n')}`
  ).join('\n\n')}

STORYTELLING REQUIREMENTS:
- Theme: ${theme}
- Time period: ${commits[commits.length - 1]?.date} to ${commits[0]?.date}
- Tell a cohesive story with clear narrative arc
- Each slide should advance the story - don't just list features
- Connect the dots: How did each change lead to the next?
- Be truthful about what actually happened (no overhype)
- Focus on the most significant story beats, not every detail
- Use emotional journey: challenges faced, breakthroughs achieved
- End with clear outcomes and what this enables next

STORY STRUCTURE TO FOLLOW:
1. Opening: Set the scene - what was the situation/goal?
2. Journey: Walk through the key developments in logical order
3. Challenges: What obstacles came up and how were they overcome?
4. Resolution: What was accomplished and what it means going forward

Return ONLY valid JSON matching the schema in your instructions. Do not include any markdown formatting or code blocks - just raw JSON data.`;
}; 