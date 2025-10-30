import { Auth0Provider } from "./auth0Provider";
import { IAuthProvider } from "./authProvider";
import logger from "../config/logger";
import { getAuth0Config } from '../config/auth0Config';

let authProviderInstance: IAuthProvider;

export const getAuthProvider = (jwksUri: string, audience: string, issuer: string): IAuthProvider => {
    if (!authProviderInstance) {
        authProviderInstance = new Auth0Provider(jwksUri, audience, issuer);
    }
    return authProviderInstance;
};
