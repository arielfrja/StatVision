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
exports.PlayerService = void 0;
var logger_1 = __importDefault(require("../config/logger"));
var PlayerService = /** @class */ (function () {
    function PlayerService(playerRepository) {
        this.playerRepository = playerRepository;
    }
    PlayerService.prototype.createPlayer = function (name, jerseyNumber, team) {
        return __awaiter(this, void 0, void 0, function () {
            var existingPlayer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.default.info("PlayerService: Creating player ".concat(name, " (#").concat(jerseyNumber, ") for team ").concat(team.id));
                        if (!name || name.trim() === "") {
                            throw new Error("Player name cannot be empty.");
                        }
                        if (jerseyNumber <= 0) {
                            throw new Error("Jersey number must be positive.");
                        }
                        return [4 /*yield*/, this.playerRepository.findByTeamAndJerseyNumber(team.id, jerseyNumber)];
                    case 1:
                        existingPlayer = _a.sent();
                        if (existingPlayer) {
                            throw new Error("Player with jersey number ".concat(jerseyNumber, " already exists in team ").concat(team.name, "."));
                        }
                        return [2 /*return*/, this.playerRepository.createPlayer(name, jerseyNumber, team)];
                }
            });
        });
    };
    PlayerService.prototype.getPlayersByTeam = function (teamId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                logger_1.default.info("PlayerService: Getting players for team: ".concat(teamId));
                return [2 /*return*/, this.playerRepository.findPlayersByTeam(teamId)];
            });
        });
    };
    PlayerService.prototype.getPlayerByIdAndTeam = function (playerId, teamId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                logger_1.default.info("PlayerService: Getting player ".concat(playerId, " for team: ").concat(teamId));
                return [2 /*return*/, this.playerRepository.findPlayerByIdAndTeam(playerId, teamId)];
            });
        });
    };
    PlayerService.prototype.updatePlayer = function (playerId, teamId, newName, newJerseyNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var player, existingPlayerWithNewJersey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.default.info("PlayerService: Updating player ".concat(playerId, " in team ").concat(teamId, " to name: ").concat(newName, ", jersey: ").concat(newJerseyNumber));
                        return [4 /*yield*/, this.playerRepository.findPlayerByIdAndTeam(playerId, teamId)];
                    case 1:
                        player = _a.sent();
                        if (!player) {
                            throw new Error("Player not found or you do not have permission to update it.");
                        }
                        if (!newName || newName.trim() === "") {
                            throw new Error("Player name cannot be empty.");
                        }
                        if (newJerseyNumber <= 0) {
                            throw new Error("Jersey number must be positive.");
                        }
                        if (!(newJerseyNumber !== player.jerseyNumber)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.playerRepository.findByTeamAndJerseyNumber(teamId, newJerseyNumber)];
                    case 2:
                        existingPlayerWithNewJersey = _a.sent();
                        if (existingPlayerWithNewJersey) {
                            throw new Error("Player with jersey number ".concat(newJerseyNumber, " already exists in this team."));
                        }
                        _a.label = 3;
                    case 3: return [2 /*return*/, this.playerRepository.updatePlayer(player, newName, newJerseyNumber)];
                }
            });
        });
    };
    PlayerService.prototype.deletePlayer = function (playerId, teamId) {
        return __awaiter(this, void 0, void 0, function () {
            var player;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.default.info("PlayerService: Deleting player ".concat(playerId, " from team: ").concat(teamId));
                        return [4 /*yield*/, this.playerRepository.findPlayerByIdAndTeam(playerId, teamId)];
                    case 1:
                        player = _a.sent();
                        if (!player) {
                            throw new Error("Player not found or you do not have permission to delete it.");
                        }
                        return [4 /*yield*/, this.playerRepository.deletePlayer(playerId, teamId)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return PlayerService;
}());
exports.PlayerService = PlayerService;
//# sourceMappingURL=PlayerService.js.map