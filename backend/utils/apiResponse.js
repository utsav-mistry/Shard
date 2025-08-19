/**
 * @fileoverview API Response Utilities
 * @description Provides consistent response formatting for all API endpoints
 * @module utils/apiResponse
 * @author Utsav Mistry
 * @version 1.0.0
 */

/**
 * Sends a successful API response with data
 * @function success
 * @param {Object} res - Express response object
 * @param {*} data - Response data to send
 * @param {string} [message='Success'] - Optional success message
 * @param {number} [statusCode=200] - HTTP status code (default: 200)
 * @param {Object} [meta=null] - Additional metadata (pagination, etc.)
 * @returns {Object} Formatted JSON response
 * @example
 * // Basic success response
 * success(res, { id: 1, name: 'Example' });
 * 
 * // With custom message and status code
 * success(res, { id: 1 }, 'Item created', 201);
 */
function success(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    const response = {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || res.req?.id
    };

    if (meta) {
        response.meta = meta;
    }

    return res.status(statusCode).json(response);
}

/**
 * Sends an error response
 * @function error
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} [statusCode=400] - HTTP status code (default: 400)
 * @param {*} [errors=null] - Additional error details or validation errors
 * @param {string} [errorCode=null] - Application-specific error code
 * @returns {Object} Formatted error response
 * @example
 * // Basic error response
 * error(res, 'Item not found', 404);
 * 
 * // With validation errors
 * error(res, 'Validation failed', 400, {
 *   email: 'Invalid email format',
 *   password: 'Must be at least 8 characters'
 * });
 */
function error(res, message = 'An error occurred', statusCode = 400, errors = null, errorCode = null) {
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || res.req?.id
    };

    if (errors) {
        response.errors = errors;
    }

    if (errorCode) {
        response.errorCode = errorCode;
    }

    return res.status(statusCode).json(response);
}

/**
 * Sends a validation error response
 * @function validationError
 * @param {Object} res - Express response object
 * @param {Object} validationErrors - Validation error details
 * @param {string} [message='Validation failed'] - Optional error message
 * @returns {Object} Formatted error response
 * @example
 * validationError(res, {
 *   email: 'Invalid email format',
 *   password: 'Must be at least 8 characters'
 * });
 */
function validationError(res, validationErrors, message = 'Validation failed') {
    return error(res, message, 422, validationErrors, 'VALIDATION_ERROR');
}

/**
 * Sends a not found response
 * @function notFound
 * @param {Object} res - Express response object
 * @param {string} [resource='Resource'] - Optional resource name
 * @returns {Object} Formatted error response
 * @example
 * notFound(res, 'User');
 */
function notFound(res, resource = 'Resource') {
    return error(res, `${resource} not found`, 404, null, 'NOT_FOUND');
}

/**
 * Sends an unauthorized response
 * @function unauthorized
 * @param {Object} res - Express response object
 * @param {string} [message='Unauthorized access'] - Optional error message
 * @returns {Object} Formatted error response
 * @example
 * unauthorized(res, 'Invalid credentials');
 */
function unauthorized(res, message = 'Unauthorized access') {
    return error(res, message, 401, null, 'UNAUTHORIZED');
}

/**
 * Sends a forbidden response
 * @function forbidden
 * @param {Object} res - Express response object
 * @param {string} [message='Access forbidden'] - Optional error message
 * @returns {Object} Formatted error response
 * @example
 * forbidden(res, 'Insufficient permissions');
 */
function forbidden(res, message = 'Access forbidden') {
    return error(res, message, 403, null, 'FORBIDDEN');
}

/**
 * Sends an internal server error response
 * @function serverError
 * @param {Object} res - Express response object
 * @param {string} [message='Internal server error'] - Optional error message
 * @param {*} [errorDetails=null] - Additional error details (only in development)
 * @returns {Object} Formatted error response
 * @example
 * serverError(res, 'Database connection failed');
 */
function serverError(res, message = 'Internal server error', errorDetails = null) {
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || res.req?.id,
        errorCode: 'INTERNAL_ERROR'
    };

    // Only include error details in development
    if (process.env.NODE_ENV === 'development' && errorDetails) {
        response.errorDetails = errorDetails;
    }

    return res.status(500).json(response);
}

/**
 * Sends a paginated response
 * @function paginated
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination info
 * @param {string} [message='Success'] - Optional success message
 * @returns {Object} Formatted JSON response
 * @example
 * paginated(res, [{ id: 1, name: 'Example' }], { page: 1, limit: 10 });
 */
function paginated(res, data, pagination, message = 'Success') {
    const meta = {
        pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            total: pagination.total || data.length,
            totalPages: Math.ceil((pagination.total || data.length) / (pagination.limit || 10)),
            hasNext: pagination.hasNext || false,
            hasPrev: pagination.hasPrev || false
        }
    };

    return success(res, data, message, 200, meta);
}

/**
 * Sends a created response (201)
 * @function created
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} [message='Resource created successfully'] - Optional success message
 * @returns {Object} Formatted JSON response
 * @example
 * created(res, { id: 1, name: 'Example' });
 */
function created(res, data, message = 'Resource created successfully') {
    return success(res, data, message, 201);
}

/**
 * Sends a no content response (204)
 * @function noContent
 * @param {Object} res - Express response object
 * @returns {void}
 * @example
 * noContent(res);
 */
function noContent(res) {
    return res.status(204).send();
}

/**
 * Middleware to add response helpers to res object
 * @function addResponseHelpers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
function addResponseHelpers(req, res, next) {
    res.apiSuccess = (data, message, statusCode, meta) => success(res, data, message, statusCode, meta);
    res.apiError = (message, statusCode, errors, errorCode) => error(res, message, statusCode, errors, errorCode);
    res.apiValidationError = (validationErrors, message) => validationError(res, validationErrors, message);
    res.apiNotFound = (resource) => notFound(res, resource);
    res.apiUnauthorized = (message) => unauthorized(res, message);
    res.apiForbidden = (message) => forbidden(res, message);
    res.apiServerError = (message, errorDetails) => serverError(res, message, errorDetails);
    res.apiPaginated = (data, pagination, message) => paginated(res, data, pagination, message);
    res.apiCreated = (data, message) => created(res, data, message);
    res.apiNoContent = () => noContent(res);

    next();
}

/**
 * @namespace apiResponse
 * @description Collection of response utility functions
 */
module.exports = {
    success,
    error,
    validationError,
    notFound,
    unauthorized,
    forbidden,
    serverError,
    paginated,
    created,
    noContent,
    addResponseHelpers
};