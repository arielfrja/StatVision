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
                url: 'http://localhost:3000',
                description: 'Development server',
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
        },
        security: [{
            bearerAuth: [],
        }],
        schemas: {
            Game: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', example: 'firebaseUid123' },
                    status: { type: 'string', enum: ['UPLOADED', 'PROCESSING', 'ANALYZED', 'ASSIGNMENT_PENDING', 'COMPLETED', 'FAILED'] },
                    videoUrl: { type: 'string', nullable: true, example: '/path/to/local/video.mp4' },
                    assignedTeamAId: { type: 'string', format: 'uuid', nullable: true },
                    assignedTeamBId: { type: 'string', format: 'uuid', nullable: true },
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
                    identifiedTeamColor: { type: 'string', nullable: true },
                    identifiedJerseyNumber: { type: 'number', nullable: true },
                    eventType: { type: 'string' },
                    eventDetails: { type: 'object', nullable: true, description: 'JSONB field for event-specific data' },
                    absoluteTimestamp: { type: 'number', format: 'float' },
                    videoClipStartTime: { type: 'number', format: 'float' },
                    videoClipEndTime: { type: 'number', format: 'float' },
                },
            },
            Team: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
                    name: { type: 'string', example: 'My Awesome Team' },
                    userId: { type: 'string', example: 'firebaseUid123' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            Player: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
                    name: { type: 'string', example: 'John Doe' },
                    jerseyNumber: { type: 'number', example: 10 },
                    teamId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
        },
    },
    apis: ['./src/*.ts', './src/routes/*.ts'], // Path to the API docs
};
