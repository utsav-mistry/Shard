/**
 * Standardized API Response Utility
 * Ensures consistent response format across all endpoints
 */

/**
 * Success response format
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {Object} meta - Additional metadata (pagination, etc.)
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
 * Error response format
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {*} errors - Detailed error information
 * @param {string} errorCode - Application-specific error code
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
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Object} validationErrors - Validation error details
 * @param {string} message - Error message
 */
function validationError(res, validationErrors, message = 'Validation failed') {
    return error(res, message, 422, validationErrors, 'VALIDATION_ERROR');
}

/**
 * Not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name that was not found
 */
function notFound(res, resource = 'Resource') {
    return error(res, `${resource} not found`, 404, null, 'NOT_FOUND');
}

/**
 * Unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
function unauthorized(res, message = 'Unauthorized access') {
    return error(res, message, 401, null, 'UNAUTHORIZED');
}

/**
 * Forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
function forbidden(res, message = 'Access forbidden') {
    return error(res, message, 403, null, 'FORBIDDEN');
}

/**
 * Internal server error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} errorDetails - Error details (only in development)
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
 * Paginated response format
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
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
 * Created response (201)
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
function created(res, data, message = 'Resource created successfully') {
    return success(res, data, message, 201);
}

/**
 * No content response (204)
 * @param {Object} res - Express response object
 */
function noContent(res) {
    return res.status(204).send();
}

/**
 * Middleware to add response helpers to res object
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