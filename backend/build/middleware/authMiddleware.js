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
exports.authMiddleware = void 0;
var User_1 = require("../User");
var logger_1 = __importDefault(require("../config/logger"));
var authMiddleware = function (AppDataSource, authProvider) {
    var userRepository = AppDataSource.getRepository(User_1.User);
    return function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
        var nextWithUserSync;
        return __generator(this, function (_a) {
            // Allow /api-docs to bypass authentication
            if (req.path.startsWith("/api-docs")) {
                return [2 /*return*/, next()];
            }
            nextWithUserSync = function () { return __awaiter(void 0, void 0, void 0, function () {
                var providerUid, email, user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!req.user) return [3 /*break*/, 3];
                            providerUid = req.user.uid;
                            email = req.user.email;
                            if (!(providerUid && email)) return [3 /*break*/, 3];
                            return [4 /*yield*/, userRepository.findOneBy({ providerUid: providerUid })];
                        case 1:
                            user = _a.sent();
                            if (!!user) return [3 /*break*/, 3];
                            user = userRepository.create({ providerUid: providerUid, email: email });
                            return [4 /*yield*/, userRepository.save(user)];
                        case 2:
                            _a.sent();
                            logger_1.default.info("New user created in DB: ".concat(email));
                            _a.label = 3;
                        case 3:
                            next();
                            return [2 /*return*/];
                    }
                });
            }); };
            authProvider.verifyToken(req, res, nextWithUserSync);
            return [2 /*return*/];
        });
    }); };
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=authMiddleware.js.map