import { Router } from 'express';
import { DataSource } from 'typeorm';
import { User } from '../User';
import logger from '../config/logger';

const router = Router();

export const authRoutes = (AppDataSource: DataSource) => {
    const userRepository = AppDataSource.getRepository(User);

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

    /**
     * @swagger
     * /me:
     *   get:
     *     summary: Get current user info including preferences.
     *     tags: [User]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Current user information.
     */
    router.get("/me", async (req, res) => {
        try {
            const providerUid = req.user?.uid;
            if (!providerUid) return res.status(401).send("Unauthorized");

            const user = await userRepository.findOneBy({ providerUid });
            if (!user) return res.status(404).send("User not found");

            res.status(200).json(user);
        } catch (error) {
            logger.error("Error fetching user info:", error);
            res.status(500).send("Internal server error");
        }
    });

    /**
     * @swagger
     * /me/preferences:
     *   put:
     *     summary: Update current user preferences.
     *     tags: [User]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               visibleStats:
     *                 type: array
     *                 items: { type: 'string' }
     *     responses:
     *       200:
     *         description: Preferences updated successfully.
     */
    router.put("/me/preferences", async (req, res) => {
        try {
            const providerUid = req.user?.uid;
            if (!providerUid) return res.status(401).send("Unauthorized");

            const user = await userRepository.findOneBy({ providerUid });
            if (!user) return res.status(404).send("User not found");

            user.preferences = { ...user.preferences, ...req.body };
            await userRepository.save(user);

            res.status(200).json(user.preferences);
        } catch (error) {
            logger.error("Error updating preferences:", error);
            res.status(500).send("Internal server error");
        }
    });

    return router;
};
