"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = __importDefault(require("../config/logger"));
var loggingMiddleware = function (req, res, next) {
    logger_1.default.info("".concat(req.method, " ").concat(req.url));
    res.on('finish', function () {
        logger_1.default.info("".concat(res.statusCode, " ").concat(res.statusMessage, "; ").concat(res.get('Content-Length') || 0, "b sent"));
    });
    next();
};
exports.default = loggingMiddleware;
//# sourceMappingURL=loggingMiddleware.js.map