const { analyzePr } = require('./detector');

const mockOctokit = (overrides = {}) => ({
  issues: {
    get: jest.fn().mockResolvedValue({ data: { user: { login: 'test-author' } } }),
  },
  users: {
    get: jest.fn().mockResolvedValue({ data: { created_at: new Date().toISOString() } }),
  },
  repos: {
    listCommits: jest.fn().mockResolvedValue({ data: [] }),
  },
  search: {
    issuesAndPullRequests: jest.fn().mockResolvedValue({ data: { total_count: 0 } }),
  },
  ...overrides,
});

describe('analyzePr', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes when account is old and no suspicious patterns', async () => {
    const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    const octokit = mockOctokit({
      users: { get: jest.fn().mockResolvedValue({ data: { created_at: oldDate } }) },
      issues: { get: jest.fn().mockResolvedValue({ data: { user: { login: 'good-author' } } }) },
      repos: { listCommits: jest.fn().mockResolvedValue({ data: [] }) },
    });
    const result = await analyzePr(octokit, { owner: 'test', repo: 'test', prNumber: 1, config: {} });
    expect(result.flagged).toBe(false);
  });

  it('flags account younger than 7 days', async () => {
    const newDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const octokit = mockOctokit({
      users: { get: jest.fn().mockResolvedValue({ data: { created_at: newDate } }) },
      issues: { get: jest.fn().mockResolvedValue({ data: { user: { login: 'new-author' } } }) },
      repos: { listCommits: jest.fn().mockResolvedValue({ data: [] }) },
    });
    const result = await analyzePr(octokit, { owner: 'test', repo: 'test', prNumber: 1, config: {} });
    expect(result.flagged).toBe(true);
    expect(result.reason).toContain('Account age');
  });

  it('flags high message similarity', async () => {
    const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    const commit = (msg) => ({ commit: { message: msg } });
    const commits = [
      commit('Fix: update dependency version'),
      commit('Fix: update dependency version'),
      commit('Fix: update dependency version'),
    ];
    const octokit = mockOctokit({
      users: { get: jest.fn().mockResolvedValue({ data: { created_at: oldDate } }) },
      issues: { get: jest.fn().mockResolvedValue({ data: { user: { login: 'bot-author' } } }) },
      repos: { listCommits: jest.fn().mockResolvedValue({ data: commits }) },
    });
    const result = await analyzePr(octokit, {
      owner: 'test', repo: 'test', prNumber: 1,
      config: { similarityThreshold: 0.8 },
    });
    expect(result.flagged).toBe(true);
    expect(result.reason.toLowerCase()).toContain('similarity');
  });

  it('uses custom thresholds from config', async () => {
    const newDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const octokit = mockOctokit({
      users: { get: jest.fn().mockResolvedValue({ data: { created_at: newDate } }) },
      issues: { get: jest.fn().mockResolvedValue({ data: { user: { login: 'test' } } }) },
      repos: { listCommits: jest.fn().mockResolvedValue({ data: [] }) },
    });
    // With accountAgeThreshold=1, 3 days should still pass
    const result = await analyzePr(octokit, {
      owner: 'test', repo: 'test', prNumber: 1,
      config: { accountAgeThreshold: 1 },
    });
    expect(result.flagged).toBe(false);
  });

  it('returns author login in result', async () => {
    const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    const octokit = mockOctokit({
      users: { get: jest.fn().mockResolvedValue({ data: { created_at: oldDate } }) },
      issues: { get: jest.fn().mockResolvedValue({ data: { user: { login: 'my-author' } } }) },
      repos: { listCommits: jest.fn().mockResolvedValue({ data: [] }) },
    });
    const result = await analyzePr(octokit, { owner: 'test', repo: 'test', prNumber: 1, config: {} });
    expect(result.authorLogin).toBe('my-author');
  });
});
