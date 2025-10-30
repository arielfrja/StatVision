"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = __importDefault(require("dotenv"));
var path_1 = __importDefault(require("path"));
var logger_1 = __importDefault(require("./config/logger"));
var envPath = path_1.default.resolve(__dirname, '../../.env');
dotenv_1.default.config({ path: envPath });
logger_1.default.info("Attempting to load .env from: ".concat(envPath));
logger_1.default.info("PORT after dotenv.config(): ".concat(process.env.PORT));
require("reflect-metadata");
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var typeorm_1 = require("typeorm");
var User_1 = require("./User");
var Team_1 = require("./Team");
var Player_1 = require("./Player");
var Game_1 = require("./Game");
var GameEvent_1 = require("./GameEvent");
var swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
var swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
var authProviderFactory_1 = require("./auth/authProviderFactory");
var authMiddleware_1 = require("./middleware/authMiddleware");
var authRoutes_1 = require("./routes/authRoutes");
var teamRoutes_1 = require("./routes/teamRoutes");
var playerRoutes_1 = require("./routes/playerRoutes");
var loggingMiddleware_1 = __importDefault(require("./middleware/loggingMiddleware"));
var errorMiddleware_1 = __importDefault(require("./middleware/errorMiddleware"));
logger_1.default.info("Environment Variables Loaded:");
logger_1.default.info("PORT: ".concat(process.env.PORT));
logger_1.default.info("NODE_ENV: ".concat(process.env.NODE_ENV));
logger_1.default.info("AUTH0_JWKS_URI: ".concat(process.env.AUTH0_JWKS_URI));
logger_1.default.info("AUTH0_AUDIENCE: ".concat(process.env.AUTH0_AUDIENCE));
logger_1.default.info("AUTH0_ISSUER: ".concat(process.env.AUTH0_ISSUER));
logger_1.default.info("DB_HOST: ".concat(process.env.DB_HOST));
logger_1.default.info("DB_PORT: ".concat(process.env.DB_PORT));
logger_1.default.info("DB_USERNAME: ".concat(process.env.DB_USERNAME));
logger_1.default.info("DB_DATABASE: ".concat(process.env.DB_DATABASE));
var AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: true, // Use migrations in production
    logging: false,
    entities: [User_1.User, Team_1.Team, Player_1.Player, Game_1.Game, GameEvent_1.GameEvent],
    subscribers: [],
    migrations: [],
});
var app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: function (origin, callback) { return callback(null, origin); }, credentials: true }));
app.use(express_1.default.json()); // Enable JSON body parser
// Middleware to log all incoming request headers
app.use(function (req, res, next) {
    logger_1.default.debug("Incoming Request Headers:", req.headers);
    next();
});
// Log all incoming requests
app.use(loggingMiddleware_1.default);
// Error handling middleware
app.use(errorMiddleware_1.default);
// Swagger definition
var swaggerOptions = {
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
var swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
var authProvider; // Declare authProvider here
AppDataSource.initialize()
    .then(function () {
    logger_1.default.info("Data Source has been initialized!");
    var jwksUri = process.env.AUTH0_JWKS_URI;
    var audience = process.env.AUTH0_AUDIENCE;
    var issuer = process.env.AUTH0_ISSUER;
    if (!jwksUri || !audience || !issuer) {
        throw new Error("Missing Auth0 environment variables: AUTH0_JWKS_URI, AUTH0_AUDIENCE, or AUTH0_ISSUER.");
    }
    // Instantiate the Auth0 provider using the factory
    authProvider = (0, authProviderFactory_1.getAuthProvider)(jwksUri, audience, issuer);
    // Apply authMiddleware globally
    app.use((0, authMiddleware_1.authMiddleware)(AppDataSource, authProvider));
    // Import and use routes
    app.use("/", (0, authRoutes_1.authRoutes)(AppDataSource));
    app.use("/teams", (0, teamRoutes_1.teamRoutes)(AppDataSource));
    app.use("/teams/:teamId/players", (0, playerRoutes_1.playerRoutes)(AppDataSource));
    var PORT = process.env.PORT || 3000;
    app.listen(PORT, function () {
        logger_1.default.info("Server is running on port ".concat(PORT));
    });
})
    .catch(function (err) {
    logger_1.default.error("Error during Data Source initialization:", err);
});
//# sourceMappingURL=app.js.map