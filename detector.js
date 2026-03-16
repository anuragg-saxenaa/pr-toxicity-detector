const { Octokit } = require('@actions/core');
const crypto = require('crypto');

async function analyzePr(octokit, context) {
  try {
    const { owner, repo, prNumber, config } = context;

    // Get PR details
    const prResponse = await octokit.issues.get({
      owner,
      repo,
      issue_number: prNumber
    });
    const pr = prResponse.data;
    const authorLogin = pr.user.login;

    // Get author details to compute account age
    const authorResponse = await octokit.users.get({
      username: authorLogin
    });
    const createdAt = new Date(authorResponse.data.created_at);
    const accountAgeDays = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));

    // Get recent commits in this PR (first 5 commits)
    const commitsResponse = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 5
    });
    const recentCommits = commitsResponse.data.slice(0, 3);
    const commitMessages = recentCommits.map(c => c.commit.message || '').join(' ');
    const similarityThreshold = config.similarityThreshold || 0.8;

    // Simplified similarity check: compute similarity of this commit vs others (naive placeholder)
    const messagesArray = recentCommits.map(c => c.commit.message || '');
    let hasHighSimilarity = false;
    for (let i = 0; i < messagesArray.length; i++) {
      for (let j = i + 1; j < messagesArray.length; j++) {
        // Very naive comparison using word overlap (max 1 similarity)
        const setI = new Set(messagesArray[i].toLowerCase().split(/\W+/));
        const setJ = new Set(messagesArray[j].toLowerCase().split(/\W+/));
        const intersection = new Set([...setI].filter(x => setJ.has(x)));
        const union = new Set([...setI, ...setJ]);
        const similarity = intersection.size / union.size;
        if (similarity >= similarityThreshold) {
          hasHighSimilarity = true;
          break;
        }
      }
      if (hasHighSimilarity) break;
    }

    // Determine thresholds
    const accountAgeThreshold = config.accountAgeThreshold || 7;
    const prFrequencyThreshold = config.prFrequencyThreshold || 3;

    // Simulate pr count in last 24h (placeholder logic)
    const prCountLast24h = 0; // In real implementation, use GitHub Search API

    // Flag condition
    const flagged = 
      (accountAgeDays < accountAgeThreshold) || 
      (prCountLast24h > prFrequencyThreshold) ||
      hasHighSimilarity;

    let reason = '';
    if (accountAgeDays < accountAgeThreshold) {
      reason += `Account age: ${accountAgeDays} days < ${accountAgeThreshold} days; `;
    }
    if (prCountLast24h > prFrequencyThreshold) {
      reason += `PR count in last 24h: ${prCountLast24h} > ${prFrequencyThreshold}; `;
    }
    if (hasHighSimilarity) {
      reason += `Message similarity above ${similarityThreshold*100}%`;
    }

    return {
      flagged,
      reason: reason.trim(),
      authorLogin
    };
  } catch (error) {
    console.error('Error analyzing PR:', error);
    throw new Error(`PR analysis failed: ${error.message}`);
  }
}

module.exports = { analyzePr };