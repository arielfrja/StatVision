import { Request, Response, NextFunction } from 'express';
import { IAuthProvider } from './authProvider';
import logger from '../config/logger';

export class MockAuthProvider implements IAuthProvider {
    async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        // Safety guard — never allow mock auth in production
        if (process.env.NODE_ENV === 'production') {
            logger.error("MockAuthProvider used in production! This is a security violation.");
            res.status(500).json({ message: 'Authentication configuration error' });
            return;
        }

        logger.info("MockAuthProvider: Bypassing authentication for testing.");
        
        // Populate req.user with a static testing user
        req.user = {
            uid: "test-user-123",
            email: "test@statvision.ai"
        };
        
        next();
    }
}
