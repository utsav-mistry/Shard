const EnvVar = require("../models/EnvVar");
const Project = require("../models/Project");
const { encrypt, decrypt } = require("../utils/encryptor");

// Create env variable
const addEnvVar = async (projectId, key, value, secret = false) => {
    const session = await EnvVar.startSession();
    session.startTransaction();
    
    try {
        // Check if variable with same key already exists for this project
        const existingVar = await EnvVar.findOne({ projectId, key });
        if (existingVar) {
            throw new Error(`Environment variable '${key}' already exists for this project`);
        }

        const encryptedValue = encrypt(value);

        // Create the environment variable
        const [envVar] = await EnvVar.create([{
            projectId,
            key,
            value: encryptedValue,
            secret
        }], { session });

        // Add environment variable ID to project's envVars array
        await Project.findByIdAndUpdate(
            projectId,
            { 
                $addToSet: { 'settings.envVars': envVar._id }
            },
            { 
                new: true,
                session
            }
        );

        await session.commitTransaction();
        return envVar;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

// Get all env variables for a project
const getEnvVars = async (projectId) => {
    // Get all environment variables for the project
    const envVars = await EnvVar.find({ projectId }).sort({ createdAt: -1 });

    return envVars.map((env) => ({
        _id: env._id,
        key: env.key,
        value: decrypt(env.value),
        secret: env.secret || false,
        createdAt: env.createdAt
    }));
};

// Get env var by ID (for ownership verification and editing)
const getEnvVarById = async (envVarId) => {
    const envVar = await EnvVar.findById(envVarId);
    if (!envVar) return null;
    
    // Decrypt the value for editing
    const decryptedValue = decrypt(envVar.value);
    return {
        ...envVar.toObject(),
        value: decryptedValue
    };
};

// Update a specific env var
const updateEnvVar = async (envVarId, key, value, secret = false) => {
    const session = await EnvVar.startSession();
    session.startTransaction();
    
    try {
        // Get the current env var to check project ownership
        const currentEnvVar = await EnvVar.findById(envVarId).session(session);
        if (!currentEnvVar) {
            throw new Error('Environment variable not found');
        }

        // Check if another variable with same key exists for this project (excluding current one)
        const existingVar = await EnvVar.findOne({ 
            projectId: currentEnvVar.projectId, 
            key, 
            _id: { $ne: envVarId } 
        }).session(session);
        
        if (existingVar) {
            throw new Error(`Environment variable '${key}' already exists for this project`);
        }

        const encryptedValue = encrypt(value);

        // Update the environment variable
        const updatedEnvVar = await EnvVar.findByIdAndUpdate(
            envVarId,
            {
                key,
                value: encryptedValue,
                secret,
                updatedAt: new Date()
            },
            { 
                new: true,
                session
            }
        );

        await session.commitTransaction();
        return updatedEnvVar;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

// Delete a specific env var
const deleteEnvVar = async (envVarId) => {
    const session = await EnvVar.startSession();
    session.startTransaction();
    
    try {
        // Find and delete the environment variable
        const envVar = await EnvVar.findByIdAndDelete(envVarId).session(session);
        if (!envVar) {
            throw new Error('Environment variable not found');
        }

        // Remove from project's envVars array if it exists there
        await Project.updateOne(
            { _id: envVar.projectId },
            { $pull: { 'settings.envVars': envVarId } },
            { session }
        );
        
        await session.commitTransaction();
        return envVar;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

module.exports = {
    addEnvVar,
    getEnvVars,
    getEnvVarById,
    updateEnvVar,
    deleteEnvVar
};
