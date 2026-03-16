# PR Toxicity Detector

GitHub Action that automatically detects potential bot-generated or low-quality PRs using behavioral analysis.

## Installation

1. Add to your repository:
```yaml
- name: PR Toxicity Detector
  uses: anuragg-saxenaa/pr-toxicity-detector@v1.0.0
```

2. Configure thresholds in `config.json` if needed.

## Usage

The action triggers on pull request events and performs:

1. **Account Age Check**: Flags accounts < 7 days old
2. **PR Frequency Check**: Flags accounts with > 3 PRs in last 24h
3. **Message Similarity Check**: Flags commits with > 80% similarity to other commits

## Configuration

Edit `config.json` to adjust thresholds:
```json
{
  "accountAgeThreshold": 7,
  "prFrequencyThreshold": 3,
  "similarityThreshold": 0.8,
  "blockMerge": false
}
```

## Output

- Posts warning comment on flagged PRs
- (Optional) Blocks merge if `blockMerge: true`
- Logs analysis to GitHub Actions output

## License

MIT