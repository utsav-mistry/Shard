/**
 * @fileoverview Environment Variables Service
 * @description Manages encrypted environment variables for projects with CRUD operations
 * @module services/envService
 * @requires ../models/EnvVar
 * @requires ../models/Project
 * @requires ../utils/encryptor
 * @author Utsav Mistry
 * @version 1.0.0
 */

const EnvVar = require("../models/EnvVar");
const Project = require("../models/Project");
const { encrypt, decrypt } = require("../utils/encryptor");

/**
 * Creates a new environment variable for a project
 * @async
 * @function addEnvVar
 * @param {string} projectId - MongoDB ObjectId of the project
 * @param {string} key - Environment variable key (must be unique per project)
 * @param {string} value - Environment variable value (will be encrypted)
 * @param {boolean} [secret=false] - Whether the variable contains sensitive data
 * @returns {Promise<Object>} Created environment variable document
 * @throws {Error} If variable with same key already exists for project
 * @example
 * const envVar = await addEnvVar('507f1f77bcf86cd799439011', 'API_KEY', 'secret123', true);
 */
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

/**
 * Retrieves all environment variables for a project with decrypted values
 * @async
 * @function getEnvVars
 * @param {string} projectId - MongoDB ObjectId of the project
 * @returns {Promise<Array<Object>>} Array of environment variables with decrypted values
 * @example
 * const envVars = await getEnvVars('507f1f77bcf86cd799439011');
 * console.log(envVars); // [{ _id, key, value, secret, createdAt }]
 */
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

/**
 * Retrieves a specific environment variable by ID with decrypted value
 * @async
 * @function getEnvVarById
 * @param {string} envVarId - MongoDB ObjectId of the environment variable
 * @returns {Promise<Object|null>} Environment variable with decrypted value or null if not found
 * @example
 * const envVar = await getEnvVarById('507f1f77bcf86cd799439012');
 * if (envVar) {
 *   console.log(envVar.value); // Decrypted value
 * }
 */
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

/**
 * Updates an existing environment variable
 * @async
 * @function updateEnvVar
 * @param {string} envVarId - MongoDB ObjectId of the environment variable
 * @param {string} key - New environment variable key
 * @param {string} value - New environment variable value (will be encrypted)
 * @param {boolean} [secret=false] - Whether the variable contains sensitive data
 * @returns {Promise<Object>} Updated environment variable document
 * @throws {Error} If variable not found or key conflicts with existing variable
 * @example
 * const updated = await updateEnvVar('507f1f77bcf86cd799439012', 'NEW_API_KEY', 'newvalue', true);
 */
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

/**
 * Deletes an environment variable and removes it from the project
 * @async
 * @function deleteEnvVar
 * @param {string} envVarId - MongoDB ObjectId of the environment variable
 * @returns {Promise<Object>} Deleted environment variable document
 * @throws {Error} If environment variable not found
 * @example
 * const deleted = await deleteEnvVar('507f1f77bcf86cd799439012');
 * console.log('Deleted:', deleted.key);
 */
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

/**
 * @namespace envService
 * @description Service for managing encrypted environment variables with database transactions
 */
module.exports = {
    addEnvVar,
    getEnvVars,
    getEnvVarById,
    updateEnvVar,
    deleteEnvVar
};
