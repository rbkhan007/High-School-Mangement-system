import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../app';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        const userRes = await db.query('SELECT * FROM "User" WHERE id = $1', [decoded.userId]);
        const user = userRes.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        (req as any).user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!roles.includes(user.role)) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        next();
    };
};
