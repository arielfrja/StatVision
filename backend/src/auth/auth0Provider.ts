import logger from "../config/logger";
import { Request, Response, NextFunction } from "express";
import { expressjwt as jwt } from "express-jwt";
import { JwksClient } from "jwks-rsa";
import { IAuthProvider } from "./authProvider";

export class Auth0Provider implements IAuthProvider {
    private jwtCheck;

    constructor() {
        this.jwtCheck = jwt({
            secret: JwksClient.expressJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: process.env.AUTH0_JWKS_URI || "",
            }),
            audience: process.env.AUTH0_AUDIENCE,
            issuer: process.env.AUTH0_ISSUER,
            algorithms: ["RS256"],
        });
    }

    async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split("Bearer ")[1];
            try {
                const decodedHeader = jwt.decode(token, { complete: true })?.header;
                logger.debug("Auth0Provider: Incoming Token KID:", decodedHeader?.kid);
            } catch (decodeError) {
                logger.error("Auth0Provider: Error decoding token header:", decodeError);
            }
        }

        this.jwtCheck(req, res, (err?: any) => {
            if (err) {
                logger.error("Auth0Provider: JWT Check Error:", err);
                return res.status(err.status || 401).json({ message: err.message || "Unauthorized" });
            }
            if (req.auth && req.auth.payload) {
                logger.debug("Auth0Provider: Decoded JWT Payload:", req.auth.payload);
                req.user = { uid: req.auth.payload.sub as string, email: req.auth.payload.email as string || '' };
            }
            next();
        });
    }
}
