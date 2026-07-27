import { Auth0Provider } from "./auth0Provider";
import { MockAuthProvider } from "./mockAuthProvider";
import { IAuthProvider } from "./authProvider";
import logger from "../config/logger";

let authProviderInstance: IAuthProvider;

export const getAuthProvider = (jwksUri: string, audience: string, issuer: string): IAuthProvider => {
    if (!authProviderInstance) {
        // MockAuthProvider is only allowed in non-production environments
        if (process.env.NODE_ENV !== 'production' && process.env.USE_MOCK_AUTH === 'true') {
            logger.warn("Using MockAuthProvider for authentication (DEVELOPMENT ONLY).");
            authProviderInstance = new MockAuthProvider();
        } else {
            logger.info("Using Auth0Provider for authentication.");
            authProviderInstance = new Auth0Provider(jwksUri, audience, issuer);
        }
    }
    return authProviderInstance;
};
