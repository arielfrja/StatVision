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
exports.teamRoutes = void 0;
var express_1 = require("express");
var User_1 = require("../User");
var TeamRepository_1 = require("../repository/TeamRepository");
var TeamService_1 = require("../service/TeamService");
var Team_1 = require("../Team");
var logger_1 = __importDefault(require("../config/logger"));
var router = (0, express_1.Router)();
var teamRoutes = function (AppDataSource) {
    var userRepository = AppDataSource.getRepository(User_1.User);
    var teamRepository = new TeamRepository_1.TeamRepository(AppDataSource.getRepository(Team_1.Team));
    var teamService = new TeamService_1.TeamService(teamRepository);
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
    router.get("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var providerUid, user, teams, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    providerUid = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
                    if (!providerUid) {
                        return [2 /*return*/, res.status(401).send("Unauthorized: User ID not found.")];
                    }
                    return [4 /*yield*/, userRepository.findOneBy({ providerUid: providerUid })];
                case 1:
                    user = _b.sent();
                    if (!user) {
                        return [2 /*return*/, res.status(404).send("User not found in database.")];
                    }
                    logger_1.default.info("User ".concat(user.id, " fetching teams."));
                    return [4 /*yield*/, teamService.getTeamsByUser(user.id)];
                case 2:
                    teams = _b.sent();
                    logger_1.default.info("User ".concat(user.id, " fetched ").concat(teams.length, " teams."));
                    res.status(200).json(teams);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    logger_1.default.error("Error fetching teams:", error_1);
                    res.status(500).send("Internal server error fetching teams.");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
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
    router.post("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var name, providerUid, user, newTeam, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    logger_1.default.info("POST /teams: req.user", req.user);
                    name = req.body.name;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    providerUid = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
                    logger_1.default.info("POST /teams: providerUid", providerUid);
                    if (!providerUid) {
                        return [2 /*return*/, res.status(401).send("Unauthorized: User ID not found.")];
                    }
                    return [4 /*yield*/, userRepository.findOneBy({ providerUid: providerUid })];
                case 2:
                    user = _b.sent();
                    logger_1.default.info("POST /teams: user from DB", user);
                    if (!user) {
                        return [2 /*return*/, res.status(404).send("User not found in database.")];
                    }
                    logger_1.default.info("User ".concat(user.id, " creating team with name: ").concat(name));
                    return [4 /*yield*/, teamService.createTeam(name, user)];
                case 3:
                    newTeam = _b.sent();
                    logger_1.default.info("User ".concat(user.id, " created team: ").concat(newTeam.name, " (").concat(newTeam.id, ")"));
                    res.status(201).json(newTeam);
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _b.sent();
                    logger_1.default.error("Error creating team:", error_2);
                    res.status(400).send(error_2.message);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
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
    router.get("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var id, providerUid, user, team, error_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    id = req.params.id;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
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
                    logger_1.default.info("User ".concat(user.id, " fetching team ").concat(id, "."));
                    return [4 /*yield*/, teamService.getTeamByIdAndUser(id, user.id)];
                case 3:
                    team = _b.sent();
                    if (!team) {
                        return [2 /*return*/, res.status(404).send("Team not found or you do not have permission to access it.")];
                    }
                    logger_1.default.info("User ".concat(user.id, " fetched team: ").concat(team.name, " (").concat(team.id, ")."));
                    res.status(200).json(team);
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _b.sent();
                    logger_1.default.error("Error fetching team:", error_3);
                    res.status(500).send("Internal server error fetching team.");
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
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
    router.put("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var id, name, providerUid, user, updatedTeam, error_4;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    id = req.params.id;
                    name = req.body.name;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
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
                    logger_1.default.info("User ".concat(user.id, " updating team ").concat(id, " to name: ").concat(name));
                    return [4 /*yield*/, teamService.updateTeam(id, user.id, name)];
                case 3:
                    updatedTeam = _b.sent();
                    logger_1.default.info("User ".concat(user.id, " updated team: ").concat(updatedTeam.name, " (").concat(updatedTeam.id, ")"));
                    res.status(200).json(updatedTeam);
                    return [3 /*break*/, 5];
                case 4:
                    error_4 = _b.sent();
                    logger_1.default.error("Error updating team:", error_4);
                    res.status(400).send(error_4.message);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
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
    router.delete("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var id, providerUid, user, error_5;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    id = req.params.id;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
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
                    logger_1.default.info("User ".concat(user.id, " deleting team ").concat(id));
                    return [4 /*yield*/, teamService.deleteTeam(id, user.id)];
                case 3:
                    _b.sent();
                    logger_1.default.info("User ".concat(user.id, " deleted team ").concat(id, "."));
                    res.status(204).send(); // No content for successful deletion
                    return [3 /*break*/, 5];
                case 4:
                    error_5 = _b.sent();
                    logger_1.default.error("Error deleting team:", error_5);
                    res.status(400).send(error_5.message);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    return router;
};
exports.teamRoutes = teamRoutes;
//# sourceMappingURL=teamRoutes.js.map