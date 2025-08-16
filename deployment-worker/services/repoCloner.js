import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cloneRepo = async (repoUrl, projectId) => {
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

    console.log("Cloning repo:", repoUrl);
    await git.clone(repoUrl, projectPath);
    console.log("Repo cloned to:", projectPath);

    return projectPath;
};

export { cloneRepo };
