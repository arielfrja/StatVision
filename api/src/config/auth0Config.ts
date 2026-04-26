import logger from './logger';

export function getAuth0Config() {

    const AUTH0_JWKS_URI = process.env.AUTH0_JWKS_URI || "";
    const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || "";
    const AUTH0_ISSUER = process.env.AUTH0_ISSUER || "";

    if (!AUTH0_JWKS_URI || !AUTH0_AUDIENCE || !AUTH0_ISSUER) {
        logger.error("Missing Auth0 environment variables. Please check your .env file.");
        process.exit(1); // Exit the application if critical env vars are missing
    }

    return {
        AUTH0_JWKS_URI,
        AUTH0_AUDIENCE,
        AUTH0_ISSUER,
    };
}
