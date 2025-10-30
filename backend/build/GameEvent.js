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
exports.GameEvent = void 0;
var typeorm_1 = require("typeorm");
var Game_1 = require("./Game");
var Team_1 = require("./Team");
var Player_1 = require("./Player");
var GameEvent = /** @class */ (function () {
    function GameEvent() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
        __metadata("design:type", String)
    ], GameEvent.prototype, "id", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: "game_id" }),
        __metadata("design:type", String)
    ], GameEvent.prototype, "gameId", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: "assigned_team_id", nullable: true }),
        __metadata("design:type", String)
    ], GameEvent.prototype, "assignedTeamId", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: "assigned_player_id", nullable: true }),
        __metadata("design:type", String)
    ], GameEvent.prototype, "assignedPlayerId", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: "identified_team_color", nullable: true }),
        __metadata("design:type", String)
    ], GameEvent.prototype, "identifiedTeamColor", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: "identified_jersey_number", nullable: true }),
        __metadata("design:type", Number)
    ], GameEvent.prototype, "identifiedJerseyNumber", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: "event_type" }),
        __metadata("design:type", String)
    ], GameEvent.prototype, "eventType", void 0);
    __decorate([
        (0, typeorm_1.Column)({ type: "jsonb", name: "event_details", nullable: true }),
        __metadata("design:type", Object)
    ], GameEvent.prototype, "eventDetails", void 0);
    __decorate([
        (0, typeorm_1.Column)({ type: "float", name: "absolute_timestamp" }),
        __metadata("design:type", Number)
    ], GameEvent.prototype, "absoluteTimestamp", void 0);
    __decorate([
        (0, typeorm_1.Column)({ type: "float", name: "video_clip_start_time" }),
        __metadata("design:type", Number)
    ], GameEvent.prototype, "videoClipStartTime", void 0);
    __decorate([
        (0, typeorm_1.Column)({ type: "float", name: "video_clip_end_time" }),
        __metadata("design:type", Number)
    ], GameEvent.prototype, "videoClipEndTime", void 0);
    __decorate([
        (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
        __metadata("design:type", Date)
    ], GameEvent.prototype, "createdAt", void 0);
    __decorate([
        (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
        __metadata("design:type", Date)
    ], GameEvent.prototype, "updatedAt", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return Game_1.Game; }, function (game) { return game.gameEvents; }),
        (0, typeorm_1.JoinColumn)({ name: "game_id" }),
        __metadata("design:type", Game_1.Game)
    ], GameEvent.prototype, "game", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return Team_1.Team; }, function (team) { return team.gameEvents; }),
        (0, typeorm_1.JoinColumn)({ name: "assigned_team_id" }),
        __metadata("design:type", Team_1.Team)
    ], GameEvent.prototype, "assignedTeam", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return Player_1.Player; }, function (player) { return player.gameEvents; }),
        (0, typeorm_1.JoinColumn)({ name: "assigned_player_id" }),
        __metadata("design:type", Player_1.Player)
    ], GameEvent.prototype, "assignedPlayer", void 0);
    GameEvent = __decorate([
        (0, typeorm_1.Entity)("game_events")
    ], GameEvent);
    return GameEvent;
}());
exports.GameEvent = GameEvent;
//# sourceMappingURL=GameEvent.js.map