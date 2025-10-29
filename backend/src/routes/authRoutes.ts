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

    return router;
};
