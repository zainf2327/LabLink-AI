import swaggerJSDoc from 'swagger-jsdoc';
import { swaggerSchemas, swaggerPaths } from './swaggerPaths.js';
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'LabLink AI API Documentation',
            version: '1.0.0',
            description: 'Technical API documentation for the LabLink AI backend application.',
            contact: {
                name: 'LabLink AI Support',
                email: 'support@lablink.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:5001/api/v1',
                description: 'Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT access token in the format: Bearer <token>',
                },
            },
            schemas: swaggerSchemas,
        },
        paths: swaggerPaths,
    },
    apis: [], // All paths defined explicitly in swaggerPaths.ts to keep route files clean
};
export const swaggerSpec = swaggerJSDoc(options);
