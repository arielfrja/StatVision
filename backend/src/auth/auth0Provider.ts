import { Request, Response, NextFunction } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import { IAuthProvider } from './authProvider';
import * as jwt from 'jsonwebtoken';

const AUTH0_DOMAIN = 'dev-3os8m0zyfxmx60nn.us.auth0.com';
const AUTH0_AUDIENCE = 'basetball-analyzer';

export class Auth0Provider implements IAuthProvider {
    private jwtCheck;

    constructor() {
        this.jwtCheck = auth({
            audience: AUTH0_AUDIENCE,
            issuerBaseURL: `https://${AUTH0_DOMAIN}/`,
            tokenSigningAlg: 'RS256'
        });
    }

    async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split("Bearer ")[1];
            try {
                const decodedHeader = jwt.decode(token, { complete: true })?.header;
                console.log("Auth0Provider: Incoming Token KID:", decodedHeader?.kid);
            } catch (decodeError) {
                console.error("Auth0Provider: Error decoding token header:", decodeError);
            }
        }

        this.jwtCheck(req, res, (err?: any) => {
            if (err) {
                console.error("Auth0Provider: Token verification failed. Full error object:", JSON.stringify(err, null, 2));
                return res.status(err.status || 401).json({ message: err.message || "Unauthorized" });
            }
            if (req.auth && req.auth.payload) {
                console.log("Auth0Provider: Decoded JWT Payload:", req.auth.payload);
                req.user = { uid: req.auth.payload.sub as string, email: req.auth.payload.email as string || '' };
            }
            next();
        });
    }
}
