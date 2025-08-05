const simpleGit = require("simple-git");
const fs = require("fs");
const path = require("path");

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

module.exports = { cloneRepo };
