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
exports.Team = void 0;
var typeorm_1 = require("typeorm");
var User_1 = require("./User");
var Player_1 = require("./Player");
var Game_1 = require("./Game");
var GameEvent_1 = require("./GameEvent");
var Team = /** @class */ (function () {
    function Team() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
        __metadata("design:type", String)
    ], Team.prototype, "id", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: "user_id" }),
        __metadata("design:type", String)
    ], Team.prototype, "userId", void 0);
    __decorate([
        (0, typeorm_1.Column)(),
        __metadata("design:type", String)
    ], Team.prototype, "name", void 0);
    __decorate([
        (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
        __metadata("design:type", Date)
    ], Team.prototype, "createdAt", void 0);
    __decorate([
        (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
        __metadata("design:type", Date)
    ], Team.prototype, "updatedAt", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return User_1.User; }, function (user) { return user.teams; }),
        __metadata("design:type", User_1.User)
    ], Team.prototype, "user", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return Player_1.Player; }, function (player) { return player.team; }),
        __metadata("design:type", Array)
    ], Team.prototype, "players", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return Game_1.Game; }, function (game) { return game.assignedTeamA; }),
        __metadata("design:type", Array)
    ], Team.prototype, "gamesA", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return Game_1.Game; }, function (game) { return game.assignedTeamB; }),
        __metadata("design:type", Array)
    ], Team.prototype, "gamesB", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return GameEvent_1.GameEvent; }, function (gameEvent) { return gameEvent.assignedTeam; }),
        __metadata("design:type", Array)
    ], Team.prototype, "gameEvents", void 0);
    Team = __decorate([
        (0, typeorm_1.Entity)("teams")
    ], Team);
    return Team;
}());
exports.Team = Team;
//# sourceMappingURL=Team.js.map