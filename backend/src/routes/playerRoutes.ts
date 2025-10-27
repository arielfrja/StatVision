import { Router } from 'express';
import { DataSource } from 'typeorm';
import { User } from '../User';
import { TeamRepository } from '../repository/TeamRepository';
import { TeamService } from '../service/TeamService';
import { PlayerRepository } from '../repository/PlayerRepository';
import { PlayerService } from '../service/PlayerService';
import { Team } from '../Team';
import { Player } from '../Player';
import logger from '../config/logger';

const router = Router({ mergeParams: true }); // mergeParams to access teamId from parent route

export const playerRoutes = (AppDataSource: DataSource) => {
    const userRepository = AppDataSource.getRepository(User);
    const teamRepository = new TeamRepository(AppDataSource.getRepository(Team));
    const teamService = new TeamService(teamRepository);
    const playerRepository = new PlayerRepository(AppDataSource.getRepository(Player));
    const playerService = new PlayerService(playerRepository);

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
    router.get("/", async (req, res) => {
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
            logger.info(`User ${user.id} fetching players for team ${teamId}.`);
            const players = await playerService.getPlayersByTeam(teamId);
            logger.info(`User ${user.id} fetched ${players.length} players for team ${teamId}.`);
            res.status(200).json(players);
        } catch (error: any) {
            logger.error("Error fetching players:", error);
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
    router.post("/", async (req, res) => {
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
            logger.info(`User ${user.id} creating player ${name} (#${jerseyNumber}) for team ${teamId}.`);
            const newPlayer = await playerService.createPlayer(name, jerseyNumber, team);
            logger.info(`User ${user.id} created player ${newPlayer.name} (${newPlayer.id}) for team ${teamId}.`);
            res.status(201).json(newPlayer);
        } catch (error: any) {
            logger.error("Error creating player:", error);
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
    router.put("/:playerId", async (req, res) => {
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
            logger.info(`User ${user.id} updating player ${playerId} in team ${teamId} to ${name} (#${jerseyNumber}).`);
            const updatedPlayer = await playerService.updatePlayer(playerId, teamId, name, jerseyNumber);
            logger.info(`User ${user.id} updated player ${updatedPlayer.name} (${updatedPlayer.id}) in team ${teamId}.`);
            res.status(200).json(updatedPlayer);
        } catch (error: any) {
            logger.error("Error updating player:", error);
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
    router.delete("/:playerId", async (req, res) => {
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
            logger.info(`User ${user.id} deleting player ${playerId} from team ${teamId}.`);
            await playerService.deletePlayer(playerId, teamId);
            logger.info(`User ${user.id} deleted player ${playerId} from team ${teamId}.`);
            res.status(204).send();
        } catch (error: any) {
            logger.error("Error deleting player:", error);
            res.status(400).send(error.message);
        }
    });

    return router;
};
