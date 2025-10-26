import { Request, Response, NextFunction } from 'express';

export interface IAuthProvider {
    verifyToken(req: Request, res: Response, next: NextFunction): Promise<void>;
}
