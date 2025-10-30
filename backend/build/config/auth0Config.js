"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuth0Config = getAuth0Config;
var logger_1 = __importDefault(require("./logger"));
function getAuth0Config() {
    logger_1.default.debug("Auth0Config: Raw process.env.AUTH0_JWKS_URI:", process.env.AUTH0_JWKS_URI);
    logger_1.default.debug("Auth0Config: Raw process.env.AUTH0_AUDIENCE:", process.env.AUTH0_AUDIENCE);
    logger_1.default.debug("Auth0Config: Raw process.env.AUTH0_ISSUER:", process.env.AUTH0_ISSUER);
    var AUTH0_JWKS_URI = process.env.AUTH0_JWKS_URI || "";
    var AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || "";
    var AUTH0_ISSUER = process.env.AUTH0_ISSUER || "";
    if (!AUTH0_JWKS_URI || !AUTH0_AUDIENCE || !AUTH0_ISSUER) {
        logger_1.default.error("Missing Auth0 environment variables. Please check your .env file.");
        process.exit(1); // Exit the application if critical env vars are missing
    }
    logger_1.default.debug("Auth0Config: Loaded JWKS_URI:", AUTH0_JWKS_URI);
    logger_1.default.debug("Auth0Config: Loaded AUDIENCE:", AUTH0_AUDIENCE);
    logger_1.default.debug("Auth0Config: Loaded ISSUER:", AUTH0_ISSUER);
    return {
        AUTH0_JWKS_URI: AUTH0_JWKS_URI,
        AUTH0_AUDIENCE: AUTH0_AUDIENCE,
        AUTH0_ISSUER: AUTH0_ISSUER,
    };
}
//# sourceMappingURL=auth0Config.js.map