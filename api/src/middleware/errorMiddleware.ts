import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { AppError } from '@statvision/common';
import { v4 as uuidv4 } from 'uuid';

const errorMiddleware = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const errorId = uuidv4();
  const meta = {
    errorId,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: (req as any).user?.id
  };

  if (err instanceof AppError) {
    logger.error(`[AppError][${errorId}] ${err.statusCode} - ${err.message}`, { ...meta, statusCode: err.statusCode });
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      errorId
    });
  }

  // Handle TypeORM errors
  if (err.name === 'QueryFailedError') {
    logger.error(`[DatabaseError][${errorId}] ${err.message}`, { ...meta, query: err.query, parameters: err.parameters, stack: err.stack });
    return res.status(400).json({
      status: 'error',
      message: 'Database operation failed.',
      errorId
    });
  }

  // Log unexpected errors with FULL stack trace
  logger.error(`[UnexpectedError][${errorId}] ${err.message}`, { ...meta, stack: err.stack });

  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error.' 
      : `Error: ${err.message}`,
    errorId
  });
};

export default errorMiddleware;
