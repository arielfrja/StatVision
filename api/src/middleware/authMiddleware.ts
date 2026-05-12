import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { User } from '@statvision/common';
import logger from '../config/logger';
import { IAuthProvider } from '../auth/authProvider';

// Extend the Request type to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: { 
        id?: string; // Internal DB UUID (attached by middleware)
        uid: string; // providerUid (Auth0/Firebase)
        email: string | null; 
      };
    }
  }
}

export const authMiddleware = (AppDataSource: DataSource, authProvider: IAuthProvider) => {
  const userRepository = AppDataSource.getRepository(User);

  return async (req: Request, res: Response, next: NextFunction) => {
    // Allow /api-docs to bypass authentication
    if (req.path.startsWith("/api-docs")) {
        return next();
    }

    const nextWithUserSync = async () => {
        // After successful token verification by authProvider, req.user should be populated
        if (req.user) {
          const providerUid = req.user.uid;
          const email = req.user.email;

          logger.debug(`AuthMiddleware: User from req.user - UID: ${providerUid}, Email: ${email}`);

          if (providerUid) { 
            let user = await userRepository.findOneBy({ providerUid });
            
            if (!user) {
              logger.info(`AuthMiddleware: Creating new user in DB for UID: ${providerUid}, Email: ${email}`);
              try {
                user = userRepository.create({ providerUid, email });
                await userRepository.save(user);
                logger.info(`AuthMiddleware: New user created in DB: ${email || providerUid}`);
              } catch (dbError) {
                logger.error(`AuthMiddleware: Error saving new user to DB for UID ${providerUid}:`, dbError);
                return res.status(500).json({ message: "Error synchronizing user profile." });
              }
            }

            // ATTACH INTERNAL ID
            req.user.id = user.id;
            logger.debug(`AuthMiddleware: Internal User ID attached: ${user.id}`);
          } else {
            logger.warn("AuthMiddleware: req.user.uid is missing.");
          }
        }
        next();
    };

    authProvider.verifyToken(req, res, nextWithUserSync);
  };
};
