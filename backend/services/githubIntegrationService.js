const axios = require('axios');

class GitHubIntegrationService {
    constructor() {
        this.clientId = process.env.GITHUB_INTEGRATION_CLIENT_ID;
        this.clientSecret = process.env.GITHUB_INTEGRATION_CLIENT_SECRET;
        this.baseURL = 'https://api.github.com';
        
        // Debug log to verify integration service initialization
        console.log('DEBUG: GitHub Integration Service initialized:', {
            clientId: this.clientId ? 'SET' : 'NOT SET',
            clientSecret: this.clientSecret ? 'SET' : 'NOT SET'
        });
        
        if (!this.clientId || !this.clientSecret) {
            console.error('ERROR: GitHub Integration Service missing credentials');
        }
    }

    /**
     * Exchange authorization code for access token (Integration App)
     */
    async getAccessToken(code) {
        try {
            const response = await axios.post('https://github.com/login/oauth/access_token', {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code: code,
            }, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Shard-Platform-Integration'
                }
            });

            if (response.data.error) {
                throw new Error(`GitHub OAuth error: ${response.data.error_description}`);
            }

            return response.data.access_token;
        } catch (error) {
            console.error('GitHub integration access token error:', error.response?.data || error.message);
            throw new Error('Failed to get GitHub integration access token');
        }
    }

    /**
     * Get GitHub user information using integration access token
     * @param {string} accessToken - GitHub OAuth access token
     * @returns {Promise<Object>} GitHub user information
     */
    async getGitHubUser(accessToken) {
        try {
            const response = await axios.get(`${this.baseURL}/user`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Shard-Platform-Integration'
                }
            });

            return response.data;
        } catch (error) {
            console.error('GitHub integration user fetch error:', error.response?.data || error.message);
            throw new Error('Failed to get GitHub user information');
        }
    }

    /**
     * Get repository contents
     * @param {string} accessToken - GitHub OAuth access token
     * @param {string} username - GitHub username
     * @param {string} repo - Repository name
     * @param {string} [path=''] - Path within the repository
     * @returns {Promise<Array>} List of repository contents
     */
    async getRepositoryContents(accessToken, username, repo, path = '') {
        try {
            // Log the request details for debugging
            console.log('Fetching repository contents:', { username, repo, path });
            
            // Clean up the path to prevent double slashes
            const cleanPath = path.replace(/^\/+|\/+$/g, '');
            const url = `${this.baseURL}/repos/${username}/${repo}/contents${cleanPath ? `/${cleanPath}` : ''}`;
            
            console.log('GitHub API URL:', url);
            
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `token ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Shard-Platform-Integration'
                },
                validateStatus: status => status < 500 // Don't throw for 4xx errors
            });

            if (response.status === 404) {
                console.error('Repository or path not found:', { username, repo, path });
                return [];
            }

            if (response.status !== 200) {
                console.error('GitHub API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: response.data
                });
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }

            const contents = Array.isArray(response.data) ? response.data : [response.data];
            
            // Filter for directories only
            const directories = contents
                .filter(item => item.type === 'dir')
                .map(item => ({
                    name: item.name,
                    path: item.path,
                    type: item.type,
                    size: item.size,
                    download_url: item.download_url,
                    _links: item._links
                }));
                
            console.log(`Found ${directories.length} directories in ${path || 'root'}`);
            return directories;
            
        } catch (error) {
            console.error('GitHub repository contents error:', {
                message: error.message,
                response: error.response?.data,
                stack: error.stack
            });
            throw new Error(`Failed to get repository contents: ${error.message}`);
        }
    }

    /**
     * List user repositories with integration access token
     */
    async listUserRepos(accessToken, page = 1, perPage = 30) {
        try {
            const response = await axios.get(`${this.baseURL}/user/repos`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Shard-Platform-Integration'
                },
                params: {
                    sort: 'updated',
                    direction: 'desc',
                    per_page: perPage,
                    page: page,
                    type: 'all'
                }
            });

            return response.data.map(repo => ({
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                description: repo.description,
                private: repo.private,
                html_url: repo.html_url,
                clone_url: repo.clone_url,
                ssh_url: repo.ssh_url,
                default_branch: repo.default_branch,
                language: repo.language,
                stargazers_count: repo.stargazers_count,
                forks_count: repo.forks_count,
                updated_at: repo.updated_at,
                created_at: repo.created_at,
                owner: {
                    login: repo.owner.login,
                    avatar_url: repo.owner.avatar_url
                }
            }));
        } catch (error) {
            console.error('GitHub integration repos fetch error:', error.response?.data || error.message);
            throw new Error('Failed to fetch GitHub repositories');
        }
    }

    /**
     * Get repository details
     */
    async getRepository(accessToken, owner, repo) {
        try {
            const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Shard-Platform-Integration'
                }
            });

            return response.data;
        } catch (error) {
            console.error('GitHub integration repo fetch error:', error.response?.data || error.message);
            throw new Error('Failed to fetch repository details');
        }
    }

    /**
     * Get repository branches
     */
    async getBranches(accessToken, owner, repo) {
        try {
            const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/branches`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Shard-Platform-Integration'
                }
            });

            return response.data;
        } catch (error) {
            console.error('GitHub integration branches fetch error:', error.response?.data || error.message);
            throw new Error('Failed to fetch repository branches');
        }
    }

    /**
     * Validate access token
     */
    async validateToken(accessToken) {
        try {
            const response = await axios.get(`${this.baseURL}/user`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Shard-Platform-Integration'
                }
            });

            return !!response.data.id;
        } catch (error) {
            return false;
        }
    }
}

module.exports = new GitHubIntegrationService();
