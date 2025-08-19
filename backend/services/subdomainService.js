/**
 * @fileoverview Subdomain Service
 * @description Generates unique subdomains for deployed projects
 * @module services/subdomainService
 * @author Utsav Mistry
 * @version 1.0.0
 */

const adjectives = [
    "alpha", "sienna", "mint", "crimson", "onyx",
    "velvet", "aurora", "nova", "spectrum", "ember",
    "omega", "delta", "gamma", "pilot", "sandbox",
    "fusion", "launch", "staging", "core", "ignite",
    "pearl", "marble", "jet", "jade", "blush",
    "taupe", "fog", "slate", "drift", "glow",
    "aether", "halo", "orbit", "pulse", "quantum",
    "draco", "astro", "nimbus", "flux", "phase",
    "grove", "fern", "bloom", "moss", "stone",
    "clay", "leaf", "wave", "petal", "pine",
    "neon", "lunar", "matrix", "vector", "opal",
    "topaz", "cinder", "smoke", "dusk", "dawn",
    "frost", "emberglow", "storm", "mist", "shard",
    "crystal", "echo", "rift", "spire", "veil",
    "solace", "emberwind", "glimmer", "horizon", "zephyr",
    "whisper", "emberstone", "verdant", "sable", "copper",
    "brimstone", "onyxshade", "lilac", "sage", "breeze",
    "silver", "moonstone", "sunset", "twilight", "shadow",
    "fable", "mirage", "driftwood", "cobalt", "obsidian",
    "tide", "ripple", "petalstone", "wildflower", "meadow",
    "pinecone", "harbor", "canopy", "stormcloud", "thistle",
    "glade", "emberleaf", "mistwood", "aurorae", "starlight"
];


/**
 * Generates a unique subdomain for a project
 * @function generateSubdomain
 * @param {string} projectName - Name of the project
 * @returns {string} Generated subdomain in format: projectname-adjective
 * @example
 * const subdomain = generateSubdomain('My App');
 * console.log(subdomain); // 'my-app-aurora'
 */
const generateSubdomain = (projectName) => {
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const cleanedName = projectName.toLowerCase().replace(/\s+/g, "-");

    return `${cleanedName}-${randomAdj}`;
};

/**
 * @namespace subdomainService
 * @description Service for generating unique project subdomains
 */
module.exports = { generateSubdomain };
