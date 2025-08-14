const axios = require('axios');
const logger = require('../utils/logger');
const cacheService = require('../services/cacheService');

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_API = 'https://api.github.com';

/**
 * Create authenticated GitHub API client
 */
const createGitHubClient = (accessToken) => {
    return axios.create({
        baseURL: GITHUB_API,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });
};

/**
 * Exchanges OAuth code for GitHub access token
 */
const getAccessToken = async (code) => {
    const cacheKey = `github:token:${code}`;
    
    try {
        // Check cache first
        const cachedToken = await cacheService.get(cacheKey);
        if (cachedToken) {
            return cachedToken;
        }

        const response = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
            },
            {
                headers: { Accept: 'application/json' },
            }
        );

        const { access_token, expires_in } = response.data;
        
        // Cache the token with a TTL slightly less than its expiration
        if (access_token && expires_in) {
            await cacheService.set(cacheKey, access_token, expires_in - 60); // 1 minute buffer
        }

        return access_token;
    } catch (err) {
        logger.error('GitHub OAuth token exchange failed:', {
            error: err.response?.data || err.message,
            stack: err.stack,
        });
        throw new Error('Failed to authenticate with GitHub');
    }
};

/**
 * Fetches user's GitHub profile using access token
 */
const getGitHubUser = async (accessToken) => {
    const cacheKey = `github:user:${accessToken.substring(0, 10)}`;
    
    try {
        // Check cache
        const cachedUser = await cacheService.get(cacheKey);
        if (cachedUser) {
            return cachedUser;
        }

        const client = createGitHubClient(accessToken);
        const response = await client.get('/user');
        
        // Cache user data for 5 minutes
        await cacheService.set(cacheKey, response.data, 300);
        
        return response.data;
    } catch (err) {
        logger.error('Failed to fetch GitHub user:', {
            error: err.response?.data || err.message,
            stack: err.stack,
        });
        throw new Error('Failed to fetch GitHub user profile');
    }
};

/**
 * List user's repositories with pagination
 */
const listUserRepos = async (accessToken, { page = 1, perPage = 30 } = {}) => {
    const cacheKey = `github:repos:${accessToken.substring(0, 10)}:${page}:${perPage}`;
    
    try {
        // Check cache
        const cachedRepos = await cacheService.get(cacheKey);
        if (cachedRepos) {
            return cachedRepos;
        }

        const client = createGitHubClient(accessToken);
        const response = await client.get('/user/repos', {
            params: {
                sort: 'updated',
                direction: 'desc',
                per_page: perPage,
                page,
            },
        });

        const repos = response.data.map(repo => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            description: repo.description,
            url: repo.html_url,
            defaultBranch: repo.default_branch,
            owner: repo.owner.login,
            createdAt: repo.created_at,
            updatedAt: repo.updated_at,
            pushedAt: repo.pushed_at,
            size: repo.size,
            language: repo.language,
            forks: repo.forks_count,
            stars: repo.stargazers_count,
            watchers: repo.watchers_count,
            openIssues: repo.open_issues_count,
        }));

        // Cache for 5 minutes
        await cacheService.set(cacheKey, repos, 300);
        
        return repos;
    } catch (err) {
        logger.error('Failed to list GitHub repositories:', {
            error: err.response?.data || err.message,
            stack: err.stack,
        });
        throw new Error('Failed to fetch repositories');
    }
};

/**
 * Get repository details
 */
const getRepo = async (accessToken, owner, repo) => {
    const cacheKey = `github:repo:${owner}/${repo}`;
    
    try {
        // Check cache
        const cachedRepo = await cacheService.get(cacheKey);
        if (cachedRepo) {
            return cachedRepo;
        }

        const client = createGitHubClient(accessToken);
        const response = await client.get(`/repos/${owner}/${repo}`);
        
        const repoData = {
            id: response.data.id,
            name: response.data.name,
            fullName: response.data.full_name,
            private: response.data.private,
            description: response.data.description,
            url: response.data.html_url,
            defaultBranch: response.data.default_branch,
            owner: response.data.owner.login,
            createdAt: response.data.created_at,
            updatedAt: response.data.updated_at,
            pushedAt: response.data.pushed_at,
            size: response.data.size,
            language: response.data.language,
            forks: response.data.forks_count,
            stars: response.data.stargazers_count,
            watchers: response.data.watchers_count,
            openIssues: response.data.open_issues_count,
            permissions: response.data.permissions,
        };

        // Cache for 15 minutes
        await cacheService.set(cacheKey, repoData, 900);
        
        return repoData;
    } catch (err) {
        logger.error(`Failed to fetch repository ${owner}/${repo}:`, {
            error: err.response?.data || err.message,
            stack: err.stack,
        });
        throw new Error(`Failed to fetch repository: ${repo}`);
    }
};

