const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const StreamingLogger = require('../utils/streamingLogger');

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

module.exports = { cloneRepo };
