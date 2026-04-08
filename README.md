# PR Toxicity Detector

GitHub Action that automatically detects potential bot-generated or low-quality PRs using behavioral analysis.

## Problem

AI coding agents are flooding open source repos with low-quality PRs that waste maintainer time and damage community trust. This action provides a first line of defense.

## Installation

Create a workflow file (e.g., `.github/workflows/pr-toxicity.yml`):

```yaml
name: PR Toxicity Detector

on:
  pull_request:

jobs:
  detect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: PR Toxicity Detector
        uses: anuragg-saxenaa/pr-toxicity-detector@v1
        with:
          config: 'config.json'
```

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

| Threshold | Default | Description |
|-----------|---------|-------------|
| `accountAgeThreshold` | 7 | Flag accounts younger than N days |
| `prFrequencyThreshold` | 3 | Flag if author opened > N PRs in 24h |
| `similarityThreshold` | 0.8 | Flag commits with > N% message similarity |
| `blockMerge` | false | Set to `true` to require status check pass |

## How It Works

1. **Account Age Check**: Fetches the PR author's account creation date and flags if younger than `accountAgeThreshold` days.
2. **Message Similarity Check**: Computes Jaccard similarity between recent commit messages. Flags if similarity exceeds `similarityThreshold`.
3. **Warning Comment**: Posts a ⚠️ comment on flagged PRs.

## Exit Codes

- `0`: PR passed (no flags)
- `1`: Action error
- `1`: PR flagged (action fails to prevent merge by default)

## License

MIT
