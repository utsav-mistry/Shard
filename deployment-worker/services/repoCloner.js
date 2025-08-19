/**
 * @fileoverview Repository Cloning Service
 * @description Service for cloning Git repositories with commit metadata extraction
 * @author Utsav Mistry
 * @version 0.2.3
 */

const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const StreamingLogger = require('../utils/streamingLogger');

/**
 * Clone a Git repository with commit metadata extraction
 * @async
 * @function cloneRepo
 * @param {string} repoUrl - Git repository URL to clone
 * @param {string} projectId - Unique project identifier for directory naming
 * @param {string} [branch='main'] - Git branch to clone
 * @param {Object} [socket=null] - Socket.io connection for streaming logs
 * @returns {Promise<Object>} Repository information and metadata
 * @returns {string} returns.path - Absolute path to cloned repository
 * @returns {string} returns.uniqueId - Unique identifier for this clone
 * @returns {string} returns.commitHash - Latest commit hash
 * @returns {string} returns.commitMessage - Latest commit message
 * @returns {string} returns.author - Commit author name
 * @returns {string} returns.date - Commit timestamp
 * @throws {Error} Git clone or file system errors
 * @description Clones repository to unique timestamped directory and extracts latest commit info.
 * Supports both streaming (with socket) and standard cloning modes.
 * @example
 * const repoInfo = await cloneRepo(
 *   'https://github.com/user/repo.git',
 *   'proj123',
 *   'main',
 *   socket
 * );
 * console.log(`Cloned to: ${repoInfo.path}`);
 * console.log(`Latest commit: ${repoInfo.commitHash}`);
 */
const cloneRepo = async (repoUrl, projectId, branch = 'main', socket = null) => {
    const basePath = path.join(__dirname, "..", "repos");
    // Create unique identifier for each repo clone
    const timestamp = Date.now();
    const uniqueId = `${projectId}-${timestamp}`;
    const projectPath = path.join(basePath, uniqueId);

    // Create repos directory if not exists
    if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath, { recursive: true });
    }

    // Clean previous clone if exists
    if (fs.existsSync(projectPath)) {
        fs.rmSync(projectPath, { recursive: true, force: true });
    }

    // Use streaming logger if socket is provided
    if (socket) {
        const streamLogger = new StreamingLogger(socket, projectId, 'clone');
        
        try {
            await streamLogger.cloneRepository(repoUrl, projectPath, branch);
            
            // Get commit information using simple-git
            const repoGit = simpleGit(projectPath);
            const log = await repoGit.log(['-1']);
            const latestCommit = log.latest;

            streamLogger.emitLog(`Retrieved commit info: ${latestCommit.hash.substring(0, 8)} - ${latestCommit.message}`, 'success', 'clone');

            return {
                path: projectPath,
                uniqueId: uniqueId,
                commitHash: latestCommit.hash,
                commitMessage: latestCommit.message,
                author: latestCommit.author_name,
                date: latestCommit.date
            };
        } catch (error) {
            throw new Error(`Repository clone failed: ${error.message}`);
        }
    } else {
        // Fallback to original simple-git method for backward compatibility
        const git = simpleGit();

        console.log("Cloning repo:", repoUrl, "branch:", branch);
        await git.clone(repoUrl, projectPath, ['--branch', branch]);
        console.log("Repo cloned to:", projectPath);

        // Get commit information
        const repoGit = simpleGit(projectPath);
        const log = await repoGit.log(['-1']); // Get latest commit
        const latestCommit = log.latest;

        return {
            path: projectPath,
            uniqueId: uniqueId,
            commitHash: latestCommit.hash,
            commitMessage: latestCommit.message,
            author: latestCommit.author_name,
            date: latestCommit.date
        };
    }
};

/**
 * Export repository cloning functions
 * @module repoCloner
 * @description Service for Git repository cloning with metadata extraction
 */
module.exports = { cloneRepo };
