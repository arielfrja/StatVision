import "reflect-metadata";
import express from "express";
import cors from "cors";
import { DataSource } from "typeorm";
import { User } from "./User";
import { Team } from "./Team";
import { Player } from "./Player";
import { Game } from "./Game";
import { GameEvent } from "./GameEvent";
import { TeamRepository } from "./repository/TeamRepository";
import { TeamService } from "./service/TeamService";
import { PlayerRepository } from "./repository/PlayerRepository";
import { PlayerService } from "./service/PlayerService";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { Auth0Provider } from "./auth/auth0Provider";

// Extend the Request type to include the user property
declare global {
    namespace Express {
        interface Request {
            user?: { uid: string; email: string; }; // Generic user info
        }
    }
}

// Instantiate the Auth0 provider
const authProvider = new Auth0Provider();

// Define the authMiddleware function
const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Allow /register and /api-docs to bypass authentication
    if (req.path === "/register" || req.path.startsWith("/api-docs")) {
        return next();
    }

    // Use the selected authentication provider to verify the token
    await authProvider.verifyToken(req, res, next);
};

const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "statsvision",
    password: "statsvision",
    database: "statsvision_db",
    synchronize: true, // Use migrations in production
    logging: false,
    entities: [User, Team, Player, Game, GameEvent],
    subscribers: [],
    migrations: [],
});

const app = express();
app.use(cors({ origin: 'http://localhost:3001' }));
app.use(express.json()); // Enable JSON body parser

// Apply authMiddleware globally
app.use(authMiddleware);

