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
exports.Player = void 0;
var typeorm_1 = require("typeorm");
var Team_1 = require("./Team");
var GameEvent_1 = require("./GameEvent");
var Player = /** @class */ (function () {
    function Player() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
        __metadata("design:type", String)
    ], Player.prototype, "id", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: "team_id" }),
        __metadata("design:type", String)
    ], Player.prototype, "teamId", void 0);
    __decorate([
        (0, typeorm_1.Column)(),
        __metadata("design:type", String)
    ], Player.prototype, "name", void 0);
    __decorate([
        (0, typeorm_1.Column)({ name: "jersey_number" }),
        __metadata("design:type", Number)
    ], Player.prototype, "jerseyNumber", void 0);
    __decorate([
        (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
        __metadata("design:type", Date)
    ], Player.prototype, "createdAt", void 0);
    __decorate([
        (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
        __metadata("design:type", Date)
    ], Player.prototype, "updatedAt", void 0);
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return Team_1.Team; }, function (team) { return team.players; }),
        __metadata("design:type", Team_1.Team)
    ], Player.prototype, "team", void 0);
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return GameEvent_1.GameEvent; }, function (gameEvent) { return gameEvent.assignedPlayer; }),
        __metadata("design:type", Array)
    ], Player.prototype, "gameEvents", void 0);
    Player = __decorate([
        (0, typeorm_1.Entity)("players"),
        (0, typeorm_1.Unique)(["teamId", "jerseyNumber"])
    ], Player);
    return Player;
}());
exports.Player = Player;
//# sourceMappingURL=Player.js.map