"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = exports.GameStatus = void 0;
var typeorm_1 = require("typeorm");
var User_1 = require("./User");
var Team_1 = require("./Team");
var GameEvent_1 = require("./GameEvent");
var GameStatus;
(function (GameStatus) {
    GameStatus["UPLOADED"] = "UPLOADED";
    GameStatus["PROCESSING"] = "PROCESSING";
    GameStatus["PENDING_ASSIGNMENT"] = "PENDING_ASSIGNMENT";
    GameStatus["COMPLETE"] = "COMPLETE";
    GameStatus["FAILED"] = "FAILED";
})(GameStatus || (exports.GameStatus = GameStatus = {}));
var Game = /** @class */ (function () {
    function Game() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
        __metadata("design:type", String)
    ], Game.prototype, "id", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: "user_id" }),
        __metadata("design:type", String)
    ], Game.prototype, "userId", void 0);
    __decorate([
        (0, typeorm_1.Column)({
            type: "enum",
            enum: GameStatus,
            default: GameStatus.UPLOADED,
        }),
        __metadata("design:type", String)
    ], Game.prototype, "status", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: "video_url" }),
        __metadata("design:type", String)
    ], Game.prototype, "videoUrl", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: "assigned_team_a_id", nullable: true }),
        __metadata("design:type", String)
    ], Game.prototype, "assignedTeamAId", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: "assigned_team_b_id", nullable: true }),
        __metadata("design:type", String)
    ], Game.prototype, "assignedTeamBId", void 0);
    __decorate([
        (0, typeorm_1.CreateDateColumn)({ name: "uploaded_at" }),
        __metadata("design:type", Date)
    ], Game.prototype, "uploadedAt", void 0);
    __decorate([
        (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
        __metadata("design:type", Date)
    ], Game.prototype, "createdAt", void 0);
    __decorate([
        (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
        __metadata("design:type", Date)
    ], Game.prototype, "updatedAt", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return User_1.User; }, function (user) { return user.games; }),
        (0, typeorm_1.JoinColumn)({ name: "user_id" }),
        __metadata("design:type", User_1.User)
    ], Game.prototype, "user", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return Team_1.Team; }, function (team) { return team.gamesA; }),
        (0, typeorm_1.JoinColumn)({ name: "assigned_team_a_id" }),
        __metadata("design:type", Team_1.Team)
    ], Game.prototype, "assignedTeamA", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return Team_1.Team; }, function (team) { return team.gamesB; }),
        (0, typeorm_1.JoinColumn)({ name: "assigned_team_b_id" }),
        __metadata("design:type", Team_1.Team)
    ], Game.prototype, "assignedTeamB", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return GameEvent_1.GameEvent; }, function (gameEvent) { return gameEvent.game; }),
        __metadata("design:type", Array)
    ], Game.prototype, "gameEvents", void 0);
    Game = __decorate([
        (0, typeorm_1.Entity)("games")
    ], Game);
    return Game;
}());
exports.Game = Game;
//# sourceMappingURL=Game.js.map