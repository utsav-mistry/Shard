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
    "clay", "leaf", "wave", "petal", "pine"
];

const generateSubdomain = (projectName) => {
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const cleanedName = projectName.toLowerCase().replace(/\s+/g, "-");

    return `${cleanedName}-${randomAdj}`;
};

module.exports = { generateSubdomain };
  