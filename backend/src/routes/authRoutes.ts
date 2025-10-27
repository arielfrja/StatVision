import { Router } from 'express';
import { DataSource } from 'typeorm';
import { User } from '../User';
import { Auth0Provider } from '../auth/auth0Provider';
import logger from '../config/logger';

const router = Router();

export const authRoutes = (AppDataSource: DataSource) => {
    const userRepository = AppDataSource.getRepository(User);
    const authProvider = new Auth0Provider();

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
    router.post("/register", async (req, res) => {
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
            logger.info(`User registered: ${newUser.email}`);
            res.status(201).send("User registered successfully in database.");
        } catch (error: any) {
            logger.error("Error registering user in database:", error);
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
    router.get("/protected", async (req, res) => {
        logger.info(`User ${req.user?.email} accessed protected route.`);
        res.status(200).json({
            message: "You accessed a protected route!",
            user: req.user,
        });
    });

    return router;
};
