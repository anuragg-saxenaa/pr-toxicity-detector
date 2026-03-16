const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const { analyzePr } = require('./detector');

async function run() {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN not available');

    const octokit = github.getOctokit(token);
    const context = github.context;
    const { owner, repo } = context.repo;
    const { number: prNumber } = context.payload.pull_request;

    if (!prNumber) throw new Error('Not a pull request event');

    // Load configuration
    const configPath = path.join(process.env.GITHUB_WORKSPACE || '', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const result = await analyzePr(octokit, { owner, repo, prNumber, config });

    if (result.flagged) {
      const comment = `⚠️ **PR Toxicity Detector flag**\n\n${result.reason}\n\nPlease review manually before merging.`;
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: comment
      });
      core.setFailed(`PR ${prNumber} flagged: ${result.reason}`);
    } else {
      core.info(`PR ${prNumber} passed toxicity check`);
    }
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();