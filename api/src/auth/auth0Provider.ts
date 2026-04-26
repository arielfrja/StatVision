import logger from "../config/logger";
import { Request, Response, NextFunction } from "express";
import { expressjwt as jwt } from "express-jwt";
import { JwksClient, expressJwtSecret } from "jwks-rsa";
// import jwt_decode from "jsonwebtoken";
import { getAuth0Config } from '../config/auth0Config';

import { IAuthProvider } from "./authProvider";

declare global {
    namespace Express {
        interface Request {
            user?: { uid: string; email: string | null; }; // Generic user info
            auth?: {
                sub: string;
                email?: string | null;
                [key: string]: any;
            };
        }
    }
}

export class Auth0Provider implements IAuthProvider {
    private jwtCheck;

    constructor(jwksUri: string, audience: string, issuer: string) {
        this.jwtCheck = jwt({
            secret: expressJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: jwksUri,
            }),
            audience: audience,
            issuer: issuer,
            algorithms: ["RS256"],
        });
    }

    async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
            logger.debug("Auth0Provider: Starting JWT verification process.");
            this.jwtCheck(req, res, (err?: any) => {            if (err) {
                logger.error("Auth0Provider: JWT Check Error:", {
                    name: err.name,
                    message: err.message,
                    code: err.code,
                    status: err.status,
                    inner: err.inner, // inner error if available
                    stack: err.stack // stack trace for debugging
                });
                if (err.inner) {
                    logger.error("Auth0Provider: Inner Error Details:", err.inner);
                }
                res.status(err.status || 401).json({ message: err.message || "Unauthorized" });
                return; // Stop processing on error
            }
            logger.debug("Auth0Provider: JWT Check successful."); // New log
            if (req.auth) {
                const uid = req.auth.sub as string;
                const email = req.auth.email as string || null;
                logger.debug(`Auth0Provider: Extracted UID: ${uid}, Email: ${email}`); // Log extracted values
                req.user = { uid, email };
                logger.debug("Auth0Provider: req.user populated:", req.user);
            }
            next(); // Call next() to continue the middleware chain
        });
    }
}