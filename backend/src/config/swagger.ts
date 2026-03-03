// backend/src/config/swagger.ts

export const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'StatVision API',
            version: '1.0.0',
            description: 'API documentation for the StatVision backend application',
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:3000',
                description: 'API server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Game: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string', example: 'Finals 2026' },
                        userId: { type: 'string', example: 'firebaseUid123' },
                        status: { type: 'string', enum: ['UPLOADED', 'PROCESSING', 'ANALYZED', 'ASSIGNMENT_PENDING', 'COMPLETED', 'FAILED', 'ANALYSIS_FAILED_RETRYABLE'] },
                        gameType: { type: 'string', enum: ['FULL_COURT', 'THREE_X_THREE', 'STREET_BALL', 'ONE_X_ONE'] },
                        identityMode: { type: 'string', enum: ['JERSEY_COLORS', 'INTERACTION_BASED'] },
                        videoUrl: { type: 'string', nullable: true },
                        homeTeamId: { type: 'string', format: 'uuid', nullable: true },
                        awayTeamId: { type: 'string', format: 'uuid', nullable: true },
                        uploadedAt: { type: 'string', format: 'date-time' },
                    },
                },
                GameEvent: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        gameId: { type: 'string', format: 'uuid' },
                        assignedTeamId: { type: 'string', format: 'uuid', nullable: true },
                        assignedPlayerId: { type: 'string', format: 'uuid', nullable: true },
                        eventType: { type: 'string' },
                        absoluteTimestamp: { type: 'number', format: 'float' },
                    },
                },
                Team: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        userId: { type: 'string' },
                    },
                },
                Player: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        position: { type: 'string', nullable: true },
                    },
                },
            },
        },
        security: [{
            bearerAuth: [],
        }],
    },
    apis: ['./src/routes/*.ts'], // Path to the API docs
};
