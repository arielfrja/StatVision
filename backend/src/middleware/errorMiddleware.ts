import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { AppError } from '../core/errors/AppError';

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    logger.error(`[AppError] ${err.statusCode} - ${err.message}`);
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Handle TypeORM errors or other specific libraries if needed
  if (err.name === 'QueryFailedError') {
    logger.error(`[DatabaseError] ${err.message}`);
    return res.status(400).json({
      status: 'error',
      message: 'Database operation failed.',
    });
  }

  logger.error(`[UnexpectedError] ${err.stack}`);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong on our end.',
  });
};

export default errorMiddleware;
