"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerRoutes = void 0;
var express_1 = require("express");
var User_1 = require("../User");
var TeamRepository_1 = require("../repository/TeamRepository");
var TeamService_1 = require("../service/TeamService");
var PlayerRepository_1 = require("../repository/PlayerRepository");
var PlayerService_1 = require("../service/PlayerService");
var Team_1 = require("../Team");
var Player_1 = require("../Player");
var logger_1 = __importDefault(require("../config/logger"));
var router = (0, express_1.Router)({ mergeParams: true }); // mergeParams to access teamId from parent route
var playerRoutes = function (AppDataSource) {
    var userRepository = AppDataSource.getRepository(User_1.User);
    var teamRepository = new TeamRepository_1.TeamRepository(AppDataSource.getRepository(Team_1.Team));
    var teamService = new TeamService_1.TeamService(teamRepository);
    var playerRepository = new PlayerRepository_1.PlayerRepository(AppDataSource.getRepository(Player_1.Player));
    var playerService = new PlayerService_1.PlayerService(playerRepository);
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
    router.get("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var teamId, providerUid, user, team, players, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    teamId = req.params.teamId;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    providerUid = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
                    if (!providerUid) {
                        return [2 /*return*/, res.status(401).send("Unauthorized: User ID not found.")];
                    }
                    return [4 /*yield*/, userRepository.findOneBy({ providerUid: providerUid })];
                case 2:
                    user = _b.sent();
                    if (!user) {
                        return [2 /*return*/, res.status(404).send("User not found in database.")];
                    }
                    return [4 /*yield*/, teamService.getTeamByIdAndUser(teamId, user.id)];
                case 3:
                    team = _b.sent();
                    if (!team) {
                        return [2 /*return*/, res.status(404).send("Team not found or you do not have permission to access it.")];
                    }
                    logger_1.default.info("User ".concat(user.id, " fetching players for team ").concat(teamId, "."));
                    return [4 /*yield*/, playerService.getPlayersByTeam(teamId)];
                case 4:
                    players = _b.sent();
                    logger_1.default.info("User ".concat(user.id, " fetched ").concat(players.length, " players for team ").concat(teamId, "."));
                    res.status(200).json(players);
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _b.sent();
                    logger_1.default.error("Error fetching players:", error_1);
                    res.status(500).send("Internal server error fetching players.");
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
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
    router.post("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var teamId, _a, name, jerseyNumber, providerUid, user, team, newPlayer, error_2;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    teamId = req.params.teamId;
                    _a = req.body, name = _a.name, jerseyNumber = _a.jerseyNumber;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 5, , 6]);
                    providerUid = (_b = req.user) === null || _b === void 0 ? void 0 : _b.uid;
                    if (!providerUid) {
                        return [2 /*return*/, res.status(401).send("Unauthorized: User ID not found.")];
                    }
                    return [4 /*yield*/, userRepository.findOneBy({ providerUid: providerUid })];
                case 2:
                    user = _c.sent();
                    if (!user) {
                        return [2 /*return*/, res.status(404).send("User not found in database.")];
                    }
                    return [4 /*yield*/, teamService.getTeamByIdAndUser(teamId, user.id)];
                case 3:
                    team = _c.sent();
                    if (!team) {
                        return [2 /*return*/, res.status(404).send("Team not found or you do not have permission to add players to it.")];
                    }
                    logger_1.default.info("User ".concat(user.id, " creating player ").concat(name, " (#").concat(jerseyNumber, ") for team ").concat(teamId, "."));
                    return [4 /*yield*/, playerService.createPlayer(name, jerseyNumber, team)];
                case 4:
                    newPlayer = _c.sent();
                    logger_1.default.info("User ".concat(user.id, " created player ").concat(newPlayer.name, " (").concat(newPlayer.id, ") for team ").concat(teamId, "."));
                    res.status(201).json(newPlayer);
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _c.sent();
                    logger_1.default.error("Error creating player:", error_2);
                    res.status(400).send(error_2.message);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
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
    router.post("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var teamId, _a, name, jerseyNumber, providerUid, user, team, newPlayer, error_3;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    teamId = req.params.teamId;
                    _a = req.body, name = _a.name, jerseyNumber = _a.jerseyNumber;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 5, , 6]);
                    providerUid = (_b = req.user) === null || _b === void 0 ? void 0 : _b.uid;
                    if (!providerUid) {
                        return [2 /*return*/, res.status(401).send("Unauthorized: User ID not found.")];
                    }
                    return [4 /*yield*/, userRepository.findOneBy({ providerUid: providerUid })];
                case 2:
                    user = _c.sent();
                    if (!user) {
                        return [2 /*return*/, res.status(404).send("User not found in database.")];
                    }
                    return [4 /*yield*/, teamService.getTeamByIdAndUser(teamId, user.id)];
                case 3:
                    team = _c.sent();
                    if (!team) {
                        return [2 /*return*/, res.status(404).send("Team not found or you do not have permission to add players to it.")];
                    }
                    logger_1.default.info("User ".concat(user.id, " creating player ").concat(name, " (#").concat(jerseyNumber, ") for team ").concat(teamId, "."));
                    return [4 /*yield*/, playerService.createPlayer(name, jerseyNumber, team)];
                case 4:
                    newPlayer = _c.sent();
                    logger_1.default.info("User ".concat(user.id, " created player ").concat(newPlayer.name, " (").concat(newPlayer.id, ") for team ").concat(teamId, "."));
                    res.status(201).json(newPlayer);
                    return [3 /*break*/, 6];
                case 5:
                    error_3 = _c.sent();
                    logger_1.default.error("Error creating player:", error_3);
                    res.status(400).send(error_3.message);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
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
    router.put("/:playerId", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, teamId, playerId, _b, name, jerseyNumber, providerUid, user, team, updatedPlayer, error_4;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = req.params, teamId = _a.teamId, playerId = _a.playerId;
                    _b = req.body, name = _b.name, jerseyNumber = _b.jerseyNumber;
                    if (!teamId) {
                        return [2 /*return*/, res.status(400).send("Bad Request: teamId is required.")];
                    }
                    if (!playerId) {
                        return [2 /*return*/, res.status(400).send("Bad Request: playerId is required.")];
                    }
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 5, , 6]);
                    providerUid = (_c = req.user) === null || _c === void 0 ? void 0 : _c.uid;
                    if (!providerUid) {
                        return [2 /*return*/, res.status(401).send("Unauthorized: User ID not found.")];
                    }
                    return [4 /*yield*/, userRepository.findOneBy({ providerUid: providerUid })];
                case 2:
                    user = _d.sent();
                    if (!user) {
                        return [2 /*return*/, res.status(404).send("User not found in database.")];
                    }
                    return [4 /*yield*/, teamService.getTeamByIdAndUser(teamId, user.id)];
                case 3:
                    team = _d.sent();
                    if (!team) {
                        return [2 /*return*/, res.status(404).send("Team not found or you do not have permission to update players in it.")];
                    }
                    logger_1.default.info("User ".concat(user.id, " updating player ").concat(playerId, " in team ").concat(teamId, " to ").concat(name, " (#").concat(jerseyNumber, ")."));
                    return [4 /*yield*/, playerService.updatePlayer(playerId, teamId, name, jerseyNumber)];
                case 4:
                    updatedPlayer = _d.sent();
                    logger_1.default.info("User ".concat(user.id, " updated player ").concat(updatedPlayer.name, " (").concat(updatedPlayer.id, ") in team ").concat(teamId, "."));
                    res.status(200).json(updatedPlayer);
                    return [3 /*break*/, 6];
                case 5:
                    error_4 = _d.sent();
                    logger_1.default.error("Error updating player:", error_4);
                    res.status(400).send(error_4.message);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
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
    router.delete("/:playerId", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, teamId, playerId, providerUid, user, team, error_5;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = req.params, teamId = _a.teamId, playerId = _a.playerId;
                    if (!teamId) {
                        return [2 /*return*/, res.status(400).send("Bad Request: teamId is required.")];
                    }
                    if (!playerId) {
                        return [2 /*return*/, res.status(400).send("Bad Request: playerId is required.")];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 5, , 6]);
                    providerUid = (_b = req.user) === null || _b === void 0 ? void 0 : _b.uid;
                    if (!providerUid) {
                        return [2 /*return*/, res.status(401).send("Unauthorized: User ID not found.")];
                    }
                    return [4 /*yield*/, userRepository.findOneBy({ providerUid: providerUid })];
                case 2:
                    user = _c.sent();
                    if (!user) {
                        return [2 /*return*/, res.status(404).send("User not found in database.")];
                    }
                    return [4 /*yield*/, teamService.getTeamByIdAndUser(teamId, user.id)];
                case 3:
                    team = _c.sent();
                    if (!team) {
                        return [2 /*return*/, res.status(404).send("Team not found or you do not have permission to delete players from it.")];
                    }
                    logger_1.default.info("User ".concat(user.id, " deleting player ").concat(playerId, " from team ").concat(teamId, "."));
                    return [4 /*yield*/, playerService.deletePlayer(playerId, teamId)];
                case 4:
                    _c.sent();
                    logger_1.default.info("User ".concat(user.id, " deleted player ").concat(playerId, " from team ").concat(teamId, "."));
                    res.status(204).send();
                    return [3 /*break*/, 6];
                case 5:
                    error_5 = _c.sent();
                    logger_1.default.error("Error deleting player:", error_5);
                    res.status(400).send(error_5.message);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    return router;
};
exports.playerRoutes = playerRoutes;
//# sourceMappingURL=playerRoutes.js.map