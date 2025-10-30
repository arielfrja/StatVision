"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthProvider = void 0;
var auth0Provider_1 = require("./auth0Provider");
var authProviderInstance;
var getAuthProvider = function (jwksUri, audience, issuer) {
    if (!authProviderInstance) {
        authProviderInstance = new auth0Provider_1.Auth0Provider(jwksUri, audience, issuer);
    }
    return authProviderInstance;
};
exports.getAuthProvider = getAuthProvider;
//# sourceMappingURL=authProviderFactory.js.map