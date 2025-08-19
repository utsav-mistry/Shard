/**
 * @fileoverview AI Service Integration
 * @description Provides AI-powered repository analysis, code review, and Dockerfile generation
 * @module services/aiService
 * @requires axios
 * @requires ../utils/logger
 * @requires ./githubService
 * @author Utsav Mistry
 * @version 1.0.0
 */

const axios = require('axios');
const logger = require('../utils/logger');
const githubService = require('./githubService');

// AI service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_API_KEY = process.env.AI_API_KEY;
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Analyzes repository structure and content to determine project type and requirements
 * @async
 * @function analyzeRepository
 * @param {string} accessToken - GitHub access token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} [branch='main'] - Branch to analyze
 * @param {string} [path=''] - Path within repository
 * @returns {Promise<Object>} Analysis result with framework detection and recommendations
 * @example
 * const analysis = await analyzeRepository(token, 'user', 'my-repo', 'main');
 * console.log(analysis.framework); // 'nextjs', 'node', 'python', etc.
 */
const analyzeRepository = async (accessToken, owner, repo, branch = 'main', path = '') => {
    try {
        // First, try to determine project type from repository contents
        const contents = await githubService.listRepoContents(accessToken, owner, repo, path, branch);

        // Look for common configuration files to determine project type
        const configFiles = {
            'package.json': 'node',
            'requirements.txt': 'python',
            'pom.xml': 'java',
            'build.gradle': 'java',
            'go.mod': 'go',
            'Cargo.toml': 'rust',
            'Gemfile': 'ruby',
            'composer.json': 'php',
            'Dockerfile': 'docker',
            'docker-compose.yml': 'docker',
            'next.config.js': 'nextjs',
            'nuxt.config.js': 'nuxtjs',
            'gatsby-config.js': 'gatsby',
            'vue.config.js': 'vue',
            'angular.json': 'angular',
            'svelte.config.js': 'svelte',
        };

        // Detect framework and package manager
        let framework = 'static';
        let packageManager = null;
        let buildCommand = null;
        let startCommand = null;
        let installCommand = null;

        // Check for framework-specific files
        for (const [file, detectedFramework] of Object.entries(configFiles)) {
            if (contents.some(item => item.name === file)) {
                framework = detectedFramework;

                // Set package manager based on framework
                if (['node', 'nextjs', 'nuxtjs', 'gatsby', 'vue', 'angular', 'svelte'].includes(detectedFramework)) {
                    // Check for package-lock.json or yarn.lock to determine package manager
                    const hasYarnLock = contents.some(item => item.name === 'yarn.lock');
                    packageManager = hasYarnLock ? 'yarn' : 'npm';

                    // Set default commands
                    installCommand = hasYarnLock ? 'yarn install --frozen-lockfile' : 'npm ci';
                    buildCommand = hasYarnLock ? 'yarn build' : 'npm run build';
                    startCommand = hasYarnLock ? 'yarn start' : 'npm start';
                } else if (detectedFramework === 'python') {
                    packageManager = 'pip';
                    installCommand = 'pip install -r requirements.txt';
                    startCommand = 'python app.py'; // This is just a guess, will be refined
                }

                break;
            }
        }

        // Special handling for specific frameworks
        if (framework === 'node') {
            // Check for common frameworks
            try {
                const pkgJson = contents.find(item => item.name === 'package.json');
                if (pkgJson) {
                    const fileContent = await githubService.getFileContent(accessToken, owner, repo, pkgJson.path, branch);
                    const pkg = JSON.parse(Buffer.from(fileContent.content, 'base64').toString('utf8'));

                    // Check for framework-specific dependencies
                    if (pkg.dependencies?.next) framework = 'nextjs';
                    else if (pkg.dependencies?.nuxt) framework = 'nuxtjs';
                    else if (pkg.dependencies?.gatsby) framework = 'gatsby';
                    else if (pkg.dependencies?.vue) framework = 'vue';
                    else if (pkg.dependencies?.['@angular/core']) framework = 'angular';
                    else if (pkg.dependencies?.['svelte']) framework = 'svelte';

                    // Update commands based on package.json scripts
                    if (pkg.scripts) {
                        if (pkg.scripts.build) buildCommand = `${packageManager} run build`;
                        if (pkg.scripts.start) startCommand = `${packageManager} start`;
                        else if (pkg.scripts.dev) startCommand = `${packageManager} run dev`;
                    }
                }
            } catch (error) {
                logger.error('Error analyzing package.json:', error);
            }
        }

        // Analyze for environment variables
        const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
        const envVars = [];

        for (const envFile of envFiles) {
            const envContent = contents.find(item => item.name === envFile);
            if (envContent) {
                try {
                    const fileContent = await githubService.getFileContent(accessToken, owner, repo, envContent.path, branch);
                    const envContentStr = Buffer.from(fileContent.content, 'base64').toString('utf8');

                    // Simple regex to find environment variables
                    const envVarsInFile = envContentStr
                        .split('\n')
                        .filter(line => line && !line.startsWith('#') && line.includes('='))
                        .map(line => {
                            const [key, ...valueParts] = line.split('=');
                            const value = valueParts.join('=').replace(/['"]/g, '').trim();
                            return { key, value, isSecret: true };
                        });

                    envVars.push(...envVarsInFile);
                } catch (error) {
                    logger.error(`Error reading ${envFile}:`, error);
                }
            }
        }

        // Get deployment recommendations
        const recommendations = await getAIRepositoryAnalysis({
            owner,
            repo,
            branch,
            path,
            framework,
            packageManager,
            hasDocker: contents.some(item => ['Dockerfile', 'docker-compose.yml'].includes(item.name)),
        });

        return {
            success: true,
            analysis: {
                framework,
                packageManager,
                buildCommand: recommendations.buildCommand || buildCommand,
                startCommand: recommendations.startCommand || startCommand,
                installCommand: recommendations.installCommand || installCommand,
                envVars: [...new Map(envVars.map(item => [item.key, item])).values()], // Remove duplicates
                recommendations: recommendations.suggestions || [],
                detectedFiles: contents.map(item => item.name),
                ...recommendations,
            },
        };
    } catch (error) {
        logger.error('Repository analysis failed:', error);
        return {
            success: false,
            error: error.message || 'Failed to analyze repository',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        };
    }
};

/**
 * Gets AI-powered analysis of the repository
 * @async
 * @function getAIRepositoryAnalysis
 * @param {Object} repoInfo - Repository information object
 * @param {string} repoInfo.owner - Repository owner
 * @param {string} repoInfo.repo - Repository name
 * @param {string} repoInfo.framework - Detected framework
 * @param {string} repoInfo.packageManager - Package manager (npm, yarn, pip)
 * @param {boolean} repoInfo.hasDocker - Whether Docker files are present
 * @returns {Promise<Object>} AI analysis with build commands and suggestions
 * @throws {Error} Falls back to default recommendations if AI service fails
 */
const getAIRepositoryAnalysis = async (repoInfo) => {
    try {
        if (!AI_API_KEY) {
            logger.warn('AI_API_KEY not set, using default recommendations');
            return getDefaultRecommendations(repoInfo);
        }

        const response = await axios({
            method: 'post',
            url: `${AI_SERVICE_URL}/analyze`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`,
            },
            data: repoInfo,
            timeout: DEFAULT_TIMEOUT,
        });

        return response.data;
    } catch (error) {
        logger.error('AI analysis failed, falling back to default recommendations:', error);
        return getDefaultRecommendations(repoInfo);
    }
};

/**
 * Generates default recommendations when AI service is not available
 * @function getDefaultRecommendations
 * @param {Object} repoInfo - Repository information object
 * @param {string} repoInfo.framework - Detected framework
 * @param {string} repoInfo.packageManager - Package manager
 * @returns {Object} Default build and deployment recommendations
 */
const getDefaultRecommendations = (repoInfo) => {
    const { framework, packageManager } = repoInfo;
    const recommendations = {
        buildCommand: null,
        startCommand: null,
        installCommand: null,
        suggestions: [],
    };

    switch (framework) {
        case 'nextjs':
            recommendations.buildCommand = 'next build';
            recommendations.startCommand = 'next start -p $PORT';
            recommendations.installCommand = packageManager === 'yarn'
                ? 'yarn install --frozen-lockfile'
                : 'npm ci';
            recommendations.suggestions.push('Next.js detected. Using optimized build and start commands.');
            break;

        case 'node':
            recommendations.startCommand = 'node index.js';
            recommendations.installCommand = packageManager === 'yarn'
                ? 'yarn install --frozen-lockfile'
                : 'npm ci';
            recommendations.suggestions.push('Node.js application detected. Make sure your package.json has the correct start script.');
            break;

        case 'python':
            recommendations.installCommand = 'pip install -r requirements.txt';
            recommendations.startCommand = 'python app.py';
            recommendations.suggestions.push('Python application detected. Make sure you have a requirements.txt file.');
            break;

        default:
            recommendations.suggestions.push('Could not determine framework. Using default settings.');
    }

    return recommendations;
};

/**
 * Reviews code for security vulnerabilities and best practices
 * @async
 * @function reviewCode
 * @param {string} code - Source code to review
 * @param {string} filePath - Path to the file being reviewed
 * @param {string} language - Programming language of the code
 * @returns {Promise<Object>} Review result with issues and suggestions
 * @example
 * const review = await reviewCode(sourceCode, 'src/app.js', 'javascript');
 * console.log(review.issues); // Array of security issues found
 */
const reviewCode = async (code, filePath, language) => {
    try {
        if (!AI_API_KEY) {
            return {
                success: true,
                issues: [],
                suggestions: ['AI_API_KEY not set, skipping code review'],
            };
        }

        const response = await axios({
            method: 'post',
            url: `${AI_SERVICE_URL}/review`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`,
            },
            data: { code, filePath, language },
            timeout: DEFAULT_TIMEOUT,
        });

        return response.data;
    } catch (error) {
        logger.error('Code review failed:', error);
        return {
            success: false,
            error: error.message || 'Failed to review code',
            issues: [],
        };
    }
};

/**
 * Generates a Dockerfile for the project based on detected framework
 * @async
 * @function generateDockerfile
 * @param {Object} repoInfo - Repository information object
 * @param {string} repoInfo.framework - Detected framework
 * @param {string} repoInfo.packageManager - Package manager
 * @returns {Promise<Object>} Generated Dockerfile content and suggestions
 * @example
 * const dockerfile = await generateDockerfile({ framework: 'nextjs', packageManager: 'npm' });
 * console.log(dockerfile.dockerfile); // Generated Dockerfile content
 */
const generateDockerfile = async (repoInfo) => {
    try {
        if (!AI_API_KEY) {
            return {
                success: true,
                dockerfile: generateDefaultDockerfile(repoInfo),
                suggestions: ['AI_API_KEY not set, using default Dockerfile'],
            };
        }

        const response = await axios({
            method: 'post',
            url: `${AI_SERVICE_URL}/generate-dockerfile`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`,
            },
            data: repoInfo,
            timeout: DEFAULT_TIMEOUT,
        });

        return response.data;
    } catch (error) {
        logger.error('Dockerfile generation failed:', error);
        return {
            success: false,
            error: error.message || 'Failed to generate Dockerfile',
            dockerfile: generateDefaultDockerfile(repoInfo),
        };
    }
};

/**
 * Generates a default Dockerfile based on framework when AI service is unavailable
 * @function generateDefaultDockerfile
 * @param {Object} repoInfo - Repository information object
 * @param {string} repoInfo.framework - Framework type (nextjs, node, python, etc.)
 * @returns {string} Default Dockerfile content as string
 */
const generateDefaultDockerfile = (repoInfo) => {
    const { framework } = repoInfo;

    switch (framework) {
        case 'nextjs':
            return `# Use an official Node.js runtime as the base image
FROM node:16-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Use a smaller image for production
FROM node:16-alpine

WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]`;

        case 'node':
            return `# Use an official Node.js runtime as the base image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]`;

        case 'python':
            return `# Use an official Python runtime as the base image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Start the application
CMD ["python", "app.py"]`;

        default:
            return `# Default Dockerfile
# This is a basic Dockerfile. Please customize it according to your application's needs.

# Use an appropriate base image
FROM alpine:latest

# Set the working directory
WORKDIR /app

# Copy application files
COPY . .

# Install dependencies and build steps would go here
# Example:
# RUN npm install && npm run build

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["echo", "Please customize this Dockerfile for your application"]`;
    }
};

/**
 * @namespace aiService
 * @description AI-powered development services for repository analysis and code review
 */
module.exports = {
    analyzeRepository,
    reviewCode,
    generateDockerfile,
    getAIRepositoryAnalysis,
    getDefaultRecommendations,
    generateDefaultDockerfile
};
