import { Router, Request } from 'express';
import { DataSource } from 'typeorm';
import { User } from '../User';
import { TeamService } from '../service/TeamService';
import { PlayerService } from '../service/PlayerService';
import logger from '../config/logger';

interface PlayerRequestParams extends Request {
    params: {
        teamId: string;
        playerId?: string;
    };
}

const router = Router({ mergeParams: true }); // mergeParams to access teamId from parent route

export const playerRoutes = (AppDataSource: DataSource, teamService: TeamService, playerService: PlayerService) => {
    const userRepository = AppDataSource.getRepository(User);

    /**
     * @swagger
     * /teams/{teamId}/players:
     *   get:
     *     summary: Get all active players for a specific team of the authenticated user.
     *     description: Retrieves a list of all active players (PlayerTeamHistory records) belonging to a specified team.
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
     *         description: A list of PlayerTeamHistory records (including nested Player details).
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/PlayerTeamHistory'
     *       401:
     *         description: Unauthorized - User ID not found or invalid token.
     *       404:
     *         description: Team not found or you do not have permission to access it.
     *       500:
     *         description: Internal server error fetching players.
     */
    router.get("/", async (req: PlayerRequestParams, res) => {
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
     *     summary: Create a new player and assign them to a team.
     *     description: Creates a new timeless Player record and an associated PlayerTeamHistory record.
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
     *             properties:
     *               name:
     *                 type: string
     *                 description: The name of the new player.
     *                 example: John Doe
     *               jerseyNumber:
     *                 type: number
     *                 nullable: true
     *                 description: The jersey number of the new player (optional).
     *                 example: 10
     *               description:
     *                 type: string
     *                 nullable: true
     *                 description: A short description for amateur players (optional).
     *     responses:
     *       201:
     *         description: PlayerTeamHistory record created successfully.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PlayerTeamHistory'
     *       400:
     *         description: Invalid input (e.g., missing name).
     *       401:
     *         description: Unauthorized.
     *       404:
     *         description: Team not found or you do not have permission.
     *       500:
     *         description: Internal server error creating player.
     */
    router.post("/", async (req: PlayerRequestParams, res) => {
        const { teamId } = req.params;
        const { name, jerseyNumber, description } = req.body;
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
            logger.info(`User ${user.id} creating player ${name} for team ${teamId}.`);
            
            const newHistoryRecord = await playerService.createPlayerAndAssignToTeam(
                name, 
                teamId, 
                jerseyNumber || null, 
                description || null
            );
            
            logger.info(`User ${user.id} created player and assignment (${newHistoryRecord.id}) for team ${teamId}.`);
            res.status(201).json(newHistoryRecord);
        } catch (error: any) {
            logger.error("Error creating player:", error);
            res.status(400).send(error.message);
        }
    });

    /**
     * @swagger
     * /teams/{teamId}/players/{playerId}:
     *   put:
     *     summary: Update a player's assignment details (jersey, description) for a specific team.
     *     description: Updates the PlayerTeamHistory record for a player on a team.
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
     *             properties:
     *               jerseyNumber:
     *                 type: number
     *                 nullable: true
     *                 description: The new jersey number for the player (optional).
     *                 example: 12
     *               description:
     *                 type: string
     *                 nullable: true
     *                 description: A short description for amateur players (optional).
     *     responses:
     *       200:
     *         description: Player assignment updated successfully.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PlayerTeamHistory'
     *       400:
     *         description: Invalid input.
     *       401:
     *         description: Unauthorized.
     *       404:
     *         description: Team or Player assignment not found.
     *       500:
     *         description: Internal server error updating player.
     */
    router.put("/:playerId", async (req: PlayerRequestParams, res) => {
        const { teamId, playerId } = req.params;
        const { jerseyNumber, description } = req.body;
        
        if (!teamId || !playerId) {
            return res.status(400).send("Bad Request: teamId and playerId are required.");
        }
        
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
            
            logger.info(`User ${user.id} updating player assignment ${playerId} in team ${teamId}.`);
            
            const updatedHistory = await playerService.updatePlayerAssignment(
                playerId, 
                teamId, 
                jerseyNumber || null, 
                description || null
            );
            
            logger.info(`User ${user.id} updated player assignment (${updatedHistory.id}) in team ${teamId}.`);
            res.status(200).json(updatedHistory);
        } catch (error: any) {
            logger.error("Error updating player assignment:", error);
            res.status(400).send(error.message);
        }
    });

    /**
     * @swagger
     * /teams/{teamId}/players/{playerId}:
     *   delete:
     *     summary: Remove a player from a specific team's roster.
     *     description: Deletes the PlayerTeamHistory record, effectively removing the player from the team's roster.
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
     *         description: The ID of the player to remove.
     *     responses:
     *       204:
     *         description: Player removed successfully (No Content).
     *       401:
     *         description: Unauthorized.
     *       404:
     *         description: Team or Player assignment not found.
     *       500:
     *         description: Internal server error deleting player.
     */
    router.delete("/:playerId", async (req: PlayerRequestParams, res) => {
        const { teamId, playerId } = req.params;
        if (!teamId || !playerId) {
            return res.status(400).send("Bad Request: teamId and playerId are required.");
        }
        
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
            
            logger.info(`User ${user.id} removing player ${playerId} from team ${teamId} roster.`);
            await playerService.removePlayerFromTeam(playerId, teamId);
            logger.info(`User ${user.id} removed player ${playerId} from team ${teamId} roster.`);
            res.status(204).send();
        } catch (error: any) {
            logger.error("Error removing player from team:", error);
            res.status(400).send(error.message);
        }
    });
            
    return router;
};