import { Request, Response, NextFunction } from 'express';
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Handle Database Errors (PostgreSQL)
    if (err.code === '23505') { // Unique violation
        err.statusCode = 400;
        err.message = 'Duplicate field value entered';
    }
    if (err.code === '23503') { // Foreign key violation
        err.statusCode = 400;
        err.message = 'Related record not found';
    }

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Production: Don't leak detail
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        } else {
            console.error('ERROR 💥', err);
            res.status(500).json({
                status: 'error',
                message: 'Something went very wrong!'
            });
        }
    }
};
