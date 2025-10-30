"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = __importDefault(require("../config/logger"));
var errorMiddleware = function (err, req, res, next) {
    logger_1.default.error(err.stack);
    res.status(500).send('Something broke!');
};
exports.default = errorMiddleware;
//# sourceMappingURL=errorMiddleware.js.map