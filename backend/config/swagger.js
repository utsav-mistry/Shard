const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shard Platform API',
      version: '1.0.0',
      description: 'API documentation for the Shard Platform',
      contact: {
        name: 'Shard Support',
        url: 'https://github.com/yourusername/shard',
        email: 'support@shard.dev'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.shard.dev',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in the format: Bearer <token>'
        },
        oauth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: '/auth/github',
              tokenUrl: '/auth/github/callback',
              scopes: {
                'read:user': 'Read user profile',
                'repo': 'Full access to repositories'
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Unauthorized' },
                  message: { type: 'string', example: 'Authentication required' }
                }
              }
            }
          }
        },
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Bad Request' },
                  message: { type: 'string', example: 'Invalid input data' },
                  details: { type: 'object' }
                }
              }
            }
          }
        },
        NotFound: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Not Found' },
                  message: { type: 'string', example: 'The requested resource was not found' }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  // Paths to files containing OpenAPI definitions
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../models/*.js')
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs;
