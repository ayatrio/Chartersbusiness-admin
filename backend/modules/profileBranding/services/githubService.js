const { Octokit } = require('@octokit/rest');

const getConfiguredToken = () => {
  const token = (process.env.GITHUB_TOKEN || '').trim();

  if (!token) return null;
  if (token === 'your_github_personal_access_token') return null;
  if (token.toLowerCase().startsWith('your_')) return null;

  return token;
};

if (!getConfiguredToken()) {
  console.warn('GITHUB_TOKEN not set. GitHub API will run unauthenticated with a low rate limit.');
}

const createOctokit = (token = getConfiguredToken()) => (
  token ? new Octokit({ auth: token }) : new Octokit()
);

const classifyGithubError = (error) => {
  const message = error?.message || 'GitHub request failed';

  if (error?.status === 404) {
    const notFoundError = new Error('GitHub user not found');
    notFoundError.status = 404;
    return notFoundError;
  }

  if (
    error?.status === 403 ||
    /rate limit/i.test(message)
  ) {
    const rateLimitError = new Error(
      'GitHub API rate limit reached. Add a valid GITHUB_TOKEN in backend/.env or try again later.'
    );
    rateLimitError.status = 429;
    return rateLimitError;
  }

  if (
    error?.status === 401 ||
    /bad credentials/i.test(message)
  ) {
    const credentialsError = new Error(
      'Configured GITHUB_TOKEN is invalid. Remove it or replace it with a valid GitHub token in backend/.env.'
    );
    credentialsError.status = 503;
    return credentialsError;
  }

  const genericError = new Error('Failed to fetch GitHub profile');
  genericError.status = 502;
  return genericError;
};

const withGithubClient = async (operation) => {
  const token = getConfiguredToken();
  const primaryClient = createOctokit(token);

  try {
    return await operation(primaryClient);
  } catch (error) {
    const isInvalidToken =
      token &&
      (error?.status === 401 || /bad credentials/i.test(error?.message || ''));

    if (isInvalidToken) {
      console.warn('Configured GITHUB_TOKEN was rejected by GitHub. Retrying without authentication.');
      return operation(createOctokit(null));
    }

    throw classifyGithubError(error);
  }
};

// Fetch GitHub user profile data
exports.fetchUserProfile = async (username) => {
  try {
    return await withGithubClient(async (octokit) => {
    // Get user basic info
      const { data: user } = await octokit.users.getByUsername({
        username
      });

    // Get repositories
      const { data: repos } = await octokit.repos.listForUser({
        username,
        per_page: 100,
        sort: 'updated'
      });

    // Calculate contributions (approximate based on commits)
      let totalContributions = 0;
      const languageStats = {};

      for (const repo of repos.slice(0, 12)) { // Check recently updated repos
        try {
        // Get commits count
          const { data: commits } = await octokit.repos.listCommits({
            owner: username,
            repo: repo.name,
            author: username,
            per_page: 100
          });
          totalContributions += commits.length;

        // Track languages
          if (repo.language) {
            languageStats[repo.language] = (languageStats[repo.language] || 0) + 1;
          }
        } catch (err) {
        // Skip repos we can't access
          continue;
        }
      }

    // Check if user has README
      let hasReadme = false;
      try {
        await octokit.repos.getReadme({
          owner: username,
          repo: username
        });
        hasReadme = true;
      } catch (err) {
        hasReadme = false;
      }

    // Calculate top languages
      const languageDenominator = repos.length || 1;
      const topLanguages = Object.entries(languageStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([language, count]) => ({
          language,
          percentage: Math.round((count / languageDenominator) * 100)
        }));

      return {
        profileUrl: user.html_url,
        repositoriesCount: user.public_repos,
        publicRepos: user.public_repos,
        contributionsLastYear: totalContributions,
        followers: user.followers,
        following: user.following,
        hasReadme,
        topLanguages
      };
    });
  } catch (error) {
    console.error('GitHub API Error:', error);
    throw error.status ? error : classifyGithubError(error);
  }
};

// Get repository languages breakdown
exports.getRepositoryLanguages = async (username, repoName) => {
  try {
    const { data } = await withGithubClient((octokit) => octokit.repos.listLanguages({
      owner: username,
      repo: repoName
    }));

    const total = Object.values(data).reduce((sum, bytes) => sum + bytes, 0);
    
    const languages = Object.entries(data).map(([language, bytes]) => ({
      language,
      percentage: Math.round((bytes / total) * 100),
      bytes
    }));

    return languages.sort((a, b) => b.percentage - a.percentage);
  } catch (error) {
    console.error('GitHub Language API Error:', error);
    return [];
  }
};
