import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { AppError } from '@statvision/common';

const errorMiddleware = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const meta = {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: (req as any).user?.id
  };

  if (err instanceof AppError) {
    logger.error(`[AppError] ${err.statusCode} - ${err.message}`, { ...meta, statusCode: err.statusCode });
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Handle TypeORM errors
  if (err.name === 'QueryFailedError') {
    logger.error(`[DatabaseError] ${err.message}`, { ...meta, query: err.query, parameters: err.parameters, stack: err.stack });
    return res.status(400).json({
      status: 'error',
      message: 'Database operation failed.',
    });
  }

  // Log unexpected errors with FULL stack trace
  logger.error(`[UnexpectedError] ${err.message}`, { ...meta, stack: err.stack });

  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error.' 
      : `Error: ${err.message}`,
  });
};

export default errorMiddleware;
