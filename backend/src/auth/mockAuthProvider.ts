import { Request, Response, NextFunction } from 'express';
import { IAuthProvider } from './authProvider';
import logger from '../config/logger';

export class MockAuthProvider implements IAuthProvider {
    async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        logger.info("MockAuthProvider: Bypassing authentication for testing.");
        
        // Populate req.user with a static testing user
        req.user = {
            uid: "test-user-123",
            email: "test@statvision.ai"
        };
        
        next();
    }
}
