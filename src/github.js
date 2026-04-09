/**
 * GitHub Integration Module
 * Connects Buksy to GitHub REST API for commit stats, PR tracking, and repo activity.
 */

const https = require("node:https");

/**
 * Make a request to the GitHub REST API.
 */
async function githubRequest(method, path, token) {
  if (!token) {
    throw new Error("GitHub personal access token is not configured.");
  }

  const url = new URL(path, "https://api.github.com");

  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "User-Agent": "Buksy/1.0",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        try {
          const data = raw ? JSON.parse(raw) : {};
          if (res.statusCode >= 400) {
            reject(new Error(data.message || `GitHub API returned ${res.statusCode}`));
          } else {
            resolve(data);
          }
        } catch {
          reject(new Error(`GitHub returned invalid JSON (status ${res.statusCode})`));
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("GitHub request timed out")); });
    req.end();
  });
}

/**
 * Test the GitHub connection and get user info.
 */
async function testConnection(token) {
  try {
    const user = await githubRequest("GET", "/user", token);
    return {
      connected: true,
      user: {
        login: user.login,
        name: user.name,
        avatarUrl: user.avatar_url,
        publicRepos: user.public_repos,
        followers: user.followers
      },
      message: `Connected as ${user.login}`
    };
  } catch (error) {
    return { connected: false, user: null, message: error.message };
  }
}

/**
 * List user's repositories.
 */
async function listRepos(token, sort = "updated") {
  const repos = await githubRequest("GET", `/user/repos?sort=${sort}&per_page=30&type=owner`, token);
  return repos.map(repo => ({
    fullName: repo.full_name,
    name: repo.name,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    updatedAt: repo.updated_at,
    isPrivate: repo.private,
    defaultBranch: repo.default_branch,
    url: repo.html_url
  }));
}

/**
 * Get recent commits for a repository.
 */
async function getRepoCommits(token, owner, repo, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const commits = await githubRequest(
    "GET",
    `/repos/${owner}/${repo}/commits?since=${since.toISOString()}&per_page=100`,
    token
  );

  return commits.map(c => ({
    sha: c.sha?.slice(0, 7),
    message: c.commit?.message?.split("\n")[0] || "",
    author: c.commit?.author?.name || c.author?.login || "Unknown",
    date: c.commit?.author?.date || null,
    url: c.html_url
  }));
}

/**
 * Get open pull requests for a repository.
 */
async function getRepoPRs(token, owner, repo) {
  const prs = await githubRequest("GET", `/repos/${owner}/${repo}/pulls?state=open&per_page=20`, token);
  return prs.map(pr => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    draft: pr.draft,
    author: pr.user?.login || "Unknown",
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    reviewStatus: pr.requested_reviewers?.length > 0 ? "review_requested" : "waiting",
    additions: pr.additions || 0,
    deletions: pr.deletions || 0,
    url: pr.html_url,
    labels: (pr.labels || []).map(l => l.name)
  }));
}

/**
 * Get repository statistics (contributors, code frequency).
 */
async function getRepoStats(token, owner, repo) {
  let contributors = [];
  let codeFrequency = [];

  try {
    contributors = await githubRequest("GET", `/repos/${owner}/${repo}/stats/contributors`, token);
  } catch { contributors = []; }

  try {
    codeFrequency = await githubRequest("GET", `/repos/${owner}/${repo}/stats/code_frequency`, token);
  } catch { codeFrequency = []; }

  // Build commit heatmap from contributors data
  const weeklyCommits = [];
  if (Array.isArray(contributors)) {
    contributors.forEach(c => {
      (c.weeks || []).forEach(w => {
        const existing = weeklyCommits.find(e => e.week === w.w);
        if (existing) {
          existing.commits += w.c;
          existing.additions += w.a;
          existing.deletions += w.d;
        } else {
          weeklyCommits.push({
            week: w.w,
            date: new Date(w.w * 1000).toISOString().slice(0, 10),
            commits: w.c,
            additions: w.a,
            deletions: w.d
          });
        }
      });
    });
  }

  // Last 4 weeks of code frequency
  const recentFrequency = (Array.isArray(codeFrequency) ? codeFrequency : []).slice(-4).map(entry => ({
    week: new Date((entry[0] || 0) * 1000).toISOString().slice(0, 10),
    additions: entry[1] || 0,
    deletions: Math.abs(entry[2] || 0)
  }));

  return {
    weeklyCommits: weeklyCommits.slice(-8), // Last 8 weeks
    codeFrequency: recentFrequency,
    contributorCount: Array.isArray(contributors) ? contributors.length : 0
  };
}

/**
 * Build a full GitHub dashboard for tracked repos.
 */
async function buildGitHubDashboard(token, repos = []) {
  if (!token || repos.length === 0) {
    return { connected: false, repos: [], summary: null };
  }

  const results = [];
  let totalCommits = 0;
  let totalPRs = 0;
  let totalIssues = 0;

  for (const repoFullName of repos.slice(0, 5)) { // Max 5 repos
    const [owner, repo] = repoFullName.split("/");
    if (!owner || !repo) continue;

    try {
      const [commits, prs, stats] = await Promise.all([
        getRepoCommits(token, owner, repo, 7).catch(() => []),
        getRepoPRs(token, owner, repo).catch(() => []),
        getRepoStats(token, owner, repo).catch(() => ({ weeklyCommits: [], codeFrequency: [], contributorCount: 0 }))
      ]);

      const repoInfo = await githubRequest("GET", `/repos/${owner}/${repo}`, token).catch(() => ({}));

      totalCommits += commits.length;
      totalPRs += prs.length;
      totalIssues += repoInfo.open_issues_count || 0;

      results.push({
        fullName: repoFullName,
        name: repo,
        language: repoInfo.language || "Unknown",
        stars: repoInfo.stargazers_count || 0,
        openIssues: repoInfo.open_issues_count || 0,
        lastPush: repoInfo.pushed_at || null,
        recentCommits: commits.slice(0, 10),
        commitCount7d: commits.length,
        openPRs: prs,
        stats,
        url: repoInfo.html_url || `https://github.com/${repoFullName}`
      });
    } catch {
      results.push({
        fullName: repoFullName,
        name: repo,
        error: "Failed to fetch repo data"
      });
    }
  }

  // Build daily commit heatmap for last 30 days
  const heatmap = buildCommitHeatmap(results);

  return {
    connected: true,
    repos: results,
    heatmap,
    summary: {
      totalRepos: results.length,
      commitsThisWeek: totalCommits,
      openPRs: totalPRs,
      openIssues: totalIssues
    }
  };
}

function buildCommitHeatmap(repoResults) {
  const dayMap = {};
  const today = new Date();

  // Initialize last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = { date: key, count: 0 };
  }

  // Count commits per day
  repoResults.forEach(repo => {
    (repo.recentCommits || []).forEach(commit => {
      if (commit.date) {
        const key = new Date(commit.date).toISOString().slice(0, 10);
        if (dayMap[key]) {
          dayMap[key].count += 1;
        }
      }
    });
  });

  return Object.values(dayMap);
}

function defaultGithubConfig() {
  return {
    enabled: false,
    authMethod: "pat",
    token: "",
    username: "",
    repos: [],
    syncedAt: null,
    projectMappings: {}
  };
}

module.exports = {
  testConnection,
  listRepos,
  getRepoCommits,
  getRepoPRs,
  getRepoStats,
  buildGitHubDashboard,
  defaultGithubConfig
};