// Swagger definition
const swaggerOptions = {
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

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Initialize Data Source and start the server
AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!");

        // Initialize repositories and services
        const userRepository = AppDataSource.getRepository(User);
        const teamRepository = new TeamRepository(AppDataSource.getRepository(Team));
        const teamService = new TeamService(teamRepository);
        const playerRepository = new PlayerRepository(AppDataSource.getRepository(Player));
        const playerService = new PlayerService(playerRepository);

        // Public route for user registration (BE-102)
        /**
         * @swagger
         * /register:
         *   post:
         *     summary: Register a new user in the database.
         *     description: This endpoint registers a new user in the application's database using their Firebase UID and email.
         *     tags: [Users]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - firebaseUid
         *               - email
         *             properties:
         *               firebaseUid:
         *                 type: string
         *                 description: The Firebase Unique ID of the user.
         *                 example: someFirebaseUid123
         *               email:
         *                 type: string
         *                 format: email
         *                 description: The email address of the user.
         *                 example: user@example.com
         *     responses:
         *       201:
         *         description: User registered successfully in database.
         *         content:
         *           text/plain:
         *             schema:
         *               type: string
         *               example: User registered successfully in database.
         *       400:
         *         description: Missing firebaseUid or email.
         *         content:
         *           text/plain:
         *             schema:
         *               type: string
         *               example: Missing firebaseUid or email
         *       409:
         *         description: User already registered in database.
         *         content:
         *           text/plain:
         *             schema:
         *               type: string
         *               example: User already registered in database.
         *       500:
         *         description: Internal server error during user registration.
         *         content:
         *           text/plain:
         *             schema:
         *               type: string
         *               example: Internal server error during user registration.
         */
        app.post("/register", async (req, res) => {
            const { providerUid, email } = req.body;

            if (!providerUid || !email) {
                return res.status(400).send("Missing providerUid or email");
            }

            try {
                const existingUser = await userRepository.findOneBy({ providerUid });

                if (existingUser) {
                    return res.status(409).send("User already registered in database.");
                }

                const newUser = userRepository.create({ providerUid, email });
                await userRepository.save(newUser);
                res.status(201).send("User registered successfully in database.");
            } catch (error) {
                console.error("Error registering user in database:", error);
                res.status(500).send("Internal server error during user registration.");
            }
        });

        // Protected route example (BE-103)
        /**
         * @swagger
         * /protected:
         *   get:
         *     summary: Access a protected route.
         *     description: This endpoint demonstrates access to a protected resource, requiring a valid Firebase ID token.
         *     tags: [Protected]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Successfully accessed protected route.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 message:
         *                   type: string
         *                   example: You accessed a protected route!
         *                 user:
         *                   type: object
         *                   description: Decoded user information from the Firebase ID token.
         *       401:
         *         description: Unauthorized - No token provided or invalid token.
         *         content:
         *           text/plain:
         *             schema:
         *               type: string
         *               example: Unauthorized
         *       500:
         *         description: Internal server error.
         */
        app.get("/protected", (req, res) => {
            res.status(200).json({
                message: "You accessed a protected route!",
                user: req.user,
            });
        });

        // Team Management Routes (BE-204)
        /**
         * @swagger
         * /teams:
         *   get:
         *     summary: Get all teams for the authenticated user.
         *     description: Retrieves a list of all teams associated with the authenticated user.
         *     tags: [Teams]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: A list of teams.
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 $ref: '#/components/schemas/Team'
         *       401:
         *         description: Unauthorized - User ID not found or invalid token.
         *       500:
         *         description: Internal server error fetching teams.
         */
        app.get("/teams", async (req, res) => {
            try {
                const providerUid = req.user?.uid;
                if (!providerUid) {
                    return res.status(401).send("Unauthorized: User ID not found.");
                }
                const user = await userRepository.findOneBy({ providerUid });
                if (!user) {
                    return res.status(404).send("User not found in database.");
                }
                const teams = await teamService.getTeamsByUser(user.id);
                res.status(200).json(teams);
            } catch (error) {
                console.error("Error fetching teams:", error);
                res.status(500).send("Internal server error fetching teams.");
            }
        });

        /**
         * @swagger
         * /teams:
         *   post:
         *     summary: Create a new team for the authenticated user.
         *     description: Creates a new team and associates it with the authenticated user.
         *     tags: [Teams]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - name
         *             properties:
         *               name:
         *                 type: string
         *                 description: The name of the new team.
         *                 example: My Awesome Team
         *     responses:
         *       201:
         *         description: Team created successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/Team'
         *       400:
         *         description: Invalid input (e.g., missing team name).
         *       401:
         *         description: Unauthorized - User ID not found or invalid token.
         *       404:
         *         description: User not found in database.
         *       500:
         *         description: Internal server error creating team.
         */
        app.post("/teams", async (req, res) => {
            console.log("POST /teams: req.user", req.user);
            const { name } = req.body;
            try {
                const providerUid = req.user?.uid;
                console.log("POST /teams: providerUid", providerUid);
                if (!providerUid) {
                    return res.status(401).send("Unauthorized: User ID not found.");
                }
                const user = await userRepository.findOneBy({ providerUid });
                console.log("POST /teams: user from DB", user);
                if (!user) {
                    return res.status(404).send("User not found in database.");
                }
                const newTeam = await teamService.createTeam(name, user);
                res.status(201).json(newTeam);
            } catch (error: any) {
                console.error("Error creating team:", error);
                res.status(400).send(error.message);
            }
        });

        /**
         * @swagger
         * /teams/{id}:
         *   put:
         *     summary: Update a team by ID for the authenticated user.
         *     description: Updates the name of a specific team owned by the authenticated user.
         *     tags: [Teams]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *         description: The ID of the team to update.
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - name
         *             properties:
         *               name:
         *                 type: string
         *                 description: The new name for the team.
         *                 example: Updated Team Name
         *     responses:
         *       200:
         *         description: Team updated successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/Team'
         *       400:
         *         description: Invalid input (e.g., missing team name) or team not found/permission denied.
         *       401:
         *         description: Unauthorized - User ID not found or invalid token.
         *       404:
         *         description: Team not found or you do not have permission to update it.
         *       500:
         *         description: Internal server error updating team.
         */
        app.put("/teams/:id", async (req, res) => {
            const { id } = req.params;
            const { name } = req.body;
            try {
                const providerUid = req.user?.uid;
                if (!providerUid) {
                    return res.status(401).send("Unauthorized: User ID not found.");
                }
                const user = await userRepository.findOneBy({ providerUid });
                if (!user) {
                    return res.status(404).send("User not found in database.");
                }
                const updatedTeam = await teamService.updateTeam(id, user.id, name);
                res.status(200).json(updatedTeam);
            } catch (error: any) {
                console.error("Error updating team:", error);
                res.status(400).send(error.message);
            }
        });

        /**
         * @swagger
         * /teams/{id}:
         *   delete:
         *     summary: Delete a team by ID for the authenticated user.
         *     description: Deletes a specific team owned by the authenticated user.
         *     tags: [Teams]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *         description: The ID of the team to delete.
         *     responses:
         *       204:
         *         description: Team deleted successfully (No Content).
         *       400:
         *         description: Invalid request or team not found/permission denied.
         *       401:
         *         description: Unauthorized - User ID not found or invalid token.
         *       404:
         *         description: Team not found or you do not have permission to delete it.
         *       500:
         *         description: Internal server error deleting team.
         */
        app.delete("/teams/:id", async (req, res) => {
            const { id } = req.params;
            try {
                const providerUid = req.user?.uid;
                if (!providerUid) {
                    return res.status(401).send("Unauthorized: User ID not found.");
                }
                const user = await userRepository.findOneBy({ providerUid });
                if (!user) {
                    return res.status(404).send("User not found in database.");
                }
                await teamService.deleteTeam(id, user.id);
                res.status(204).send(); // No content for successful deletion
            } catch (error: any) {
                console.error("Error deleting team:", error);
                res.status(400).send(error.message);
            }
        });

        // Player Management Routes (BE-204)
        /**
         * @swagger
         * /teams/{teamId}/players:
         *   get:
         *     summary: Get all players for a specific team of the authenticated user.
         *     description: Retrieves a list of all players belonging to a specified team, ensuring the team is owned by the authenticated user.
         *     tags: [Players]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: teamId
         *         schema:
         *           type: string
         *         required: true
         *         description: The ID of the team to retrieve players from.
         *     responses:
         *       200:
         *         description: A list of players.
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 $ref: '#/components/schemas/Player'
         *       401:
         *         description: Unauthorized - User ID not found or invalid token.
         *       404:
         *         description: Team not found or you do not have permission to access it.
         *       500:
         *         description: Internal server error fetching players.
         */
        app.get("/teams/:teamId/players", async (req, res) => {
            const { teamId } = req.params;
            try {
                const providerUid = req.user?.uid;
                if (!providerUid) {
                    return res.status(401).send("Unauthorized: User ID not found.");
                }
                const user = await userRepository.findOneBy({ providerUid });
                if (!user) {
                    return res.status(404).send("User not found in database.");
                }
                // Verify team belongs to user
                const team = await teamService.getTeamByIdAndUser(teamId, user.id);
                if (!team) {
                    return res.status(404).send("Team not found or you do not have permission to access it.");
                }
                const players = await playerService.getPlayersByTeam(teamId);
                res.status(200).json(players);
            } catch (error) {
                console.error("Error fetching players:", error);
                res.status(500).send("Internal server error fetching players.");
            }
        });

        /**
         * @swagger
         * /teams/{teamId}/players:
         *   post:
         *     summary: Create a new player for a specific team of the authenticated user.
         *     description: Creates a new player and associates them with a specified team, ensuring the team is owned by the authenticated user.
         *     tags: [Players]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: teamId
         *         schema:
         *           type: string
         *         required: true
         *         description: The ID of the team to add the player to.
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - name
         *               - jerseyNumber
         *             properties:
         *               name:
         *                 type: string
         *                 description: The name of the new player.
         *                 example: John Doe
         *               jerseyNumber:
         *                 type: number
         *                 description: The jersey number of the new player.
         *                 example: 10
         *     responses:
         *       201:
         *         description: Player created successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/Player'
         *       400:
         *         description: Invalid input (e.g., missing name, invalid jersey number, or jersey number already exists).
         *       401:
         *         description: Unauthorized - User ID not found or invalid token.
         *       404:
         *         description: Team not found or you do not have permission to add players to it.
         *       500:
         *         description: Internal server error creating player.
         */
        app.post("/teams/:teamId/players", async (req, res) => {
            const { teamId } = req.params;
            const { name, jerseyNumber } = req.body;
            try {
                const providerUid = req.user?.uid;
                if (!providerUid) {
                    return res.status(401).send("Unauthorized: User ID not found.");
                }
                const user = await userRepository.findOneBy({ providerUid });
                if (!user) {
                    return res.status(404).send("User not found in database.");
                }
                // Verify team belongs to user
                const team = await teamService.getTeamByIdAndUser(teamId, user.id);
                if (!team) {
                    return res.status(404).send("Team not found or you do not have permission to add players to it.");
                }
                const newPlayer = await playerService.createPlayer(name, jerseyNumber, team);
                res.status(201).json(newPlayer);
            } catch (error: any) {
                console.error("Error creating player:", error);
                res.status(400).send(error.message);
            }
        });

        /**
         * @swagger
         * /teams/{teamId}/players/{playerId}:
         *   put:
         *     summary: Update a player for a specific team of the authenticated user.
         *     description: Updates the details of a specific player belonging to a specified team, ensuring the team is owned by the authenticated user.
         *     tags: [Players]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: teamId
         *         schema:
         *           type: string
         *         required: true
         *         description: The ID of the team the player belongs to.
         *       - in: path
         *         name: playerId
         *         schema:
         *           type: string
         *         required: true
         *         description: The ID of the player to update.
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - name
         *               - jerseyNumber
         *             properties:
         *               name:
         *                 type: string
         *                 description: The new name for the player.
         *                 example: Jane Doe
         *               jerseyNumber:
         *                 type: number
         *                 description: The new jersey number for the player.
         *                 example: 12
         *     responses:
         *       200:
         *         description: Player updated successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/Player'
         *       400:
         *         description: Invalid input (e.g., missing name, invalid jersey number, or jersey number already exists) or player not found/permission denied.
         *       401:
         *         description: Unauthorized - User ID not found or invalid token.
         *       404:
         *         description: Team or Player not found or you do not have permission to update it.
         *       500:
         *         description: Internal server error updating player.
         */
        app.put("/teams/:teamId/players/:playerId", async (req, res) => {
            const { teamId, playerId } = req.params;
            const { name, jerseyNumber } = req.body;
            try {
                const providerUid = req.user?.uid;
                if (!providerUid) {
                    return res.status(401).send("Unauthorized: User ID not found.");
                }
                const user = await userRepository.findOneBy({ providerUid });
                if (!user) {
                    return res.status(404).send("User not found in database.");
                }
                // Verify team belongs to user
                const team = await teamService.getTeamByIdAndUser(teamId, user.id);
                if (!team) {
                    return res.status(404).send("Team not found or you do not have permission to update players in it.");
                }
                const updatedPlayer = await playerService.updatePlayer(playerId, teamId, name, jerseyNumber);
                res.status(200).json(updatedPlayer);
            } catch (error: any) {
                console.error("Error updating player:", error);
                res.status(400).send(error.message);
            }
        });

        /**
         * @swagger
         * /teams/{teamId}/players/{playerId}:
         *   delete:
         *     summary: Delete a player for a specific team of the authenticated user.
         *     description: Deletes a specific player belonging to a specified team, ensuring the team is owned by the authenticated user.
         *     tags: [Players]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: teamId
         *         schema:
         *           type: string
         *         required: true
         *         description: The ID of the team the player belongs to.
         *       - in: path
         *         name: playerId
         *         schema:
         *           type: string
         *         required: true
         *         description: The ID of the player to delete.
         *     responses:
         *       204:
         *         description: Player deleted successfully (No Content).
         *       401:
         *         description: Unauthorized - User ID not found or invalid token.
         *       404:
         *         description: Team or Player not found or you do not have permission to delete it.
         *       500:
         *         description: Internal server error deleting player.
         */
        app.delete("/teams/:teamId/players/:playerId", async (req, res) => {
            const { teamId, playerId } = req.params;
            try {
                const providerUid = req.user?.uid;
                if (!providerUid) {
                    return res.status(401).send("Unauthorized: User ID not found.");
                }
                const user = await userRepository.findOneBy({ providerUid });
                if (!user) {
                    return res.status(404).send("User not found in database.");
                }
                // Verify team belongs to user
                const team = await teamService.getTeamByIdAndUser(teamId, user.id);
                if (!team) {
                    return res.status(404).send("Team not found or you do not have permission to delete players from it.");
                }
                await playerService.deletePlayer(playerId, teamId);
                res.status(204).send();
            } catch (error: any) {
                console.error("Error deleting player:", error);
                res.status(400).send(error.message);
            }
        });


        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err);
    });
