import { Router } from 'express';
import { DataSource, Repository } from 'typeorm';
import { Team } from '../Team';
import { Player } from '../Player';
import { User } from '../User';
import { TeamRepository } from '../repository/TeamRepository';
import { TeamService } from '../service/TeamService';
import logger from '../config/logger';

const router = Router();

export const teamRoutes = (AppDataSource: DataSource) => {
    const baseTeamRepository = AppDataSource.getRepository(Team);
    const playerRepository = AppDataSource.getRepository(Player);
    const customTeamRepository = new TeamRepository(baseTeamRepository);
    const teamService = new TeamService(customTeamRepository);
    const userRepository = AppDataSource.getRepository(User);

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
    router.get("/", async (req, res) => {
        try {
            const providerUid = req.user?.uid;
            if (!providerUid) {
                return res.status(401).send("Unauthorized: User ID not found.");
            }
            const user = await userRepository.findOneBy({ providerUid });
            if (!user) {
                return res.status(404).send("User not found in database.");
            }
            logger.info(`User ${user.id} fetching teams.`);
            const teams = await teamService.getTeamsByUser(user.id);
            logger.info(`User ${user.id} fetched ${teams.length} teams.`);
            res.status(200).json(teams);
        } catch (error: any) {
            logger.error("Error fetching teams:", error);
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
    router.post("/", async (req, res) => {
        const { name } = req.body;
        try {
            const providerUid = req.user?.uid;
            logger.info("POST /teams: providerUid", providerUid);
            if (!providerUid) {
                return res.status(401).send("Unauthorized: User ID not found.");
            }
            const user = await userRepository.findOneBy({ providerUid });
            if (!user) {
                return res.status(404).send("User not found in database.");
            }
            logger.info(`User ${user.id} creating team with name: ${name}`);
            const newTeam = await teamService.createTeam(name, user);
            logger.info(`User ${user.id} created team: ${newTeam.name} (${newTeam.id})`);
            res.status(201).json(newTeam);
        } catch (error: any) {
            logger.error("Error creating team:", error);
            res.status(400).send(error.message);
        }
    });

    /**
     * @swagger
     * /teams/{id}:
     *   get:
     *     summary: Get a single team by ID for the authenticated user.
     *     description: Retrieves a specific team owned by the authenticated user.
     *     tags: [Teams]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: The ID of the team to retrieve.
     *     responses:
     *       200:
     *         description: A single team object.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Team'
     *       401:
     *         description: Unauthorized - User ID not found or invalid token.
     *       404:
     *         description: Team not found or you do not have permission to access it.
     *       500:
     *         description: Internal server error fetching team.
     */
    router.get("/:id", async (req, res) => {
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
            logger.info(`User ${user.id} fetching team ${id}.`);
            const team = await teamService.getTeamByIdAndUser(id, user.id);
            if (!team) {
                return res.status(404).send("Team not found or you do not have permission to access it.");
            }
            logger.info(`User ${user.id} fetched team: ${team.name} (${team.id}).`);
            res.status(200).json(team);
        } catch (error: any) {
            logger.error("Error fetching team:", error);
            res.status(500).send("Internal server error fetching team.");
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
    router.put("/:id", async (req, res) => {
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
            logger.info(`User ${user.id} updating team ${id} to name: ${name}`);
            const updatedTeam = await teamService.updateTeam(id, user.id, name);
            logger.info(`User ${user.id} updated team: ${updatedTeam.name} (${updatedTeam.id})`);
            res.status(200).json(updatedTeam);
        } catch (error: any) {
            logger.error("Error updating team:", error);
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
    router.delete("/:id", async (req, res) => {
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
            logger.info(`User ${user.id} deleting team ${id}`);
            await teamService.deleteTeam(id, user.id);
            logger.info(`User ${user.id} deleted team ${id}.`);
            res.status(204).send(); // No content for successful deletion
        }
        catch (error: any) {
            logger.error("Error deleting team:", error);
            res.status(400).send(error.message);
        }
    });

    return router;
};