/**
 * List repository contents at a given path
 */
const listRepoContents = async (accessToken, owner, repo, path = '', ref = 'main') => {
    const cacheKey = `github:contents:${owner}/${repo}:${path || 'root'}:${ref}`;
    
    try {
        // Check cache
        const cachedContents = await cacheService.get(cacheKey);
        if (cachedContents) {
            return cachedContents;
        }

        const client = createGitHubClient(accessToken);
        const response = await client.get(`/repos/${owner}/${repo}/contents/${path}`, {
            params: { ref },
        });

        const contents = response.data.map(item => ({
            name: item.name,
            path: item.path,
            type: item.type,
            size: item.size,
            sha: item.sha,
            url: item.html_url,
            gitUrl: item.git_url,
            downloadUrl: item.download_url,
        }));

        // Cache for 5 minutes
        await cacheService.set(cacheKey, contents, 300);
        
        return contents;
    } catch (err) {
        // If path doesn't exist, GitHub returns 404
        if (err.response?.status === 404) {
            return [];
        }
        
        logger.error(`Failed to list contents of ${owner}/${repo}/${path}:`, {
            error: err.response?.data || err.message,
            stack: err.stack,
        });
        throw new Error(`Failed to list directory: ${path}`);
    }
};

/**
 * Get file content from repository
 */
const getFileContent = async (accessToken, owner, repo, path, ref = 'main') => {
    const cacheKey = `github:file:${owner}/${repo}:${path}:${ref}`;
    
    try {
        // Check cache
        const cachedFile = await cacheService.get(cacheKey);
        if (cachedFile) {
            return cachedFile;
        }

        const client = createGitHubClient(accessToken);
        const response = await client.get(`/repos/${owner}/contents/${path}`, {
            params: { ref },
            headers: {
                'Accept': 'application/vnd.github.raw+json',
            },
        });

        const fileData = {
            name: path.split('/').pop(),
            path,
            content: response.data,
            encoding: 'base64',
            size: Buffer.byteLength(response.data, 'utf8'),
            sha: response.headers.etag,
            url: `https://github.com/${owner}/${repo}/blob/${ref}/${path}`,
        };

        // Cache for 15 minutes
        await cacheService.set(cacheKey, fileData, 900);
        
        return fileData;
    } catch (err) {
        logger.error(`Failed to fetch file ${owner}/${repo}/${path}:`, {
            error: err.response?.data || err.message,
            stack: err.stack,
        });
        throw new Error(`Failed to fetch file: ${path}`);
    }
};

/**
 * Get repository branches
 */
const listBranches = async (accessToken, owner, repo) => {
    const cacheKey = `github:branches:${owner}/${repo}`;
    
    try {
        // Check cache
        const cachedBranches = await cacheService.get(cacheKey);
        if (cachedBranches) {
            return cachedBranches;
        }

        const client = createGitHubClient(accessToken);
        const response = await client.get(`/repos/${owner}/${repo}/branches`);
        
        const branches = response.data.map(branch => ({
            name: branch.name,
            commit: branch.commit.sha,
            protected: branch.protected,
        }));

        // Cache for 15 minutes
        await cacheService.set(cacheKey, branches, 900);
        
        return branches;
    } catch (err) {
        logger.error(`Failed to list branches for ${owner}/${repo}:`, {
            error: err.response?.data || err.message,
            stack: err.stack,
        });
        throw new Error('Failed to fetch repository branches');
    }
};

module.exports = {
    getAccessToken,
    getGitHubUser,
    listUserRepos,
    getRepo,
    listRepoContents,
    getFileContent,
    listBranches,
};
