import { Auth0Provider } from "./auth0Provider";
import { MockAuthProvider } from "./mockAuthProvider";
import { IAuthProvider } from "./authProvider";
import logger from "../config/logger";
import { getAuth0Config } from '../config/auth0Config';

let authProviderInstance: IAuthProvider;

export const getAuthProvider = (jwksUri: string, audience: string, issuer: string): IAuthProvider => {
    if (!authProviderInstance) {
        if (process.env.USE_MOCK_AUTH === 'true') {
            logger.info("Using MockAuthProvider for authentication.");
            authProviderInstance = new MockAuthProvider();
        } else {
            authProviderInstance = new Auth0Provider(jwksUri, audience, issuer);
        }
    }
    return authProviderInstance;
};
