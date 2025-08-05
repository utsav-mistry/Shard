const Project = require("../models/Project");
const { generateSubdomain } = require("../services/subdomainService");

// Create New Project
const createProject = async (req, res) => {
    const { name, repoUrl, stack } = req.body;

    try {
        // Generate unique subdomain
        const subdomain = generateSubdomain(name);

        // Create new project document
        const project = await Project.create({
            ownerId: req.user._id,
            name,
            repoUrl,
            stack,
            subdomain,
        });

        res.status(201).json(project);
    } catch (err) {
        console.error("Project Creation Error:", err);
        res.status(500).json({ message: "Server error while creating project" });
    }
};

// Get all projects of current user
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ ownerId: req.user._id });
        res.json(projects);
    } catch (err) {
        console.error("Fetch Projects Error:", err);
        res.status(500).json({ message: "Server error while fetching projects" });
    }
};

module.exports = { createProject, getProjects };