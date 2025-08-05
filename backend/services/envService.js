const EnvVar = require("../models/EnvVar");
const { encrypt, decrypt } = require("../utils/encryptor");

// Create env variable
const addEnvVar = async (projectId, key, value) => {
    const encryptedValue = encrypt(value);

    const envVar = await EnvVar.create({
        projectId,
        key,
        value: encryptedValue,
    });

    return envVar;
};

// Get all env variables for a project
const getEnvVars = async (projectId) => {
    const envVars = await EnvVar.find({ projectId });

    return envVars.map((env) => ({
        _id: env._id,
        key: env.key,
        value: decrypt(env.value),
    }));
};

// Delete a specific env var
const deleteEnvVar = async (envVarId) => {
    await EnvVar.findByIdAndDelete(envVarId);
};

module.exports = {
    addEnvVar,
    getEnvVars,
    deleteEnvVar
};
