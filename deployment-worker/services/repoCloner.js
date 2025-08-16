import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cloneRepo = async (repoUrl, projectId, branch = 'main') => {
    const basePath = path.join(__dirname, "..", "repos");
    const projectPath = path.join(basePath, projectId);

    // Create repos directory if not exists
    if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath);
    }

    // Clean previous clone if exists
    if (fs.existsSync(projectPath)) {
        fs.rmSync(projectPath, { recursive: true, force: true });
    }

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
        commitHash: latestCommit.hash,
        commitMessage: latestCommit.message,
        author: latestCommit.author_name,
        date: latestCommit.date
    };
};

export { cloneRepo };
